import type {BrowserHistory, Blocker, To} from "history";
import {studioDocumentPath} from "./draft-navigation";

/** A Studio-local history adapter. Never patches window.history. */
export function createStudioHistory(base: BrowserHistory) {
  const guards = new Set<{blocker: Blocker; unblock: () => void}>();
  const navigate = (method: "push" | "replace", to: To, state?: unknown) => {
    const pathname = typeof to === "string" ? new URL(to, "https://studio.invalid" + base.location.pathname).pathname : to.pathname || base.location.pathname;
    if (studioDocumentPath(pathname) !== studioDocumentPath(base.location.pathname)) {
      base[method](to, state);
      return;
    }
    // Field focus and image dialogs update the URL inside the same document.
    // Pass these through ONCE, without blocking/retrying Sanity's navigation.
    const suspended = [...guards];
    suspended.forEach(entry => entry.unblock());
    try { base[method](to, state); }
    finally { suspended.forEach(entry => { if (guards.has(entry)) entry.unblock = base.block(entry.blocker); }); }
  };
  return {
    get action() { return base.action; },
    get location() { return base.location; },
    createHref: base.createHref,
    push: (to: To, state?: unknown) => navigate("push", to, state),
    replace: (to: To, state?: unknown) => navigate("replace", to, state),
    go: base.go,
    back: base.back,
    forward: base.forward,
    block: base.block,
    blockDocumentNavigation: (blocker: Blocker) => {
      const entry = {blocker, unblock: base.block(blocker)};
      guards.add(entry);
      return () => { guards.delete(entry); entry.unblock(); };
    },
    listen: base.listen,
  };
}
