"use client";

import {Button, Card, Flex, Stack, Text} from "@sanity/ui";
import {type BlockProps, useFormValue, useSyncState} from "sanity";

// Keep Sanity's native preview/modal, adding controls to its modal children.
export function ArticleImageBlock(props: BlockProps) {
  return props.renderDefault({...props, children: <Stack space={4}>
    {props.children}
    {props.open && <ImageDone value={props.value} onClose={props.onClose} />}
  </Stack>});
}

function ImageDone({value, onClose}: Pick<BlockProps, "value" | "onClose">) {
  const rawId = useFormValue(["_id"]);
  const rawType = useFormValue(["_type"]);
  const id = typeof rawId === "string" ? rawId.replace(/^drafts\./, "") : "";
  const type = typeof rawType === "string" ? rawType : "post";
  const sync = useSyncState(id, type);
  const image = value as {asset?: {_ref?: string}; _upload?: unknown};
  const asset = image.asset;
  const uploading = Boolean(image._upload);
  const saving = sync.isSyncing;
  const ready = Boolean(asset?._ref) && !uploading && !saving;

  return <Card borderTop padding={3} style={{position: "sticky", bottom: 0, zIndex: 1}}>
      <Flex align="center" gap={3} justify="space-between">
        <Text muted size={1}>{uploading ? "Uploading image…" : saving ? "Saving changes…" : asset?._ref ? "Saved to draft. Publish or Update live to show it on the website." : "Upload or select an image first."}</Text>
        <Button text="Done" tone="primary" disabled={!ready} onClick={() => {if (ready) onClose();}} />
      </Flex>
    </Card>;
}
