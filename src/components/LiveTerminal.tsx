import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Terminal, Trash2, ShieldCheck, Activity, Wifi, WifiOff, Zap, Play, Pause, Search, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { searchLogs } from '../api';

interface LiveTerminalProps {
  filterService?: string;
  apiKey?: string;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ filterService, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [accumulatedLogs, setAccumulatedLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [logsPerSec, setLogsPerSec] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => prev === id ? null : id);
  };
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const logCountRef = useRef(0);
  const lastTsRef = useRef<string | null>(null);
  const isPausedRef = useRef(false);

  // Sync ref to avoid stale closures in WS/polling callbacks
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogsPerSec(logCountRef.current);
      logCountRef.current = 0;
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isIntentionalClose = false;
    let reconnectTimeout: number | null = null;
    let pollingInterval: number | null = null;

    const startPolling = () => {
      if (pollingInterval) return;
      setIsPolling(true);
      console.log('Switching to polling mode (Vercel/Serverless Fallback)');
      
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
              const newLogsWithId = newLogs.map((log: any) => ({
                ...log,
                _client_id: log._client_id || Math.random().toString(36).substring(2, 9)
              }));
              logCountRef.current += newLogsWithId.length;
              setAccumulatedLogs(prev => [...newLogsWithId, ...prev.slice(0, 100 - newLogsWithId.length)]);
              if (!isPausedRef.current) {
                setLogs(prev => [...newLogsWithId, ...prev.slice(0, 100 - newLogsWithId.length)]);
              }
              lastTsRef.current = newLogsWithId[0].timestamp;
            }
          }
        } catch (err) {
          console.error('Polling failed', err);
        }
      };

      poll();
      pollingInterval = window.setInterval(poll, 2500);
    };

    const connect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (isPolling) return;

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
      const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      const wsUrl = apiKey ? `${protocol}//${host}/api/v1/live?api_key=${apiKey}` : `${protocol}//${host}/api/v1/live`;
      
      try {
        const socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
          if (isIntentionalClose) {
            socket.close();
            return;
          }
          setIsConnected(true);
          setIsPolling(false);
          console.log('Connected to live stream');
        };
        
        socket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (filterService && data.service_name !== filterService) return;
          logCountRef.current += 1;
          
          const logWithId = {
            ...data,
            _client_id: data._client_id || Math.random().toString(36).substring(2, 9)
          };
          setAccumulatedLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          if (!isPausedRef.current) {
            setLogs(prev => [logWithId, ...prev.slice(0, 99)]);
          }
          lastTsRef.current = data.timestamp;
        };
        
        socket.onclose = (event) => {
          setIsConnected(false);
          if (!isIntentionalClose) {
            if (event.code === 1006 || window.location.hostname.includes('vercel.app')) {
              startPolling();
            } else {
              console.log('Disconnected from live stream, reconnecting...');
              reconnectTimeout = window.setTimeout(connect, 3000);
            }
          }
        };

        socket.onerror = () => {
          if (!isIntentionalClose) startPolling();
        };
        
        socketRef.current = socket;
      } catch (e) {
        startPolling();
      }
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
    if (scrollRef.current && !isPaused) {
      scrollRef.current.scrollTop = 0;
    }
  }, [logs, isPaused]);

  const clearLogs = () => {
    setLogs([]);
    setAccumulatedLogs([]);
  };

  const handleTogglePause = () => {
    if (isPaused) {
      // Unpausing: sync visible logs with the accumulated buffer
      setAccumulatedLogs(current => {
        setLogs(current);
        return current;
      });
    }
    setIsPaused(!isPaused);
  };

  const getBadgeVariant = (level: string) => {
    switch (level.toUpperCase()) {
      case 'INFO': return 'info';
      case 'WARN': return 'warning';
      case 'ERROR': return 'destructive';
      case 'FATAL': return 'destructive';
      case 'DEBUG': return 'secondary';
      default: return 'default';
    }
  };

  // Perform client-side filter matching (supports Regex and Substring)
  const filteredLogs = logs.filter(log => {
    if (!filterText) return true;
    try {
      const regex = new RegExp(filterText, 'i');
      return (
        regex.test(log.message) || 
        regex.test(log.level) || 
        (log.service_name && regex.test(log.service_name))
      );
    } catch (e) {
      const lowerQuery = filterText.toLowerCase();
      return (
        log.message.toLowerCase().includes(lowerQuery) ||
        log.level.toLowerCase().includes(lowerQuery) ||
        (log.service_name && log.service_name.toLowerCase().includes(lowerQuery))
      );
    }
  });

  const bufferedCount = Math.max(0, accumulatedLogs.length - logs.length);

  return (
    <Card className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-250px)] min-h-[500px] md:min-h-[600px] shadow-sm border-muted overflow-hidden">
      <CardHeader className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 pb-4">
        
        {/* Title & Connection Status */}
        <div className="space-y-1">
          <CardTitle className="text-lg font-bold flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" /> 
              Live Telemetry
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/5 gap-1.5 px-2">
                  <Wifi className="w-3 h-3" /> <span className="hidden xs:inline">STREAMING</span>
                </Badge>
              ) : isPolling ? (
                <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/5 gap-1.5 px-2">
                  <Zap className="w-3 h-3" /> <span className="hidden xs:inline">FAST POLLING</span>
                </Badge>
              ) : (
                <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/5 gap-1.5 px-2">
                  <WifiOff className="w-3 h-3" /> <span className="hidden xs:inline">OFFLINE</span>
                </Badge>
              )}
              <Badge variant="secondary" className="font-mono text-[10px]">{logsPerSec} logs/s</Badge>
            </div>
          </CardTitle>
          <CardDescription className="text-xs">Real-time authenticated ingestion</CardDescription>
        </div>

        {/* Live Controls (Pause, Search Filter, Clear) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto">
          {/* Regex Search Input */}
          <div className="relative flex-grow sm:flex-grow-0 min-w-0">
            <Search className="absolute left-3.5 top-2.5 w-3.5 h-3.5 text-muted-foreground/60" />
            <Input 
              placeholder="Filter regex (e.g. error|auth)..." 
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="h-8.5 pl-9 pr-4 text-xs rounded-full bg-zinc-950/40 border-border/40 focus:border-primary/50 transition-all font-mono min-w-full sm:min-w-[220px]"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Pause/Play Button */}
            <Button 
              onClick={handleTogglePause}
              variant={isPaused ? "secondary" : "outline"} 
              size="sm" 
              className="h-8.5 text-xs font-bold rounded-full gap-1.5 border-muted flex-grow sm:flex-grow-0 cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" /> 
                  Resume {bufferedCount > 0 && <span className="ml-0.5 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full text-[9px] font-black">{bufferedCount}</span>}
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-400" /> 
                  Pause Stream
                </>
              )}
            </Button>

            {/* Clear Button */}
            <Button 
              onClick={clearLogs} 
              variant="ghost" 
              size="sm" 
              className="h-8.5 text-xs font-bold text-muted-foreground hover:text-destructive rounded-full border border-muted flex-grow sm:flex-grow-0 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Clear
            </Button>
          </div>
        </div>

      </CardHeader>
      
      <CardContent className="p-0 border-t flex-grow overflow-hidden bg-[#0a0a0a]">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 md:p-4 font-mono text-[10px] md:text-xs space-y-1.5 scroll-smooth animate-in fade-in"
        >
          {filteredLogs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3 animate-pulse">
              <Activity className="w-8 h-8" />
              <span className="uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-[10px] md:text-sm">
                {filterText ? "No Matching Logs" : "Awaiting Ingestion..."}
              </span>
            </div>
          )}
          {filteredLogs.map((log, i) => {
            const logId = log._client_id || `${log.timestamp}-${i}`;
            const isExpanded = expandedLogId === logId;
            
            let levelBorderClass = "border-l-3 border-l-zinc-700/30";
            if (log.level) {
              const lvl = log.level.toUpperCase();
              if (lvl.includes("ERR") || lvl.includes("FAIL") || lvl.includes("CRIT") || lvl.includes("FATAL")) {
                levelBorderClass = "border-l-3 border-l-red-500 bg-red-950/[0.07] hover:bg-red-950/[0.12]";
              } else if (lvl.includes("WARN")) {
                levelBorderClass = "border-l-3 border-l-amber-500 bg-amber-950/[0.07] hover:bg-amber-950/[0.12]";
              } else if (lvl.includes("INFO")) {
                levelBorderClass = "border-l-3 border-l-blue-500 bg-blue-950/[0.04] hover:bg-blue-950/[0.08]";
              } else if (lvl.includes("DEB")) {
                levelBorderClass = "border-l-3 border-l-zinc-500/50 bg-zinc-900/[0.04] hover:bg-zinc-900/[0.08]";
              }
            }
            
            return (
              <div key={logId} className={`border border-transparent hover:border-zinc-800/80 rounded transition-all overflow-hidden mb-1.5 ${levelBorderClass}`}>
                <div 
                  onClick={() => toggleExpand(logId)}
                  className="flex flex-col xs:flex-row gap-2 xs:gap-4 p-2 rounded transition-colors group relative items-start xs:items-center cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5 flex-shrink-0">
                    <span className="text-muted-foreground/30 group-hover:text-primary transition-colors">
                      <ChevronRight className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-90 text-primary' : ''}`} />
                    </span>
                    <span className="text-muted-foreground/40 select-none text-[9px] md:text-[10px] font-semibold w-12">
                      {new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="min-w-[50px] md:min-w-[55px] inline-block">
                      <Badge variant={getBadgeVariant(log.level)} className="text-[8.5px] uppercase font-black px-1.5 py-0.5 border-none shadow-none leading-none select-none">
                        {log.level}
                      </Badge>
                    </span>
                  </div>
                  <span className="text-gray-300 flex-grow break-all leading-relaxed pr-8">{log.message}</span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex items-center gap-1 ml-auto text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="text-[8.5px] font-bold hidden sm:inline tracking-wider">META</span>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-3.5 bg-[#0d0d0d] border-t border-zinc-900/60 text-gray-400 text-[10px] md:text-xs space-y-3.5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Left: Detailed Metadata info */}
                      <div className="space-y-2.5">
                        <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider">Log Parameters</div>
                        <div className="space-y-1.5 font-mono">
                          <div className="flex items-start">
                            <span className="text-muted-foreground/50 w-24 flex-shrink-0">Timestamp:</span>
                            <span className="text-gray-300 break-all">{log.timestamp}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-muted-foreground/50 w-24 flex-shrink-0">Level:</span>
                            <span className="text-gray-300 break-all uppercase font-bold">{log.level}</span>
                          </div>
                          <div className="flex items-start">
                            <span className="text-muted-foreground/50 w-24 flex-shrink-0">Service:</span>
                            <span className="text-gray-300 break-all">{log.service_name || 'unknown'}</span>
                          </div>
                          {log.status_code !== undefined && log.status_code !== null && (
                            <div className="flex items-start">
                              <span className="text-muted-foreground/50 w-24 flex-shrink-0">Status Code:</span>
                              <span className={`font-bold ${log.status_code >= 400 ? 'text-red-400' : 'text-emerald-400'}`}>{log.status_code}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Raw JSON payload with copy button */}
                      <div className="space-y-2">
                        <div className="text-[9px] uppercase font-bold text-muted-foreground/60 tracking-wider flex items-center justify-between">
                          <span>Raw JSON Payload</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                            }}
                            className="text-[9px] text-primary hover:text-primary-hover hover:underline font-bold cursor-pointer"
                          >
                            Copy Payload
                          </button>
                        </div>
                        <pre className="p-3 rounded bg-zinc-950/80 border border-zinc-900 text-[9.5px] leading-relaxed text-zinc-300 max-h-[160px] overflow-y-auto font-mono scrollbar-thin select-text">
                          {JSON.stringify(log, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
