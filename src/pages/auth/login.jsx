// src/pages/auth/login.jsx
import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import useCountdown from '@/components/useCountdown';
import OtpInput from '@/components/OTPInput';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { setToken as setTokenCfg } from '@/lib/config';
import { toast } from 'react-toastify';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- API helpers ---
async function checkEmail(email) {
  const { data } = await api().post('/api/auth/check-email', { email });
  if (data.exists === false) {
    toast.error('No account found with this email.');
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

async function loginPassword({ email, password }) {
  const { data } = await api().post('/api/auth/login-password', {
    email,
    password,
  });
  return data;
}

const isValidEmail = (v = '') =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

// ── Icon helpers ──────────────────────────────────────────────────────────────
function LockIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='w-4 h-4 text-gray-400'>
      <path d='M5 8v-2a5 5 0 0 1 10 0v2' stroke='currentColor' strokeWidth='1.25' strokeLinecap='round' />
      <path d='M3 8h14v10H3V8z' stroke='currentColor' strokeWidth='1.25' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='w-4 h-4 text-gray-400'>
      <path
        d='M2.5 5.5a1 1 0 0 1 1-1h13a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1v-9Z'
        stroke='currentColor'
        strokeWidth='1.25'
      />
      <path
        d='M2.5 5.5 10 11l7.5-5.5'
        stroke='currentColor'
        strokeWidth='1.25'
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='w-4 h-4'>
      <path
        d='M4 10h12m-5-5 5 5-5 5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox='0 0 20 20' fill='none' className='w-5 h-5 text-emerald-500'>
      <circle cx='10' cy='10' r='8' stroke='currentColor' strokeWidth='1.5' />
      <path
        d='M6.5 10l2.5 2.5 4.5-5'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function LoginForm() {
  const [step, setStep] = React.useState('email'); // email | otp
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const { left, start } = useCountdown(30);
  const navigate = useNavigate();

  const onSend = async () => {
    setError('');
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
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to send OTP';
      if (msg.includes('Google Sign-In') || e?.response?.status === 403) {
        toast.warning(
          'This account uses Google Sign-In. Please login with Google.',
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
      if (msg.includes('Google Sign-In') || e?.response?.status === 403) {
        toast.warning(
          'This account uses Google Sign-In. Please login with Google.',
        );
      } else {
        toast.error(msg);
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const onPasswordLogin = async () => {
    setError('');
    const trimmed = email.trim();

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginPassword({ email: trimmed, password });
      setTokenCfg(res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      navigate('/');
    } catch (e) {
      const msg =
        e?.response?.data?.message || e?.message || 'Failed to login';
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Email Step ──────────────────────────────────────────────────────────────
  if (step === 'email') {
    return (
      <Tabs defaultValue="otp" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-white/[0.04] p-1 rounded-lg">
          <TabsTrigger 
            value="otp"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#161b22] data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-300 data-[state=active]:shadow-sm rounded-md"
          >
            Login with OTP
          </TabsTrigger>
          <TabsTrigger 
            value="password"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-[#161b22] data-[state=active]:text-gray-600 dark:data-[state=active]:text-gray-300 data-[state=active]:shadow-sm rounded-md"
          >
            Login with Password
          </TabsTrigger>
        </TabsList>
        <TabsContent value="otp">
          <div className=''>
            <div className='my-2'>
              <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
                Email address
              </label>
              <div className='relative'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <MailIcon />
                </div>
                <Input
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) onSend();
                  }}
                  className='pl-9 h-10 bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 rounded-lg transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600'
                />
              </div>
              {error && (
                <p className='text-xs text-red-500 flex items-center gap-1.5 mt-1'>
                  <span className='w-1 h-1 rounded-full bg-red-500 shrink-0' />
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={onSend}
              disabled={loading || !isValidEmail(email)}
              className='w-full mt-4 h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium text-sm gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-indigo-500/25'>
              {loading ? (
                <>
                  <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Sending code…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRightIcon />
                </>
              )}
            </Button>

            <p className='text-xs text-center text-gray-400 dark:text-gray-600 pt-3'>
              We'll send a one-time code to verify your identity
            </p>
          </div>
        </TabsContent>
        <TabsContent value="password">
          <div className=''>
            <div className='my-2'>
              <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
                Email address
              </label>
              <div className='relative mb-4'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <MailIcon />
                </div>
                <Input
                  type='email'
                  placeholder='you@example.com'
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className='pl-9 h-10 bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 rounded-lg transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600'
                />
              </div>
              <label className='block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none'>
                  <LockIcon />
                </div>
                <Input
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) onPasswordLogin();
                  }}
                  className='pl-9 h-10 bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:focus:ring-indigo-400/20 rounded-lg transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600'
                />
              </div>
              {error && (
                <p className='text-xs text-red-500 flex items-center gap-1.5 mt-2'>
                  <span className='w-1 h-1 rounded-full bg-red-500 shrink-0' />
                  {error}
                </p>
              )}
            </div>

            <Button
              onClick={onPasswordLogin}
              disabled={loading || !isValidEmail(email) || !password}
              className='w-full mt-4 h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium text-sm gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-indigo-500/25'>
              {loading ? (
                <>
                  <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    );
  }

  // ── OTP Step ────────────────────────────────────────────────────────────────
  return (
    <div className='my-6'>
      {/* Email confirmation badge */}
      <button
        type='button'
        onClick={() => {
          setStep('email');
          setOtp('');
          setError('');
        }}
        className='group flex items-center gap-2 w-full px-3 py-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 transition-colors'>
        <CheckCircleIcon />
        <div className='text-left flex-1 min-w-0'>
          <p className='text-xs text-indigo-600 dark:text-indigo-400 font-medium'>
            Code sent to
          </p>
          <p className='text-sm font-semibold text-gray-900 dark:text-gray-100 truncate'>
            {email}
          </p>
        </div>
        <span className='text-xs text-indigo-500 dark:text-indigo-400 group-hover:underline shrink-0'>
          Change
        </span>
      </button>

      {/* OTP */}
      <div className='my-3'>
        <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
          Verification code
        </label>
        <div className='flex justify-center mt-1.5'>
          <OtpInput value={otp} onChange={setOtp} />
        </div>
        {error && (
          <p className='text-xs text-red-500 flex items-center gap-1.5'>
            <span className='w-1 h-1 rounded-full bg-red-500 shrink-0' />
            {error}
          </p>
        )}
      </div>

      {/* Verify */}
      <Button
        onClick={onVerify}
        disabled={loading || otp.length !== 6}
        className='w-full h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg font-medium text-sm gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-indigo-500/25'>
        {loading ? (
          <>
            <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
            Verifying…
          </>
        ) : (
          <>
            Verify &amp; sign in
            <ArrowRightIcon />
          </>
        )}
      </Button>

      {/* Resend */}
      <div className='flex mt-4 justify-center'>
        <button
          type='button'
          disabled={left > 0 || loading}
          onClick={onSend}
          className='text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'>
          {left > 0 ? (
            <span>
              Resend code in{' '}
              <b className='text-indigo-600 dark:text-indigo-400'>{left}s</b>
            </span>
          ) : (
            'Resend code'
          )}
        </button>
      </div>
    </div>
  );
}
