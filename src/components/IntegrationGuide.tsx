import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Terminal, Copy, Check, Code2, Cpu, AlertTriangle } from 'lucide-react';
import { useCustomDialog } from '../context/DialogContext';
import { Badge } from './ui/badge';

interface IntegrationGuideProps {
  apiKey: string;
  serviceName: string;
}

export const IntegrationGuide: React.FC<IntegrationGuideProps> = ({ apiKey, serviceName }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const customDialog = useCustomDialog();
  
  // Ensure we have an absolute URL for the SDK snippets
  const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9000';
  const baseUrl = (rawBaseUrl.startsWith('http') 
    ? rawBaseUrl 
    : `${window.location.origin}${rawBaseUrl}`).replace(/\/$/, '');

  const copyToClipboard = async (text: string, id: string) => {
    if (!apiKey) {
      await customDialog.alert({
        title: "API Key Required",
        description: "Please ensure you have a valid API key before copying snippets.",
      });
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const displayApiKey = apiKey || 'YOUR_API_KEY';

  const snippets = [
    {
      id: 'curl',
      name: 'cURL',
      language: 'bash',
      icon: <Terminal className="w-4 h-4" />,
      code: `curl -X POST ${baseUrl}/api/v1/ingest \\
  -H "x-api-key: ${displayApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "level": "INFO",
    "message": "Hello from ${serviceName}",
    "metadata": {"env": "production"}
  }'`
    },
    {
      id: 'python',
      name: 'Python (Serverless Optimized)',
      language: 'python',
      icon: <Cpu className="w-4 h-4" />,
      code: `import requests
import time
import os

def log_to_velicor(level, message, metadata=None):
    payload = {
        "level": level,
        "message": message,
        "timestamp": time.time(),
        "service_name": "${serviceName}",
        "metadata": metadata or {}
    }
    headers = {"x-api-key": "${displayApiKey}"}
    
    # Note: On Vercel, this request must be synchronous to avoid freezing.
    # On persistent servers, consider using a background queue.
    try:
        requests.post("${baseUrl}/api/v1/ingest", json=payload, headers=headers, timeout=2)
    except Exception as e:
        print(f"Velicor logging failed: {e}")

# Usage
log_to_velicor("INFO", "Order processed", {"order_id": 5521})`
    },
    {
      id: 'nodejs',
      name: 'Node.js (Serverless Optimized)',
      language: 'javascript',
      icon: <Code2 className="w-4 h-4" />,
      code: `const axios = require('axios');

const logToVelicor = async (level, message, metadata = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    service_name: '${serviceName}',
    ...metadata
  };

  try {
    // IMPORTANT: On Vercel/Serverless, you MUST 'await' this call 
    // to ensure logs are sent before the function terminates.
    await axios.post('${baseUrl}/api/v1/ingest', payload, {
      headers: { 'x-api-key': '${displayApiKey}' },
      timeout: 2000
    });
  } catch (err) {
    console.error('Velicor logging failed:', err.message);
  }
};

// Usage
await logToVelicor('ERROR', 'Auth failure', { user: 'sid' });`
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-muted shadow-sm overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Code2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>SDK & Integration</CardTitle>
              <CardDescription>Quickly integrate {serviceName} with Velicor using these snippets.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="p-4 rounded-xl bg-orange-500/[0.03] border border-orange-500/10 flex gap-3 items-start">
            <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
               <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider">Serverless Warning</p>
               <p className="text-[10px] text-orange-600/80 leading-relaxed">
                 If your service runs on <strong>Vercel</strong> or AWS Lambda, you <strong>must</strong> wait for the logging request to finish (use synchronous requests or await) to prevent Vercel from freezing the process before logs are delivered.
               </p>
            </div>
          </div>

          {snippets.map((snippet) => (
            <div key={snippet.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-muted rounded-md text-muted-foreground">
                    {snippet.icon}
                  </div>
                  <h3 className="font-bold text-sm tracking-tight">{snippet.name}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4 bg-muted/50 border-none opacity-60">
                    {snippet.language}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => copyToClipboard(snippet.code, snippet.id)}
                  className="h-8 gap-2 text-xs font-medium hover:bg-primary/5 hover:text-primary transition-all"
                >
                  {copied === snippet.id ? (
                    <><Check className="w-3.5 h-3.5" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy Snippet</>
                  )}
                </Button>
              </div>
              <div className="relative group">
                <pre className="bg-[#0d1117] text-[#e6edf3] p-5 rounded-xl overflow-x-auto font-mono text-xs leading-relaxed border border-white/5 shadow-inner">
                  <code>{snippet.code}</code>
                </pre>
                <div className="absolute inset-0 rounded-xl ring-1 ring-white/10 pointer-events-none group-hover:ring-primary/20 transition-all" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <Card className="bg-primary/[0.02] border-primary/10 border-dashed">
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-sm font-medium text-primary">Need more help?</p>
          <p className="text-xs text-muted-foreground">Check out our full documentation for advanced batching and structured metadata tips.</p>
        </CardContent>
      </Card>
    </div>
  );
};
