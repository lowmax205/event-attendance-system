import { AuthDialog } from '@components/auth/auth-dialog';
import {
  Camera,
  CheckCircle2,
  MapPin,
  Signature,
  HelpCircle,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import Webcam from 'react-webcam';
import { Header } from '@/components/layout/Heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import MapboxMap from '@/components/ui/mapbox-map';
import { Modal } from '@/components/ui/modal';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/auth-context';
import { formatCountdownVerbose } from '@/lib/formatting';
import { apiService } from '@/services/api-service';
import { locationService } from '@/services/location-service';
import { webCameraService } from '@/services/web-camera-service';

// Utility: parse query (centralized in place to avoid extra re-renders)
const useQuery = () => new URLSearchParams(useLocation().search);

const DistanceBadge = ({ verified, distance, className = '' }) => (
  <Badge
    variant={verified ? 'default' : 'destructive'}
    className={`flex items-center justify-center gap-2 px-2 py-1 text-xs font-medium ${className}`}
  >
    {verified ? `✓ In range (${distance}m)` : `⚠ Out of range (${distance ?? '?'}m)`}
  </Badge>
);

const StepIndicator = ({ step, completed, active, title }) => (
  <div className='flex items-center space-x-3'>
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${completed ? 'bg-success text-success-foreground' : active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
    >
      {completed ? '✓' : step}
    </div>
    <span className={`font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
      {title}
    </span>
  </div>
);

const AttendanceVerifyPage = () => {
  // Device gating: allow only mobile/tablet to ensure GPS accuracy
  const isMobileOrTablet = useMemo(() => {
    try {
      // Prefer navigator.userAgentData if available
      const uaData = navigator.userAgentData;
      if (uaData && Array.isArray(uaData.brands)) {
        const mobileHint = uaData.mobile === true;
        if (mobileHint) return true;
      }

      const ua = (navigator.userAgent || '').toLowerCase();
      const mobileRegex = /iphone|ipad|ipod|android|blackberry|bb10|mini|windows\sce|palm|mobile|silk|kindle|opera\smini|opera\smobi/;
      const tabletRegex = /ipad|android(?!.*mobile)|tablet|xoom|sch-i800|playbook|silk|kindle/;
      const matchesUA = mobileRegex.test(ua) || tabletRegex.test(ua);

      // Fallback to feature detection
      const hasCoarsePointer = typeof window !== 'undefined' && window.matchMedia
        ? (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(any-pointer: coarse)').matches)
        : false;

      // Small viewport heuristic (avoid triggering on resized desktop by combining with coarse pointer)
      const viewportNarrow = typeof window !== 'undefined' ? Math.min(window.innerWidth, window.innerHeight) <= 1024 : false;

      return Boolean(matchesUA || (hasCoarsePointer && viewportNarrow));
    } catch {
      return false;
    }
  }, []);

  const query = useQuery();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const eventId = useMemo(() => Number(query.get('eventId') || 0), [query]);
  const expParam = useMemo(() => query.get('exp'), [query]);

  const [initError, setInitError] = useState('');
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [qrExpired, setQrExpired] = useState(false);
  const [windowAllowed, setWindowAllowed] = useState(true);
  const [windowInfo, setWindowInfo] = useState({});

  // Location state
  const [locLoading, setLocLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [override, setOverride] = useState(false);

  // Camera state
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [backPhoto, setBackPhoto] = useState(null);
  const webcamRef = useRef(null);
  const [activeCamera, setActiveCamera] = useState('user'); // 'user' | 'environment'
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [usingFileFallback, setUsingFileFallback] = useState(false);
  const [bothCapturing, setBothCapturing] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Signature
  const sigPadRef = useRef(null);
  const sigWrapperRef = useRef(null);
  const resizeObsRef = useRef(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState(''); // PNG (transparent, landscape)
  const [signatureSvgDataUrl, setSignatureSvgDataUrl] = useState(''); // SVG (for crisp preview)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signaturePadError, setSignaturePadError] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Existing attendance and upload progress state
  const [existingRecord, setExistingRecord] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadLabel, setUploadLabel] = useState('');

  // Live clock for window timers
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatCountdown = useCallback((ms) => formatCountdownVerbose(ms), []);

  // Alt+L override for admin/organizer
  useEffect(() => {
    const onKey = (e) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        if (user?.role === 'admin' || user?.role === 'organizer') {
          setOverride((v) => !v);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user]);

  // No redirect; we'll render a forced login modal when unauthenticated

  // After authentication, ensure student profile is complete; otherwise route to profile with redirect back
  useEffect(() => {
    const run = async () => {
      if (authLoading) return;
      if (!isAuthenticated) return;
      if (profileChecked) return;
      // Only enforce for students per requirement
      if (user?.role !== 'student') {
        setProfileChecked(true);
        return;
      }
      try {
        const p = await apiService.getProfile();
        if (!p?.is_complete_profile) {
          const current = `${location.pathname}${location.search || ''}`;
          const redirect = encodeURIComponent(current);
          navigate(`/profile?redirect=${redirect}`, { replace: true });
          return;
        }
      } catch {
        // If profile cannot be fetched, be safe and send to profile
        const current = `${location.pathname}${location.search || ''}`;
        const redirect = encodeURIComponent(current);
        navigate(`/profile?redirect=${redirect}`, { replace: true });
        return;
      } finally {
        setProfileChecked(true);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.role, location.pathname, location.search, navigate]);

  // QR expiry check
  useEffect(() => {
    if (!expParam) return;
    try {
      const expTs = new Date(expParam).getTime();
      const now = Date.now();

      // Debug logging to help troubleshoot expiration issues
      console.log('QR Expiry Check:', {
        expParam,
        expTs: new Date(expTs).toISOString(),
        now: new Date(now).toISOString(),
        isExpired: !Number.isNaN(expTs) && now > expTs,
        timeDiff: expTs - now,
        timeUntilExpiry:
          expTs > now ? `${Math.round((expTs - now) / 1000 / 60)} minutes` : 'expired',
      });

      if (!Number.isNaN(expTs) && now > expTs) {
        console.warn('QR Code has expired');
        setQrExpired(true);
      } else {
        console.log('QR Code is still valid');
      }
    } catch (error) {
      console.warn('QR expiry check failed:', error);
      // Don't set expired on parse errors - let the user proceed
    }
  }, [expParam]);

  // Fetch event
  useEffect(() => {
    const run = async () => {
      if (!eventId) {
        setInitError('Missing eventId in URL.');
        setLoading(false);
        return;
      }
      try {
        const data = await apiService.getEvent(eventId);
        setEvent(data);
        // compute access windows
        try {
          const startAtMs = data?.start_at ? new Date(data.start_at).getTime() : NaN;
          const endAtMs = data?.end_at ? new Date(data.end_at).getTime() : NaN;
          const bufferMin = Number.isFinite(data?.buffer_window_minutes)
            ? data.buffer_window_minutes
            : 30;
          if (!Number.isNaN(startAtMs) && !Number.isNaN(endAtMs)) {
            const startWindowStart = startAtMs;
            const startWindowEnd = startAtMs + bufferMin * 60 * 1000;
            const endWindowStart = endAtMs - bufferMin * 60 * 1000;
            const endWindowEnd = endAtMs;
            const now = Date.now();
            const inStart = now >= startWindowStart && now <= startWindowEnd;
            const inEnd = now >= endWindowStart && now <= endWindowEnd;
            const allowed = inStart || inEnd;
            setWindowAllowed(allowed);
            setWindowInfo({
              bufferMin,
              startWindowStart,
              startWindowEnd,
              endWindowStart,
              endWindowEnd,
              now,
            });
          }
        } catch {
          // ignore window computation errors
        }
      } catch (err) {
        console.error(err);
        setInitError('Failed to load event.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [eventId]);

  // Auto-refresh time window allowance as time passes
  useEffect(() => {
    if (!event) return;
    try {
      const startAtMs = event?.start_at ? new Date(event.start_at).getTime() : NaN;
      const endAtMs = event?.end_at ? new Date(event.end_at).getTime() : NaN;
      const bufferMin = Number.isFinite(event?.buffer_window_minutes)
        ? event.buffer_window_minutes
        : 30;
      if (!Number.isNaN(startAtMs) && !Number.isNaN(endAtMs)) {
        const startWindowStart = startAtMs;
        const startWindowEnd = startAtMs + bufferMin * 60 * 1000;
        const endWindowStart = endAtMs - bufferMin * 60 * 1000;
        const endWindowEnd = endAtMs;
        const now = nowTs;
        const inStart = now >= startWindowStart && now <= startWindowEnd;
        const inEnd = now >= endWindowStart && now <= endWindowEnd;
        const wasAllowed = windowAllowed;
        const nowAllowed = inStart || inEnd;

        setWindowAllowed(nowAllowed);
        setWindowInfo({
          bufferMin,
          startWindowStart,
          startWindowEnd,
          endWindowStart,
          endWindowEnd,
          now,
        });

        // Debug logging for window changes
        if (wasAllowed !== nowAllowed) {
          console.log('Verification Window Status Changed:', {
            wasAllowed,
            nowAllowed,
            inStart,
            inEnd,
            currentTime: new Date(now).toISOString(),
            checkInWindow: `${new Date(startWindowStart).toLocaleTimeString()} - ${new Date(startWindowEnd).toLocaleTimeString()}`,
            checkOutWindow: `${new Date(endWindowStart).toLocaleTimeString()} - ${new Date(endWindowEnd).toLocaleTimeString()}`,
            bufferMinutes: bufferMin,
          });
        }
      }
    } catch {
      // ignore
    }
  }, [event, nowTs, windowAllowed]);

  // Prefetch existing attendance record to determine intended action label
  useEffect(() => {
    const run = async () => {
      if (!eventId || !user?.id) return;
      try {
        const res = await apiService.get(
          `/attendances/attendances/?event=${eventId}&user=${user.id}`,
        );
        const rec = res?.results?.[0] || res?.[0] || null;
        setExistingRecord(rec);
      } catch {
        setExistingRecord(null);
      }
    };
    run();
  }, [eventId, user?.id]);

  // Request location and verify proximity
  const verifyLocation = useCallback(async () => {
    if (!event?.coordinates) return { verified: false };
    setLocLoading(true);
    try {
      await locationService.requestLocationPermission();
      const current = locationService.getCurrentLocation();
      const result = locationService.verifyLocationProximity(
        { lat: event.coordinates.lat, lng: event.coordinates.lng },
        current,
        100,
      );
      setVerification(result);
      return result;
    } catch (e) {
      setVerification({ verified: false, error: e.message });
      return { verified: false };
    } finally {
      setLocLoading(false);
    }
  }, [event]);

  // Camera init (permission will be requested only when Webcam mounts on user action)
  useEffect(() => {
    const init = async () => {
      const okInit = await webCameraService.initialize();
      if (!okInit) {
        setHasCamera(false);
        setUsingFileFallback(true);
        setCameraError('Camera not supported on this device/browser.');
        return;
      }
      setHasCamera(true);
      setUsingFileFallback(false);
      setCameraError('');
    };
    init();
  }, []);

  const onUserMedia = useCallback(() => {
    setCameraReady(true);
    setCameraError('');
  }, []);

  const onUserMediaError = useCallback((e) => {
    setCameraReady(false);
    setCameraError(e?.message || 'Failed to start camera');
    setHasCamera(false);
    setUsingFileFallback(true);
  }, []);

  // Start camera preview explicitly (front camera first)
  const startCamera = useCallback(async () => {
    setActiveCamera('user'); // default to front/selfie camera
    setCameraReady(false);
    setBothCapturing(false);
    setCameraEnabled(true);
  }, []);

  const captureCurrent = useCallback(async () => {
    try {
      const result = webCameraService.capturePhoto(webcamRef, {
        format: 'image/jpeg',
        quality: 0.9,
      });
      if (result?.success) {
        return { uri: result.uri, blob: result.blob };
      }
    } catch (e) {
      console.warn('Capture failed:', e?.message || e);
    }
    return null;
  }, []);

  // Helpers for timed capture
  const waitForCameraReady = useCallback(
    async (timeoutMs = 8000) => {
      const start = Date.now();
      while (!cameraReady && Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return cameraReady;
    },
    [cameraReady],
  );

  const runCountdown = useCallback((seconds = 5) => {
    return new Promise((resolve) => {
      let remaining = seconds;
      setCountdown(remaining);
      const id = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(id);
          setCountdown(0);
          resolve();
        }
      }, 1000);
    });
  }, []);

  // Capture both with 5s countdown each (Front first, then Back)
  const captureBoth = useCallback(async () => {
    if (usingFileFallback) return;
    setBothCapturing(true);
    try {
      // Ensure webcam is enabled and will mount (permission prompt will appear once)
      if (!cameraEnabled) {
        setCameraReady(false);
        setCameraEnabled(true);
        await new Promise((r) => setTimeout(r, 50));
      }

      // FRONT (selfie)
      setActiveCamera('user');
      setCameraReady(false);
      await new Promise((r) => setTimeout(r, 150));
      const readyFront = await waitForCameraReady();
      if (!readyFront) throw new Error('Camera not ready');
      await runCountdown(5);
      const front = await captureCurrent();
      if (front) setFrontPhoto(front);

      // BACK (environment)
      setActiveCamera('environment');
      setCameraReady(false);
      await new Promise((r) => setTimeout(r, 200));
      const readyBack = await waitForCameraReady();
      if (!readyBack) throw new Error('Camera not ready');
      await runCountdown(5);
      const back = await captureCurrent();
      if (back) setBackPhoto(back);

      if (front && back) {
        try {
          const video = webcamRef.current?.video;
          const stream = video && video.srcObject;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach((t) => t.stop());
          }
        } catch {
          // ignore stopping errors
        }
        setCameraEnabled(false);
      }
    } catch (err) {
      setCameraError(err?.message || 'Failed to capture photos');
    } finally {
      setBothCapturing(false);
    }
  }, [usingFileFallback, cameraEnabled, waitForCameraReady, runCountdown, captureCurrent]);

  const retakePhotos = useCallback(() => {
    // Clear current photos and re-enable camera
    setFrontPhoto(null);
    setBackPhoto(null);
    // Always start from front camera on retake per requirement
    setActiveCamera('user');
    setCameraReady(false);
    setCameraEnabled(true);
  }, []);

  const clearSignature = () => {
    // Clears saved signature (preview on page)
    setSignatureDataUrl('');
    setSignatureSvgDataUrl('');
  };

  // Helper: clear all user inputs (location result, photos, signature)
  const clearAllUserInputs = useCallback(() => {
    // Location verification
    setVerification(null);
    setLocLoading(false);
    // Photos
    setFrontPhoto(null);
    setBackPhoto(null);
    setBothCapturing(false);
    setCameraEnabled(false);
    setCountdown(0);
    // Signature
    setSignatureDataUrl('');
    setSignatureSvgDataUrl('');
    setSignaturePadError('');
  }, []);

  // Ensure signature canvas matches container size (fixes offset/accuracy issues)
  const resizeSignatureCanvas = useCallback(() => {
    try {
      const wrapper = sigWrapperRef.current;
      const pad = sigPadRef.current;
      if (!wrapper || !pad) return;
      const canvas = pad.getCanvas();
      if (!canvas) return;

      const rect = wrapper.getBoundingClientRect();
      // Guard against zero-size containers
      const width = Math.max(1, Math.floor(wrapper.clientWidth || rect.width));
      const height = Math.max(200, Math.floor(wrapper.clientHeight || rect.height));
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));

      // Reset canvas size and scale for crisp strokes
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset any prior scaling
      ctx.scale(dpr, dpr);
      // Do not fill background here to preserve transparency for trimming
      // If there was a previous drawing, resizing clears it, so we just leave it empty
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!signatureModalOpen) {
      // Cleanup any observers when modal closes
      if (resizeObsRef.current) {
        resizeObsRef.current.disconnect();
        resizeObsRef.current = null;
      }
      return;
    }
    // Delay to ensure modal and canvas are mounted and measured
    const t = setTimeout(() => {
      resizeSignatureCanvas();
      // Observe container for size changes (orientation, viewport)
      if ('ResizeObserver' in window && sigWrapperRef.current) {
        const ro = new ResizeObserver(() => resizeSignatureCanvas());
        ro.observe(sigWrapperRef.current);
        resizeObsRef.current = ro;
      } else {
        // Fallback: listen to window resize
        const onResize = () => resizeSignatureCanvas();
        window.addEventListener('resize', onResize);
        resizeObsRef.current = {
          disconnect: () => window.removeEventListener('resize', onResize),
        };
      }
    }, 50);
    return () => clearTimeout(t);
  }, [signatureModalOpen, resizeSignatureCanvas]);

  // Step completion tracking
  const stepStatus = useMemo(() => {
    const locationVerified = override || (verification?.verified && verification?.distance <= 100);
    const photosComplete = frontPhoto?.blob && backPhoto?.blob;
    const signatureComplete = !!signatureDataUrl;

    return {
      location: locationVerified,
      photos: photosComplete,
      signature: signatureComplete,
      canSubmit:
        isAuthenticated && eventId > 0 && locationVerified && photosComplete && signatureComplete,
    };
  }, [isAuthenticated, eventId, verification, override, frontPhoto, backPhoto, signatureDataUrl]);

  const canSubmit = stepStatus.canSubmit && (windowAllowed || override);

  // Decide intended action shown on the submit button
  const intendedAction = useMemo(() => {
    const bufferMin = Number.isFinite(event?.buffer_window_minutes)
      ? event.buffer_window_minutes
      : 30;
    const startAtMs = event?.start_at ? new Date(event.start_at).getTime() : NaN;
    const endAtMs = event?.end_at ? new Date(event.end_at).getTime() : NaN;
    const startWindowStart = !Number.isNaN(startAtMs) ? startAtMs : 0;
    const startWindowEnd = !Number.isNaN(startAtMs) ? startAtMs + bufferMin * 60 * 1000 : 0;
    const endWindowStart = !Number.isNaN(endAtMs) ? endAtMs - bufferMin * 60 * 1000 : 0;
    const endWindowEnd = !Number.isNaN(endAtMs) ? endAtMs : 0;
    const now = nowTs; // tie to live clock to react to window transitions
    const inStart = now >= startWindowStart && now <= startWindowEnd;
    const inEnd = now >= endWindowStart && now <= endWindowEnd;
    const hasCheckin = !!existingRecord?.checked_in_done || !!existingRecord?.checkin_time;
    const hasCheckout = !!existingRecord?.checked_out_done || !!existingRecord?.checkout_time;

    if (override) {
      return hasCheckin && !hasCheckout ? 'check-out' : 'check-in';
    }
    if (inEnd) {
      return hasCheckin && !hasCheckout ? 'check-out' : 'check-in';
    }
    if (inStart) return 'check-in';
    return 'check-in';
  }, [event, existingRecord, override, nowTs]);

  // When the intended action transitions (e.g., from check-in window to check-out window)
  // and the user is still on this page, clear previously entered inputs so they can
  // submit fresh data for the new phase (prevents mixing check-in artifacts with check-out).
  const prevIntendedActionRef = useRef(intendedAction);
  useEffect(() => {
    if (prevIntendedActionRef.current !== intendedAction) {
      // Only clear when switching between check-in and check-out, not on initial mount
      if (
        (prevIntendedActionRef.current === 'check-in' && intendedAction === 'check-out') ||
        (prevIntendedActionRef.current === 'check-out' && intendedAction === 'check-in')
      ) {
        clearAllUserInputs();
      }
      prevIntendedActionRef.current = intendedAction;
    }
  }, [intendedAction, clearAllUserInputs]);

  // Lock submit if the corresponding action is already completed or after success
  const submissionLocks = useMemo(() => {
    const hasCheckin = !!existingRecord?.checked_in_done || !!existingRecord?.checkin_time;
    const hasCheckout = !!existingRecord?.checked_out_done || !!existingRecord?.checkout_time;
    const actionDone =
      intendedAction === 'check-in'
        ? hasCheckin
        : intendedAction === 'check-out'
          ? hasCheckout
          : false;
    return { hasCheckin, hasCheckout, actionDone };
  }, [existingRecord, intendedAction]);
  const canSubmitFinal = canSubmit && !submissionLocks.actionDone && !submitSuccess;

  // Helpers to POST with upload progress using XHR
  const xhrPostForm = useCallback(async (endpoint, formData, onProgress) => {
    await apiService.ensureBaseURL();
    const url = `${apiService.baseURL}${endpoint}`;
    const token = localStorage.getItem('eas_auth_token');
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(xhr.responseText ? JSON.parse(xhr.responseText) : {});
            } catch {
              resolve({});
            }
          } else {
            let parsed = {};
            try {
              parsed = xhr.responseText ? JSON.parse(xhr.responseText) : {};
            } catch {
              /* noop */
            }
            const err = new Error(`HTTP error! status: ${xhr.status}`);
            err.response = { status: xhr.status, statusText: xhr.statusText, data: parsed };
            reject(err);
          }
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && typeof onProgress === 'function') {
          const pct = Math.max(0, Math.min(100, Math.round((e.loaded / e.total) * 100)));
          onProgress(pct);
        }
      };
      xhr.send(formData);
    });
  }, []);

  // JSON posting helper was removed after switching checkout to multipart form submissions

  const submitAttendance = async () => {
    setSubmitError('');
    setSubmitSuccess(false);
    setSubmitting(true);
    setUploadProgress(0);
    setUploadLabel('');
    try {

      // Try to find existing attendance record for this user/event
      const existing = await apiService.get(
        `/attendances/attendances/?event=${eventId}&user=${user?.id}`,
      );
      const existingRec = existing?.results?.[0] || existing?.[0] || null;
      let attendanceId = existingRec?.id;

      // If no existing record, create one (include user to satisfy backend serializer)
      if (!attendanceId) {
        const created = await apiService.post('/attendances/attendances/', {
          event: eventId,
          user: user?.id,
          method: 'qr',
        });
        attendanceId = created.id;
      }

      // Decide whether to Check-In or Check-Out based on window and existing status
      const bufferMin = Number.isFinite(event?.buffer_window_minutes)
        ? event.buffer_window_minutes
        : 30;
      const startAtMs = event?.start_at ? new Date(event.start_at).getTime() : NaN;
      const endAtMs = event?.end_at ? new Date(event.end_at).getTime() : NaN;
      const startWindowStart = !Number.isNaN(startAtMs) ? startAtMs : 0;
      const startWindowEnd = !Number.isNaN(startAtMs) ? startAtMs + bufferMin * 60 * 1000 : 0;
      const endWindowStart = !Number.isNaN(endAtMs) ? endAtMs - bufferMin * 60 * 1000 : 0;
      const endWindowEnd = !Number.isNaN(endAtMs) ? endAtMs : 0;
      const now = Date.now();
      const inStart = now >= startWindowStart && now <= startWindowEnd;
      const inEnd = now >= endWindowStart && now <= endWindowEnd;

      const hasCheckin = !!existingRec?.checkin_time;
      const hasCheckout = !!existingRec?.checkout_time;
      const existingStatus = existingRec?.status;

      let action = 'check-in';
      if (override) {
        action = hasCheckin && !hasCheckout ? 'check-out' : 'check-in';
      } else if (inEnd) {
        // Prefer checkout in end window if a prior check-in exists
        action = hasCheckin && !hasCheckout ? 'check-out' : 'check-in';
      } else if (inStart) {
        action = 'check-in';
      }

      console.log('Attendance submission decision:', {
        action,
        inStart,
        inEnd,
        existingStatus,
        hasCheckin,
        hasCheckout,
      });

      // Coordinates payload
      const coords = verification?.coordinates?.user;

      if (action === 'check-in') {
        // Prepare multipart form data for check-in endpoint (with photos)
        const form = new FormData();
        if (coords) {
          form.append('latitude', String(coords.lat));
          form.append('longitude', String(coords.lng));
        }
        // Attach captured photos directly
        const frontFile = new File([frontPhoto.blob], `front_${Date.now()}.jpg`, {
          type: frontPhoto.blob.type || 'image/jpeg',
        });
        const backFile = new File([backPhoto.blob], `back_${Date.now()}.jpg`, {
          type: backPhoto.blob.type || 'image/jpeg',
        });
        form.append('photo_front', frontFile);
        form.append('photo_back', backFile);
        // Attach signature PNG if present
        if (signatureDataUrl) {
          try {
            const signBlob = await (await fetch(signatureDataUrl)).blob();
            const signFile = new File([signBlob], `signature_${Date.now()}.png`, {
              type: 'image/png',
            });
            form.append('signature', signFile);
          } catch (e) {
            console.warn('Failed to attach signature:', e.message);
          }
        }
        setUploadLabel('Uploading photos…');
        const updated = await xhrPostForm(
          `/attendances/attendances/${attendanceId}/check-in/`,
          form,
          (pct) => setUploadProgress(pct),
        );
        setExistingRecord(updated || null);
      } else {
        // Check-out now accepts multipart with optional photos (front/back) and coordinates
        const form = new FormData();
        if (coords) {
          form.append('latitude', String(coords.lat));
          form.append('longitude', String(coords.lng));
        }
        if (frontPhoto?.blob) {
          const frontFile = new File([frontPhoto.blob], `front_${Date.now()}.jpg`, {
            type: frontPhoto.blob.type || 'image/jpeg',
          });
          form.append('photo_front', frontFile);
        }
        if (backPhoto?.blob) {
          const backFile = new File([backPhoto.blob], `back_${Date.now()}.jpg`, {
            type: backPhoto.blob.type || 'image/jpeg',
          });
          form.append('photo_back', backFile);
        }
        // Attach signature PNG if present
        if (signatureDataUrl) {
          try {
            const signBlob = await (await fetch(signatureDataUrl)).blob();
            const signFile = new File([signBlob], `signature_${Date.now()}.png`, {
              type: 'image/png',
            });
            form.append('signature', signFile);
          } catch (e) {
            console.warn('Failed to attach signature:', e.message);
          }
        }
        setUploadLabel('Uploading check-out evidence…');
        const updated = await xhrPostForm(
          `/attendances/attendances/${attendanceId}/check-out/`,
          form,
          (pct) => setUploadProgress(pct),
        );
        setExistingRecord(updated || null);
      }


      setSubmitSuccess(true);
      // Refresh existing record snapshot to reflect completed action, which will lock the button
      try {
        const refreshed = await apiService.get(
          `/attendances/attendances/?event=${eventId}&user=${user?.id}`,
        );
        const refreshedRec = refreshed?.results?.[0] || refreshed?.[0] || null;
        setExistingRecord(refreshedRec);
      } catch {
        /* ignore refresh errors */
      }
    } catch (e) {
      console.error(e);
      const detailed = e?.response?.data || e?.message;
      let msg = 'Failed to submit attendance';
      if (detailed) {
        if (typeof detailed === 'string') msg = detailed;
        else if (detailed.detail) msg = detailed.detail;
        else if (Array.isArray(detailed.non_field_errors))
          msg = detailed.non_field_errors.join(', ');
        else if (typeof detailed === 'object')
          msg = Object.entries(detailed)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : String(v)}`)
            .join(' | ');
      }
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
      setTimeout(() => {
        setUploadLabel('');
        setUploadProgress(0);
      }, 800);
    }
  };

  // Force authentication before proceeding with the flow
  // Block desktop/laptop for students and unauthenticated users (organizers/admins may access for assistance)
  if (!isMobileOrTablet && !authLoading && (!isAuthenticated || user?.role === 'student')) {
    return (
      <div className='from-primary/10 via-primary/5 to-background min-h-screen bg-gradient-to-br pt-16'>
        <Header />
        <div className='flex min-h-[50vh] items-center justify-center px-4'>
          <Card className='bg-card text-card-foreground max-w-md w-full'>
            <CardHeader>
              <CardTitle>Use a Mobile or Tablet</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <p className='text-muted-foreground'>
                Attendance verification requires accurate on-device GPS and camera access. Please
                open this page on your mobile phone or tablet to continue.
              </p>
              <ul className='list-disc list-inside text-muted-foreground'>
                <li>Use Chrome on Android or Safari on iOS</li>
                <li>Ensure location and camera permissions are allowed</li>
              </ul>
              {isAuthenticated && user?.role === 'student' ? null : (
                <p className='text-muted-foreground text-xs'>
                  Note: Organizers/Admins may use a desktop only to assist students.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!authLoading && !isAuthenticated) {
    return (
      <div className='from-primary/10 via-primary/5 to-background min-h-screen bg-gradient-to-br pt-16'>
        <Header />
        <AuthDialog
          open={true}
          onOpenChange={() => {}}
          forced={true}
          showDemoAccounts={false}
          onAuthSuccess={() => {
            // After login, the page will re-render and proceed
          }}
        />
      </div>
    );
  }

  if (authLoading || loading) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2' />
          <p className='text-muted-foreground mt-2 text-sm'>Preparing verification…</p>
        </div>
      </div>
    );
  }

  if (qrExpired) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <Card className='bg-card text-card-foreground max-w-md'>
          <CardHeader>
            <CardTitle>QR Code Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-muted-foreground space-y-2 text-sm'>
              <p>This QR code has expired and can no longer be used.</p>
              <p>
                If you are currently within an allowed verification window, please ask the organizer
                to seek help.
              </p>
              <p>
                If you attended earlier but couldn&apos;t scan in time, contact the organizer for
                manual verification following your event&apos;s front and back picture taking both
                before and after the event.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (initError) {
    return (
      <div className='flex min-h-[50vh] items-center justify-center'>
        <Card className='bg-card text-card-foreground max-w-md'>
          <CardHeader>
            <CardTitle>Attendance Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-destructive'>{initError}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='from-primary/10 via-primary/5 to-background min-h-screen bg-gradient-to-br pt-16'>
      <Header />
      {/* Header */}
      <div className='border-border bg-card text-card-foreground border-b shadow-sm'>
        <div className='container mx-auto px-4 py-4 sm:py-6'>
          <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
            <div className='space-y-1'>
              <h1 className='text-foreground text-2xl font-bold'>Attendance Verification</h1>
              <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
                <Calendar className='h-4 w-4' />
                <span className='font-medium'>{event?.title || 'Loading event...'}</span>
              </div>
              {event?.start_at && (
                <div className='text-muted-foreground flex items-center space-x-2 text-sm'>
                  <Clock className='h-4 w-4' />
                  <span>
                    {new Date(event.start_at).toLocaleDateString()} at{' '}
                    {new Date(event.start_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className='flex flex-wrap items-center gap-2'>
              {(user?.role === 'admin' || user?.role === 'organizer') && (
                <Badge
                  variant={override ? 'default' : 'secondary'}
                  title='Alt+L to toggle'
                  className='text-xs'
                >
                  Override {override ? 'ON' : 'OFF'}
                </Badge>
              )}
              <Button
                variant='outline'
                size='sm'
                onClick={() => setHelpOpen(true)}
                className='flex items-center gap-1'
              >
                <HelpCircle className='h-4 w-4' />
                <span className='hidden sm:inline'>Help</span>
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className='mt-6 hidden sm:block'>
            <div className='flex items-center justify-between space-x-8'>
              <StepIndicator
                step={1}
                completed={stepStatus.location}
                active={!stepStatus.location}
                title='Location'
              />
              <div className='bg-muted h-0.5 flex-1'>
                <div
                  className={`bg-primary h-full transition-all duration-300 ${stepStatus.location ? 'w-full' : 'w-0'}`}
                />
              </div>
              <StepIndicator
                step={2}
                completed={stepStatus.photos}
                active={stepStatus.location && !stepStatus.photos}
                title='Photos'
              />
              <div className='bg-muted h-0.5 flex-1'>
                <div
                  className={`bg-primary h-full transition-all duration-300 ${stepStatus.photos ? 'w-full' : 'w-0'}`}
                />
              </div>
              <StepIndicator
                step={3}
                completed={stepStatus.signature}
                active={stepStatus.photos && !stepStatus.signature}
                title='Signature'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='container mx-auto max-w-4xl space-y-6 px-4 py-6'>
        {/* Verification Windows (live timers) */}
        {event?.start_at && event?.end_at && (
          <Card className='bg-card text-card-foreground border-0 shadow-lg'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-3'>
                <div className='bg-primary/15 text-primary rounded-full p-2'>
                  <Clock className='h-5 w-5' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>Verification Windows</h3>
                  <p className='text-muted-foreground text-sm font-normal'>
                    Live status for Check-in and Check-out windows
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              {(() => {
                const bufferMin = Number.isFinite(event?.buffer_window_minutes)
                  ? event.buffer_window_minutes
                  : 30;
                const startAtMs = new Date(event.start_at).getTime();
                const endAtMs = new Date(event.end_at).getTime();
                const startWindowStart = startAtMs;
                const startWindowEnd = startAtMs + bufferMin * 60 * 1000;
                const endWindowStart = endAtMs - bufferMin * 60 * 1000;
                const endWindowEnd = endAtMs;

                const inStart = nowTs >= startWindowStart && nowTs <= startWindowEnd;
                const beforeStart = nowTs < startWindowStart;
                const startBadge = inStart
                  ? {
                      variant: 'default',
                      label: `Open • Closes in ${formatCountdown(startWindowEnd - nowTs)}`,
                    }
                  : beforeStart
                    ? {
                        variant: 'secondary',
                        label: `Opens in ${formatCountdown(startWindowStart - nowTs)}`,
                      }
                    : { variant: 'destructive', label: 'Closed' };

                const inEnd = nowTs >= endWindowStart && nowTs <= endWindowEnd;
                const beforeEnd = nowTs < endWindowStart;
                const endBadge = inEnd
                  ? {
                      variant: 'default',
                      label: `Open • Closes in ${formatCountdown(endWindowEnd - nowTs)}`,
                    }
                  : beforeEnd
                    ? {
                        variant: 'secondary',
                        label: `Opens in ${formatCountdown(endWindowStart - nowTs)}`,
                      }
                    : { variant: 'destructive', label: 'Closed' };

                return (
                  <>
                    <div className='border-border rounded-md border p-3'>
                      <div className='mb-1 flex items-center justify-between'>
                        <span className='text-sm font-medium'>Check-in Window</span>
                        <Badge variant={startBadge.variant}>{startBadge.label}</Badge>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        Window:{' '}
                        {new Date(startWindowStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' – '}
                        {new Date(startWindowEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className='border-border rounded-md border p-3'>
                      <div className='mb-1 flex items-center justify-between'>
                        <span className='text-sm font-medium'>Check-out Window</span>
                        <Badge variant={endBadge.variant}>{endBadge.label}</Badge>
                      </div>
                      <div className='text-muted-foreground text-xs'>
                        Window:{' '}
                        {new Date(endWindowStart).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' – '}
                        {new Date(endWindowEnd).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
        {/* Time Window Gate */}
        {!override && !windowAllowed && (
          <Card className='bg-card text-card-foreground border-0 shadow-lg'>
            <CardHeader className='pb-4'>
              <CardTitle className='flex items-center gap-3'>
                <div className='bg-warning/20 text-warning rounded-full p-2'>
                  <Clock className='h-5 w-5' />
                </div>
                <div>
                  <h3 className='text-lg font-semibold'>Verification not available right now</h3>
                  <p className='text-muted-foreground text-sm font-normal'>
                    This page is only accessible within the event's designated time windows.
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 text-sm'>
              <p>Allowed windows are:</p>
              <ul className='text-muted-foreground list-inside list-disc'>
                <li>
                  From event start until {windowInfo?.bufferMin ?? 30} minutes after start
                  {event?.start_at && (
                    <>
                      {' '}
                      (
                      {new Date(windowInfo.startWindowStart || event.start_at).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                      {' – '}
                      {new Date(windowInfo.startWindowEnd || event.start_at).toLocaleTimeString(
                        [],
                        { hour: '2-digit', minute: '2-digit' },
                      )}
                      )
                    </>
                  )}
                </li>
                <li>
                  From {windowInfo?.bufferMin ?? 30} minutes before end until event end
                  {event?.end_at && (
                    <>
                      {' '}
                      (
                      {new Date(windowInfo.endWindowStart || event.end_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' – '}
                      {new Date(windowInfo.endWindowEnd || event.end_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      )
                    </>
                  )}
                </li>
              </ul>
              <p className='text-muted-foreground'>
                Please return during one of the windows above to complete verification.
              </p>
            </CardContent>
          </Card>
        )}
        {/* Only show verification steps when within allowed window or override is enabled */}
        {(override || windowAllowed) && (
          <>
            {/* Step 1: Location Verification */}
            <Card className='bg-card text-card-foreground border-0 shadow-lg'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-3'>
                  <div
                    className={`rounded-full p-2 ${
                      stepStatus.location
                        ? 'bg-success/15 text-success'
                        : 'bg-primary/15 text-primary'
                    }`}
                  >
                    <MapPin className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>Location Verification</h3>
                    <p className='text-muted-foreground text-sm font-normal'>
                      Confirming you are at the event location
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {event?.coordinates ? (
                  <>
                    <div className='relative'>
                      <MapboxMap
                        latitude={event.coordinates.lat}
                        longitude={event.coordinates.lng}
                        zoom={16}
                        showMarker={true}
                        showRadius={true}
                        radiusInMeters={100}
                        interactive={false}
                        showUserMarker={!!verification?.coordinates?.user}
                        userLatitude={verification?.coordinates?.user?.lat}
                        userLongitude={verification?.coordinates?.user?.lng}
                        fitToMarkers={!!verification?.coordinates?.user}
                        locating={locLoading}
                        locatingMessage={locLoading ? 'Getting your location…' : undefined}
                        animateMarker={false}
                        animateUserMarker={locLoading || !!verification?.coordinates?.user}
                        className='border-border h-64 w-full overflow-hidden rounded-lg border-2 sm:h-80'
                      />
                    </div>

                    <div className='flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                      <div className='space-y-1'>
                        <p className='text-foreground text-sm font-medium'>Event Location</p>
                        <p className='text-muted-foreground font-mono text-xs'>
                          {event.coordinates.lat.toFixed(6)}, {event.coordinates.lng.toFixed(6)}
                        </p>
                      </div>

                      <div className='flex flex-wrap items-center gap-2 sm:justify-end'>
                        <Button
                          onClick={verifyLocation}
                          disabled={locLoading}
                          size='sm'
                          className='flex w-full items-center gap-2 sm:w-auto'
                        >
                          {locLoading ? (
                            <RefreshCw className='h-4 w-4 animate-spin' />
                          ) : (
                            <MapPin className='h-4 w-4' />
                          )}
                          {locLoading ? 'Verifying...' : 'Verify Location'}
                        </Button>

                        {verification && (
                          <DistanceBadge
                            className='flex w-full items-center justify-center sm:w-auto'
                            verified={override || verification.verified}
                            distance={verification.distance}
                          />
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='text-muted-foreground py-8 text-center'>
                    <MapPin className='mx-auto mb-3 h-12 w-12 opacity-50' />
                    <p className='text-sm'>This event has no coordinates set.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Photo Capture */}
            <Card className='bg-card text-card-foreground border-0 shadow-lg'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center justify-between gap-3'>
                  <div className='flex items-center gap-3'>
                    <div
                      className={`rounded-full p-2 ${
                        frontPhoto && backPhoto
                          ? 'bg-success/15 text-success'
                          : 'bg-primary/15 text-primary'
                      }`}
                    >
                      <Camera className='h-5 w-5' />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold'>Photos</h3>
                      <p className='text-muted-foreground text-sm font-normal'>
                        Capture front (selfie) and back (Stage or event) photos
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant={frontPhoto ? 'default' : 'secondary'}>
                      Front{frontPhoto ? ' ✓' : ''}
                    </Badge>
                    <Badge variant={backPhoto ? 'default' : 'secondary'}>
                      Back{backPhoto ? ' ✓' : ''}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {hasCamera && !usingFileFallback ? (
                  <div className='space-y-3'>
                    <div className='border-border relative overflow-hidden rounded-lg border-2 border-dashed'>
                      {cameraEnabled ? (
                        <>
                          <Webcam
                            key={activeCamera}
                            ref={webcamRef}
                            audio={false}
                            screenshotFormat='image/jpeg'
                            onUserMedia={onUserMedia}
                            onUserMediaError={onUserMediaError}
                            videoConstraints={webCameraService.getCameraConstraints({
                              facingMode: activeCamera,
                              width: 1280,
                              height: 720,
                            })}
                            className='h-56 w-full object-cover sm:h-64'
                          />
                          {bothCapturing && countdown > 0 && (
                            <div className='bg-background/70 absolute inset-0 flex items-center justify-center'>
                              <div className='text-foreground text-5xl font-bold'>{countdown}</div>
                            </div>
                          )}
                          {!cameraReady && (
                            <div className='bg-background/60 absolute inset-0 flex items-center justify-center'>
                              <span className='text-muted-foreground text-sm'>
                                Starting camera…
                              </span>
                            </div>
                          )}
                          {bothCapturing && (
                            <div className='bg-background/80 absolute right-2 bottom-2 rounded px-2 py-1 text-xs'>
                              Capturing {activeCamera === 'user' ? 'Front' : 'Back'}…
                            </div>
                          )}
                          {!bothCapturing && cameraReady && (
                            <div className='bg-background/80 absolute top-2 right-2 rounded px-2 py-1 text-xs'>
                              Camera active ({activeCamera === 'user' ? 'Front' : 'Back'})
                            </div>
                          )}
                        </>
                      ) : (
                        <div className='flex h-56 w-full flex-col items-center justify-center gap-2 sm:h-64'>
                          <Camera className='text-muted-foreground h-8 w-8' />
                          <span className='text-muted-foreground text-sm'>
                            Camera is idle. Tap Start to enable preview (front camera).
                          </span>
                        </div>
                      )}
                    </div>
                    <div className='flex w-full flex-wrap gap-2'>
                      <Button
                        className='flex w-full items-center gap-2'
                        onClick={
                          cameraEnabled
                            ? captureBoth
                            : frontPhoto || backPhoto
                              ? retakePhotos
                              : startCamera
                        }
                        disabled={cameraEnabled ? bothCapturing : false}
                      >
                        {cameraEnabled ? (
                          bothCapturing ? (
                            <>
                              <RefreshCw className='h-4 w-4 animate-spin' /> Capturing…
                            </>
                          ) : (
                            <>
                              <Camera className='h-4 w-4' /> Capture Both
                            </>
                          )
                        ) : frontPhoto || backPhoto ? (
                          <>
                            <RefreshCw className='h-4 w-4' /> Retake
                          </>
                        ) : (
                          <>
                            <Camera className='h-4 w-4' /> Start
                          </>
                        )}
                      </Button>
                      <Button
                        variant='outline'
                        disabled={!frontPhoto && !backPhoto}
                        className='flex w-full items-center gap-2'
                        onClick={() => {
                          setFrontPhoto(null);
                          setBackPhoto(null);
                          // Reset active camera to default front after clearing
                          setActiveCamera('user');
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-3'>
                    {cameraError && (
                      <div className='border-warning/30 bg-warning/15 text-warning-foreground rounded-md border p-3'>
                        <p className='text-sm font-medium'>Camera unavailable</p>
                        <p className='text-xs opacity-90'>
                          {cameraError} Ensure you are using a supported browser with HTTPS. On
                          Android, Chrome is recommended. Firefox Mobile may not fully support
                          camera APIs.
                        </p>
                      </div>
                    )}

                    {user?.role === 'admin' || user?.role === 'organizer' ? (
                      <div className='space-y-2'>
                        <p className='text-muted-foreground text-xs'>
                          Admin/Organizer: You may upload photos if camera access is blocked.
                        </p>
                        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                          <div>
                            <label className='mb-1 block text-sm'>Upload Front Photo</label>
                            <Input
                              type='file'
                              accept='image/*'
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  setFrontPhoto({ uri: URL.createObjectURL(file), blob: file });
                              }}
                            />
                          </div>
                          <div>
                            <label className='mb-1 block text-sm'>Upload Back Photo</label>
                            <Input
                              type='file'
                              accept='image/*'
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file)
                                  setBackPhoto({ uri: URL.createObjectURL(file), blob: file });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className='space-y-2'>
                        <p className='text-sm'>
                          For security, manual upload is disabled for students.
                        </p>
                        <ul className='text-muted-foreground list-disc space-y-1 pl-5 text-xs'>
                          <li>Use Chrome on Android or Safari on iOS.</li>
                          <li>Open this page over HTTPS (secure lock icon visible).</li>
                          <li>Allow camera permission when prompted, then tap Retry.</li>
                        </ul>
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            onClick={async () => {
                              // Retry camera init
                              const okInit = await webCameraService.initialize();
                              if (!okInit) {
                                setHasCamera(false);
                                setUsingFileFallback(true);
                                setCameraError('Camera not supported on this device/browser.');
                                return;
                              }
                              const perm = await webCameraService.requestPermission();
                              setHasCamera(!!perm?.granted);
                              setUsingFileFallback(!perm?.granted);
                              if (!perm?.granted && perm?.error) {
                                setCameraError('Camera permission not granted or unavailable.');
                              } else {
                                setCameraError('');
                              }
                            }}
                          >
                            Retry Camera
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => window.location.reload()}
                          >
                            Reload
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Previews */}
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div>
                    <label className='text-muted-foreground text-xs'>Front Preview</label>
                    <div className='bg-muted mt-1 flex aspect-video items-center justify-center overflow-hidden rounded-md'>
                      {frontPhoto?.uri ? (
                        <img
                          src={frontPhoto.uri}
                          alt='Front'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <span className='text-muted-foreground text-xs'>No image</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className='text-muted-foreground text-xs'>Back Preview</label>
                    <div className='bg-muted mt-1 flex aspect-video items-center justify-center overflow-hidden rounded-md'>
                      {backPhoto?.uri ? (
                        <img
                          src={backPhoto.uri}
                          alt='Back'
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <span className='text-muted-foreground text-xs'>No image</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Digital Signature */}
            <Card className='border-0 bg-white shadow-lg dark:bg-gray-800'>
              <CardHeader className='pb-4'>
                <CardTitle className='flex items-center gap-3'>
                  <div
                    className={`rounded-full p-2 ${
                      signatureDataUrl
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20'
                        : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                    }`}
                  >
                    <Signature className='h-5 w-5' />
                  </div>
                  <div>
                    <h3 className='text-lg font-semibold'>Digital Signature</h3>
                    <p className='text-muted-foreground text-sm font-normal'>
                      Sign to confirm your attendance
                    </p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                  <div className='space-y-1'>
                    <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                      Signature Status
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {signatureDataUrl ? 'Signature captured' : 'No signature yet'}
                    </p>
                  </div>
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      onClick={() => setSignatureModalOpen(true)}
                      className='flex w-full items-center gap-2'
                    >
                      <Signature className='h-4 w-4' />
                      {signatureDataUrl ? 'Edit Signature' : 'Open Signature Pad'}
                    </Button>
                    <Button
                      className='flex w-full items-center gap-2'
                      variant='outline'
                      onClick={clearSignature}
                      size='sm'
                      disabled={!signatureDataUrl}
                    >
                      Clear Saved
                    </Button>
                  </div>
                </div>

                {/* Signature preview */}
                <div className='rounded-lg border border-dashed border-gray-300 p-3 dark:border-gray-600'>
                  <div className='flex h-40 items-center justify-center overflow-hidden rounded-md bg-white sm:h-48'>
                    {signatureSvgDataUrl ? (
                      <img
                        src={signatureSvgDataUrl}
                        alt='Signature preview (SVG)'
                        className='h-full w-full object-contain'
                      />
                    ) : signatureDataUrl ? (
                      <img
                        src={signatureDataUrl}
                        alt='Signature preview (PNG)'
                        className='h-full w-full object-contain'
                      />
                    ) : (
                      <span className='text-muted-foreground text-sm'>No signature captured</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Submit Section */}
        {(override || windowAllowed) && (
          <Card className='from-primary/10 to-accent/10 border-0 bg-gradient-to-r shadow-lg'>
            <CardContent className='py-6'>
              <div className='flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
                <div className='space-y-2'>
                  <h3 className='text-foreground font-semibold'>Ready to Submit?</h3>
                  <p className='text-muted-foreground max-w-md text-sm'>
                    Ensure you&apos;re at the venue, have taken clear photos, and provided your
                    signature.
                  </p>

                  {/* Progress indicators for mobile */}
                  <div className='space-y-2 pt-2 sm:hidden'>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          stepStatus.location ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                      <span className='text-muted-foreground text-xs'>
                        {stepStatus.location
                          ? '✓ Location verified'
                          : 'Location verification pending'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          stepStatus.photos ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                      <span className='text-muted-foreground text-xs'>
                        {stepStatus.photos ? '✓ Photos captured' : 'Photos required'}
                      </span>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          stepStatus.signature ? 'bg-success' : 'bg-muted'
                        }`}
                      />
                      <span className='text-muted-foreground text-xs'>
                        {stepStatus.signature ? '✓ Signature provided' : 'Signature required'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={submitAttendance}
                  disabled={!canSubmitFinal || submitting}
                  size='lg'
                  className='flex w-full items-center gap-2 font-medium sm:w-auto'
                >
                  {submitting ? (
                    <>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      {intendedAction === 'check-out'
                        ? 'Submitting Check-Out...'
                        : 'Submitting Check-In...'}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className='h-4 w-4' />
                      {submissionLocks.actionDone
                        ? intendedAction === 'check-out'
                          ? 'Check-Out Completed'
                          : 'Check-In Completed'
                        : intendedAction === 'check-out'
                          ? 'Submit Check-Out'
                          : 'Submit Check-In'}
                    </>
                  )}
                </Button>
              </div>

              {submitting && (
                <div className='mt-4 space-y-2'>
                  <div className='text-muted-foreground flex items-center justify-between text-xs'>
                    <span>{uploadLabel || 'Submitting…'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              {/* Already completed notice(s) */}
              {!submitting && !submitError && !submitSuccess && submissionLocks.actionDone && (
                <div className='border-border/50 mt-4 rounded-lg border p-3'>
                  <div className='text-muted-foreground space-y-1 text-sm'>
                    <p>
                      {submissionLocks.hasCheckin &&
                        !submissionLocks.hasCheckout &&
                        'You have already checked in for this event.'}
                      {submissionLocks.hasCheckin &&
                        submissionLocks.hasCheckout &&
                        'You have already checked in and checked out for this event.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              {submitError && (
                <div className='border-destructive/30 bg-destructive/10 mt-4 rounded-lg border p-3'>
                  <p className='text-destructive text-sm'>
                    <strong>Error:</strong> {submitError}
                  </p>
                </div>
              )}

              {submitSuccess && (
                <div className='border-success/30 bg-success/10 mt-4 rounded-lg border p-4'>
                  <div className='text-success flex items-center gap-2'>
                    <CheckCircle2 className='h-5 w-5' />
                    <p className='font-medium'>Attendance submitted successfully!</p>
                  </div>
                  <p className='text-success/90 mt-1 text-sm'>
                    Your attendance has been recorded and will be reviewed by the organizers.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Help Modal */}
      <Modal title='How verification works' open={helpOpen} onOpenChange={setHelpOpen} size='lg'>
        <div className='space-y-4'>
          <div className='bg-primary/10 rounded-lg p-4'>
            <h4 className='text-primary mb-2 font-semibold'>Verification Steps</h4>
            <ul className='text-foreground space-y-2 text-sm'>
              <li className='flex items-start gap-2'>
                <span className='font-medium'>1.</span>
                <span>Scan the event QR code to open this verification page</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='font-medium'>2.</span>
                <span>
                  Enable location access and verify you&apos;re within 100 meters of the event
                  location
                </span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='font-medium'>3.</span>
                <span>Take clear photos: one of yourself (front) and one of your surroundings</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='font-medium'>4.</span>
                <span>Provide your digital signature in the signature box</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='font-medium'>5.</span>
                <span>Submit to complete your attendance verification</span>
              </li>
            </ul>
          </div>

          <div className='bg-warning/10 rounded-lg p-4'>
            <h4 className='text-warning mb-2 font-semibold'>Important Notes</h4>
            <ul className='text-foreground space-y-1 text-sm'>
              <li>• All photos and location data are sent securely to verify attendance</li>
              <li>• You must be physically present at the event location</li>
              {(user?.role === 'admin' || user?.role === 'organizer') && (
                <li>• Organizers and admins can use Alt+L to toggle location override</li>
              )}
              <li>• Make sure your photos are clear and well-lit for verification</li>
            </ul>
          </div>
        </div>
      </Modal>

      {/* Signature Modal (Full Screen) */}
      <Modal
        title='Sign to Confirm Attendance'
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        size='full'
      >
        <div className='flex max-h-[calc(100vh-12rem)] min-h-[60vh] flex-col gap-4 overflow-auto'>
          <div className='text-muted-foreground text-sm'>
            Use your finger or stylus to sign. Submit to save, or Clear to retry.
          </div>
          <div
            ref={sigWrapperRef}
            className='relative flex-1 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-white dark:border-gray-600'
          >
            <SignatureCanvas
              ref={sigPadRef}
              backgroundColor='rgba(0,0,0,0)'
              penColor='black'
              minWidth={1.5}
              maxWidth={3}
              velocityFilterWeight={0.7}
              canvasProps={{ className: 'h-full w-full cursor-crosshair touch-none select-none' }}
            />
            {/* Guideline overlay (non-interactive) */}
            <div className='pointer-events-none absolute inset-0'>
              <div className='bg-border absolute top-1/3 right-4 left-4 h-px' />
              <div className='bg-border absolute top-1/2 right-4 left-4 h-px' />
              <div className='bg-border absolute top-2/3 right-4 left-4 h-px' />
            </div>
          </div>
          {signaturePadError ? (
            <div className='text-destructive text-sm'>{signaturePadError}</div>
          ) : null}
          <div className='flex items-center justify-end gap-2'>
            <Button
              variant='outline'
              onClick={() => {
                sigPadRef.current?.clear();
                setSignaturePadError('');
              }}
            >
              Clear
            </Button>
            <Button
              onClick={() => {
                if (!sigPadRef.current) return;
                if (sigPadRef.current.isEmpty()) {
                  setSignaturePadError('Please add your signature before submitting.');
                  return;
                }
                // Helper: trim transparent bounds of the signature
                const srcCanvas = sigPadRef.current.getCanvas();
                const ctx = srcCanvas.getContext('2d');
                const { width: sw, height: sh } = srcCanvas;
                const imgData = ctx.getImageData(0, 0, sw, sh);
                const data = imgData.data;

                let minX = sw,
                  minY = sh,
                  maxX = -1,
                  maxY = -1;
                for (let y = 0; y < sh; y++) {
                  for (let x = 0; x < sw; x++) {
                    const idx = (y * sw + x) * 4;
                    const alpha = data[idx + 3];
                    if (alpha !== 0) {
                      if (x < minX) minX = x;
                      if (y < minY) minY = y;
                      if (x > maxX) maxX = x;
                      if (y > maxY) maxY = y;
                    }
                  }
                }

                // If empty, show error
                if (minX > maxX || minY > maxY) {
                  setSignaturePadError('Please add your signature before submitting.');
                  return;
                }

                const cropW = maxX - minX + 1;
                const cropH = maxY - minY + 1;

                // Create a trimmed canvas
                const trimmed = document.createElement('canvas');
                trimmed.width = cropW;
                trimmed.height = cropH;
                const tctx = trimmed.getContext('2d');
                tctx.drawImage(srcCanvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

                // Export a tightly-cropped transparent PNG (only signature strokes)
                // Optionally add a small transparent padding for visual comfort
                const pad = 8; // transparent pixels around the signature
                const out = document.createElement('canvas');
                out.width = cropW + pad * 2;
                out.height = cropH + pad * 2;
                const octx = out.getContext('2d');
                // Ensure transparent background (do not fill)
                octx.clearRect(0, 0, out.width, out.height);
                // Draw trimmed signature centered with padding
                octx.imageSmoothingEnabled = true;
                octx.imageSmoothingQuality = 'high';
                octx.drawImage(trimmed, pad, pad);

                const pngUrl = out.toDataURL('image/png');
                setSignatureDataUrl(pngUrl);

                // Also try to capture SVG for a crisper preview
                try {
                  const svgDataUrl = sigPadRef.current.toDataURL('image/svg+xml');
                  setSignatureSvgDataUrl(svgDataUrl);
                } catch {
                  setSignatureSvgDataUrl('');
                }
                setSignaturePadError('');
                setSignatureModalOpen(false);
              }}
              className='flex items-center gap-2'
            >
              <CheckCircle2 className='h-4 w-4' /> Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceVerifyPage;
