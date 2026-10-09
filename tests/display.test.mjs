import {test} from 'node:test';
import assert from 'node:assert/strict';
import {zonedDate,zonedMidnight,onDay,range} from '../public/display.mjs';
test('chosen timezone determines the current date around midnight',()=>{
 assert.equal(zonedDate(new Date('2026-10-09T00:30:00Z'),'America/New_York'),'2026-10-08');
});
test('London DST spring day is 23 hours and autumn day is 25 hours',()=>{
 assert.equal((zonedMidnight('2026-03-30','Europe/London')-zonedMidnight('2026-03-29','Europe/London'))/3600000,23);
 assert.equal((zonedMidnight('2026-10-26','Europe/London')-zonedMidnight('2026-10-25','Europe/London'))/3600000,25);
});
test('all-day events keep their calendar date in a negative offset timezone',()=>{
 const event={isAllDay:true,start:{dateTime:'2026-10-09'},end:{dateTime:'2026-10-10'}};
 assert.deepEqual(onDay([event],'2026-10-09','America/Los_Angeles'),[event]);assert.deepEqual(onDay([event],'2026-10-08','America/Los_Angeles'),[]);
});
test('events spanning midnight appear on both days but exclude their end boundary',()=>{
 const event={start:{dateTime:'2026-10-08T23:30:00Z'},end:{dateTime:'2026-10-09T00:30:00Z'}};
 assert.equal(onDay([event],'2026-10-08','UTC').length,1);assert.equal(onDay([event],'2026-10-09','UTC').length,1);assert.equal(onDay([event],'2026-10-10','UTC').length,0);
});

test('rolling calendar covers three complete weeks across a month boundary',()=>{assert.deepEqual(range('2026-10-29','rolling'),['2026-10-26','2026-11-16']);});
