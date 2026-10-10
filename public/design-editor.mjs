import {validateDesign,exportDesign,importDesign,fonts,designerPanelNames as panelNames,designStarter,designPalettes,transformPanel,chargingDesign as editorDesign,creativePanelStyle,designFromTheme,reorderPanel,transformCrop,compactFields,clockItemNames,defaultClockLayout} from './design.mjs';
import {api,esc} from './display.mjs';

export function setupDesignEditor(initial,dirty,theme){
 const $=id=>document.getElementById(id);
 let design=editorDesign(initial?validateDesign(initial):{...designStarter('studio'),enabled:false}),selected='calendar',orientation='landscape';
 let history=[structuredClone(design)],historyIndex=0,gesture=null,previewFrame=0,menuAnchor=null,styleClipboard=null,themeSources=[],tool=null,clockSelected='time';
 const names={calendar:'Calendar',clock:'Date & time',photo:'Photos',weather:'Weather',news:'News ticker',lists:'Shared lists',chores:'Chores',routines:'Routines',meals:'Meal plan',bins:'Bin collections',countdowns:'Countdowns',notices:'Noticeboard',charging:'Smart charging'};
 const canvas=$('designCanvas');
 const toolHint=document.createElement('div');toolHint.className='designToolHint';toolHint.hidden=true;canvas.before(toolHint);
 function finishTool(){tool=null;paint();}
 function toolButton(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;menu.append(b);menu.style.top=Math.max(8,Math.min(parseFloat(menu.style.top)||8,innerHeight-menu.getBoundingClientRect().height-8))+'px';}
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
 function panelRect(name){const p=panels()[name];return {x:(canvas.clientWidth+design.gap)*p.x/12,y:(canvas.clientHeight+design.gap)*p.y/12,w:(canvas.clientWidth+design.gap)*p.w/12-design.gap,h:(canvas.clientHeight+design.gap)*p.h/12-design.gap};}
 function paint(){
  canvas.dataset.tool=tool?.kind||'';toolHint.hidden=!tool;if(tool){toolHint.replaceChildren(document.createTextNode(tool.kind==='crop'?'Crop mode · drag edges to trim; reset crop restores hidden content. ':'Date/time items · drag to move, edges to resize; arrows move, Shift + arrows resize. '));const done=document.createElement('button');done.type='button';done.textContent='Done editing';done.onclick=finishTool;toolHint.append(done);}
  canvas.dataset.orientation=orientation;canvas.style.setProperty('--canvas-accent',design.colors.accent);
  for(const b of canvas.querySelectorAll('[data-panel]')){const p=panels()[b.dataset.panel];
   const c=design.panelOptions[b.dataset.panel].crop,l=c.left/100,t=c.top/100,w=1-(c.left+c.right)/100,h=1-(c.top+c.bottom)/100;Object.assign(b.style,{left:`calc(${(p.x+p.w*l)/12*100}% + ${((p.x+p.w*l)/12-l)*design.gap}px)`,top:`calc(${(p.y+p.h*t)/12*100}% + ${((p.y+p.h*t)/12-t)*design.gap}px)`,width:`calc(${p.w*w/12*100}% - ${(1-p.w/12)*design.gap*w}px)`,height:`calc(${p.h*h/12*100}% - ${(1-p.h/12)*design.gap*h}px)`,zIndex:tool?.kind==='crop'&&tool.name===b.dataset.panel?40:p.layer+1});
   b.hidden=!p.visible;b.setAttribute('aria-pressed',String(b.dataset.panel===selected));b.setAttribute('aria-label',`${names[b.dataset.panel]}, column ${p.x+1}, row ${p.y+1}, width ${p.w}, height ${p.h}. Drag to move, edges to resize. Right-click for options.`);
   b.querySelector('.designPanelBadge').textContent=(design.panelStyles[b.dataset.panel].locked?'🔒 ':'')+names[b.dataset.panel]+' · '+p.w+' × '+p.h;
  }
  paintClockItems();
  $('designPanel').value=selected;const p=panels()[selected],s=design.panelStyles[selected];
  for(const [id,key]of [['designX','x'],['designY','y'],['designW','w'],['designH','h'],['designLayer','layer']])$(id).value=p[key]+(['x','y'].includes(key)?1:0);
  for(const id of ['designX','designY','designW','designH','designLayer'])$(id).disabled=design.panelStyles[selected].locked;$('designVisible').checked=p.visible;$('panelStyleCustom').checked=s.custom;
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
 function populate(value){tool=null;design=editorDesign(value?validateDesign(value):{...designStarter('studio'),enabled:false});changed();sync();}
 function select(name){if(name!==selected)tool=null;selected=name;paint();}
 function closeMenu(restore=false){menu.hidden=true;if(restore)menuAnchor?.focus({preventScroll:true});}
 function propertyPanel(){closeMenu();$('designPanelDetails').open=true;$('designPanelDetails').scrollIntoView({block:'nearest',behavior:'smooth'});$('designPanel').focus();}
 function showMenu(x,y,addOnly=false,anchor=null,layoutOnly=false,layersOnly=false){
  closeMenu();menu.setAttribute('role','menu');menu.setAttribute('aria-label','Design options');menuAnchor=anchor||canvas.querySelector(`[data-panel="${selected}"]`);
  const heading=document.createElement('div');heading.className='designContextHeading';heading.setAttribute('role','presentation');heading.textContent=addOnly?'Add a panel':names[selected];menu.replaceChildren(heading);
  function action(label,fn){const b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.textContent=label;b.onclick=()=>{closeMenu(true);fn();};if(design.panelStyles[selected].locked&&/^(Position|Fit width|Size:|Align |Centre |Copy panel to|Layers|Bring to front|Send to back|Go forward|Go backward)/.test(label))b.disabled=true;menu.append(b);}
  if(addOnly){for(const name of panelNames)action((panels()[name].visible?'✓ ':'+ ')+names[name],()=>{selected=name;if(!panels()[name].visible){panels()[name].visible=true;panels()[name].layer=Math.min(31,Math.max(...Object.values(panels()).map(p=>p.layer))+1);changed();}else paint();canvas.querySelector(`[data-panel="${name}"]`).focus();});}
  else if(layersOnly){for(const [label,direction]of [['Bring to front','front'],['Go forward','forward'],['Go backward','backward'],['Send to back','back']])action(label,()=>{const value=reorderPanel(panels(),selected,direction);if(orientation==='portrait')design.portraitPanels=value;else design.panels=value;changed();});action('‹ Back to panel options',()=>showMenu(x,y,false,anchor));}
  else if(layoutOnly){
   action('Fit width',()=>{const p=panels()[selected];p.x=0;p.w=12;changed();});
   action('Size: compact (3 × 3)',()=>size(3,3));action('Size: medium (4 × 4)',()=>size(4,4));action('Size: wide (8 × 4)',()=>size(8,4));
   action('Align left',()=>{panels()[selected].x=0;changed();});action('Align right',()=>{const p=panels()[selected];p.x=12-p.w;changed();});
   action('Centre horizontally',()=>{const p=panels()[selected];p.x=Math.floor((12-p.w)/2);changed();});
   action('Bring to front',()=>{const value=reorderPanel(panels(),selected,'front');if(orientation==='portrait')design.portraitPanels=value;else design.panels=value;changed();});
   action('Send to back',()=>{const value=reorderPanel(panels(),selected,'back');if(orientation==='portrait')design.portraitPanels=value;else design.panels=value;changed();});
   action('‹ Back to panel options',()=>showMenu(x,y,false,anchor));
  }
  else{
   action('Panel appearance…',()=>appearanceMenu(x,y,anchor));for(const group of ['Heading','Body','Secondary'])action(group+' typography…',()=>appearanceMenu(x,y,anchor,group));action('Spacing & surface…',()=>surfaceMenu(x,y,anchor));action('Position & size…',()=>placementMenu(x,y,anchor));
   action('Layers…',()=>showMenu(x,y,false,anchor,false,true));action('Crop panel…',()=>cropMenu(x,y,anchor));if(Object.values(design.panelOptions[selected].crop).some(v=>v))action('Reset crop',()=>{design.panelOptions[selected].crop={top:0,right:0,bottom:0,left:0};tool=null;changed();});action(design.panelStyles[selected].showHeading?'Hide heading':'Show heading',()=>{const style=enablePanelStyle();style.showHeading=!style.showHeading;changed();});if(selected==='clock')action('Arrange date/time items…',()=>clockMenu(x,y,anchor));
   action('More layout actions…',()=>showMenu(x,y,false,anchor,true));
   action(design.panelStyles[selected].locked?'Unlock position':'Lock position',()=>{design.panelStyles[selected].locked=!design.panelStyles[selected].locked;changed();});
   action('Make compact',()=>{const s=enablePanelStyle(),o=design.panelOptions[selected];if(!o.compactBackup)o.compactBackup=Object.fromEntries(compactFields.map(k=>[k,s[k]]));Object.assign(s,{headingSize:16,fontSize:12,secondarySize:11,padding:8,contentGap:4,lineHeight:1.2,radius:12});changed();});if(design.panelOptions[selected].compactBackup)action('Restore pre-compact spacing & type',()=>{Object.assign(enablePanelStyle(),design.panelOptions[selected].compactBackup);design.panelOptions[selected].compactBackup=null;changed();});
   action('Copy panel style',()=>{const source=design.panelStyles[selected];styleClipboard={...(source.custom?structuredClone(source):{...creativePanelStyle(design),fontSize:design.fontSize,color:design.colors.text,background:design.colors.surface}),custom:true,locked:false};$('designStatus').textContent='Panel style copied. Right-click another panel to paste it.';});
   if(styleClipboard)action('Paste panel style',()=>{design.panelStyles[selected]={...structuredClone(styleClipboard),locked:design.panelStyles[selected].locked};design.panelOptions[selected].compactBackup=null;changed();});
   action('Copy panel to other orientation',()=>{const target=orientation==='landscape'?design.portraitPanels:design.panels;target[selected]=structuredClone(panels()[selected]);changed();});
   action('Hide panel',()=>{panels()[selected].visible=false;changed();});
   action('Add another panel…',()=>showMenu(x,y,true,anchor));action('Screen appearance…',()=>screenMenu(x,y,anchor));action('Advanced properties…',propertyPanel);
  }
  menu.hidden=false;menu.style.left='0px';menu.style.top='0px';const rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';menu.scrollTop=0;menu.querySelector('button')?.focus({preventScroll:true});
 }

 function cropMenu(x,y,anchor){const c=design.panelOptions[selected].crop;controlsMenu(names[selected]+' crop · hidden content is retained',x,y,anchor,['top','right','bottom','left'].map(key=>({label:'Crop '+key+' (%)',value:c[key],options:Array.from({length:91},(_,i)=>i),change:v=>{const opposite={top:'bottom',bottom:'top',left:'right',right:'left'}[key];c[key]=Math.min(Number(v),90-c[opposite]);}})));toolButton('Drag crop edges',()=>{closeMenu(true);tool={kind:'crop',name:selected};paint();});}
 function clockMenu(x,y,anchor){
  const layout=design.clockLayout,p=layout.items[clockSelected];controlsMenu('Date/time composition · positions within panel (%)',x,y,anchor,[{label:'Item',value:clockSelected,options:Object.entries(clockItemNames),change:v=>{clockSelected=v;clockMenu(x,y,anchor);}}, {label:'Item visibility',value:p.visible?'show':'hide',options:[['show','Show'],['hide','Hide']],change:v=>{enablePanelStyle();layout.custom=true;p.visible=v==='show';}},...['x','y','w','h'].map(k=>({label:{x:'Item horizontal position (%)',y:'Item vertical position (%)',w:'Item width (%)',h:'Item height (%)'}[k],value:p[k],options:Array.from({length:96},(_,i)=>i+(k==='w'||k==='h'?5:0)),change:v=>{enablePanelStyle();layout.custom=true;p[k]=Number(v);if(k==='x')p.x=Math.min(p.x,100-p.w);if(k==='y')p.y=Math.min(p.y,100-p.h);if(k==='w')p.w=Math.min(p.w,100-p.x);if(k==='h')p.h=Math.min(p.h,100-p.y);}}))]);
  toolButton('Drag items on canvas',()=>{closeMenu(true);enablePanelStyle();layout.custom=true;tool={kind:'clock',name:'clock'};changed();});toolButton('Reset date/time arrangement',()=>{design.clockLayout=defaultClockLayout();tool=null;changed();clockMenu(x,y,anchor);});
 }
 function controlsMenu(title,x,y,anchor,fields){
  closeMenu();menuAnchor=anchor||canvas.querySelector(`[data-panel="${selected}"]`);menu.setAttribute('role','dialog');menu.setAttribute('aria-label',title);
  const heading=document.createElement('div');heading.className='designContextHeading';heading.setAttribute('role','presentation');heading.textContent=title;menu.replaceChildren(heading);
  const back=document.createElement('button');back.type='button';back.textContent='‹ Back to panel options';back.onclick=()=>showMenu(x,y,false,anchor);menu.append(back);
  for(const {label:name,value,options,color,change}of fields){const label=document.createElement('label');label.textContent=name;const el=document.createElement(color?'input':'select');el.setAttribute('aria-label',name);if(color){el.type='color';el.value=value;}else{const list=[...options];if(!list.some(o=>String(Array.isArray(o)?o[0]:o)===String(value)))list.push(value);for(const option of list){const [v,text]=Array.isArray(option)?option:[option,String(option)];el.add(new Option(text,v));}el.value=String(value);}el.onchange=()=>{change(el.value);changed();sync();};label.append(el);menu.append(label);}
  const done=document.createElement('button');done.type='button';done.textContent='Done';done.onclick=()=>closeMenu(true);menu.append(done);
  menu.hidden=false;menu.style.left='0px';menu.style.top='0px';const rect=menu.getBoundingClientRect();menu.style.left=Math.max(8,Math.min(x,innerWidth-rect.width-8))+'px';menu.style.top=Math.max(8,Math.min(y,innerHeight-rect.height-8))+'px';menu.scrollTop=0;menu.querySelector('select,input')?.focus({preventScroll:true});
 }
 function enablePanelStyle(){const s=design.panelStyles[selected];if(!s.custom){const locked=s.locked;Object.assign(s,creativePanelStyle(design));s.locked=locked;s.color=design.colors.text;s.background=design.colors.surface;s.headingColor=design.colors.text;s.secondaryColor=design.colors.muted;s.fontSize=design.fontSize;}s.custom=true;return s;}
 function appearanceMenu(x,y,anchor,group=null){
  const stored=design.panelStyles[selected],s=stored.custom?stored:{...creativePanelStyle(design),color:design.colors.text,background:design.colors.surface,fontSize:design.fontSize};
  const edit=(key,value)=>{enablePanelStyle()[key]=value;},fontOptions=[['inherit','Use screen font'],...Object.keys(fonts).map(f=>[f,f[0].toUpperCase()+f.slice(1)])];
  const fields=[];
  for(const [prefix,label,sizeKey,fontKey,weightKey,colorKey]of [['heading','Heading','headingSize','headingFont','headingWeight','headingColor'],['font','Body','fontSize','font','fontWeight','color'],['secondary','Secondary','secondarySize','secondaryFont','secondaryWeight','secondaryColor']]){
   if(group&&label!==group)continue;fields.push({label:label==='Body'?'Panel font':label+' font',value:s[fontKey],options:fontOptions,change:v=>edit(fontKey,v)},
    {label:label==='Body'?'Panel text size':label==='Secondary'?'Secondary text size':'Heading size',value:s[sizeKey],options:Array.from({length:(label==='Heading'?89:65)},(_,i)=>i+8),change:v=>edit(sizeKey,Number(v))},
    {label:label+' weight',value:s[weightKey],options:[[300,'Light'],[400,'Normal'],[500,'Medium'],[600,'Semibold'],[700,'Bold'],[800,'Extra bold'],[900,'Black']],change:v=>edit(weightKey,Number(v))},
    {label:label+' italic',value:String(s[prefix+'Italic']),options:[['false','Normal'],['true','Italic']],change:v=>edit(prefix+'Italic',v==='true')},
    {label:label+' decoration',value:s[prefix+'Decoration'],options:[['none','None'],['underline','Underline'],['line-through','Strikethrough']],change:v=>edit(prefix+'Decoration',v)},
    {label:label+' colour',value:s[colorKey],color:true,change:v=>edit(colorKey,v)},
    {label:label+' alignment',value:s[label==='Body'?'align':prefix+'Align'],options:[['left','Left'],['center','Centre'],['right','Right']],change:v=>edit(label==='Body'?'align':prefix+'Align',v)});
  }
  fields.push({label:'Text alignment',value:s.align,options:[['left','Left'],['center','Centre'],['right','Right']],change:v=>edit('align',v)},
   {label:'Show panel heading',value:String(s.showHeading),options:[['true','Show'],['false','Hide']],change:v=>edit('showHeading',v==='true')},
   {label:'Style source',value:stored.custom?'custom':'screen',options:[['screen','Use screen style'],['custom','Own panel style']],change:v=>{if(v==='custom')enablePanelStyle();else stored.custom=false;}});
  // Each text group is also available directly from the context menu.
  controlsMenu(names[selected]+' · '+(group?group.toLowerCase()+' typography':'all typography'),x,y,anchor,fields);
 }
 function surfaceMenu(x,y,anchor){const old=design.panelStyles[selected],s=old.custom?old:{...creativePanelStyle(design),background:design.colors.surface};const edit=(key,v)=>enablePanelStyle()[key]=v;
  controlsMenu(names[selected]+' spacing & surface',x,y,anchor,[
   {label:'Panel colour',value:s.background,color:true,change:v=>edit('background',v)},
   {label:'Surface',value:s.backgroundMode,options:[['solid','Solid'],['gradient','Gradient']],change:v=>edit('backgroundMode',v)},
   {label:'Gradient end',value:s.gradientTo,color:true,change:v=>edit('gradientTo',v)},
   {label:'Gradient angle',value:s.gradientAngle,options:[0,45,90,135,180,225,270,315],change:v=>edit('gradientAngle',Number(v))},
   ...[['padding','Panel padding',48],['contentGap','Item spacing',40],['radius','Corners',48],['borderWidth','Border width',8],['opacity','Surface opacity',100]].map(([key,label,max])=>({label,value:s[key],options:Array.from({length:max+1},(_,i)=>i),change:v=>edit(key,Number(v))})),
   {label:'Border colour',value:s.borderColor,color:true,change:v=>edit('borderColor',v)},
   {label:'Shadow',value:s.shadow,options:['none','soft','deep'],change:v=>edit('shadow',v)},
   {label:'Line height',value:s.lineHeight,options:[.8,1,1.1,1.2,1.3,1.4,1.5,1.6,1.8,2,2.5],change:v=>edit('lineHeight',Number(v))},
   {label:'Letter spacing',value:s.letterSpacing,options:[-2,-1,0,.5,1,2,3,4,5,6,7,8],change:v=>edit('letterSpacing',Number(v))},
   {label:'Vertical alignment',value:s.verticalAlign,options:[['top','Top'],['center','Centre'],['bottom','Bottom']],change:v=>edit('verticalAlign',v)},
   {label:'Overflow',value:s.overflow,options:[['scroll','Scroll content'],['clip','Clip content']],change:v=>edit('overflow',v)}]);
 }
 function placementMenu(x,y,anchor){
  if(design.panelStyles[selected].locked)return;const p=panels()[selected];controlsMenu(names[selected]+' position & size',x,y,anchor,[
   ...[['x','Column'],['y','Row'],['w','Panel width'],['h','Panel height'],['layer','Layer']].map(([key,label])=>({label,value:p[key]+(['x','y'].includes(key)?1:0),options:Array.from({length:key==='layer'?32:12},(_,i)=>i+(key==='layer'?0:1)),change:v=>{p[key]=Number(v)-(['x','y'].includes(key)?1:0);p.x=Math.min(p.x,12-p.w);p.y=Math.min(p.y,12-p.h);}})),
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
 menu.onkeydown=e=>{const items=[...menu.querySelectorAll('button:not(:disabled),select:not(:disabled),input:not(:disabled)')];const i=items.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)&&document.activeElement.tagName==='BUTTON'&&menu.getAttribute('role')==='menu'){e.preventDefault();items[e.key==='Home'?0:e.key==='End'?items.length-1:(i+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}if(e.key==='Escape'){e.preventDefault();closeMenu(true);}if(e.key==='Tab'){if(menu.getAttribute('role')==='menu')closeMenu();else{e.preventDefault();items[(i+(e.shiftKey?items.length-1:1))%items.length].focus();}}};
 document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!menu.contains(e.target))closeMenu();});window.addEventListener('resize',()=>{closeMenu();paint();});new ResizeObserver(()=>paintClockItems()).observe(canvas);window.addEventListener('wheel',e=>{if(!menu.contains(e.target))closeMenu();},{passive:true});
 for(const name of panelNames){
  const b=document.createElement('button');b.type='button';b.dataset.panel=name;b.className='designPanelOverlay';b.innerHTML='<span class="designPanelBadge"></span>'+['n','ne','e','se','s','sw','w','nw'].map(edge=>`<span class="resizeHandle handle-${edge}" data-edge="${edge}" aria-hidden="true"></span>`).join('');
  b.onclick=()=>select(name);
  b.oncontextmenu=e=>{e.preventDefault();select(name);showMenu(e.clientX,e.clientY,false,b);};
  b.onkeydown=e=>{
   if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();select(name);const r=b.getBoundingClientRect();showMenu(r.left+12,r.top+24,false,b);return;}
   if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();selected=name;if(design.panelStyles[selected].locked)return;const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowDown'?1:e.key==='ArrowUp'?-1:0;if(tool?.kind==='crop'&&tool.name===name){design.panelOptions[name].crop=transformCrop(design.panelOptions[name].crop,e.shiftKey?'se':'nw',dx,dy);changed();return;}panels()[name]=transformPanel(panels()[name],e.shiftKey?'se':'move',dx,dy);changed();
  };
  b.onpointerdown=e=>{if(e.button!==0||gesture)return;e.preventDefault();closeMenu();select(name);if(design.panelStyles[name].locked)return;b.focus({preventScroll:true});const cropping=tool?.kind==='crop'&&tool.name===name;if(cropping&&!e.target.dataset.edge)return;gesture={name,initial:structuredClone(cropping?design.panelOptions[name].crop:panels()[name]),clientX:e.clientX,clientY:e.clientY,mode:e.target.dataset.edge||'move',crop:cropping,pointer:e.pointerId};b.setPointerCapture(e.pointerId);canvas.classList.add('dragging');};
  b.onpointermove=e=>{if(!gesture||gesture.name!==name||gesture.pointer!==e.pointerId)return;if(gesture.crop){const r=panelRect(name);design.panelOptions[name].crop=transformCrop(gesture.initial,gesture.mode,(e.clientX-gesture.clientX)*100/r.w,(e.clientY-gesture.clientY)*100/r.h);}else panels()[name]=transformPanel(gesture.initial,gesture.mode,(e.clientX-gesture.clientX)*12/(canvas.clientWidth+design.gap),(e.clientY-gesture.clientY)*12/(canvas.clientHeight+design.gap));paint();};
  b.onpointerup=e=>{if(!gesture||gesture.pointer!==e.pointerId)return;gesture=null;canvas.classList.remove('dragging');changed();};
  b.onpointercancel=()=>{if(gesture){if(gesture.item)design.clockLayout.items[gesture.item]=gesture.initial;else if(gesture.crop)design.panelOptions[gesture.name].crop=gesture.initial;else panels()[gesture.name]=gesture.initial;gesture=null;canvas.classList.remove('dragging');paint();}};
  b.onlostpointercapture=()=>{if(gesture?.name===name)b.onpointercancel();};
  canvas.append(b);
 }
 const clockButtons=[];
 function paintClockItems(){for(const b of clockButtons){const p=design.clockLayout.items[b.dataset.clockEdit],r=panelRect('clock');const name=b.dataset.clockEdit,element=(name==='analog'||name==='time')?$('designPreview').contentDocument?.getElementById(name==='analog'?'analog':'clock'):null;b.hidden=tool?.kind!=='clock'||!p.visible||!panels().clock.visible||element?.hidden===true;Object.assign(b.style,{left:r.x+r.w*p.x/100+'px',top:r.y+r.h*p.y/100+'px',width:r.w*p.w/100+'px',height:r.h*p.h/100+'px',zIndex:50});}}
 for(const [name,label]of Object.entries(clockItemNames)){const b=document.createElement('button');b.type='button';b.dataset.clockEdit=name;b.className='designClockItem';b.setAttribute('aria-label',label+' · drag to move, arrows to move, Shift + arrows to resize');b.innerHTML='<span>'+esc(label)+'</span>'+['n','ne','e','se','s','sw','w','nw'].map(edge=>`<i class="resizeHandle handle-${edge}" data-edge="${edge}"></i>`).join('');b.oncontextmenu=e=>{e.preventDefault();clockSelected=name;clockMenu(e.clientX,e.clientY,b);};b.onpointerdown=e=>{if(e.button!==0||gesture)return;e.preventDefault();closeMenu();b.focus({preventScroll:true});clockSelected=name;gesture={name:'clock',item:name,initial:structuredClone(design.clockLayout.items[name]),clientX:e.clientX,clientY:e.clientY,mode:e.target.dataset.edge||'move',pointer:e.pointerId};b.setPointerCapture(e.pointerId);};b.onpointermove=e=>{if(gesture?.item!==name)return;const r=panelRect('clock');design.clockLayout.items[name]=transformClockItem(gesture.initial,gesture.mode,(e.clientX-gesture.clientX)*100/r.w,(e.clientY-gesture.clientY)*100/r.h);paint();};b.onpointerup=()=>{if(gesture?.item===name){gesture=null;changed();}};b.onpointercancel=()=>{if(gesture?.item===name){design.clockLayout.items[name]=gesture.initial;gesture=null;paint();}};b.onlostpointercapture=b.onpointercancel;b.onkeydown=e=>{if(e.key==='ContextMenu'||e.key==='F10'&&e.shiftKey){e.preventDefault();clockSelected=name;const r=b.getBoundingClientRect();clockMenu(r.left,r.bottom,b);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();design.clockLayout.items[name]=transformClockItem(design.clockLayout.items[name],e.shiftKey?'se':'move',e.key==='ArrowLeft'?-1:e.key==='ArrowRight'?1:0,e.key==='ArrowUp'?-1:e.key==='ArrowDown'?1:0);changed();};clockButtons.push(b);canvas.append(b);}
 function transformClockItem(p,mode,dx,dy){const out={...p},clamp=(v,min,max)=>Math.max(min,Math.min(max,Math.round(v)));if(mode==='move'){out.x=clamp(p.x+dx,0,100-p.w);out.y=clamp(p.y+dy,0,100-p.h);}else{if(mode.includes('e'))out.w=clamp(p.w+dx,5,100-p.x);if(mode.includes('s'))out.h=clamp(p.h+dy,5,100-p.y);if(mode.includes('w')){out.x=clamp(p.x+dx,0,p.x+p.w-5);out.w=p.x+p.w-out.x;}if(mode.includes('n')){out.y=clamp(p.y+dy,0,p.y+p.h-5);out.h=p.y+p.h-out.y;}}return out;}
 canvas.oncontextmenu=e=>{if(e.target.closest('[data-panel],[data-clock-edit]'))return;e.preventDefault();screenMenu(e.clientX,e.clientY,$('designScreenStyle'));};
 $('designAdd').onclick=()=>{const r=$('designAdd').getBoundingClientRect();showMenu(r.left,r.bottom+6,true,$('designAdd'));};
 $('designScreenStyle').onclick=()=>{const r=$('designScreenStyle').getBoundingClientRect();screenMenu(r.left,r.bottom+6,$('designScreenStyle'));};
 $('designProperties').onclick=()=>{const r=$('designProperties').getBoundingClientRect();showMenu(r.left,r.bottom+6,false,$('designProperties'));};
 $('designPanel').onchange=()=>select($('designPanel').value);$('designOrientation').onchange=()=>{orientation=$('designOrientation').value;paint();};
 $('designEnabled').onchange=()=>{design.enabled=$('designEnabled').checked;changed();};$('designName').onchange=()=>{const value=$('designName').value.trim();if(!value)return;design.name=value;changed();};
 for(const [id,key]of [['designX','x'],['designY','y'],['designW','w'],['designH','h'],['designLayer','layer']])$(id).onchange=()=>{if(design.panelStyles[selected].locked){paint();return;}const n=Number($(id).value)-(['x','y'].includes(key)?1:0);if(!Number.isInteger(n)||$(id).value===''){paint();return;}const p=panels()[selected];p[key]=Math.max(['w','h'].includes(key)?1:0,Math.min(key==='layer'?31:['x','y'].includes(key)?11:12,n));p.x=Math.min(p.x,12-p.w);p.y=Math.min(p.y,12-p.h);changed();};
 $('designVisible').onchange=()=>{panels()[selected].visible=$('designVisible').checked;changed();};
 $('panelStyleCustom').onchange=()=>{const s=design.panelStyles[selected];s.custom=$('panelStyleCustom').checked;if(s.custom){s.color=design.colors.text;s.background=design.colors.surface;}$('panelStyle-color').value=s.color;$('panelStyle-background').value=s.background;changed();};
 for(const key of ['font','fontSize','color','background','align'])$('panelStyle-'+key).oninput=()=>{const value=key==='fontSize'?Number($('panelStyle-'+key).value):$('panelStyle-'+key).value;if(key==='fontSize'&&(!Number.isInteger(value)||value<8||value>72))return;design.panelStyles[selected][key]=value;changed();};
 for(const [id,key,value]of [['designAlignLeft','x',0],['designAlignTop','y',0]])$(id).onclick=()=>{if(design.panelStyles[selected].locked)return;panels()[selected][key]=value;changed();};$('designCenter').onclick=()=>{if(design.panelStyles[selected].locked)return;const p=panels()[selected];p.x=Math.floor((12-p.w)/2);changed();};
 $('designUndo').onclick=()=>{if(historyIndex){design=structuredClone(history[--historyIndex]);sync();dirty();}};$('designRedo').onclick=()=>{if(historyIndex<history.length-1){design=structuredClone(history[++historyIndex]);sync();dirty();}};
 canvas.onkeydown=e=>{if(e.key==='Escape'&&!gesture&&tool){finishTool();return;}if(e.key==='Escape'&&gesture){if(gesture.item)design.clockLayout.items[gesture.item]=gesture.initial;else if(gesture.crop)design.panelOptions[gesture.name].crop=gesture.initial;else panels()[gesture.name]=gesture.initial;gesture=null;canvas.classList.remove('dragging');paint();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'designRedo':'designUndo').click();}};
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
 $('designPreviewToggle').onclick=()=>{const clean=canvas.classList.toggle('previewOnly');$('designPreviewToggle').textContent=clean?'Edit panels':'Preview';$('designPreviewToggle').setAttribute('aria-pressed',String(clean));};
 api('/api/themes').then(values=>{themeSources=values;$('designThemeSource').replaceChildren(...values.map(t=>new Option(t.name,t.id)));}).catch(e=>$('designStatus').textContent=e.message);
 $('designLoadTheme').onclick=()=>{try{const t=themeSources.find(t=>t.id===$('designThemeSource').value);populate(designFromTheme(t));$('designStatus').textContent='Built-in theme loaded as a new editable copy. Save to your library to keep it.';}catch(e){$('designStatus').textContent=e.message;}};
 $('designPreview').onload=sendPreview;sync();
 return {value,populate,selectedBlock:()=>({type:selected,panel:structuredClone(panels()[selected]),style:structuredClone(design.panelStyles[selected])}),applyBlock:block=>{const locked=design.panelStyles[selected].locked;if(!locked)panels()[selected]=structuredClone(block.panel);design.panelStyles[selected]=Object.hasOwn(block.style,'headingSize')?structuredClone(block.style):creativePanelStyle(design,block.style);design.panelStyles[selected].locked=locked;design.panelOptions[selected].compactBackup=null;changed();}};
}
