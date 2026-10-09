// Animation is a browser boundary; sequencing is shared and unit-testable.
export async function transitionPhoto(outgoing,incoming,style,duration){
 incoming.style.opacity='1';
 if(!duration||style==='cut')return;
 if(style==='fade'){
  incoming.style.opacity='0';
  await outgoing.animate([{opacity:1},{opacity:0}],{duration:duration/2,fill:'forwards'}).finished;
  incoming.style.opacity='1';
  await incoming.animate([{opacity:0},{opacity:1}],{duration:duration/2}).finished;
  return;
 }
 const frames=style==='slide'?[{transform:'translateX(100%)',opacity:1},{transform:'translateX(0)',opacity:1}]:style==='zoom'?[{transform:'scale(1.1)',opacity:0},{transform:'scale(1)',opacity:1}]:[{opacity:0},{opacity:1}];
 await incoming.animate(frames,{duration,easing:'ease-in-out'}).finished;
}
