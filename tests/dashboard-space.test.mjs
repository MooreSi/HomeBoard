import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
import {familyHTML} from '../public/family-widgets.mjs';
test('Calendar display filters and bin presentation preferences validate and survive restart',async t=>{
 const a=await app(t),prefs={calendarFilter:'demo-feed',personFilter:'demo-person',binsPresentation:'header',binsIconSize:44};const r=await a.post('/api/settings',prefs);assert.equal(r.status,200,await r.clone().text());await a.restart();const saved=await a.json('/api/display-settings');for(const [key,value]of Object.entries(prefs))assert.equal(saved[key],value);
 for(const patch of [{binsPresentation:'bad'},{binsIconSize:0},{binsIconSize:100},{calendarFilter:'<script>'},{personFilter:[]}])assert.equal((await a.post('/api/settings',patch)).status,400);
});
test('Icon-only bins include exactly the earliest collection group and no visible text',()=>{
 const bins=[['first','2026-10-19'],['same','2026-10-19'],['late','2026-10-23']].map(([id,date])=>({id,title:'Demo '+id,color:'#557860',date,every:14,reminderDays:1,exceptions:[]}));const html=familyHTML('bins',{bins,people:[]},'2026-10-17',{binsPresentation:'icons'});assert.equal((html.match(/class="wheelieBin"/g)||[]).length,2);assert.doesNotMatch(html,/<time|<h3|binDate|Put the bin out/);assert.match(html,/aria-label="Demo first"/);assert.match(familyHTML('bins',{bins,people:[]},'2026-10-17'),/<h3>Demo late<\/h3>/);
});
