"use client";

import { useMemo, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/helpers/utils";
import { formatIdNumber } from "@/modules/admin/qr-check-ins/lib/format";

export interface RecipientEntry {
  id: string;
  idNumber: number | null;
  name: string;
  email: string | null;
}

function matches(entry: RecipientEntry, query: string): boolean {
  if (!query) return true;
  const haystack = [
    entry.name,
    entry.email ?? "",
    entry.idNumber != null ? formatIdNumber(entry.idNumber) : "",
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function RecipientPicker({
  recipients,
  selected,
  onChange,
}: {
  recipients: RecipientEntry[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(
    () => recipients.filter((entry) => matches(entry, query)),
    [recipients, query],
  );
  const emailable = filtered.filter((entry) => entry.email);
  const allSelected = emailable.length > 0 && emailable.every((entry) => selected.has(entry.id));
  const someSelected = emailable.some((entry) => selected.has(entry.id)) && !allSelected;
  const emailableTotal = recipients.filter((entry) => entry.email).length;

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(id);
    else next.delete(id);
    onChange(next);
  }

  function toggleAll(checked: boolean) {
    const next = new Set(selected);
    for (const entry of emailable) {
      if (checked) next.add(entry.id);
      else next.delete(entry.id);
    }
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, email, or ID…"
        aria-label="Search recipients"
      />

      <div className="flex items-center justify-between px-1 text-sm">
        <label htmlFor="select-all-recipients" className="flex items-center gap-2">
          <Checkbox
            id="select-all-recipients"
            checked={someSelected ? "indeterminate" : allSelected}
            onCheckedChange={(checked) => toggleAll(checked === true)}
            aria-label="Select all recipients with an email"
            disabled={emailable.length === 0}
          />
          <span className="text-muted-foreground">Select all with email</span>
        </label>
        <span className="text-muted-foreground">
          {selected.size} selected · {emailableTotal} emailable
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto rounded-md border border-border">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No recipients match.</p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((entry) => {
              const hasEmail = Boolean(entry.email);
              return (
                <li key={entry.id}>
                  <label
                    htmlFor={`recipient-${entry.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2",
                      hasEmail
                        ? "cursor-pointer hover:bg-muted/50"
                        : "cursor-not-allowed opacity-60",
                    )}
                  >
                    <Checkbox
                      id={`recipient-${entry.id}`}
                      checked={selected.has(entry.id)}
                      onCheckedChange={(checked) => toggleOne(entry.id, checked === true)}
                      disabled={!hasEmail}
                      aria-label={`Select ${entry.name}`}
                    />
                    {entry.idNumber != null ? (
                      <span className="w-9 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                        {formatIdNumber(entry.idNumber)}
                      </span>
                    ) : (
                      <span className="w-9 shrink-0" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {entry.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {entry.email ?? "No email on file"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
