import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';

function getRouterBase() {
  const rawBase = import.meta.env.VITE_APP_BASE_PATH?.trim() || '/';
  if (rawBase === '/') return '/';

  const withLeadingSlash = rawBase.startsWith('/') ? rawBase : `/${rawBase}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={getRouterBase()}>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
    <ToastContainer position='top-right' theme='colored' />
  </StrictMode>,
);
