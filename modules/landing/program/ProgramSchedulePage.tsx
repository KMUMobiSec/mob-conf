"use client";

import ProgramPage from "@/modules/landing/program/ProgramPage";
import { useYear } from "@/providers/year-provider";

export default function ProgramSchedulePage() {
  const year = useYear();

  return (
    <div className="min-h-screen bg-background max-w-8xl">
      <main>
        <ProgramPage year={year} />
      </main>
    </div>
  );
}
