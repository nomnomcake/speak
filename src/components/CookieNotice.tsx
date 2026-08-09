"use client";

import * as React from "react";
import { Button, Panel } from "@/components/ui";
import { useConsent, writeConsent } from "@/lib/consent";
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
 * The copy is specific on purpose. "We use cookies to improve your experience"
 * is the sentence that made these banners meaningless; it says nothing, so it
 * cannot be wrong. This one names what is stored, where it goes, and what
 * declining costs, because all three are short enough to say:
 *
 *  - one cookie, holding the answer to this question
 *  - session history in local storage, which Decline turns off
 *  - the research timer, which is what lets that phase survive a closed tab
 *    and is not optional to the feature
 *  - a recording, but only one you explicitly chose to keep
 *
 * That last line arrived with replay and had to. Recordings used to die with
 * the tab, so a notice that never mentioned them was complete; now they can be
 * kept, and a privacy notice which omits the heaviest thing the product can
 * store would be the worst omission available to it. It still never leaves the
 * device, which is the sentence people actually care about.
 *
 * There is no third button and no preferences panel. Keeping a take is already
 * a per-take decision made at the take, which is a better place to ask than a
 * settings pane nobody opens.
 */
export function CookieNotice() {
  const consent = useConsent();
  // `unset` only — never `unknown`. On the server there is no cookie to read,
  // and rendering the notice for "I have not looked yet" put it in the static
  // HTML of every page, so anyone who had already answered saw it flash on
  // each navigation until hydration removed it.
  if (consent !== "unset") return null;

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
      >
        <div className="space-y-3">
          {/* Says "research timer" and not "notes". There is no notepad in
              this product — the research screen tells you to take notes on
              paper, by hand — and a privacy notice listing a thing the app
              does not store is the same failure as one hiding a thing it does.
              Caught by playing the product rather than by reading it. */}
          <p className="text-sm leading-relaxed text-graphite">
            Speak keeps everything on this device. One cookie remembers your
            answer to this. Your research timer is stored locally so closing the
            tab does not cost you the session.
          </p>

          <p className="text-sm leading-relaxed text-graphite">
            Session history — which topics you have done, and your scores — is
            also stored locally, and that part is optional. Recordings are
            deleted when you close the tab unless you press Keep on one.
          </p>

          {/* The one claim worth making loudly, and the only one users of this
              product are likely to actually care about. */}
          <p className="type-hud leading-relaxed text-slate">
            No analytics, no tracking, no third parties. Your recording never
            leaves this device.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={() => writeConsent("granted")}>
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
              }}
            >
              Don&rsquo;t keep it
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
