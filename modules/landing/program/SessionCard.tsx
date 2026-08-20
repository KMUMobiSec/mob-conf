"use client";

import { MapPin, User, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Session, Speaker } from "@/types/conference-schedule";

interface SessionCardProps {
  session: Session;
  roomName?: string;
  onSpeakerClick?: (speaker: Speaker) => void;
  className?: string;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  roomName,
  onSpeakerClick,
  className,
}) => {
  const t = useTranslations("ProgramPage");
  const _getTypeColor = (type: Session["type"]) => {
    const colors: Record<string, string> = {
      keynote: "bg-primary/10 text-primary border border-primary/30",
      workshop: "bg-primary/10 text-primary border border-primary/30",
      panel: "bg-primary/10 text-primary border border-primary/30",
      session: "bg-primary/10 text-primary border border-primary/30",
      break: "bg-muted text-muted-foreground border border-border",
      lunch: "bg-muted text-muted-foreground border border-border",
      banquet: "bg-primary/10 text-primary border border-primary/30",
      ceremony: "bg-primary/10 text-primary border border-primary/30",
      poster: "bg-primary/10 text-primary border border-primary/30",
      forum: "bg-primary/10 text-primary border border-primary/30",
      roundtable: "bg-primary/10 text-primary border border-primary/30",
      special: "bg-primary/10 text-primary border border-primary/30",
    };
    return colors[type] || "bg-muted text-muted-foreground border border-border";
  };

  const getCardBorderColor = (type: Session["type"]) => {
    const colors: Record<string, string> = {
      keynote: "border-l-primary",
      workshop: "border-l-primary/80",
      panel: "border-l-primary/80",
      session: "border-l-primary",
      break: "border-l-border",
      lunch: "border-l-border",
      banquet: "border-l-primary/60",
      ceremony: "border-l-primary/60",
      poster: "border-l-primary/80",
      forum: "border-l-primary/80",
      roundtable: "border-l-primary/80",
      special: "border-l-primary/60",
    };
    return colors[type] || "border-l-border";
  };

  const getCardBackground = (type: Session["type"]) => {
    const backgrounds: Record<string, string> = {
      break: "bg-muted",
      lunch: "bg-muted",
      banquet: "bg-muted",
    };
    return backgrounds[type] || "bg-background";
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md border-l-4 p-0",
        getCardBorderColor(session.type),
        getCardBackground(session.type),
        className,
      )}
    >
      <CardContent className="p-2 space-y-2">
        {/* Header Row: Title and Badge */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="subheading text-foreground">{session.title}</h4>
            {/* {session.sessionId && <small className='text-muted-foreground'>{session.sessionId}</small>} */}
          </div>
          {/* <Badge className={cn('shrink-0', getTypeColor(session.type))}>{session.type}</Badge> */}
          {/* Room */}
          {roomName && session.room !== "common" && (
            <Badge variant="outline" className="flex items-center gap-1.5 w-fit">
              <MapPin className="h-3 w-3 shrink-0 text-primary" />
              <span className="text-foreground">{roomName}</span>
            </Badge>
          )}
        </div>

        {/* Topic */}
        {session.topic && (
          <h5 className="small-heading text-muted-foreground wrap-break-words">{session.topic}</h5>
        )}

        {/* Chair */}
        {session.chair && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <User className="h-3 w-3 shrink-0" />
            <small className="caption">
              Chair: <span className="text-foreground">{session.chair}</span>
            </small>
          </div>
        )}

        {/* Papers */}
        {session.papers && session.papers.length > 0 && (
          <div className="pt-1.5 border-t border-border space-y-2">
            <div className="space-y-2">
              {session.papers.map((paper, idx) => (
                <div key={idx} className="p-2 rounded bg-muted/30 border border-border/50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h6 className="small-heading text-foreground flex-1">{paper.title}</h6>
                    {(paper.startTime || paper.endTime) && (
                      <Badge variant="secondary" className="shrink-0 text-xs px-1.5 py-0.5 h-auto">
                        {paper.startTime}
                        {paper.endTime && ` - ${paper.endTime}`}
                      </Badge>
                    )}
                  </div>
                  <small className="caption text-muted-foreground block mb-1">
                    {paper.authors.join(", ")}
                  </small>
                  {paper.presenter && (
                    <small className="caption text-primary block">
                      <span className="font-medium">Presenter: </span>
                      <Badge variant="outline" className="text-primary">
                        {paper.presenter}
                      </Badge>
                    </small>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Speakers */}
        {session.speakers && session.speakers.length > 0 && (
          <div className="border-t border-border space-y-1">
            <div className="flex items-center gap-1.5 text-foreground">
              <Users className="h-3 w-3 shrink-0" />
              <span>{session.speakers.length === 1 ? t("speaker") : t("speakers")}</span>
            </div>
            <div className="space-y-1">
              {session.speakers.map((speaker, idx) =>
                onSpeakerClick ? (
                  <button
                    type="button"
                    key={idx}
                    className={cn(
                      "p-1.5 rounded bg-muted/40 w-full text-left cursor-pointer hover:bg-primary/10 transition-colors",
                    )}
                    onClick={() => onSpeakerClick(speaker)}
                  >
                    <div className="wrap-break-words">{speaker.name}</div>
                    <div className="text-muted-foreground wrap-break-words">
                      {speaker.affiliation}
                    </div>
                  </button>
                ) : (
                  <div key={idx} className="p-1.5 rounded bg-muted/40">
                    <div className="wrap-break-words">{speaker.name}</div>
                    <div className="text-muted-foreground wrap-break-words">
                      {speaker.affiliation}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {session.description && (
          <p className="body text-muted-foreground pt-1.5 border-t border-border wrap-break-words">
            {session.description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default SessionCard;
