import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {renderToStaticMarkup} from 'react-dom/server';
import React from 'react';
const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../components/ArticleBodyImage.tsx',import.meta.url),'utf8');
const compiled={exports:{}};
const urls=[];
const mocks={
  'next/image':{__esModule:true,default:props=>React.createElement('img',props)},
  '@/sanity/lib/image':{urlFor:value=>{const options={value};urls.push(options);const builder={width:n=>{options.width=n;return builder;},auto:()=>builder,url:()=>`https://cdn.sanity.io/test?w=${options.width}`};return builder;}},
};
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>mocks[id]??require(id),compiled,compiled.exports);
const Image=compiled.exports.default;
test('body images render with alt text and bounded responsive dimensions',()=>{
  const value={asset:{_ref:'image-test-2400x1600-jpg'},alt:'Business chart'};
  const html=renderToStaticMarkup(React.createElement(Image,{value}));
  assert.match(html,/alt="Business chart"/);assert.match(html,/width="1200"/);assert.match(html,/height="800"/);assert.match(html,/sizes=/);
  assert.equal(urls.at(-1).value,value);
});
test('crop dimensions are respected without changing the original image',()=>{
  const value={asset:{_ref:'image-test-800x600-png'},crop:{top:0.25,bottom:0.25}};
  const html=renderToStaticMarkup(React.createElement(Image,{value}));
  assert.match(html,/width="800"/);assert.match(html,/height="300"/);assert.match(html,/alt=""/);
});
test('empty or invalid image blocks do not break an article',()=>{
  for(const value of [{},{asset:{}},{asset:{_ref:'invalid'}}])assert.equal(renderToStaticMarkup(React.createElement(Image,{value})), '');
});
test('article Portable Text registers image rendering alongside tables',()=>{
  const page=fs.readFileSync(new URL('../app/articles/[slug]/page.tsx',import.meta.url),'utf8');
  assert.match(page,/image: ArticleBodyImage/);assert.match(page,/articleTable:/);
});
