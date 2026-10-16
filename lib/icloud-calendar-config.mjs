export function calendarURL(value,base='https://caldav.icloud.com/'){
 const u=new URL(value,base);
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash||! /^(?:caldav|p\d+-caldav)\.icloud\.com$/.test(u.hostname))throw Error('iCloud returned an unsupported host');
 return u.href;
}
export function calendarCredentials({email,password}={}){
 if(typeof email!=='string'||email.length>254||! /^[^\s:@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||typeof password!=='string'||! /^[a-z]{4}(?:-[a-z]{4}){3}$/.test(password.trim()))throw Error('Enter your Apple Account email and an app-specific password (xxxx-xxxx-xxxx-xxxx).');
 return {email:email.trim(),password:password.trim()};
}
