// Portable, declarative designs: no executable CSS, scripts, URLs or credentials.
export const fonts={sans:'Arial, sans-serif',roboto:'Roboto, Arial, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace',rounded:'ui-rounded, "Arial Rounded MT Bold", sans-serif',humanist:'"Trebuchet MS", sans-serif',classic:'"Palatino Linotype", Palatino, serif',system:'system-ui, sans-serif'};
const basePanels=['calendar','clock','photo','weather','news'];
export const panelNames=[...basePanels,'lists','chores','routines','meals','bins','countdowns','notices'];
export const designerPanelNames=[...panelNames,'charging'];
export function panelStyle(){return {custom:false,font:'inherit',fontSize:16,color:'#ffffff',background:'#1d2735',align:'left'};}
export function upgradeDesign(value){const d=structuredClone(value||newDesign());if(d.version>=2)return d;d.version=2;for(const name of panelNames)if(!d.panels[name])d.panels[name]={x:0,y:0,w:4,h:4,layer:0,visible:false};d.portraitPanels=structuredClone(d.panels);Object.assign(d.portraitPanels,{calendar:{x:0,y:0,w:12,h:6,layer:0,visible:true},clock:{x:0,y:6,w:4,h:2,layer:0,visible:true},photo:{x:4,y:6,w:8,h:2,layer:0,visible:true},weather:{x:0,y:8,w:12,h:2,layer:0,visible:true},news:{x:0,y:10,w:12,h:2,layer:0,visible:true}});d.panelStyles=Object.fromEntries(panelNames.map(name=>[name,panelStyle()]));return d;}
export function newDesign(){return {version:1,name:'My HomeBoard',enabled:false,font:'roboto',headingFont:'roboto',fontSize:16,headingSize:30,fontWeight:400,lineHeight:1.4,letterSpacing:0,gap:16,padding:16,radius:16,borderWidth:0,opacity:95,shadow:'soft',background:'solid',colors:{background:'#10151c',surface:'#1d2735',text:'#ffffff',muted:'#b8c5d8',accent:'#8db8ff',event:'#263348'},panels:{calendar:{x:4,y:0,w:8,h:10,layer:0,visible:true},clock:{x:0,y:0,w:4,h:3,layer:1,visible:true},photo:{x:0,y:3,w:4,h:7,layer:0,visible:true},weather:{x:0,y:10,w:6,h:2,layer:0,visible:true},news:{x:6,y:10,w:6,h:2,layer:0,visible:true}}};}
function exact(value,keys,subject){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length!==keys.length||keys.some(k=>!Object.hasOwn(value,k)))throw Error('Invalid design '+subject);}
export function validateDesign(d){
 if(d===null)return null;const base=newDesign(),v2=d.version>=2;exact(d,[...Object.keys(base),...(v2?['portraitPanels','panelStyles']:[]),...(d.version>=3?['backdrop']:[]),...(d.version>=5?['panelOptions','clockLayout']:[])],'fields');
 if(![1,2,3,4,5,6].includes(d.version)||typeof d.enabled!=='boolean'||typeof d.name!=='string'||!d.name.trim()||d.name.length>60)throw Error('Invalid design name or version');
 if(!Object.hasOwn(fonts,d.font)||!Object.hasOwn(fonts,d.headingFont))throw Error('Invalid design font');
 const bounds={fontSize:[12,36],headingSize:[16,72],fontWeight:[300,800],lineHeight:[1,2],letterSpacing:[-1,5],gap:[0,40],padding:[0,48],radius:[0,48],borderWidth:[0,4],opacity:[20,100]};
 for(const [key,[min,max]]of Object.entries(bounds))if(typeof d[key]!=='number'||!Number.isFinite(d[key])||d[key]<min||d[key]>max)throw Error('Invalid design '+key);
 if(!['none','soft','deep'].includes(d.shadow)||!['solid','gradient','photo'].includes(d.background))throw Error('Invalid design style');
 exact(d.colors,Object.keys(base.colors),'colours');for(const value of Object.values(d.colors))if(typeof value!=='string'||!/^#[a-f\d]{6}$/i.test(value))throw Error('Invalid design colour');
 if(d.version>=3){exact(d.backdrop,['from','to','angle','overlay'],'backdrop');if(!/^#[a-f\d]{6}$/i.test(d.backdrop.from)||!/^#[a-f\d]{6}$/i.test(d.backdrop.to)||!Number.isInteger(d.backdrop.angle)||d.backdrop.angle<0||d.backdrop.angle>360||!Number.isInteger(d.backdrop.overlay)||d.backdrop.overlay<0||d.backdrop.overlay>90)throw Error('Invalid design backdrop');}
 const names=d.version>=6?designerPanelNames:v2?panelNames:basePanels;exact(d.panels,names,'panels');if(v2){exact(d.portraitPanels,names,'portrait panels');exact(d.panelStyles,names,'panel styles');for(const s of Object.values(d.panelStyles))validatePanelStyle(s,d.version>=4);}for(const p of [...Object.values(d.panels),...(v2?Object.values(d.portraitPanels):[])]){exact(p,['x','y','w','h','layer','visible'],'panel');if(typeof p.visible!=='boolean'||['x','y','w','h','layer'].some(k=>!Number.isInteger(p[k]))||p.x<0||p.y<0||p.w<1||p.h<1||p.x+p.w>12||p.y+p.h>12||p.layer<0||p.layer>(d.version>=5?31:10))throw Error('Invalid design panel position');}
 if(d.version>=5)validatePanelTools(d);
 return structuredClone(d);
}
export function exportDesign(d){return {format:'homeboard-design',version:1,design:validateDesign(d)};}
export function importDesign(value){exact(value,['format','version','design'],'file');if(value.format!=='homeboard-design'||value.version!==1||value.design===null)throw Error('Unsupported HomeBoard design file');return validateDesign(value.design);}
let homes,grid,themeHome;
export function applyDesign(d){
 const body=document.body,root=document.querySelector('.dashboard');if(!root)return;
 if(!d?.enabled){applyClockLayout(null);if(homes){for(const {el,parent,next}of homes){parent.insertBefore(el,next?.parentNode===parent?next:null);const home=homes.find(h=>h.el===el);if(home.style===null)el.removeAttribute('style');else el.setAttribute('style',home.style);if(el.dataset.familyPanel)el.hidden=el.dataset.familyEmpty==='true';if(home.name==='charging')el.hidden=el.dataset.chargingEnabled!=='true';delete el.dataset.designPanel;delete el.dataset.designVisible;}grid.remove();homes=null;}if(themeHome!==undefined){body.dataset.theme=themeHome;themeHome=undefined;}delete body.dataset.customDesign;delete body.dataset.designVersion;return;}
 validateDesign(d);if(body.dataset.theme!=='custom')themeHome=body.dataset.theme;body.dataset.theme='custom';body.dataset.customDesign='true';body.dataset.designVersion=String(d.version);
 if(!homes){const elements={calendar:root.querySelector('section.calendar'),clock:root.querySelector('.clockCard'),photo:root.querySelector('.photo'),weather:document.getElementById('weatherWidget'),news:document.getElementById('newsWidget'),charging:document.getElementById('chargingWidget')};for(const el of document.querySelectorAll('[data-family-panel]'))elements[el.dataset.familyPanel]=el;homes=Object.entries(elements).map(([name,el])=>({name,el,parent:el.parentNode,next:el.nextSibling,style:el.getAttribute('style')}));grid=document.createElement('div');grid.className='customDashboardGrid';root.append(grid);for(const {el}of homes)grid.append(el);}
 const c=d.colors;for(const [key,value]of Object.entries(c))root.style.setProperty('--design-'+key,value);
 for(const [key,value]of Object.entries({font:fonts[d.font],headingFont:fonts[d.headingFont],fontSize:d.fontSize+'px',headingSize:d.headingSize+'px',fontWeight:d.fontWeight,lineHeight:d.lineHeight,letterSpacing:d.letterSpacing+'px',gap:d.gap+'px',padding:d.padding+'px',radius:d.radius+'px',borderWidth:d.borderWidth+'px',surface:c.surface+Math.round(d.opacity*2.55).toString(16).padStart(2,'0'),shadow:d.shadow==='none'?'none':d.shadow==='deep'?'0 12px 36px #0008':'0 4px 18px #0003'}))root.style.setProperty('--design-'+key,value);
 const backdrop=d.backdrop||{from:c.background,to:c.accent,angle:135,overlay:45};root.style.setProperty('--design-gradient',`linear-gradient(${backdrop.angle}deg, ${backdrop.from}, ${backdrop.to})`);root.style.setProperty('--design-photo-overlay',backdrop.overlay/100);root.style.setProperty('--design-photo-shade',c.background+Math.round(backdrop.overlay*2.55).toString(16).padStart(2,'0'));
 root.dataset.designBackground=d.background;
 applyClockLayout(d);
 for(const {name,el}of homes){const crop=d.panelOptions?.[name]?.crop;el.style.clipPath=crop&&Object.values(crop).some(v=>v)?`inset(${crop.top}% ${crop.right}% ${crop.bottom}% ${crop.left}% round ${d.panelStyles[name].custom?d.panelStyles[name].radius:d.radius}px)`:"";const p=d.panels[name]||{x:0,y:0,w:4,h:4,layer:0,visible:false},portrait=d.portraitPanels?.[name]||p;el.dataset.designPanel=name;if(el.dataset.familyPanel||name==='charging')el.hidden=false;el.style.gridColumn=`${p.x+1} / span ${p.w}`;el.style.gridRow=`${p.y+1} / span ${p.h}`;el.style.setProperty('--landscape-column',`${p.x+1} / span ${p.w}`);el.style.setProperty('--landscape-row',`${p.y+1} / span ${p.h}`);el.style.zIndex=p.layer;el.dataset.designVisible=String(p.visible);el.dataset.portraitVisible=String(portrait.visible);el.style.setProperty('--portrait-column',`${portrait.x+1} / span ${portrait.w}`);el.style.setProperty('--portrait-row',`${portrait.y+1} / span ${portrait.h}`);const s=d.panelStyles?.[name];if(s?.custom){el.style.setProperty('--panel-font',s.font==='inherit'?fonts[d.font]:fonts[s.font]);el.style.setProperty('--panel-size',s.fontSize+'px');el.style.setProperty('--panel-color',s.color);el.style.setProperty('--panel-background',s.background);el.style.setProperty('--panel-align',s.align);el.dataset.panelStyled='true';if(d.version>=4){for(const [key,value]of Object.entries(s)){if(typeof value==='number')el.style.setProperty('--panel-'+key,value+(['headingSize','secondarySize','padding','radius','borderWidth','letterSpacing','contentGap'].includes(key)?'px':''));}for(const role of ['heading','secondary']){el.style.setProperty('--panel-'+role+'Font',s[role+'Font']==='inherit'?(role==='heading'?fonts[d.headingFont]:s.font==='inherit'?fonts[d.font]:fonts[s.font]):fonts[s[role+'Font']]);el.style.setProperty('--panel-'+role+'Color',s[role+'Color']);el.style.setProperty('--panel-'+role+'Align',s[role+'Align']);}for(const role of ['heading','font','secondary']){el.style.setProperty('--panel-'+role+'Italic',s[role+'Italic']?'italic':'normal');el.style.setProperty('--panel-'+role+'Decoration',s[role+'Decoration']);}el.style.setProperty('--panel-borderColor',s.borderColor);el.style.setProperty('--panel-surface',s.backgroundMode==='gradient'?`linear-gradient(${s.gradientAngle}deg,${s.background+Math.round(s.opacity*2.55).toString(16).padStart(2,'0')},${s.gradientTo+Math.round(s.opacity*2.55).toString(16).padStart(2,'0')})`:s.background+Math.round(s.opacity*2.55).toString(16).padStart(2,'0'));el.style.setProperty('--panel-shadow',s.shadow==='deep'?'0 12px 36px #0008':s.shadow==='soft'?'0 4px 18px #0003':'none');el.dataset.panelHeading=String(s.showHeading);el.dataset.panelOverflow=s.overflow;el.dataset.panelVertical=s.verticalAlign;}}else delete el.dataset.panelStyled;}
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
export function modernDesign(value){const d=upgradeDesign(value||newDesign());if(d.version>=3)return d;d.version=3;d.backdrop={from:d.colors.background,to:d.colors.accent,angle:135,overlay:45};return d;}
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

export function creativePanelStyle(d,old=panelStyle()){
 const styled=old.custom;return {...old,headingFont:styled?old.font:'inherit',secondaryFont:styled?old.font:'inherit',headingAlign:old.align,secondaryAlign:old.align,headingSize:styled?old.fontSize:Math.round(d.headingSize*.75),secondarySize:styled?old.fontSize:12,headingWeight:600,fontWeight:400,secondaryWeight:400,headingItalic:false,fontItalic:false,secondaryItalic:false,headingDecoration:'none',fontDecoration:'none',secondaryDecoration:'none',headingColor:styled?old.color:d.colors.text,secondaryColor:styled?old.color:d.colors.muted,lineHeight:d.lineHeight,letterSpacing:d.letterSpacing,padding:d.padding,radius:d.radius,borderWidth:d.borderWidth,borderColor:d.colors.accent,opacity:100,shadow:d.shadow,verticalAlign:'top',showHeading:true,contentGap:10,overflow:'scroll',backgroundMode:'solid',gradientTo:d.colors.event,gradientAngle:135,locked:false};
}
export function validatePanelStyle(s,rich=Object.hasOwn(s||{},'headingSize')){
 const sample=rich?creativePanelStyle(newDesign()):panelStyle();exact(s,Object.keys(sample),'panel style');
 const color=v=>typeof v==='string'&&/^#[a-f\d]{6}$/i.test(v),font=v=>['inherit',...Object.keys(fonts)].includes(v);
 if(typeof s.custom!=='boolean'||!font(s.font)||!Number.isInteger(s.fontSize)||s.fontSize<(rich?8:12)||s.fontSize>(rich?72:36)||!color(s.color)||!color(s.background)||!['left','center','right'].includes(s.align))throw Error('Invalid design panel style');
 if(rich){for(const [key,[min,max]]of Object.entries({headingSize:[8,96],secondarySize:[8,72],headingWeight:[300,900],fontWeight:[300,900],secondaryWeight:[300,900],lineHeight:[.8,2.5],letterSpacing:[-2,8],padding:[0,48],radius:[0,48],borderWidth:[0,8],opacity:[0,100],contentGap:[0,40],gradientAngle:[0,360]}))if(typeof s[key]!=='number'||!Number.isFinite(s[key])||s[key]<min||s[key]>max)throw Error('Invalid design panel style '+key);
  for(const key of ['headingSize','secondarySize','headingWeight','fontWeight','secondaryWeight','padding','radius','borderWidth','opacity','contentGap','gradientAngle'])if(!Number.isInteger(s[key]))throw Error('Invalid design panel style '+key);
  for(const key of ['headingAlign','secondaryAlign'])if(!['left','center','right'].includes(s[key]))throw Error('Invalid design panel style alignment');
  for(const key of ['headingFont','secondaryFont'])if(!font(s[key]))throw Error('Invalid design panel style font');
  for(const key of ['headingColor','secondaryColor','borderColor','gradientTo'])if(!color(s[key]))throw Error('Invalid design panel style colour');
  for(const key of ['headingItalic','fontItalic','secondaryItalic','showHeading','locked'])if(typeof s[key]!=='boolean')throw Error('Invalid design panel style '+key);
  for(const key of ['headingDecoration','fontDecoration','secondaryDecoration'])if(!['none','underline','line-through'].includes(s[key]))throw Error('Invalid design panel style decoration');
  if(!['top','center','bottom'].includes(s.verticalAlign)||!['scroll','clip'].includes(s.overflow)||!['none','soft','deep'].includes(s.shadow)||!['solid','gradient'].includes(s.backgroundMode))throw Error('Invalid design panel style appearance');
 }return structuredClone(s);
}
export function creativeDesign(value){const d=modernDesign(validateDesign(value));if(d.version>=4)return d;d.version=4;for(const name of panelNames)d.panelStyles[name]=creativePanelStyle(d,d.panelStyles[name]);return validateDesign(d);}
export function designFromTheme(t){
 if(!t||typeof t.name!=='string'||!Array.isArray(t.colors)||t.colors.length!==3||t.colors.some(c=>!/^#[a-f\d]{6}$/i.test(c))||!['split','calendar','backdrop','gallery','wall','rail','glass','editorial','poster','showcase'].includes(t.layout))throw Error('Invalid built-in theme');
 const d=designStarter(t.layout==='gallery'?'gallery':'studio');d.name=(t.name+' · my design').slice(0,60);const light=['homeboard','coastal','minimal','lavender','gallery','folio','portrait'].includes(t.id);
 d.colors={background:t.colors[0],surface:light?'#ffffff':t.colors[2],text:light?'#26382e':'#eff6ff',muted:light?'#586b60':'#b2c5df',accent:t.colors[1],event:t.colors[2]};d.backdrop={from:t.colors[0],to:t.colors[2],angle:135,overlay:45};d.background=['backdrop','glass'].includes(t.layout)?'photo':['wall','showcase'].includes(t.layout)?'gradient':'solid';d.font='system';d.headingFont=['homeboard','gallery','folio','portrait'].includes(t.id)?'serif':'system';
 const panel=(x,y,w,h)=>({x,y,w,h,layer:0,visible:true});for(const ps of [d.panels,d.portraitPanels])for(const name of panelNames)ps[name].visible=false;
 if(['calendar','wall','editorial'].includes(t.layout))Object.assign(d.panels,{calendar:panel(0,2,12,10),clock:panel(0,0,12,2)});
 else if(t.layout==='gallery')Object.assign(d.panels,{photo:panel(0,0,7,10),clock:panel(0,10,7,2),calendar:panel(7,0,5,12)});
 else if(['rail','showcase'].includes(t.layout))Object.assign(d.panels,{clock:panel(0,0,4,3),photo:panel(0,3,4,9),calendar:panel(4,0,8,12)});
 else if(t.layout==='poster')Object.assign(d.panels,{photo:panel(0,0,12,4),clock:panel(0,4,12,2),calendar:panel(0,6,12,6)});
 else Object.assign(d.panels,{calendar:panel(0,0,8,12),clock:panel(8,0,4,3),photo:panel(8,3,4,9)});
 Object.assign(d.portraitPanels,{photo:panel(0,0,12,4),clock:panel(0,4,12,2),calendar:panel(0,6,12,6)});if(['calendar','wall','editorial'].includes(t.layout))Object.assign(d.portraitPanels,{photo:{...d.portraitPanels.photo,visible:false},clock:panel(0,0,12,2),calendar:panel(0,2,12,10)});
 return creativeDesign(d);
}

export const compactFields=['headingSize','fontSize','secondarySize','padding','contentGap','lineHeight','radius'];
export const clockItemNames={time:'Time',analog:'Analog clock',date:'Date',location:'Location / timezone',seconds:'Seconds'};
export function defaultClockLayout(){return {custom:false,items:{time:{visible:true,x:5,y:5,w:75,h:35},analog:{visible:true,x:5,y:5,w:35,h:40},date:{visible:true,x:5,y:45,w:90,h:25},location:{visible:true,x:5,y:75,w:90,h:20},seconds:{visible:false,x:82,y:10,w:15,h:25}}};}
export function panelToolsDesign(value){const d=creativeDesign(value);if(d.version>=5)return d;d.version=5;d.panelOptions=Object.fromEntries(panelNames.map(n=>[n,{crop:{top:0,right:0,bottom:0,left:0},compactBackup:null}]));d.clockLayout=defaultClockLayout();return validateDesign(d);}
function validatePanelTools(d){
 exact(d.panelOptions,d.version>=6?designerPanelNames:panelNames,'panel options');for(const o of Object.values(d.panelOptions)){exact(o,['crop','compactBackup'],'panel options');exact(o.crop,['top','right','bottom','left'],'crop');if(Object.values(o.crop).some(v=>!Number.isInteger(v)||v<0||v>90)||o.crop.top+o.crop.bottom>90||o.crop.left+o.crop.right>90)throw Error('Invalid design crop');if(o.compactBackup!==null){exact(o.compactBackup,compactFields,'compact backup');const sample=creativePanelStyle(d);Object.assign(sample,o.compactBackup);validatePanelStyle(sample,true);}}
 exact(d.clockLayout,['custom','items'],'clock layout');if(typeof d.clockLayout.custom!=='boolean')throw Error('Invalid design clock layout');exact(d.clockLayout.items,Object.keys(clockItemNames),'clock items');for(const item of Object.values(d.clockLayout.items)){exact(item,['visible','x','y','w','h'],'clock item');if(typeof item.visible!=='boolean'||['x','y','w','h'].some(k=>!Number.isInteger(item[k]))||item.x<0||item.y<0||item.w<5||item.h<5||item.x+item.w>100||item.y+item.h>100)throw Error('Invalid design clock item');}
}
export function reorderPanel(panels,name,direction){
 if(!Object.hasOwn(panels,name)||!['front','back','forward','backward'].includes(direction))throw Error('Invalid panel layer action');const ordered=Object.keys(panels).sort((a,b)=>panels[a].layer-panels[b].layer),index=ordered.indexOf(name);ordered.splice(index,1);ordered.splice(direction==='front'?ordered.length:direction==='back'?0:Math.max(0,Math.min(ordered.length,index+(direction==='forward'?1:-1))),0,name);const result=structuredClone(panels);ordered.forEach((key,i)=>result[key].layer=i);return result;
}
export function transformCrop(crop,edge,dx,dy){const c={...crop},clamp=(v,max)=>Math.max(0,Math.min(max,Math.round(v)));if(edge.includes('w'))c.left=clamp(c.left+dx,90-c.right);if(edge.includes('e'))c.right=clamp(c.right-dx,90-c.left);if(edge.includes('n'))c.top=clamp(c.top+dy,90-c.bottom);if(edge.includes('s'))c.bottom=clamp(c.bottom-dy,90-c.top);return c;}
let clockHomes;
function applyClockLayout(d){
 const card=document.querySelector('.clockCard');if(!card)return;
 if(!d?.clockLayout?.custom){if(clockHomes){for(const {el,parent,next,style}of clockHomes){parent.insertBefore(el,next?.parentNode===parent?next:null);if(style===null)el.removeAttribute('style');else el.setAttribute('style',style);delete el.dataset.clockItem;delete el.dataset.clockVisible;}clockHomes=null;}delete document.body.dataset.clockLayout;return;}
 if(!clockHomes)clockHomes=['.clockFace','#analog','#clockDate','#clockZone','#clockSeconds'].map(selector=>{const el=card.querySelector(selector);return {el,parent:el.parentNode,next:el.nextSibling,style:el.getAttribute('style')};});
 document.body.dataset.clockLayout='custom';card.append(document.getElementById('clockSeconds'));
 for(const {el}of clockHomes){const name=el.id==='analog'?'analog':el.classList.contains('clockFace')?'time':el.id==='clockDate'?'date':el.id==='clockZone'?'location':'seconds',p=d.clockLayout.items[name];el.dataset.clockItem=name;el.dataset.clockVisible=String(p.visible);el.style.setProperty('--clock-x',p.x+'%');el.style.setProperty('--clock-y',p.y+'%');el.style.setProperty('--clock-w',p.w+'%');el.style.setProperty('--clock-h',p.h+'%');el.style.setProperty('--clock-w-number',p.w);el.style.setProperty('--clock-h-number',p.h);}
}

export function chargingDesign(value){const d=panelToolsDesign(value);if(d.version>=6)return d;d.version=6;d.panels.charging={x:8,y:8,w:4,h:4,layer:1,visible:false};d.portraitPanels.charging={x:0,y:9,w:12,h:3,layer:1,visible:false};d.panelStyles.charging=creativePanelStyle(d);d.panelOptions.charging={crop:{top:0,right:0,bottom:0,left:0},compactBackup:null};return validateDesign(d);}
