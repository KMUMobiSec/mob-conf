"use client";

import { Calendar } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyScheduleProps {
  conferenceName: string;
}

const EmptySchedule: React.FC<EmptyScheduleProps> = ({ conferenceName }) => {
  const t = useTranslations("ProgramPage");
  return (
    <div className="flex items-center justify-center min-h-[400px] py-12">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="subheading mb-2 text-foreground">{t("scheduleComingSoon")}</h3>
          <p className="body text-muted-foreground">
            {t("scheduleComingSoonDescription", { conferenceName })}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmptySchedule;
