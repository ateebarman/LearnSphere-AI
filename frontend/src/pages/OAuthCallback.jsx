import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      
      if (token) {
        try {
          // Temporarily set the token with temporary user object
          login({ name: 'User' }, token);
          // Fetch the real user info using the token
          await refreshProfile();
          navigate('/dashboard', { replace: true });
        } catch (err) {
          console.error('Failed to fetch profile after OAuth', err);
          setError(true);
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        setError(true);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, refreshProfile, navigate]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card-premium max-w-sm w-full text-center py-10"
      >
        {error ? (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
            <p className="text-slate-500 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Authenticating...</h2>
            <p className="text-slate-500 text-sm">Please wait while we log you in.</p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default OAuthCallback;
