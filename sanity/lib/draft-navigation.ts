export type DraftChoice = "keep" | "discard" | "publish";
export type GuardOperationEvent = {type: string; op: string; error?: Error};
export type GuardDocument = {
  id: string;
  type: string;
  title: string;
  dirty: boolean;
  syncing: boolean;
  ready: boolean;
  publishBlocked: string | null;
  discardBlocked: string | null;
  operationEvent?: GuardOperationEvent;
  publish: () => void;
  discard: () => void;
};
type PendingNavigation = {
  ids: string[];
  resume: () => void;
  busy: "publish" | "discard" | null;
  initialEvent?: GuardOperationEvent;
  succeeded: boolean;
  error: string | null;
};

// View/field/inspector changes within the same document are not departures.
export function studioDocumentPath(path: string) {
  return path.split(/[?#]/)[0].split("/").map(segment => {
    try { segment = decodeURIComponent(segment); } catch { /* Keep malformed paths distinct. */ }
    return segment.split(";").map(pane => pane.split(",")[0]).join(";");
  }).join("/");
}

/** Studio-local coordinator. Never publishes, discards or cleans up on unmount. */
export class DraftNavigationController {
  private entries = new Map<string, GuardDocument>();
  private listeners = new Set<() => void>();
  private revision = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  pending: PendingNavigation | null = null;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.revision;
  getServerSnapshot = () => 0;
  private emit() { this.revision++; for (const listener of this.listeners) listener(); }
  get documents() {
    return [...new Map([...this.entries.values()].map(entry => [entry.id, entry])).values()];
  }
  get hasDrafts() { return this.documents.some(entry => entry.dirty || entry.syncing); }
  get current() { return this.documents.find(entry => entry.id === this.pending?.ids[0]); }
  update(key: string, entry: GuardDocument) {
    const previous = this.entries.get(key);
    this.entries.set(key, entry);
    const changed = !previous || ["id", "type", "title", "dirty", "syncing", "ready", "publishBlocked", "discardBlocked", "operationEvent"].some(field => previous[field as keyof GuardDocument] !== entry[field as keyof GuardDocument]);
    this.checkOperation();
    if (changed) this.emit();
  }
  unregister(key: string) { if (this.entries.delete(key)) this.emit(); }
  request(resume: () => void) {
    if (this.pending) return;
    const ids = this.documents.filter(entry => entry.dirty || entry.syncing).map(entry => entry.id);
    if (!ids.length) { resume(); return; }
    this.pending = {ids, resume, busy: null, succeeded: false, error: null};
    this.emit();
  }
  cancel() {
    if (this.pending?.busy) return;
    this.clearTimer(); this.pending = null; this.emit();
  }
  choose(choice: DraftChoice) {
    const pending = this.pending, entry = this.current;
    if (!pending || pending.busy || !entry || !entry.ready || entry.syncing) return;
    if (choice === "keep") {
      if (entry.type !== "post") return;
      this.next(); return;
    }
    if (choice === "publish" && (entry.type === "post" || entry.publishBlocked)) return;
    if (choice === "discard" && entry.discardBlocked) return;
    pending.busy = choice; pending.initialEvent = entry.operationEvent;
    pending.succeeded = false; pending.error = null;
    this.timer = setTimeout(() => this.fail("The operation has not finished. Stay here and check the document before trying again; it may still complete when the connection returns."), 30000);
    this.emit();
    try { if (choice === "publish") entry.publish(); else entry.discard(); }
    catch (error) { this.fail(error instanceof Error ? error.message : "The operation failed. Your navigation has been cancelled."); }
  }
  private checkOperation() {
    const pending = this.pending, entry = this.current;
    if (!pending?.busy || !entry) return;
    const event = entry.operationEvent;
    const expected = pending.busy === "discard" ? "discardChanges" : "publish";
    if (event && event !== pending.initialEvent && event.op === expected) {
      if (event.type === "error") { this.fail(event.error?.message || "The operation failed. Please stay here and try again."); return; }
      if (event.type === "success") pending.succeeded = true;
    }
    // Operation success alone is not enough: the document listener must also
    // confirm the draft is gone and all buffered mutations have settled.
    if (pending.succeeded && !entry.dirty && !entry.syncing) this.next();
  }
  private fail(message: string) {
    if (!this.pending) return;
    this.clearTimer(); this.pending.busy = null; this.pending.error = message; this.emit();
  }
  private clearTimer() { if (this.timer) clearTimeout(this.timer); this.timer = undefined; }
  private next() {
    if (!this.pending) return;
    this.clearTimer(); this.pending.ids.shift(); this.pending.busy = null; this.pending.error = null;
    if (this.pending.ids.length) { this.emit(); return; }
    const resume = this.pending.resume;
    this.pending = null; this.emit(); resume();
  }
  dispose() { this.clearTimer(); this.pending = null; this.entries.clear(); this.listeners.clear(); }
}

type GuardLocation = {pathname: string; search?: string; hash?: string};
export type GuardHistory = {
  location: GuardLocation;
  listen: (callback: () => void) => () => void;
  block: (callback: (transition: {location: GuardLocation; retry: () => void}) => void) => () => void;
};

// Use Sanity's actual history blocker, including Back/Forward. No global
// pushState monkey-patch, fabricated history entries or popstate reversal.
export function blockStudioNavigation(history: GuardHistory, guard: DraftNavigationController) {
  let disposed = false;
  let unblock: () => void;
  let stopWaiting: (() => void) | undefined;
  const install = () => {
    unblock = history.block(transition => {
      const resume = () => {
        unblock();
        // A Back/Forward retry is asynchronous. Re-blocking immediately would
        // intercept our own retry and ask for the same decision forever.
        stopWaiting = history.listen(() => {
          stopWaiting?.(); stopWaiting = undefined;
          if (!disposed) install();
        });
        transition.retry();
      };
      if (studioDocumentPath(history.location.pathname) === studioDocumentPath(transition.location.pathname)) resume();
      else guard.request(resume);
    });
  };
  install();
  return () => { disposed = true; unblock(); stopWaiting?.(); };
}
