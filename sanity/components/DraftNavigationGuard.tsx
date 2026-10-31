"use client";

import {createContext, useContext, useEffect, useId, useLayoutEffect, useMemo, useSyncExternalStore} from "react";
import {Box, Button, Card, Dialog, Flex, Stack, Text} from "@sanity/ui";
import {type DocumentLayoutProps, type LayoutProps, getPublishedId, useDocumentOperation, useDocumentOperationEvent, useDocumentPairPermissions, useEditState, usePerspective, useSyncState, useValidationStatus} from "sanity";
import {RouterHistoryContext} from "sanity/_singletons";
import {blockStudioNavigation, DraftNavigationController, type GuardHistory} from "../lib/draft-navigation";

const GuardContext = createContext<DraftNavigationController | null>(null);

export function DraftGuardDialog({guard}: {guard: DraftNavigationController}) {
  const entry = guard.current, pending = guard.pending;
  if (!pending) return null;
  const busy = Boolean(pending.busy);
  const waiting = !entry?.ready || entry.syncing;
  const article = entry?.type === "post";
  return <Dialog id="draft-navigation-guard" header="Resolve unpublished changes" width={1} onClose={busy ? undefined : () => guard.cancel()}>
    <Box padding={4}><Stack space={4}>
      <Text weight="semibold">{entry?.title || "Document"}</Text>
      <Text size={1}>{article ? "Keep this article as a draft, or discard its unpublished changes before leaving." : "Publish this document, or discard its unpublished changes before leaving. It will not be published automatically."}</Text>
      <Text muted size={1}>Discard removes the draft, not the published version. For a new, never-published document, it removes the new draft.</Text>
      {pending.ids.length > 1 && <Text muted size={1}>{pending.ids.length} open documents still need a decision.</Text>}
      {waiting && <Text size={1}>Waiting for autosave to finish. Changes are kept safe until it completes.</Text>}
      {pending.error && <Card padding={3} tone="critical" radius={2}><Text size={1} role="alert">{pending.error}</Text></Card>}
      {!article && entry?.publishBlocked && <Text muted size={1}>{entry.publishBlocked}</Text>}
      {entry?.discardBlocked && <Text muted size={1}>{entry.discardBlocked}</Text>}
      <Flex gap={2} wrap="wrap">
        <Button text="Stay here" mode="ghost" disabled={busy} onClick={() => guard.cancel()} />
        <Button text={pending.busy === "discard" ? "Discarding…" : "Discard changes"} tone="critical" mode="ghost" disabled={busy || waiting || Boolean(entry?.discardBlocked)} onClick={() => guard.choose("discard")} />
        {article
          ? <Button text="Keep draft and leave" tone="primary" disabled={busy || waiting} onClick={() => guard.choose("keep")} />
          : <Button text={pending.busy === "publish" ? "Publishing…" : "Publish and leave"} tone="primary" disabled={busy || waiting || Boolean(entry?.publishBlocked)} onClick={() => guard.choose("publish")} />}
      </Flex>
    </Stack></Box>
  </Dialog>;
}

export function StudioDraftGuardLayout(props: LayoutProps) {
  const history = useContext(RouterHistoryContext);
  const guard = useMemo(() => new DraftNavigationController(), []);
  useEffect(() => () => guard.dispose(), [guard]);
  useSyncExternalStore(guard.subscribe, guard.getSnapshot, guard.getServerSnapshot);
  const active = guard.hasDrafts || Boolean(guard.pending);
  const supported = Boolean(history && "block" in history && typeof history.block === "function");
  useEffect(() => {
    if (!active || !supported) return;
    return blockStudioNavigation(history as GuardHistory, guard);
  }, [active, supported, history, guard]);
  // Modern browsers only allow a generic refresh/close warning. Never perform
  // asynchronous publish/discard in pagehide or an unmount cleanup.
  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [active]);
  return <GuardContext.Provider value={guard}>
    {active && !supported && <Card padding={3} tone="critical"><Text size={1}>This Studio history does not support the navigation guard. Publish or discard changes before leaving.</Text></Card>}
    {props.renderDefault(props)}
    <DraftGuardDialog guard={guard} />
  </GuardContext.Provider>;
}

// These extension points are supplied by the installed Sanity Studio.
// Keep the history and document-layout integration covered on Sanity upgrades.
export function GuardedDocumentLayout(props: DocumentLayoutProps) {
  const guard = useContext(GuardContext);
  const key = useId();
  const id = getPublishedId(props.documentId);
  const state = useEditState(id, props.documentType);
  const sync = useSyncState(id, props.documentType);
  const operations = useDocumentOperation(id, props.documentType);
  const operationEvent = useDocumentOperationEvent(id, props.documentType);
  const validation = useValidationStatus(id, props.documentType, true);
  const perspective = usePerspective();
  const [publishPermission, checkingPublish] = useDocumentPairPermissions({id, type: props.documentType, permission: "publish"});
  const [discardPermission, checkingDiscard] = useDocumentPairPermissions({id, type: props.documentType, permission: "discardDraft"});
  const release = props.documentId.startsWith("versions.") || Boolean(state.version) || Boolean(perspective.selectedPerspectiveName && perspective.selectedPerspectiveName !== "published");
  const publishBlocked = release ? "Resolve release versions using the release controls; this guard only operates on normal drafts."
    : checkingPublish ? "Checking publish permission…"
    : !publishPermission?.granted ? "You do not have permission to publish this document."
    : validation.isValidating ? "Waiting for validation…"
    : validation.validation.some(marker => marker.level === "error") ? "Resolve validation errors before publishing. Choose Stay here to edit."
    : operations.publish.disabled ? "Publishing is currently unavailable. Choose Stay here to check the document."
    : null;
  const discardBlocked = release ? "Release versions must be resolved using the release controls."
    : checkingDiscard ? "Checking discard permission…"
    : !discardPermission?.granted ? "You do not have permission to discard this draft."
    : operations.discardChanges.disabled ? "Discard is currently unavailable. Choose Stay here to check the document."
    : null;
  useLayoutEffect(() => {
    guard?.update(key, {
      id, type: props.documentType,
      title: String(state.draft?.title || state.draft?.name || state.published?.title || state.published?.name || props.documentType),
      dirty: Boolean(state.draft), syncing: sync.isSyncing || Boolean(state.transactionSyncLock?.enabled), ready: state.ready,
      publishBlocked, discardBlocked, operationEvent,
      publish: () => operations.publish.execute(),
      // Sanity's native discard operation flushes buffered edits and waits for
      // consistency, then discards only the draft (including new-only drafts).
      discard: () => operations.discardChanges.execute(),
    });
  });
  useLayoutEffect(() => () => guard?.unregister(key), [guard, key]);
  return props.renderDefault(props);
}
