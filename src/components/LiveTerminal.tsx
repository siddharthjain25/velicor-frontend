import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Terminal, Trash2, ShieldCheck, Activity, Wifi, WifiOff, Zap } from 'lucide-react';
import { Badge } from './ui/Badge';
import { searchLogs } from '../api';

interface LiveTerminalProps {
  filterService?: string;
  apiKey?: string;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ filterService, apiKey }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [logsPerSec, setLogsPerSec] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const logCountRef = useRef(0);
  const lastTsRef = useRef<string | null>(null);

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
            // Sort by timestamp to ensure chronological order
            const newLogs = results.filter((log: any) => 
              !lastTsRef.current || new Date(log.timestamp) > new Date(lastTsRef.current)
            ).reverse();

            if (newLogs.length > 0) {
              logCountRef.current += newLogs.length;
              setLogs(prev => [...prev.slice(-(100 - newLogs.length)), ...newLogs]);
              lastTsRef.current = newLogs[newLogs.length - 1].timestamp;
            }
          }
        } catch (err) {
          console.error('Polling failed', err);
        }
      };

      poll(); // Immediate first poll
      pollingInterval = window.setInterval(poll, 2500);
    };

    const connect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      if (isPolling) return; // Don't try WS if already polling

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
          setLogs((prev) => [...prev.slice(-99), data]);
          lastTsRef.current = data.timestamp;
        };
        
        socket.onclose = (event) => {
          setIsConnected(false);
          // If the connection was closed with a protocol error or if it's Vercel
          // we switch to polling immediately. 1006 is "Abnormal Closure"
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
          // If WS fails (common on Vercel), fallback to polling
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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const clearLogs = () => setLogs([]);

  const getLevelColor = (level: string) => {
    switch (level.toUpperCase()) {
      case 'ERROR': return 'text-red-400 font-black underline';
      case 'WARN': return 'text-yellow-400 font-bold';
      case 'DEBUG': return 'text-blue-400 italic';
      case 'FATAL': return 'text-red-600 font-black bg-red-100 px-1';
      default: return 'text-green-400';
    }
  };

  return (
    <Card className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-250px)] min-h-[500px] md:min-h-[600px] shadow-sm border-muted overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
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
        <Button onClick={clearLogs} variant="ghost" size="sm" className="h-8 w-full sm:w-auto text-muted-foreground hover:text-destructive rounded-full border border-muted sm:border-none">
          <Trash2 className="w-4 h-4 mr-2" /> Clear Terminal
        </Button>
      </CardHeader>
      <CardContent className="p-0 border-t flex-grow overflow-hidden bg-[#0a0a0a]">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 md:p-4 font-mono text-[10px] md:text-xs space-y-1.5 scroll-smooth"
        >
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/30 gap-3 animate-pulse">
              <Activity className="w-8 h-8" />
              <span className="uppercase tracking-[0.2em] md:tracking-[0.3em] font-black text-[10px] md:text-sm">Awaiting Ingestion...</span>
            </div>
          )}
          {logs.map((log, i) => (
            <div key={i} className="flex flex-col xs:flex-row gap-1 xs:gap-3 hover:bg-white/5 p-1.5 rounded transition-colors group relative">
              <div className="flex items-center gap-2 xs:block">
                <span className="text-muted-foreground/40 select-none text-[9px] md:text-[10px]">
                  {new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className={`min-w-[45px] md:min-w-[50px] font-black uppercase text-[9px] md:text-[10px] ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
              </div>
              <span className="text-gray-300 flex-grow break-all leading-relaxed">{log.message}</span>
              {log.metadata && Object.keys(log.metadata).length > 0 && (
                <div className="hidden sm:group-hover:block ml-auto opacity-40">
                  <ShieldCheck className="w-3 h-3 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
