"use client";

import {
  ArrowRight,
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Search,
  Tag,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useYear } from "@/providers/year-provider";

interface Paper {
  id: string;
  session: string | null;
  sessionTitle: string | null;
  room: string | null;
  chair: string | null;
  articleId: string | null;
  presentationType: string;
  presentationDate: string | null;
  startTime: string | null;
  endTime: string | null;
  paperTitle: string;
  authors: string;
  institutions: string | null;
  keywords: string | null;
  abstractFileUrl: string | null;
  paperFileUrl: string | null;
}

interface ProceedingCard {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
}

interface ProceedingPeriod {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
}

interface Period {
  id: number;
  name: string;
  venue: string | null;
  date: string | null;
}

const ALL = "all";

function splitList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

function formatDayLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

interface SessionGroup {
  key: string;
  title: string;
  room: string | null;
  chair: string | null;
  startTime: string | null;
  endTime: string | null;
  papers: Paper[];
}

interface DayGroup {
  date: string;
  label: string;
  count: number;
  sessions: SessionGroup[];
}

/** Group a flat paper list into day → session, ordered chronologically. */
function groupByDayThenSession(papers: Paper[]): DayGroup[] {
  const dayMap = new Map<string, Paper[]>();
  for (const p of papers) {
    const d = p.presentationDate ?? "";
    if (!dayMap.has(d)) dayMap.set(d, []);
    dayMap.get(d)?.push(p);
  }

  const days: DayGroup[] = [];
  for (const date of [...dayMap.keys()].sort()) {
    const dayPapers = dayMap.get(date) ?? [];
    const sessionMap = new Map<string, Paper[]>();
    for (const p of dayPapers) {
      const key = p.sessionTitle || p.session || "—";
      if (!sessionMap.has(key)) sessionMap.set(key, []);
      sessionMap.get(key)?.push(p);
    }

    const sessions: SessionGroup[] = [...sessionMap.entries()].map(([key, ps]) => {
      const starts = ps
        .map((p) => p.startTime)
        .filter(Boolean)
        .sort() as string[];
      const ends = ps
        .map((p) => p.endTime)
        .filter(Boolean)
        .sort() as string[];
      return {
        key,
        title: key,
        room: ps.find((p) => p.room)?.room ?? null,
        chair: ps.find((p) => p.chair)?.chair ?? null,
        startTime: starts[0] ?? null,
        endTime: ends[ends.length - 1] ?? null,
        papers: ps,
      };
    });

    sessions.sort((a, b) => (a.startTime ?? "99").localeCompare(b.startTime ?? "99"));

    days.push({
      date,
      label: date ? formatDayLabel(date) : "—",
      count: dayPapers.length,
      sessions,
    });
  }
  return days;
}

function ProceedingsPage() {
  const year = useYear();
  const t = useTranslations("ProceedingsPage");

  const [authState, setAuthState] = useState<{ authenticated: boolean; required: boolean } | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  const [cards, setCards] = useState<ProceedingCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [view, setView] = useState<"cards" | "detail">("cards");

  const [proceedingPeriod, setProceedingPeriod] = useState<ProceedingPeriod | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDay, setActiveDay] = useState<string>(ALL);
  const [programFilter, setProgramFilter] = useState<string>(ALL);
  const [authorFilter, setAuthorFilter] = useState<string>(ALL);
  const [keywordFilter, setKeywordFilter] = useState<string>(ALL);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch(`/api/proceedings/auth?year=${year}`);
      const data = await res.json();
      if (data.ok) {
        setAuthState({ authenticated: data.authenticated, required: data.required ?? false });
      }
    } catch {
      setAuthState({ authenticated: false, required: true });
    }
  }, [year]);

  const loadCards = useCallback(async () => {
    try {
      setCardsLoading(true);
      const res = await fetch(`/api/proceedings?year=${year}`);
      const data = await res.json();
      if (data.ok) {
        setCards(data.proceedingPeriods ?? []);
      }
    } catch (error) {
      console.error("Error loading proceedings:", error);
    } finally {
      setCardsLoading(false);
    }
  }, [year]);

  const loadDetail = useCallback(async () => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/user/proceedings?year=${year}`);
      const data = await response.json();

      if (response.status === 401) {
        setAuthState((prev) =>
          prev ? { ...prev, authenticated: false } : { authenticated: false, required: true },
        );
        setPasswordDialogOpen(true);
        return;
      }

      if (data.ok) {
        setProceedingPeriod(data.proceedingPeriod ?? null);
        setPeriod(data.period ?? null);
        setPapers(data.papers ?? []);
        setView("detail");
      }
    } catch (error) {
      console.error("Error loading proceeding:", error);
    } finally {
      setDetailLoading(false);
    }
  }, [year]);

  useEffect(() => {
    checkAuth();
    loadCards();
  }, [checkAuth, loadCards]);

  const days = useMemo(
    () => [...new Set(papers.map((p) => p.presentationDate).filter(Boolean))].sort() as string[],
    [papers],
  );
  const programOptions = useMemo(
    () => [...new Set(papers.map((p) => p.sessionTitle || p.session).filter(Boolean))] as string[],
    [papers],
  );
  const authorOptions = useMemo(
    () =>
      [...new Set(papers.flatMap((p) => splitList(p.authors)))].sort((a, b) => a.localeCompare(b)),
    [papers],
  );
  const keywordOptions = useMemo(
    () =>
      [...new Set(papers.flatMap((p) => splitList(p.keywords)))].sort((a, b) =>
        a.toLowerCase().localeCompare(b.toLowerCase()),
      ),
    [papers],
  );

  const visiblePapers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return papers.filter((p) => {
      if (activeDay !== ALL && p.presentationDate !== activeDay) return false;
      if (programFilter !== ALL && (p.sessionTitle || p.session) !== programFilter) return false;
      if (authorFilter !== ALL && !splitList(p.authors).includes(authorFilter)) return false;
      if (keywordFilter !== ALL && !splitList(p.keywords).includes(keywordFilter)) return false;
      if (q) {
        const haystack = [
          p.paperTitle,
          p.authors,
          p.keywords ?? "",
          p.sessionTitle ?? "",
          p.session ?? "",
          p.articleId ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [papers, activeDay, programFilter, authorFilter, keywordFilter, searchQuery]);

  const dayGroups = useMemo(() => groupByDayThenSession(visiblePapers), [visiblePapers]);

  const filtersActive =
    programFilter !== ALL ||
    authorFilter !== ALL ||
    keywordFilter !== ALL ||
    searchQuery.trim() !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setProgramFilter(ALL);
    setAuthorFilter(ALL);
    setKeywordFilter(ALL);
  };

  const handleCardClick = () => {
    if (authState?.required && !authState?.authenticated) {
      setPasswordDialogOpen(true);
    } else {
      loadDetail();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/proceedings/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, year }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuthState({ authenticated: true, required: true });
        setPasswordDialogOpen(false);
        setPassword("");
        loadDetail();
      } else {
        setPasswordError(data.error ?? t("passwordError"));
      }
    } catch {
      setPasswordError(t("passwordError"));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCardDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  // ---- Cards view ----
  if (view === "cards" && !detailLoading) {
    return (
      <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-12">
        <div className="max-w-8xl mx-auto flex flex-col gap-4 w-full">
          <p className="tag text-primary">{t("label")}</p>
          <h1 className="display text-foreground">{t("title")}</h1>
          <p className="body text-muted-foreground max-w-3xl">{t("subtitle")}</p>
        </div>

        {cardsLoading ? (
          <div className="max-w-8xl mx-auto w-full flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cards.length === 0 ? (
          <Card className="max-w-8xl mx-auto w-full">
            <CardContent className="text-center flex flex-col items-center gap-4 py-12">
              <FileText className="w-16 h-16 text-muted-foreground opacity-50 shrink-0" />
              <p className="body text-muted-foreground">{t("empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-8xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => (
              <Card
                key={card.id}
                className="overflow-hidden cursor-pointer group pt-0"
                onClick={handleCardClick}
              >
                <div className="aspect-210/297 relative overflow-hidden bg-muted">
                  {card.coverImageUrl ? (
                    <Image
                      src={card.coverImageUrl}
                      alt={card.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 400px"
                      quality={90}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-primary/20 to-primary/5">
                      <FileText className="w-20 h-20 text-primary/40" />
                    </div>
                  )}
                </div>
                <CardContent className="flex flex-col gap-3">
                  <h2 className="subheading line-clamp-2 group-hover:text-primary transition-colors text-foreground">
                    {card.title}
                  </h2>
                  {card.description && (
                    <p className="body text-muted-foreground line-clamp-2">{card.description}</p>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{formatCardDate(card.createdAt)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    {t("viewProgramBook")}
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
          <DialogContent showCloseButton>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                {t("passwordPrompt")}
              </DialogTitle>
              <DialogDescription>{t("passwordDialogDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3 px-6 pb-6">
              <Input
                type="password"
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                disabled={submitting}
                autoFocus
              />
              {passwordError && <p className="caption text-destructive">{passwordError}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : t("passwordSubmit")}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </section>
    );
  }

  // ---- Detail view ----
  return (
    <section className="px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-24 flex flex-col gap-8 sm:gap-12">
      <div className="max-w-8xl mx-auto flex flex-col gap-4 w-full">
        <p className="tag text-primary">{t("label")}</p>
        <h1 className="display text-foreground">{proceedingPeriod?.title ?? ""}</h1>
        {proceedingPeriod?.description && (
          <p className="body text-muted-foreground max-w-3xl">{proceedingPeriod.description}</p>
        )}
      </div>

      {detailLoading ? (
        <div className="max-w-8xl mx-auto w-full flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="max-w-8xl mx-auto w-full flex flex-col gap-8">
          {/* Overview */}
          <div className="bg-muted rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-3">
                {proceedingPeriod?.coverImageUrl ? (
                  <div className="relative aspect-210/297 w-full rounded-lg shadow-lg overflow-hidden">
                    <Image
                      src={proceedingPeriod.coverImageUrl}
                      alt={proceedingPeriod.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                      quality={95}
                      priority
                    />
                  </div>
                ) : (
                  <div className="aspect-210/297 w-full bg-linear-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border">
                    <FileText className="w-20 h-20 text-primary/40" />
                  </div>
                )}
              </div>
              <div className="md:col-span-9 flex flex-col gap-4">
                {period && (
                  <div className="flex flex-col gap-2">
                    {period.date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 shrink-0" />
                        <p className="body">{period.date}</p>
                      </div>
                    )}
                    {period.venue && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <p className="body">{period.venue}</p>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {papers.length} {t("papers")}
                  </Badge>
                  <Badge variant="outline">
                    {programOptions.length} {t("filterProgram")}
                  </Badge>
                  <Badge variant="outline">
                    {days.length} {t("allDays")}
                  </Badge>
                </div>
                <div>
                  <Button asChild size="lg" className="gap-2">
                    <a href={`/data/${year}/ebision-${year}-program-book.pdf`} download>
                      <Download className="w-4 h-4 shrink-0" />
                      {t("downloadProgramBook")}
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: search + filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:w-auto">
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="w-full lg:w-52">
                    <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t("filterProgram")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("allPrograms")}</SelectItem>
                    {programOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={authorFilter} onValueChange={setAuthorFilter}>
                  <SelectTrigger className="w-full lg:w-52">
                    <UserRound className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t("filterAuthor")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("allAuthors")}</SelectItem>
                    {authorOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={keywordFilter} onValueChange={setKeywordFilter}>
                  <SelectTrigger className="w-full lg:w-52">
                    <Tag className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t("filterKeyword")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("allKeywords")}</SelectItem>
                    {keywordOptions.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Day tabs */}
              <Tabs value={activeDay} onValueChange={setActiveDay}>
                <TabsList className="flex-wrap h-auto">
                  <TabsTrigger value={ALL}>{t("allDays")}</TabsTrigger>
                  {days.map((d) => (
                    <TabsTrigger key={d} value={d}>
                      {formatDayLabel(d)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <span className="caption text-muted-foreground">
                  {visiblePapers.length} {t("results")}
                </span>
                {filtersActive && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 shrink-0" />
                    {t("clearFilters")}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Grouped content */}
          {visiblePapers.length === 0 ? (
            <Card>
              <CardContent className="text-center text-muted-foreground py-8">
                {t("noSearchResults")}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-10">
              {dayGroups.map((day) => (
                <div key={day.date} className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 shrink-0 text-primary" />
                    <h2 className="heading text-foreground">{day.label}</h2>
                    <Badge variant="secondary">{day.count}</Badge>
                  </div>

                  <div className="flex flex-col gap-6">
                    {day.sessions.map((s) => (
                      <Card key={`${day.date}-${s.key}`} className="overflow-hidden py-0">
                        <div className="bg-primary text-white p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          {(s.startTime || s.endTime) && (
                            <div className="flex items-center gap-2 rounded-md bg-white/15 px-3 py-1.5 shrink-0 w-fit">
                              <Clock className="w-4 h-4 shrink-0" />
                              <span className="text-base font-semibold tabular-nums whitespace-nowrap">
                                {s.startTime}
                                {s.endTime ? ` – ${s.endTime}` : ""}
                              </span>
                            </div>
                          )}
                          <div className="flex flex-col gap-1 flex-1 min-w-0">
                            <h3 className="subheading">{s.title}</h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-white/90">
                              {s.room && (
                                <span className="caption flex items-center gap-1">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  {s.room}
                                </span>
                              )}
                              {s.chair && (
                                <span className="caption flex items-center gap-1">
                                  <Users className="w-3 h-3 shrink-0" />
                                  {t("chairLabel")}: {s.chair}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="secondary" className="shrink-0 w-fit">
                            {s.papers.length}
                          </Badge>
                        </div>

                        <CardContent className="p-0">
                          {s.papers.map((paper, index) => (
                            <div key={paper.id}>
                              {index > 0 && <Separator />}
                              <div className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                {(paper.startTime || paper.endTime) && (
                                  <div className="sm:w-36 shrink-0">
                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-primary w-fit">
                                      <Clock className="w-4 h-4 shrink-0" />
                                      <span className="text-sm font-semibold tabular-nums whitespace-nowrap">
                                        {paper.startTime}
                                        {paper.endTime ? `–${paper.endTime}` : ""}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0 flex flex-col gap-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {paper.articleId && (
                                      <Badge variant="secondary">#{paper.articleId}</Badge>
                                    )}
                                    {paper.presentationType === "poster" && (
                                      <Badge variant="outline">{t("posterLabel")}</Badge>
                                    )}
                                  </div>
                                  <h4 className="subheading text-foreground">
                                    {paper.paperFileUrl ? (
                                      <Link
                                        href={paper.paperFileUrl}
                                        target="_blank"
                                        className="text-primary hover:underline"
                                      >
                                        {paper.paperTitle}
                                      </Link>
                                    ) : (
                                      paper.paperTitle
                                    )}
                                  </h4>
                                  <p className="body text-muted-foreground">{paper.authors}</p>
                                  {paper.keywords && (
                                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                      {splitList(paper.keywords).map((kw) => (
                                        <button
                                          key={kw}
                                          type="button"
                                          onClick={() => setKeywordFilter(kw)}
                                          title={t("filterKeyword")}
                                        >
                                          <Badge
                                            variant="outline"
                                            className="cursor-pointer hover:bg-accent"
                                          >
                                            {kw}
                                          </Badge>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {paper.paperFileUrl && (
                                  <div className="shrink-0 sm:ml-4">
                                    <Button
                                      variant="default"
                                      size="sm"
                                      onClick={() => {
                                        const url = paper.paperFileUrl;
                                        if (url) window.open(url, "_blank");
                                      }}
                                      title={t("downloadFullPaper")}
                                    >
                                      <Download className="w-4 h-4 shrink-0" />
                                      <span className="hidden sm:inline">{t("paperLabel")}</span>
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default ProceedingsPage;
