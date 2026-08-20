import Footer from "@/components/Footer";
import { Navbar } from "@/components/ui/Navbar";
import type { ValidYear } from "@/constants/config";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ year: string }>;
}) {
  const { year } = await params;
  const yearNum = Number(year) as ValidYear;

  return (
    <main className="relative">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 mx-auto max-w-8xl">
        <div className="flex h-full justify-evenly">
          <div className="w-px bg-foreground/10" />
          <div className="w-px bg-foreground/10" />
          <div className="w-px bg-foreground/10" />
        </div>
      </div>

      <div className="relative z-10 max-w-8xl w-full flex flex-col mx-auto">
        <Navbar />
        {children}
      </div>
      <Footer year={yearNum} />
    </main>
  );
}
