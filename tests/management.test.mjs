import test from 'node:test';
import assert from 'node:assert/strict';
import {timezoneChoices} from '../public/management.mjs';

test('Worldwide timezone choices include usual regions, UTC and the current IANA alias',()=>{
 const zones=timezoneChoices('Etc/GMT+5');
 assert.equal(zones[0],'UTC');
 for(const zone of ['Europe/London','America/New_York','America/Los_Angeles','Africa/Nairobi','Asia/Kolkata','Asia/Kathmandu','Asia/Tokyo','Australia/Adelaide','Pacific/Auckland','Pacific/Honolulu','Etc/GMT+5'])assert.equal(zones.includes(zone),true,zone);
 assert.equal(new Set(zones).size,zones.length);
});
test('Worldwide selector retains usual timezones when the browser lacks supportedValuesOf',t=>{
 const original=Intl.supportedValuesOf;t.after(()=>Intl.supportedValuesOf=original);Intl.supportedValuesOf=undefined;
 const zones=timezoneChoices('Etc/UTC');
 for(const zone of ['UTC','Etc/UTC','Europe/London','America/Toronto','Africa/Johannesburg','Asia/Dubai','Asia/Tokyo','Australia/Perth','Pacific/Fiji','Asia/Taipei','Pacific/Guam'])assert.equal(zones.includes(zone),true,zone);
 assert.equal(zones.length,60);
});
