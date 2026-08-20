"use client";

import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Download the year's banquet responses as CSV or a PDF report. Items are plain download links to
 * the export route handler, so the browser handles the file download directly.
 */
export function ExportButton({ year }: { year: number }) {
  const href = (format: "csv" | "pdf") =>
    `/admin/banquet-survey/export?year=${year}&format=${format}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download className="size-4" />
          Export
          <ChevronDown className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={href("csv")} download>
            <FileSpreadsheet className="size-4" />
            CSV (all responses)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={href("pdf")} download>
            <FileText className="size-4" />
            PDF report
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
