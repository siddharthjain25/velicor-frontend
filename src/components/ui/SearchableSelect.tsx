import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  secret_key?: string;
}

interface SearchableSelectProps {
  options: Option[];
  selectedValue: string;
  onChange: (option: Option) => void;
  placeholder?: string;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  selectedValue,
  onChange,
  placeholder = "Select option...",
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOption = (option: Option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-9 md:h-10 items-center justify-between rounded-xl border border-border bg-[#0d1117]/30 hover:bg-[#0d1117]/60 px-4 py-2 text-xs md:text-sm font-bold text-white shadow-sm transition-all focus-within:border-primary cursor-pointer hover:border-border/80 select-none gap-2 min-w-[150px] md:min-w-[180px]"
      >
        <span className="truncate">{selectedValue || placeholder}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 z-50 mt-1.5 min-w-[200px] w-full rounded-xl border border-zinc-800 bg-[#0d0d0d] shadow-2xl p-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground/50" />
            <input
              type="text"
              className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800/60 py-1.5 pl-8 pr-3 text-xs text-white placeholder-muted-foreground/50 outline-none focus:border-primary transition-all font-mono"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">
                No matches
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValue === option.name;
                return (
                  <div
                    key={option.id}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-secondary text-secondary-foreground font-bold' 
                        : 'text-muted-foreground hover:bg-zinc-800/80 hover:text-white'
                    }`}
                  >
                    <span>{option.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-secondary-foreground shrink-0" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
