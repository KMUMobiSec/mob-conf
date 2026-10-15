import { Loader2 } from "lucide-react";

// Next.js shows this instantly on any navigation into an admin route segment while its server
// data is still loading — giving immediate feedback on switches that take a moment, instead of a
// blank pause that reads as the click not having registered.
export default function AdminLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );
}
