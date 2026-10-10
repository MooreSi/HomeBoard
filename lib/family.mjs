import crypto from 'node:crypto';
import {readJSON,saveJSON} from './settings.mjs';
import {validateDesign,validatePanelStyle} from '../public/design.mjs';
import {validDate,taskOccurs} from '../public/family-model.mjs';
export const collections=['people','lists','tasks','meals','bins','countdowns','notices','screens','blocks'];
export const emptyFamily=()=>({version:1,revision:0,...Object.fromEntries(collections.map(k=>[k,[]])),completions:[],playlist:{enabled:false,interval:60,screenIds:[]}});
const text=(v,max=200)=>typeof v==='string'&&v.trim()&&v.length<=max;
const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v);
const id=v=>typeof v==='string'&&/^[a-z\d-]{1,80}$/i.test(v);
function keys(v,allowed){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!allowed.includes(k)))throw Error('Unknown or invalid family field');}
export function validateItem(type,v){
 const common=['id','title'];const fields={people:['id','name','color'],lists:[...common,'items'],tasks:[...common,'person','kind','repeat','due','weekdays','points','steps'],meals:[...common,'date','slot','recipe','ingredients'],bins:[...common,'date','every','color','exceptions','reminderDays'],countdowns:[...common,'date','annual'],notices:[...common,'body','expires'],screens:['id','name','design','start','end','weekdays','enabled'],blocks:['id','name','type','panel','style']};keys(v,fields[type]||[]);if(!id(v.id))throw Error('Invalid family item id');
 if(type==='people'){if(!text(v.name,60)||!color(v.color))throw Error('Invalid family profile');}
 else if(type==='screens'){if(!text(v.name,60)||typeof v.enabled!=='boolean'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.start)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.end)||!Array.isArray(v.weekdays)||v.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6))throw Error('Invalid screen schedule');validateDesign(v.design);if(!v.design)throw Error('Screen needs a design');}
 else if(type==='blocks'){if(!text(v.name,60)||!['calendar','clock','photo','weather','news','lists','chores','routines','meals','bins','countdowns','notices'].includes(v.type))throw Error('Invalid reusable block');const p=v.panel;if(!p||['x','y','w','h','layer'].some(k=>!Number.isInteger(p[k]))||p.x<0||p.y<0||p.w<1||p.h<1||p.x+p.w>12||p.y+p.h>12||p.layer<0||p.layer>10||typeof p.visible!=='boolean')throw Error('Invalid block placement');keys(p,['x','y','w','h','layer','visible']);validateStyle(v.style);}
 else {if(!text(v.title,120))throw Error('Invalid family title');
  if(type==='lists'){if(!Array.isArray(v.items)||v.items.length>200)throw Error('Invalid list');for(const i of v.items){keys(i,['id','text','done']);if(!id(i.id)||!text(i.text)||typeof i.done!=='boolean')throw Error('Invalid list item');}if(new Set(v.items.map(i=>i.id)).size!==v.items.length)throw Error('Duplicate list item');}
  if(type==='tasks'){if(!['chore','routine'].includes(v.kind)||!['daily','weekly','once'].includes(v.repeat)||!validDate(v.due)||typeof v.person!=='string'||!Number.isInteger(v.points)||v.points<0||v.points>100||!Array.isArray(v.weekdays)||v.weekdays.some(d=>!Number.isInteger(d)||d<0||d>6)||v.repeat==='weekly'&&!v.weekdays.length||!Array.isArray(v.steps)||v.steps.length>30||v.steps.some(s=>!text(s,120)))throw Error('Invalid task or routine');}
  if(type==='meals'){if(!validDate(v.date)||!['breakfast','lunch','dinner','snack'].includes(v.slot)||typeof v.recipe!=='string'||v.recipe.length>2048||!Array.isArray(v.ingredients)||v.ingredients.length>100||v.ingredients.some(x=>!text(x)))throw Error('Invalid meal');if(v.recipe&&!/^https?:\/\//.test(v.recipe))throw Error('Recipe needs an HTTP(S) link');}
  if(type==='bins'){if(!validDate(v.date)||!Number.isInteger(v.every)||v.every<1||v.every>365||!color(v.color)||!Number.isInteger(v.reminderDays)||v.reminderDays<0||v.reminderDays>7||!Array.isArray(v.exceptions)||v.exceptions.length>100)throw Error('Invalid bin schedule');for(const e of v.exceptions){keys(e,['from','to']);if(!validDate(e.from)||e.to!==''&&!validDate(e.to))throw Error('Invalid bin exception');}}
  if(type==='countdowns'&&(!validDate(v.date)||typeof v.annual!=='boolean'))throw Error('Invalid countdown');
  if(type==='notices'&&(!text(v.body,2000)||v.expires!==''&&!validDate(v.expires)))throw Error('Invalid notice');
 }
 return structuredClone(v);
}
export function validateStyle(s){return validatePanelStyle(s);}
export function validateFamily(v){keys(v,['version','revision',...collections,'completions','playlist']);if(v.version!==1||!Number.isInteger(v.revision)||v.revision<0)throw Error('Invalid family version');for(const type of collections){if(!Array.isArray(v[type])||v[type].length>200)throw Error('Invalid family collection');v[type].forEach(i=>validateItem(type,i));if(new Set(v[type].map(i=>i.id)).size!==v[type].length)throw Error('Duplicate family id');}if(v.tasks.some(t=>t.person&&!v.people.some(p=>p.id===t.person)))throw Error('Unknown assigned person');
 if(!Array.isArray(v.completions)||v.completions.length>20000)throw Error('Invalid completion history');const seen=new Set();for(const c of v.completions){keys(c,['task','date','step','person','points']);if(!id(c.task)||!validDate(c.date)||!Number.isInteger(c.step)||c.step< -1||c.step>29||typeof c.person!=='string'||!Number.isInteger(c.points)||c.points<0||c.points>100)throw Error('Invalid completion');const key=[c.task,c.date,c.step].join('|');if(seen.has(key))throw Error('Duplicate completion');seen.add(key);}
 keys(v.playlist,['enabled','interval','screenIds']);if(typeof v.playlist.enabled!=='boolean'||!Number.isInteger(v.playlist.interval)||v.playlist.interval<15||v.playlist.interval>3600||!Array.isArray(v.playlist.screenIds)||v.playlist.screenIds.some(x=>!v.screens.some(s=>s.id===x))||v.playlist.enabled&&!v.playlist.screenIds.length||new Set(v.playlist.screenIds).size!==v.playlist.screenIds.length)throw Error('Invalid screen playlist');return structuredClone(v);
}
export class Family {
 constructor(data){this.data=data;this.value=emptyFamily();this.queue=Promise.resolve();}
 async init(){this.value=validateFamily(await readJSON(this.data,'family.json',emptyFamily()));}
 async mutate(command){const work=this.queue.then(async()=>{if(command.revision!==this.value.revision){const e=Error('Family data changed. Reload and try again.');e.status=409;throw e;}const next=structuredClone(this.value),{collection,action}=command;
  if(action==='playlist'){next.playlist=command.playlist;}
  else if(action==='complete'){const task=next.tasks.find(x=>x.id===command.id);if(!task||!validDate(command.date)||!taskOccurs(task,command.date))throw Error('Unknown task or invalid date');const step=command.step??-1;if(!Number.isInteger(step)||step< -1||step>=task.steps.length&&step!==-1)throw Error('Invalid routine step');const index=next.completions.findIndex(x=>x.task===task.id&&x.date===command.date&&x.step===step);if(index>=0)next.completions.splice(index,1);else next.completions.push({task:task.id,date:command.date,step,person:task.person,points:step===-1?task.points:0});}
  else {if(!collections.includes(collection))throw Error('Unknown family collection');if(action==='save'){const item=validateItem(collection,{...command.item,id:command.item.id||crypto.randomUUID()}),index=next[collection].findIndex(x=>x.id===item.id);if(index<0)next[collection].push(item);else {if(collection==='tasks'&&JSON.stringify(next.tasks[index].steps)!==JSON.stringify(item.steps))next.completions=next.completions.filter(c=>c.task!==item.id||c.step===-1);next[collection][index]=item;}}
   else if(action==='remove'){const index=next[collection].findIndex(x=>x.id===command.id);if(index<0)throw Error('Unknown family item');next[collection].splice(index,1);if(collection==='people'){for(const t of next.tasks)if(t.person===command.id)t.person='';}if(collection==='screens'){next.playlist.screenIds=next.playlist.screenIds.filter(x=>x!==command.id);if(!next.playlist.screenIds.length)next.playlist.enabled=false;}}
   else if(action==='toggle'&&collection==='lists'){const list=next.lists.find(x=>x.id===command.id),item=list?.items.find(x=>x.id===command.itemId);if(!item)throw Error('Unknown list item');item.done=!item.done;}
   else if(action==='ingredients'){const meal=next.meals.find(x=>x.id===command.id);if(!meal)throw Error('Unknown meal');let list=next.lists.find(x=>x.id===command.listId);if(!list){list={id:crypto.randomUUID(),title:'Shopping',items:[]};next.lists.push(list);}for(const ingredient of meal.ingredients)if(!list.items.some(x=>!x.done&&x.text.toLowerCase()===ingredient.toLowerCase()))list.items.push({id:crypto.randomUUID(),text:ingredient,done:false});}
   else throw Error('Unknown family action');
  }
  next.revision++;validateFamily(next);await saveJSON(this.data,'family.json',next);this.value=next;return next;
 });this.queue=work.catch(()=>{});return work;}
}
