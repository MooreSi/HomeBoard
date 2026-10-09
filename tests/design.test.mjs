import test from 'node:test';
import assert from 'node:assert/strict';
import {app} from './helpers/app.mjs';
const design={version:1,name:'Ocean room',enabled:true,font:'serif',headingFont:'sans',fontSize:18,headingSize:32,fontWeight:400,lineHeight:1.5,letterSpacing:0,gap:16,padding:20,radius:12,borderWidth:1,opacity:90,shadow:'soft',background:'gradient',colors:{background:'#102030',surface:'#203040',text:'#ffffff',muted:'#ccddee',accent:'#55bbcc',event:'#304050'},panels:{calendar:{x:4,y:0,w:8,h:10,layer:0,visible:true},clock:{x:0,y:0,w:4,h:3,layer:1,visible:true},photo:{x:0,y:3,w:4,h:7,layer:0,visible:true},weather:{x:0,y:10,w:6,h:2,layer:0,visible:true},news:{x:6,y:10,w:6,h:2,layer:0,visible:true}}};
test('Custom designs save durably across server restart',async t=>{
 const a=await app(t);const r=await a.post('/api/settings',{customDesign:design});assert.equal(r.status,200);await a.restart();assert.deepEqual((await a.json('/api/settings')).customDesign,design);
});
test('Untrusted theme fields and invalid panel positions are rejected without overwriting a saved design',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{customDesign:design})).status,200);
 for(const bad of [{...design,css:'url(https://tracker.invalid)'},{...design,colors:{...design.colors,text:'</style>'}},{...design,panels:{...design.panels,photo:{...design.panels.photo,x:12}}}]){
  const r=await a.post('/api/settings',{customDesign:bad});assert.equal(r.status,400);assert.match((await r.json()).error,/design|colour|panel/i);
 }
 assert.deepEqual((await a.json('/api/settings')).customDesign,design);
});
test('Portable design files round-trip and reject settings or executable content',async()=>{
 const {exportDesign,importDesign}=await import('../public/design.mjs');const file=exportDesign(design);
 assert.deepEqual(Object.keys(file),['format','version','design']);assert.deepEqual(importDesign(JSON.parse(JSON.stringify(file))),design);
 assert.throws(()=>importDesign({...file,calendarFeedUrl:'https://private.invalid/calendar.ics'}),/design file/);
 assert.throws(()=>importDesign({...file,version:2}),/Unsupported/);
 assert.throws(()=>importDesign({...file,design:{...design,font:'url(https://tracker.invalid)'}}),/font/);
});
