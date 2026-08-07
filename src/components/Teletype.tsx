"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Teletype — reveals text a character at a time, with a block cursor.
 *
 * Makes the prompt feel transmitted rather than rendered. The full string is
 * exposed to assistive tech via aria-label while the animated copy is hidden,
 * so a screen reader gets the sentence at once instead of one letter at a time.
 *
 * Server and first client render both show nothing, so there is no hydration
 * mismatch; the effect fills it in afterwards. Clicking skips to the end —
 * nobody should be held hostage by a typing animation they have already read.
 */

export function Teletype({
  text,
  /** Milliseconds per character. */
  speed = 16,
  className,
}: {
  text: string;
  speed?: number;
  className?: string;
}) {
  const [count, setCount] = React.useState(0);

  // Restart when the text changes. Adjusted during render rather than in an
  // effect: React supports this for resetting state on a prop change, and it
  // avoids the extra render pass an effect would cost.
  const [renderedText, setRenderedText] = React.useState(text);
  if (text !== renderedText) {
    setRenderedText(text);
    setCount(0);
  }

  const done = count >= text.length;

  React.useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      const t = setTimeout(() => setCount(text.length), 0);
      return () => clearTimeout(t);
    }

    if (count >= text.length) return;
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
  }, [count, text, speed]);

  return (
    <p
      aria-label={text}
      onClick={() => setCount(text.length)}
      className={cn("cursor-default", className)}
    >
      <span aria-hidden>
        {text.slice(0, count)}
        {!done && (
          <span className="animate-blink ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.12em] bg-ink" />
        )}
      </span>
    </p>
  );
}
