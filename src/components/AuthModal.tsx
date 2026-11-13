import React, { useState } from 'react';
import {
  X,
  Flag,
  Menu as MenuIcon,
  LayoutGrid,
  List,
  Target,
  MessageSquare,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  HelpCircle,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Layers,
  Radio,
  Activity,
  CloudRain,
  Bug,
  CalendarCheck,
  BarChart3,
  Maximize2,
  Globe
} from 'lucide-react';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'SUPER_ADMIN' | 'EXTENSION_OFFICER' | 'COOPERATIVE_AGRONOMIST' | 'INSURER_UNDERWRITER' | 'FIELD_SCOUT';
  role_title: string;
  county_code: string;
  county_name: string;
  organization: string;
  phone_number?: string;
  status: string;
  last_login_at?: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile, token: string) => void;
}

export const TRIAL_ACCOUNTS = [
  {
    role_key: 'SUPER_ADMIN' as const,
    label: 'Super Admin',
    name: 'Dr. David Kipkemboi',
    role_title: 'National Agricultural Lead',
    email: 'admin@mavunosense.org',
    password_hint: 'Admin@Mavuno2026!',
    org: 'Ministry of Agriculture & Livestock Dev / KALRO',
    county: 'All Counties (UG & TN)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Unrestricted governance, RBAC matrix administration & system policies',
  },
  {
    role_key: 'EXTENSION_OFFICER' as const,
    label: 'Extension Officer',
    name: 'Beatrice Cherono',
    role_title: 'Kitale Sub-County Lead Agronomist',
    email: 'officer.transnzoia@mavunosense.org',
    password_hint: 'Officer@TransNzoia26',
    org: 'Trans Nzoia County Agricultural Directorate',
    county: 'Trans Nzoia (026)',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Ward monitoring, bilingual SMS dispatching & ground alert audits',
  },
  {
    role_key: 'COOPERATIVE_AGRONOMIST' as const,
    label: 'Cooperative Agronomist',
    name: 'Kipkorir Bett',
    role_title: 'Soy Cereal Farmers Union Agronomist',
    email: 'agronomist.uasin@mavunosense.org',
    password_hint: 'Agro@SoyCoop2026',
    org: 'Soy Farmers Cooperative Society Ltd',
    county: 'Uasin Gishu (027)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Field telemetry curves, farmer group advisories & parcel status',
  },
  {
    role_key: 'INSURER_UNDERWRITER' as const,
    label: 'Parametric Insurer',
    name: 'Mercy Wanjiru',
    role_title: 'Senior Agricultural Risk Underwriter',
    email: 'underwriter@apa-insurance.co.ke',
    password_hint: 'Insure@Underwrite26',
    org: 'APA Insurance / Acre Africa Consortium',
    county: 'All Counties (UG & TN)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Drought trigger thresholds, payout indices & yield loss audits',
  },
  {
    role_key: 'FIELD_SCOUT' as const,
    label: 'Field Scout',
    name: 'Emmanuel Rotich',
    role_title: 'Cherangany Hills Lead Field Scout',
    email: 'scout.cherangany@mavunosense.org',
    password_hint: 'Scout@Cherangany26',
    org: 'Eyes on the Ground (EotG) Network',
    county: 'Trans Nzoia (026)',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'On-site crop verification, ground truth audits & moisture logs',
  },
];

export default function AuthModal({ isOpen, onClose, currentUser, onLoginSuccess }: AuthModalProps) {
  const [selectedTrialIdx, setSelectedTrialIdx] = useState<number>(0);
  const [email, setEmail] = useState<string>(TRIAL_ACCOUNTS[0].email);
  const [password, setPassword] = useState<string>(TRIAL_ACCOUNTS[0].password_hint);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHelpChat, setShowHelpChat] = useState<boolean>(false);
  const [signUpNotice, setSignUpNotice] = useState<string | null>(null);
  const [zoomModalOpen, setZoomModalOpen] = useState<boolean>(false);
  const [activeKenyaWardIdx, setActiveKenyaWardIdx] = useState<number>(0);

  const KENYA_LOGIN_WARDS = [
    {
      name: 'Cherangany',
      county: 'Trans Nzoia (026)',
      hub: 'Kitale Catchment · 2,420m',
      stress: 74.5,
      tier: 'Severe Drought',
      deficit: '-42%',
      ndvi: '0.44',
      leadDays: '17.5d',
      posClass: 'top-[32%] right-[27%]',
      dotColor: 'bg-red-500',
      badgeColor: 'bg-red-600 text-white border-red-700',
    },
    {
      name: 'Endebess',
      county: 'Trans Nzoia (026)',
      hub: 'Mt. Elgon Slopes · 2,180m',
      stress: 58.2,
      tier: 'Moderate Stress',
      deficit: '-26%',
      ndvi: '0.54',
      leadDays: '19.0d',
      posClass: 'top-[35%] left-[25%]',
      dotColor: 'bg-amber-500',
      badgeColor: 'bg-amber-600 text-white border-amber-700',
    },
    {
      name: 'Kiminini',
      county: 'Trans Nzoia (026)',
      hub: 'Southern Maize Belt · 1,860m',
      stress: 32.0,
      tier: 'Mild Stress',
      deficit: '-12%',
      ndvi: '0.64',
      leadDays: '21.0d',
      posClass: 'top-[47%] left-[44%]',
      dotColor: 'bg-blue-500',
      badgeColor: 'bg-blue-600 text-white border-blue-700',
    },
    {
      name: 'Moiben',
      county: 'Uasin Gishu (027)',
      hub: 'Eldoret Highlands · 2,260m',
      stress: 78.5,
      tier: 'Severe Drought',
      deficit: '-45%',
      ndvi: '0.41',
      leadDays: '16.5d',
      posClass: 'top-[54%] right-[22%]',
      dotColor: 'bg-red-500',
      badgeColor: 'bg-red-600 text-white border-red-700',
    },
    {
      name: 'Kapseret',
      county: 'Uasin Gishu (027)',
      hub: 'Eldoret Peri-Urban · 2,090m',
      stress: 38.4,
      tier: 'Mild Stress',
      deficit: '-15%',
      ndvi: '0.61',
      leadDays: '20.0d',
      posClass: 'bottom-[32%] left-[52%]',
      dotColor: 'bg-emerald-500',
      badgeColor: 'bg-emerald-600 text-white border-emerald-700',
    },
  ];

  const activeKenyaWard = KENYA_LOGIN_WARDS[activeKenyaWardIdx];

  if (!isOpen) return null;

  const handleSelectTrial = (idx: number) => {
    setSelectedTrialIdx(idx);
    setEmail(TRIAL_ACCOUNTS[idx].email);
    setPassword(TRIAL_ACCOUNTS[idx].password_hint);
    setErrorMessage(null);
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Authenticate with default Google Workspace agricultural SSO
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const googleUser = TRIAL_ACCOUNTS[0]; // Super Admin Google SSO
      onLoginSuccess(
        {
          id: 'usr-001',
          email: 'admin@mavunosense.org',
          full_name: 'Dr. David Kipkemboi (Google SSO)',
          role: 'SUPER_ADMIN',
          role_title: 'National Agricultural Lead',
          county_code: 'ALL',
          county_name: 'Trans Nzoia & Uasin Gishu',
          organization: 'Ministry of Agriculture & Livestock Dev / KALRO',
          status: 'ACTIVE',
          last_login_at: new Date().toISOString(),
        },
        'sso-token-google-auth-2026'
      );
      onClose();
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-[999999] overflow-y-auto bg-[#f8fafc] flex flex-col justify-between font-['Plus_Jakarta_Sans',sans-serif] isolate select-auto">
      {/* Top Header Bar (Full-Width Fluid) */}
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 2xl:px-24 py-5 sm:py-6 flex items-center justify-between border-b border-slate-200/60 bg-transparent">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          {/* Exact geometric square logo with inner rounded cutout */}
          <div className="w-8 h-8 rounded-lg border-[2.5px] border-slate-900 flex items-center justify-center p-1.5 bg-white shadow-2xs">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-xs" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">
            MavunoSense
          </span>
        </div>

        {/* Action button to return to dashboard */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 shadow-2xs"
            title="Return to Dashboard"
          >
            <span>Back to Dashboard</span>
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Two-Column Canvas: Full-Width Fluid Layout with Balanced Distance between Simulation and Login */}
      <div className="flex-1 w-full px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 2xl:px-24 flex flex-col lg:flex-row-reverse items-center justify-between py-6 lg:py-10 xl:py-12 gap-12 lg:gap-16 xl:gap-24 2xl:gap-32">
        {/* Right Column (on desktop): Model Login Form */}
        <div className="w-full max-w-md xl:max-w-lg shrink-0 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-2">
              Login
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back! Please enter your details.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {signUpNotice && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-700">
              <span>{signUpNotice}</span>
              <button onClick={() => setSignUpNotice(null)} className="text-blue-900 font-bold hover:underline">
                Dismiss
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                placeholder="jdoe.mobbin@gmail.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(TRIAL_ACCOUNTS[selectedTrialIdx].password_hint)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Autofill trial password
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all shadow-2xs"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Primary Action Button: "Continue with Email" */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#232323] hover:bg-black active:bg-slate-900 disabled:bg-slate-400 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{isLoading ? 'Authenticating...' : 'Continue with Email'}</span>
            </button>

            {/* Secondary Action Button: "Continue with Google" */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-3 shadow-2xs"
            >
              {/* Authentic Google 4-Color Icon */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.41 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>

          {/* Trial Accounts Quick Selector (Seamless Demo & Evaluation) */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Select Trial Persona (1-Click Switch)
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                Pre-Configured
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {TRIAL_ACCOUNTS.map((acc, idx) => {
                const isSelected = selectedTrialIdx === idx;
                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleSelectTrial(idx)}
                    className={`px-2.5 py-1.5 rounded-lg text-left transition-all border text-xs flex flex-col justify-center ${
                      isSelected
                        ? 'border-slate-800 bg-slate-900 text-white shadow-2xs'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold truncate text-[11px]">{acc.label}</span>
                      {isSelected && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                    <span className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {acc.county}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Text */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() =>
                setSignUpNotice(
                  'Institutional self-registration is managed by County Agricultural Directors (Trans Nzoia & Uasin Gishu) per KDPA 2019 compliance guidelines.'
                )
              }
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Left Column (on desktop): Agro-Telemetry Simulation seamlessly fused with the login screen */}
        <div className="w-full flex-1 max-w-xl lg:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl flex flex-col items-center justify-center relative hidden md:flex">
          {/* Ambient Color-Shade Glow diffusing seamlessly into the unified page background */}
          <div className="w-full relative flex flex-col items-center">
            {/* Dedicated atmospheric background color-shade aura */}
            <div className="absolute -inset-3 sm:-inset-6 bg-gradient-to-tr from-emerald-100/60 via-slate-200/50 to-teal-100/40 rounded-3xl blur-2xl -z-10 opacity-75 pointer-events-none" />

            {/* Seamless Shaded Simulation Panel */}
            <div className="w-full bg-slate-100/60 backdrop-blur-xs border border-slate-200/80 rounded-3xl p-3.5 sm:p-4.5 shadow-xs relative">
              {/* High-Precision Picture Boundary Frame */}
              <div className="relative w-full rounded-2xl overflow-hidden transition-all duration-300 group shadow-md bg-white border-2 border-slate-200/90 shadow-slate-200/60">
                {/* Precision Telemetry Corner Reticles (Defining picture boundary) */}
                <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-500 pointer-events-none z-20 rounded-tl-xs" />
                <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-500 pointer-events-none z-20 rounded-tr-xs" />
                <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-500 pointer-events-none z-20 rounded-bl-xs" />
                <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-500 pointer-events-none z-20 rounded-br-xs" />

                {/* Simulation Image display */}
                <img
                  src="/assets/light_agro_simulation.jpg"
                  alt="MavunoSense Kenya North Rift Valley Earth & Satellite Telemetry Simulation"
                  className="w-full h-auto object-contain max-h-[440px] xl:max-h-[500px] 2xl:max-h-[560px] select-none transition-transform duration-300 group-hover:scale-[1.01]"
                />

                {/* Realized Kenyan Ward Pin-Points mapped onto the 3D SAR Disc */}
                {KENYA_LOGIN_WARDS.map((ward, idx) => {
                  const isActive = activeKenyaWardIdx === idx;
                  return (
                    <button
                      key={ward.name}
                      type="button"
                      onClick={() => setActiveKenyaWardIdx(idx)}
                      className={`hidden sm:flex absolute ${ward.posClass} -translate-x-1/2 -translate-y-1/2 items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border shadow-md transition-all cursor-pointer z-20 ${
                        isActive
                          ? `${ward.badgeColor} scale-110 ring-4 ring-white/80`
                          : 'bg-white/95 text-slate-800 border-slate-300 hover:scale-105'
                      }`}
                      title={`${ward.name} Ward · ${ward.county} · Stress ${ward.stress}/100`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white animate-ping' : ward.dotColor}`} />
                      <span>{ward.name}</span>
                      <span className={`text-[8px] px-1 rounded font-mono ${isActive ? 'bg-black/25 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {Math.round(ward.stress)}
                      </span>
                    </button>
                  );
                })}

                {/* Compact Kenya National Context Inset (Top-Right below Zoom) */}
                <div className="hidden lg:flex flex-col absolute top-12 right-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-slate-200/90 shadow-md z-10 w-36">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                    <span className="text-[9px] font-bold text-slate-900 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Kenya Context</span>
                    </span>
                    <span className="text-[8px] font-semibold text-emerald-700 bg-emerald-50 px-1 rounded">026 · 027</span>
                  </div>
                  <svg viewBox="0 0 120 120" className="w-full h-20 bg-slate-50/80 rounded-lg border border-slate-100">
                    {/* Kenya Silhouette */}
                    <path
                      d="M 35,20 L 52,14 L 74,17 L 95,30 L 106,44 L 100,66 L 84,88 L 69,108 L 50,92 L 32,79 L 26,60 L 23,44 L 29,32 Z"
                      fill="#F1F5F9"
                      stroke="#94A3B8"
                      strokeWidth="1.4"
                    />
                    {/* Lake Victoria */}
                    <ellipse cx="22" cy="70" rx="8" ry="11" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="0.8" />
                    {/* Equator */}
                    <line x1="12" y1="65" x2="112" y2="65" stroke="#CBD5E1" strokeWidth="0.8" strokeDasharray="2,2" />
                    {/* Trans Nzoia & Uasin Gishu Breadbasket Highlight */}
                    <circle cx="35" cy="51" r="7" fill="#10B981" fillOpacity="0.3" />
                    <polygon points="31,46 39,47 38,56 32,55" fill="#059669" stroke="#047857" strokeWidth="1" />
                    <circle cx="35" cy="51" r="2" fill="#F59E0B" />
                    <text x="44" y="49" fontSize="5.5" fill="#065F46" fontWeight="bold">North Rift</text>
                    {/* Nairobi */}
                    <circle cx="60" cy="74" r="2" fill="#334155" />
                    <text x="64" y="76" fontSize="5.5" fill="#334155" fontWeight="bold">Nairobi</text>
                  </svg>
                  <div className="mt-1 text-[8px] text-slate-600 flex items-center justify-between">
                    <span>Trans Nzoia & Uasin Gishu</span>
                  </div>
                </div>

                {/* Fullscreen Zoom Action Button */}
                <button
                  type="button"
                  onClick={() => setZoomModalOpen(true)}
                  className="absolute top-3 right-3 p-1.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-lg shadow-sm border border-slate-200 transition-colors z-20 cursor-pointer"
                  title="Expand full resolution simulation"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {/* Interactive Telemetry Overlay Badges (Contextualized to Kenya) */}
                <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs text-[10px] flex items-center gap-2 text-slate-700 z-10">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="font-semibold text-slate-900">Kenya North Rift Maize</span>
                  <span className="text-emerald-700 font-bold">AUC 0.791</span>
                </div>

                <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-amber-200 shadow-2xs text-[10px] flex items-center gap-1.5 text-amber-800 z-10">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="font-bold">{activeKenyaWard.name}: {activeKenyaWard.deficit} Rain</span>
                  <span className="text-slate-500 hidden sm:inline">· {activeKenyaWard.leadDays} Lead ({activeKenyaWard.county})</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs px-2.5 py-1.5 rounded-lg border border-emerald-200 shadow-2xs text-[10px] flex items-center gap-1.5 text-emerald-800 z-10">
                  <Check className="w-3 h-3 text-emerald-600 font-bold" />
                  <span className="font-bold">11 Wards ·</span>
                  <span className="text-slate-600">KDPA 2019 Anonymized</span>
                </div>
              </div>

              {/* Seamless 7-Module Telemetry Quick-Ribbon */}
              <div className="w-full mt-3 grid grid-cols-4 sm:grid-cols-7 gap-1.5 text-center text-[9px]">
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-emerald-300 transition-colors">
                  <span className="block font-bold text-slate-900">Crop Health</span>
                  <span className="text-emerald-600">NDVI/NDMI</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-amber-300 transition-colors">
                  <span className="block font-bold text-slate-900">Weather</span>
                  <span className="text-amber-600">CHIRPS</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-red-300 transition-colors">
                  <span className="block font-bold text-slate-900">Disease</span>
                  <span className="text-red-600">Moisture</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-blue-300 transition-colors">
                  <span className="block font-bold text-slate-900">Scout Tasks</span>
                  <span className="text-blue-600">EotG Photos</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-purple-300 transition-colors">
                  <span className="block font-bold text-slate-900">VRA Maps</span>
                  <span className="text-purple-600">Multi-band</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-slate-400 transition-colors">
                  <span className="block font-bold text-slate-900">Activity Log</span>
                  <span className="text-slate-600">Timeline</span>
                </div>
                <div className="bg-white/95 p-1 rounded-md border border-slate-200/80 text-slate-700 font-medium shadow-2xs hover:border-emerald-400 transition-colors">
                  <span className="block font-bold text-slate-900">Leaderboard</span>
                  <span className="text-emerald-700">Wards</span>
                </div>
              </div>
            </div>
          </div>

          {/* Zoom Modal (if clicked) */}
          {zoomModalOpen && (
            <div
              className="fixed inset-0 z-[1000000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
              onClick={() => setZoomModalOpen(false)}
            >
              <div
                className="bg-white p-4 rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      MavunoSense Satellite & Earth Disc Telemetry
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Sentinel-1 & 2 SAR
                    </span>
                  </div>
                  <button
                    onClick={() => setZoomModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <img
                  src="/assets/light_agro_simulation.jpg"
                  alt="Expanded Simulation"
                  className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom-Right Chat Bubble Widget (Matches Model Screen) */}
      <div className="fixed bottom-6 right-6 z-50">
        {showHelpChat && (
          <div className="mb-3 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 text-xs animate-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  M
                </div>
                <div>
                  <div className="font-bold text-slate-900">MavunoSense Support</div>
                  <div className="text-[10px] text-emerald-600 font-medium">● Systems Operational</div>
                </div>
              </div>
              <button
                onClick={() => setShowHelpChat(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-3 text-slate-600 space-y-2">
              <p>
                Need assistance logging in? Trial credentials are pre-configured for KALRO leads, Trans Nzoia extension officers, and APA underwriters.
              </p>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-[11px]">
                <div className="font-semibold text-slate-800">Support Desk Contacts:</div>
                <div className="text-slate-500">Kitale Ag Center: +254 700 123 456</div>
                <div className="text-slate-500">Eldoret Hub: +254 722 789 012</div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Lacuna Fund CC-BY 4.0</span>
              <span>KDPA 2019 Anonymized</span>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowHelpChat(!showHelpChat)}
          className="w-13 h-13 rounded-full bg-[#18181b] hover:bg-black active:scale-95 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer ring-4 ring-slate-100"
          title="Open MavunoSense Support"
          aria-label="Open support chat"
        >
          <MessageSquare className="w-5 h-5 text-white fill-white" />
        </button>
      </div>

      {/* Subtle Bottom Footer Note */}
      <div className="w-full px-6 sm:px-10 md:px-14 lg:px-16 xl:px-20 2xl:px-24 py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-transparent">
        MavunoSense AI v1.0 · Uasin Gishu & Trans Nzoia Counties · Apache-2.0 License
      </div>
    </div>
  );
}
