"use client";

/**
 * ProgramNavigationBar Component
 *
 * A reusable, standalone component for switching between conference programs.
 * Designed for easy export and use in other repositories.
 *
 * @example
 * ```tsx
 * <ProgramNavigationBar
 *   conferences={[
 *     { id: 'mobisec', name: 'MobiSec 2026' },
 *     { id: 'ebision', name: 'EBISION 2026' }
 *   ]}
 *   currentConf="mobisec"
 *   onConferenceChange={(confId) => router.push(`/program?conf=${confId}`)}
 * />
 * ```
 */

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface ConferenceOption {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface ProgramNavigationBarProps {
  /**
   * Array of conference options to display
   */
  conferences: ConferenceOption[];
  /**
   * Currently selected conference ID (optional, will read from URL if not provided)
   */
  currentConf?: string;
  /**
   * Callback when conference selection changes
   * If not provided, will use default navigation with ?conf= query parameter
   */
  onConferenceChange?: (confId: string) => void;
  /**
   * Base path for navigation (default: '/program')
   */
  basePath?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

const ProgramNavigationBar: React.FC<ProgramNavigationBarProps> = ({
  conferences,
  currentConf: controlledCurrentConf,
  onConferenceChange,
  basePath = "/program",
  className,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read from URL if not controlled
  const urlConf = searchParams.get("conf");
  const currentConf = controlledCurrentConf ?? urlConf ?? conferences[0]?.id ?? "";

  const handleConferenceChange = (confId: string) => {
    if (onConferenceChange) {
      onConferenceChange(confId);
    } else {
      // Default behavior: update URL query parameter
      const params = new URLSearchParams(searchParams.toString());
      params.set("conf", confId);
      router.push(`${basePath}?${params.toString()}`);
    }
  };

  return (
    <div className={cn("flex w-full border-b border-border bg-background", className)}>
      <div className="sm:mx-0 mx-auto py-4">
        <Tabs value={currentConf} onValueChange={handleConferenceChange}>
          <TabsList className="inline-flex h-auto p-1 bg-muted rounded-lg">
            {conferences.map((conference) => (
              <TabsTrigger
                key={conference.id}
                value={conference.id}
                disabled={conference.disabled}
                className={cn(
                  "px-6 py-2 text-sm font-medium rounded-md transition-all",
                  "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                  "data-[state=inactive]:text-muted-foreground hover:text-foreground",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                {conference.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default ProgramNavigationBar;
