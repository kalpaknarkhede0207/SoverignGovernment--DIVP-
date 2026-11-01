import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  ShieldAlertIcon,
  LockIcon,
  CpuIcon,
  FileTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  QrCodeIcon
} from './icons/SvgIcons';

/**
 * SG-DIVP React SaaS Application
 * Standard modular React component architecture for Sovereign Government Document Intelligence.
 */
export default function App() {
  const [activeTab, setActiveTab] = useState('scrutiny');
  const [role, setRole] = useState('L1_SCRUTINY_CLERK');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/90 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/10">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">SG-DIVP Sovereign Platform</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">SIH 2026</span>
              </div>
              <p className="text-xs text-slate-500">Air-Gapped Government Document Intelligence & WORM Audit</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>AIR-GAP: ZERO EGRESS (0 BYTES)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main SaaS Body */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileTextIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Cases Verified Today</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">142</div>
              <div className="text-xs text-emerald-600 font-semibold">+24.8% velocity</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">WORM Tamper Check</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">100% PASS</div>
              <div className="text-xs text-slate-500 font-semibold">Latency: 0.12 ms</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
              <CpuIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">Edge Inference Speed</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">1.24s</div>
              <div className="text-xs text-indigo-600 font-semibold">0ms cloud lag</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <LockIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium">External WAN Egress</div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight">0 Bytes</div>
              <div className="text-xs text-emerald-600 font-semibold">100% air-gap sealed</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 bg-white p-2 rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab('scrutiny')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'scrutiny' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Split-Screen Scrutiny
          </button>
          <button
            onClick={() => setActiveTab('gazette')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'gazette' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Gazette Rule Studio (DMN)
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'ledger' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            WORM Cryptographic Ledger
          </button>
          <button
            onClick={() => setActiveTab('airgap')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'airgap' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Air-Gap Telemetry Center
          </button>
        </div>
      </main>
    </div>
  );
}
