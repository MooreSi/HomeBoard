import test from 'node:test';
import assert from 'node:assert/strict';
import * as organiser from '../public/organiser-design.mjs';
import {contentDesign,designStarter,validateDesign} from '../public/design.mjs';

test('Organiser dashboard inherits main appearance while retaining its own layout and content positions',()=>{
 assert.equal(typeof organiser.organiserDashboardDesign,'function');
 const main=contentDesign(designStarter('studio')),family=contentDesign(designStarter('family'));
 main.colors.background='#123456';main.font='serif';main.radius=9;main.opacity=80;family.panels.bins={x:2,y:6,w:5,h:4,layer:3,visible:true};family.contentLayouts.bins.heading={x:3,y:4,w:90,h:20,fontSize:23};
 const beforeMain=structuredClone(main),beforeFamily=structuredClone(family),result=organiser.organiserDashboardDesign(main,family);
 assert.deepEqual(result.colors,main.colors);assert.equal(result.font,'serif');assert.equal(result.radius,9);assert.equal(result.opacity,80);
 assert.deepEqual(result.panels.bins,family.panels.bins);assert.deepEqual(result.portraitPanels.bins,family.portraitPanels.bins);assert.deepEqual(result.contentLayouts.bins,family.contentLayouts.bins);
 assert.equal(result.panels.calendar.visible,false);assert.equal(result.panels.photo.visible,false);assert.deepEqual(validateDesign(result),result);assert.deepEqual(main,beforeMain);assert.deepEqual(family,beforeFamily);
});
test('Default organiser dashboard shows all seven family widgets without configuration panels',()=>{
 assert.equal(typeof organiser.organiserDashboardDesign,'function');const main=contentDesign(designStarter('studio')),result=organiser.organiserDashboardDesign(main,null);
 assert.deepEqual(Object.entries(result.panels).filter(([,p])=>p.visible).map(([name])=>name).sort(),['bins','chores','countdowns','lists','meals','notices','routines']);
 assert.deepEqual(result.colors,main.colors);assert.equal(result.enabled,true);assert.equal(result.panels.bins.x,0);assert.equal(result.portraitPanels.bins.w,6);
});
