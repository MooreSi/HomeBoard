// Management pages have a shared appearance independent of display themes.
export function applyManagementAppearance(value='auto'){
 document.body.dataset.appearance=['light','dark','auto'].includes(value)?value:'auto';
 delete document.body.dataset.theme;
}
export function timezoneChoices(selected='UTC'){
 const usual=['UTC','Europe/London','Europe/Paris','Europe/Berlin','Europe/Rome','Europe/Madrid','Europe/Amsterdam','Europe/Dublin','Europe/Lisbon','Europe/Athens','Europe/Helsinki','Europe/Warsaw','Europe/Prague','Europe/Istanbul','Europe/Moscow','Africa/Cairo','Africa/Johannesburg','Africa/Lagos','Africa/Nairobi','Africa/Casablanca','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Phoenix','America/Anchorage','America/Toronto','America/Vancouver','America/Mexico_City','America/Bogota','America/Lima','America/Santiago','America/Sao_Paulo','America/Argentina/Buenos_Aires','Asia/Dubai','Asia/Jerusalem','Asia/Riyadh','Asia/Kolkata','Asia/Kathmandu','Asia/Dhaka','Asia/Bangkok','Asia/Singapore','Asia/Hong_Kong','Asia/Shanghai','Asia/Tokyo','Asia/Taipei','Asia/Seoul','Asia/Jakarta','Asia/Manila','Asia/Karachi','Australia/Sydney','Australia/Melbourne','Australia/Brisbane','Australia/Adelaide','Australia/Perth','Pacific/Auckland','Pacific/Fiji','Pacific/Guam','Pacific/Honolulu'];
 let supported=[];try{supported=Intl.supportedValuesOf('timeZone');}catch{}
 return [...new Set([...usual,...supported,selected])].sort((a,b)=>a==='UTC'?-1:b==='UTC'?1:a.localeCompare(b));
}
