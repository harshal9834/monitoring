import React, { useState } from 'react';
import {
  Shield,
  Eye,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Building2,
  UserCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { appState } from '../../services/storage';
import { api } from '../../services/api';

interface AuthModalProps {
  initialMode?: 'login' | 'signup' | 'forgot' | 'verify';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'login',
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>(initialMode);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('rajesh.sharma@msde.gov.in');
  const [loginPassword, setLoginPassword] = useState('Officer@2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginRoleOption, setLoginRoleOption] = useState<'GOVERNMENT_OFFICER' | 'CENTRE_ADMIN' | 'SUPER_ADMIN'>('GOVERNMENT_OFFICER');

  // Signup form state
  const [accountType, setAccountType] = useState<'TRAINING_CENTRE' | 'GOVERNMENT_OFFICER'>('TRAINING_CENTRE');
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupMobile, setSignupMobile] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Training centre specific
  const [centreCode, setCentreCode] = useState('');
  const [centreName, setCentreName] = useState('');
  // Officer specific
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState<string | null>(null);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentMsg, setForgotSentMsg] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const portalType =
        loginRoleOption === 'SUPER_ADMIN'
          ? 'admin'
          : loginRoleOption === 'CENTRE_ADMIN'
          ? 'centre'
          : 'government';

      const res = await api.login({
        email: loginEmail.trim(),
        password: loginPassword,
        portal_type: portalType,
      });

      localStorage.setItem('skillguard_token', res.access_token);
      localStorage.setItem('skillguard_refresh_token', res.refresh_token);
      if (res.user) {
        appState.setCurrentUser(res.user);
      }
      onSuccess();
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials or role');
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signupPassword !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      alert('Please agree to statutory terms and privacy guidelines');
      return;
    }

    try {
      await api.register({
        name: fullName,
        email: signupEmail.trim(),
        password: signupPassword,
        phone: signupMobile,
        role: accountType === 'GOVERNMENT_OFFICER' ? 'MONITORING_OFFICER' : 'CENTRE_ADMIN',
        centre_code: accountType === 'TRAINING_CENTRE' ? centreCode : undefined,
        centre_name: accountType === 'TRAINING_CENTRE' ? centreName : undefined,
        department: accountType === 'GOVERNMENT_OFFICER' ? department : 'Training Centre Operations',
        designation: accountType === 'GOVERNMENT_OFFICER' ? designation : 'Centre Director',
      });

      setSignupSuccessMsg(
        accountType === 'GOVERNMENT_OFFICER'
          ? 'Account registered! Your account requires approval/verification by the Directorate before activation.'
          : 'Training Centre account registered! You can now log in to manage your centre.'
      );
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Section 10: Never reveal whether an email exists
    setForgotSentMsg('Password reset instructions have been sent if an account exists.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row max-h-[92vh] overflow-y-auto">
        {/* Left Branding Section (Section 7) */}
        <div className="md:w-5/12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">SkillGuard AI</h2>
                <p className="text-[11px] text-indigo-300 font-medium">Compliance & Monitoring Platform</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold leading-snug">
                Secure access to training-centre compliance monitoring.
              </h3>
              <p className="text-xs text-slate-300">
                Statutory AI verification enforcing attendance transparency, infrastructure compliance, and rapid action escalation.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-800 text-xs text-slate-200">
              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold block">AI Monitoring</span>
                  <span className="text-[10px] text-slate-400">YOLOv8m 15fps temporal verification</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold block">Secure Data</span>
                  <span className="text-[10px] text-slate-400">Encrypted logs & role-based isolation</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold block">Privacy First</span>
                  <span className="text-[10px] text-slate-400">Aggregate presence (Zero face recognition)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Statutory Security Standards */}
          <div className="mt-8 pt-4 border-t border-slate-800 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Statutory Security Standards
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              SkillGuard AI operates zero-trust role-based boundaries conforming to the DPDP Act. Every session is strictly authenticated and audit-logged.
            </p>
          </div>
        </div>

        {/* Right Section: Interactive Forms */}
        <div className="md:w-7/12 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex space-x-2 text-xs">
                <button
                  onClick={() => setMode('login')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    mode === 'signup' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <button
                onClick={onClose}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            {/* --- MODE: LOGIN --- */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Sign in to your portal</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your credentials verified by the Ministry database.</p>
                </div>

                {loginError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                {/* Role Option Selector (Section 7) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">Intended Role Access</label>
                  <div className="grid grid-cols-3 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLoginRoleOption('GOVERNMENT_OFFICER')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        loginRoleOption === 'GOVERNMENT_OFFICER'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Government Officer
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRoleOption('CENTRE_ADMIN')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        loginRoleOption === 'CENTRE_ADMIN'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Training Centre
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRoleOption('SUPER_ADMIN')}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        loginRoleOption === 'SUPER_ADMIN'
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    *Note: Role is cryptographically verified by backend. Selecting Admin does not grant privileges without valid account verification.
                  </p>
                </div>

                {/* Dev / Demo Credentials helper */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Demo Credentials</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (loginRoleOption === 'GOVERNMENT_OFFICER') {
                          setLoginEmail('government@skillguard.ai');
                          setLoginPassword('Government@123');
                        } else if (loginRoleOption === 'CENTRE_ADMIN') {
                          setLoginEmail('centre@skillguard.ai');
                          setLoginPassword('Centre@123');
                        } else {
                          setLoginEmail('admin@skillguard.ai');
                          setLoginPassword('Admin@123');
                        }
                      }}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs hover:bg-indigo-50 transition-colors"
                    >
                      Auto-Fill
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Email: </span>
                      <span className="font-semibold text-slate-900">
                        {loginRoleOption === 'GOVERNMENT_OFFICER'
                          ? 'government@skillguard.ai'
                          : loginRoleOption === 'CENTRE_ADMIN'
                          ? 'centre@skillguard.ai'
                          : 'admin@skillguard.ai'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Password: </span>
                      <span className="font-semibold text-slate-900">
                        {loginRoleOption === 'GOVERNMENT_OFFICER'
                          ? 'Government@123'
                          : loginRoleOption === 'CENTRE_ADMIN'
                          ? 'Centre@123'
                          : 'Admin@123'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="officer@msde.gov.in"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-[11px] text-indigo-600 hover:underline font-semibold"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
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
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* --- MODE: SIGNUP (Section 8) --- */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5 text-xs">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Create an Account</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Register your Training Centre or Government Officer profile.</p>
                </div>

                {signupSuccessMsg ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 space-y-2">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Registration Submitted</span>
                    </div>
                    <p className="text-[11px]">{signupSuccessMsg}</p>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="mt-2 px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Return to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Account Type Selector (Section 8: Do not allow public signup for Super Admin) */}
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Select Account Type</label>
                      <div className="grid grid-cols-2 gap-2 font-semibold">
                        <button
                          type="button"
                          onClick={() => setAccountType('TRAINING_CENTRE')}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            accountType === 'TRAINING_CENTRE'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Training Centre
                        </button>
                        <button
                          type="button"
                          onClick={() => setAccountType('GOVERNMENT_OFFICER')}
                          className={`p-2 rounded-xl border text-center transition-all ${
                            accountType === 'GOVERNMENT_OFFICER'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Government Officer
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          placeholder="Dr. Rajesh Kumar"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">
                          {accountType === 'GOVERNMENT_OFFICER' ? 'Official Email' : 'Email Address'}
                        </label>
                        <input
                          type="email"
                          required
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          placeholder={accountType === 'GOVERNMENT_OFFICER' ? 'name@gov.in' : 'admin@centre.org'}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-0.5">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={signupMobile}
                        onChange={(e) => setSignupMobile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                        placeholder="+91 98000 12345"
                      />
                    </div>

                    {/* Centre-specific fields */}
                    {accountType === 'TRAINING_CENTRE' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-0.5">Centre Code</label>
                          <input
                            type="text"
                            required
                            value={centreCode}
                            onChange={(e) => setCentreCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            placeholder="MH-PUN-TC-0999"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-0.5">Centre Name</label>
                          <input
                            type="text"
                            required
                            value={centreName}
                            onChange={(e) => setCentreName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            placeholder="National Skill Hub"
                          />
                        </div>
                      </div>
                    )}

                    {/* Officer-specific fields */}
                    {accountType === 'GOVERNMENT_OFFICER' && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="font-semibold text-slate-700 block mb-0.5">Department</label>
                          <input
                            type="text"
                            required
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            placeholder="State Skill Mission"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-0.5">Designation</label>
                          <input
                            type="text"
                            required
                            value={designation}
                            onChange={(e) => setDesignation(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            placeholder="Assistant Director"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 block mb-0.5">Employee ID</label>
                          <input
                            type="text"
                            required
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                            placeholder="EMP-8842"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">Password</label>
                        <input
                          type="password"
                          required
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-700 block mb-0.5">Confirm Password</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <label className="flex items-start space-x-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>
                        I accept the statutory monitoring guidelines and statutory privacy terms.
                      </span>
                    </label>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </form>
            )}

            {/* --- MODE: FORGOT PASSWORD (Section 10) --- */}
            {mode === 'forgot' && (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Forgot Password</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Enter your registered email address to receive password reset instructions.
                  </p>
                </div>

                {forgotSentMsg ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-2">
                    <p className="font-semibold">{forgotSentMsg}</p>
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900"
                        placeholder="officer@msde.gov.in"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Send Reset Link
                    </button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                      >
                        Cancel and return to login
                      </button>
                    </div>
                  </>
                )}
              </form>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>SkillGuard AI v1.4 • NIC Certified Node</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              256-Bit SSL Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
