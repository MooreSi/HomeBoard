import crypto from 'node:crypto';
export const repository='https://github.com/MooreSi/HomeBoard';
export function updateRequest(action){
 if(!process.send||process.env.HOMEBOARD_MANAGED!=='1'){
  if(action==='status')return Promise.resolve({enabled:false,phase:'unmanaged',repository,available:false,currentCommit:process.env.HOMEBOARD_COMMIT||null,reason:'Start with npm start or run the setup installer to enable managed updates and automatic restart.'});
  return Promise.reject(Error('Automatic updates require a managed start. Run npm start or the setup installer first.'));
 }
 return new Promise((resolve,reject)=>{const id=crypto.randomUUID(),timer=setTimeout(()=>finish(Error('The update manager did not respond.')),45000);
  const receive=message=>{if(message?.type==='updateResponse'&&message.id===id)finish(message.error?Error(message.error):null,message.result);};
  const finish=(error,result)=>{clearTimeout(timer);process.off('message',receive);error?reject(error):resolve(result);};process.on('message',receive);process.send({type:'updateRequest',id,action},error=>{if(error)finish(error);});
 });
}
