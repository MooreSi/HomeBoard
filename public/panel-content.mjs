// Stable content keys keep bin cards attached to their schedule when order changes.
const original=new WeakMap();
export function contentTargets(panel){
 if(!panel)return [];
 const heading=panel.querySelector(':scope > header h2,:scope > h2,.widgetHeading h2,.period h2');
 const body=panel.querySelector('.familyWidgetContent,#forecast,#calendar,.tickerViewport');
 const secondary=panel.querySelector('.caption,.attribution');
 const items=[...panel.querySelectorAll('[data-content-item]')].map(el=>({key:'item:'+el.dataset.contentItem,el,label:el.querySelector('h3')?.textContent||'Item'}));
 return [{key:'heading',el:heading,label:'Heading'},{key:'body',el:items.length?null:body,label:'Content'},{key:'secondary',el:secondary,label:'Secondary text'},...items].filter(x=>x.el);
}
export function applyContentLayouts(d,root=document){
 for(const el of root.querySelectorAll('[data-content-placed],[data-content-inherited]')){const style=original.get(el);if(style===null)el.removeAttribute('style');else if(style!==undefined)el.setAttribute('style',style);delete el.dataset.contentPlaced;delete el.dataset.contentInherited;}
 for(const panel of root.querySelectorAll('[data-design-panel]')){
  const placements=d?.enabled?d.contentLayouts?.[panel.dataset.designPanel]:null;
  panel.classList.toggle('hasContentLayout',!!placements&&Object.keys(placements).length>0);
  if(!placements)continue;
  for(const {key,el}of contentTargets(panel)){const p=placements[key];if(!p)continue;original.set(el,el.getAttribute('style'));el.dataset.contentPlaced=key;Object.assign(el.style,{position:'absolute',left:p.x+'%',top:p.y+'%',width:p.w+'%',height:p.h+'%',margin:'0',overflow:'auto',boxSizing:'border-box'});el.style.setProperty('font-size',p.fontSize+'px','important');for(const child of el.querySelectorAll('h3,p,small,time')){original.set(child,child.getAttribute('style'));child.dataset.contentInherited='true';child.style.setProperty('font-size','inherit','important');}}
 }
}
