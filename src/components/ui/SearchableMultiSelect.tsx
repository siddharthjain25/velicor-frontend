import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { Badge } from './Badge';

interface Option {
  id: string;
  name: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

export const SearchableMultiSelect: React.FC<SearchableMultiSelectProps> = ({
  options,
  selectedValues,
  onChange,
  placeholder = "Select options..."
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

  const handleToggleOption = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const handleRemoveValue = (e: React.MouseEvent, value: string) => {
    e.stopPropagation();
    onChange(selectedValues.filter(v => v !== value));
  };

  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[38px] w-full flex-wrap items-center justify-between rounded-xl border border-input bg-zinc-950/40 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all focus-within:border-primary cursor-pointer hover:border-border/80 select-none gap-1.5"
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          {selectedValues.length === 0 ? (
            <span className="text-muted-foreground/60">{placeholder}</span>
          ) : (
            selectedValues.map(val => (
              <Badge
                key={val}
                variant="info"
                className="text-[9px] py-0 h-5 px-1.5 gap-1 font-bold uppercase rounded-md flex items-center"
              >
                {val}
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(e, val)}
                  className="rounded-full hover:bg-black/20 p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-zinc-800 bg-[#0d0d0d] shadow-2xl p-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Search Input */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground/50" />
            <input
              type="text"
              className="w-full rounded-lg bg-zinc-950/60 border border-zinc-800/60 py-1.5 pl-8 pr-3 text-xs text-white placeholder-muted-foreground/50 outline-none focus:border-primary transition-all font-mono"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground/50 text-[10px] uppercase font-bold tracking-widest">
                No matches found
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = selectedValues.includes(option.name);
                return (
                  <div
                    key={option.id}
                    onClick={() => handleToggleOption(option.name)}
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
