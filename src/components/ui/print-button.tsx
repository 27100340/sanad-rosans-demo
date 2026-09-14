"use client";

import { Printer } from "lucide-react";

/** Opens the browser print dialog; globals.css hides the shell so only the page content prints. */
export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button type="button" className="btn-outline print-hide" onClick={() => window.print()}>
      <Printer size={14} /> {label}
    </button>
  );
}
