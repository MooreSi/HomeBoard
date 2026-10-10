import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {app} from './helpers/app.mjs';
import * as design from '../public/design.mjs';

test('Management appearance saves independently of the dashboard theme and survives restart',async t=>{
 const a=await app(t);
 const r=await a.post('/api/settings',{managementAppearance:'dark',theme:'coastal'});
 assert.equal(r.status,200);
 await a.restart();const saved=await a.json('/api/settings');
 assert.equal(saved.managementAppearance,'dark');assert.equal(saved.theme,'coastal');
 assert.equal((await a.post('/api/settings',{managementAppearance:'sepia'})).status,400);
 assert.equal((await a.json('/api/settings')).managementAppearance,'dark');
});
test('Optional admin protection can only be removed by an unlocked browser and stays removed after restart',async t=>{
 const a=await app(t);assert.equal((await a.post('/api/settings',{name:'No password needed'})).status,200);
 const setup=await a.post('/api/auth/setup',{password:'test-only-password'}),cookie=setup.headers.get('set-cookie').split(';')[0];
 assert.equal((await a.post('/api/auth/disable',{})).status,401);
 const r=await a.request('/api/auth/disable',{method:'POST',headers:{'content-type':'application/json',cookie},body:'{}'});
 assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
 assert.equal(await fs.readFile(path.join(a.data,'admin.json'),'utf8'),'null');
 await a.restart();assert.equal((await a.json('/api/auth/status')).configured,false);
 assert.equal((await a.post('/api/settings',{name:'Open editing'})).status,200);
});
test('Designer drag geometry snaps, resizes every edge and keeps panels inside the canvas',()=>{
 assert.equal(typeof design.transformPanel,'function','Designer needs a shared drag/resize geometry operation');
 const p={x:3,y:3,w:4,h:4,layer:2,visible:true};
 assert.deepEqual(design.transformPanel(p,'move',20,-20),{...p,x:8,y:0});
 assert.deepEqual(design.transformPanel(p,'se',2,1),{...p,w:6,h:5});
 assert.deepEqual(design.transformPanel(p,'nw',-2,-1),{...p,x:1,y:2,w:6,h:5});
 assert.deepEqual(design.transformPanel(p,'e',-20,0),{...p,w:1});
 assert.deepEqual(design.transformPanel(p,'w',20,0),{...p,x:6,w:1});
 assert.deepEqual(design.transformPanel(p,'s',0,20),{...p,h:9});
 assert.deepEqual(design.transformPanel(p,'move',.4,.6),{...p,y:4});
 assert.deepEqual(p,{x:3,y:3,w:4,h:4,layer:2,visible:true});
});
test('Curated starters have valid independent orientations with no overlapping visible panels',()=>{
 assert.equal(typeof design.designStarter,'function','Designer needs curated whole-design starters');
 for(const id of ['studio','family','planner','gallery']){
  const d=design.validateDesign(design.designStarter(id));assert.equal(d.enabled,true);
  for(const panels of [d.panels,d.portraitPanels]){const visible=Object.entries(panels).filter(([,p])=>p.visible);
   for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const [an,a]=visible[i],[bn,b]=visible[j];assert.equal(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y,false,`${id}: ${an} overlaps ${bn}`);}
  }
 }
});
test('Version three gradients persist, export and reject invalid angles without losing the saved design',async t=>{
 assert.equal(typeof design.designStarter,'function');const a=await app(t),d=design.designStarter('studio');
 assert.equal(d.version,3);assert.equal((await a.post('/api/settings',{customDesign:d})).status,200);
 assert.deepEqual(design.importDesign(design.exportDesign(d)),d);
 assert.equal((await a.post('/api/settings',{customDesign:{...d,backdrop:{...d.backdrop,angle:361}}})).status,400);
 await a.restart();assert.deepEqual((await a.json('/api/settings')).customDesign,d);
});

test('Upgrading legacy gradient designs retains their original background and accent endpoints',()=>{
 const legacy=design.newDesign();legacy.background='gradient';
 const upgraded=design.modernDesign(legacy);
 assert.equal(upgraded.backdrop.from,legacy.colors.background);
 assert.equal(upgraded.backdrop.to,legacy.colors.accent);
 assert.equal(upgraded.backdrop.angle,135);
 assert.deepEqual(upgraded.panels.calendar,legacy.panels.calendar);
});
