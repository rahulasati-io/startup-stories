"use client";

import {Button, Card, Flex, Stack, Text} from "@sanity/ui";
import {type ObjectInputProps, useFormCallbacks, useFormValue, useSyncState} from "sanity";

// Extend only the native input. Never replace/wrap the block modal's child:
// Sanity needs that FormInput element intact to track the open image on edits.
export function ArticleImageInput(props: ObjectInputProps) {
  // Installed Sanity exposes these internal form callbacks. Use the same
  // parent-path close/focus operations as its native array-item editor;
  // regression tests cover this integration when upgrading Sanity.
  const {onPathOpen, onPathFocus} = useFormCallbacks();
  const rawId = useFormValue(["_id"]);
  const rawType = useFormValue(["_type"]);
  const id = typeof rawId === "string" ? rawId.replace(/^drafts\./, "") : "";
  const type = typeof rawType === "string" ? rawType : "post";
  const sync = useSyncState(id, type);
  const image = (props.value || {}) as {asset?: {_ref?: string}; _upload?: unknown};
  const asset = image.asset;
  const uploading = Boolean(image._upload);
  const saving = sync.isSyncing;
  const ready = Boolean(asset?._ref) && !uploading && !saving;

  return <Stack gap={4}>
    {props.renderDefault(props)}
    <Card borderTop padding={3} style={{position: "sticky", bottom: 0, zIndex: 1}}>
      <Flex align="center" gap={3} justify="space-between">
        <Text muted size={1}>{uploading ? "Uploading image…" : saving ? "Saving changes…" : asset?._ref ? "Saved to draft. Publish or Update live to show it on the website." : "Upload or select an image first."}</Text>
        <Button text="Done" tone="primary" disabled={!ready} onClick={() => {
          if (!ready) return;
          const parentPath = props.path.slice(0, -1);
          onPathOpen(parentPath);
          onPathFocus(parentPath);
        }} />
      </Flex>
    </Card>
  </Stack>;
}
