import React, { useState, useEffect } from 'react';
import {
  Shield,
  Activity,
  Users,
  Building,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileCheck,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useApp();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMetrics();
      setMetrics(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin & Trust Control</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Indore marketplace telemetry, automatic listing expiration monitoring & safety moderation.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          title="Refresh metrics"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase">Active 10d Listings</span>
              <Building className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-white">{metrics.activeListings}</p>
            <p className="text-[11px] text-emerald-400 mt-1">✓ Available in live feeds</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase">Expired Listings</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-400">{metrics.expiredListings}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Stored for history/analytics</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase">Daily Active Users</span>
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-3xl font-black text-white">{metrics.dailyActiveUsers}</p>
            <p className="text-[11px] text-sky-400 mt-1">+18% growth this week</p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-zinc-400 mb-2">
              <span className="text-xs font-bold uppercase">Total Inquiries</span>
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-3xl font-black text-rose-400">{metrics.totalInquiries}</p>
            <p className="text-[11px] text-zinc-500 mt-1">Connected tenants & hosts</p>
          </div>
        </div>
      )}

      {/* Expiration Rules Audit Box */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 mb-8 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-extrabold text-white">
            10-Day Expiration Engine Health
          </h2>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">
          The server worker is continuously validating timestamps. When a rental listing exceeds 10 days,
          its status changes from <strong>ACTIVE</strong> to <strong>EXPIRED</strong>, immediately hiding it from
          search, Explore, and recommendation feeds, while notifying the owner for 1-click renewal.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            <span>Worker Status: ONLINE (30s interval)</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-semibold text-zinc-300">
            Current City: Indore, MP
          </div>
        </div>
      </div>

      {/* Safety & Verification Queue */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h3 className="text-base font-extrabold text-white mb-4">
          Pending Verification & Trust Desk
        </h3>
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                ABC
              </div>
              <div>
                <p className="text-xs font-bold text-white">ABC Premium Executive PG</p>
                <p className="text-[11px] text-zinc-400">Electricity Bill & Municipal License verified</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
              Verified Host
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                AS
              </div>
              <div>
                <p className="text-xs font-bold text-white">Aman Sharma (Student Tenant)</p>
                <p className="text-[11px] text-zinc-400">SGSITS College ID card uploaded</p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Verified Tenant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
