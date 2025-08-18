"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

type EmailStatus = {
  connected: boolean;
  email?: string | null;
  termsAcceptedAt?: string | null;
};

export function EmailSendingConsent() {
  const { toast } = useToast();
  const [status, setStatus] = React.useState<EmailStatus>({ connected: false });
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [agreeChecked, setAgreeChecked] = React.useState(false);
  const [savingAgree, setSavingAgree] = React.useState(false);
  const [connecting, setConnecting] = React.useState(false);

  // add near top (below other state):
  const refreshStatus = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${baseURL}/api/integrations/gmail/status`, {
      headers: { Authorization: `Bearer ${token || ""}` },
    });
    if (!res.ok) throw new Error("Failed to load email status");
    const data = (await res.json()) as EmailStatus;
    setStatus(data);
  }, []);

  // effect #1: on mount, if callback added ?gmail=connected, handle it
  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const gmailFlag = sp.get("gmail");
    const connectedEmail = sp.get("email");
    if (gmailFlag === "connected") {
      refreshStatus()
        .then(() => {
          toast({
            title: "Gmail connected",
            description: connectedEmail
              ? `Connected as ${connectedEmail}`
              : "Connection successful.",
          });
        })
        .catch(() => {
          /* ignore */
        });
      // remove params from the URL
      const url = new URL(window.location.href);
      url.searchParams.delete("gmail");
      url.searchParams.delete("email");
      window.history.replaceState({}, "", url.toString());
    }
  }, [refreshStatus, toast]);

  // optional: Disconnect + Send test handlers & buttons
  const [busyAction, setBusyAction] = React.useState<
    null | "test" | "disconnect"
  >(null);

  async function handleSendTest() {
    setBusyAction("test");
    try {
      const token = localStorage.getItem("token");
      // Send the test to the connected email (or let user type one)
      const to = status.email || "";
      const res = await fetch(`${baseURL}/api/integrations/gmail/send-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify({ to }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Send failed");
      toast({ title: "Test sent", description: `Check inbox: ${to}` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Test failed",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDisconnect() {
    setBusyAction("disconnect");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/integrations/gmail/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token || ""}` },
      });
      if (!res.ok)
        throw new Error((await res.json()).message || "Disconnect failed");
      await refreshStatus();
      toast({ title: "Disconnected", description: "Gmail account removed." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not disconnect",
        description: e instanceof Error ? e.message : "",
      });
    } finally {
      setBusyAction(null);
    }
  }

  // 🔎 Fetch current status (terms + gmail connection)
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${baseURL}/api/integrations/gmail/status`, {
          headers: { Authorization: `Bearer ${token || ""}` },
        });
        if (!res.ok) throw new Error("Failed to load email status");
        const data = (await res.json()) as EmailStatus;
        if (mounted) setStatus(data);
      } catch (e) {
        // silent; stays defaults
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleAgree = async () => {
    if (!agreeChecked) return;
    setSavingAgree(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${baseURL}/api/integrations/gmail/accept-terms`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || ""}`,
          },
          body: JSON.stringify({ accepted: true }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to record acceptance");
      }
      setStatus((s) => ({ ...s, termsAcceptedAt: new Date().toISOString() }));
      setDialogOpen(false);
      toast({
        title: "Thank you!",
        description: "Terms accepted. You can now connect an email account.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not save",
        description: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setSavingAgree(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const redirect = window.location.href;
      const url =
        `${baseURL}/api/integrations/gmail/connect` +
        `?redirect=${encodeURIComponent(redirect)}` +
        `&token=${encodeURIComponent(token)}`; // <-- pass token in query for this flow

      // open in a new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking email-sending
        status…
      </div>
    );
  }

  const hasAccepted = Boolean(status.termsAcceptedAt);

  return (
    <div className="space-y-4">
      {!hasAccepted && (
        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>Email invoicing is enabled for your account</AlertTitle>
          <AlertDescription className="mt-2">
            Your administrator has granted you permission to send invoices via
            email. Please review and accept the terms to activate this feature.
            <div className="mt-3">
              <Button size="sm" onClick={() => setDialogOpen(true)}>
                Read & Agree
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">Email account</div>
              {status.connected && status.email ? (
                <div className="text-muted-foreground">
                  Connected: {status.email}
                </div>
              ) : (
                <div className="text-muted-foreground">
                  {hasAccepted
                    ? "No email connected yet."
                    : "Accept terms first to connect an email."}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!status.connected && (
              <Button
                onClick={handleConnect}
                disabled={!hasAccepted || connecting}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Connect Gmail
              </Button>
            )}
            {status.connected && (
              <Button variant="outline" onClick={handleConnect}>
                Change account
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Terms dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Terms for sending invoices via email</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-64 rounded-md border p-4 text-sm space-y-4">
            <p>
              <strong>1. Scope.</strong> You authorize this app to send invoice
              emails on your behalf.
            </p>
            <p>
              <strong>2. Data usage.</strong> Email metadata (recipient,
              subject) and invoice PDFs may be processed to deliver messages.
            </p>
            <p>
              <strong>3. Gmail access.</strong> We request the Gmail scope{" "}
              <code>gmail.send</code> solely to send messages; we do not read
              your inbox.
            </p>
            <p>
              <strong>4. Compliance.</strong> You agree to comply with anti-spam
              and email content policies. Do not send unsolicited emails.
            </p>
            <p>
              <strong>5. Revocation.</strong> You can disconnect your email
              anytime from this screen.
            </p>
            <p>
              <strong>6. Liability.</strong> Use at your own risk; the service
              is provided “as is”.
            </p>
          </ScrollArea>
          <div className="flex items-center gap-2 pt-3">
            <Checkbox
              id="agree"
              checked={agreeChecked}
              onCheckedChange={(v) => setAgreeChecked(Boolean(v))}
            />
            <label htmlFor="agree" className="text-sm">
              I have read and agree to the terms above.
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAgree}
              disabled={!agreeChecked || savingAgree}
            >
              {savingAgree ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Agree & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
