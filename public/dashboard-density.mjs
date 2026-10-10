// Density follows the rendered card, so it works in the display and device preview.
export function observeDashboardDensity(){
 let pending=false;
 const fit=()=>{pending=false;
  const news=document.getElementById('newsWidget'),ns=getComputedStyle(news);
  news.style.setProperty('--source-size',Math.max(10,Math.min(32,news.clientHeight-parseFloat(ns.paddingTop)-parseFloat(ns.paddingBottom)-4))+'px');
  const bins=document.querySelector('[data-family-panel=bins]');if(bins?.getClientRects().length){
   const style=getComputedStyle(bins),heading=bins.querySelector('header'),count=bins.querySelectorAll('.binCollection').length;
   const available=bins.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)-(heading.getClientRects().length?heading.offsetHeight+parseFloat(getComputedStyle(heading).marginBottom):0)-12;
   const font=Math.max(10,Math.min(14,(available/Math.max(1,count)-8)/3.2));bins.style.setProperty('--bin-font',font+'px');bins.style.setProperty('--bin-icon',font*1.7+'px');
  }
 };
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(fit);}};
 const observer=new ResizeObserver(schedule);for(const el of document.querySelectorAll('#calendar,#newsWidget,[data-family-panel=bins]'))observer.observe(el);
 new MutationObserver(schedule).observe(document.querySelector('.dashboard'),{childList:true,subtree:true});window.addEventListener('resize',schedule);schedule();
}
