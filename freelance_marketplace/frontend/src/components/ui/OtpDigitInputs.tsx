import React, { useRef, useEffect } from "react";

export interface OtpDigitInputsProps {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

function slotsFromValue(value: string): string[] {
  return [0, 1, 2, 3].map((i) => value[i] ?? "");
}

/**
 * Четыре отдельных поля под цифры кода (как в Steam / 2FA).
 */
export function OtpDigitInputs({
  value,
  onChange,
  disabled = false,
  autoFocus = false,
}: OtpDigitInputsProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const digits = slotsFromValue(value);

  useEffect(() => {
    if (autoFocus && !disabled) {
      refs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  const focusAt = (i: number) => {
    refs.current[Math.max(0, Math.min(3, i))]?.focus();
  };

  const commitSlots = (slots: string[]) => {
    onChange(slots.join(""));
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const slots = slotsFromValue(value);
    slots[index] = char;
    commitSlots(slots);
    if (char && index < 3) {
      focusAt(index + 1);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      const slots = slotsFromValue(value);
      if (digits[index]) {
        slots[index] = "";
        commitSlots(slots);
      } else if (index > 0) {
        slots[index - 1] = "";
        commitSlots(slots);
        focusAt(index - 1);
      }
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      focusAt(index - 1);
    }
    if (e.key === "ArrowRight" && index < 3) {
      e.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    onChange(pasted);
    focusAt(Math.min(Math.max(0, pasted.length - 1), 3));
  };

  return (
    <div
      className="flex w-full max-w-[280px] justify-center gap-2 sm:max-w-none sm:gap-3"
      onPaste={handlePaste}
      role="group"
      aria-label="Код из четырёх цифр"
    >
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digits[i]}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onFocus={(e) => e.target.select()}
          className="h-12 w-11 shrink-0 rounded-xl border border-white/15 bg-white/5 text-center text-xl font-semibold tabular-nums text-white outline-none backdrop-blur-md transition-all duration-200 placeholder:text-white/25 focus:border-primary/50 focus:ring-1 focus:ring-primary/35 disabled:cursor-not-allowed disabled:opacity-45 sm:h-14 sm:w-12 sm:text-2xl"
          placeholder="·"
          aria-label={`Цифра ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function formatResendCooldown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
