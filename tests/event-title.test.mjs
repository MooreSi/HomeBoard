import {test} from 'node:test';
import assert from 'node:assert/strict';
import {eventTitle} from '../public/event-title.mjs';
import {agendaHTML} from '../public/agenda.mjs';
import {app} from './helpers/app.mjs';

// Demo appointments only; dates are pinned so ages do not depend on today.
const pref={timezone:'Europe/London',eventEmoji:true,privacy:false};
const at=(subject,dateTime='2026-10-30T09:00:00Z')=>({subject,start:{dateTime,timeZone:'UTC'},end:{dateTime,timeZone:'UTC'}});
const allDay=(subject,date)=>({subject,isAllDay:true,start:{dateTime:date+'T00:00:00'},end:{dateTime:date+'T00:00:00'}});

test('event title gains the emoji for a recognised activity keyword',()=>{
 assert.equal(eventTitle(at('Demo · Football training'),pref),'⚽ Demo · Football training');
});
test('event title keyword matching ignores case and accepts word endings',()=>{
 assert.equal(eventTitle(at('DEMO SWIMMING LESSON'),pref),'🏊 DEMO SWIMMING LESSON');
});
test('event title keyword must start a word, so a keyword inside another word is ignored',()=>{
 assert.equal(eventTitle(at('Demo scatter chart review'),pref),'Demo scatter chart review');
});
test('school run is treated as a school appointment rather than running',()=>{
 assert.equal(eventTitle(at('Demo school run'),pref),'🏫 Demo school run');
});
test('event title without a known keyword is unchanged',()=>{
 assert.equal(eventTitle(at('Demo weekly review'),pref),'Demo weekly review');
});
test('event title that already starts with an emoji is not given a second one',()=>{
 assert.equal(eventTitle(at('🎉 Demo football party'),pref),'🎉 Demo football party');
});
test('possessive birthday title shows only the name with a cake',()=>{
 assert.equal(eventTitle(allDay("Astrid's Birthday",'2026-11-01'),pref),'🎂 Astrid');
});
test('birthday title with a birth year shows the age reached on that day',()=>{
 assert.equal(eventTitle(allDay('Birthday: Elena (1987)','2026-10-30'),pref),'🎂 Elena (39)');
});
test('birthday age uses the appointment year rather than the current year',()=>{
 assert.equal(eventTitle(allDay("Elena's birthday 1987",'2030-10-30'),pref),'🎂 Elena (43)');
});
test('birthday year later than the appointment is not shown as a negative age',()=>{
 assert.equal(eventTitle(allDay('Birthday: Elena (2031)','2026-10-30'),pref),'🎂 Elena');
});
test('private appointments never reveal a keyword emoji or birthday name',()=>{
 assert.equal(eventTitle({...allDay("Astrid's Birthday",'2026-11-01'),sensitivity:'private'},pref),'Private appointment');
 assert.equal(eventTitle(at('Demo football'),{...pref,privacy:true}),'Private appointment');
});
test('turning event emoji off keeps the original calendar title',()=>{
 assert.equal(eventTitle(allDay("Astrid's Birthday",'2026-11-01'),{...pref,eventEmoji:false}),"Astrid's Birthday");
});
test('agenda renders the decorated title and escapes it',()=>{
 const html=agendaHTML([at('Demo <b>dentist</b>','2026-10-30T15:00:00Z')],'2026-10-30',{...pref,today:'2026-10-30'});
 assert.match(html,/<strong>🦷 Demo &lt;b&gt;dentist&lt;\/b&gt;<\/strong>/);
});
test('event emoji setting defaults on, rejects non-boolean values and persists when turned off',async t=>{
 const a=await app(t);
 assert.equal((await a.json('/api/settings')).eventEmoji,true);
 assert.equal((await a.post('/api/settings',{eventEmoji:'no'})).status,400);
 assert.equal((await a.post('/api/settings',{eventEmoji:false})).status,200);
 await a.restart();
 assert.equal((await a.json('/api/settings')).eventEmoji,false);
});
