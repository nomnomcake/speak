"use client";

import * as React from "react";
import { Panel, ProgressBar } from "@/components/ui";

/**
 * AnalyzingWindow — the pause between talking and being told how it went.
 *
 * The messages name only work that actually happens. The brief's example list
 * included "Evaluating your argument" and "Comparing your opening and
 * conclusion", which are exactly the things no code here does — they need a
 * language model reading the transcript, and none is connected. Printing them
 * would be a progress bar lying about its own contents, which is the specific
 * failure this project already fixed once on the search screen.
 *
 * So the list is built from the steps that run, and grows when a provider is
 * connected rather than being aspirational now.
 */

const LOCAL_STEPS = [
  "Reading the transcript",
  "Counting filler words",
  "Measuring your pace",
  "Building your report",
];

const MODEL_STEPS = [
  "Reading the transcript",
  "Counting filler words",
  "Measuring your pace",
  "Checking it against your topic",
  "Writing your report",
];

const STEP_MS = 900;

export function AnalyzingWindow({
  /** True once a language model is actually part of the pipeline. */
  modelConnected = false,
}: {
  modelConnected?: boolean;
}) {
  const steps = modelConnected ? MODEL_STEPS : LOCAL_STEPS;
  const [i, setI] = React.useState(0);

  React.useEffect(() => {
    // Stops on the last step rather than looping. A cycling list that never
    // ends reads as a hang; a bar that parks on "Building your report" reads
    // as something taking a moment.
    if (i >= steps.length - 1) return;
    const id = setTimeout(() => setI((n) => n + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [i, steps.length]);

  return (
    <div className="flex min-h-72 items-center justify-center p-4">
      <Panel
        chrome="window"
        title="Analyzing"
        notch={4}
        shadow={5}
        sprig={false}
        className="w-full max-w-sm"
      >
        <div className="min-h-28 space-y-4 px-1 py-2">
          <p className="font-mono text-sm text-graphite">
            Analyzing your presentation
            <span className="animate-blink">…</span>
          </p>

          <ProgressBar
            value={(i + 1) / steps.length}
            variant="segmented"
            segments={16}
            size="sm"
            ariaLabel="Analysis progress"
          />

          <p className="type-hud text-slate">{steps[i]}</p>
        </div>
      </Panel>
    </div>
  );
}
