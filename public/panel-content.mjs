// Stable household IDs keep text and cards attached when collections reorder.
const original=new WeakMap();
let current=null,resizeObserver=null,resizeFrame=0;
const observed=new WeakSet();
export function contentTargets(panel){
 if(!panel)return [];
 const heading=panel.querySelector(':scope > header h2,:scope > h2,.widgetHeading h2,.period h2');
 const body=panel.querySelector('.familyWidgetContent,#forecast,#calendar,.tickerViewport');
 const secondary=panel.querySelector('.caption,.attribution');
 const items=[...panel.querySelectorAll('[data-content-item]')].map(el=>({key:'item:'+el.dataset.contentItem,el,label:el.querySelector('h3')?.textContent||'Item'}));
 const clock=panel.querySelector('#clock'),clockText=clock?[{key:'text:clock:0',el:clock,label:'Digital time'}]:[];
 const counters=new Map(),text=[];
 for(const el of panel.querySelectorAll('h2,h3,p,small,strong,b,time,span,li,label')){
  if([heading,secondary].includes(el)||el.closest('button,svg,.analog,.weatherIcon,.calendarTools,.tabs,.navigation')||![...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;
  const scope=el.closest('[data-content-item]')?.dataset.contentItem||'panel',index=counters.get(scope)||0;counters.set(scope,index+1);
  text.push({key:`text:${scope}:${index}`,el,label:el.textContent.trim().slice(0,70)});
 }
 return [{key:'heading',el:heading,label:'Heading'},{key:'body',el:items.length?null:body,label:'Content'},{key:'secondary',el:secondary,label:'Secondary text'},...items,...clockText,...text].filter(x=>x.el);
}
function remember(el){if(!original.has(el))original.set(el,el.getAttribute('style'));}
export function applyContentLayouts(d,root=document){
 current={d,root};
 if(!resizeObserver&&typeof ResizeObserver!=='undefined'){
  resizeObserver=new ResizeObserver(()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(current?.d?.enabled)applyContentLayouts(current.d,current.root);});});
 }
 for(const panel of root.querySelectorAll('[data-design-panel]'))if(resizeObserver&&!observed.has(panel)){observed.add(panel);resizeObserver.observe(panel);}

 for(const el of root.querySelectorAll('[data-content-placed],[data-content-inherited]')){const style=original.get(el);if(style===null)el.removeAttribute('style');else if(style!==undefined)el.setAttribute('style',style);original.delete(el);delete el.dataset.contentPlaced;delete el.dataset.contentInherited;}
 for(const panel of root.querySelectorAll('[data-design-panel]')){
  const placements=d?.enabled?d.contentLayouts?.[panel.dataset.designPanel]:null;
  panel.classList.toggle('hasContentLayout',!!placements&&Object.keys(placements).length>0);
  if(!placements)continue;
  for(const {key,el}of contentTargets(panel)){
   const p=placements[key];if(!p)continue;remember(el);el.dataset.contentPlaced=key;
   Object.assign(el.style,{position:'absolute',margin:'0',overflow:'auto',boxSizing:'border-box'});
   // Nested text may live inside a positioned card. Convert panel coordinates to
   // its actual containing block so dragging the title does not move the card.
   const r=panel.getBoundingClientRect(),parent=el.offsetParent||panel,b=parent.getBoundingClientRect();
   Object.assign(el.style,{left:(r.x-b.x-parent.clientLeft+r.width*p.x/100)+'px',top:(r.y-b.y-parent.clientTop+r.height*p.y/100)+'px',width:r.width*p.w/100+'px',height:r.height*p.h/100+'px'});
   el.style.setProperty('font-size',p.fontSize+'px','important');
   if(p.font)el.style.setProperty('font-family',`var(--design-font-${p.font})`,'important');
   if(p.color)el.style.setProperty('color',p.color,'important');
   for(const child of el.querySelectorAll('h3,p,small,time,strong,b,span')){remember(child);child.dataset.contentInherited='true';for(const property of ['font-size',...(p.font?['font-family']:[]),...(p.color?['color']:[])])child.style.setProperty(property,'inherit','important');}
  }
 }
}
