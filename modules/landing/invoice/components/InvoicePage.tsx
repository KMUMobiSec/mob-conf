"use client";

import { Building2, CheckCircle2, Download } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ValidYear } from "@/constants/config";
import { BANK_TRANSFER_DETAILS } from "../lib/bank-details";

declare global {
  interface Window {
    paypal?: {
      Buttons: (options: Record<string, unknown>) => { render: (selector: string) => void };
    };
  }
}

const SCRIPT_ID = "paypal-sdk-script";

export interface InvoiceOrderView {
  invoiceToken: string;
  firstName: string;
  lastName: string;
  email: string;
  affiliation: string;
  country: string;
  categoryName: string;
  total: string;
  status: "unpaid" | "paid";
  billingOrganization: string | null;
  billingAddress: string | null;
  billingCity: string | null;
  billingCountry: string | null;
}

export interface InvoicePageLabels {
  titleInvoice: string;
  titleReceipt: string;
  paidBadge: string;
  unpaidBadge: string;
  billTo: string;
  category: string;
  total: string;
  payWithPaypal: string;
  paypalError: string;
  bankTransfer: string;
  bankTransferNote: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
  swiftCode: string;
  bankAddress: string;
  city: string;
  zipCode: string;
  downloadPdf: string;
}

const InvoicePage = ({
  year,
  order,
  clientId,
  supportEmail,
  labels,
}: {
  year: ValidYear;
  order: InvoiceOrderView;
  clientId: string;
  supportEmail: string;
  labels: InvoicePageLabels;
}) => {
  const [status, setStatus] = useState(order.status);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  const isPaid = status === "paid";
  const reference = `MOBISEC${year}-${order.invoiceToken.slice(0, 5).toUpperCase()}`;

  useEffect(() => {
    if (isPaid || !clientId || renderedRef.current) return;

    function render() {
      if (!window.paypal || !containerRef.current || renderedRef.current) return;
      renderedRef.current = true;
      window.paypal
        .Buttons({
          createOrder: async () => {
            const res = await fetch("/api/registration/payment/create-order", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ invoiceToken: order.invoiceToken }),
            });
            const data = await res.json();
            if (!res.ok || !data.id) throw new Error(data.error ?? "Could not create order.");
            return data.id;
          },
          onApprove: async (data: { orderID: string }) => {
            const res = await fetch("/api/registration/payment/capture", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ orderID: data.orderID, invoiceToken: order.invoiceToken }),
            });
            const result = await res.json();
            if (res.ok && result.status === "COMPLETED") {
              setStatus("paid");
            } else {
              setPaypalError(labels.paypalError);
            }
          },
          onError: () => setPaypalError(labels.paypalError),
        })
        .render("#paypal-button-container");
    }

    if (window.paypal) {
      render();
      return;
    }
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons`;
    script.async = true;
    script.onload = render;
    document.head.appendChild(script);
  }, [clientId, isPaid, labels.paypalError, order.invoiceToken]);

  return (
    <div className="flex flex-col px-4 sm:px-8 lg:px-12 py-16 sm:py-24">
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        <Card className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="title text-foreground">
              {isPaid ? labels.titleReceipt : labels.titleInvoice}
            </h1>
            {isPaid ? (
              <Badge>
                <CheckCircle2 className="size-3" />
                {labels.paidBadge}
              </Badge>
            ) : (
              <Badge variant="secondary">{labels.unpaidBadge}</Badge>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-border pt-4">
            <p className="caption text-muted-foreground">{labels.billTo}</p>
            <p className="body text-foreground">
              {order.firstName} {order.lastName}
            </p>
            <p className="caption text-muted-foreground">{order.affiliation}</p>
            <p className="caption text-muted-foreground">{order.email}</p>
            {order.billingOrganization && (
              <p className="caption text-muted-foreground">{order.billingOrganization}</p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="body text-muted-foreground">{labels.category}</span>
            <span className="body text-foreground">{order.categoryName}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="body font-medium text-foreground">{labels.total}</span>
            <span className="heading text-foreground tabular-nums">USD {order.total}</span>
          </div>

          <Button asChild variant="outline" className="w-fit">
            <a href={`/api/registration/invoice/${order.invoiceToken}/download`} download>
              <Download className="h-4 w-4" />
              {labels.downloadPdf}
            </a>
          </Button>
        </Card>

        {!isPaid && (
          <Card className="p-6 sm:p-8 flex flex-col gap-4">
            <h2 className="small-heading text-foreground">{labels.payWithPaypal}</h2>
            <div ref={containerRef} id="paypal-button-container" />
            {paypalError && <p className="caption text-destructive">{paypalError}</p>}
          </Card>
        )}

        {!isPaid && (
          <Card className="p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="small-heading text-foreground">{labels.bankTransfer}</h2>
            </div>
            <p className="caption text-muted-foreground">
              {labels.bankTransferNote
                .replace("{reference}", reference)
                .replace("{email}", supportEmail)}
            </p>
            <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
              <span className="font-medium text-foreground">{labels.bankName}</span>
              <span className="text-muted-foreground">{BANK_TRANSFER_DETAILS.bankName}</span>
              <span className="font-medium text-foreground">{labels.accountHolder}</span>
              <span className="text-muted-foreground">{BANK_TRANSFER_DETAILS.accountHolder}</span>
              <span className="font-medium text-foreground">{labels.accountNumber}</span>
              <span className="font-mono text-muted-foreground">
                {BANK_TRANSFER_DETAILS.accountNumber}
              </span>
              <span className="font-medium text-foreground">{labels.swiftCode}</span>
              <span className="font-mono text-muted-foreground">
                {BANK_TRANSFER_DETAILS.swiftCode}
              </span>
              <span className="font-medium text-foreground">{labels.bankAddress}</span>
              <span className="text-muted-foreground">{BANK_TRANSFER_DETAILS.bankAddress}</span>
              <span className="font-medium text-foreground">{labels.city}</span>
              <span className="text-muted-foreground">{BANK_TRANSFER_DETAILS.city}</span>
              <span className="font-medium text-foreground">{labels.zipCode}</span>
              <span className="text-muted-foreground">{BANK_TRANSFER_DETAILS.zipCode}</span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InvoicePage;
