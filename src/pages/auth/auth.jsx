// src/pages/auth/auth.jsx
import * as React from 'react';
import LoginForm from './login';
import loginBg from '@/assets/login_bg.png';

export default function AuthPage() {
  React.useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (d) => document.documentElement.classList.toggle('dark', d);
    apply(mql.matches);
    const onChange = (e) => apply(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return (
    <div className='flex min-h-screen w-full'>
      {/* ── Left panel: hero image ── */}
      <div className='hidden lg:flex lg:w-[55%] xl:w-[60%] relative overflow-hidden flex-shrink-0'>
        <img
          src={loginBg}
          alt='Galaxy Travel'
          className='absolute inset-0 w-full h-full object-cover object-center'
        />
        {/* gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-br from-[#0d1b3e]/70 via-transparent to-[#0a1628]/50' />
        {/* branding */}
        <div className='relative z-10 flex flex-col justify-between p-10 w-full'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center'>
              <svg
                viewBox='0 0 24 24'
                fill='none'
                className='w-5 h-5 text-white'>
                <path
                  d='M12 2L2 7l10 5 10-5-10-5z'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinejoin='round'
                />
                <path
                  d='M2 17l10 5 10-5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinejoin='round'
                />
                <path
                  d='M2 12l10 5 10-5'
                  stroke='currentColor'
                  strokeWidth='1.5'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <span className='text-white font-semibold text-lg tracking-tight'>
              Galaxy Travel
            </span>
          </div>

          <div className='max-w-sm'>
            <div className='inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 mb-5'>
              <span className='w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse' />
              <span className='text-white/80 text-xs font-medium'>
                Admin Dashboard
              </span>
            </div>
            <h2 className='text-4xl xl:text-5xl font-bold text-white leading-tight mb-4'>
              Manage your
              <br />
              <span className='text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-300'>
                travel empire
              </span>
            </h2>
            <p className='text-white/60 text-sm leading-relaxed'>
              Full control over bookings, tours, users, content and analytics —
              all in one place.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel: login card ── */}
      <div className='flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0d1117] px-8 py-16 min-h-screen'>
        {/* Mobile brand */}
        <div className='lg:hidden flex items-center gap-2 mb-10'>
          <div className='w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center'>
            <svg viewBox='0 0 24 24' fill='none' className='w-4 h-4 text-white'>
              <path
                d='M12 2L2 7l10 5 10-5-10-5z'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinejoin='round'
              />
              <path
                d='M2 17l10 5 10-5'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinejoin='round'
              />
              <path
                d='M2 12l10 5 10-5'
                stroke='currentColor'
                strokeWidth='1.5'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <span className='text-gray-900 dark:text-white font-bold text-lg'>
            Galaxy Travel
          </span>
        </div>

        <div className='w-full max-w-[420px]'>
          {/* Header */}
          <div className='mb-8'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-2'>
              Welcome back
            </h1>
            <p className='text-sm text-gray-500 dark:text-gray-400'>
              Sign in to your dashboard
            </p>
          </div>

          {/* Card */}
          <div className='bg-white dark:bg-[#161b22] rounded-2xl border border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none p-4'>
            <LoginForm />
          </div>

          {/* Footer */}
          <p className='mt-8 text-center text-xs text-gray-400 dark:text-gray-600'>
            By continuing you agree to our{' '}
            <span className='underline underline-offset-2 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition-colors'>
              Terms
            </span>{' '}
            &amp;{' '}
            <span className='underline underline-offset-2 cursor-pointer hover:text-gray-600 dark:hover:text-gray-400 transition-colors'>
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
