import React from 'react';
import { WebhookManager } from '../components/WebhookManager';
import { Bell } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex items-center gap-4 py-2 border-b border-border/40">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">Global Alerting</h1>
          <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Route error metrics and telemetry flags across your entire cluster node inventory</p>
        </div>
      </div>

      <WebhookManager />
      
    </div>
  );
};
