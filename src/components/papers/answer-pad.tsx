"use client";

import { useRef, useState } from "react";
import { Camera, X } from "lucide-react";
import type { PaperQuestionType } from "@/lib/data/pastpapers";
import { cn } from "@/lib/utils";

const OPTIONS = ["A", "B", "C", "D"] as const;
const MAX_PHOTO_WIDTH = 1400;
const PHOTO_QUALITY = 0.8;

/** Reads a photographed script and downsizes it to a JPEG data URL before it travels to the marker. */
async function shrinkPhoto(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file could not be read as a photo."));
      el.src = url;
    });
    const scale = Math.min(1, MAX_PHOTO_WIDTH / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process the photo.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface AnswerPadProps {
  type: PaperQuestionType;
  response: string;
  image?: string;
  onResponse: (next: string) => void;
  onImage: (dataUrl: string | undefined) => void;
  onMark: () => void;
  marking: boolean;
}

function McqPad({ response, onResponse, marking }: Pick<AnswerPadProps, "response" | "onResponse" | "marking">) {
  return (
    <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Choose an option">
      {OPTIONS.map((letter) => {
        const chosen = response === letter;
        return (
          <button
            key={letter}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={marking}
            onClick={() => onResponse(letter)}
            className={cn(
              "num flex h-14 items-center justify-center rounded-xl border text-lg font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              chosen ? "border-accent bg-accent text-white" : "border-line bg-surface text-ink hover:bg-surface-2",
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}

function StructuredPad({ response, image, onResponse, onImage, marking }: Omit<AnswerPadProps, "type" | "onMark">) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setReading(true);
    try {
      onImage(await shrinkPhoto(file));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : "Could not read the photo.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor="paper-response">
          Your working
        </label>
        <textarea id="paper-response" className="input min-h-40 resize-y" value={response} onChange={(e) => onResponse(e.target.value)} disabled={marking} placeholder="Type your answer, or photograph the working on paper." />
        <p className="mt-1.5 text-xs text-ink-3">Show every step; method marks need the working.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" id="paper-photo" onChange={(e) => void pick(e.target.files?.[0])} disabled={marking || reading} />
        <label htmlFor="paper-photo" className={cn("btn-outline btn-sm cursor-pointer", (marking || reading) && "pointer-events-none opacity-50")}>
          <Camera size={14} />
          {reading ? "Reading photo…" : image ? "Retake photo" : "Photograph my working"}
        </label>
        {image ? (
          <div className="flex items-center gap-2">
            <img src={image} alt="Your photographed working" className="h-14 w-auto max-w-full rounded-lg border border-line" />
            <button type="button" className="btn-ghost btn-sm" onClick={() => onImage(undefined)} disabled={marking} aria-label="Remove photo">
              <X size={14} />
            </button>
          </div>
        ) : null}
      </div>
      {image ? <p className="text-xs text-ink-3">The photo will be read and marked instead of the typed text.</p> : null}
      {photoError ? <p className="chip-danger">{photoError}</p> : null}
    </div>
  );
}

export function AnswerPad({ type, response, image, onResponse, onImage, onMark, marking }: AnswerPadProps) {
  const empty = type === "mcq" ? response === "" : response.trim() === "" && !image;
  return (
    <div className="space-y-4">
      {type === "mcq" ? <McqPad response={response} onResponse={onResponse} marking={marking} /> : <StructuredPad response={response} image={image} onResponse={onResponse} onImage={onImage} marking={marking} />}
      {marking ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <div className="skeleton h-4 w-2/3" />
          <div className="skeleton h-4 w-1/2" />
          <p className="text-xs text-ink-3">Marking against the scheme…</p>
        </div>
      ) : (
        <button type="button" className="btn-primary" onClick={onMark} disabled={empty}>
          Mark this question
        </button>
      )}
    </div>
  );
}
