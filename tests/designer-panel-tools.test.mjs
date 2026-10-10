import test from 'node:test';import assert from 'node:assert/strict';
import * as design from '../public/design.mjs';import {app} from './helpers/app.mjs';
function editable(){assert.equal(typeof design.panelToolsDesign,'function','Designs need durable cropping, compact restoration and clock composition');return design.panelToolsDesign(design.creativeDesign(design.designStarter('family')));}
test('Panel tools preserve old designs and round-trip crop and clock composition safely',()=>{
 const old=design.creativeDesign(design.designStarter('family')),before=structuredClone(old),d=editable();
 d.panelOptions.bins.crop={top:10,right:20,bottom:5,left:0};d.clockLayout.custom=true;d.clockLayout.items.date={visible:false,x:10,y:50,w:80,h:25};
 assert.deepEqual(design.importDesign(design.exportDesign(d)),d);assert.deepEqual(design.panelToolsDesign(old).panelStyles,old.panelStyles);assert.deepEqual(old,before);
 assert.throws(()=>design.validateDesign({...d,panelOptions:{...d.panelOptions,bins:{...d.panelOptions.bins,crop:{top:60,right:0,bottom:40,left:0}}}}),/crop/);
 assert.throws(()=>design.validateDesign({...d,clockLayout:{...d.clockLayout,items:{...d.clockLayout.items,time:{visible:true,x:80,y:0,w:40,h:20}}}}),/clock/);
});
test('Overlapping panels move one step backward and forward even when layers tie',()=>{
 assert.equal(typeof design.reorderPanel,'function','Overlap ordering needs stable steps');const panels={a:{layer:0},b:{layer:0},c:{layer:1}};
 assert.deepEqual(Object.entries(design.reorderPanel(panels,'b','backward')).sort((a,b)=>a[1].layer-b[1].layer).map(([key])=>key),['b','a','c']);
 assert.deepEqual(Object.entries(design.reorderPanel(panels,'a','front')).sort((a,b)=>a[1].layer-b[1].layer).map(([key])=>key),['b','c','a']);assert.deepEqual(panels,{a:{layer:0},b:{layer:0},c:{layer:1}});
});
test('Crop handles retain a visible area and never change panel geometry',()=>{
 assert.equal(typeof design.transformCrop,'function','Crop handles need bounded trimming');const crop={top:0,right:0,bottom:0,left:0};assert.deepEqual(design.transformCrop(crop,'w',120,0),{top:0,right:0,bottom:0,left:90});assert.deepEqual(design.transformCrop(crop,'se',-25,-30),{top:0,right:25,bottom:30,left:0});assert.deepEqual(crop,{top:0,right:0,bottom:0,left:0});
});
test('Compact reversal and clock composition survive restart in settings and library',async t=>{
 const a=await app(t),d=editable();d.panelOptions.bins.compactBackup={headingSize:22,fontSize:18,secondarySize:13,padding:20,contentGap:10,lineHeight:1.4,radius:20};d.panelOptions.bins.crop.left=15;d.clockLayout.custom=true;d.clockLayout.items.location.visible=false;
 assert.equal((await a.post('/api/settings',{customDesign:d})).status,200);assert.equal((await a.post('/api/family',{revision:0,collection:'screens',action:'save',item:{id:'tools-demo',name:'Demo composition',design:d,start:'00:00',end:'00:00',weekdays:[0,1,2,3,4,5,6],enabled:false}})).status,200);
 await a.restart();assert.deepEqual((await a.json('/api/settings')).customDesign,d);assert.deepEqual((await a.json('/api/family')).screens[0].design,d);
});
test('Frontmost panels can be saved as reusable blocks and invalid layer values are rejected',async t=>{
 const a=await app(t),d=editable(),panel={...d.panels.bins,layer:11},style=d.panelStyles.bins;
 const item={id:'front-bin',name:'Front bin demo',type:'bins',panel,style};const saved=await a.post('/api/family',{revision:0,collection:'blocks',action:'save',item});assert.equal(saved.status,200,await saved.clone().text());
 const invalid=await a.post('/api/family',{revision:1,collection:'blocks',action:'save',item:{...item,panel:{...panel,layer:32}}});assert.equal(invalid.status,400);assert.match((await invalid.json()).error,/placement/);await a.restart();assert.deepEqual((await a.json('/api/family')).blocks[0].panel,panel);
});
