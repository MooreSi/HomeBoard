import {test} from 'node:test';
import assert from 'node:assert/strict';
import {feedEvents} from '../lib/calendar-feed.mjs';
const calendar=lines=>['BEGIN:VCALENDAR','VERSION:2.0',...lines,'END:VCALENDAR'].join('\r\n');
test('ICS recurrence excludes cancelled dates and masks private appointment titles',async()=>{
 const xml=calendar(['BEGIN:VEVENT','UID:private','DTSTART:20261009T080000Z','DTEND:20261009T090000Z','RRULE:FREQ=DAILY;COUNT=3','EXDATE:20261010T080000Z','CLASS:PRIVATE','SUMMARY:Personal details','END:VEVENT']);
 const r=await feedEvents(xml,'2026-10-01','2026-11-01');assert.deepEqual(r.map(e=>e.start.dateTime),['2026-10-09T08:00:00.000Z','2026-10-11T08:00:00.000Z']);assert.deepEqual(r.map(e=>e.subject),['Private appointment','Private appointment']);
});
test('ICS date-only events keep their date and exclusive end around DST',async()=>{
 const xml=calendar(['BEGIN:VEVENT','UID:day','DTSTART;VALUE=DATE:20261025','DTEND;VALUE=DATE:20261026','SUMMARY:Family day','END:VEVENT']);
 const r=await feedEvents(xml,'2026-10-01','2026-11-01');assert.equal(r[0].start.dateTime,'2026-10-25');assert.equal(r[0].end.dateTime,'2026-10-26');assert.equal(r[0].isAllDay,true);
});
test('a calendar HTML link is rejected instead of presenting an empty connected calendar',async()=>{
 await assert.rejects(feedEvents('<html>Outlook calendar</html>','2026-10-01','2026-11-01'),/not an ICS calendar/);
});
