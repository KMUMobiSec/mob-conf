"use client";

import { Download, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ValidYear } from "@/constants/config";
import { sendCustomCertificate } from "@/modules/admin/certificates/actions";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CustomCertificateDialog({
  year,
  open,
  onOpenChange,
  onSuccess,
  onError,
}: {
  year: ValidYear;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [isAuthor, setIsAuthor] = useState(false);
  const [paperTitle, setPaperTitle] = useState("");
  const [recognitionTitle, setRecognitionTitle] = useState("");
  const [email, setEmail] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sending, setSending] = useState(false);

  const busy = downloading || sending;
  const baseValid =
    name.trim() !== "" &&
    affiliation.trim() !== "" &&
    (isAuthor ? paperTitle.trim() !== "" : recognitionTitle.trim() !== "");

  function reset() {
    setName("");
    setAffiliation("");
    setIsAuthor(false);
    setPaperTitle("");
    setRecognitionTitle("");
    setEmail("");
  }

  async function handleDownload() {
    if (!baseValid) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        custom: "1",
        name: name.trim(),
        affiliation: affiliation.trim(),
        author: String(isAuthor),
      });
      if (isAuthor) params.set("title", paperTitle.trim());
      else params.set("recognition", recognitionTitle.trim());

      const response = await fetch(`/admin/certificates/download?${params.toString()}`);
      if (!response.ok) throw new Error(await response.text());
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ebision-${year}-certificate-${name.trim().replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to generate certificate.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleSend() {
    if (!baseValid) return;
    if (!EMAIL_RE.test(email.trim())) {
      onError("Enter a valid recipient email.");
      return;
    }
    setSending(true);
    try {
      const result = await sendCustomCertificate({
        year,
        recipientName: name.trim(),
        affiliation: affiliation.trim(),
        isAuthor,
        paperTitle: isAuthor ? paperTitle.trim() : undefined,
        recognitionTitle: isAuthor ? undefined : recognitionTitle.trim(),
        email: email.trim(),
      });
      if (!result.ok) {
        onError(result.error ?? "Failed to send certificate.");
        return;
      }
      onSuccess(`Certificate sent to ${email.trim()}.`);
      reset();
      onOpenChange(false);
    } catch {
      onError("Failed to send certificate.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Custom certificate</DialogTitle>
          <DialogDescription>
            For a recipient not in the registrant list (e.g. keynote speaker, session chair).
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-name">Recipient name</Label>
            <Input
              id="custom-name"
              placeholder="Ada Lovelace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-affiliation">Institution / affiliation</Label>
            <Input
              id="custom-affiliation"
              placeholder="University of London"
              value={affiliation}
              onChange={(e) => setAffiliation(e.target.value)}
              disabled={busy}
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="custom-is-author"
              checked={isAuthor}
              onCheckedChange={(c) => setIsAuthor(c === true)}
              disabled={busy}
            />
            <Label htmlFor="custom-is-author" className="cursor-pointer">
              Author certificate (include paper title)
            </Label>
          </div>
          {isAuthor ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-paper-title">Paper title</Label>
              <Input
                id="custom-paper-title"
                placeholder="Title of the paper"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                disabled={busy}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Label htmlFor="custom-recognition">Recognition title</Label>
              <Input
                id="custom-recognition"
                placeholder="Keynote Speaker, Session Chair, …"
                value={recognitionTitle}
                onChange={(e) => setRecognitionTitle(e.target.value)}
                disabled={busy}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="custom-email">Recipient email (to send)</Label>
            <Input
              id="custom-email"
              type="email"
              placeholder="Required only to send"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleDownload} disabled={busy || !baseValid}>
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download
          </Button>
          <Button onClick={handleSend} disabled={busy || !baseValid || !email.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
