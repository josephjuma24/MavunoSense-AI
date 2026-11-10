import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  Building2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Filter,
  Search,
  PlusCircle,
  FileCheck,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Sprout,
  X,
  Droplets,
  ChevronRight
} from 'lucide-react';

interface MetricItem {
  id: number;
  metric_key: string;
  metric_title: string;
  category: string;
  baseline_value: number;
  target_value: number;
  achieved_value: number;
  unit: string;
  uasin_gishu_achieved: number;
  trans_nzoia_achieved: number;
  progress_pct: number;
  exceeds_target: boolean;
  historical_trend: { month: string; val: number }[];
}

interface VerificationLog {
  id: number;
  ward_id: number;
  ward_name: string;
  sub_county: string;
  county: string;
  parcel_id: string;
  verifier_name: string;
  verifier_role: string;
  alert_date: string;
  verification_date: string;
  satellite_stress_score: number;
  ground_stress_score: number;
  maize_growth_stage: string;
  confirmation_status: 'CONFIRMED_TRUE_POSITIVE' | 'FALSE_ALARM' | 'RESOLVED_POST_RAIN' | 'PENDING_FIELD_VISIT';
  visual_symptoms: string;
  soil_moisture_ground_pct: number;
  corrective_action_advised: string;
  gps_lat: number;
  gps_lon: number;
}

interface ImpactData {
  metrics: MetricItem[];
  summary: {
    total_farmers_sms_reached: number;
    total_staff_trained: number;
    active_institutions_using_dashboard: number;
    field_alert_precision_pct: number;
    total_field_checks_logged: number;
    true_positive_stress_confirmations: number;
    target_crop: string;
    target_counties: string[];
    compliance_standard: string;
  };
  county_comparison: {
    uasin_gishu: {
      county_name: string;
      county_code: string;
      farmers_reached: number;
      farmers_target: number;
      staff_trained: number;
      institutions: number;
      alert_precision_pct: number;
    };
    trans_nzoia: {
      county_name: string;
      county_code: string;
      farmers_reached: number;
      farmers_target: number;
      staff_trained: number;
      institutions: number;
      alert_precision_pct: number;
    };
  };
}

export default function ImpactMetricsView() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [verifications, setVerifications] = useState<VerificationLog[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'metrics' | 'county' | 'verifications'>('metrics');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogModal, setShowLogModal] = useState<boolean>(false);

  // New Verification Modal Form State
  const [newWardId, setNewWardId] = useState<number>(1);
  const [newVerifierName, setNewVerifierName] = useState<string>('');
  const [newVerifierRole, setNewVerifierRole] = useState<string>('Extension Officer');
  const [newConfirmationStatus, setNewConfirmationStatus] = useState<'CONFIRMED_TRUE_POSITIVE' | 'FALSE_ALARM' | 'RESOLVED_POST_RAIN'>('CONFIRMED_TRUE_POSITIVE');
  const [newGroundScore, setNewGroundScore] = useState<number>(76);
  const [newGrowthStage, setNewGrowthStage] = useState<string>('Silking / Tasseling');
  const [newSymptoms, setNewSymptoms] = useState<string>('');
  const [newMoisture, setNewMoisture] = useState<number>(15.4);
  const [newAdvice, setNewAdvice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchMetrics = () => {
    setIsLoading(true);
    fetch('/api/v1/impact-metrics')
      .then((res) => res.json())
      .then((resData: ImpactData) => {
        setData(resData);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load impact metrics:', err);
        setIsLoading(false);
      });

    fetch('/api/v1/impact-metrics/verifications')
      .then((res) => res.json())
      .then((logs: VerificationLog[]) => {
        setVerifications(logs);
      })
      .catch((err) => console.error('Failed to load verifications:', err));
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCreateVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(null);

    try {
      const res = await fetch('/api/v1/impact-metrics/verify-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ward_id: newWardId,
          verifier_name: newVerifierName || 'Field Agronomist',
          verifier_role: newVerifierRole,
          ground_stress_score: newGroundScore,
          maize_growth_stage: newGrowthStage,
          confirmation_status: newConfirmationStatus,
          visual_symptoms: newSymptoms || 'Ground moisture verification confirmed on monitored maize parcel.',
          soil_moisture_ground_pct: newMoisture,
          corrective_action_advised: newAdvice || 'Organic mulch applied; delayed fertilizer top-dressing.',
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to submit verification');

      setSubmitSuccess(`Ground verification successfully recorded! Precision recalculated to ${resData.updated_precision_pct}%.`);
      fetchMetrics();
      setTimeout(() => {
        setShowLogModal(false);
        setSubmitSuccess(null);
        setNewVerifierName('');
        setNewSymptoms('');
        setNewAdvice('');
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error recording verification');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredVerifications = verifications.filter((v) => {
    const matchesStatus = statusFilter === 'ALL' || v.confirmation_status === statusFilter;
    const matchesSearch =
      v.ward_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.verifier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.parcel_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.visual_symptoms.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Impact Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Lacuna Fund Prototype Commitment
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600">Season: 2026 Long Rains</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Impact & Reach Metrics Tracking Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Live telemetry tracking for early warning milestones across Uasin Gishu (027) & Trans Nzoia (026) counties. Real-time verification against the Lacuna Fund Reference Performance Matrix.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchMetrics}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Refresh metrics from backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>
          <button
            onClick={() => setShowLogModal(true)}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Log Field Check Verification</span>
          </button>
        </div>
      </div>

      {/* 4 CORE REFERENCE METRIC CARDS (Strictly from Brief Table) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {data?.metrics.map((metric) => {
          let Icon = Users;
          let accentColor = 'emerald';
          if (metric.metric_key === 'staff_trained') {
            Icon = Award;
            accentColor = 'blue';
          } else if (metric.metric_key === 'institutional_dashboards') {
            Icon = Building2;
            accentColor = 'purple';
          } else if (metric.metric_key === 'alert_precision') {
            Icon = CheckCircle2;
            accentColor = 'amber';
          }

          return (
            <div
              key={metric.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      metric.exceeds_target
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}
                  >
                    {metric.exceeds_target ? 'Exceeds Target' : 'On Track'}
                  </span>
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  {metric.category}
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug min-h-[2.5rem]">
                  {metric.metric_title}
                </h3>

                {/* Achieved Value Display */}
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {metric.unit.includes('%')
                      ? `${metric.achieved_value.toFixed(1)}%`
                      : metric.achieved_value.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    / {metric.unit.includes('%') ? `${metric.target_value}%` : metric.target_value.toLocaleString()} {metric.unit}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                    <span>Target Progress</span>
                    <span className={metric.exceeds_target ? 'text-emerald-700 font-bold' : 'text-slate-700'}>
                      {metric.progress_pct}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.exceeds_target ? 'bg-emerald-600' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, metric.progress_pct)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* County Breakdown Tag */}
              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <div className="text-slate-400 font-medium">Uasin Gishu</div>
                  <div className="font-bold text-slate-800">
                    {metric.unit.includes('%') ? `${metric.uasin_gishu_achieved}%` : metric.uasin_gishu_achieved.toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <div className="text-slate-400 font-medium">Trans Nzoia</div>
                  <div className="font-bold text-slate-800">
                    {metric.unit.includes('%') ? `${metric.trans_nzoia_achieved}%` : metric.trans_nzoia_achieved.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-Tabs: Overview vs County Breakdown vs Field Verifications */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('metrics')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 ${
                activeSubTab === 'metrics'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Milestone Trajectory & Historical Trends
            </button>
            <button
              onClick={() => setActiveSubTab('county')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 ${
                activeSubTab === 'county'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              County Level Distribution (027 vs 026)
            </button>
            <button
              onClick={() => setActiveSubTab('verifications')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 flex items-center gap-1.5 ${
                activeSubTab === 'verifications'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Field Check Precision Audit Log</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full font-bold">
                {verifications.length} Checks
              </span>
            </button>
          </div>

          <div className="pb-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Field Telemetry Sync: Today, 08:30 EAT</span>
          </div>
        </div>

        <div className="p-6">
          {/* SUB-TAB 1: METRICS & TRAJECTORY */}
          {activeSubTab === 'metrics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farmer Reach Trajectory */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        1. Early-Warning SMS Reach Growth
                      </h4>
                      <p className="text-[11px] text-slate-500">Monthly cumulative smallholder farmers receiving dispatches</p>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-700">19,450 / 25,000</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 items-end h-32 pt-4">
                    {data?.metrics[0]?.historical_trend.map((pt, i) => {
                      const heightPct = Math.round((pt.val / 25000) * 100);
                      return (
                        <div key={pt.month} className="flex flex-col items-center h-full justify-end">
                          <div className="text-[10px] font-bold text-slate-700 mb-1">
                            {pt.val >= 1000 ? `${(pt.val / 1000).toFixed(1)}k` : pt.val}
                          </div>
                          <div
                            className="w-full rounded-t-md bg-emerald-500 hover:bg-emerald-600 transition-all"
                            style={{ height: `${heightPct}%` }}
                            title={`${pt.month}: ${pt.val} smallholders reached`}
                          />
                          <span className="text-[10px] text-slate-500 mt-2 font-medium">{pt.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Field Check Precision Trajectory */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        4. Ground Truth Alert Precision Rate
                      </h4>
                      <p className="text-[11px] text-slate-500">Confirmed true positive early warnings vs field visits</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700">84.6% (Target: 80.0%)</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 items-end h-32 pt-4">
                    {data?.metrics[3]?.historical_trend.map((pt) => {
                      const heightPct = Math.round(((pt.val - 60) / 40) * 100);
                      return (
                        <div key={pt.month} className="flex flex-col items-center h-full justify-end">
                          <div className="text-[10px] font-bold text-amber-800 mb-1">{pt.val}%</div>
                          <div
                            className="w-full rounded-t-md bg-amber-500 hover:bg-amber-600 transition-all"
                            style={{ height: `${heightPct}%` }}
                            title={`${pt.month}: ${pt.val}% Precision`}
                          />
                          <span className="text-[10px] text-slate-500 mt-2 font-medium">{pt.month}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Reference Impact Matrix Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Core Impact Indicator</th>
                      <th className="py-3 px-4">Baseline</th>
                      <th className="py-3 px-4">Milestone Target</th>
                      <th className="py-3 px-4">Current Achieved</th>
                      <th className="py-3 px-4">Uasin Gishu (027)</th>
                      <th className="py-3 px-4">Trans Nzoia (026)</th>
                      <th className="py-3 px-4">Status & Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data?.metrics.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.metric_title}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono">
                          {m.baseline_value} {m.unit}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700 font-mono">
                          {m.unit.includes('%') ? `${m.target_value}%` : m.target_value.toLocaleString()} {m.unit}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-emerald-700 font-mono">
                          {m.unit.includes('%') ? `${m.achieved_value.toFixed(1)}%` : m.achieved_value.toLocaleString()} {m.unit}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {m.unit.includes('%') ? `${m.uasin_gishu_achieved}%` : m.uasin_gishu_achieved.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {m.unit.includes('%') ? `${m.trans_nzoia_achieved}%` : m.trans_nzoia_achieved.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.exceeds_target
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.progress_pct}% Completed {m.exceeds_target ? '(+ Target Surpassed)' : ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: COUNTY COMPARISON */}
          {activeSubTab === 'county' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Uasin Gishu Card */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">County Code 027</div>
                      <h3 className="text-base font-bold text-slate-900">Uasin Gishu County (Eldoret Hub)</h3>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      6 Agro Wards
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Smallholders Reached with Early Warning:</span>
                      <strong className="text-slate-900 font-mono">10,820 / 13,000 (83.2%)</strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '83.2%' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600">Extension & Cooperative Staff Trained:</span>
                      <strong className="text-slate-900 font-mono">78 Officers</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Registered Institutional Accounts:</span>
                      <strong className="text-slate-900 font-mono">16 Institutions</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Field Check Precision Confirmation:</span>
                      <strong className="text-emerald-700 font-bold font-mono">85.2% True Positive</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                    Key Wards Monitored: Turbo, Soy, Moiben, Ainabkoi, Kapseret, Kesses. Primary cooperative: Soy Farmers Cooperative Society.
                  </div>
                </div>

                {/* Trans Nzoia Card */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">County Code 026</div>
                      <h3 className="text-base font-bold text-slate-900">Trans Nzoia County (Kitale Hub)</h3>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                      5 Agro Wards
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Smallholders Reached with Early Warning:</span>
                      <strong className="text-slate-900 font-mono">8,630 / 12,000 (71.9%)</strong>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: '71.9%' }} />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-600">Extension & Cooperative Staff Trained:</span>
                      <strong className="text-slate-900 font-mono">64 Officers</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Registered Institutional Accounts:</span>
                      <strong className="text-slate-900 font-mono">12 Institutions</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Field Check Precision Confirmation:</span>
                      <strong className="text-emerald-700 font-bold font-mono">83.8% True Positive</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500">
                    Key Wards Monitored: Cherangany, Saboti, Kiminini, Endebess, Kwanza. Primary lead: Trans Nzoia County Agricultural Directorate.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: FIELD CHECK PRECISION AUDIT LOG */}
          {activeSubTab === 'verifications' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by Ward, Scout or Parcel..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-600"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-[11px] text-slate-500 font-medium">Filter Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-emerald-600"
                  >
                    <option value="ALL">All Statuses ({verifications.length})</option>
                    <option value="CONFIRMED_TRUE_POSITIVE">Confirmed True Positive</option>
                    <option value="RESOLVED_POST_RAIN">Resolved Post-Rain</option>
                    <option value="FALSE_ALARM">False Alarm</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Ward & County</th>
                      <th className="py-3 px-3">Parcel ID</th>
                      <th className="py-3 px-3">Field Verifier</th>
                      <th className="py-3 px-3">Growth Stage</th>
                      <th className="py-3 px-3">Satellite / Ground</th>
                      <th className="py-3 px-3">Ground Soil Moisture</th>
                      <th className="py-3 px-3">Confirmation Status</th>
                      <th className="py-3 px-3">Visual Symptoms & Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredVerifications.map((v) => {
                      let statusBadge = 'bg-emerald-100 text-emerald-800 border-emerald-200';
                      let statusText = 'True Positive';
                      if (v.confirmation_status === 'RESOLVED_POST_RAIN') {
                        statusBadge = 'bg-blue-100 text-blue-800 border-blue-200';
                        statusText = 'Rain Resolved';
                      } else if (v.confirmation_status === 'FALSE_ALARM') {
                        statusBadge = 'bg-red-100 text-red-800 border-red-200';
                        statusText = 'False Alarm';
                      }

                      return (
                        <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                            {v.verification_date}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                            {v.ward_name}
                            <span className="block text-[10px] font-normal text-slate-500">{v.county}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {v.parcel_id}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-900">{v.verifier_name}</div>
                            <div className="text-[10px] text-slate-500">{v.verifier_role}</div>
                          </td>
                          <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                            {v.maize_growth_stage}
                          </td>
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            <span className="text-slate-600">{v.satellite_stress_score}</span> /{' '}
                            <span className="font-bold text-slate-900">{v.ground_stress_score}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {v.soil_moisture_ground_pct}% Vol
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                              {statusText}
                            </span>
                          </td>
                          <td className="py-3 px-3 max-w-xs">
                            <p className="text-[11px] text-slate-700 truncate" title={v.visual_symptoms}>
                              {v.visual_symptoms}
                            </p>
                            <p className="text-[10px] text-emerald-700 truncate font-medium" title={v.corrective_action_advised}>
                              Action: {v.corrective_action_advised}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LOG FIELD CHECK VERIFICATION MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">Log Ground Truth Field Check</h3>
              </div>
              <button
                onClick={() => setShowLogModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVerification} className="p-6 overflow-y-auto space-y-4">
              {submitSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Ward</label>
                  <select
                    value={newWardId}
                    onChange={(e) => setNewWardId(parseInt(e.target.value, 10))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value={1}>Cherangany (Trans Nzoia)</option>
                    <option value={2}>Saboti (Trans Nzoia)</option>
                    <option value={3}>Kiminini (Trans Nzoia)</option>
                    <option value={4}>Endebess (Trans Nzoia)</option>
                    <option value={5}>Kwanza (Trans Nzoia)</option>
                    <option value={6}>Turbo (Uasin Gishu)</option>
                    <option value={7}>Soy (Uasin Gishu)</option>
                    <option value={8}>Moiben (Uasin Gishu)</option>
                    <option value={9}>Ainabkoi (Uasin Gishu)</option>
                    <option value={10}>Kapseret (Uasin Gishu)</option>
                    <option value={11}>Kesses (Uasin Gishu)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmation Status</label>
                  <select
                    value={newConfirmationStatus}
                    onChange={(e) => setNewConfirmationStatus(e.target.value as any)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="CONFIRMED_TRUE_POSITIVE">Confirmed True Positive (Stress Validated)</option>
                    <option value="RESOLVED_POST_RAIN">Resolved Post-Rain (Shower Relieved)</option>
                    <option value="FALSE_ALARM">False Alarm (Canopy Healthy)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verifier Name</label>
                  <input
                    type="text"
                    required
                    value={newVerifierName}
                    onChange={(e) => setNewVerifierName(e.target.value)}
                    placeholder="e.g. Beatrice Cherono"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Verifier Role</label>
                  <select
                    value={newVerifierRole}
                    onChange={(e) => setNewVerifierRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  >
                    <option value="Extension Officer">Extension Officer</option>
                    <option value="Cooperative Agronomist">Cooperative Agronomist</option>
                    <option value="Field Scout (EotG)">Field Scout (EotG)</option>
                    <option value="Agricultural Underwriter">Agricultural Underwriter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ground Stress (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newGroundScore}
                    onChange={(e) => setNewGroundScore(parseFloat(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Soil Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMoisture}
                    onChange={(e) => setNewMoisture(parseFloat(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Maize Stage</label>
                  <input
                    type="text"
                    value={newGrowthStage}
                    onChange={(e) => setNewGrowthStage(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Visual Symptoms Observed</label>
                <textarea
                  rows={2}
                  value={newSymptoms}
                  onChange={(e) => setNewSymptoms(e.target.value)}
                  placeholder="e.g. Afternoon leaf rolling, stunted vegetative height, cracked topsoil..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corrective Action Advised</label>
                <input
                  type="text"
                  value={newAdvice}
                  onChange={(e) => setNewAdvice(e.target.value)}
                  placeholder="e.g. Apply conservation mulch, postpone fertilizer top-dressing..."
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording...' : 'Save & Update Precision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
