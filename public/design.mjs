// Portable, declarative designs: no executable CSS, scripts, URLs or credentials.
export const fonts={sans:'Arial, sans-serif',roboto:'Roboto, Arial, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace',rounded:'ui-rounded, "Arial Rounded MT Bold", sans-serif',humanist:'"Trebuchet MS", sans-serif',classic:'"Palatino Linotype", Palatino, serif',system:'system-ui, sans-serif'};
const basePanels=['calendar','clock','photo','weather','news'];
export const panelNames=[...basePanels,'lists','chores','routines','meals','bins','countdowns','notices'];
export function panelStyle(){return {custom:false,font:'inherit',fontSize:16,color:'#ffffff',background:'#1d2735',align:'left'};}
export function upgradeDesign(value){const d=structuredClone(value||newDesign());if(d.version>=2)return d;d.version=2;for(const name of panelNames)if(!d.panels[name])d.panels[name]={x:0,y:0,w:4,h:4,layer:0,visible:false};d.portraitPanels=structuredClone(d.panels);Object.assign(d.portraitPanels,{calendar:{x:0,y:0,w:12,h:6,layer:0,visible:true},clock:{x:0,y:6,w:4,h:2,layer:0,visible:true},photo:{x:4,y:6,w:8,h:2,layer:0,visible:true},weather:{x:0,y:8,w:12,h:2,layer:0,visible:true},news:{x:0,y:10,w:12,h:2,layer:0,visible:true}});d.panelStyles=Object.fromEntries(panelNames.map(name=>[name,panelStyle()]));return d;}
export function newDesign(){return {version:1,name:'My HomeBoard',enabled:false,font:'roboto',headingFont:'roboto',fontSize:16,headingSize:30,fontWeight:400,lineHeight:1.4,letterSpacing:0,gap:16,padding:16,radius:16,borderWidth:0,opacity:95,shadow:'soft',background:'solid',colors:{background:'#10151c',surface:'#1d2735',text:'#ffffff',muted:'#b8c5d8',accent:'#8db8ff',event:'#263348'},panels:{calendar:{x:4,y:0,w:8,h:10,layer:0,visible:true},clock:{x:0,y:0,w:4,h:3,layer:1,visible:true},photo:{x:0,y:3,w:4,h:7,layer:0,visible:true},weather:{x:0,y:10,w:6,h:2,layer:0,visible:true},news:{x:6,y:10,w:6,h:2,layer:0,visible:true}}};}
function exact(value,keys,subject){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error('Invalid design '+subject);}
export function validateDesign(d){
 if(d===null)return null;const base=newDesign(),v2=d.version>=2;exact(d,[...Object.keys(base),...(v2?['portraitPanels','panelStyles']:[]),...(d.version===3?['backdrop']:[])],'fields');
 if(![1,2,3].includes(d.version)||typeof d.enabled!=='boolean'||typeof d.name!=='string'||!d.name.trim()||d.name.length>60)throw Error('Invalid design name or version');
 if(!Object.hasOwn(fonts,d.font)||!Object.hasOwn(fonts,d.headingFont))throw Error('Invalid design font');
 const bounds={fontSize:[12,36],headingSize:[16,72],fontWeight:[300,800],lineHeight:[1,2],letterSpacing:[-1,5],gap:[0,40],padding:[0,48],radius:[0,48],borderWidth:[0,4],opacity:[20,100]};
 for(const [key,[min,max]]of Object.entries(bounds))if(typeof d[key]!=='number'||!Number.isFinite(d[key])||d[key]<min||d[key]>max)throw Error('Invalid design '+key);
 if(!['none','soft','deep'].includes(d.shadow)||!['solid','gradient','photo'].includes(d.background))throw Error('Invalid design style');
 exact(d.colors,Object.keys(base.colors),'colours');for(const value of Object.values(d.colors))if(typeof value!=='string'||!/^#[a-f\d]{6}$/i.test(value))throw Error('Invalid design colour');
 if(d.version===3){exact(d.backdrop,['from','to','angle','overlay'],'backdrop');if(!/^#[a-f\d]{6}$/i.test(d.backdrop.from)||!/^#[a-f\d]{6}$/i.test(d.backdrop.to)||!Number.isInteger(d.backdrop.angle)||d.backdrop.angle<0||d.backdrop.angle>360||!Number.isInteger(d.backdrop.overlay)||d.backdrop.overlay<0||d.backdrop.overlay>90)throw Error('Invalid design backdrop');}
 const names=v2?panelNames:basePanels;exact(d.panels,names,'panels');if(v2){exact(d.portraitPanels,names,'portrait panels');exact(d.panelStyles,names,'panel styles');for(const s of Object.values(d.panelStyles)){exact(s,['custom','font','fontSize','color','background','align'],'panel style');if(typeof s.custom!=='boolean'||!['inherit',...Object.keys(fonts)].includes(s.font)||!Number.isInteger(s.fontSize)||s.fontSize<12||s.fontSize>36||!/^#[a-f\d]{6}$/i.test(s.color)||!/^#[a-f\d]{6}$/i.test(s.background)||!['left','center','right'].includes(s.align))throw Error('Invalid design panel style');}}for(const p of [...Object.values(d.panels),...(v2?Object.values(d.portraitPanels):[])]){exact(p,['x','y','w','h','layer','visible'],'panel');if(typeof p.visible!=='boolean'||['x','y','w','h','layer'].some(k=>!Number.isInteger(p[k]))||p.x<0||p.y<0||p.w<1||p.h<1||p.x+p.w>12||p.y+p.h>12||p.layer<0||p.layer>10)throw Error('Invalid design panel position');}
 return structuredClone(d);
}
export function exportDesign(d){return {format:'homeboard-design',version:1,design:validateDesign(d)};}
export function importDesign(value){exact(value,['format','version','design'],'file');if(value.format!=='homeboard-design'||value.version!==1||value.design===null)throw Error('Unsupported HomeBoard design file');return validateDesign(value.design);}
let homes,grid,themeHome;
export function applyDesign(d){
 const body=document.body,root=document.querySelector('.dashboard');if(!root)return;
 if(!d?.enabled){if(homes){for(const {el,parent,next}of homes){parent.insertBefore(el,next?.parentNode===parent?next:null);const home=homes.find(h=>h.el===el);if(home.style===null)el.removeAttribute('style');else el.setAttribute('style',home.style);if(el.dataset.familyPanel)el.hidden=el.dataset.familyEmpty==='true';delete el.dataset.designPanel;delete el.dataset.designVisible;}grid.remove();homes=null;}if(themeHome!==undefined){body.dataset.theme=themeHome;themeHome=undefined;}delete body.dataset.customDesign;delete body.dataset.designVersion;return;}
 validateDesign(d);if(body.dataset.theme!=='custom')themeHome=body.dataset.theme;body.dataset.theme='custom';body.dataset.customDesign='true';body.dataset.designVersion=String(d.version);
 if(!homes){const elements={calendar:root.querySelector('section.calendar'),clock:root.querySelector('.clockCard'),photo:root.querySelector('.photo'),weather:document.getElementById('weatherWidget'),news:document.getElementById('newsWidget')};for(const el of document.querySelectorAll('[data-family-panel]'))elements[el.dataset.familyPanel]=el;homes=Object.entries(elements).map(([name,el])=>({name,el,parent:el.parentNode,next:el.nextSibling,style:el.getAttribute('style')}));grid=document.createElement('div');grid.className='customDashboardGrid';root.append(grid);for(const {el}of homes)grid.append(el);}
 const c=d.colors;for(const [key,value]of Object.entries(c))root.style.setProperty('--design-'+key,value);
 for(const [key,value]of Object.entries({font:fonts[d.font],headingFont:fonts[d.headingFont],fontSize:d.fontSize+'px',headingSize:d.headingSize+'px',fontWeight:d.fontWeight,lineHeight:d.lineHeight,letterSpacing:d.letterSpacing+'px',gap:d.gap+'px',padding:d.padding+'px',radius:d.radius+'px',borderWidth:d.borderWidth+'px',surface:c.surface+Math.round(d.opacity*2.55).toString(16).padStart(2,'0'),shadow:d.shadow==='none'?'none':d.shadow==='deep'?'0 12px 36px #0008':'0 4px 18px #0003'}))root.style.setProperty('--design-'+key,value);
 const backdrop=d.backdrop||{from:c.background,to:c.accent,angle:135,overlay:45};root.style.setProperty('--design-gradient',`linear-gradient(${backdrop.angle}deg, ${backdrop.from}, ${backdrop.to})`);root.style.setProperty('--design-photo-overlay',backdrop.overlay/100);root.style.setProperty('--design-photo-shade',c.background+Math.round(backdrop.overlay*2.55).toString(16).padStart(2,'0'));
 root.dataset.designBackground=d.background;
 for(const {name,el}of homes){const p=d.panels[name]||{x:0,y:0,w:4,h:4,layer:0,visible:false},portrait=d.portraitPanels?.[name]||p;el.dataset.designPanel=name;if(el.dataset.familyPanel)el.hidden=false;el.style.gridColumn=`${p.x+1} / span ${p.w}`;el.style.gridRow=`${p.y+1} / span ${p.h}`;el.style.setProperty('--landscape-column',`${p.x+1} / span ${p.w}`);el.style.setProperty('--landscape-row',`${p.y+1} / span ${p.h}`);el.style.zIndex=p.layer;el.dataset.designVisible=String(p.visible);el.dataset.portraitVisible=String(portrait.visible);el.style.setProperty('--portrait-column',`${portrait.x+1} / span ${portrait.w}`);el.style.setProperty('--portrait-row',`${portrait.y+1} / span ${portrait.h}`);const s=d.panelStyles?.[name];if(s?.custom){el.style.setProperty('--panel-font',s.font==='inherit'?fonts[d.font]:fonts[s.font]);el.style.setProperty('--panel-size',s.fontSize+'px');el.style.setProperty('--panel-color',s.color);el.style.setProperty('--panel-background',s.background);el.style.setProperty('--panel-align',s.align);el.dataset.panelStyled='true';}else delete el.dataset.panelStyled;}
}

// Integer grid geometry is shared by mouse, touch, keyboard and exact controls.
export function transformPanel(panel,mode,dx,dy){
 const p={...panel},clamp=(v,min,max)=>Math.max(min,Math.min(max,Math.round(v)));
 dx=Math.round(dx);dy=Math.round(dy);
 if(mode==='move'){p.x=clamp(p.x+dx,0,12-p.w);p.y=clamp(p.y+dy,0,12-p.h);return p;}
 if(mode.includes('e'))p.w=clamp(p.w+dx,1,12-p.x);
 if(mode.includes('s'))p.h=clamp(p.h+dy,1,12-p.y);
 if(mode.includes('w')){const right=p.x+p.w;p.x=clamp(p.x+dx,0,right-1);p.w=right-p.x;}
 if(mode.includes('n')){const bottom=p.y+p.h;p.y=clamp(p.y+dy,0,bottom-1);p.h=bottom-p.y;}
 return p;
}
export const designPalettes={
 midnight:{name:'Midnight blue',colors:{background:'#0b1424',surface:'#16243a',text:'#eff6ff',muted:'#b2c5df',accent:'#66d9ed',event:'#223751'},from:'#0b1424',to:'#233d58'},
 sage:{name:'Soft sage',colors:{background:'#eff2e9',surface:'#ffffff',text:'#26382e',muted:'#586b60',accent:'#42654d',event:'#e3edde'},from:'#eff2e9',to:'#d2e1db'},
 terracotta:{name:'Warm terracotta',colors:{background:'#f7eee6',surface:'#fffaf5',text:'#44352e',muted:'#796459',accent:'#a04b36',event:'#f0dfd3'},from:'#f7eee6',to:'#e7c9b8'},
 aurora:{name:'Northern lights',colors:{background:'#0b2528',surface:'#16353a',text:'#e8fcf7',muted:'#afceca',accent:'#75e0c0',event:'#234a50'},from:'#0b2528',to:'#273458'},
 lavender:{name:'Lavender mist',colors:{background:'#f3eff9',surface:'#ffffff',text:'#3d3154',muted:'#726383',accent:'#715594',event:'#eae1f5'},from:'#f3eff9',to:'#dfd8ed'}
};
export function modernDesign(value){const d=upgradeDesign(value||newDesign());if(d.version===3)return d;d.version=3;d.backdrop={from:d.colors.background,to:d.colors.accent,angle:135,overlay:45};return d;}
export function designStarter(id){
 if(!['studio','family','planner','gallery'].includes(id))throw Error('Unknown design starter');
 const d=modernDesign(newDesign()),palette=designPalettes[id==='family'?'sage':id==='planner'?'terracotta':'midnight'];
 d.name={studio:'Studio · a clear day',family:'Family · home in sync',planner:'Planner · room to focus',gallery:'Gallery · moments & plans'}[id];d.enabled=true;d.background='gradient';d.colors={...palette.colors};d.backdrop={from:palette.from,to:palette.to,angle:135,overlay:45};d.gap=14;d.padding=20;d.radius=20;d.opacity=96;d.headingSize=28;d.font='system';d.headingFont='system';
 const panel=(x,y,w,h)=>({x,y,w,h,layer:0,visible:true});
 for(const ps of [d.panels,d.portraitPanels])for(const n of panelNames)ps[n].visible=false;
 const layouts={studio:{clock:panel(0,0,4,3),photo:panel(0,3,4,6),weather:panel(0,9,4,3),calendar:panel(4,0,8,11),news:panel(4,11,8,1)},family:{clock:panel(0,0,4,2),lists:panel(0,2,4,5),chores:panel(0,7,4,5),calendar:panel(4,0,8,9),meals:panel(4,9,5,3),bins:panel(9,9,3,3)},planner:{calendar:panel(0,0,9,12),clock:panel(9,0,3,3),photo:panel(9,3,3,6),weather:panel(9,9,3,3)},gallery:{photo:panel(0,0,7,10),clock:panel(0,10,7,2),calendar:panel(7,0,5,12)}};
 Object.assign(d.panels,layouts[id]);
 if(id==='family')Object.assign(d.portraitPanels,{clock:panel(0,0,12,2),calendar:panel(0,2,12,5),lists:panel(0,7,6,3),chores:panel(6,7,6,3),meals:panel(0,10,8,2),bins:panel(8,10,4,2)});
 else if(id==='gallery')Object.assign(d.portraitPanels,{photo:panel(0,0,12,5),clock:panel(0,5,12,2),calendar:panel(0,7,12,5)});
 else Object.assign(d.portraitPanels,{clock:panel(0,0,12,2),calendar:panel(0,2,12,6),photo:panel(0,8,6,3),weather:panel(6,8,6,3),news:panel(0,11,12,1)});
 return validateDesign(d);
}
