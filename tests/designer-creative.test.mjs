import test from 'node:test';import assert from 'node:assert/strict';
import * as design from '../public/design.mjs';import {themes} from '../lib/settings.mjs';import {app} from './helpers/app.mjs';
function creative(){assert.equal(typeof design.creativeDesign,'function','Panel typography needs a compatible richer design schema');return design.creativeDesign(design.designStarter('family'));}
test('Creative panels keep separate heading/body/secondary typography and reject unsafe values',()=>{
 const d=creative(),s=d.panelStyles.bins;s.custom=true;s.headingSize=18;s.fontSize=12;s.secondarySize=10;s.headingItalic=true;s.fontWeight=700;s.secondaryDecoration='underline';s.padding=6;s.contentGap=3;
 assert.deepEqual(design.importDesign(design.exportDesign(d)),d);
 assert.throws(()=>design.validateDesign({...d,panelStyles:{...d.panelStyles,bins:{...s,headingSize:200}}}),/panel style/);
 assert.throws(()=>design.validateDesign({...d,panelStyles:{...d.panelStyles,bins:{...s,headingFont:'url(https://invalid.test)'}}}),/panel style/);
 assert.throws(()=>design.validateDesign({...d,panelStyles:{...d.panelStyles,bins:{...s,locked:'yes'}}}),/panel style/);
});
test('Old panel customisation survives upgrade to creative styles without mutating its source',()=>{
 const old=design.designStarter('family');old.panelStyles.bins={custom:true,font:'serif',fontSize:22,color:'#ffffff',background:'#102030',align:'center'};const before=structuredClone(old),d=creative();
 const upgraded=design.creativeDesign(old);assert.equal(upgraded.panelStyles.bins.fontSize,22);assert.equal(upgraded.panelStyles.bins.headingSize,22);assert.equal(upgraded.panelStyles.bins.font,'serif');assert.deepEqual(old,before);assert.equal(d.version,4);
});
test('Every built-in theme can be loaded as a validated independent custom copy',()=>{
 assert.equal(typeof design.designFromTheme,'function','Built-in themes need editable custom copies');const before=structuredClone(themes);
 for(const theme of themes){const d=design.validateDesign(design.designFromTheme(theme));assert.equal(d.version,4);assert.equal(d.name,theme.name+' · my design');assert.equal(d.colors.background,theme.colors[0]);assert.equal(d.colors.accent,theme.colors[1]);assert.equal(d.enabled,true);}
 assert.deepEqual(themes,before);assert.throws(()=>design.designFromTheme({id:'unknown'}),/theme/);
});
test('Creative panel typography persists in settings and reusable blocks through restart',async t=>{
 const d=creative(),s=d.panelStyles.bins;s.custom=true;s.headingSize=17;s.fontSize=11;s.secondarySize=9;s.fontItalic=true;s.opacity=70;s.backgroundMode='gradient';s.gradientTo='#334455';s.locked=true;
 const a=await app(t);assert.equal((await a.post('/api/settings',{customDesign:d})).status,200);
 assert.equal((await a.post('/api/family',{revision:0,collection:'blocks',action:'save',item:{id:'compact-bin',name:'Compact bin card',type:'bins',panel:d.panels.bins,style:s}})).status,200);
 await a.restart();assert.deepEqual((await a.json('/api/settings')).customDesign,d);assert.deepEqual((await a.json('/api/family')).blocks[0].style,s);
});
