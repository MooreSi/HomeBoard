// CSS pixels describe usable page space; screen pixels and devicePixelRatio do not.
export function observeDashboardViewport(){
 let frame;
 const update=()=>{
  const viewport=window.visualViewport;
  // Preserve normal page layout while the user deliberately pinch-zooms.
  const visible=viewport?.scale===1&&Number.isFinite(viewport.height)&&viewport.height>0?Math.min(innerHeight,viewport.height):innerHeight;
  document.documentElement.style.setProperty('--dashboard-height',Math.floor(visible)+'px');
  document.body.dataset.dashboardDensity=visible<700?'compact':'regular';
 };
 const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);};
 for(const name of ['resize','orientationchange','pageshow'])window.addEventListener(name,schedule);
 window.visualViewport?.addEventListener('resize',schedule);document.addEventListener('fullscreenchange',schedule);document.addEventListener('visibilitychange',schedule);update();
 return ()=>{cancelAnimationFrame(frame);for(const name of ['resize','orientationchange','pageshow'])window.removeEventListener(name,schedule);window.visualViewport?.removeEventListener('resize',schedule);document.removeEventListener('fullscreenchange',schedule);document.removeEventListener('visibilitychange',schedule);};
}
