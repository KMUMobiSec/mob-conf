"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/helpers/utils";

interface SearchInputProps {
  /** Query-string key to drive (defaults to "q"). */
  paramName?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Class for the wrapper (control width lives here). */
  className?: string;
  debounceMs?: number;
}

/**
 * Search-as-you-type bound to a URL query param. Typing is debounced and pushed
 * to the URL with router.replace (no Apply button, no Enter needed); a pending
 * spinner shows while the filtered results load. The page is reset to 1 on every
 * change. The input syncs back from the URL when it changes externally (e.g. a
 * "Clear filters" action) — but never while focused, so typing is never clobbered.
 */
export function SearchInput({
  paramName = "q",
  placeholder = "Search…",
  ariaLabel = "Search",
  className,
  debounceMs = 300,
}: SearchInputProps) {
  const t = useTranslations("Admin.searchInput");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;

  const [value, setValue] = useState(searchParams.get(paramName) ?? "");

  // Reflect external URL changes (e.g. Clear) — but not while the user is typing.
  useEffect(() => {
    if (document.activeElement === inputRef.current) return;
    setValue(searchParams.get(paramName) ?? "");
  }, [searchParams, paramName]);

  // Debounce pushing the typed value into the URL.
  useEffect(() => {
    if (value === (searchParamsRef.current.get(paramName) ?? "")) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (value) params.set(paramName, value);
      else params.delete(paramName);
      params.delete("page");
      const qs = params.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, debounceMs);
    return () => clearTimeout(timeout);
  }, [value, paramName, pathname, router, debounceMs]);

  return (
    <div className={cn("relative", className)}>
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isPending ? <Spinner className="size-4" /> : <SearchIcon className="size-4" />}
      </span>
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="px-8 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            setValue("");
            inputRef.current?.focus();
          }}
          aria-label={t("clear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}
