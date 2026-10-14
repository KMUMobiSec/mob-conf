import type { ValidYear } from "@/constants/config";
import { PresentationForm } from "./PresentationForm";

const PresentationFormPage = ({ year }: { year: ValidYear }) => {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <p className="tag text-primary">Presentations</p>
          <h1 className="display text-foreground">Presentation Upload</h1>
          <p className="body text-muted-foreground">
            Submit your presentation for MOBISEC {year}. Provide your paper details and upload your
            presentation file — it is stored securely and shared only with the organizing committee.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <PresentationForm year={year} />
        </div>
      </section>
    </div>
  );
};

export default PresentationFormPage;
