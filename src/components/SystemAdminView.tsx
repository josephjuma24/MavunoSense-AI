import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Sliders,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Server,
  Database,
  Key,
  Shield,
  Eye,
  Send,
  Download,
  Users,
  Settings2,
  Check,
  X
} from 'lucide-react';

interface RBACRole {
  role_key: string;
  role_name: string;
  description: string;
  badge_color: string;
  permissions: Record<string, { view: boolean; edit: boolean; dispatch: boolean; export: boolean; admin: boolean }>;
}

interface RBACModule {
  key: string;
  name: string;
  description: string;
}

interface RBACMatrixData {
  roles: RBACRole[];
  modules: RBACModule[];
}

interface SystemConfig {
  sms_gateway_provider: string;
  sms_gateway_status: string;
  satellite_sync_cadence_hours: number;
  sentinel1_radar_active: boolean;
  sentinel2_optical_active: boolean;
  chirps_rainfall_active: boolean;
  kdpa_anonymization_salt_version: string;
  drought_alert_default_threshold: number;
  emergency_escalation_ward_score: number;
  last_satellite_sync_timestamp: string;
  total_audit_events: number;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  ip_masked: string;
  status: string;
}

export default function SystemAdminView() {
  const [matrixData, setMatrixData] = useState<RBACMatrixData | null>(null);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [activeTab, setActiveTab] = useState<'rbac' | 'config' | 'audit'>('rbac');
  const [selectedRoleKey, setSelectedRoleKey] = useState<string>('SUPER_ADMIN');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const fetchAdminData = () => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/v1/admin/rbac-matrix').then((r) => r.json()),
      fetch('/api/v1/admin/system-config').then((r) => r.json()),
      fetch('/api/v1/admin/audit-logs').then((r) => r.json()),
    ])
      .then(([rbac, config, logs]) => {
        setMatrixData(rbac);
        setSystemConfig(config);
        setAuditLogs(logs);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load system admin data:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleTogglePermission = async (roleKey: string, moduleKey: string, action: 'view' | 'edit' | 'dispatch' | 'export' | 'admin') => {
    if (!matrixData) return;
    const currentVal = matrixData.roles.find((r) => r.role_key === roleKey)?.permissions[moduleKey]?.[action] ?? false;
    const newVal = !currentVal;

    // Optimistic UI update
    setMatrixData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        roles: prev.roles.map((r) => {
          if (r.role_key !== roleKey) return r;
          return {
            ...r,
            permissions: {
              ...r.permissions,
              [moduleKey]: {
                ...r.permissions[moduleKey],
                [action]: newVal,
              },
            },
          };
        }),
      };
    });

    try {
      await fetch('/api/v1/admin/rbac-matrix', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role_key: roleKey,
          module_key: moduleKey,
          action,
          value: newVal,
        }),
      });
      setSaveStatus(`Updated privilege for ${roleKey} on ${moduleKey}.${action}`);
      setTimeout(() => setSaveStatus(null), 2500);
    } catch (err) {
      console.error('Failed to update permission:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!systemConfig) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/v1/admin/system-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemConfig),
      });
      const data = await res.json();
      setSaveStatus('System configuration saved successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Error saving config');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedRole = matrixData?.roles.find((r) => r.role_key === selectedRoleKey);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 lg:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">
              System Administration & Settings
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-semibold text-slate-600">Enterprise Access & RBAC Matrix</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Security Privilege Matrix, Runtime Config & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Configure granular role-based permissions across system modules, tune satellite cadence for Uasin Gishu and Trans Nzoia, and enforce Kenya Data Protection Act (KDPA 2019) compliance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchAdminData}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            title="Refresh settings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Matrix</span>
          </button>
        </div>
      </div>

      {saveStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{saveStatus}</span>
        </div>
      )}

      {/* Main Admin Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 pt-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rbac')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 flex items-center gap-1.5 ${
                activeTab === 'rbac'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privilege Security Matrix (RBAC)</span>
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 flex items-center gap-1.5 ${
                activeTab === 'config'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>System Runtime & Gateway Configuration</span>
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`pb-3 text-xs font-bold border-b-2 transition-colors px-1 flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Security & Access Audit Trail</span>
            </button>
          </div>

          <div className="pb-3 text-[11px] text-slate-500 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>PostgreSQL Simulated Store (DDL Active)</span>
          </div>
        </div>

        <div className="p-6">
          {/* TAB 1: PRIVILEGE SECURITY MATRIX (RBAC) */}
          {activeTab === 'rbac' && matrixData && (
            <div className="space-y-6">
              {/* Role Selector Ribbon */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500">Filter Matrix by Role:</span>
                  {matrixData.roles.map((r) => {
                    const isSelected = selectedRoleKey === r.role_key;
                    return (
                      <button
                        key={r.role_key}
                        onClick={() => setSelectedRoleKey(r.role_key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {r.role_name}
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-slate-500">
                  Interactive toggles sync instantly with in-memory relational store
                </div>
              </div>

              {/* Selected Role Scope Card */}
              {selectedRole && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${selectedRole.badge_color}`}>
                        {selectedRole.role_key}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{selectedRole.role_name} Scope</h4>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{selectedRole.description}</p>
                  </div>
                  <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    KDPA 2019 Pseudonymization: <strong className="text-emerald-700">Enforced for non-admins</strong>
                  </div>
                </div>
              )}

              {/* Comprehensive RBAC Matrix Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4 min-w-[200px]">System Module</th>
                      <th className="py-3 px-3 text-center">Can View</th>
                      <th className="py-3 px-3 text-center">Can Edit</th>
                      <th className="py-3 px-3 text-center">Dispatch SMS</th>
                      <th className="py-3 px-3 text-center">Export Data</th>
                      <th className="py-3 px-3 text-center">Administer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {matrixData.modules.map((mod) => {
                      const perms = selectedRole?.permissions[mod.key] || {
                        view: false,
                        edit: false,
                        dispatch: false,
                        export: false,
                        admin: false,
                      };

                      return (
                        <tr key={mod.key} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{mod.name}</div>
                            <div className="text-[11px] text-slate-500">{mod.description}</div>
                          </td>

                          {/* View Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(selectedRoleKey, mod.key, 'view')}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.view
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`Toggle View for ${mod.name}`}
                            >
                              {perms.view ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Edit Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(selectedRoleKey, mod.key, 'edit')}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.edit
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`Toggle Edit for ${mod.name}`}
                            >
                              {perms.edit ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Dispatch Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(selectedRoleKey, mod.key, 'dispatch')}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.dispatch
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`Toggle Dispatch for ${mod.name}`}
                            >
                              {perms.dispatch ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Export Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(selectedRoleKey, mod.key, 'export')}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.export
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`Toggle Export for ${mod.name}`}
                            >
                              {perms.export ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>

                          {/* Admin Toggle */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleTogglePermission(selectedRoleKey, mod.key, 'admin')}
                              className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${
                                perms.admin
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                              }`}
                              title={`Toggle Administer for ${mod.name}`}
                            >
                              {perms.admin ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* RBAC Security Legend */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-800">Security & Access Policy Guidelines:</div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-600">
                  <li><strong>Can View:</strong> Read access to ward telemetry, stress indices, and aggregated impact figures.</li>
                  <li><strong>Can Edit:</strong> Update agricultural advisory notes, ward thresholds, and field check logs.</li>
                  <li><strong>Dispatch SMS:</strong> Authorized to execute bulk localized Swahili & English dispatches via Safaricom gateway.</li>
                  <li><strong>Export Data:</strong> Permission to download CSV reports for underwriting or academic research.</li>
                  <li><strong>Administer:</strong> Full privilege to alter RBAC matrices, invite users, and configure data salts.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: SYSTEM RUNTIME CONFIGURATION */}
          {activeTab === 'config' && systemConfig && (
            <form onSubmit={handleSaveConfig} className="space-y-6 max-w-3xl">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  SMS Gateway Connectivity & Provider
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gateway Provider</label>
                    <input
                      type="text"
                      value={systemConfig.sms_gateway_provider}
                      onChange={(e) => setSystemConfig({ ...systemConfig, sms_gateway_provider: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gateway Status</label>
                    <select
                      value={systemConfig.sms_gateway_status}
                      onChange={(e) => setSystemConfig({ ...systemConfig, sms_gateway_status: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                    >
                      <option value="ONLINE">ONLINE (Low Latency SMPP Ready)</option>
                      <option value="SIMULATED">SIMULATED (Dry Run Sandbox)</option>
                      <option value="MAINTENANCE">MAINTENANCE (Paused)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Satellite Ingestion Cadence & Earth Observation Feeds
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sync Cadence (Hours)</label>
                    <select
                      value={systemConfig.satellite_sync_cadence_hours}
                      onChange={(e) => setSystemConfig({ ...systemConfig, satellite_sync_cadence_hours: parseInt(e.target.value, 10) })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600"
                    >
                      <option value={6}>Every 6 Hours (Sentinel-1 SAR C-Band)</option>
                      <option value={12}>Every 12 Hours</option>
                      <option value={24}>Daily 24 Hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Drought Trigger Threshold</label>
                    <input
                      type="number"
                      step="1"
                      min={30}
                      max={90}
                      value={systemConfig.drought_alert_default_threshold}
                      onChange={(e) => setSystemConfig({ ...systemConfig, drought_alert_default_threshold: parseFloat(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Escalation Score</label>
                    <input
                      type="number"
                      step="1"
                      min={60}
                      max={95}
                      value={systemConfig.emergency_escalation_ward_score}
                      onChange={(e) => setSystemConfig({ ...systemConfig, emergency_escalation_ward_score: parseFloat(e.target.value) })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:outline-emerald-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemConfig.sentinel1_radar_active}
                      onChange={(e) => setSystemConfig({ ...systemConfig, sentinel1_radar_active: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">Sentinel-1 Radar Active (Cloud Piercing)</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemConfig.chirps_rainfall_active}
                      onChange={(e) => setSystemConfig({ ...systemConfig, chirps_rainfall_active: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-semibold text-slate-800">CHIRPS Rainfall Ingestion Active</span>
                  </label>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Kenya Data Protection Act (KDPA 2019) Pseudonymization
                </h4>
                <div className="text-xs text-slate-600">
                  Active Salt Engine: <strong className="font-mono text-slate-800">{systemConfig.kdpa_anonymization_salt_version}</strong>
                </div>
                <p className="text-[11px] text-slate-500">
                  All MSISDNs and GPS field centroid coordinates undergo irreversible salted SHA-256 HMAC pseudonymization prior to telemetry storage.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Configuration...' : 'Save System Settings'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Security & Administrative Audit Trail (KDPA Accountability)
                </h4>
                <span className="text-xs text-slate-500 font-mono">1,248 Total Events Logged</span>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Timestamp (EAT)</th>
                      <th className="py-3 px-4">Actor & Role</th>
                      <th className="py-3 px-4">Action Performed</th>
                      <th className="py-3 px-4">Target Resource</th>
                      <th className="py-3 px-4">Client IP</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-mono text-[11px] font-bold text-slate-800">{log.id}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{log.actor}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{log.action}</td>
                        <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{log.target}</td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{log.ip_masked}</td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
