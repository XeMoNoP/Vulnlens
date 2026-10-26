'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Play,
  FileCheck,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowLeft,
  Settings2,
} from 'lucide-react';
import { Vulnerability, SecurityEvidence, SecurityRetest, SecurityMode } from '@/lib/types';
import { CheckResult } from '@/lib/scanner';

export default function VulnLensConsolePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'scanner' | 'register' | 'evidence' | 'retests'>('overview');
  const [securityMode, setSecurityMode] = useState<SecurityMode>('SECURE');
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [evidenceList, setEvidenceList] = useState<SecurityEvidence[]>([]);
  const [retestList, setRetestList] = useState<SecurityRetest[]>([]);
  const [scanResults, setScanResults] = useState<CheckResult[] | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Retest form
  const [retestFindingId, setRetestFindingId] = useState('VULN-001');
  const [retestTester, setRetestTester] = useState('SecOps Lead');
  const [retestResult, setRetestResult] = useState<'PASS' | 'FAIL'>('PASS');
  const [retestNotes, setRetestNotes] = useState('');

  // Manual evidence form
  const [evVulnId, setEvVulnId] = useState('VULN-001');
  const [evTestId, setEvTestId] = useState('TEST-MANUAL-01');
  const [evModule, setEvModule] = useState('Cart/Checkout API');
  const [evObservation, setEvObservation] = useState('');
  const [evExpected, setEvExpected] = useState('');
  const [evActual, setEvActual] = useState('');
  const [evStatus, setEvStatus] = useState<'PASS' | 'FAIL'>('PASS');

  useEffect(() => {
    checkAdminAndFetch();
  }, []);

  const checkAdminAndFetch = async () => {
    setLoading(true);
    try {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'admin') {
        router.push('/admin/login');
        return;
      }

      await Promise.all([
        fetchMode(),
        fetchVulnerabilities(),
        fetchEvidence(),
        fetchRetests(),
      ]);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchMode = async () => {
    const res = await fetch('/api/vulnlens/mode');
    if (res.ok) {
      const data = await res.json();
      setSecurityMode(data.mode);
    }
  };

  const fetchVulnerabilities = async () => {
    const res = await fetch('/api/vulnlens/vulnerabilities');
    if (res.ok) {
      const data = await res.json();
      setVulnerabilities(data.vulnerabilities || []);
    }
  };

  const fetchEvidence = async () => {
    const res = await fetch('/api/vulnlens/evidence');
    if (res.ok) {
      const data = await res.json();
      setEvidenceList(data.evidence || []);
    }
  };

  const fetchRetests = async () => {
    const res = await fetch('/api/vulnlens/retests');
    if (res.ok) {
      const data = await res.json();
      setRetestList(data.retests || []);
    }
  };

  const handleToggleMode = async (newMode: SecurityMode) => {
    try {
      const res = await fetch('/api/vulnlens/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
      if (res.ok) {
        setSecurityMode(newMode);
        showToast(`Security Mode updated to: ${newMode}`);
      }
    } catch {
      alert('Error updating security mode');
    }
  };

  const handleRunAllChecks = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/vulnlens/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setScanResults(data.results || []);
        setActiveTab('scanner');
        showToast('Automated OWASP Top 10 check suite completed!');
        fetchVulnerabilities();
        fetchEvidence();
      }
    } catch {
      alert('Error running checks');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmitRetest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vulnlens/retests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding_id: retestFindingId,
          tester: retestTester,
          test_result: retestResult,
          notes: retestNotes,
        }),
      });
      if (res.ok) {
        showToast(`Retest recorded! ${retestFindingId} marked as ${retestResult === 'PASS' ? 'Fixed' : 'Open'}.`);
        setRetestNotes('');
        fetchRetests();
        fetchVulnerabilities();
      }
    } catch {
      alert('Error recording retest');
    }
  };

  const handleSubmitEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vulnlens/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vuln_id: evVulnId,
          test_id: evTestId,
          module: evModule,
          observation: evObservation,
          expected_result: evExpected,
          actual_result: evActual,
          status: evStatus,
        }),
      });
      if (res.ok) {
        showToast('Security evidence recorded!');
        setEvObservation('');
        setEvExpected('');
        setEvActual('');
        fetchEvidence();
      }
    } catch {
      alert('Error submitting evidence');
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const totalFindings = vulnerabilities.length;
  const fixedFindings = vulnerabilities.filter((v) => v.remediation_status === 'Fixed').length;
  const openFindings = totalFindings - fixedFindings;
  const passRate = totalFindings > 0 ? Math.round((fixedFindings / totalFindings) * 100) : 0;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Console Navigation Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                V
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white">VulnLens</span>
                <span className="text-[10px] text-emerald-400 font-mono block uppercase leading-none">
                  Security Console :: DMART Target
                </span>
              </div>
            </div>
          </div>

          {/* Security Mode Switcher & Run Scan */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold">
              <button
                onClick={() => handleToggleMode('SECURE')}
                className={`px-3 py-1 rounded-md transition-all ${
                  securityMode === 'SECURE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SECURE
              </button>
              <button
                onClick={() => handleToggleMode('LAB')}
                className={`px-3 py-1 rounded-md transition-all ${
                  securityMode === 'LAB'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LAB MODE
              </button>
            </div>

            <button
              onClick={handleRunAllChecks}
              disabled={isScanning}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isScanning ? 'Running Scan...' : 'Run All Checks'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
              <span>Total Scenarios</span>
              <ClipboardList className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-black text-white">{totalFindings}</div>
            <span className="text-[10px] text-slate-500">OWASP Top 10:2025 Scope</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
              <span>Fixed Mitigations</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">{fixedFindings}</div>
            <span className="text-[10px] text-emerald-500/80">Remediated & Verified</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
              <span>Open Findings</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{openFindings}</div>
            <span className="text-[10px] text-amber-500/80">Requires Attention / Retest</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-2">
              <span>Coverage / Pass Rate</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-teal-400">{passRate}%</div>
            <span className="text-[10px] text-teal-500/80">Security Baseline Status</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 gap-6 text-xs font-bold overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>OWASP Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('scanner')}
            className={`pb-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'scanner'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>Automated Check Results {scanResults && `(${scanResults.length})`}</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`pb-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'register'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Vulnerability Register ({totalFindings})</span>
          </button>

          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'evidence'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Security Evidence ({evidenceList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('retests')}
            className={`pb-3 flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeTab === 'retests'
                ? 'border-b-2 border-emerald-400 text-emerald-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retest Verification ({retestList.length})</span>
          </button>
        </div>

        {/* Tab 1: OWASP Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>OWASP Top 10:2025 Test Bed & Integration Model</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-3xl mb-6">
                VulnLens integrates directly into the target e-commerce host application. It performs
                deterministic, non-destructive source inspection and live database audits without firing
                harmful network exploits.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vulnerabilities.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-slate-950/70 rounded-lg border border-slate-800/80 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-xs font-bold text-emerald-400">{v.vuln_id}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          v.remediation_status === 'Fixed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {v.remediation_status}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{v.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">{v.category}</p>
                      <p className="text-xs text-slate-300 mt-2">{v.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                      <span>Endpoint: <code className="text-slate-300">{v.affected_component}</code></span>
                      <span className="text-emerald-400 font-semibold">{v.remediation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Automated Scanner Results */}
        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Play className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                    <span>OWASP Top 10:2025 Automated Test Runner</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Direct live inspection of application source, database tables, and cryptographic hashes.
                  </p>
                </div>
                <button
                  onClick={handleRunAllChecks}
                  disabled={isScanning}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isScanning ? 'Executing Checks...' : 'Re-Run All Checks'}
                </button>
              </div>

              {!scanResults ? (
                <div className="p-12 text-center text-slate-500 text-xs">
                  Click &quot;Run All Checks&quot; in the header to execute the complete OWASP verification suite.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Vuln ID</th>
                        <th className="p-3">Scenario Name</th>
                        <th className="p-3">OWASP Category</th>
                        <th className="p-3">Tested Module</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Observation Evidence</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {scanResults.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-emerald-400">{r.vuln_id}</td>
                          <td className="p-3 font-bold text-white">{r.name}</td>
                          <td className="p-3 text-slate-400">{r.category}</td>
                          <td className="p-3 font-mono text-slate-400">{r.module}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-flex items-center gap-1 ${
                              r.status === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {r.status === 'PASS' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              <span>{r.status}</span>
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{r.actual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Vulnerability Register */}
        {activeTab === 'register' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              <span>Documented Vulnerability Register</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">ID</th>
                    <th className="p-3">Vulnerability Scenario</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Targeted Component</th>
                    <th className="p-3">Remediation Standard</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Retest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {vulnerabilities.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-emerald-400">{v.vuln_id}</td>
                      <td className="p-3 font-bold text-white">{v.name}</td>
                      <td className="p-3 text-slate-400">{v.category}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.severity === 'High'
                            ? 'bg-red-500/20 text-red-300'
                            : v.severity === 'Medium'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-blue-500/20 text-blue-300'
                        }`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{v.affected_component}</td>
                      <td className="p-3 text-slate-300">{v.remediation}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.remediation_status === 'Fixed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {v.remediation_status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.retest_result === 'Pass'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : v.retest_result === 'Fail'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {v.retest_result}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Security Evidence Log & Manual Entry */}
        {activeTab === 'evidence' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <span>Security Evidence Log</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Vuln ID</th>
                      <th className="p-3">Test ID</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Observation</th>
                      <th className="p-3">Expected Result</th>
                      <th className="p-3">Actual Result</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {evidenceList.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-slate-500 font-mono whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString()}</td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{e.vuln_id || '—'}</td>
                        <td className="p-3 font-mono text-slate-300">{e.test_id}</td>
                        <td className="p-3 font-mono text-slate-400">{e.module}</td>
                        <td className="p-3 text-slate-200">{e.observation}</td>
                        <td className="p-3 text-slate-400">{e.expected_result}</td>
                        <td className="p-3 text-slate-300">{e.actual_result}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            e.status === 'PASS'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}>
                            {e.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Manual Evidence Record Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-sm text-white mb-4">Record Security Evidence Manually</h3>
              <form onSubmit={handleSubmitEvidence} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Finding ID</label>
                  <select
                    value={evVulnId}
                    onChange={(e) => setEvVulnId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    {vulnerabilities.map((v) => (
                      <option key={v.id} value={v.vuln_id}>{v.vuln_id} - {v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Test ID</label>
                  <input
                    required
                    type="text"
                    value={evTestId}
                    onChange={(e) => setEvTestId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Target Module</label>
                  <input
                    required
                    type="text"
                    value={evModule}
                    onChange={(e) => setEvModule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-slate-400 mb-1">Observation</label>
                  <input
                    required
                    type="text"
                    value={evObservation}
                    onChange={(e) => setEvObservation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    placeholder="Verified input parameter sanitization..."
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Expected vs Actual Result</label>
                  <div className="flex gap-2">
                    <input
                      required
                      type="text"
                      value={evExpected}
                      onChange={(e) => setEvExpected(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      placeholder="Expected: Input rejection..."
                    />
                    <input
                      required
                      type="text"
                      value={evActual}
                      onChange={(e) => setEvActual(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                      placeholder="Actual: Rejection with HTTP 400..."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Test Status</label>
                  <div className="flex gap-2">
                    <select
                      value={evStatus}
                      onChange={(e) => setEvStatus(e.target.value as 'PASS' | 'FAIL')}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-white"
                    >
                      <option value="PASS">PASS</option>
                      <option value="FAIL">FAIL</option>
                    </select>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 5: Retest Log & Form */}
        {activeTab === 'retests' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-400" />
                <span>Verification Retest History</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Finding Ref</th>
                      <th className="p-3">Auditor / Tester</th>
                      <th className="p-3">Retest Result</th>
                      <th className="p-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {retestList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-slate-500">
                          No manual retests registered yet. Use the form below to record a retest.
                        </td>
                      </tr>
                    ) : (
                      retestList.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-slate-500 font-mono">{new Date(r.timestamp).toLocaleString()}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{r.finding_id}</td>
                          <td className="p-3 text-white font-semibold">{r.tester}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r.test_result === 'PASS'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {r.test_result}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">{r.notes || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Retest Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="font-bold text-sm text-white mb-2">Execute Vulnerability Retest</h3>
              <p className="text-xs text-slate-400 mb-4">
                Submitting a <span className="text-emerald-400 font-bold">PASS</span> marks the register finding as <span className="text-emerald-400 font-bold">Fixed</span>.
                A <span className="text-red-400 font-bold">FAIL</span> automatically reopens it as <span className="text-red-400 font-bold">Open</span>.
              </p>

              <form onSubmit={handleSubmitRetest} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Target Finding</label>
                  <select
                    value={retestFindingId}
                    onChange={(e) => setRetestFindingId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    {vulnerabilities.map((v) => (
                      <option key={v.id} value={v.vuln_id}>{v.vuln_id} ({v.name})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Auditor / Tester Name</label>
                  <input
                    required
                    type="text"
                    value={retestTester}
                    onChange={(e) => setRetestTester(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Retest Result</label>
                  <select
                    value={retestResult}
                    onChange={(e) => setRetestResult(e.target.value as 'PASS' | 'FAIL')}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                  >
                    <option value="PASS">PASS (Closes Finding)</option>
                    <option value="FAIL">FAIL (Reopens Finding)</option>
                  </select>
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="block text-slate-400 mb-1">Verification Notes</label>
                  <input
                    type="text"
                    value={retestNotes}
                    onChange={(e) => setRetestNotes(e.target.value)}
                    placeholder="Verified input parameter validation on endpoint..."
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold"
                  >
                    Record Retest
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
