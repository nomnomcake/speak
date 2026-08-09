import { NextResponse, type NextRequest } from "next/server";

/**
 * Route gate for the design system.
 *
 * `proxy.ts`, not `middleware.ts`: Next 16 renamed the convention and warns on
 * the old name. Same functionality, per the migration note in the docs.
 *
 * A proxy rather than a check inside the page, because a page-level gate is at
 * the mercy of how the page happens to be rendered. The first attempt put the
 * check in the component and Next prerendered the route at build time, baking
 * in the answer and shipping the real page to production; forcing the page
 * dynamic still left the surrounding tab strip prerendered from whatever the
 * environment looked like during the build.
 *
 * This runs on every request before routing, so there is exactly one answer
 * and it is computed at the moment someone asks. The page keeps its own check
 * as defence in depth — if this file is deleted or its matcher edited, the
 * page still refuses to render.
 *
 * The design system is a workbench: unfinished states, components out of
 * context, decisions not yet made. It belongs to whoever is building the
 * thing, and nobody else.
 */

export function proxy(request: NextRequest) {
  if (process.env.SPEAK_SHOW_DESIGN_SYSTEM === "1") {
    return NextResponse.next();
  }

  // A rewrite to the 404, not a redirect. A redirect would announce that
  // something is being hidden; this is indistinguishable from the route never
  // having existed, which is the point.
  return NextResponse.rewrite(new URL("/_not-found", request.url), {
    status: 404,
  });
}

export const config = {
  matcher: ["/design-system/:path*"],
};
