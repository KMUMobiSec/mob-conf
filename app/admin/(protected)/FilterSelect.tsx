"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Radix Select reserves "" for its placeholder state, so an "All"/empty option
// is bridged through this sentinel and mapped back to "" in the URL.
const ALL_VALUE = "__all__";

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  /** Query-string key this select drives. */
  name: string;
  options: FilterOption[];
  /** Shown when the param is absent and no fallback is set (e.g. for "All"). */
  placeholder?: string;
  /** Value to display when the param is absent (e.g. the default year). */
  fallback?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}

/**
 * shadcn Select that applies instantly by writing its value into the URL query
 * (router.replace), resetting the page to 1. No Apply button — changing the
 * select filters immediately, and the value is always read back from the URL.
 */
export function FilterSelect({
  name,
  options,
  placeholder,
  fallback,
  ariaLabel,
  triggerClassName,
}: FilterSelectProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = searchParams.get(name) ?? fallback ?? "";

  function handleChange(next: string) {
    const value = next === ALL_VALUE ? "" : next;
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    params.delete("page");
    const qs = params.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  return (
    <Select value={current === "" ? ALL_VALUE : current} onValueChange={handleChange}>
      <SelectTrigger aria-label={ariaLabel} data-pending={isPending} className={triggerClassName}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value || ALL_VALUE}
            value={option.value === "" ? ALL_VALUE : option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
