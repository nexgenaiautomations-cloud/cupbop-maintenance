"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Smartphone, Check, Share, Download } from "lucide-react";

type InstallStatus = "checking" | "installed" | "installable" | "ios" | "unsupported";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallAppCard() {
  const [status, setStatus] = useState<InstallStatus>("checking");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari only
      window.navigator.standalone === true;
    if (isStandalone) {
      setStatus("installed");
      return;
    }

    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS) {
      setStatus("ios");
    } else {
      setStatus("unsupported");
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setStatus("installable");
    };
    const onInstalled = () => {
      setDeferred(null);
      setStatus("installed");
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setStatus("installed");
    setDeferred(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Smartphone className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm">Install as app</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Add Cupbop Maintenance to your home screen for one-tap access, full-screen view, and a faster startup —
          ideal for technicians and store managers on the floor.
        </p>

        {status === "checking" ? (
          <div className="text-xs text-muted-foreground">Checking install state…</div>
        ) : null}

        {status === "installed" ? (
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
            <Check className="h-3.5 w-3.5" /> Installed — you&apos;re running the app version.
          </div>
        ) : null}

        {status === "installable" ? (
          <Button type="button" onClick={install} className="gap-2">
            <Download className="h-4 w-4" /> Install Cupbop Maintenance
          </Button>
        ) : null}

        {status === "ios" ? (
          <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
            <div className="mb-1 font-semibold">Install on iPhone / iPad</div>
            <ol className="list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>
                Tap the <Share className="-mt-0.5 inline h-3.5 w-3.5" /> <strong>Share</strong> icon in Safari.
              </li>
              <li>
                Choose <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right.
              </li>
            </ol>
          </div>
        ) : null}

        {status === "unsupported" ? (
          <div className="rounded-md border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
            Your browser hasn&apos;t offered an install prompt yet. Try Chrome or Edge on Android/desktop, or open
            this page in Safari on iOS to add it to your home screen.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
