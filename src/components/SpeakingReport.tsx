"use client";

import * as React from "react";
import { ChevronRight, Home, RotateCcw, Shuffle, TrendingUp } from "lucide-react";
import {
  Badge,
  Button,
  Panel,
  PixelFrame,
  ProgressBar,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { SCORE_KEYS, SCORE_LABELS, type AiFeedback } from "@/lib/ai/types";

/**
 * SpeakingReport — the diagnostic printout for one talk.
 *
 * Modelled on the utilities this product's visual language comes from: a
 * framed window, a headline readout, labelled meters, and a status strip.
 *
 * The rule running through it is that an empty section says why it is empty.
 * A report that renders nothing where the coaching notes should be looks
 * broken; one that says "needs a language model, none connected" is telling
 * the truth about a product that is half-built, which is what it is.
 */

function Meter({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="type-hud w-28 shrink-0 text-graphite">{label}</span>
      <ProgressBar
        value={value / 100}
        variant="segmented"
        segments={10}
        size="sm"
        className="min-w-0 flex-1"
        ariaLabel={label}
      />
      <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-slate">
        {value}
      </span>
    </div>
  );
}

/**
 * A verified quotation.
 *
 * Only reaches the screen after the server has found it in the transcript, so
 * anything rendered here is something the speaker demonstrably said. That is
 * the difference between feedback a person can check and feedback they have to
 * take on faith.
 */
function Quote({ text }: { text: string }) {
  return (
    <p className="border-l-2 border-mint-deep pl-3 font-mono text-xs leading-relaxed text-slate">
      “{text}”
    </p>
  );
}

/**
 * An observation and its evidence.
 *
 * A claim with no quote is labelled an interpretation rather than dressed up
 * as an observation — the report should never blur which of the two it is
 * doing.
 */
function Claim({
  title,
  tone,
  claim,
}: {
  title: string;
  tone: "affirm" | "alert";
  claim: { text: string; quote: string | null };
}) {
  return (
    <PixelFrame notch={4} border={2} innerClassName="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "type-caps",
            tone === "affirm" ? "text-affirm" : "text-alert",
          )}
        >
          {title}
        </span>
        {claim.quote === null && (
          <Badge tone="mint">Interpretation — not quoted</Badge>
        )}
      </div>
      <p className="text-sm leading-relaxed text-graphite">{claim.text}</p>
      {claim.quote && <Quote text={claim.quote} />}
    </PixelFrame>
  );
}

/** A section that could not run, named rather than hidden. */
function ComingSoon({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <PixelFrame
      notch={4}
      border={2}
      tone="mist"
      innerClassName="flex flex-col gap-2 px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <span className="type-caps text-slate">{title}</span>
        <Badge tone="mint">Coming soon</Badge>
      </div>
      <p className="font-mono text-xs leading-relaxed text-slate">{reason}</p>
    </PixelFrame>
  );
}

export function SpeakingReport({
  feedback,
  onFinish,
  onRetake,
  children,
}: {
  feedback: AiFeedback;
  onFinish: () => void;
  /** Another go at the same topic. Optional so the report can be shown
   *  somewhere there is nothing to retake — the archive, later. */
  onRetake?: () => void;
  /** The recording player, composed in rather than rebuilt. */
  children?: React.ReactNode;
}) {
  const [showTranscript, setShowTranscript] = React.useState(false);
  const { metrics, fillerWords, scores, transcript } = feedback;

  return (
    <div className="space-y-5">
      <Panel
        chrome="window"
        title="Speaking report"
        notch={6}
        actions={
          feedback.source === "mock" ? (
            <Badge tone="alert">Sample</Badge>
          ) : undefined
        }
      >
        <div className="space-y-5">
          {/* The banner is not decoration. Without it a user would read these
              numbers as a judgement of their talk, and they are not. */}
          {feedback.source === "mock" && (
            <PixelFrame
              notch={4}
              border={2}
              tone="mist"
              innerClassName="flex flex-col gap-1 px-4 py-3"
            >
              <span className="type-caps text-alert">
                Sample scores — not a real evaluation
              </span>
              <p className="font-mono text-xs leading-relaxed text-slate">
                No language model is connected, so the scores below are derived
                from surface features of your transcript (length, pace, filler
                density) to lay out this screen. Everything that needs someone
                to actually read what you said is marked below.
              </p>
            </PixelFrame>
          )}

          {/* Headline */}
          <div className="flex flex-col items-center gap-2 py-2">
            <span className="type-hud text-slate">Your speaking score</span>
            {feedback.overallScore !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-6xl leading-none tabular-nums">
                  {feedback.overallScore}
                </span>
                <span className="type-caps text-slate">/ 100</span>
              </div>
            ) : (
              <span className="font-mono text-2xl text-mute">Not scored</span>
            )}
            {feedback.summary && (
              <p className="max-w-md text-center text-sm leading-relaxed text-graphite">
                {feedback.summary}
              </p>
            )}
          </div>

          {scores ? (
            <div className="space-y-2">
              {SCORE_KEYS.map((key) =>
                typeof scores[key] === "number" ? (
                  <Meter
                    key={key}
                    label={SCORE_LABELS[key]}
                    value={scores[key] as number}
                  />
                ) : null,
              )}
            </div>
          ) : (
            /* Two different failures, and saying the wrong one is worse than
               saying nothing. Unscored with a transcript present means the
               analysis did not come back — the panel below is showing the very
               words this line claimed were never captured. */
            <ComingSoon
              title="Category scores"
              reason={
                transcript
                  ? "Your talk was transcribed, but the analysis did not come back, so nothing was scored."
                  : "Nothing was transcribed, so there was nothing to score."
              }
            />
          )}
        </div>
      </Panel>

      {/* Measured, not judged — this panel is the one that is fully real. */}
      <Panel chrome="window" title="Session metrics" notch={6} sprig={false}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Stat
            label="Research time"
            value={
              metrics.researchMs === null
                ? null
                : `${Math.round(metrics.researchMs / 60000)}m ${Math.round((metrics.researchMs % 60000) / 1000)}s`
            }
            note="Timer never started"
          />
          <Stat
            label="Speaking time"
            value={`${Math.round(metrics.speakingMs / 1000)}s`}
          />
          <Stat
            label="Words spoken"
            value={metrics.wordsSpoken?.toString() ?? null}
          />
          <Stat
            label="Words per minute"
            value={metrics.wordsPerMinute?.toString() ?? null}
          />
          <Stat label="Pauses" value={null} note="Needs audio analysis" />
        </div>

        {fillerWords ? (
          <div className="mt-4 space-y-2 border-t-2 border-ink pt-4">
            <div className="flex items-baseline gap-3">
              <span className="type-caps text-graphite">Filler words</span>
              <span className="font-mono text-2xl tabular-nums">
                {fillerWords.total}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {fillerWords.breakdown.slice(0, 6).map((f) => (
                <span
                  key={f.word}
                  className="pixel-clip border-2 border-ink bg-mint-mist px-2 py-1 font-mono text-xs"
                  style={{ ["--notch" as string]: "2px" }}
                  title={
                    f.ambiguous
                      ? "Only a filler in some uses — counted by context, so this is an estimate"
                      : "Always a filler"
                  }
                >
                  {f.word} ×{f.count}
                  {f.ambiguous && <span className="text-mute"> ?</span>}
                </span>
              ))}
            </div>
            <p className="type-hud text-mute">
              Words marked ? are only fillers in some uses and were counted by
              context
            </p>
          </div>
        ) : (
          <div className="mt-4 border-t-2 border-ink pt-4">
            <ComingSoon
              title="Filler words"
              reason="No transcript was captured, so nothing could be counted."
            />
          </div>
        )}
      </Panel>

      {/* Everything a model would have written. */}
      <Panel chrome="window" title="Coach's notes" notch={6} sprig={false}>
        <div className="space-y-3">
          {feedback.strongestMoment ? (
            <Claim
              tone="affirm"
              title="Strongest moment"
              claim={feedback.strongestMoment}
            />
          ) : (
            <ComingSoon
              title="Strongest moment"
              reason="This has to quote something you actually said, so it needs a language model reading your transcript. None is connected."
            />
          )}

          {feedback.biggestOpportunity ? (
            <Claim
              tone="alert"
              title="Biggest opportunity"
              claim={feedback.biggestOpportunity}
            />
          ) : (
            <ComingSoon
              title="Biggest opportunity"
              reason="Advice worth acting on has to name what you did. Generic tips are worse than nothing, so this stays empty until a model can read the talk."
            />
          )}

          {feedback.coachingNotes.length > 0 &&
            feedback.coachingNotes.map((n) => (
              <PixelFrame
                key={n.headline}
                notch={4}
                border={2}
                innerClassName="space-y-1 px-4 py-3"
              >
                <span className="type-caps text-graphite">{n.headline}</span>
                <p className="font-mono text-xs text-slate">{n.whatHappened}</p>
                <p className="font-mono text-xs text-slate">{n.whyItMatters}</p>
                <p className="text-sm text-graphite">{n.whatToDoNext}</p>
                {n.quote && <Quote text={n.quote} />}
              </PixelFrame>
            ))}

          {feedback.topicCoverage ? (
            <div className="space-y-2">
              <Meter label="Topic coverage" value={feedback.topicCoverage.score} />
              <p className="text-sm leading-relaxed text-graphite">
                {feedback.topicCoverage.explanation}
              </p>
            </div>
          ) : (
            <ComingSoon
              title="Topic coverage"
              reason="Judging what you covered means comparing your words against the research prompt, which needs a model."
            />
          )}
        </div>
      </Panel>

      {/* Transcript */}
      <Panel chrome="window" title="Presentation transcript" notch={6} sprig={false} flush>
        <div>
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            aria-expanded={showTranscript}
            className="type-caps flex w-full items-center gap-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-mint-mist"
          >
            <ChevronRight
              size={13}
              className={cn(
                "ease-pixel transition-transform duration-200",
                showTranscript && "rotate-90",
              )}
            />
            {transcript ? "Read what you said" : "No transcript"}
          </button>

          <div
            className="window-shade"
            data-open={showTranscript}
            inert={!showTranscript}
          >
            <div>
              <div className="border-t-2 border-ink px-4 py-3">
                {transcript ? (
                  <>
                    <p className="font-mono text-xs leading-relaxed text-graphite">
                      {transcript.text}
                    </p>
                    <p className="type-hud mt-3 text-mute">
                      Live transcription — approximate, and it mishears
                    </p>
                  </>
                ) : (
                  <p className="font-mono text-xs leading-relaxed text-slate">
                    Nothing was transcribed. Speech recognition may be
                    unsupported in this browser, or it did not pick up any
                    speech.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {children}

      {/* A model inventing evidence about someone is exactly the failure a
          user needs told, not quietly absorbed. */}
      {feedback.strippedQuotes > 0 && (
        <PixelFrame
          notch={4}
          border={2}
          tone="mist"
          innerClassName="space-y-1 px-4 py-3"
        >
          <span className="type-caps text-alert">Unverified quotes removed</span>
          <p className="font-mono text-xs leading-relaxed text-slate">
            {feedback.strippedQuotes} quotation
            {feedback.strippedQuotes === 1 ? "" : "s"} attributed to you could
            not be found in the transcript and {feedback.strippedQuotes === 1 ? "was" : "were"}{" "}
            removed. Treat the remaining wording above as interpretation.
          </p>
        </PixelFrame>
      )}

      {feedback.unavailable.length > 0 && (
        <Panel chrome="window" title="Not analysed" notch={6} sprig={false}>
          <ul className="space-y-2">
            {feedback.unavailable.map((u) => (
              <li key={u} className="font-mono text-xs leading-relaxed text-slate">
                — {u}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button size="sm" onClick={onFinish} iconLeft={<TrendingUp size={13} />}>
          Save and finish
        </Button>
        {/* Retake before New challenge: user-flow.md lists it first, and it is
            the one people reach for after being told how it went. Same topic,
            straight back into the lockout. */}
        {onRetake && (
          <Button
            size="sm"
            variant="secondary"
            onClick={onRetake}
            iconLeft={<RotateCcw size={13} />}
          >
            Retake
          </Button>
        )}
        <Button size="sm" variant="secondary" href="/play" iconLeft={<Shuffle size={13} />}>
          New challenge
        </Button>
        <Button size="sm" variant="ghost" href="/" iconLeft={<Home size={13} />}>
          Home
        </Button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string | null;
  note?: string;
}) {
  return (
    <PixelFrame notch={3} border={2} tone="mist" innerClassName="px-3 py-2">
      <span className="type-hud text-slate">{label}</span>
      <div className="mt-1 font-mono text-lg tabular-nums">
        {value ?? <span className="text-mute">—</span>}
      </div>
      {value === null && (
        <span className="type-hud text-mute">{note ?? "Unavailable"}</span>
      )}
    </PixelFrame>
  );
}
