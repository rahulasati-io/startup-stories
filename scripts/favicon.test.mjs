import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFile(new URL(path,root));

test('favicon artwork is reproduced from the approved source without cropping or font substitution',async()=>{
  const source=await read('assets/brand/misterstory-mark-source.png');
  const expected=await sharp(source).resize(512,512,{fit:'contain',background:'#000000'}).flatten({background:'#000000'}).png({compressionLevel:9,palette:true,colours:16,dither:0}).toBuffer();
  const actual=await read('app/icon.png');
  assert.deepEqual(actual,expected);
});

test('PNG icons and the legacy SVG mark all share the same approved artwork',async()=>{
  const icon=await read('app/icon.png');
  const brand=await read('public/brand/misterstory-mark.png');
  assert.deepEqual(icon,brand);
  const metadata=await sharp(icon).metadata();
  assert.equal(metadata.width,512);
  assert.equal(metadata.height,512);
  assert.equal(metadata.hasAlpha,false);
  const apple=await sharp(await read('app/apple-icon.png')).metadata();
  assert.equal(apple.width,180);
  assert.equal(apple.height,180);
  const svg=(await read('public/brand/misterstory-mark.svg')).toString();
  const embedded=svg.match(/base64,([^\"]+)/)?.[1];
  assert.ok(embedded);
  assert.deepEqual(Buffer.from(embedded,'base64'),icon);
});

test('ICO contains valid small and large frames with correct directory offsets',async()=>{
  const ico=await read('app/favicon.ico');
  assert.equal(ico.readUInt16LE(0),0);
  assert.equal(ico.readUInt16LE(2),1);
  const sizes=[48,16,32,96,192,256];
  assert.equal(ico.readUInt16LE(4),sizes.length);
  let offset=6+16*sizes.length;
  for(let i=0;i<sizes.length;i++){
    const entry=6+16*i;
    const size=ico[entry]||256;
    assert.equal(size,sizes[i]);
    assert.equal(ico[entry+1]||256,size);
    assert.equal(ico.readUInt32LE(entry+12),offset);
    const length=ico.readUInt32LE(entry+8);
    assert.ok(offset+length<=ico.length);
    const frame=await sharp(ico.subarray(offset,offset+length)).metadata();
    assert.equal(frame.width,size);
    assert.equal(frame.height,size);
    assert.equal(frame.channels,4);
    assert.equal(frame.isPalette,false);
    offset+=length;
  }
  assert.equal(offset,ico.length);
});

test('publisher logo keeps its stable icon URL and full wordmark stays intact',async()=>{
  assert.match((await read('lib/structured-data.ts')).toString(),/absoluteUrl\("\/icon\.png"\)/);
  const logo=(await read('public/brand/misterstory-logo.svg')).toString();
  assert.match(logo,/>MisterStory<\/text>/);
  assert.match((await read('components/SiteLogo.tsx')).toString(),/\/brand\/misterstory-logo\.svg/);
});
