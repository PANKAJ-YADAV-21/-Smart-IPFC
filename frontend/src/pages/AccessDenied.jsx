import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AccessDenied = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="bg-orbs"></div>

      <div className="max-w-md w-full animate-slide-up relative z-10 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
          <ShieldAlert className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-3 tracking-tight">Access Denied</h1>
        <p className="text-slate-400 font-medium mb-8">
          Your account role does not have the necessary permissions to access this page.
        </p>

        <div className="glass-card shadow-2xl backdrop-blur-xl border border-white/10 p-8">
          <p className="text-slate-300 mb-6 leading-relaxed">
            If you believe this is a mistake, please reach out to system administrators or try signing in with a different account.
          </p>

          <Link 
            to="/dashboard"
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
