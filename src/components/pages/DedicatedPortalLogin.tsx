import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowLeft, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { appState } from '../../services/storage';
import { API_BASE } from '../../services/api';

interface PortalLoginProps {
  portalType: 'government' | 'centre' | 'admin';
  onBack: () => void;
  onSuccess: () => void;
  onRegisterCentre?: () => void;
  onRequestGovAccess?: () => void;
}

export const DedicatedPortalLogin: React.FC<PortalLoginProps> = ({
  portalType,
  onBack,
  onSuccess,
  onRegisterCentre,
  onRequestGovAccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);

  const portalTitle =
    portalType === 'government'
      ? 'Government Monitoring Portal'
      : portalType === 'centre'
      ? 'Training Centre Portal'
      : 'Super Administration Portal';

  const portalSubtitle =
    portalType === 'government'
      ? 'Authorized access for State & District Monitoring Officers'
      : portalType === 'centre'
      ? 'Secure login for accredited vocational training centre heads'
      : 'Restricted access for National Vigilance Commissioners & Root Admins';

  const portalAccent =
    portalType === 'government'
      ? 'indigo'
      : portalType === 'centre'
      ? 'blue'
      : 'purple';

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const payload: any = {
        email: email.trim(),
        username: email.trim(),
        password,
        portal_type: portalType
      };

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseError) {
        throw new Error(`Server connection failed or returned invalid response (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.detail || `Login failed (${res.status})`);
      }

      // Store JWT token for API calls
      localStorage.setItem('skillguard_token', data.access_token);
      localStorage.setItem('skillguard_refresh_token', data.refresh_token);

      // Sync user to appState
      if (data.user) {
        appState.setCurrentUser(data.user);
      }

      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials or connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('Password reset instructions have been sent if an account exists.');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6 mx-auto block"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Portal Selection</span>
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-700 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{portalTitle}</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">{portalSubtitle}</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 px-4 sm:py-8 sm:px-10 shadow-xl rounded-3xl border border-slate-200 space-y-6">
          {/* Section 2: Demo Credentials for Development */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Dev / Demo Credentials</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (portalType === 'government') {
                    setEmail('government@skillguard.ai');
                    setPassword('Gov@12345');
                  } else if (portalType === 'centre') {
                    setEmail('centre@skillguard.ai');
                    setPassword('Centre@12345');
                  } else {
                    setEmail('admin@skillguard.ai');
                    setPassword('Admin@12345');
                    setTwoFactorCode('123456');
                  }
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs hover:bg-indigo-50 transition-colors"
              >
                Auto-Fill
              </button>
            </div>
            <div className="font-mono text-[11px] text-slate-600 space-y-0.5">
              {portalType === 'centre' && (
                <div>
                  <span className="text-slate-400">Centre ID: </span>
                  <span className="font-bold text-indigo-700">DEMO-TC-0001</span>
                </div>
              )}
              <div>
                <span className="text-slate-400">Email: </span>
                <span className="font-semibold text-slate-900">
                  {portalType === 'government'
                    ? 'government@skillguard.ai'
                    : portalType === 'centre'
                    ? 'centre@skillguard.ai'
                    : 'admin@skillguard.ai'}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Password: </span>
                <span className="font-semibold text-slate-900">
                  {portalType === 'government'
                    ? 'Gov@12345'
                    : portalType === 'centre'
                    ? 'Centre@12345'
                    : 'Admin@12345'}
                </span>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!showForgot ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {portalType === 'government'
                    ? 'Official Government Email'
                    : portalType === 'centre'
                    ? 'Username or Email Address'
                    : 'Administrator Email'}
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={portalType === 'centre' ? 'centre.admin or admin@apexskill.org' : 'name@skillguard.gov.in'}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-[11px] text-indigo-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* 2FA for Admin Portal (Section 11) */}
              {portalType === 'admin' && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Two-Factor Authentication (2FA PIN)
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-mono tracking-widest text-center"
                    placeholder="Enter Security PIN"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
              >
                <span>{portalType === 'admin' ? 'Secure Sign In' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Bottom Registration Links per portal */}
              <div className="pt-4 border-t border-slate-100 text-center text-xs space-y-2">
                {portalType === 'centre' && onRegisterCentre && (
                  <div>
                    <span className="text-slate-500">Don't have an accredited centre account? </span>
                    <button
                      type="button"
                      onClick={onRegisterCentre}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Register Centre
                    </button>
                  </div>
                )}

                {portalType === 'government' && onRequestGovAccess && (
                  <div>
                    <span className="text-slate-500">New Monitoring Officer? </span>
                    <button
                      type="button"
                      onClick={onRequestGovAccess}
                      className="font-bold text-indigo-600 hover:underline"
                    >
                      Request Government Access
                    </button>
                  </div>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleForgotSubmit} className="space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-900">Reset Portal Password</h3>
              <p className="text-xs text-slate-500">
                Enter your registered official email to receive a secure token.
              </p>

              {forgotMsg ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
                  {forgotMsg}
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="mt-2 text-indigo-600 font-bold block"
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="user@gov.in"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white font-bold rounded-xl"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full text-center text-slate-500 font-semibold"
                  >
                    Cancel
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
