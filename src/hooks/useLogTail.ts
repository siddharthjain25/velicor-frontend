import { useState, useEffect, useRef } from 'react';

export function useLogTail(serviceName?: string) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let isIntentionalClose = false;
    let reconnectTimeout: number | null = null;

    const connect = () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }

      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
      const protocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:';
      const host = apiUrl.replace(/^https?:\/\//, '');
      const socket = new WebSocket(`${protocol}//${host}/api/v1/live`);

      socket.onopen = () => {
        if (isIntentionalClose) {
          socket.close();
          return;
        }
        setIsConnected(true);
      };
      
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (serviceName && data.service_name !== serviceName) return;
        setLogs((prev) => [...prev.slice(-99), data]);
      };

      socket.onclose = () => {
        setIsConnected(false);
        if (!isIntentionalClose) {
          reconnectTimeout = window.setTimeout(connect, 3000);
        }
      };

      socketRef.current = socket;
    };

    connect();

    return () => {
      isIntentionalClose = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      socketRef.current?.close();
    };
  }, [serviceName]);

  return { logs, isConnected, clearLogs: () => setLogs([]) };
}
