import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, Key, ShieldAlert, CheckCircle2 } from 'lucide-react';

const Login = () => {
  // State for login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResendBtn, setShowResendBtn] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const { login, forgotPassword, resetPassword, resendVerificationPublic } = useAuth();
  const navigate = useNavigate();

  // State for Forgot Password flow
  // 'login' | 'forgot_email' | 'forgot_otp'
  const [view, setView] = useState('login'); 
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle URL parameters (verification status)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const verified = query.get('verified');
    const err = query.get('error');
    const errEmail = query.get('email');

    if (verified === '1') {
      setMessage('Your email has been verified successfully! You can now log in.');
    } else if (err === 'expired') {
      setError('Your verification link has expired. Please request a new one.');
      if (errEmail) {
        setUnverifiedEmail(decodeURIComponent(errEmail));
        setShowResendBtn(true);
      }
    } else if (err === 'invalid') {
      setError('The verification link is invalid. Please request a new one.');
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setShowResendBtn(false);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      if (err.response?.status === 403) {
        // Unverified email check
        setError(err.response?.data?.message || 'Please verify your email before logging in.');
        setUnverifiedEmail(email);
        setShowResendBtn(true);
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublicResend = async () => {
    if (!unverifiedEmail) return;
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const res = await resendVerificationPublic(unverifiedEmail);
      setMessage(res.message || 'Verification link resent successfully!');
      setShowResendBtn(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(forgotEmail);
      setMessage(res.message || 'OTP sent successfully to your email.');
      setView('forgot_otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send recovery OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await resetPassword({
        email: forgotEmail,
        otp: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      setMessage(res.message || 'Password reset successfully! Please sign in.');
      setView('login');
      // Autofill email for user convenience
      setEmail(forgotEmail);
      // Reset flow states
      setForgotEmail('');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Check your OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      {/* Dynamic Background Orbs */}
      <div className="bg-orbs"></div>
      
      <div className="max-w-md w-full animate-slide-up relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-primary-500/20 to-primary-600/10 rounded-2xl mb-5 shadow-[0_0_30px_rgba(2,132,199,0.3)]">
            {view === 'login' ? (
              <ShieldCheck className="w-12 h-12 text-primary-400" />
            ) : (
              <Key className="w-12 h-12 text-primary-400 animate-pulse" />
            )}
          </div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">
            {view === 'login' && 'IPFCMS Portal'}
            {view === 'forgot_email' && 'Password Recovery'}
            {view === 'forgot_otp' && 'Reset Password'}
          </h1>
          <p className="text-slate-400 font-medium">
            {view === 'login' && 'Secure Enterprise Intellectual Property'}
            {view === 'forgot_email' && 'Enter your registered Gmail address'}
            {view === 'forgot_otp' && 'Verify code and set your new credentials'}
          </p>
        </div>

        <div className="glass-card shadow-2xl backdrop-blur-xl border border-white/10 p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-6 text-center font-medium">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg text-sm mb-6 text-center font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* VIEW: LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="name@company.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-sm font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => { setView('forgot_email'); setError(''); setMessage(''); setShowResendBtn(false); }}
                    className="text-xs font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>

              {showResendBtn && (
                <button
                  type="button"
                  onClick={handlePublicResend}
                  disabled={isSubmitting}
                  className="w-full text-sm font-bold text-primary-400 hover:underline flex items-center justify-center gap-2 pt-2 transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Resend Verification Link'}
                </button>
              )}
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - EMAIL SUBMIT */}
          {view === 'forgot_email' && (
            <form onSubmit={handleForgotEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Gmail Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="input-field pl-11"
                    placeholder="your-gmail@gmail.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset OTP'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setMessage(''); }}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* VIEW: FORGOT PASSWORD - OTP + RESET SUBMIT */}
          {view === 'forgot_otp' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Enter 6-Digit OTP</label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="input-field pl-11 tracking-[0.2em] font-bold font-mono"
                    placeholder="000000"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Create New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300 ml-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pl-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(''); setMessage(''); }}
                  className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel and Sign In
                </button>
              </div>
            </form>
          )}

          {view === 'login' && (
            <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
              <p className="text-slate-400 text-sm font-medium">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-400 hover:text-primary-300 font-bold transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          )}
        </div>
        
        <p className="mt-8 text-center text-slate-500 text-xs">
          Secure Enterprise Access • © 2026 IPFCMS
        </p>
      </div>
    </div>
  );
};

export default Login;
