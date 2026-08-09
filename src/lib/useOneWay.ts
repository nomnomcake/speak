"use client";

import * as React from "react";

/**
 * Make a stage one-way while it is running.
 *
 * user-flow.md is explicit: "Transitions from `lockout` onward are one-way.
 * There is no path back to `researching`, in the UI or the state machine." The
 * UI half was true — nothing links back — but the browser half was not, and a
 * lockout you can leave with the Back button is not a lockout. The notes are
 * one keypress away, and the session stops measuring anything.
 *
 * Two defences, because they cover different exits:
 *
 * 1. A sentinel history entry. Going Back pops it, and the handler immediately
 *    pushes it again, so the user stays put. This is the standard technique
 *    and its standard limitation applies: it holds the user on the page, it
 *    does not disable the button.
 * 2. `beforeunload`, which covers reload and tab close with the browser's own
 *    "leave site?" prompt.
 *
 * What it deliberately does not do is pretend to block a typed URL. Nothing
 * client-side can, and building something that looks like it does would be
 * worse than documenting the gap.
 */
export function useOneWay(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;

    // The sentinel. Popping it is what Back does; re-pushing puts it back.
    window.history.pushState({ speakLock: true }, "");

    const onPopState = () => {
      window.history.pushState({ speakLock: true }, "");
    };

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Any assigned value triggers the browser's own confirmation. The text
      // is ignored by every modern browser, which is why none is written here.
      e.preventDefault();
      e.returnValue = "";
    };

    /**
     * The tab strip is still on screen during the talk.
     *
     * `popstate` and `beforeunload` between them cover Back, reload and close —
     * but not a client-side `<Link>`, which is what the browser chrome above
     * the session is made of. One click on "Dashboard" mid-recording abandoned
     * the session with no warning and no way back to it.
     *
     * Captured at the document, before the router's own handler, so the
     * navigation never starts. Asking first is what user-flow.md requires:
     * "Leaving mid-session abandons it. Confirm first, then discard."
     */
    const onClickCapture = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.origin !== window.location.origin) return;
      if (anchor.hasAttribute("download")) return;

      const confirmed = window.confirm(
        "Leave now and this session is abandoned — the recording and the report are lost. Leave anyway?",
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [active]);
}
