import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Keep the approved artwork in the repository so all icon formats can be rebuilt.
const sourcePath = path.join(projectRoot, "assets", "brand", "misterstory-mark-source.png");
const outputPath = path.join(projectRoot, "app", "favicon.ico");
const sizes = [48, 16, 32, 96, 192, 256];

const mark = await sharp(sourcePath)
  .resize(512, 512, { fit: "contain", background: "#000000" })
  .flatten({ background: "#000000" })
  .png({ compressionLevel: 9, palette: true, colours: 16, dither: 0 })
  .toBuffer();

await fs.writeFile(path.join(projectRoot, "app", "icon.png"), mark);
await fs.writeFile(path.join(projectRoot, "public", "brand", "misterstory-mark.png"), mark);
await sharp(mark)
  .resize(180, 180)
  .png({ compressionLevel: 9 })
  .toFile(path.join(projectRoot, "app", "apple-icon.png"));

// Preserve the existing public SVG URL without substituting a different font.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-labelledby="title description">
  <title id="title">MisterStory mark</title>
  <desc id="description">White rounded Mr. lettering on a black square.</desc>
  <image width="512" height="512" href="data:image/png;base64,${mark.toString("base64")}"/>
</svg>\n`;
await fs.writeFile(path.join(projectRoot, "public", "brand", "misterstory-mark.svg"), svg);

const pngImages = await Promise.all(
  sizes.map((size) =>
    sharp(mark)
      .resize(size, size, { fit: "cover" })
      // Next's ICO decoder requires each embedded PNG to use RGBA, not indexed RGB.
      .ensureAlpha()
      .png({ compressionLevel: 9, palette: false })
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
