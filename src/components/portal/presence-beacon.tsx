"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const INTERVAL_MS = 60_000;

/** Tells the server where this person is, on every navigation and once a minute. Renders nothing. */
export function PresenceBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    const send = () => {
      void fetch("/api/presence", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ path: pathname }), keepalive: true }).catch(() => undefined);
    };
    send();
    const timer = setInterval(send, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [pathname]);
  return null;
}
