"use client";

import * as React from "react";
import type { TranscriptDoc, TranscriptSegment } from "@/lib/ai/types";

/**
 * Live transcription via the Web Speech API.
 *
 * This is what makes the report about the talk rather than about nothing. It
 * runs alongside the camera and produces the transcript the analysis reads.
 *
 * Deliberately not shown to the speaker while they talk — user-flow.md is
 * explicit that watching your own words appear destroys fluency. It is
 * captured silently and only surfaced afterwards, in the report.
 *
 * Honest about its limits. `SpeechRecognition` is a live guess, not a studio
 * transcription: it mishears, it drops words, and in Chrome it is a network
 * service that can simply fail. Every transcript it produces is marked
 * `approximate`, and when it is unsupported or errors the hook returns null so
 * the report says "no transcript captured" rather than analysing silence.
 */

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<
    ArrayLike<{ transcript: string }> & { isFinal: boolean }
  >;
};

type Ctor = new () => SpeechRecognitionLike;

function getCtor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: Ctor;
    webkitSpeechRecognition?: Ctor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type TranscriberState = {
  /** Null until the talk ends, or forever if transcription is unavailable. */
  result: TranscriptDoc | null;
  supported: boolean;
  error: string | null;
};

export function useTranscriber(active: boolean): TranscriberState {
  const [supported] = React.useState(() => getCtor() !== null);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<TranscriptDoc | null>(null);

  const segmentsRef = React.useRef<TranscriptSegment[]>([]);
  const startedAtRef = React.useRef<number>(0);

  React.useEffect(() => {
    if (!active) return;

    // Unsupported is knowable at render time, so it is derived below rather
    // than pushed into state from here. Runtime failures are deferred to a
    // timer for the same reason: a synchronous setState in an effect body
    // cascades renders, and React's lint rule rightly objects.
    const Ctor = getCtor();
    if (!Ctor) return;

    let failTimer: ReturnType<typeof setTimeout> | undefined;
    const fail = (message: string) => {
      failTimer = setTimeout(() => setError(message), 0);
    };

    let recognition: SpeechRecognitionLike;
    try {
      recognition = new Ctor();
    } catch {
      fail("Speech recognition could not start.");
      return;
    }

    segmentsRef.current = [];
    startedAtRef.current = Date.now();

    recognition.lang = "en-US";
    recognition.continuous = true;
    // Interim results are requested only so recognition keeps streaming; they
    // are discarded. Only finalised segments reach the transcript, because an
    // interim guess is frequently a different sentence.
    recognition.interimResults = true;

    let stopped = false;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (!res.isFinal) continue;
        const text = res[0]?.transcript?.trim();
        if (!text) continue;
        segmentsRef.current.push({
          text,
          startMs: Date.now() - startedAtRef.current,
          endMs: null,
        });
      }
    };

    recognition.onerror = (e) => {
      // `no-speech` and `aborted` are normal endings, not failures worth
      // reporting to someone who just finished talking.
      const code = e?.error ?? "unknown";
      if (code !== "no-speech" && code !== "aborted") {
        setError(`Speech recognition error: ${code}`);
      }
    };

    // Chrome ends the session on its own after a silence. Restart until the
    // talk is actually over, or a minute of speech becomes ten seconds of it.
    recognition.onend = () => {
      if (stopped) return;
      try {
        recognition.start();
      } catch {
        /* already starting; nothing to do */
      }
    };

    try {
      recognition.start();
    } catch {
      fail("Speech recognition could not start.");
      return;
    }

    return () => {
      stopped = true;
      if (failTimer) clearTimeout(failTimer);
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
      const segments = segmentsRef.current;
      const text = segments.map((s) => s.text).join(" ").trim();
      setResult(
        text.length > 0
          ? { text, segments, source: "web-speech", approximate: true }
          : null,
      );
    };
  }, [active]);

  return {
    result,
    supported,
    error: supported ? error : "This browser has no speech recognition.",
  };
}
