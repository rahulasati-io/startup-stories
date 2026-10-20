import {test} from "node:test";
import assert from "node:assert/strict";
import XLSX from "xlsx";
import {INDUSTRY_TAXONOMY,validateIndustryPair,excelIndustryRangeName} from "../lib/industry-taxonomy.mjs";
import {COMPANY_INDUSTRY_ASSIGNMENTS} from "./lib/company-industry-assignments.mjs";

test("25 controlled industries have unique slugs and valid Excel range names",()=>{
  assert.equal(INDUSTRY_TAXONOMY.length,25);
  assert.equal(new Set(INDUSTRY_TAXONOMY.map(c=>c.slug)).size,25);
  for(const c of INDUSTRY_TAXONOMY){
    assert.match(excelIndustryRangeName(c.name),/^[A-Za-z_][A-Za-z0-9_]*$/);
    assert.equal(new Set(c.subIndustries).size,c.subIndustries.length);
    for(const sub of c.subIndustries) assert.deepEqual(validateIndustryPair(c.name,sub),{industry:c.name,industrySlug:c.slug,subIndustry:sub});
  }
});
test("typos, legacy free text, missing classifications and cross-industry pairs fail",()=>{
  for(const pair of [["Fintech","Payments"],["Financial Services","Paymnts"],["Healthcare","Payments"],["",""],["Financial Services",""]]) assert.throws(()=>validateIndustryPair(...pair));
  assert.equal(validateIndustryPair(" financial services "," payments ").subIndustry,"Payments");
});
test("every company in the source workbook has exactly one reviewed assignment",()=>{
  const rows=XLSX.utils.sheet_to_json(XLSX.readFile("companies.xlsx").Sheets.Companies).filter(row=>row.company_slug);
  assert.equal(COMPANY_INDUSTRY_ASSIGNMENTS.size,232);
  for(const row of rows) assert.ok(COMPANY_INDUSTRY_ASSIGNMENTS.has(row.company_slug),row.company_slug);
});
test("related businesses share a primary industry without erasing their differences",()=>{
  const m=COMPANY_INDUSTRY_ASSIGNMENTS;
  assert.equal(m.get("razorpay").industry,m.get("zerodha").industry);
  assert.notEqual(m.get("razorpay").subIndustry,m.get("zerodha").subIndustry);
  assert.equal(m.get("apollo-hospitals").subIndustry,m.get("paras-healthcare").subIndustry);
  assert.equal(m.get("snabbit").subIndustry,m.get("pronto").subIndustry);
  assert.equal(m.get("solar-industries-india").subIndustry,"Explosives");
});

test("saved workbook has valid classification pairs and complete dependent dropdown names",()=>{
  const workbook=XLSX.readFile("companies.xlsx");
  const rows=XLSX.utils.sheet_to_json(workbook.Sheets.Companies).filter(row=>row.company_slug);
  for(const row of rows) validateIndustryPair(row.industry,row.sub_industry,row.company_slug);
  const names=new Map(workbook.Workbook.Names.map(item=>[item.Name,item.Ref]));
  assert.equal(names.get("IndustryNames"),"'Industry Categories'!$D$2:$D$26");
  for(const category of INDUSTRY_TAXONOMY){
    const ref=names.get(excelIndustryRangeName(category.name));
    assert.ok(ref,category.name);
    const address=ref.split('!')[1].replaceAll('$','');
    const cells=XLSX.utils.sheet_to_json(workbook.Sheets['Industry Categories'],{header:1,range:address}).flat();
    assert.deepEqual(cells,category.subIndustries);
  }
});
