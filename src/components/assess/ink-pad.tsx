"use client";

/**
 * Handwriting surface for exam answers: finger, stylus or mouse.
 *
 * Built for a tablet with a touch pen, which is how a student actually works a
 * physics question. Three things matter and are easy to get wrong:
 *
 *  - Pressure. A fixed stroke width reads as a marker pen. Stylus pressure is
 *    mapped to line width so writing looks like writing.
 *  - Coalesced events. A pen samples far faster than the browser fires
 *    pointermove; drawing only the fired events loses the curve of a letter.
 *  - Palm rejection. Once a real pen has touched the surface, finger input is
 *    ignored, otherwise a resting hand scribbles across the working.
 *
 * The ink is exported as a PNG data URL for the handwriting reader to
 * transcribe. Nothing is uploaded until the student asks for it.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, Pen, RotateCcw, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INK_COLOURS = [
  { hex: "#1f3a8a", label: "Blue" },
  { hex: "#111827", label: "Black" },
];

/** Stroke width in canvas pixels at the lightest and firmest pressure. */
const MIN_WIDTH = 1.2;
const MAX_WIDTH = 3.6;
const ERASER_WIDTH = 28;

/** A pen that reports no pressure sends 0.5; treat that as a normal stroke. */
const DEFAULT_PRESSURE = 0.5;

/** Undo depth. Each entry is a full-canvas snapshot, so keep it modest. */
const MAX_UNDO = 12;

const RULE_SPACING = 34;
const ASPECT = 0.62; // height as a fraction of width; roughly half a page

export interface InkPadProps {
  /** Shown to the reader so it knows what the working is meant to answer. */
  onSave: (pngDataUrl: string) => void;
  busy?: boolean;
  saveLabel?: string;
}

export function InkPad({ onSave, busy = false, saveLabel = "Read my handwriting" }: InkPadProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inkRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const penSeen = useRef(false);
  const undoStack = useRef<ImageData[]>([]);

  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [colour, setColour] = useState(INK_COLOURS[0].hex);
  const [hasInk, setHasInk] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  // Size the canvas to its container at device resolution so strokes are crisp.
  useEffect(() => {
    const wrap = wrapRef.current;
    const ink = inkRef.current;
    if (!wrap || !ink) return;
    const resize = () => {
      const cssWidth = wrap.clientWidth;
      if (!cssWidth) return;
      const cssHeight = Math.round(cssWidth * ASPECT);
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      // Resizing clears the bitmap, so carry the existing ink across.
      const previous = ink.width ? ink.toDataURL() : "";
      ink.width = Math.round(cssWidth * ratio);
      ink.height = Math.round(cssHeight * ratio);
      ink.style.width = `${cssWidth}px`;
      ink.style.height = `${cssHeight}px`;
      const ctx = ink.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);
      if (previous) {
        const img = new Image();
        img.onload = () => ctx?.drawImage(img, 0, 0, cssWidth, cssHeight);
        img.src = previous;
      }
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const pointAt = (e: React.PointerEvent) => {
    const canvas = inkRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushUndo = () => {
    const canvas = inkRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift();
    setCanUndo(true);
  };

  /** Finger input is ignored once a real pen has been used on this pad. */
  const shouldIgnore = (e: React.PointerEvent) => e.pointerType === "touch" && penSeen.current;

  const down = (e: React.PointerEvent) => {
    if (e.pointerType === "pen") penSeen.current = true;
    if (shouldIgnore(e)) return;
    pushUndo();
    drawing.current = true;
    last.current = pointAt(e);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };

  const strokeTo = (ctx: CanvasRenderingContext2D, to: { x: number; y: number }, pressure: number) => {
    const from = last.current ?? to;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = ERASER_WIDTH;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = colour;
      ctx.lineWidth = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * pressure;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    last.current = to;
  };

  const move = (e: React.PointerEvent) => {
    if (!drawing.current || shouldIgnore(e)) return;
    const ctx = inkRef.current?.getContext("2d");
    if (!ctx) return;
    // A stylus reports many samples per frame; drawing all of them keeps curves smooth.
    const events = typeof e.nativeEvent.getCoalescedEvents === "function" ? e.nativeEvent.getCoalescedEvents() : [];
    const rect = inkRef.current!.getBoundingClientRect();
    if (events.length) {
      for (const raw of events) {
        strokeTo(ctx, { x: raw.clientX - rect.left, y: raw.clientY - rect.top }, raw.pressure || DEFAULT_PRESSURE);
      }
    } else {
      strokeTo(ctx, pointAt(e), e.pressure || DEFAULT_PRESSURE);
    }
    setHasInk(true);
  };

  const up = () => {
    drawing.current = false;
    last.current = null;
  };

  const undo = () => {
    const canvas = inkRef.current;
    const ctx = canvas?.getContext("2d");
    const previous = undoStack.current.pop();
    if (!canvas || !ctx || !previous) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.putImageData(previous, 0, 0);
    ctx.restore();
    setCanUndo(undoStack.current.length > 0);
  };

  const clear = () => {
    const canvas = inkRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    pushUndo();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasInk(false);
  };

  /** Flatten onto white so the reader sees ink on paper, not ink on nothing. */
  const save = useCallback(() => {
    const ink = inkRef.current;
    if (!ink) return;
    const out = document.createElement("canvas");
    out.width = ink.width;
    out.height = ink.height;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(ink, 0, 0);
    onSave(out.toDataURL("image/png"));
  }, [onSave]);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <ToolButton active={tool === "pen"} onClick={() => setTool("pen")} label="Pen">
          <Pen size={14} />
        </ToolButton>
        <ToolButton active={tool === "eraser"} onClick={() => setTool("eraser")} label="Eraser">
          <Eraser size={14} />
        </ToolButton>
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        {INK_COLOURS.map((c) => (
          <button
            key={c.hex}
            type="button"
            onClick={() => {
              setColour(c.hex);
              setTool("pen");
            }}
            aria-label={`${c.label} ink`}
            aria-pressed={colour === c.hex && tool === "pen"}
            className={cn(
              "h-6 w-6 rounded-full border-2 transition-transform",
              colour === c.hex && tool === "pen" ? "scale-110 border-accent" : "border-line",
            )}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <ToolButton onClick={undo} label="Undo" disabled={!canUndo}>
          <Undo2 size={14} />
        </ToolButton>
        <ToolButton onClick={clear} label="Clear" disabled={!hasInk}>
          <RotateCcw size={14} />
        </ToolButton>
      </div>

      <div
        ref={wrapRef}
        className="overflow-hidden rounded-xl border border-line bg-white"
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${RULE_SPACING - 1}px, rgba(15,23,42,0.08) ${RULE_SPACING}px)`,
        }}
      >
        <canvas
          ref={inkRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          onPointerCancel={up}
          className="block touch-none"
          style={{ cursor: tool === "eraser" ? "cell" : "crosshair" }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-2xs text-ink-3">
          Write with a finger, a touch pen or the mouse. Pen pressure is used where the device reports it.
        </p>
        <button type="button" onClick={save} disabled={!hasInk || busy} className="btn-primary btn-sm">
          {busy ? "Reading…" : saveLabel}
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  label,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-lg border text-ink-2 transition-colors disabled:opacity-40",
        active ? "border-accent bg-accent/10 text-accent" : "border-line hover:bg-surface-2",
      )}
    >
      {children}
    </button>
  );
}
