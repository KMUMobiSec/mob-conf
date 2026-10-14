import type { ValidYear } from "@/constants/config";
import { NominationForm } from "./NominationForm";

const NominationFormPage = ({ year }: { year: ValidYear }) => {
  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <p className="tag text-primary">Awards Committee</p>
          <h1 className="display text-foreground">Award Nomination Form</h1>
          <p className="body text-muted-foreground">
            Nominate an outstanding individual for recognition at MOBISEC {year}. Select an award
            below — the form will adapt to show the fields and documents required for that specific
            award.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="px-4 sm:px-8 lg:px-12 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl">
          <NominationForm year={year} />
        </div>
      </section>
    </div>
  );
};

export default NominationFormPage;
