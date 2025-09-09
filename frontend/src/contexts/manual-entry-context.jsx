import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ManualEntryContext = createContext(null);

export const ManualEntryProvider = ({ children }) => {
  const [pending, setPending] = useState(false);
  const requestRef = useRef(null); // { eventId?: number|string, ts: number }
  const tabControllerRef = useRef(null); // fn: (tab: string) => void

  const openManualEntry = useCallback((payload = {}) => {
    requestRef.current = { ...payload, ts: Date.now() };
    setPending(true);
    // If we have a tab controller, switch to attendance tab so the modal is rendered
    if (typeof tabControllerRef.current === 'function') {
      try {
        tabControllerRef.current('attendance');
      } catch {
        // ignore
      }
    }
  }, []);

  const consumeManualEntryRequest = useCallback(() => {
    setPending(false);
  }, []);

  const registerTabController = useCallback((fn) => {
    tabControllerRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({
      // state
      pending,
      request: requestRef.current,
      // actions
      openManualEntry,
      consumeManualEntryRequest,
      registerTabController,
    }),
    [pending, openManualEntry, consumeManualEntryRequest, registerTabController],
  );

  return <ManualEntryContext.Provider value={value}>{children}</ManualEntryContext.Provider>;
};

export const useManualEntry = () => {
  const ctx = useContext(ManualEntryContext);
  if (!ctx) {
    throw new Error('useManualEntry must be used within a ManualEntryProvider');
  }
  return ctx;
};
