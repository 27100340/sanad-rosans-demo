"use client";

/**
 * Microphone capture for recite-back: MediaRecorder (webm/opus) and, in
 * parallel, the browser's speech recognition (ar-SA) when it exists. Both are
 * feature-detected; permission denial surfaces as an inline message and
 * never throws out of the hook.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export interface RecordedAudio {
  base64: string;
  mimeType: string;
}

export interface RecorderStopPayload {
  audio: RecordedAudio | null;
  browserTranscript: string;
}

// Minimal typings: the Web Speech API is not in lib.dom.
interface SpeechResultAlternative { transcript: string }
interface SpeechResultItem { isFinal: boolean; length: number; [index: number]: SpeechResultAlternative }
interface SpeechRecognitionEventLike { resultIndex: number; results: { length: number; [index: number]: SpeechResultItem } }
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

const SPEECH_LANG = "ar-SA";
const PREFERRED_MIME = "audio/webm;codecs=opus";
const FALLBACK_MIME = "audio/webm";

function speechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.readAsDataURL(blob);
  });
}

export function useRecorder(onStop: (payload: RecorderStopPayload) => void) {
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const [support, setSupport] = useState({ mic: false, speech: false });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const speechRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const onStopRef = useRef(onStop);
  onStopRef.current = onStop;

  useEffect(() => {
    setSupport({
      mic: typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== "undefined",
      speech: speechCtor() !== null,
    });
  }, []);

  const startSpeech = useCallback(() => {
    const Ctor = speechCtor();
    if (!Ctor) return;
    try {
      const rec = new Ctor();
      rec.lang = SPEECH_LANG;
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          const text = item[0]?.transcript ?? "";
          if (item.isFinal) finalRef.current += ` ${text}`;
          else live += ` ${text}`;
        }
        interimRef.current = (finalRef.current + live).trim();
        setInterim(interimRef.current);
      };
      rec.onerror = () => undefined;
      rec.onend = () => undefined;
      rec.start();
      speechRef.current = rec;
    } catch {
      speechRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setInterim("");
    finalRef.current = "";
    interimRef.current = "";
    chunksRef.current = [];
    if (!support.mic) {
      setError("This browser cannot record audio. Use Simulate attempt instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported(PREFERRED_MIME) ? PREFERRED_MIME : FALLBACK_MIME;
      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : undefined);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || FALLBACK_MIME });
        let audio: RecordedAudio | null = null;
        try {
          audio = blob.size > 0 ? { base64: await blobToBase64(blob), mimeType: blob.type } : null;
        } catch {
          audio = null;
        }
        onStopRef.current({ audio, browserTranscript: finalRef.current.trim() || interimRef.current });
      };
      recorder.start();
      recorderRef.current = recorder;
      startSpeech();
      setRecording(true);
    } catch {
      setError("Microphone permission was declined. You can still use Simulate attempt.");
    }
  }, [support.mic, startSpeech]);

  const stop = useCallback(() => {
    try {
      speechRef.current?.stop();
    } catch {
      /* recognition may already be stopped */
    }
    speechRef.current = null;
    const rec = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  return { recording, error, interim, support, start, stop };
}
