import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditEvent } from '../../api/types';
import {
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  FileCode,
} from 'lucide-react';

interface AuditLogViewProps {
  initialTransactionId?: string;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ initialTransactionId }) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [txFilter, setTxFilter] = useState<string>(initialTransactionId || '');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('ALL');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    loadEvents();
  }, [txFilter, outcomeFilter, eventTypeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      if (txFilter) filters.transaction_id = txFilter;
      if (outcomeFilter !== 'ALL') filters.outcome = outcomeFilter;
      if (eventTypeFilter !== 'ALL') filters.event_type = eventTypeFilter;

      const res = await api.getAuditEvents(filters);
      setEvents(res.events);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `securecross_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const uniqueEventTypes = Array.from(new Set(events.map((e) => e.event_type)));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Title & Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB] uppercase tracking-wide">
            <span>Security Architecture</span>
            <span>·</span>
            <span>Structured Audit Log (Screen 9)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172554] mt-1">
            Authoritative Security &amp; Compliance Audit Log
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Immutable structured trace of authentication, biometric verifications, authorization decisions, and replay attempts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#172554] border border-[#E2E8F0] shadow-2xs transition-colors cursor-pointer"
            title="Refresh Events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#2563EB]' : ''}`} />
          </button>

          <button
            onClick={handleExportJson}
            className="min-h-[40px] flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#172554] border border-[#E2E8F0] shadow-2xs text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
            Filter by Transaction ID
          </label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="e.g. tx_..."
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] placeholder-[#64748B] font-mono focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
            Filter by Outcome
          </label>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
          >
            <option value="ALL">ALL OUTCOMES</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DENIED">DENIED</option>
            <option value="FAILED">FAILED</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1.5">
            Filter by Event Type
          </label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs bg-white border border-[#E2E8F0] rounded-lg text-[#172554] font-medium focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-500/15 shadow-2xs"
          >
            <option value="ALL">ALL EVENT TYPES ({events.length})</option>
            {uniqueEventTypes.map((et) => (
              <option key={et} value={et}>
                {et}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Events Feed */}
      <div className="rounded-xl bg-white border border-[#E2E8F0] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#64748B]">
            Loading audit events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B]">
            No audit records found matching selected filters.
          </div>
        ) : (
          <>
            {/* Mobile Cards List (< md) */}
            <div className="md:hidden divide-y divide-[#E2E8F0]">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-4 space-y-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#172554] text-xs truncate max-w-[200px]">
                      {ev.event_type}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${
                        ev.outcome === 'SUCCESS'
                          ? 'bg-green-50 border-green-200 text-[#16A34A]'
                          : ev.outcome === 'DENIED'
                          ? 'bg-red-50 border-red-200 text-[#DC2626]'
                          : ev.outcome === 'FAILED'
                          ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#64748B] space-y-1">
                    <div className="flex justify-between">
                      <span>Actor:</span>
                      <span className="text-[#172554] font-mono">{ev.actor_id} ({ev.actor_role})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reason:</span>
                      <span className="text-[#172554] font-mono">{ev.reason_code || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Correlation:</span>
                      <span className="text-[#2563EB] font-mono truncate max-w-[170px]">{ev.correlation_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timestamp:</span>
                      <span className="font-mono">{new Date(ev.event_timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="w-full min-h-[44px] mt-1 py-2 px-3 rounded-lg bg-[#EFF6FF] hover:bg-blue-100 border border-blue-200 text-[#2563EB] text-xs flex items-center justify-center font-semibold transition-colors"
                  >
                    Inspect Audit Metadata →
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Event Type</th>
                    <th className="py-3 px-4 font-semibold">Outcome</th>
                    <th className="py-3 px-4 font-semibold">Actor</th>
                    <th className="py-3 px-4 font-semibold">Correlation ID</th>
                    <th className="py-3 px-4 font-semibold">Reason Code</th>
                    <th className="py-3 px-4 font-semibold">Timestamp</th>
                    <th className="py-3 px-4 font-semibold text-right">Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {events.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#172554] whitespace-nowrap">
                        {ev.event_type}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            ev.outcome === 'SUCCESS'
                              ? 'bg-green-50 border-green-200 text-[#16A34A]'
                              : ev.outcome === 'DENIED'
                              ? 'bg-red-50 border-red-200 text-[#DC2626]'
                              : ev.outcome === 'FAILED'
                              ? 'bg-amber-50 border-amber-200 text-[#D97706]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                          }`}
                        >
                          {ev.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#172554] font-mono whitespace-nowrap text-[11px]">
                        {ev.actor_id} ({ev.actor_role})
                      </td>
                      <td className="py-3 px-4 text-[#2563EB] font-mono whitespace-nowrap text-[11px]">
                        {ev.correlation_id}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] font-mono whitespace-nowrap text-[11px]">
                        {ev.reason_code || '---'}
                      </td>
                      <td className="py-3 px-4 text-[#64748B] font-mono whitespace-nowrap text-[11px]">
                        {new Date(ev.event_timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className="text-xs text-[#2563EB] hover:text-blue-700 font-semibold hover:underline cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Metadata Detail Dialog */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-semibold text-[#2563EB] uppercase tracking-wider">
                  Audit Record Details
                </span>
                <h3 className="text-base font-bold text-[#172554] font-mono">
                  {selectedEvent.event_type}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-[#64748B] hover:text-[#172554] text-sm font-semibold px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Event ID:</span>
                <span className="text-[#172554] font-mono font-medium">{selectedEvent.id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Correlation ID:</span>
                <span className="text-[#2563EB] font-mono font-medium truncate max-w-[200px]">{selectedEvent.correlation_id}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Outcome:</span>
                <span className="text-[#172554] font-bold">{selectedEvent.outcome}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Reason Code:</span>
                <span className="text-[#172554] font-mono">{selectedEvent.reason_code || 'NONE'}</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <span className="text-[#64748B]">Actor:</span>
                <span className="text-[#172554] font-mono">
                  {selectedEvent.actor_id} [{selectedEvent.actor_role}]
                </span>
              </div>
              {selectedEvent.transaction_id && (
                <div className="flex justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B]">Transaction ID:</span>
                  <span className="text-[#172554] font-mono">{selectedEvent.transaction_id}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#64748B]">
                Sanitized Event Metadata (Zero secrets or raw biometrics):
              </span>
              <pre className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#172554] overflow-x-auto max-h-48 break-all whitespace-pre-wrap">
                {JSON.stringify(selectedEvent.metadata, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-[#E2E8F0] text-right">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] text-[#172554] text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
