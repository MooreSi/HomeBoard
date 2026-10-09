// Portable, declarative designs: no executable CSS, scripts, URLs or credentials.
export const fonts={sans:'Arial, sans-serif',roboto:'Roboto, Arial, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace',rounded:'ui-rounded, "Arial Rounded MT Bold", sans-serif',humanist:'"Trebuchet MS", sans-serif',classic:'"Palatino Linotype", Palatino, serif',system:'system-ui, sans-serif'};
export const panelNames=['calendar','clock','photo','weather','news'];
export function newDesign(){return {version:1,name:'My HomeBoard',enabled:false,font:'roboto',headingFont:'roboto',fontSize:16,headingSize:30,fontWeight:400,lineHeight:1.4,letterSpacing:0,gap:16,padding:16,radius:16,borderWidth:0,opacity:95,shadow:'soft',background:'solid',colors:{background:'#10151c',surface:'#1d2735',text:'#ffffff',muted:'#b8c5d8',accent:'#8db8ff',event:'#263348'},panels:{calendar:{x:4,y:0,w:8,h:10,layer:0,visible:true},clock:{x:0,y:0,w:4,h:3,layer:1,visible:true},photo:{x:0,y:3,w:4,h:7,layer:0,visible:true},weather:{x:0,y:10,w:6,h:2,layer:0,visible:true},news:{x:6,y:10,w:6,h:2,layer:0,visible:true}}};}
function exact(value,keys,subject){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error('Invalid design '+subject);}
export function validateDesign(d){
 if(d===null)return null;const base=newDesign();exact(d,Object.keys(base),'fields');
 if(d.version!==1||typeof d.enabled!=='boolean'||typeof d.name!=='string'||!d.name.trim()||d.name.length>60)throw Error('Invalid design name or version');
 if(!Object.hasOwn(fonts,d.font)||!Object.hasOwn(fonts,d.headingFont))throw Error('Invalid design font');
 const bounds={fontSize:[12,36],headingSize:[16,72],fontWeight:[300,800],lineHeight:[1,2],letterSpacing:[-1,5],gap:[0,40],padding:[0,48],radius:[0,48],borderWidth:[0,4],opacity:[20,100]};
 for(const [key,[min,max]]of Object.entries(bounds))if(typeof d[key]!=='number'||!Number.isFinite(d[key])||d[key]<min||d[key]>max)throw Error('Invalid design '+key);
 if(!['none','soft','deep'].includes(d.shadow)||!['solid','gradient','photo'].includes(d.background))throw Error('Invalid design style');
 exact(d.colors,Object.keys(base.colors),'colours');for(const value of Object.values(d.colors))if(typeof value!=='string'||!/^#[a-f\d]{6}$/i.test(value))throw Error('Invalid design colour');
 exact(d.panels,panelNames,'panels');for(const p of Object.values(d.panels)){exact(p,['x','y','w','h','layer','visible'],'panel');if(typeof p.visible!=='boolean'||['x','y','w','h','layer'].some(k=>!Number.isInteger(p[k]))||p.x<0||p.y<0||p.w<1||p.h<1||p.x+p.w>12||p.y+p.h>12||p.layer<0||p.layer>10)throw Error('Invalid design panel position');}
 return structuredClone(d);
}
export function exportDesign(d){return {format:'homeboard-design',version:1,design:validateDesign(d)};}
export function importDesign(value){exact(value,['format','version','design'],'file');if(value.format!=='homeboard-design'||value.version!==1||value.design===null)throw Error('Unsupported HomeBoard design file');return validateDesign(value.design);}
let homes,grid;
export function applyDesign(d){
 const body=document.body,root=document.querySelector('.dashboard');if(!root)return;
 if(!d?.enabled){if(homes){for(const {el,parent,next}of homes){parent.insertBefore(el,next?.parentNode===parent?next:null);const home=homes.find(h=>h.el===el);if(home.style===null)el.removeAttribute('style');else el.setAttribute('style',home.style);delete el.dataset.designPanel;delete el.dataset.designVisible;}grid.remove();homes=null;}delete body.dataset.customDesign;return;}
 validateDesign(d);body.dataset.customDesign='true';
 if(!homes){const elements={calendar:root.querySelector('section.calendar'),clock:root.querySelector('.clockCard'),photo:root.querySelector('.photo'),weather:document.getElementById('weatherWidget'),news:document.getElementById('newsWidget')};homes=Object.entries(elements).map(([name,el])=>({name,el,parent:el.parentNode,next:el.nextSibling,style:el.getAttribute('style')}));grid=document.createElement('div');grid.className='customDashboardGrid';root.append(grid);for(const {el}of homes)grid.append(el);}
 const c=d.colors;for(const [key,value]of Object.entries(c))root.style.setProperty('--design-'+key,value);
 for(const [key,value]of Object.entries({font:fonts[d.font],headingFont:fonts[d.headingFont],fontSize:d.fontSize+'px',headingSize:d.headingSize+'px',fontWeight:d.fontWeight,lineHeight:d.lineHeight,letterSpacing:d.letterSpacing+'px',gap:d.gap+'px',padding:d.padding+'px',radius:d.radius+'px',borderWidth:d.borderWidth+'px',surface:c.surface+Math.round(d.opacity*2.55).toString(16).padStart(2,'0'),shadow:d.shadow==='none'?'none':d.shadow==='deep'?'0 12px 36px #0008':'0 4px 18px #0003'}))root.style.setProperty('--design-'+key,value);
 root.dataset.designBackground=d.background;
 for(const {name,el}of homes){const p=d.panels[name];el.dataset.designPanel=name;el.style.gridColumn=`${p.x+1} / span ${p.w}`;el.style.gridRow=`${p.y+1} / span ${p.h}`;el.style.zIndex=p.layer;el.dataset.designVisible=String(p.visible);}
}
