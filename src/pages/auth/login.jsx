import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useCountdown from '@/components/useCountdown';
import OtpInput from '@/components/OTPInput';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { setToken as setTokenCfg } from '@/lib/config';
import { toast } from 'react-toastify';

// --- API helpers ---
async function checkEmail(email) {
  const { data } = await api().post('/api/auth/check-email', { email });

  if (data.exists === false) {
    toast.error('User not found.');
  }
  return data;
}

async function requestOtp({ email, type }) {
  const { data } = await api().post('/api/auth/request-otp', { email, type });

  if (data.status == '200') {
    toast.success(data.message);
  } else {
    toast.error(data.message);
  }
  return data;
}

async function verifyOtp({ email, otp, name, type = 'login' }) {
  const { data } = await api().post('/api/auth/verify-otp', {
    email,
    otp,
    name,
    type,
  });
  return data;
}

// --- email utils ---
const isValidEmail = (v = '') =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

export default function LoginForm() {
  const [step, setStep] = React.useState('email');
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const { left, start } = useCountdown(30);
  const navigate = useNavigate();

  const onSend = async () => {
    setError('');
    setInfo('');
    const trimmed = email.trim();

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const { exists } = await checkEmail(trimmed);

      if (!exists) {
        setLoading(false);
        return;
      }

      await requestOtp({ email: trimmed, type: 'login' });
      start();
      setStep('otp');
    } catch (e) {
      // 🔥 Detect Google-only account message and show a toast
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to send OTP';

      if (msg.includes('Google Sign-In') || e?.response?.status === 403) {
        toast.warning(
          'This account was created using Google Sign-In. Please login with Google instead.',
        );
      } else {
        toast.error(msg);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const trimmed = email.trim();
      const res = await verifyOtp({ email: trimmed, otp, type: 'login' });

      setTokenCfg(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      navigate('/');
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to verify OTP';

      // 🔥 Handle Google-login restriction
      if (msg.includes('Google Sign-In') || e?.response?.status === 403) {
        toast.warning(
          'This account was created using Google Sign-In. Please login with Google instead.',
        );
      } else {
        toast.error(msg);
      }

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      {step === 'email' ? (
        <>
          <label className='text-sm font-medium text-gray-900 dark:text-gray-100'>
            Email
          </label>
          <Input
            className='mb-2'
            type='email'
            placeholder='you@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) onSend();
            }}
          />
          <Button
            onClick={onSend}
            disabled={loading || !isValidEmail(email)}
            className='w-full'>
            {loading ? 'Sending…' : 'Continue with email'}
          </Button>
        </>
      ) : (
        <div className='space-y-4 flex flex-col items-center justify-center'>
          <p className='text-sm my-2 text-gray-600 dark:text-gray-300 text-center'>
            Enter the 6-digit code sent to <b>{email}</b>
          </p>
          <OtpInput value={otp} onChange={setOtp} />
          {error && <p className='text-sm text-red-600'>{error}</p>}
          {info && <p className='text-sm text-emerald-600'>{info}</p>}

          <div className='flex items-center gap-2 my-2'>
            <Button onClick={onVerify} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying…' : 'Verify & log in'}
            </Button>
          </div>

          <button
            type='button'
            className='text-xs text-gray-600 dark:text-gray-300 underline disabled:opacity-50'
            disabled={left > 0 || loading}
            onClick={onSend}>
            {left > 0 ? `Resend in ${left}s` : 'Resend code'}
          </button>

          <button
            type='button'
            className='text-xs text-gray-500 dark:text-gray-400 underline'
            onClick={() => setStep('email')}>
            Change email
          </button>
        </div>
      )}
    </div>
  );
}
