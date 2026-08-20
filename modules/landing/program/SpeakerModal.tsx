"use client";

import { Building2, User } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Speaker } from "@/types/conference-schedule";

interface SpeakerModalProps {
  speaker: Speaker | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SpeakerModal: React.FC<SpeakerModalProps> = ({ speaker, open, onOpenChange }) => {
  const t = useTranslations("ProgramPage");
  if (!speaker) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {speaker.photo ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden shrink-0">
                <Image src={speaker.photo} alt={speaker.name} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-12 w-12 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="mb-2">{speaker.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                {speaker.affiliation}
              </DialogDescription>
              {speaker.role && (
                <div className="mt-2">
                  <span className="inline-block px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                    {speaker.role}
                  </span>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>
        {speaker.bio && (
          <div className="mt-4 pt-4 border-t border-border">
            <h4 className="subheading mb-2">{t("biography")}</h4>
            <p className="body text-muted-foreground">{speaker.bio}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpeakerModal;
