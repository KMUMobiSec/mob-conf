"use client";

import { Minus, Plus } from "lucide-react";
import type * as React from "react";
import { useCallback } from "react";

import { cn } from "@/lib/helpers/utils";

interface NumberInputProps
  extends Omit<React.ComponentProps<"input">, "type" | "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
}

function NumberInput({
  className,
  value,
  onChange,
  min,
  max,
  step = 1,
  disabled,
  ...props
}: NumberInputProps) {
  const numValue = Number.parseInt(value, 10);
  const isAtMin = !Number.isNaN(numValue) && min !== undefined && numValue <= min;
  const isAtMax = !Number.isNaN(numValue) && max !== undefined && numValue >= max;

  const decrement = useCallback(() => {
    const current = Number.isNaN(numValue) ? (min ?? 0) : numValue;
    const next = current - step;
    if (min !== undefined && next < min) return;
    onChange(String(next));
  }, [numValue, min, step, onChange]);

  const increment = useCallback(() => {
    const current = Number.isNaN(numValue) ? (min ?? 0) : numValue;
    const next = current + step;
    if (max !== undefined && next > max) return;
    onChange(String(next));
  }, [numValue, min, max, step, onChange]);

  return (
    <div
      data-slot="number-input"
      className={cn(
        "flex items-center border-input rounded-md border shadow-xs dark:bg-input/30 bg-transparent",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
    >
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || isAtMin}
        onClick={decrement}
        className="flex items-center justify-center size-9 shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Decrease"
      >
        <Minus className="size-3.5" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="h-9 w-full min-w-0 bg-transparent text-center text-base outline-none placeholder:text-muted-foreground md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || isAtMax}
        onClick={increment}
        className="flex items-center justify-center size-9 shrink-0 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Increase"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

export { NumberInput };
