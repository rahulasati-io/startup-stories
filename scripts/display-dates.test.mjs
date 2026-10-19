import {test} from "node:test";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {formatIstDate, formatIstDateTime, istCalendarYear} from "../lib/display-dates.mjs";

test("the reported homepage/article mismatch uses the same Indian calendar day",()=>{
  const value="2026-10-15T19:14:15.345Z";
  assert.equal(formatIstDate(value),"16 Oct 2026");
  assert.equal(formatIstDateTime(value),"16 Oct 2026, 12:44 am IST");
});
test("updated dates and month/year rollovers use IST",()=>{
  assert.equal(formatIstDate("2026-10-16T19:47:20.645Z"),"17 Oct 2026");
  assert.equal(formatIstDate("2026-10-31T18:30:00Z"),"1 Nov 2026");
  assert.equal(formatIstDate("2026-12-31T18:29:59Z"),"31 Dec 2026");
  assert.equal(formatIstDate("2026-12-31T18:30:00Z"),"1 Jan 2027");
  assert.equal(istCalendarYear("2026-12-31T18:30:00Z"),"2027");
});
test("explicit offsets and Date objects preserve the instant",()=>{
  const utc="2026-10-15T19:14:15.345Z";
  assert.equal(formatIstDateTime("2026-10-16T00:44:15.345+05:30"),formatIstDateTime(utc));
  assert.equal(formatIstDateTime(new Date(utc)),formatIstDateTime(utc));
});
test("calendar-only dates stay on the entered day",()=>{
  assert.equal(formatIstDate("2026-10-15"),"15 Oct 2026");
});
test("missing, invalid and ambiguous unzoned values never crash or use local time",()=>{
  for(const value of [null,undefined,"","invalid","2026-10-15T19:14:15",new Date(NaN)]) {
    assert.equal(formatIstDate(value),"");
    assert.equal(formatIstDateTime(value),"");
  }
});
for(const timezone of ["UTC","America/Los_Angeles","Pacific/Kiritimati"]) {
  test(`identical output under host timezone ${timezone}`,()=>{
    const moduleUrl=new URL("../lib/display-dates.mjs",import.meta.url).href;
    const code=`import {formatIstDate,formatIstDateTime,istCalendarYear} from ${JSON.stringify(moduleUrl)};console.log(JSON.stringify([formatIstDate('2026-10-15T19:14:15Z'),formatIstDateTime('2026-10-15T19:14:15Z'),istCalendarYear('2026-12-31T18:30:00Z')]));`;
    const result=spawnSync(process.execPath,["--input-type=module","-e",code],{env:{...process.env,TZ:timezone},encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);
    assert.deepEqual(JSON.parse(result.stdout),["16 Oct 2026","16 Oct 2026, 12:44 am IST","2027"]);
  });
}
