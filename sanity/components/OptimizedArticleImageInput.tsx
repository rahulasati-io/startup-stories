"use client";

import {Box, Button, Card, Flex, Select, Spinner, Stack, Text} from "@sanity/ui";
import {useRef, useState} from "react";
import {set, useClient, type ObjectInputProps} from "sanity";
import {apiVersion} from "../env";

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 675;
const JPEG_QUALITY = 0.84;

type CropFocus = "start" | "center" | "end";

function focusOffset(availableSpace: number, focus: CropFocus) {
  if (focus === "start") return 0;
  if (focus === "end") return availableSpace;
  return availableSpace / 2;
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const source = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(source);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(source);
      reject(new Error("The selected image could not be opened."));
    };
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("The optimized image could not be created.")),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

function optimizedFilename(originalName: string) {
  const basename = originalName.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-");
  return `${basename || "article-image"}-${OUTPUT_WIDTH}x${OUTPUT_HEIGHT}.jpg`;
}

export default function OptimizedArticleImageInput(props: ObjectInputProps) {
  const client = useClient({apiVersion});
  const fileInput = useRef<HTMLInputElement>(null);
  const [horizontalFocus, setHorizontalFocus] = useState<CropFocus>("center");
  const [verticalFocus, setVerticalFocus] = useState<CropFocus>("center");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  async function optimizeAndUpload(file: File) {
    setProcessing(true);
    setMessage(undefined);
    setError(undefined);

    try {
      if (!file.type.startsWith("image/")) throw new Error("Choose a JPG, PNG or WebP image.");

      const image = await loadImage(file);
      const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;
      const sourceRatio = image.naturalWidth / image.naturalHeight;
      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = image.naturalWidth;
      let sourceHeight = image.naturalHeight;

      if (sourceRatio > targetRatio) {
        sourceWidth = image.naturalHeight * targetRatio;
        sourceX = focusOffset(image.naturalWidth - sourceWidth, horizontalFocus);
      } else if (sourceRatio < targetRatio) {
        sourceHeight = image.naturalWidth / targetRatio;
        sourceY = focusOffset(image.naturalHeight - sourceHeight, verticalFocus);
      }

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare the image editor.");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
      context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);

      const optimizedBlob = await canvasToBlob(canvas);
      const asset = await client.assets.upload("image", optimizedBlob, {
        contentType: "image/jpeg",
        filename: optimizedFilename(file.name),
      });

      const currentValue = props.value && typeof props.value === "object"
        ? props.value as Record<string, unknown>
        : undefined;
      const alt = currentValue && typeof currentValue.alt === "string" ? currentValue.alt : undefined;

      props.onChange(set({
        _type: "image",
        asset: {_type: "reference", _ref: asset._id},
        ...(alt ? {alt} : {}),
      }));

      const originalKb = Math.max(1, Math.round(file.size / 1024));
      const optimizedKb = Math.max(1, Math.round(optimizedBlob.size / 1024));
      setMessage(`Ready: ${OUTPUT_WIDTH}×${OUTPUT_HEIGHT}, ${optimizedKb} KB (original ${originalKb} KB).`);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "The image could not be optimized.");
    } finally {
      setProcessing(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <Stack space={3}>
      <Card border radius={2} padding={3} tone="primary">
        <Stack space={3}>
          <Box>
            <Text size={1} weight="semibold">Crop and compress for MisterStory</Text>
            <Box marginTop={2}>
              <Text muted size={1}>Creates a 1200×675 JPG for article cards and social sharing. The original file is not uploaded.</Text>
            </Box>
          </Box>

          <Flex gap={2} wrap="wrap">
            <Box flex={1} style={{minWidth: 150}}>
              <Text muted size={1}>Horizontal focus</Text>
              <Box marginTop={2}>
                <Select fontSize={1} value={horizontalFocus} onChange={(event) => setHorizontalFocus(event.currentTarget.value as CropFocus)}>
                  <option value="start">Left</option>
                  <option value="center">Centre</option>
                  <option value="end">Right</option>
                </Select>
              </Box>
            </Box>
            <Box flex={1} style={{minWidth: 150}}>
              <Text muted size={1}>Vertical focus</Text>
              <Box marginTop={2}>
                <Select fontSize={1} value={verticalFocus} onChange={(event) => setVerticalFocus(event.currentTarget.value as CropFocus)}>
                  <option value="start">Top</option>
                  <option value="center">Centre</option>
                  <option value="end">Bottom</option>
                </Select>
              </Box>
            </Box>
          </Flex>

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void optimizeAndUpload(file);
            }}
          />
          <Flex align="center" gap={3} wrap="wrap">
            <Button
              disabled={processing || props.readOnly}
              fontSize={1}
              mode="ghost"
              text={processing ? "Optimizing image…" : "Choose and optimize image"}
              onClick={() => fileInput.current?.click()}
            />
            {processing && <Spinner muted />}
            {message && <Text size={1}>{message}</Text>}
            {error && <Text size={1} style={{color: "var(--card-critical-fg-color)"}}>{error}</Text>}
          </Flex>
        </Stack>
      </Card>

      {props.renderDefault(props)}
    </Stack>
  );
}
