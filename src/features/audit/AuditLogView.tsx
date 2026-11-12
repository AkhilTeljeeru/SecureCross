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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
            <span>SECURITY ARCHITECTURE</span>
            <span>·</span>
            <span>STRUCTURED AUDIT LOG (SCREEN 9)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Authoritative Security & Compliance Audit Log
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable structured trace of authentication, biometric verifications, authorization decisions, and replay attempts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            disabled={loading}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title="Refresh Events"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportJson}
            className="min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] font-mono text-slate-400 block mb-1">
            FILTER BY TRANSACTION ID
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. tx_..."
              value={txFilter}
              onChange={(e) => setTxFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 block mb-1">
            FILTER BY OUTCOME
          </label>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-md text-white focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="ALL">ALL OUTCOMES</option>
            <option value="SUCCESS">SUCCESS</option>
            <option value="DENIED">DENIED</option>
            <option value="FAILED">FAILED</option>
            <option value="WARNING">WARNING</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-400 block mb-1">
            FILTER BY EVENT TYPE
          </label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-full py-1.5 px-3 text-xs bg-slate-900 border border-slate-800 rounded-md text-white focus:outline-none focus:border-indigo-500 font-mono"
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
      <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            Loading audit events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 font-mono">
            No audit records found matching selected filters.
          </div>
        ) : (
          <>
            {/* Mobile Cards List (< md) */}
            <div className="md:hidden divide-y divide-slate-800">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-4 space-y-2.5 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-white text-xs truncate max-w-[200px]">
                      {ev.event_type}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold shrink-0 ${
                        ev.outcome === 'SUCCESS'
                          ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                          : ev.outcome === 'DENIED'
                          ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                          : ev.outcome === 'FAILED'
                          ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-300'
                      }`}
                    >
                      {ev.outcome}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actor:</span>
                      <span className="text-slate-300">{ev.actor_id} ({ev.actor_role})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reason:</span>
                      <span className="text-slate-300">{ev.reason_code || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Correlation:</span>
                      <span className="text-indigo-400 truncate max-w-[170px]">{ev.correlation_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Timestamp:</span>
                      <span>{new Date(ev.event_timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="w-full min-h-[44px] mt-1 py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400 font-mono text-xs flex items-center justify-center font-medium"
                  >
                    Inspect Audit Metadata →
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 text-[11px]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">EVENT TYPE</th>
                    <th className="py-3 px-4 font-semibold">OUTCOME</th>
                    <th className="py-3 px-4 font-semibold">ACTOR</th>
                    <th className="py-3 px-4 font-semibold">CORRELATION ID</th>
                    <th className="py-3 px-4 font-semibold">REASON CODE</th>
                    <th className="py-3 px-4 font-semibold">TIMESTAMP</th>
                    <th className="py-3 px-4 font-semibold text-right">METADATA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {events.map((ev) => (
                    <tr
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {ev.event_type}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            ev.outcome === 'SUCCESS'
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : ev.outcome === 'DENIED'
                              ? 'bg-rose-950/60 border-rose-800 text-rose-400'
                              : ev.outcome === 'FAILED'
                              ? 'bg-amber-950/60 border-amber-800 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-300'
                          }`}
                        >
                          {ev.outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-[11px]">
                        {ev.actor_id} ({ev.actor_role})
                      </td>
                      <td className="py-3 px-4 text-indigo-400 whitespace-nowrap text-[11px]">
                        {ev.correlation_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {ev.reason_code || '---'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(ev.event_timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 underline"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase">
                  Audit Record Details
                </span>
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedEvent.event_type}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-mono p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Event ID:</span>
                <span className="text-slate-200">{selectedEvent.id}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Correlation ID:</span>
                <span className="text-indigo-300 truncate max-w-[200px]">{selectedEvent.correlation_id}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Outcome:</span>
                <span className="text-white font-bold">{selectedEvent.outcome}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Reason Code:</span>
                <span className="text-slate-200">{selectedEvent.reason_code || 'NONE'}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-950">
                <span className="text-slate-400">Actor:</span>
                <span className="text-slate-200">
                  {selectedEvent.actor_id} [{selectedEvent.actor_role}]
                </span>
              </div>
              {selectedEvent.transaction_id && (
                <div className="flex justify-between p-2 rounded bg-slate-950">
                  <span className="text-slate-400">Transaction ID:</span>
                  <span className="text-slate-200">{selectedEvent.transaction_id}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400">
                Sanitized Event Metadata (Zero secrets or raw biometrics):
              </span>
              <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48 break-all whitespace-pre-wrap">
                {JSON.stringify(selectedEvent.metadata, null, 2)}
              </pre>
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
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
