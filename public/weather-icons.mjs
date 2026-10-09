// Original outline glyphs, sized like text so the forecast stays responsive.
export function weatherGlyph(code){
 const cloud='<path d="M17 44h31a11 11 0 0 0 0-22 16 16 0 0 0-30-4 13 13 0 0 0-1 26Z"/>';
 const sun='<circle cx="32" cy="30" r="12"/><path d="M32 8v-5m0 54v-5M10 30H5m54 0h-5M16 14l-4-4m40 40-4-4M16 46l-4 4m40-40-4 4"/>';
 let paths=code===800?sun:code===801?'<path d="M14 17v-5m-6 7-4-2m16-3 3-4"/><circle cx="14" cy="25" r="9"/>'+cloud:cloud;
 if(code<300)paths+='<path d="m34 45-8 10h9l-5 7"/>';
 else if(code<600)paths+='<path d="m19 51-2 8m16-8-2 8m16-8-2 8"/>';
 else if(code<700)paths+='<path d="M20 50v10m-4-7 8 4m0-4-8 4M43 50v10m-4-7 8 4m0-4-8 4"/>';
 else if(code<800)paths+='<path d="M10 51h44M16 59h32"/>';
 return `<svg viewBox="0 0 64 64" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
