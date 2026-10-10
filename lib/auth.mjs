import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {readJSON,saveJSON} from './settings.mjs';
const scrypt=promisify(crypto.scrypt);
export class Auth {
 constructor(data){this.data=data;this.record=null;this.sessions=new Map();this.attempts=new Map();this.queue=Promise.resolve();}
 async init(){this.record=await readJSON(this.data,'admin.json',null);}
 session(req){const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('homeboard_session='))?.slice(18),expires=this.sessions.get(cookie);if(expires&&expires>Date.now())return true;if(cookie)this.sessions.delete(cookie);return false;}
 status(req){return {configured:!!this.record,authenticated:this.session(req),editable:!this.record||this.session(req)};}
 require(req){if(this.record&&!this.session(req)){const e=Error('Unlock HomeBoard to edit settings and family data');e.status=401;throw e;}}
 async setup(req,password){const work=this.queue.then(async()=>{if(this.record)throw Error('An admin password is already configured');if(typeof password!=='string'||password.length<10||password.length>200)throw Error('Use an admin password of 10–200 characters');const salt=crypto.randomBytes(32).toString('hex');const record={salt,hash:(await scrypt(password,salt,64)).toString('hex')};await saveJSON(this.data,'admin.json',record);this.record=record;return this.login(req,password);});this.queue=work.catch(()=>{});return work;}
 async login(req,password){if(!this.record)throw Error('Set an admin password first');const key=req.socket.remoteAddress,now=Date.now(),attempt=this.attempts.get(key)||{count:0,until:now+900000};if(attempt.until<now){attempt.count=0;attempt.until=now+900000;}if(attempt.count>=5){const e=Error('Too many attempts. Try again in 15 minutes.');e.status=429;throw e;}attempt.count++;this.attempts.set(key,attempt);if(typeof password!=='string'||password.length>200)throw Error('Invalid password');const hash=await scrypt(password,this.record.salt,64);if(!crypto.timingSafeEqual(hash,Buffer.from(this.record.hash,'hex'))){const e=Error('Incorrect admin password');e.status=401;throw e;}this.attempts.delete(key);for(const [k,v]of this.sessions)if(v<now)this.sessions.delete(k);if(this.sessions.size>1000)this.sessions.delete(this.sessions.keys().next().value);const token=crypto.randomBytes(32).toString('hex');this.sessions.set(token,now+8*3600000);return `homeboard_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${req.socket.encrypted||req.headers['x-forwarded-proto']==='https'?'; Secure':''}`;}
 async disable(req){this.require(req);await saveJSON(this.data,'admin.json',null);this.record=null;this.sessions.clear();this.attempts.clear();return this.logout(req);}
 logout(req){const token=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('homeboard_session='))?.slice(18);this.sessions.delete(token);return 'homeboard_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0';}
}
