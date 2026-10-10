import {validateDesign,exportDesign,importDesign,fonts,panelNames,modernDesign,designStarter,designPalettes,transformPanel} from './design.mjs';
import {api,esc} from './display.mjs';

export function setupDesignEditor(initial,dirty,theme){
 const $=id=>document.getElementById(id);
 let design=modernDesign(initial?validateDesign(initial):{...designStarter('studio'),enabled:false}),selected='calendar',orientation='landscape';
 let history=[structuredClone(design)],historyIndex=0,gesture=null,previewFrame=0,menuAnchor=null;
 const names={calendar:'Calendar',clock:'Date & time',photo:'Photos',weather:'Weather',news:'News ticker',lists:'Shared lists',chores:'Chores',routines:'Routines',meals:'Meal plan',bins:'Bin collections',countdowns:'Countdowns',notices:'Noticeboard'};
 const canvas=$('designCanvas');
 const panels=()=>orientation==='portrait'?design.portraitPanels:design.panels;
 const menu=document.createElement('div');menu.className='designContext';menu.hidden=true;menu.setAttribute('role','menu');menu.setAttribute('aria-label','Design options');document.body.append(menu);
 const typography=[['font','Body font','select',Object.keys(fonts)],['headingFont','Heading font','select',Object.keys(fonts)],['fontSize','Body size (px)','number',12,36,1],['headingSize','Heading size (px)','number',16,72,1],['fontWeight','Font weight','select',[300,400,500,600,700,800]],['lineHeight','Line height','number',1,2,.1],['letterSpacing','Letter spacing (px)','number',-1,5,.1]];
 const surfaces=[['shadow','Shadow','select',['none','soft','deep']],['gap','Panel gap (px)','number',0,40,1],['padding','Panel padding (px)','number',0,48,1],['radius','Corner radius (px)','number',0,48,1],['borderWidth','Border width (px)','number',0,4,1],['opacity','Panel opacity (%)','number',20,100,1]];
 function controls(target,list){
  for(const [key,name,type,min,max,step]of list){const label=document.createElement('label');label.textContent=name;
   const el=document.createElement(type==='select'?'select':'input');el.id='design-'+key;el.dataset.designField=key;
   if(type==='select'){for(const value of min){const option=document.createElement('option');option.value=value;option.textContent=String(value);el.append(option);}}
   else{el.type=type;el.min=min;el.max=max;el.step=step;}
   el.oninput=()=>{const value=type==='select'&&!['fontWeight'].includes(key)?el.value:Number(el.value);try{design=validateDesign({...design,[key]:value});el.setCustomValidity('');changed();}catch{el.setCustomValidity('Choose a value in the displayed range');}};label.append(el);$(target).append(label);
  }
 }
 controls('designTypography',typography);controls('designStyle',surfaces);
 for(const key of Object.keys(design.colors)){const label=document.createElement('label');label.textContent=key==='event'?'Appointment background':key[0].toUpperCase()+key.slice(1);const el=document.createElement('input');el.type='color';el.id='design-colour-'+key;el.oninput=()=>{design.colors[key]=el.value;changed();};label.append(el);$('designColours').append(label);}
 function sendPreview(){$('designPreview').contentWindow?.postMessage({type:'homeboard-design-preview',design:{...design,enabled:true},orientation},location.origin);}
 function preview(){cancelAnimationFrame(previewFrame);previewFrame=requestAnimationFrame(sendPreview);}
 window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===$('designPreview').contentWindow&&e.data?.type==='homeboard-design-preview-ready')sendPreview();});
 function paint(){
  canvas.dataset.orientation=orientation;canvas.style.setProperty('--canvas-accent',design.colors.accent);
  for(const b of canvas.querySelectorAll('[data-panel]')){const p=panels()[b.dataset.panel];
   Object.assign(b.style,{left:`calc(${p.x/12*100}% + ${p.x/12*design.gap}px)`,top:`calc(${p.y/12*100}% + ${p.y/12*design.gap}px)`,width:`calc(${p.w/12*100}% - ${(1-p.w/12)*design.gap}px)`,height:`calc(${p.h/12*100}% - ${(1-p.h/12)*design.gap}px)`,zIndex:p.layer+1});
   b.hidden=!p.visible;b.setAttribute('aria-pressed',String(b.dataset.panel===selected));b.setAttribute('aria-label',`${names[b.dataset.panel]}, column ${p.x+1}, row ${p.y+1}, width ${p.w}, height ${p.h}. Drag to move, edges to resize. Right-click for options.`);
   b.querySelector('.designPanelBadge').textContent=names[b.dataset.panel]+' · '+p.w+' × '+p.h;
  }
  $('designPanel').value=selected;const p=panels()[selected],s=design.panelStyles[selected];
  for(const [id,key]of [['designX','x'],['designY','y'],['designW','w'],['designH','h'],['designLayer','layer']])$(id).value=p[key]+(['x','y'].includes(key)?1:0);
  $('designVisible').checked=p.visible;$('panelStyleCustom').checked=s.custom;
  for(const key of ['font','fontSize','color','background','align'])$('panelStyle-'+key).value=s[key];
  $('designUndo').disabled=historyIndex===0;$('designRedo').disabled=historyIndex===history.length-1;
  const luminance=color=>{const c=color.slice(1).match(/../g).map(h=>{const v=parseInt(h,16)/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};
  const a=luminance(design.colors.text),b=luminance(design.colors.surface),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  $('designContrast').textContent=`Text contrast ${ratio.toFixed(1)}:1 · ${ratio<4.5?'Adjust text or surface colours for easier reading.':'Good contrast for ordinary text.'}`;preview();
 }
 function sync(){
  $('designEnabled').checked=design.enabled;$('designName').value=design.name;
  for(const el of document.querySelectorAll('[data-design-field]')){el.value=design[el.dataset.designField];el.setCustomValidity('');}
  for(const key of Object.keys(design.colors))$('design-colour-'+key).value=design.colors[key];
  $('designGradientFrom').value=design.backdrop.from;$('designGradientTo').value=design.backdrop.to;
  const angle=$('designGradientAngle');if(![...angle.options].some(o=>Number(o.value)===design.backdrop.angle)){angle.add(new Option(design.backdrop.angle+'°',design.backdrop.angle));}angle.value=design.backdrop.angle;
  $('designPhotoOverlay').value=design.backdrop.overlay;paint();
 }
 function changed(){
  if(JSON.stringify(design)!==JSON.stringify(history[historyIndex])){history=history.slice(0,historyIndex+1);history.push(structuredClone(design));if(history.length>100)history.shift();historyIndex=history.length-1;}
  dirty();paint();$('designStatus').textContent='Draft updated · save changes to apply to your dashboard.';
 }
 function populate(value){design=modernDesign(value?validateDesign(value):{...designStarter('studio'),enabled:false});changed();sync();}
 function select(name){selected=name;paint();}
 function closeMenu(restore=false){menu.hidden=true;if(restore)menuAnchor?.focus({preventScroll:true});}
 function propertyPanel(){closeMenu();$('designPanelDetails').open=true;$('designPanelDetails').scrollIntoView({block:'nearest',behavior:'smooth'});$('designPanel').focus();}
 function showMenu(x,y,addOnly=false,anchor=null){
  closeMenu();menu.setAttribute('role','menu');menu.setAttribute('aria-label','Design options');menuAnchor=anchor||canvas.querySelector(`[data-panel="${selected}"]`);
  const heading=document.createElement('div');heading.className='designContextHeading';heading.setAttribute('role','presentation');heading.textContent=addOnly?'Add a panel':names[selected];menu.replaceChildren(heading);
  function action(label,fn){const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.textContent=label;b.onclick=()=>{closeMenu(true);fn();};menu.append(b);}
  if(addOnly){for(const name of panelNames)action((panels()[name].visible?'✓ ':'+ ')+names[name],()=>{selected=name;if(!panels()[name].visible){panels()[name].visible=true;panels()[name].layer=Math.min(10,Math.max(...Object.values(panels()).map(p=>p.layer))+1);changed();}else paint();canvas.querySelector(`[data-panel="${name}"]`).focus();});}
  else{
   action('Panel appearance…',()=>appearanceMenu(x,y,anchor));action('Position & size…',()=>placementMenu(x,y,anchor));
   action('Fit width',()=>{const p=panels()[selected];p.x=0;p.w=12;changed();});
   action('Size: compact (3 × 3)',()=>size(3,3));action('Size: medium (4 × 4)',()=>size(4,4));action('Size: wide (8 × 4)',()=>size(8,4));
   action('Align left',()=>{panels()[selected].x=0;changed();});action('Align right',()=>{const p=panels()[selected];p.x=12-p.w;changed();});
   action('Centre horizontally',()=>{const p=panels()[selected];p.x=Math.floor((12-p.w)/2);changed();});
   action('Bring to front',()=>{const p=panels()[selected];for(const q of Object.values(panels()))if(q!==p)q.layer=Math.min(q.layer,9);p.layer=10;changed();});
   action('Send to back',()=>{for(const q of Object.values(panels()))if(q!==panels()[selected])q.layer=Math.min(10,q.layer+1);panels()[selected].layer=0;changed();});
   action('Hide panel',()=>{panels()[selected].visible=false;changed();});
   action('Add another panel…',()=>showMenu(x,y,true,anchor));action('Screen appearance…',()=>screenMenu(x,y,anchor));action('Advanced properties…',propertyPanel);
  }
  menu.hidden=false;menu.style.left='0px';menu.style.top='0px';const rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';menu.scrollTop=0;menu.querySelector('button')?.focus({preventScroll:true});
 }

 function controlsMenu(title,x,y,anchor,fields){
  closeMenu();menuAnchor=anchor||canvas.querySelector(`[data-panel="${selected}"]`);menu.setAttribute('role','dialog');menu.setAttribute('aria-label',title);
  const heading=document.createElement('div');heading.className='designContextHeading';heading.setAttribute('role','presentation');heading.textContent=title;menu.replaceChildren(heading);
  const back=document.createElement('button');back.type='button';back.textContent='‹ Back to panel options';back.onclick=()=>showMenu(x,y,false,anchor);menu.append(back);
  for(const {label:name,value,options,color,change}of fields){const label=document.createElement('label');label.textContent=name;const el=document.createElement(color?'input':'select');el.setAttribute('aria-label',name);if(color){el.type='color';el.value=value;}else{const list=[...options];if(!list.some(o=>String(Array.isArray(o)?o[0]:o)===String(value)))list.push(value);for(const option of list){const [v,text]=Array.isArray(option)?option:[option,String(option)];el.add(new Option(text,v));}el.value=String(value);}el.onchange=()=>{change(el.value);changed();sync();};label.append(el);menu.append(label);}
  const done=document.createElement('button');done.type='button';done.textContent='Done';done.onclick=()=>closeMenu(true);menu.append(done);
  menu.hidden=false;menu.style.left='0px';menu.style.top='0px';const rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';menu.scrollTop=0;menu.querySelector('select,input')?.focus({preventScroll:true});
 }
 function appearanceMenu(x,y,anchor){
  const s=design.panelStyles[selected],edit=(key,value)=>{if(!s.custom){s.color=design.colors.text;s.background=design.colors.surface;s.fontSize=design.fontSize;}s.custom=true;s[key]=value;};
  controlsMenu(names[selected]+' appearance',x,y,anchor,[
   {label:'Panel font',value:s.font,options:[['inherit','Use screen font'],...Object.keys(fonts).map(f=>[f,f[0].toUpperCase()+f.slice(1)])],change:v=>edit('font',v)},
   {label:'Panel text size',value:s.custom?s.fontSize:design.fontSize,options:Array.from({length:25},(_,i)=>i+12),change:v=>edit('fontSize',Number(v))},
   {label:'Text alignment',value:s.align,options:[['left','Left'],['center','Centre'],['right','Right']],change:v=>edit('align',v)},
   {label:'Text colour',value:s.custom?s.color:design.colors.text,color:true,change:v=>edit('color',v)},
   {label:'Panel colour',value:s.custom?s.background:design.colors.surface,color:true,change:v=>edit('background',v)},
   {label:'Style source',value:s.custom?'custom':'screen',options:[['screen','Use screen style'],['custom','Own panel style']],change:v=>s.custom=v==='custom'}
  ]);
 }
 function placementMenu(x,y,anchor){
  const p=panels()[selected];controlsMenu(names[selected]+' position & size',x,y,anchor,[
   ...[['x','Column'],['y','Row'],['w','Panel width'],['h','Panel height'],['layer','Layer']].map(([key,label])=>({label,value:p[key]+(['x','y'].includes(key)?1:0),options:Array.from({length:key==='layer'?11:12},(_,i)=>i+(key==='layer'?0:1)),change:v=>{p[key]=Number(v)-(['x','y'].includes(key)?1:0);p.x=Math.min(p.x,12-p.w);p.y=Math.min(p.y,12-p.h);}})),
   {label:'Visibility',value:p.visible?'show':'hide',options:[['show','Show panel'],['hide','Hide panel']],change:v=>p.visible=v==='show'}
  ]);
 }
 function screenMenu(x,y,anchor){
  controlsMenu('Screen appearance',x,y,anchor,[
   {label:'Colour palette',value:'current',options:[['current','Current palette'],...Object.entries(designPalettes).map(([id,p])=>[id,p.name])],change:v=>{const p=designPalettes[v];if(p){design.colors={...p.colors};design.backdrop.from=p.from;design.backdrop.to=p.to;}}},
   {label:'Background',value:design.background,options:[['solid','Solid colour'],['gradient','Gradient'],['photo','Slideshow photo']],change:v=>design.background=v},
   {label:'Gradient direction',value:design.backdrop.angle,options:[[0,'Bottom to top'],[90,'Left to right'],[135,'Diagonal'],[180,'Top to bottom'],[225,'Reverse diagonal'],[270,'Right to left']],change:v=>design.backdrop.angle=Number(v)},
   {label:'Gradient start',value:design.backdrop.from,color:true,change:v=>design.backdrop.from=v},
   {label:'Gradient end',value:design.backdrop.to,color:true,change:v=>design.backdrop.to=v},
   {label:'Screen background colour',value:design.colors.background,color:true,change:v=>design.colors.background=v},
   {label:'Body font',value:design.font,options:Object.keys(fonts),change:v=>design.font=v},
   {label:'Heading font',value:design.headingFont,options:Object.keys(fonts),change:v=>design.headingFont=v},
   ...[['radius','Corners',[0,4,8,12,16,20,24,32,48]],['gap','Panel spacing',[0,4,8,12,14,16,20,24,32,40]],['padding','Panel padding',[0,8,12,16,20,24,32,48]],['opacity','Panel opacity',[20,40,60,80,90,95,96,100]],['fontSize','Body text size',[12,14,16,18,20,24,28,32,36]],['headingSize','Heading size',[16,20,24,28,32,36,40,48,60,72]]].map(([key,label,options])=>({label,value:design[key],options,change:v=>design[key]=Number(v)}))
  ]);
 }

 function size(w,h){const p=panels()[selected];p.w=w;p.h=h;p.x=Math.min(p.x,12-w);p.y=Math.min(p.y,12-h);changed();}
 menu.onkeydown=e=>{const items=[...menu.querySelectorAll('button,select,input')];const i=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&document.activeElement.tagName==='BUTTON'&&menu.getAttribute('role')==='menu'){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}if(e.key==='Escape'){e.preventDefault();closeMenu(true);}if(e.key==='Tab'){if(menu.getAttribute('role')==='menu')closeMenu();else{e.preventDefault();items[(i+(e.shiftKey?items.length-1:1))%items.length].focus();}}};
 document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target))closeMenu();});window.addEventListener('resize',()=>closeMenu());window.addEventListener('scroll',e=>{if(e.target!==menu&&!menu.contains(e.target))closeMenu();},true);
 for(const name of panelNames){
  const b=document.createElement('button');b.type='button';b.dataset.panel=name;b.className='designPanelOverlay';b.innerHTML='<span class="designPanelBadge"></span>'+['n','ne','e','se','s','sw','w','nw'].map(edge=>`<span class="resizeHandle handle-${edge}" data-edge="${edge}" aria-hidden="true"></span>`).join('');
  b.onclick=()=>select(name);
  b.oncontextmenu=e=>{e.preventDefault();select(name);showMenu(e.clientX,e.clientY,false,b);};
  b.onkeydown=e=>{
   if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();select(name);const r=b.getBoundingClientRect();showMenu(r.left+12,r.top+24,false,b);return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selected=name;const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;panels()[name]=transformPanel(panels()[name],e.shiftKey?'se':'move',dx,dy);changed();
  };
  b.onpointerdown=e=>{if(e.button!==0||gesture)return;e.preventDefault();closeMenu();select(name);b.focus({preventScroll:true});gesture={name,initial:structuredClone(panels()[name]),clientX:e.clientX,clientY:e.clientY,mode:e.target.dataset.edge||'move',pointer:e.pointerId};b.setPointerCapture(e.pointerId);canvas.classList.add('dragging');};
  b.onpointermove=e=>{if(!gesture||gesture.name!==name||gesture.pointer!==e.pointerId)return;panels()[name]=transformPanel(gesture.initial,gesture.mode,(e.clientX-gesture.clientX)*12/(canvas.clientWidth+design.gap),(e.clientY-gesture.clientY)*12/(canvas.clientHeight+design.gap));paint();};
  b.onpointerup=e=>{if(!gesture||gesture.pointer!==e.pointerId)return;gesture=null;canvas.classList.remove('dragging');changed();};
  b.onpointercancel=()=>{if(gesture){panels()[gesture.name]=gesture.initial;gesture=null;canvas.classList.remove('dragging');paint();}};
  b.onlostpointercapture=()=>{if(gesture?.name===name)b.onpointercancel();};
  canvas.append(b);
 }
 canvas.oncontextmenu=e=>{if(e.target.closest('[data-panel]'))return;e.preventDefault();screenMenu(e.clientX,e.clientY,$('designScreenStyle'));};
 $('designAdd').onclick=()=>{const r=$('designAdd').getBoundingClientRect();showMenu(r.left,r.bottom+6,true,$('designAdd'));};
 $('designScreenStyle').onclick=()=>{const r=$('designScreenStyle').getBoundingClientRect();screenMenu(r.left,r.bottom+6,$('designScreenStyle'));};
 $('designProperties').onclick=()=>{const r=$('designProperties').getBoundingClientRect();showMenu(r.left,r.bottom+6,false,$('designProperties'));};
 $('designPanel').onchange=()=>select($('designPanel').value);$('designOrientation').onchange=()=>{orientation=$('designOrientation').value;paint();};
 $('designEnabled').onchange=()=>{design.enabled=$('designEnabled').checked;changed();};$('designName').onchange=()=>{const value=$('designName').value.trim();if(!value)return;design.name=value;changed();};
 for(const [id,key]of [['designX','x'],['designY','y'],['designW','w'],['designH','h'],['designLayer','layer']])$(id).onchange=()=>{const n=Number($(id).value)-(['x','y'].includes(key)?1:0);if(!Number.isInteger(n)||$(id).value===''){paint();return;}const p=panels()[selected];p[key]=Math.max(['w','h'].includes(key)?1:0,Math.min(key==='layer'?10:['x','y'].includes(key)?11:12,n));p.x=Math.min(p.x,12-p.w);p.y=Math.min(p.y,12-p.h);changed();};
 $('designVisible').onchange=()=>{panels()[selected].visible=$('designVisible').checked;changed();};
 $('panelStyleCustom').onchange=()=>{const s=design.panelStyles[selected];s.custom=$('panelStyleCustom').checked;if(s.custom){s.color=design.colors.text;s.background=design.colors.surface;}$('panelStyle-color').value=s.color;$('panelStyle-background').value=s.background;changed();};
 for(const key of ['font','fontSize','color','background','align'])$('panelStyle-'+key).oninput=()=>{const value=key==='fontSize'?Number($('panelStyle-'+key).value):$('panelStyle-'+key).value;if(key==='fontSize'&&(!Number.isInteger(value)||value<12||value>36))return;design.panelStyles[selected][key]=value;changed();};
 for(const [id,key,value]of [['designAlignLeft','x',0],['designAlignTop','y',0]])$(id).onclick=()=>{panels()[selected][key]=value;changed();};$('designCenter').onclick=()=>{const p=panels()[selected];p.x=Math.floor((12-p.w)/2);changed();};
 $('designUndo').onclick=()=>{if(historyIndex){design=structuredClone(history[--historyIndex]);sync();dirty();}};$('designRedo').onclick=()=>{if(historyIndex<history.length-1){design=structuredClone(history[++historyIndex]);sync();dirty();}};
 canvas.onkeydown=e=>{if(e.key==='Escape'&&gesture){panels()[gesture.name]=gesture.initial;gesture=null;canvas.classList.remove('dragging');paint();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'designRedo':'designUndo').click();}};
 for(const [id,key]of [['designGradientFrom','from'],['designGradientTo','to'],['designGradientAngle','angle'],['designPhotoOverlay','overlay']])$(id).oninput=()=>{design.backdrop[key]=['angle','overlay'].includes(key)?Number($(id).value):$(id).value;changed();};
 $('design-background').onchange=()=>{design.background=$('design-background').value;changed();};
 $('designStarters').innerHTML=['studio','family','planner','gallery'].map(id=>{const d=designStarter(id);return `<button type="button" class="designStarter" data-starter="${id}"><span class="designThumbnail" style="background:linear-gradient(135deg,${d.backdrop.from},${d.backdrop.to})">${Object.entries(d.panels).filter(([,p])=>p.visible).map(([name,p])=>`<i style="left:${p.x/12*100}%;top:${p.y/12*100}%;width:${p.w/12*100}%;height:${p.h/12*100}%;background:${d.colors.surface};color:${d.colors.text}">${name==='calendar'?'▦':name==='photo'?'◇':name==='clock'?'12:45':'≡'}</i>`).join('')}</span><strong>${esc(d.name.split(' · ')[0])}</strong><small>${esc(d.name.split(' · ')[1])}</small></button>`;}).join('');
 for(const b of $('designStarters').querySelectorAll('button'))b.onclick=()=>populate(designStarter(b.dataset.starter));
 $('designPalettes').innerHTML=Object.entries(designPalettes).map(([id,p])=>`<button type="button" data-palette="${id}"><span>${[p.colors.background,p.colors.surface,p.colors.accent,p.colors.event].map(c=>`<i style="background:${c}"></i>`).join('')}</span>${esc(p.name)}</button>`).join('');
 for(const b of $('designPalettes').querySelectorAll('button'))b.onclick=()=>{const p=designPalettes[b.dataset.palette];design.colors={...p.colors};design.backdrop.from=p.from;design.backdrop.to=p.to;changed();sync();};
 $('designReset').onclick=()=>populate(designStarter('studio'));
 $('designUseTheme').onclick=async()=>{try{const t=(await api('/api/themes')).find(t=>t.id===theme());if(!t)throw Error('Choose a dashboard theme first');const light=['homeboard','coastal','minimal','lavender','gallery','folio','portrait'].includes(t.id);design.colors={...design.colors,background:t.colors[0],surface:light?'#ffffff':t.colors[2],accent:t.colors[1],event:t.colors[2],text:light?'#26382e':'#eff6ff',muted:light?'#586b60':'#b2c5df'};design.backdrop.from=t.colors[0];design.backdrop.to=t.colors[2];changed();sync();}catch(e){$('designStatus').textContent=e.message;}};
 $('designExport').onclick=()=>{try{const url=URL.createObjectURL(new Blob([JSON.stringify(exportDesign(value()),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='homeboard-'+design.name.replace(/[^a-z\d-]/gi,'-').toLowerCase()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){$('designStatus').textContent=e.message;}};
 $('designImport').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>65536)throw Error('Design file exceeds 64 KB');populate(importDesign(JSON.parse(await file.text())));$('designStatus').textContent='Design imported as a draft · save changes to apply.';}catch(error){$('designStatus').textContent='Import failed: '+error.message;}e.target.value='';};
 function value(){design.name=$('designName').value.trim();return validateDesign(design);}
 $('designPreview').onload=sendPreview;sync();
 return {value,populate,selectedBlock:()=>({type:selected,panel:structuredClone(panels()[selected]),style:structuredClone(design.panelStyles[selected])}),applyBlock:block=>{panels()[selected]=structuredClone(block.panel);design.panelStyles[selected]=structuredClone(block.style);changed();}};
}
