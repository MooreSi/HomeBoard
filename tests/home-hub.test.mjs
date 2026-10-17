import test from 'node:test';
import assert from 'node:assert/strict';
import * as design from '../public/design.mjs';
import {themes} from '../lib/settings.mjs';
import {familyHTML} from '../public/family-widgets.mjs';
import {app} from './helpers/app.mjs';

test('Reference theme places clock and weather above calendar, tasks, photo and news',()=>{
 const theme=themes.find(t=>t.id==='family-hub');assert.ok(theme,'Reference theme must be selectable');
 const d=design.designFromTheme(theme);
 assert.deepEqual([d.panels.calendar.x,d.panels.calendar.y,d.panels.calendar.w,d.panels.calendar.h],[0,2,7,7]);
 assert.deepEqual([d.panels.photo.x,d.panels.photo.y,d.panels.photo.w,d.panels.photo.h],[0,9,7,3]);
 assert.equal(d.panels.lists.visible,true);assert.equal(d.panels.weather.visible,true);assert.equal(d.panels.news.visible,true);
});
test('Next bin mode shows all bins on the earliest collection day, omitting later dates',()=>{
 const f={people:[],bins:[{id:'late',title:'Later recycling',color:'#00ff00',exceptions:[],date:'2026-10-21',every:7,reminderDays:1},{id:'first',title:'Next rubbish',color:'#333333',exceptions:[],date:'2026-10-19',every:7,reminderDays:1},{id:'same',title:'Next garden',color:'#663300',exceptions:[],date:'2026-10-19',every:7,reminderDays:1}]};
 const html=familyHTML('bins',f,'2026-10-17',{binsNextOnly:true});
 assert.match(html,/Next rubbish/);assert.match(html,/Next garden/);assert.doesNotMatch(html,/Later recycling/);
 assert.match(familyHTML('bins',f,'2026-10-17'),/Later recycling/);
});
test('Independent organiser design, weather styles and next-bin preference persist across restart',async t=>{
 const a=await app(t),main=design.designStarter('studio'),family=design.designStarter('family');
 const saved=await a.post('/api/settings',{customDesign:main,familyDesign:family,weatherStyle:'graphical',binsNextOnly:true});assert.equal(saved.status,200,await saved.clone().text());
 await a.restart();const value=await a.json('/api/display-settings');assert.deepEqual(value.customDesign,main);assert.deepEqual(value.familyDesign,family);assert.equal(value.weatherStyle,'graphical');assert.equal(value.binsNextOnly,true);
 const rejected=await a.post('/api/settings',{weatherStyle:'unknown'});assert.equal(rejected.status,400);assert.match((await rejected.json()).error,/weatherStyle/);
});
test('Content layouts safely round-trip individual sections with bounded geometry and typography',()=>{
 assert.equal(typeof design.contentDesign,'function');const d=design.contentDesign(design.designStarter('family'));
 d.contentLayouts.bins={heading:{x:4,y:3,w:92,h:12,fontSize:24},'item:demo-bin':{x:10,y:20,w:80,h:50,fontSize:32}};
 assert.deepEqual(design.importDesign(design.exportDesign(d)),d);
 assert.throws(()=>design.validateDesign({...d,contentLayouts:{...d.contentLayouts,bins:{heading:{x:90,y:0,w:50,h:10,fontSize:18}}}}),/content/);
 assert.throws(()=>design.validateDesign({...d,contentLayouts:{...d.contentLayouts,bins:{'<script>':{x:0,y:0,w:50,h:10,fontSize:18}}}}),/content/);
});
test('Reference week uses a time axis and positions appointments by time while preserving titles',async()=>{
 const {hubWeekHTML}=await import('../public/hub-week.mjs');
 const html=hubWeekHTML([{subject:'Demo school',start:{dateTime:'2026-10-12T08:00:00Z'},end:{dateTime:'2026-10-12T09:00:00Z'}}],'2026-10-12',{timezone:'UTC',hour12:false,privacy:false},'2026-10-12');
 assert.match(html,/class="hubTimeAxis"/);assert.match(html,/08:00/);assert.match(html,/Demo school/);assert.match(html,/--event-top:6\.666/);assert.match(html,/data-date="2026-10-12"/);
});
