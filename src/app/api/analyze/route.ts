import { NextResponse } from "next/server";
import { analyzePresentation } from "@/lib/ai/provider";
import { getTopic } from "@/lib/topics";
import type { AnalysisInput, TranscriptDoc } from "@/lib/ai/types";

/**
 * POST /api/analyze — turn a finished talk into a report.
 *
 * The client sends a topic id and a transcript, never the recording. Video of
 * someone's face in their home does not leave the device; topic-schema.md is
 * explicit that uploads must not be the default, and an analysis endpoint is
 * not a reason to make them one.
 *
 * The topic is looked up server-side from the id rather than trusted from the
 * body. Otherwise the research prompt the evaluator judges against would be
 * whatever the caller felt like sending.
 */

export const runtime = "nodejs";

/** Bounded so a malformed or hostile body cannot become a large model bill. */
const MAX_TRANSCRIPT_CHARS = 20_000;

function parseTranscript(raw: unknown): TranscriptDoc | null {
  if (typeof raw !== "object" || raw === null) return null;
  const t = raw as Partial<TranscriptDoc>;
  if (typeof t.text !== "string" || t.text.trim().length === 0) return null;
  return {
    text: t.text.slice(0, MAX_TRANSCRIPT_CHARS),
    segments: Array.isArray(t.segments) ? t.segments.slice(0, 500) : [],
    source: "web-speech",
    approximate: true,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  const topicId = typeof b.topicId === "string" ? b.topicId : "";
  const topic = getTopic(topicId);
  if (!topic) {
    return NextResponse.json({ error: "Unknown topic" }, { status: 400 });
  }

  const speakingMs =
    typeof b.speakingMs === "number" && Number.isFinite(b.speakingMs)
      ? Math.max(0, Math.min(b.speakingMs, 60 * 60 * 1000))
      : 0;

  const input: AnalysisInput = {
    topic: {
      id: topic.id,
      title: topic.title,
      category: topic.category,
      difficulty: topic.difficulty,
      researchPrompt: topic.researchPrompt,
      suggestedAngles: [...topic.suggestedAngles],
    },
    transcript: parseTranscript(b.transcript),
    speakingMs,
    researchMs:
      typeof b.researchMs === "number" && Number.isFinite(b.researchMs)
        ? Math.max(0, Math.min(b.researchMs, 24 * 60 * 60 * 1000))
        : null,
    recordingComplete: b.recordingComplete === true,
  };

  try {
    const feedback = await analyzePresentation(input);
    return NextResponse.json(feedback);
  } catch (error) {
    // The message is logged, not returned: provider errors can carry
    // configuration detail that has no business reaching a browser.
    console.error("[analyze] provider failed", error);
    return NextResponse.json(
      { error: "Analysis failed. See server logs." },
      { status: 502 },
    );
  }
}
