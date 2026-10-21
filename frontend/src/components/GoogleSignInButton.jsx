import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import './GoogleSignInButton.css';

export default function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  theme = 'outline', // 'outline' | 'filled_black'
  divider = true,
  dividerPosition = 'top', // 'top' | 'bottom'
}) {
  const { loginWithGoogle } = useAuth();
  const buttonRef = useRef(null);
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    if (!clientId || !buttonRef.current) return;

    let isCancelled = false;

    const initAndRender = () => {
      if (isCancelled || !buttonRef.current || !window.google?.accounts?.id) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response || !response.credential) {
              if (onError) onError(new Error('No credential returned from Google'));
              return;
            }
            try {
              const res = await loginWithGoogle(response.credential);
              if (onSuccess) onSuccess(res?.user);
            } catch (err) {
              console.error('Google Sign-In failed:', err);
              if (onError) onError(err);
            }
          },
        });

        // Clear any previous render
        buttonRef.current.innerHTML = '';

        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: theme || 'outline',
          size: 'large',
          type: 'standard',
          shape: 'rectangular',
          text: text || 'continue_with',
          logo_alignment: 'left',
          width: buttonRef.current.offsetWidth || 300,
        });
      } catch (err) {
        console.error('Failed to initialize Google button:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initAndRender();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initAndRender();
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 10000);

      return () => {
        isCancelled = true;
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }

    return () => {
      isCancelled = true;
    };
  }, [clientId, theme, text, loginWithGoogle, onSuccess, onError]);

  // If client ID is missing, completely hide the Google button & divider
  if (!clientId) {
    return null;
  }

  return (
    <div className="google-auth-container">
      {divider && dividerPosition === 'top' && (
        <div className="google-auth-divider" role="separator" aria-label="Alternative sign-in option">
          <span className="google-auth-divider-line" />
          <span className="google-auth-divider-text">OR</span>
          <span className="google-auth-divider-line" />
        </div>
      )}

      <div className="google-auth-btn-wrap">
        <div ref={buttonRef} className="google-auth-official-btn" />
      </div>

      {divider && dividerPosition === 'bottom' && (
        <div className="google-auth-divider" role="separator" aria-label="Alternative sign-in option">
          <span className="google-auth-divider-line" />
          <span className="google-auth-divider-text">OR</span>
          <span className="google-auth-divider-line" />
        </div>
      )}
    </div>
  );
}

