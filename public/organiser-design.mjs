import {validateDesign,fonts} from './design.mjs';
import {applyContentLayouts} from './panel-content.mjs';
export const organiserPanels=['lists','chores','meals','bins','countdowns','notices'];
export function applyOrganiserDesign(d){
 const root=document.getElementById('familyEditor');if(!root)return;
 document.body.classList.toggle('organiserDesigned',!!d?.enabled);
 if(!d?.enabled){for(const heading of root.querySelectorAll(':scope > section > h2'))heading.removeAttribute('style');root.removeAttribute('style');for(const el of root.querySelectorAll('[data-design-panel]')){el.removeAttribute('style');delete el.dataset.designPanel;}applyContentLayouts(null,root);return;}
 validateDesign(d);const portrait=document.body.dataset.previewOrientation?document.body.dataset.previewOrientation==='portrait':matchMedia('(orientation: portrait)').matches,panels=portrait?d.portraitPanels||d.panels:d.panels;
 root.style.cssText=`--organiser-bg:${d.colors.background};--organiser-text:${d.colors.text};--organiser-gap:${d.gap}px;font-family:${fonts[d.font]};font-size:${d.fontSize}px;`;
 for(const name of organiserPanels){const el=root.querySelector('#'+(name==='chores'?'tasks':name));if(!el)continue;const p=panels[name],s=d.panelStyles?.[name];el.dataset.designPanel=name;el.style.cssText=`grid-column:${p.x+1}/span ${p.w};grid-row:${p.y+1}/span ${p.h};z-index:${p.layer};display:${p.visible?'block':'none'};background:${s?.custom?s.background:d.colors.surface};color:${s?.custom?s.color:d.colors.text};font-size:${s?.custom?s.fontSize:d.fontSize}px;padding:${s?.custom?s.padding:d.padding}px;border-radius:${s?.custom?s.radius:d.radius}px;position:relative;overflow:auto;min-height:0;margin:0;`;
  const heading=el.querySelector(':scope > h2');heading?.removeAttribute('style');
  if(s?.custom){const alpha=Math.round(s.opacity*2.55).toString(16).padStart(2,'0');Object.assign(el.style,{fontFamily:s.font==='inherit'?fonts[d.font]:fonts[s.font],fontWeight:s.fontWeight,fontStyle:s.fontItalic?'italic':'normal',textDecoration:s.fontDecoration,lineHeight:s.lineHeight,textAlign:s.align,letterSpacing:s.letterSpacing+'px',background:s.backgroundMode==='gradient'?`linear-gradient(${s.gradientAngle}deg,${s.background+alpha},${s.gradientTo+alpha})`:s.background+alpha,border:`${s.borderWidth}px solid ${s.borderColor}`,overflow:s.overflow==='clip'?'hidden':'auto'});if(heading)Object.assign(heading.style,{display:s.showHeading?'':'none',fontFamily:s.headingFont==='inherit'?fonts[d.headingFont]:fonts[s.headingFont],fontSize:s.headingSize+'px',fontWeight:s.headingWeight,color:s.headingColor,textAlign:s.headingAlign,fontStyle:s.headingItalic?'italic':'normal',textDecoration:s.headingDecoration});}

 }
 applyContentLayouts(d,root);
}
