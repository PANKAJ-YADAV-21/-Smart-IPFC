import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

const VerifyEmail = () => {
  const { resendVerificationPublic } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Extract email from query parameter
  const query = new URLSearchParams(window.location.search);
  const email = query.get('email') || '';

  const handleResend = async () => {
    if (!email) {
      setError('No email address provided. Please go back to login.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await resendVerificationPublic(email);
      setMessage(res.message || 'A new verification link has been sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-orbs"></div>

      <div className="max-w-md w-full animate-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl mb-5 shadow-[0_0_30px_rgba(2,132,199,0.3)]">
            <Mail className="w-12 h-12 text-primary-400 animate-bounce" />
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">Verify Your Email</h1>
          <p className="text-slate-400 font-medium">A verification link has been sent to your email.</p>
        </div>

        <div className="glass-card shadow-2xl backdrop-blur-xl border border-white/10 p-8 text-center">
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm mb-6 font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 font-medium">
              {error}
            </div>
          )}

          <p className="text-slate-300 mb-8 leading-relaxed">
            Please verify your email to activate your account. Check your inbox (and spam folder) for the link we sent to <strong className="text-white">{email || 'your email'}</strong>.
          </p>

          <button 
            onClick={handleResend}
            disabled={loading} 
            className="btn-primary w-full flex items-center justify-center gap-2 mb-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Resend Verification Link</span>}
          </button>
          
          <Link 
            to="/login"
            className="text-primary-400 text-sm hover:underline font-semibold flex items-center justify-center w-full gap-2 mt-4"
          >
            Back to Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
