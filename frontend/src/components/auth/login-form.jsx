import { useAuth } from '@contexts/auth-context';
import { Mail, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { FieldWithIcon, PasswordField } from './shared-components';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LoadingButton } from '@/components/ui/loading';

export function LoginForm({ onSuccess, setTab, initialValues = {} }) {
  const { login, isLoading } = useAuth();
  const [loginForm, setLoginForm] = useState({
    email: initialValues.email || '',
    password: initialValues.password || '',
  });
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update form when initialValues change
  React.useEffect(() => {
    if (initialValues.email || initialValues.password) {
      setLoginForm({
        email: initialValues.email || '',
        password: initialValues.password || '',
      });
    }
  }, [initialValues]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowSuccess(false);
    setIsProcessing(true);

    // Add 2-second delay before processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result = await login(loginForm);

    if (result.success) {
      setShowSuccess(true);
      // Hide success message and call onSuccess after a short delay
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess?.(result?.redirectTo);
      }, 1500);
    } else {
      setError(result.error);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleLogin} className='space-y-6'>
      <FieldWithIcon
        id='login-email'
        label='Email Address'
        type='email'
        icon={Mail}
        autoComplete='email'
        value={loginForm.email}
        onChange={(v) => setLoginForm((f) => ({ ...f, email: v }))}
      />
      <PasswordField
        id='login-password'
        label='Password'
        autoComplete='current-password'
        value={loginForm.password}
        onChange={(v) => setLoginForm((f) => ({ ...f, password: v }))}
      />
      {error && (
        <Alert variant='destructive'>
          <AlertTitle>Login failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {showSuccess && (
        <Alert variant='success'>
          <CheckCircle className='h-4 w-4' />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>Login successful. Preparing your session…</AlertDescription>
        </Alert>
      )}
      <div className='flex items-center justify-between text-xs'>
        <label className='flex items-center gap-2'>
          <input type='checkbox' className='border-border bg-background h-3.5 w-3.5 rounded' />
          <span className='text-muted-foreground'>Remember me</span>
        </label>
        <button type='button' className='text-primary hover:underline'>
          Forgot password?
        </button>
      </div>
      <LoadingButton
        type='submit'
        loading={isLoading || isProcessing}
        loadingText='Logging in...'
        className='button-gradient-bg inline-flex h-10 w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50'
      >
        Sign in
      </LoadingButton>
      <p className='text-muted-foreground mt-4 text-center text-xs'>
        New here?{' '}
        <button
          type='button'
          onClick={() => setTab('register')}
          className='text-primary hover:underline'
        >
          Create an account
        </button>
      </p>
    </form>
  );
}

export default LoginForm;
