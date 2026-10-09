import {test} from 'node:test';
import assert from 'node:assert/strict';
import {range} from '../public/display.mjs';
import {app} from './helpers/app.mjs';
test('upcoming agenda requests fourteen calendar days across a month and DST boundary',()=>{
 assert.deepEqual(range('2026-10-25','agenda'),['2026-10-25','2026-11-08']);
});
test('Metro selects the upcoming agenda and persists it across restart',async t=>{
 const a=await app(t);const themes=await a.json('/api/themes');assert.equal(themes.find(x=>x.id==='metro').view,'agenda');
 const r=await a.post('/api/settings',{theme:'metro',defaultView:'agenda'});assert.equal(r.status,200);await a.restart();assert.equal((await a.json('/api/settings')).defaultView,'agenda');
});
test('wall display exposes an upcoming view and seconds beside the digital clock',async t=>{
 const a=await app(t);const html=await (await a.request('/')).text();assert.match(html,/data-view="agenda"/);assert.match(html,/id="clockSeconds"/);
});
test('upcoming agenda groups populated dates and formats start/end without empty days',async()=>{
 const {agendaHTML}=await import('../public/agenda.mjs');const html=agendaHTML([{subject:'Family dinner',start:{dateTime:'2026-10-10T18:00:00Z'},end:{dateTime:'2026-10-10T19:00:00Z'},location:{displayName:'Kitchen'}}],'2026-10-09',{timezone:'Europe/London',privacy:false,hour12:false,today:'2026-10-09'});
 assert.match(html,/Tomorrow/);assert.match(html,/19:00/);assert.match(html,/20:00/);assert.match(html,/Family dinner/);assert.match(html,/Kitchen/);assert.equal((html.match(/class="agendaDay"/g)||[]).length,1);
});
test('agenda masks private titles and locations and escapes external event text',async()=>{
 const {agendaHTML}=await import('../public/agenda.mjs');const events=[{subject:'Private title',sensitivity:'private',start:{dateTime:'2026-10-09T12:00:00Z'},end:{dateTime:'2026-10-09T13:00:00Z'},location:{displayName:'Private address'}},{subject:'<img src=x onerror=alert(1)>',isAllDay:true,start:{dateTime:'2026-10-10'},end:{dateTime:'2026-10-11'}}];const html=agendaHTML(events,'2026-10-09',{timezone:'UTC',privacy:false,hour12:false,today:'2026-10-09'});
 assert.match(html,/Private appointment/);assert.equal(html.includes('Private title'),false);assert.equal(html.includes('Private address'),false);assert.match(html,/&lt;img/);assert.equal(html.includes('<img'),false);assert.match(html,/All day/);
});
test('the wall display serves its local Roboto font with the correct media type',async t=>{
 const a=await app(t);const r=await a.request('/fonts/Roboto.ttf');assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'font/ttf');assert.equal(new Uint8Array(await r.arrayBuffer()).slice(0,4).join(','),'0,1,0,0');
});
test('upcoming agenda hides finished events today while retaining ongoing and all-day appointments',async()=>{
 const {agendaHTML}=await import('../public/agenda.mjs');const html=agendaHTML([{subject:'Finished',start:{dateTime:'2026-10-09T08:00:00Z'},end:{dateTime:'2026-10-09T09:00:00Z'}},{subject:'Ongoing',start:{dateTime:'2026-10-09T11:00:00Z'},end:{dateTime:'2026-10-09T13:00:00Z'}},{subject:'Birthday',isAllDay:true,start:{dateTime:'2026-10-09'},end:{dateTime:'2026-10-10'}}],'2026-10-09',{timezone:'UTC',privacy:false,hour12:false,today:'2026-10-09',now:'2026-10-09T12:00:00Z'});
 assert.equal(html.includes('Finished'),false);assert.match(html,/Ongoing/);assert.match(html,/Birthday/);
});
