import React, { useRef, useEffect } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
}) => {
  const inputsRef = useRef<HTMLInputElement[]>([]);

  useEffect(() => {
    inputsRef.current = inputsRef.current.slice(0, length);
  }, [length]);

  const getOtpArray = () => {
    const arr = value.split('');
    while (arr.length < length) {
      arr.push('');
    }
    return arr.slice(0, length);
  };

  const otpArray = getOtpArray();

  const handleTextChange = (text: string, index: number) => {
    const cleanText = text.replace(/\D/g, '');
    if (!cleanText) {
      // Clear current digit if backspaced
      const newOtp = [...otpArray];
      newOtp[index] = '';
      onChange(newOtp.join(''));
      return;
    }

    const newOtp = [...otpArray];
    // Take the last character typed
    newOtp[index] = cleanText.substring(cleanText.length - 1);
    const newValue = newOtp.join('');
    onChange(newValue);

    // Auto-focus next input
    if (index < length - 1 && newOtp[index]) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newOtp = [...otpArray];
      
      if (otpArray[index]) {
        // Clear current value
        newOtp[index] = '';
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // Move focus to previous and clear it
        newOtp[index - 1] = '';
        onChange(newOtp.join(''));
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').substring(0, length);
    if (pastedData) {
      onChange(pastedData);
      // Focus the last input filled or next available
      const focusIndex = Math.min(pastedData.length, length - 1);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 md:gap-3">
      {otpArray.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => {
            if (el) inputsRef.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleTextChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          className="w-10 h-10 md:w-11 md:h-11 text-center text-base font-bold font-mono bg-zinc-950/50 border border-border/60 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all outline-none text-white disabled:opacity-50 disabled:cursor-not-allowed select-none"
        />
      ))}
    </div>
  );
};
