// Fit to the rendered panel, including designer slots and browser orientation changes.
export function observeClock(card){
 let pending=false;
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;fit();});};
 const fit=()=>{
  const texts=[...card.querySelectorAll('#clock,#clockDate,#clockZone,#clockSeconds')];
  for(const el of texts)el.style.removeProperty('font-size');
  const visible=texts.filter(el=>el.getClientRects().length&&getComputedStyle(el).display!=='none');
  const sizes=visible.map(el=>parseFloat(getComputedStyle(el).fontSize));
  if(document.body.dataset.clockLayout==='custom'){
   visible.forEach((el,i)=>{
    const slot=el.id==='clock'?el.parentElement:el;
    const fits=()=>{const r=document.createRange();r.selectNodeContents(el);const box=r.getBoundingClientRect();return box.width<=slot.clientWidth&&box.height<=slot.clientHeight&&el.scrollHeight<=slot.clientHeight+1;};
    let low=1,high=sizes[i];for(let n=0;n<12;n++){const size=(low+high)/2;el.style.setProperty('font-size',size+'px','important');if(fits())low=size;else high=size;}el.style.setProperty('font-size',low+'px','important');
   });
  }else{
   let scale=1;for(let n=0;n<20;n++){
    const bounds=card.getBoundingClientRect(),style=getComputedStyle(card),bottom=bounds.bottom-parseFloat(style.paddingBottom),right=bounds.right-parseFloat(style.paddingRight);
    const fits=visible.every(el=>{const r=el.getBoundingClientRect();return r.bottom<=bottom+1&&r.right<=right+1&&el.scrollWidth<=el.clientWidth+1;})&&card.scrollHeight<=card.clientHeight+1;
    if(fits)break;scale*=.9;visible.forEach((el,i)=>el.style.setProperty('font-size',sizes[i]*scale+'px','important'));
   }
  }
 };
 new ResizeObserver(schedule).observe(card);
 new MutationObserver(schedule).observe(card,{childList:true,characterData:true,subtree:true});
 new MutationObserver(schedule).observe(document.body,{attributes:true,attributeFilter:['data-clock-layout','data-custom-design','data-theme']});
 window.addEventListener('resize',schedule);document.fonts.ready.then(schedule);schedule();return fit;
}
