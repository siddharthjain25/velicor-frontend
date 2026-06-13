import React, { createContext, useContext, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { AlertCircle, HelpCircle } from 'lucide-react';

interface DialogOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isAlert?: boolean;
}

interface DialogContextType {
  confirm: (options: DialogOptions) => Promise<boolean>;
  alert: (options: DialogOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions>({ title: '', description: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = (opts: DialogOptions): Promise<boolean> => {
    setOptions({ ...opts, isAlert: false });
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = resolve;
    });
  };

  const alert = (opts: DialogOptions): Promise<void> => {
    setOptions({ ...opts, isAlert: true });
    setIsOpen(true);
    return new Promise((resolve) => {
      resolveRef.current = () => resolve();
    });
  };

  const handleClose = (value: boolean) => {
    setIsOpen(false);
    if (resolveRef.current) {
      resolveRef.current(value);
      resolveRef.current = null;
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(false); }}>
        <DialogContent className="sm:max-w-md bg-[#0d1117] border border-border/60 text-white rounded-2xl p-6 shadow-2xl" showCloseButton={false}>
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2.5">
              {options.isAlert ? (
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              ) : (
                <HelpCircle className="w-5 h-5 text-primary flex-shrink-0" />
              )}
              <DialogTitle className="text-sm font-bold text-white tracking-wide">
                {options.title}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1 whitespace-pre-wrap">
              {options.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex flex-row justify-end gap-2 border-t-0 pt-0 bg-transparent -mx-0 -mb-0">
            {!options.isAlert && (
              <Button
                variant="outline"
                onClick={() => handleClose(false)}
                className="rounded-full h-9 px-4 font-bold text-xs bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                {options.cancelLabel || 'Cancel'}
              </Button>
            )}
            <Button
              onClick={() => handleClose(true)}
              className="rounded-full h-9 px-4 font-bold text-xs cursor-pointer shadow-md"
            >
              {options.confirmLabel || 'OK'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContext.Provider>
  );
};

export const useCustomDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useCustomDialog must be used within a DialogProvider');
  }
  return context;
};
