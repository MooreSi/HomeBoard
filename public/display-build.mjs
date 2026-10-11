// Long-running dashboard tabs need a new document after an app update.
export function observeDisplayBuild(onUpdate=()=>location.reload()){
 const loaded=document.querySelector('meta[name=homeboard-build]')?.content;
 let pending=false,changed=false;
 const check=async()=>{
  if(pending||changed||document.hidden)return;pending=true;
  try{
   const response=await fetch('/api/system',{cache:'no-store'});if(!response.ok)return;
   const status=await response.json(),commit=status.build||status.commit;
   if(typeof commit==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(commit)&&commit!=='unknown'&&commit!=='development'&&commit!==loaded){changed=true;onUpdate();}
  }catch{/* Offline displays keep their saved page until the server is reachable. */}
  finally{pending=false;}
 };
 window.addEventListener('pageshow',check);document.addEventListener('visibilitychange',check);
 const timer=setInterval(check,30000);check();
 return ()=>{clearInterval(timer);window.removeEventListener('pageshow',check);document.removeEventListener('visibilitychange',check);};
}
