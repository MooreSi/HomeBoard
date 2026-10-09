import {test} from 'node:test';
import assert from 'node:assert/strict';
import {transitionPhoto} from '../public/slideshow.mjs';
test('fade hides the next photo until the previous photo finishes fading out',async()=>{
 let finish;const outgoing={animate:()=>({finished:new Promise(r=>{finish=r;})})};let incomingAnimated=false;
 const incoming={style:{},animate:()=>{incomingAnimated=true;return {finished:Promise.resolve()};}};
 const change=transitionPhoto(outgoing,incoming,'fade',1000);
 assert.equal(incoming.style.opacity,'0');assert.equal(incomingAnimated,false);
 finish();await change;assert.equal(incoming.style.opacity,'1');assert.equal(incomingAnimated,true);
});
test('instant change never requests animations',async()=>{
 const old={animate:()=>{throw Error('Cut should not animate');}},next={style:{},animate:()=>{throw Error('Cut should not animate');}};await transitionPhoto(old,next,'cut',1000);assert.equal(next.style.opacity,'1');
});
