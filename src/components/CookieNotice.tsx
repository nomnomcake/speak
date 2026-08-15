"use client";

import * as React from "react";
import { Button, Panel, PixelCookie, Sparkle } from "@/components/ui";
import { closeNotice, useConsent, useNoticeOpen, writeConsent } from "@/lib/consent";
import { clearAttempts } from "@/lib/attempts";
import { clearTakes } from "@/lib/recordings";

/**
 * The storage notice.
 *
 * Styled as a system dialog sitting on the desktop rather than the strip of
 * grey that every other site puts at the foot of the page — this product is a
 * fake operating system, and the one moment it has to interrupt you is exactly
 * where a real one would open a window.
 *
 * Two sentences, and they are the two that change what somebody would decide:
 * where the data goes, and what declining costs. "We use cookies to improve
 * your experience" is the sentence that made these banners meaningless — it
 * says nothing, so it cannot be wrong. Short is a different thing from vague,
 * and the test for a cut is whether it would change an answer.
 *
 * Deliberately not said here, because each is said where it actually matters:
 * that the research timer is what lets that phase survive a closed tab, and
 * that a recording dies with the tab unless Keep is pressed. The first belongs
 * on the research screen, the second is written on the Keep button itself.
 * Neither changes whether someone wants history stored.
 *
 * There is no third button and no preferences panel. Keeping a take is already
 * a per-take decision made at the take, which is a better place to ask than a
 * settings pane nobody opens.
 */
export function CookieNotice() {
  const consent = useConsent();
  const summoned = useNoticeOpen();
  // `unset` only — never `unknown`. On the server there is no cookie to read,
  // and rendering the notice for "I have not looked yet" put it in the static
  // HTML of every page, so anyone who had already answered saw it flash on
  // each navigation until hydration removed it.
  if (consent !== "unset" && !summoned) return null;

  return (
    /**
     * Not a modal. It takes no focus trap and blocks nothing.
     *
     * The session flow is timed and one-way from the lockout onward, so a
     * dialog that had to be dismissed could land in the middle of someone's
     * fifteen minutes, or over the count-in. It waits instead — and `write()`
     * treats "unset" as permission, so a take made before answering is kept
     * and a later Decline deletes it.
     */
    <div
      role="region"
      aria-label="Storage notice"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
    >
      <Panel
        chrome="window"
        title="Storage"
        notch={6}
        shadow={6}
        sprig={false}
        className="pointer-events-auto w-full max-w-md"
        actions={<Sparkle size={9} fill="currentColor" className="text-mint-deep" />}
      >
        <div className="space-y-3">
          {/* A biscuit, because this is the cookie dialog and the product is a
              toy operating system. It is the one place a literal joke is
              cheaper than a paragraph — it says what the window is about
              before the first sentence is read. */}
          <div className="flex items-center gap-3">
            <PixelCookie unit={4} />
            <p className="type-caps text-graphite">One cookie, and it is yours</p>
          </div>

          {/* Two lines, and they are the two that change what a person would
              decide: where their data goes, and what saying no costs them.
              Short is not the same as vague — nothing here is softened, the
              detail is just gone. What went: that the research timer is what
              survives a closed tab, and that recordings die with the tab
              unless kept. Both are still true and both are said at the moment
              they matter, on the research screen and on the Keep button. */}
          <p className="text-sm leading-relaxed text-graphite">
            Everything stays on this device. No analytics, no tracking, nothing
            sent anywhere.
          </p>

          <p className="text-sm leading-relaxed text-graphite">
            Your session history is optional, and recordings are only kept if
            you ask for them.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => {
                writeConsent("granted");
                closeNotice();
              }}
            >
              Keep my history
            </Button>
            {/* Clears as well as refuses. Consent that cannot be withdrawn is
                not consent, and anything saved before this was answered is
                exactly what a Decline is about. */}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                writeConsent("denied");
                clearAttempts();
                void clearTakes();
                closeNotice();
              }}
            >
              Don&rsquo;t keep it
            </Button>

            {/* Only when summoned from the dashboard. Answering is what closes
                it the first time; there is no dismiss, because a notice you
                can wave away without answering is one nobody answers. */}
            {summoned && (
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto"
                onClick={closeNotice}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
