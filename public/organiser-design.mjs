import {contentDesign,designStarter,designFromTheme,designerPanelNames,fonts,validateDesign} from './design.mjs';
export const organiserPanels=['lists','chores','routines','meals','bins','countdowns','notices'];
export function organiserStarter(){
 const d=contentDesign(designStarter('family')),panel=(x,y,w,h)=>({x,y,w,h,layer:0,visible:true});
 for(const ps of [d.panels,d.portraitPanels])for(const p of Object.values(ps))p.visible=false;
 Object.assign(d.panels,{lists:panel(0,0,4,6),chores:panel(4,0,4,3),routines:panel(4,3,4,3),meals:panel(8,0,4,6),bins:panel(0,6,4,6),countdowns:panel(4,6,4,6),notices:panel(8,6,4,6)});
 Object.assign(d.portraitPanels,{lists:panel(0,0,6,4),chores:panel(6,0,6,2),routines:panel(6,2,6,2),meals:panel(0,4,6,4),bins:panel(6,4,6,4),countdowns:panel(0,8,6,4),notices:panel(6,8,6,4)});
 d.name='Family organiser';d.enabled=false;return validateDesign(d);
}
// Layout and content are independent; screen appearance always follows the main dashboard.
export function organiserDashboardDesign(main,family){
 const d=contentDesign(main),layout=family?.enabled?contentDesign(family):organiserStarter();
 d.name=layout.name;d.enabled=true;d.panels=structuredClone(layout.panels);d.portraitPanels=structuredClone(layout.portraitPanels);
 for(const name of designerPanelNames){if(!organiserPanels.includes(name)){d.panels[name].visible=false;d.portraitPanels[name].visible=false;}if(layout.panelStyles[name].custom)d.panelStyles[name]=structuredClone(layout.panelStyles[name]);d.panelOptions[name]=structuredClone(layout.panelOptions[name]);d.contentLayouts[name]=structuredClone(layout.contentLayouts[name]);}
 return validateDesign(d);
}
// Read the actual built-in theme tokens, including translucent card colours.
export function organiserThemeAppearance(theme){
 const d=contentDesign(designFromTheme(theme)),root=document.querySelector('.dashboard'),style=getComputedStyle(root);
 function colour(name,fallback){const value=style.getPropertyValue(name).trim();if(!/^#[a-f\d]{3,8}$/i.test(value))return fallback;const hex=value.slice(1);return '#'+(hex.length<=4?[...hex.slice(0,3)].map(c=>c+c).join(''):hex.slice(0,6));}
 for(const [key,token]of Object.entries({background:'--bg',surface:'--card',text:'--ink',muted:'--muted',accent:'--sage',event:'--event'}))d.colors[key]=colour(token,d.colors[key]);
 const card=style.getPropertyValue('--card').trim();if(/^#[a-f\d]{8}$/i.test(card))d.opacity=Math.round(parseInt(card.slice(-2),16)/255*100);else d.opacity=100;
 const fontKey=value=>Object.entries(fonts).find(([,font])=>font.replace(/[\s"']/g,'').toLowerCase()===value.replace(/[\s"']/g,'').toLowerCase())?.[0]||'sans';
 d.font=fontKey(style.fontFamily);d.headingFont=fontKey(getComputedStyle(root.querySelector('h2')).fontFamily);
 return validateDesign(d);
}
