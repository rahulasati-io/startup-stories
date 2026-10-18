import {test} from "node:test";
import assert from "node:assert/strict";
import {buildLinkTargets, interlinkArticle} from "./lib/article-interlinks.mjs";
import {markdownToPortableText} from "./lib/markdown-to-portable-text.mjs";

const docs = [
  {_id:"a",_type:"company",name:"Zomato",slug:"zomato"},
  {_id:"b",_type:"company",name:"Blinkit",slug:"blinkit"},
  {_id:"c",_type:"company",name:"Swiggy",slug:"swiggy"},
  {_id:"d",_type:"company",name:"Zepto",slug:"zepto"},
  {_id:"e",_type:"founder",name:"Deepinder Goyal",slug:"deepinder-goyal"},
];
const catalog = buildLinkTargets(docs);
const parse = text => markdownToPortableText(text,"test",{tables:true});
const textOf = body => body.map(b => (b.children || []).map(c => c.text || "").join("")).join("\n");
test("maximum three unique links and identical wording", () => {
  const body = parse("Zomato and Deepinder Goyal discuss Blinkit, Swiggy and Zepto. Zomato again.");
  const result = interlinkArticle(body,catalog);
  assert.equal(result.added.length,3);
  assert.deepEqual(result.added.map(t=>t.name),["Zomato","Deepinder Goyal","Blinkit"]);
  assert.equal(textOf(result.body),textOf(body));
  assert.deepEqual(interlinkArticle(result.body,catalog).body,result.body);
  assert.equal(interlinkArticle(result.body,catalog).added.length,0);
});
test("one mention does not manufacture extra links or text",()=>{
  const body=parse("Zomato sells meals. Zomato is mentioned again.");
  const result=interlinkArticle(body,catalog);
  assert.equal(result.added.length,1);
  assert.equal(textOf(result.body),textOf(body));
  assert.equal(textOf(body),"Zomato sells meals. Zomato is mentioned again.");
});
test("existing relative internal links use the budget and prevent repeat targets",()=>{
  const body=parse("Zomato and Blinkit, Swiggy, Zepto.");
  body.unshift({_type:"block",_key:"old",style:"normal",markDefs:[{_type:"link",_key:"l",href:"/companies/zomato/?x=1#test"}],children:[{_type:"span",_key:"s",text:"Zomato",marks:["l"]}]});
  const result=interlinkArticle(body,catalog);
  assert.equal(result.existingInternalLinks,1);
  assert.deepEqual(result.added.map(t=>t.name),["Blinkit","Swiggy"]);
  assert.deepEqual(result.body[0],body[0]);
});
test("external links and formatting preserved, not nested",()=>{
  const body=parse("[Zomato](https://example.com) and **Deepinder Goyal** discuss Blinkit.");
  const result=interlinkArticle(body,catalog);
  assert.deepEqual(result.body[0].children[0],body[0].children[0]);
  assert.deepEqual(result.added.map(t=>t.name),["Deepinder Goyal","Blinkit"]);
  assert.ok(result.body[0].children.find(c=>c.text==="Deepinder Goyal").marks.includes("strong"));
});
test("ambiguous names are skipped, no company-context guessing",()=>{
  const c=buildLinkTargets([...docs,{_id:"f",_type:"founder",name:"Deepinder Goyal",slug:"other-person"}]);
  assert.deepEqual(c.ambiguous,["deepinder goyal"]);
  assert.deepEqual(interlinkArticle(parse("Deepinder Goyal at Zomato."),c).added.map(t=>t.name),["Zomato"]);
});
test("headings, tables and unknown companies untouched",()=>{
  const body=parse("## Zomato\n\nUnknown Company.\n\n| Name | Value |\n| --- | --- |\n| Blinkit | 1 |");
  assert.deepEqual(interlinkArticle(body,catalog).body,body);
});
test("longest name wins and whole word boundaries prevent substring matches",()=>{
  const c=buildLinkTargets([...docs,{_id:"f",_type:"company",name:"Zomato Labs",slug:"zomato-labs"}]);
  const result=interlinkArticle(parse("NotZomato, ZomatoXYZ and Zomato Labs."),c);
  assert.deepEqual(result.added.map(t=>t.name),["Zomato Labs"]);
});
test("names across bold spans preserve marks and original text",()=>{
  const body=parse("Deepinder **Goyal** works at Zomato.");
  const result=interlinkArticle(body,catalog);
  assert.equal(result.added[0].name,"Deepinder Goyal");
  assert.equal(textOf(result.body),textOf(body));
  const bold=result.body[0].children.find(c=>c.text==="Goyal");
  assert.ok(bold.marks.includes("strong"));
  assert.equal(bold.marks.length,2);
});
test("existing three links unchanged and more than three never gets more",()=>{
  for(const count of [3,4]) {
    const body=parse(Array.from({length:count},(_,i)=>`[item${i}](https://misterstory.in/articles/item-${i})`).join(" ")+" Zomato.");
    const result=interlinkArticle(body,catalog);
    assert.equal(result.existingInternalLinks,count);
    assert.equal(result.added.length,0);
    assert.deepEqual(result.body,body);
  }
});
test("draft targets, invalid slugs, code and URL text excluded",()=>{
  const c=buildLinkTargets([...docs,{_id:"drafts.f",_type:"founder",name:"Draft Person",slug:"draft-person"},{_id:"bad",_type:"company",name:"Invalid",slug:"bad slug"}]);
  const body=parse("Draft Person Invalid https://example.com/Zomato and `Blinkit`.");
  assert.equal(interlinkArticle(body,c).added.length,0);
});
test("deterministic new keys and no source mutation",()=>{
  const body=parse("Zomato with Deepinder Goyal.");
  const before=structuredClone(body);
  assert.deepEqual(interlinkArticle(body,catalog),interlinkArticle(body,catalog));
  assert.deepEqual(body,before);
  assert.deepEqual(interlinkArticle(null,catalog).body,null);
});
test("Jupiter scooter is not the fintech company without explicit association",()=>{
  const c=buildLinkTargets([{_id:"j",_type:"company",name:"Jupiter",slug:"jupiter"}]);
  const body=parse("Jupiter scooters sold well.");
  assert.equal(interlinkArticle(body,c,{companySlugs:["tvs-motor"]}).added.length,0);
  assert.equal(interlinkArticle(parse("Jupiter offers finance."),c,{companySlugs:["jupiter"]}).added.length,1);
});
test("reviewed short names preserve canonical variants and never repeat a destination",()=>{
  const c=buildLinkTargets([{_id:"s",_type:"company",name:"SNITCH",slug:"snitch"},{_id:"t",_type:"company",name:"TVS Motor Company",slug:"tvs-motor"}]);
  const result=interlinkArticle(parse("Snitch, SNITCH and TVS Motor."),c);
  assert.deepEqual(result.added.map(t=>t.name),["Snitch","TVS Motor"]);
});
test("native inline code marks are left alone",()=>{
  const body=parse("Zomato");
  body[0].children[0].marks=["code"];
  assert.deepEqual(interlinkArticle(body,catalog).body,body);
});
