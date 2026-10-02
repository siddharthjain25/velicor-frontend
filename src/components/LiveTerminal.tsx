import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from './ui/input';
import {
  Terminal, Trash2, Activity, Wifi, WifiOff, Zap,
  Play, Pause, Search, ChevronRight, Copy, Check,
  X, Filter
} from 'lucide-react';
import { searchLogs } from '../api';

interface LiveTerminalProps {
  filterService?: string;
  apiKey?: string;
}

// ── severity helpers ──────────────────────────────────────────────────────────

function getSeverityStyle(level: string): {
  bar: string;
  badge: string;
  label: string;
} {
  const lvl = (level || 'INFO').toUpperCase();

  if (lvl === 'FATAL' || lvl === 'CRITICAL' || lvl === 'CRIT') {
    return { bar: 'bg-red-600', badge: 'text-red-300 bg-red-950/60 border-red-800/60', label: 'FATAL' };
  }
  if (lvl.startsWith('ERR')) {
    return { bar: 'bg-red-500', badge: 'text-red-400 bg-red-950/40 border-red-800/40', label: 'ERROR' };
  }
  if (lvl === 'WARN' || lvl === 'WARNING') {
    return { bar: 'bg-amber-500', badge: 'text-amber-400 bg-amber-950/40 border-amber-800/40', label: 'WARN' };
  }
  if (lvl === 'NOTICE') {
    return { bar: 'bg-sky-500', badge: 'text-sky-400 bg-sky-950/40 border-sky-800/40', label: 'NOTCE' };
  }
  if (lvl === 'DEBUG') {
    return { bar: 'bg-zinc-600', badge: 'text-zinc-400 bg-zinc-900/60 border-zinc-700/40', label: 'DEBUG' };
  }
  if (lvl === 'TRACE') {
    return { bar: 'bg-zinc-700', badge: 'text-zinc-500 bg-zinc-900/40 border-zinc-800/40', label: 'TRACE' };
  }
  return { bar: 'bg-blue-500', badge: 'text-blue-400 bg-blue-950/40 border-blue-800/40', label: 'INFO' };
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const ss = d.getSeconds().toString().padStart(2, '0');
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  } catch {
    return ts.slice(0, 12);
  }
}

// ── copy button ───────────────────────────────────────────────────────────────

function CopyButton({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [value]);

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800/60"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {label && <span>{copied ? 'Copied' : label}</span>}
    </button>
  );
}

// ── expanded detail panel ─────────────────────────────────────────────────────

function LogDetailPanel({ log, isoTime, onFilterService }: {
  log: any;
  isoTime: string;
  onFilterService?: (svc: string) => void;
}) {
  const fields: Array<{ key: string; value: React.ReactNode; copyValue?: string }> = [
    { key: '@timestamp', value: <span className="text-zinc-200">{isoTime}</span>, copyValue: isoTime },
    { key: '@level', value: <span className="text-zinc-200">{log.level || 'INFO'}</span> },
    ...(log.service_name ? [{ key: '@service', value: <span className="text-emerald-400">{log.service_name}</span>, copyValue: log.service_name }] : []),
    { key: '@message', value: <span className="text-zinc-200 break-all">{log.message}</span>, copyValue: log.message },
    ...(log.status_code != null ? [{
      key: '@status',
      value: <span className={log.status_code >= 400 ? 'text-red-400 font-bold font-mono' : 'text-emerald-400 font-bold font-mono'}>{log.status_code}</span>,
      copyValue: String(log.status_code),
    }] : []),
  ];

  const metaEntries = log.metadata && typeof log.metadata === 'object'
    ? Object.entries(log.metadata as Record<string, unknown>)
    : [];

  return (
    <div className="bg-[#080a0e] border-t border-zinc-800/80">
      {/* action bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800/60 bg-[#0c0e14]">
        <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold mr-auto">Log Details</span>
        <CopyButton value={JSON.stringify(log, null, 2)} label="Copy JSON" />
        {log.service_name && onFilterService && (
          <button
            onClick={(e) => { e.stopPropagation(); onFilterService(log.service_name); }}
            className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-200 transition-colors px-1.5 py-0.5 rounded border border-transparent hover:border-zinc-700 hover:bg-zinc-800/60"
          >
            <Filter className="w-3 h-3" />
            <span>Filter service</span>
          </button>
        )}
      </div>

      {/* fields */}
      <div className="px-3 py-2 space-y-0.5 font-mono text-[11px]">
        {fields.map(f => (
          <div key={f.key} className="flex items-start gap-2 group py-0.5">
            <span className="text-cyan-500/80 w-28 shrink-0 pt-px">{f.key}</span>
            <div className="flex-1 min-w-0">{f.value}</div>
            {f.copyValue && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <CopyButton value={f.copyValue} />
              </div>
            )}
          </div>
        ))}

        {metaEntries.length > 0 && (
          <>
            <div className="pt-1.5 pb-0.5">
              <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">metadata</span>
            </div>
            {metaEntries.map(([k, v]) => (
              <div key={k} className="flex items-start gap-2 group py-0.5 pl-2 border-l border-zinc-800/60">
                <span className="text-violet-400/70 w-28 shrink-0 pt-px truncate">{k}</span>
                <span className="text-zinc-300 flex-1 break-all">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <CopyButton value={typeof v === 'object' ? JSON.stringify(v) : String(v)} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// ── log row ───────────────────────────────────────────────────────────────────

function LogRow({ log, index, isExpanded, onToggle, onFilterService }: {
  log: any;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onFilterService?: (svc: string) => void;
}) {
  const isoTime = log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString();
  const shortTime = formatTimestamp(isoTime);
  const sev = getSeverityStyle(log.level || 'INFO');

  return (
    <div className={`border-b border-zinc-800/30 ${isExpanded ? 'bg-[#0e1117]' : index % 2 === 0 ? 'bg-[#090b0f]' : 'bg-[#0b0d12]'} hover:bg-[#0e1117] transition-colors`}>
      <div
        className="flex items-center cursor-pointer select-none group"
        onClick={onToggle}
      >
        {/* severity bar */}
        <div className={`w-0.5 self-stretch shrink-0 ${sev.bar}`} />

        {/* chevron */}
        <div className="w-7 flex items-center justify-center shrink-0 py-1.5">
          <ChevronRight className={`w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-all ${isExpanded ? 'rotate-90 !text-zinc-300' : ''}`} />
        </div>

        {/* timestamp */}
        <span className="text-zinc-500 font-mono text-[11px] shrink-0 w-[88px] tabular-nums py-1.5">
          {shortTime}
        </span>

        {/* level badge */}
        <span className={`font-mono text-[10px] font-semibold border shrink-0 w-[46px] text-center px-1 py-px rounded-sm mr-3 my-1.5 ${sev.badge}`}>
          {sev.label.trim()}
        </span>

        {/* service tag */}
        <span className="text-emerald-500/70 font-mono text-[11px] shrink-0 w-[96px] truncate mr-3 py-1.5">
          {log.service_name || '—'}
        </span>

        {/* message */}
        <span className="text-zinc-200 font-mono text-[11px] flex-1 min-w-0 truncate pr-3 py-1.5 group-hover:text-white transition-colors">
          {log.message}
        </span>

        {/* status code pill */}
        {log.status_code != null && (
          <span className={`font-mono text-[10px] font-bold shrink-0 mr-3 my-1.5 px-1.5 py-px rounded-sm ${
            log.status_code >= 400 ? 'text-red-400 bg-red-950/40' : 'text-emerald-400 bg-emerald-950/30'
          }`}>
            {log.status_code}
          </span>
        )}

        {/* metadata indicator */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <span className="text-zinc-600 font-mono text-[9px] shrink-0 mr-2 my-1.5 px-1.5 py-px border border-zinc-800 rounded-sm">
            +{Object.keys(log.metadata).length}
          </span>
        )}
      </div>

      {isExpanded && (
        <LogDetailPanel log={log} isoTime={isoTime} onFilterService={onFilterService} />
      )}
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ filterService, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [accumulatedLogs, setAccumulatedLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [logsPerSec, setLogsPerSec] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const toggleExpand = (id: string) => setExpandedLogId(prev => prev === id ? null : id);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const logCountRef = useRef(0);
  const lastTsRef = useRef<string | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(() => { setLogsPerSec(logCountRef.current); logCountRef.current = 0; }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isIntentionalClose = false;
    let reconnectTimeout: number | null = null;
    let pollingInterval: number | null = null;

    const startPolling = () => {
      if (pollingInterval) return;
      setIsPolling(true);
      const poll = async () => {
        if (!apiKey) return;
        try {
          const results = await searchLogs(apiKey, {
            limit: 50,
            start_ts: lastTsRef.current || new Date(Date.now() - 5000).toISOString()
          });
          if (results && results.length > 0) {
            const newLogs = results.filter((log: any) =>
              !lastTsRef.current || new Date(log.timestamp) > new Date(lastTsRef.current)
            );
            if (newLogs.length > 0) {
              const withId = newLogs.map((log: any) => ({
                ...log,
                _client_id: log._client_id || Math.random().toString(36).substring(2, 9)
              }));
              logCountRef.current += withId.length;
              setAccumulatedLogs(prev => [...withId, ...prev.slice(0, 100 - withId.length)]);
              if (!isPausedRef.current) setLogs(prev => [...withId, ...prev.slice(0, 100 - withId.length)]);
              lastTsRef.current = withId[0].timestamp;
            }
          }
        } catch (err) { console.error('Polling failed', err); }
      };
      poll();
      pollingInterval = window.setInterval(poll, 2500);
    };

    const connect = () => {
      if (reconnectTimeout) { clearTimeout(reconnectTimeout); reconnectTimeout = null; }
      if (isPolling) return;
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
      const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      const wsUrl = apiKey
        ? `${protocol}//${host}/api/v1/live?api_key=${apiKey}`
        : `${protocol}//${host}/api/v1/live`;
      try {
        const socket = new WebSocket(wsUrl);
        socket.onopen = () => {
          if (isIntentionalClose) { socket.close(); return; }
          setIsConnected(true); setIsPolling(false);
        };
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (filterService && data.service_name !== filterService) return;
          logCountRef.current += 1;
          const logWithId = { ...data, _client_id: data._client_id || Math.random().toString(36).substring(2, 9) };
          setAccumulatedLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          if (!isPausedRef.current) setLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          lastTsRef.current = data.timestamp;
        };
        socket.onclose = (event) => {
          setIsConnected(false);
          if (!isIntentionalClose) {
            if (event.code === 1006 || window.location.hostname.includes('vercel.app')) startPolling();
            else reconnectTimeout = window.setTimeout(connect, 3000);
          }
        };
        socket.onerror = () => { if (!isIntentionalClose) startPolling(); };
        socketRef.current = socket;
      } catch { startPolling(); }
    };

    connect();
    return () => {
      isIntentionalClose = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollingInterval) clearInterval(pollingInterval);
      socketRef.current?.close();
    };
  }, [filterService, apiKey]);

  useEffect(() => {
    if (scrollRef.current && !isPaused) scrollRef.current.scrollTop = 0;
  }, [logs, isPaused]);

  const clearLogs = () => { setLogs([]); setAccumulatedLogs([]); };

  const handleTogglePause = () => {
    if (isPaused) setAccumulatedLogs(current => { setLogs(current); return current; });
    setIsPaused(!isPaused);
  };

  const filteredLogs = logs.filter(log => {
    const matchLevel = !levelFilter || (log.level || '').toUpperCase().startsWith(levelFilter.toUpperCase());
    if (!matchLevel) return false;
    if (!filterText) return true;
    const kvMatch = filterText.match(/^(\w+):(.+)$/);
    if (kvMatch) {
      const [, k, v] = kvMatch;
      const kl = k.toLowerCase();
      if (kl === 'level') return (log.level || '').toLowerCase().includes(v.toLowerCase());
      if (kl === 'service') return (log.service_name || '').toLowerCase().includes(v.toLowerCase());
      if (kl === 'status') return String(log.status_code || '') === v;
      if (kl === 'message') return (log.message || '').toLowerCase().includes(v.toLowerCase());
    }
    try {
      const regex = new RegExp(filterText, 'i');
      return regex.test(log.message) || regex.test(log.level) || regex.test(log.service_name || '');
    } catch {
      const q = filterText.toLowerCase();
      return log.message.toLowerCase().includes(q) || (log.service_name || '').toLowerCase().includes(q);
    }
  });

  const bufferedCount = Math.max(0, accumulatedLogs.length - logs.length);
  const hasActiveFilters = filterText || levelFilter;

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-230px)] min-h-[500px] bg-[#090b0f] border border-zinc-800/60 rounded-md overflow-hidden">

      {/* ── toolbar ── */}
      <div className="flex flex-col shrink-0 border-b border-zinc-800/60 bg-[#0c0e13]">

        {/* top bar */}
        <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
          <Terminal className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span className="text-[11px] font-semibold text-zinc-300 shrink-0 mr-1">Live Stream</span>

          {isConnected ? (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          ) : isPolling ? (
            <span className="flex items-center gap-1 text-[10px] text-blue-400 font-mono font-bold shrink-0">
              <Zap className="w-3 h-3" />POLLING
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] text-red-400 font-mono font-bold shrink-0">
              <WifiOff className="w-3 h-3" />OFFLINE
            </span>
          )}

          <span className="text-[10px] text-zinc-600 font-mono shrink-0">{logsPerSec}/s</span>
          <span className="text-[10px] text-zinc-600 font-mono shrink-0">
            {filteredLogs.length}{hasActiveFilters ? ' matched' : ' entries'}
          </span>

          <div className="flex-1" />

          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
              hasActiveFilters
                ? 'border-amber-600/50 text-amber-400 bg-amber-950/20 hover:bg-amber-950/40'
                : 'border-zinc-700/60 text-zinc-400 bg-transparent hover:bg-zinc-800/60 hover:text-zinc-200'
            }`}
          >
            <Filter className="w-3 h-3" />Filters
            {hasActiveFilters && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
          </button>

          <button
            onClick={handleTogglePause}
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border transition-colors font-medium ${
              isPaused
                ? 'border-emerald-600/50 text-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40'
                : 'border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800/60'
            }`}
          >
            {isPaused ? (
              <>
                <Play className="w-3 h-3" />Resume
                {bufferedCount > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-400 px-1 rounded text-[9px] font-bold">{bufferedCount}</span>
                )}
              </>
            ) : (
              <><Pause className="w-3 h-3" />Pause</>
            )}
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border border-zinc-700/60 text-zinc-500 hover:text-red-400 hover:border-red-800/50 hover:bg-red-950/20 transition-colors"
          >
            <Trash2 className="w-3 h-3" />Clear
          </button>
        </div>

        {/* filter bar */}
        {showFilters && (
          <div className="flex items-center gap-2 px-3 pb-2 border-t border-zinc-800/40 pt-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500 pointer-events-none" />
              <Input
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Search… (level:error, service:api)"
                className="h-7 pl-7 pr-7 text-[11px] font-mono bg-[#080a0e] border-zinc-700/60 text-zinc-200 placeholder:text-zinc-600 rounded focus-visible:ring-0 focus:border-zinc-500"
              />
              {filterText && (
                <button onClick={() => setFilterText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              {['', 'ERROR', 'WARN', 'INFO', 'DEBUG'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setLevelFilter(lvl)}
                  className={`text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${
                    levelFilter === lvl
                      ? 'border-zinc-500 text-zinc-100 bg-zinc-700/60'
                      : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 bg-transparent'
                  }`}
                >
                  {lvl || 'ALL'}
                </button>
              ))}
            </div>
            {hasActiveFilters && (
              <button onClick={() => { setFilterText(''); setLevelFilter(''); }} className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors ml-1">
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* column headers */}
        <div className="flex items-center px-3 py-1 border-t border-zinc-800/40 bg-[#080a0e]">
          <div className="w-0.5 shrink-0" />
          <div className="w-7 shrink-0" />
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[88px] shrink-0 font-medium">Time</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[46px] shrink-0 mr-3 font-medium">Level</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 w-[96px] shrink-0 mr-3 font-medium">Service</span>
          <span className="text-[9px] uppercase tracking-widest text-zinc-600 flex-1 font-medium">Message</span>
        </div>
      </div>

      {/* ── log stream ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
        {isPaused && (
          <div className="sticky top-0 z-10 flex items-center gap-2 px-3 py-1.5 bg-amber-950/60 border-b border-amber-800/40 text-amber-300 text-[11px] font-medium backdrop-blur-sm">
            <Pause className="w-3 h-3" />
            Stream paused — {bufferedCount > 0 ? `${bufferedCount} new entries buffered` : 'no new entries'}
            <button onClick={handleTogglePause} className="ml-auto text-amber-400 hover:text-amber-200 underline underline-offset-2 text-[10px]">Resume</button>
          </div>
        )}

        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-700 py-20">
            {logs.length === 0 ? (
              <>
                <Activity className="w-8 h-8" />
                <div className="text-center">
                  <p className="text-[11px] font-mono font-semibold text-zinc-600 uppercase tracking-widest">
                    {isConnected ? 'Awaiting log events…' : isPolling ? 'Polling for logs…' : 'Connecting…'}
                  </p>
                  <p className="text-[10px] text-zinc-700 mt-1">Log entries will appear here as they are ingested</p>
                </div>
              </>
            ) : (
              <>
                <Search className="w-7 h-7" />
                <div className="text-center">
                  <p className="text-[11px] font-mono font-semibold text-zinc-600 uppercase tracking-widest">No logs match filters</p>
                  <button onClick={() => { setFilterText(''); setLevelFilter(''); }} className="text-[10px] text-blue-500 hover:text-blue-400 mt-1 underline underline-offset-2">
                    Clear filters
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {filteredLogs.map((log, i) => {
          const logId = log._client_id || `${log.timestamp}-${i}`;
          return (
            <LogRow
              key={logId}
              log={log}
              index={i}
              isExpanded={expandedLogId === logId}
              onToggle={() => toggleExpand(logId)}
              onFilterService={(svc) => { setFilterText(svc); setShowFilters(true); }}
            />
          );
        })}
      </div>

      {/* ── footer ── */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-1 border-t border-zinc-800/60 bg-[#0c0e13] text-[9px] font-mono text-zinc-600">
        <Wifi className={`w-3 h-3 ${isConnected ? 'text-emerald-500' : isPolling ? 'text-blue-500' : 'text-zinc-700'}`} />
        <span>{isConnected ? 'WebSocket' : isPolling ? 'HTTP Polling (2.5s)' : 'Disconnected'}</span>
        <span className="ml-auto">{filteredLogs.length} / {logs.length} entries</span>
      </div>
    </div>
  );
};
