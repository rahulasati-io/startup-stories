import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(projectRoot, "app", "icon.png");
const outputPath = path.join(projectRoot, "app", "favicon.ico");
const sizes = [48, 16, 32, 96, 192];

const pngImages = await Promise.all(
  sizes.map((size) =>
    sharp(sourcePath)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9, palette: true })
      .toBuffer(),
  ),
);

const directorySize = 6 + sizes.length * 16;
let imageOffset = directorySize;
const icon = Buffer.alloc(directorySize + pngImages.reduce((sum, image) => sum + image.length, 0));

icon.writeUInt16LE(0, 0);
icon.writeUInt16LE(1, 2);
icon.writeUInt16LE(sizes.length, 4);

pngImages.forEach((image, index) => {
  const size = sizes[index];
  const entryOffset = 6 + index * 16;

  icon.writeUInt8(size === 256 ? 0 : size, entryOffset);
  icon.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
  icon.writeUInt8(0, entryOffset + 2);
  icon.writeUInt8(0, entryOffset + 3);
  icon.writeUInt16LE(1, entryOffset + 4);
  icon.writeUInt16LE(32, entryOffset + 6);
  icon.writeUInt32LE(image.length, entryOffset + 8);
  icon.writeUInt32LE(imageOffset, entryOffset + 12);
  image.copy(icon, imageOffset);
  imageOffset += image.length;
});

await fs.writeFile(outputPath, icon);
console.log(`Generated ${outputPath} with sizes: ${sizes.join(", ")}px`);
