import { Calendar as CalendarIcon } from 'lucide-react';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/calendar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import apiService from '@/services/api-service';

const yearLevels = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
  { value: '5', label: '5th Year' },
  { value: '6', label: '6th Year' },
];

const sections = ['A', 'B', 'C', 'D'];

export default function BasicInfoTab() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');
  const [isEditingAccount, setIsEditingAccount] = React.useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = React.useState(false);
  const [dobPopoverOpen, setDobPopoverOpen] = React.useState(false);
  const [campuses, setCampuses] = React.useState([]);
  const [departments, setDepartments] = React.useState([]);
  const [courses, setCourses] = React.useState([]);
  const [userInfo, setUserInfo] = React.useState({
    full_name: '',
    email: '',
    is_verified: false,
    role: '',
  });
  const [form, setForm] = React.useState({
    bio: '',
    phone_number: '',
    date_of_birth: '',
    student_id: '',
    year_level: '',
    section: '',
    campus: '',
    department: '',
    course: '',
    student_status: 'regular',
    current_semester: '1st',
  });

  // Helper function to safely unwrap API responses
  const unwrapApiResponse = React.useCallback((response) => {
    console.log('Unwrapping response:', response);

    // If response is null/undefined, return empty array
    if (!response) return [];

    // If response.data.data exists (new envelope format)
    if (response.data?.data) {
      const data = response.data.data;
      return Array.isArray(data) ? data : data.results || [];
    }

    // If response.data exists but not nested (legacy or mixed format)
    if (response.data) {
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (data.results && Array.isArray(data.results)) return data.results;
      return [];
    }

    // If response is directly an array
    if (Array.isArray(response)) return response;

    // If response has results property
    if (response.results && Array.isArray(response.results)) return response.results;

    // Fallback
    return [];
  }, []);

  // Calculate age from date of birth
  const calculateAge = React.useCallback((dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Helpers to format and parse YYYY-MM-DD without timezone drift
  const formatDateYMD = React.useCallback((date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const parseYMDToDate = React.useCallback((ymd) => {
    if (!ymd) return undefined;
    const [y, m, d] = String(ymd).split('-').map((v) => parseInt(v, 10));
    if (!y || !m || !d) return undefined;
    return new Date(y, m - 1, d);
  }, []);

  // DoB date boundaries for new calendar component
  const dobStartMonth = React.useMemo(() => {
    const current = new Date();
    return new Date(current.getFullYear() - 100, 0, 1);
  }, []);
  const dobEndMonth = React.useMemo(() => new Date(), []);

  React.useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch user info, profile, and dropdown data in parallel
        const [userRes, profileRes, campusesRes, departmentsRes, coursesRes] = await Promise.all([
          apiService.getCurrentUser().catch(() => null),
          apiService.getProfile().catch(() => null),
          apiService.getCampuses().catch(() => []),
          apiService.getDepartments().catch(() => []),
          apiService.getCourses().catch(() => []),
        ]);

        console.log('API Responses:', {
          userRes,
          profileRes,
          campusesRes,
          departmentsRes,
          coursesRes,
        });

  // Process user information (apiService already returns plain data)
  const userData = userRes || {};
        setUserInfo({
          full_name:
            userData.full_name ||
            `${userData.first_name || ''} ${userData.last_name || ''}`.trim() ||
            'N/A',
          email: userData.email || 'N/A',
          is_verified: userData.is_verified || false,
          role: userData.role || 'student',
        });

  // Process profile information (plain data)
  const profileData = profileRes || {};
        setForm({
          bio: profileData.bio || '',
          phone_number: profileData.phone_number || '',
          date_of_birth: profileData.date_of_birth || '',
          student_id: profileData.student_id || '',
          year_level: profileData.year_level ? String(profileData.year_level) : '',
          section: profileData.section || '',
          campus: profileData.campus ? String(profileData.campus) : '',
          department: profileData.department ? String(profileData.department) : '',
          course: profileData.course ? String(profileData.course) : '',
          student_status: profileData.student_status || 'regular',
          current_semester: profileData.current_semester || '1st',
        });

        // Process dropdown data
        const campusData = unwrapApiResponse(campusesRes);
        const departmentData = unwrapApiResponse(departmentsRes);
        const courseData = unwrapApiResponse(coursesRes);

        setCampuses(campusData);
        setDepartments(departmentData);
        setCourses(courseData);

        // Validate and fix any invalid relationships in the profile data
        setTimeout(() => {
          setForm((currentForm) => {
            const newForm = { ...currentForm };
            let changed = false;

            // Check if campus is valid
            if (
              newForm.campus &&
              !campusData.some((c) => String(c.id) === String(newForm.campus))
            ) {
              console.warn('Invalid campus in profile data, resetting academic info');
              newForm.campus = '';
              newForm.department = '';
              newForm.course = '';
              changed = true;
            }

            // Check if department is valid for the campus
            if (newForm.department && newForm.campus) {
              const validDepartments = departmentData.filter(
                (d) => String(d.campus) === String(newForm.campus),
              );
              if (!validDepartments.some((d) => String(d.id) === String(newForm.department))) {
                console.warn('Invalid department for campus, resetting department and course');
                newForm.department = '';
                newForm.course = '';
                changed = true;
              }
            }

            // Check if course is valid for the department
            if (newForm.course && newForm.department) {
              const validCourses = courseData.filter(
                (c) => String(c.department) === String(newForm.department),
              );
              if (!validCourses.some((c) => String(c.id) === String(newForm.course))) {
                console.warn('Invalid course for department, resetting course');
                newForm.course = '';
                changed = true;
              }
            }

            return changed ? newForm : currentForm;
          });
        }, 100); // Small delay to ensure state has been set
      } catch (err) {
        console.error('Failed to load profile data:', err);
        setError('Failed to load profile data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [unwrapApiResponse]);

  // Derived filtered lists based on current selections
  const filteredDepartments = React.useMemo(() => {
    if (!Array.isArray(departments)) return [];
    if (!form.campus) return departments;
    return departments.filter((d) => String(d.campus) === String(form.campus));
  }, [departments, form.campus]);

  const filteredCourses = React.useMemo(() => {
    if (!Array.isArray(courses)) return [];
    if (!form.department) return courses;
    return courses.filter((c) => String(c.department) === String(form.department));
  }, [courses, form.department]);

  // Ensure dependent selections remain valid when parent changes
  React.useEffect(() => {
    if (form.department && filteredDepartments.length > 0) {
      const stillValid = filteredDepartments.some((d) => String(d.id) === String(form.department));
      if (!stillValid) {
        console.log('Department no longer valid for campus, resetting department and course');
        setForm((f) => ({ ...f, department: '', course: '' }));
      }
    }
  }, [form.campus, filteredDepartments, form.department]);

  React.useEffect(() => {
    if (form.course && filteredCourses.length > 0) {
      const stillValid = filteredCourses.some((c) => String(c.id) === String(form.course));
      if (!stillValid) {
        console.log('Course no longer valid for department, resetting course');
        setForm((f) => ({ ...f, course: '' }));
      }
    }
  }, [form.department, filteredCourses, form.course]);

  const onSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Validate foreign keys before sending
      const validateForeignKey = (value, items, name) => {
        if (!value || value === '') return null;
        const numValue = parseInt(value, 10);
        const exists = items.some((item) => item.id === numValue);
        if (!exists) {
          console.warn(
            `Invalid ${name} ID: ${numValue}, available IDs:`,
            items.map((i) => i.id),
          );
          return null;
        }
        return numValue;
      };

      // Validate relationships
      const validCampus = validateForeignKey(form.campus, campuses, 'campus');
      const validDepartment = validCampus
        ? validateForeignKey(form.department, filteredDepartments, 'department')
        : null;
      const validCourse = validDepartment
        ? validateForeignKey(form.course, filteredCourses, 'course')
        : null;

      // If user has invalid selections, show a helpful error message
      if (form.campus && !validCampus) {
        setError('Please select a valid campus from the available options.');
        return;
      }
      if (form.department && !validDepartment) {
        setError('Please select a valid department for the selected campus.');
        return;
      }
      if (form.course && !validCourse) {
        setError('Please select a valid course for the selected department.');
        return;
      }

      const payload = {
        ...form,
        year_level: form.year_level ? parseInt(form.year_level, 10) : null,
        campus: validCampus,
        department: validDepartment,
        course: validCourse,
      };

      // Remove empty strings and undefined values
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '' || payload[key] === undefined) {
          payload[key] = null;
        }
      });

      console.log('Sending payload:', payload);
      console.log(
        'Available departments for campus:',
        filteredDepartments.map((d) => ({ id: d.id, name: d.name })),
      );
      console.log(
        'Available courses for department:',
        filteredCourses.map((c) => ({ id: c.id, name: c.name })),
      );
      const res = await apiService.updateProfile(payload);
      console.log('Update response:', res);

      const isSuccess = res?.success !== false && !res?.error;
      if (!isSuccess) {
        const errorMessage = res?.error || res?.details || 'Update failed';
        throw new Error(
          typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage),
        );
      }

      setSuccess('Profile updated successfully');

      // If a redirect param is present (e.g., from attendance flow), navigate back after a short delay
      try {
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect');
        if (redirect) {
          // Small timeout to let the success alert render momentarily
          setTimeout(() => {
            navigate(decodeURIComponent(redirect), { replace: true });
          }, 400);
        }
      } catch {
        // ignore navigation errors
      }
    } catch (e) {
      console.error('Update error:', e);

      // Extract detailed error information
      let errorMessage = 'Update failed';

      if (e?.response?.data) {
        const errorData = e.response.data;
        console.log('Error data:', errorData);

        if (errorData.details) {
          // Format validation errors
          const validationErrors = [];
          for (const [field, messages] of Object.entries(errorData.details)) {
            if (Array.isArray(messages)) {
              validationErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              validationErrors.push(`${field}: ${messages}`);
            }
          }
          errorMessage =
            validationErrors.length > 0
              ? validationErrors.join('; ')
              : errorData.error || errorMessage;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (e?.message) {
        errorMessage = e.message;
      }

      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='text-muted-foreground text-sm'>Loading profile…</div>;
  }

  const calculatedAge = calculateAge(form.date_of_birth);
  const yearLabel = yearLevels.find((y) => y.value === String(form.year_level))?.label || '-';
  const campusName = campuses.find((c) => String(c.id) === String(form.campus))?.name || '-';
  const departmentName =
    departments.find((d) => String(d.id) === String(form.department))?.name || '-';
  const courseName = courses.find((c) => String(c.id) === String(form.course))?.name || '-';
  const studentStatusLabel =
    {
      regular: 'Regular Student',
      irregular: 'Irregular Student',
      transferee: 'Transferee',
      returnee: 'Returnee',
      graduate: 'Graduate',
    }[form.student_status] || '-';
  const semesterLabel =
    {
      '1st': '1st Semester',
      '2nd': '2nd Semester',
      summer: 'Summer',
    }[form.current_semester] || '-';

  return (
    <div className='space-y-6'>
      {/* Account Information Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Account Information</CardTitle>
            <Button variant='outline' size='sm' onClick={() => setIsEditingAccount((s) => !s)}>
              {isEditingAccount ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Full Name</Label>
              <p className='text-sm font-medium'>{userInfo.full_name || '-'}</p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Email</Label>
              <p className='text-sm'>{userInfo.email || '-'}</p>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Status</Label>
              <div className='flex items-center gap-2'>
                <Badge variant={userInfo.is_verified ? 'default' : 'secondary'}>
                  {userInfo.is_verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Date of Birth</Label>
              {isEditingAccount ? (
                <Popover open={dobPopoverOpen} onOpenChange={setDobPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant='outline' className='w-full justify-start text-left font-normal'>
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {form.date_of_birth ? (
                        (() => {
                          const d = parseYMDToDate(form.date_of_birth);
                          return d ? d.toLocaleDateString() : 'Select date of birth';
                        })()
                      ) : (
                        <span>Select date of birth</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <div className='space-y-3 p-3'>
                      <Calendar
                        mode='single'
                        showYearSwitcher
                        startMonth={dobStartMonth}
                        endMonth={dobEndMonth}
                        selected={parseYMDToDate(form.date_of_birth)}
                        onSelect={(date) => {
                          if (date) {
                            const now = new Date();
                            const clamped = date > now ? now : date;
                            setForm((f) => ({ ...f, date_of_birth: formatDateYMD(clamped) }));
                          }
                        }}
                        disabled={(date) => date > new Date()}
                        autoFocus
                      />
                      <div className='flex items-center space-x-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => setForm((f) => ({ ...f, date_of_birth: '' }))}
                        >
                          Clear
                        </Button>
                        <Button size='sm' variant='secondary' onClick={() => setDobPopoverOpen(false)}>
                          Done
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <p className='text-sm'>
                  {(() => {
                    const d = parseYMDToDate(form.date_of_birth);
                    return d ? d.toLocaleDateString() : '-';
                  })()}
                </p>
              )}
            </div>
            <div>
              <Label className='text-muted-foreground text-sm font-medium'>Age</Label>
              <p className='text-sm'>
                {calculatedAge !== null ? `${calculatedAge} years old` : '-'}
              </p>
            </div>
            <div>
              <Label htmlFor='phone_number' className='text-muted-foreground text-sm font-medium'>
                Phone Number
              </Label>
              {isEditingAccount ? (
                <Input
                  id='phone_number'
                  value={form.phone_number}
                  onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                  placeholder='+639xxxxxxxxx'
                />
              ) : (
                <p className='text-sm'>{form.phone_number || '-'}</p>
              )}
            </div>
          </div>
          <Separator />
          <div>
            <Label className='text-muted-foreground text-sm font-medium'>Bio</Label>
            {isEditingAccount ? (
              <Textarea
                id='bio'
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder='Tell us about yourself...'
                rows={3}
              />
            ) : (
              <p className='text-muted-foreground text-sm'>{form.bio ? form.bio : '—'}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Academic Information</CardTitle>
            <Button variant='outline' size='sm' onClick={() => setIsEditingAcademic((s) => !s)}>
              {isEditingAcademic ? 'Done' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='student_id'>Student ID</Label>
              {isEditingAcademic ? (
                <Input
                  id='student_id'
                  value={form.student_id}
                  onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}
                  placeholder='e.g., 2025-12345'
                />
              ) : (
                <p className='text-sm'>{form.student_id || '-'}</p>
              )}
            </div>
            <div>
              <Label>Year Level</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.year_level}
                  onValueChange={(v) => setForm((f) => ({ ...f, year_level: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select year level' />
                  </SelectTrigger>
                  <SelectContent>
                    {yearLevels.map((yl) => (
                      <SelectItem key={yl.value} value={yl.value}>
                        {yl.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{yearLabel}</p>
              )}
            </div>
            <div>
              <Label>Section</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.section}
                  onValueChange={(v) => setForm((f) => ({ ...f, section: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select section' />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{form.section || '-'}</p>
              )}
            </div>
            <div>
              <Label>Campus</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.campus}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, campus: v, department: '', course: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select campus' />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{campusName}</p>
              )}
              {isEditingAcademic && campuses.length === 0 && (
                <p className='text-muted-foreground mt-1 text-xs'>No campuses available</p>
              )}
            </div>
            <div>
              <Label>Department</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.department}
                  onValueChange={(v) => setForm((f) => ({ ...f, department: v, course: '' }))}
                  disabled={!form.campus}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.campus ? 'Select department' : 'Select campus first'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{departmentName}</p>
              )}
              {isEditingAcademic && form.campus && filteredDepartments.length === 0 && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  No departments available for selected campus
                </p>
              )}
            </div>
            <div>
              <Label>Course</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.course}
                  onValueChange={(v) => setForm((f) => ({ ...f, course: v }))}
                  disabled={!form.department}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.department ? 'Select course' : 'Select department first'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCourses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{courseName}</p>
              )}
              {isEditingAcademic && form.department && filteredCourses.length === 0 && (
                <p className='text-muted-foreground mt-1 text-xs'>
                  No courses available for selected department
                </p>
              )}
            </div>
            <div>
              <Label>Student Status</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.student_status}
                  onValueChange={(v) => setForm((f) => ({ ...f, student_status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select student status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='regular'>Regular Student</SelectItem>
                    <SelectItem value='irregular'>Irregular Student</SelectItem>
                    <SelectItem value='transferee'>Transferee</SelectItem>
                    <SelectItem value='returnee'>Returnee</SelectItem>
                    <SelectItem value='graduate'>Graduate</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{studentStatusLabel}</p>
              )}
            </div>
            <div>
              <Label>Current Semester</Label>
              {isEditingAcademic ? (
                <Select
                  value={form.current_semester}
                  onValueChange={(v) => setForm((f) => ({ ...f, current_semester: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select semester' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1st'>1st Semester</SelectItem>
                    <SelectItem value='2nd'>2nd Semester</SelectItem>
                    <SelectItem value='summer'>Summer</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className='text-sm'>{semesterLabel}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error and Success Messages */}
      {error && (
        <Alert variant='destructive'>
          <AlertTitle>Update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>
    </div>
  );
}
