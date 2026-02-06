// src/components/auth/SignupForm.jsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useCountdown from '@/components/useCountdown';
import OtpInput from '@/components/OTPInput';
import api from '@/lib/api';

// fake APIs (replace later)
async function requestOtpSignup({ email, phone, name }) {
  await new Promise((r) => setTimeout(r, 600));
  if (!/\S+@\S+\.\S+/.test(email)) throw new Error('Invalid email');
  if (!/^\+?\d{7,15}$/.test(phone || ''))
    throw new Error('Invalid phone number');
  if (!name || name.length < 2) throw new Error('Enter your name');
  return true;
}
async function verifyOtpSignup({ email, otp, name }) {
  const { data } = await api().post('/api/auth/verify-otp', {
    email,
    otp,
    name,
    type: 'signup',
  });
  return data; // { token, user, message }
}

export default function SignupForm() {
  const [step, setStep] = React.useState('form'); // form | otp
  const [form, setForm] = React.useState({ name: '', email: '', phone: '' });
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { left, start } = useCountdown(30);

  const onContinue = async () => {
    setError('');
    setLoading(true);
    try {
      await requestOtpSignup(form);
      start();
      setStep('otp');
    } catch (e) {
      setError(e.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    setError('');
    setLoading(true);
    try {
      await verifyOtpSignup({ ...form, otp });
      // console.log('Signed up!', res);
      // TODO: route to app
    } catch (e) {
      setError(e.message || 'Failed to verify');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-4'>
      {step === 'form' ? (
        <>
          <div className='grid grid-cols-1 gap-3'>
            <div>
              <label className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Name
              </label>
              <Input
                placeholder='Your name'
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Email
              </label>
              <Input
                type='email'
                placeholder='you@example.com'
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                Phone
              </label>
              <Input
                type='tel'
                placeholder='+91 98765 43210'
                value={form.phone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone: e.target.value }))
                }
              />
            </div>
          </div>

          {error && <p className='text-sm text-red-600'>{error}</p>}

          <Button
            onClick={onContinue}
            disabled={loading || !form.name || !form.email || !form.phone}
            className='w-full my-5'>
            {loading ? 'Sending OTP...' : 'Continue'}
          </Button>
        </>
      ) : (
        <>
          <div className=' flex flex-col items-center justify-center space-y-4'>
            <p className='text-sm text-gray-600 dark:text-gray-300 my-3'>
              Enter the code sent to <b>{form.email}</b>
            </p>
            <OtpInput value={otp} onChange={setOtp} />
            {error && <p className='text-sm text-red-600'>{error}</p>}
            <div className='flex items-center justify-center my-5 gap-2'>
              <Button onClick={onVerify} disabled={loading || otp.length !== 6}>
                {loading ? 'Verifying...' : 'Create account'}
              </Button>
            </div>
            <button
              type='button'
              className='text-xs text-gray-600 dark:text-gray-300 underline disabled:opacity-50'
              disabled={left > 0}
              onClick={onContinue}>
              {left > 0 ? `Resend in ${left}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
