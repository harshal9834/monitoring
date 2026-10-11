import React, { useState } from 'react';
import { Building2, ArrowLeft, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

interface CentreSignupProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const CentreSignupView: React.FC<CentreSignupProps> = ({ onBack, onSuccess }) => {
  const [centreName, setCentreName] = useState('');
  const [centreCode, setCentreCode] = useState('');
  const [centreAddress, setCentreAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!termsAccepted) {
      alert('Please agree to terms and privacy guidelines');
      return;
    }

    try {
      await api.register({
        name: contactPerson,
        email: officialEmail,
        password: password || 'Centre@2026',
        phone: mobile,
        role: 'CENTRE_ADMIN',
        centre_code: centreCode,
        centre_name: centreName,
        district: district || 'Pune',
        designation: 'Centre Head',
        department: 'Vocational Operations',
      });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 font-sans">
      <div className="max-w-xl mx-auto w-full">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Centre Login</span>
        </button>

        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Register Training Centre</h2>
            <p className="text-xs text-slate-500">
              Submit accredited vocational centre details for government compliance onboarding.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-emerald-900">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Registration Submitted Successfully</span>
              </div>
              <p className="text-xs leading-relaxed">
                Check your email to verify your account. Your centre profile is currently under
                <strong> Account Pending Approval</strong> by the Directorate. Once verified, Centre Login will be enabled.
              </p>
              <button
                type="button"
                onClick={onSuccess}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Centre Name</label>
                  <input
                    type="text"
                    required
                    value={centreName}
                    onChange={(e) => setCentreName(e.target.value)}
                    placeholder="National Institute of Technology Skill Centre"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Centre Code</label>
                  <input
                    type="text"
                    required
                    value={centreCode}
                    onChange={(e) => setCentreCode(e.target.value)}
                    placeholder="MH-PUN-TC-0992"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Centre Address</label>
                <input
                  type="text"
                  required
                  value={centreAddress}
                  onChange={(e) => setCentreAddress(e.target.value)}
                  placeholder="Plot 44, Electronic Zone, Hinjawadi Phase 2"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Pune"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Contact Person (Principal/Director)</label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Vikram Desai"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Approved Capacity</label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    placeholder="admin@centre.org"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98230 45678"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                  />
                </div>
              </div>

              <label className="flex items-start space-x-2 text-[11px] text-slate-600 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>I agree to the Terms of Service & Statutory Privacy Guidelines.</span>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Create Centre Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
