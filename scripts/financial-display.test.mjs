import {test} from "node:test";
import assert from "node:assert/strict";
import {formatFinancialAmount,formatFinancialMetric} from "../lib/financial-display.mjs";

test("at most one decimal, no trailing zero, losses and Indian grouping",()=>{
  for(const [input,expected] of [[123.46,"123.5"],[100,"100"],[-60.26,"-60.3"],[0,"0"],[-0.01,"0"],[1.05,"1.1"],[123456.789,"1,23,456.8"]]) assert.equal(formatFinancialAmount(input),expected);
});
test("structured values keep original precision and currency/unit",()=>{
  const metric={label:"Revenue",value:"INR 123.456 crore",numericValue:123.456,currency:"INR",unit:"crore"};
  const before=structuredClone(metric);
  assert.equal(formatFinancialMetric(metric),"INR 123.5 crore");
  assert.deepEqual(metric,before);
  assert.equal(formatFinancialMetric({...metric,numericValue:0,currency:"USD",unit:"units"}),"USD 0");
});
test("legacy financial amounts are formatted without rewriting units",()=>{
  assert.equal(formatFinancialMetric({label:"Net profit / loss",value:"₹-23.456 crore"}),"₹-23.5 crore");
  assert.equal(formatFinancialMetric({label:"Revenue",value:"INR 1,23,456.789 crore"}),"INR 1,23,456.8 crore");
  assert.equal(formatFinancialMetric({label:"EBITDA",value:"100.000"}),"100");
});
test("nonfinancial KPIs, percentages and ambiguous prose remain unchanged",()=>{
  for(const metric of [{label:"Occupancy",value:"48.123%"},{label:"Revenue growth",value:"48.123%"},{label:"Revenue",value:"100.123–150.456 crore"},{label:"Revenue",value:"About INR 123.456 crore"},{label:"Stores",value:"1,234.567"}]) assert.equal(formatFinancialMetric(metric),metric.value);
  assert.equal(formatFinancialMetric({value:"unknown",numericValue:NaN,currency:"INR",unit:"crore"}),"unknown");
});
