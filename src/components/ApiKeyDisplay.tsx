import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Shield, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';

interface ApiKeyDisplayProps {
  apiKey: string;
  label?: string;
  variant?: 'compact' | 'full';
  onReset?: () => void;
}

export const ApiKeyDisplay: React.FC<ApiKeyDisplayProps> = ({ apiKey, label, variant = 'full', onReset }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(apiKey);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(!isVisible);
  };

  const maskedKey = '•'.repeat(24);

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 bg-primary/5 hover:bg-primary/10 transition-all rounded-full p-1 px-3 border border-primary/20 group h-10 min-w-[200px]">
        <Shield className="w-3.5 h-3.5 text-primary shrink-0 opacity-60" />
        <code className="text-[11px] font-mono text-primary/80 font-bold flex-grow truncate">
          {isVisible ? apiKey : maskedKey}
        </code>
        <div className="flex items-center gap-1 border-l border-primary/20 pl-2">
          {onReset && (
            <button 
              onClick={(e) => { e.stopPropagation(); onReset(); }}
              className="p-1 hover:text-primary transition-colors text-muted-foreground"
              title="Reset Key"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={toggleVisibility} 
            className="p-1 hover:text-primary transition-colors text-muted-foreground"
            title={isVisible ? "Hide Key" : "Show Key"}
          >
            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button 
            onClick={handleCopy} 
            className="p-1 hover:text-primary transition-colors text-muted-foreground"
            title="Copy Key"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between px-1">
        {label && <label className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] opacity-70">{label}</label>}
        {isVisible && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Sensitive Data Exposed</span>}
      </div>
      
      <div className="relative group overflow-hidden bg-[#050505] rounded-2xl border-2 border-primary/10 hover:border-primary/40 transition-all shadow-2xl">
        <div className="flex items-center px-6 h-16">
          <div className="flex-grow overflow-hidden mr-4">
            <code className={`font-mono text-lg font-black transition-all duration-300 tracking-wider ${isVisible ? 'text-primary' : 'text-primary/30'}`}>
              {isVisible ? apiKey : maskedKey}
            </code>
          </div>
          
          <div className="flex items-center gap-2">
            {onReset && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" 
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                title="Reset API Key"
              >
                <RefreshCw className="w-5 h-5" />
              </Button>
            )}
            <Button 
              variant="secondary" 
              size="icon" 
              className="h-10 w-10 rounded-full hover:scale-105 active:scale-95 transition-all" 
              onClick={toggleVisibility}
            >
              {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className={`h-10 w-10 rounded-full hover:scale-105 active:scale-95 transition-all ${isCopied ? 'bg-green-500 border-green-500' : ''}`} 
              onClick={handleCopy}
            >
              {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Visual feedback for copying */}
        <div className={`absolute inset-0 bg-green-500 flex items-center justify-center transition-all duration-500 ease-out pointer-events-none ${isCopied ? 'translate-y-0' : 'translate-y-full'}`}>
          <span className="text-white text-sm font-black uppercase tracking-[0.2em] flex items-center gap-3">
            <Check className="w-6 h-6 stroke-[3px]" /> Key Secured to Clipboard
          </span>
        </div>
      </div>
    </div>
  );
};
