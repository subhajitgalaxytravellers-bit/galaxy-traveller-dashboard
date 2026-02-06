import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { GoogleOAuthProvider } from '@react-oauth/google';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GoogleOAuthProvider
          clientId={`707115021884-av20ojvtc8c37pkn98bcsnau33hie2b5.apps.googleusercontent.com`}>
          <App />
        </GoogleOAuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
    <ToastContainer position='top-right' theme='colored' />
  </StrictMode>,
);
