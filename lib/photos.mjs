import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
export const photoTypes={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif'};
export class Photos {
 constructor(data,getSettings,album){this.data=data;this.settings=getSettings;this.album=album;this.files=new Map();this.folderStatus={connected:false,count:0};}
 async scan(){
  this.files.clear();const folder=this.settings().photoFolder;
  if(!folder){this.folderStatus={connected:false,count:0,error:'Choose a folder on the server'};return;}
  try{
   let root=await fs.realpath(folder);if(!(await fs.stat(root)).isDirectory())throw Error('Not a directory');
   if(root.endsWith('.photoslibrary'))root=path.join(root,'originals');
   let inspected=0;
   const walk=async(dir,depth)=>{if(depth>12)throw Error('Folder is too deeply nested');for(const entry of await fs.readdir(dir,{withFileTypes:true})){
    if(++inspected>20000)throw Error('Folder exceeds 20,000 entries; use a smaller exported album');
    if(entry.isSymbolicLink()||entry.name.startsWith('.'))continue;const file=path.join(dir,entry.name);
    if(entry.isDirectory())await walk(file,depth+1);
    else if(entry.isFile()&&photoTypes[path.extname(file).toLowerCase()]){const id=crypto.createHash('sha256').update(path.relative(root,file)).digest('hex');this.files.set(id,file);}
   }};
   await walk(root,0);this.folderStatus={connected:true,count:this.files.size};
  }catch(e){this.files.clear();this.folderStatus={connected:false,count:0,error:e.code==='ENOENT'?'Folder is missing. Check the path or container mount.':e.code==='EACCES'?'Folder permission denied. Grant read access to the server.':e.message};}
 }
 async list(){const s=this.settings();let list=[];if(['uploads','both'].includes(s.photoSource))list=(await fs.readdir(path.join(this.data,'photos'))).filter(x=>x.endsWith('.jpg')).sort().map(x=>'/photos/'+x);if(['folder','both'].includes(s.photoSource)){await this.scan();list.push(...[...this.files.keys()].sort().map(x=>'/folder-photos/'+x));}if(this.album&&(s.photoSource==='icloud'||s.photoSource==='both'&&this.album.secrets().icloudAlbumUrl))list.push(...await this.album.list());return list;}
 async read(id){await this.scan();const file=this.files.get(id);if(!file){const e=Error('Photo not found');e.code='ENOENT';throw e;}const real=await fs.realpath(file);if(real!==file)throw Error('Symbolic links are not served');return {body:await fs.readFile(real),type:photoTypes[path.extname(real).toLowerCase()]};}
}
