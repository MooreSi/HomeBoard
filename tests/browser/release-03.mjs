import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {app} from '../helpers/app.mjs';
const require=createRequire(import.meta.url);
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
async function browserPage(t,a,viewport={width:1500,height:1100}){
 const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
 const browser=await engine.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport}),errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[],'No browser script errors'));
 await page.goto(a.base+'/settings');await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='All changes saved'&&document.querySelector('#designLibrary').children.length);
 return page;
}
async function save(page){await page.locator('#settingsForm button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent.startsWith('Saved'));}

test('Starter previews show professional miniature layouts',async t=>{
 const a=await app(t),page=await browserPage(t,a);
 const thumb=await page.locator('[data-starter=family] .designThumbnail').boundingBox();assert.ok(thumb.width>150);assert.ok(thumb.height>80);
});
test('Empty selected family panels retain their headings in the canvas and dashboard',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();
 const frame=page.frameLocator('#designPreview');await frame.locator('[data-design-panel=lists]').waitFor({state:'visible',timeout:3000});
 assert.equal(await frame.locator('[data-design-panel=lists] h2').textContent(),'Shared lists');
 await save(page);await page.goto(a.base+'/');await page.locator('[data-design-panel=lists]').waitFor({state:'visible'});
 assert.equal(await page.locator('[data-design-panel=lists] h2').textContent(),'Shared lists');
 assert.equal(await page.locator('[data-family-panel] header a').count(),0);
});
test('Left drag resizes a panel, right-click does not drag it, and one undo reverses a whole gesture',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();
 const panel=page.locator('#designCanvas [data-panel=calendar]');await panel.scrollIntoViewIfNeeded();
 const canvas=await page.locator('#designCanvas').boundingBox(),p=await panel.boundingBox();
 await panel.click({button:'right',position:{x:100,y:60}});assert.equal(await page.locator('.designContext').isVisible(),true);
 assert.equal(await page.locator('#designW').inputValue(),'8');await page.keyboard.press('Escape');
 await page.mouse.move(p.x+p.width/2,p.y+p.height-1);await page.mouse.down();await page.mouse.move(p.x+p.width/2,p.y+p.height-1-canvas.height/6,{steps:10});await page.mouse.up();
 assert.equal(await page.locator('#designH').inputValue(),'7');await page.locator('#designUndo').click();assert.equal(await page.locator('#designH').inputValue(),'9');
 await page.locator('#designRedo').click();assert.equal(await page.locator('#designH').inputValue(),'7');
 await panel.click({button:'right',position:{x:100,y:60}});await page.getByRole('menuitem',{name:'More layout actions…',exact:true}).click();await page.getByRole('menuitem',{name:'Size: compact (3 × 3)',exact:true}).click();
 assert.equal(await page.locator('#designW').inputValue(),'3');assert.equal(await page.locator('#designH').inputValue(),'3');
});
test('Management themes remain separate, global timezones are selectable and Auto responds to device changes',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-theme-id=metro]').click();assert.equal(await page.locator('body').getAttribute('data-theme'),null);
 await page.locator('#managementAppearance').selectOption('dark');await save(page);
 const dark=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);assert.equal(dark,'rgb(17, 25, 35)');
 await page.locator('#timezoneSearch').fill('Tokyo');await page.locator('#timezone').selectOption('Asia/Tokyo');await save(page);assert.equal((await a.json('/api/settings')).timezone,'Asia/Tokyo');
 await page.goto(a.base+'/family');await page.waitForSelector('#familyEditor .settingsCard');assert.equal(await page.locator('body').getAttribute('data-appearance'),'dark');assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),dark);
 await page.goto(a.base+'/settings');await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='All changes saved');await page.locator('#managementAppearance').selectOption('auto');
 await page.emulateMedia({colorScheme:'dark'});assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),dark);
 await page.emulateMedia({colorScheme:'light'});assert.equal(await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(244, 246, 248)');
});
test('Saved design library reloads drafts, preserves edits through undo and persists across restart',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();await page.locator('#designName').fill('Family library');await page.locator('#designLibrarySave').click();
 await page.waitForFunction(()=>document.querySelector('#designLibrary').textContent.includes('Family library'));
 await page.locator('[data-starter=studio]').click();await page.locator('[data-library-load]').click();assert.equal(await page.locator('#designName').inputValue(),'Family library');
 await page.locator('#designUndo').click();assert.equal(await page.locator('#designName').inputValue(),'Studio · a clear day');
 await a.restart();await page.reload();await page.waitForFunction(()=>document.querySelector('#designLibrary').textContent.includes('Family library'));
 page.once('dialog',d=>d.accept());await page.locator('[data-library-remove]').click();await page.waitForFunction(()=>!document.querySelector('#designLibrary').textContent.includes('Family library'));
 assert.deepEqual((await a.json('/api/family')).screens,[]);
});
test('Portrait and phone management pages fit the viewport and dashboard calendar controls never overlap',async t=>{
 const a=await app(t),page=await browserPage(t,a,{width:390,height:844});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('[data-starter=family]').click();
 const calendar=page.frameLocator('#designPreview').locator('[data-design-panel=calendar]');await calendar.waitFor({state:'visible'});
 await page.waitForFunction(()=>document.querySelector('#designPreview').contentDocument.body.dataset.previewOrientation==='landscape');
 assert.equal(await calendar.evaluate(el=>getComputedStyle(el).gridColumn),'5 / span 8','Landscape preview uses landscape placement even on a phone');
 await page.locator('#designOrientation').selectOption('portrait');
 await page.frameLocator('#designPreview').locator('body[data-preview-orientation=portrait]').waitFor();
 await save(page);await page.goto(a.base+'/');await page.locator('body[data-custom-design=true]').waitFor();
 const boxes=await page.locator('.calendar nav,.calendar .period,.calendarFilters,#calendar').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};}));
 assert.ok(boxes[1].top>=boxes[0].bottom);assert.ok(boxes[2].top>=boxes[1].bottom);assert.ok(boxes[3].top>=boxes[2].bottom);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.goto(a.base+'/family');await page.waitForSelector('#familyEditor .settingsCard');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
});

test('A portrait tablet uses the independent portrait design at widths above 700px',async t=>{
 const a=await app(t),page=await browserPage(t,a,{width:800,height:1200});await page.locator('[data-starter=family]').click();await save(page);
 await page.goto(a.base+'/');await page.locator('body[data-custom-design=true]').waitFor();
 assert.equal(await page.locator('[data-design-panel=calendar]').evaluate(el=>getComputedStyle(el).gridColumn),'1 / span 12');
 assert.equal(await page.locator('[data-design-panel=calendar]').evaluate(el=>getComputedStyle(el).gridRow),'3 / span 5');
});

test('Right-click appearance and placement menus edit the selected panel without leaving the canvas',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();
 const panel=page.locator('#designCanvas [data-panel=calendar]');await panel.click({button:'right',position:{x:90,y:70}});
 const appearance=page.getByRole('menuitem',{name:'Panel appearance…',exact:true});assert.equal(await appearance.count(),1,'Right-click should offer direct appearance controls');await appearance.click();
 await page.getByRole('combobox',{name:'Panel font',exact:true}).selectOption('serif');
 await page.getByRole('combobox',{name:'Panel text size',exact:true}).selectOption('20');await page.keyboard.press('Escape');
 await save(page);const d=(await a.json('/api/settings')).customDesign;assert.equal(d.panelStyles.calendar.custom,true);assert.equal(d.panelStyles.calendar.font,'serif');assert.equal(d.panelStyles.calendar.fontSize,20);
 await panel.click({button:'right',position:{x:90,y:70}});await page.getByRole('menuitem',{name:'Position & size…',exact:true}).click();
 await page.getByRole('combobox',{name:'Panel width',exact:true}).selectOption('6');await page.keyboard.press('Escape');
 assert.equal(await page.locator('#designW').inputValue(),'6');
});

test('Password setup is explicitly optional and an unlocked browser can turn protection off',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.goto(a.base+'/login?next=/settings');
 await page.locator('#skipPassword').waitFor({state:'visible'});await page.locator('#skipPassword').click();await page.waitForURL(a.base+'/settings');
 await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='All changes saved');
 await page.locator('#settingsProtect').click();await page.locator('#confirmLabel').waitFor({state:'visible'});
 await page.locator('#password').fill('test-browser-password');await page.locator('#confirmPassword').fill('test-browser-password');await page.locator('#loginForm button[type=submit]').click();
 await page.waitForURL(a.base+'/settings');await page.locator('#settingsUnprotect').waitFor({state:'visible'});await page.locator('#settingsUnprotect').click();
 await page.waitForFunction(()=>document.querySelector('#settingsAuthHint').textContent.includes('optional'));
 assert.equal((await a.json('/api/auth/status')).configured,false);assert.equal((await a.post('/api/settings',{name:'Optional protection'})).status,200);
});

test('Calendar view selection marks only view buttons as pressed, never the page body',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.goto(a.base+'/');await page.locator('.calendarPage').waitFor();
 assert.equal(await page.locator('body').getAttribute('aria-pressed'),null);assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('active')),false);
 assert.equal(await page.locator('button[data-view][aria-pressed=true]').count(),1);
 await page.locator('button[data-view=month]').click();await page.locator('.month').waitFor();assert.equal(await page.locator('button[data-view=month]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('body').getAttribute('aria-pressed'),null);
});

test('Screen heading size changes are reflected by the live canvas typography',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();
 const clock=page.frameLocator('#designPreview').locator('#clock');await clock.waitFor({state:'visible'});
 const before=await clock.evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
 await page.locator('#designScreenStyle').click();await page.getByRole('combobox',{name:'Heading size',exact:true}).selectOption('40');
 await page.waitForFunction(()=>document.querySelector('#designPreview').contentDocument.querySelector('.dashboard').style.getPropertyValue('--design-headingSize')==='40px');
 assert.ok(await clock.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>before,'Heading size should affect the preview clock');
});

test('Resize overlays align with the actual panel edges even when the design has gaps',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();
 await page.frameLocator('#designPreview').locator('[data-design-panel=calendar]').waitFor({state:'visible'});
 const difference=await page.evaluate(()=>{const overlay=document.querySelector('#designCanvas [data-panel=calendar]').getBoundingClientRect(),frame=document.querySelector('#designPreview').getBoundingClientRect(),actual=document.querySelector('#designPreview').contentDocument.querySelector('[data-design-panel=calendar]').getBoundingClientRect();return {x:Math.abs(overlay.x-frame.x-actual.x),width:Math.abs(overlay.width-actual.width)};});
 assert.ok(difference.x<=1,'Selection should follow the rendered panel left edge');assert.ok(difference.width<=1,'Resize handles should follow the rendered panel width');
});

test('Bin panel typography uses independent heading, body and secondary sizes and styles from right-click',async t=>{
 const a=await app(t);await a.post('/api/family',{revision:0,collection:'bins',action:'save',item:{id:'demo-bin',title:'Demo recycling',date:'2026-10-10',every:14,color:'#557860',exceptions:[],reminderDays:1}});
 const page=await browserPage(t,a);await page.locator('[data-starter=family]').click();await page.locator('#designCanvas [data-panel=bins]').click({button:'right',position:{x:50,y:30}});await page.getByRole('menuitem',{name:'Panel appearance…',exact:true}).click();
 const heading=page.getByRole('combobox',{name:'Heading size',exact:true});assert.equal(await heading.count(),1,'Panel heading needs an independent font size');await heading.selectOption('16');
 await page.getByRole('combobox',{name:'Panel text size',exact:true}).selectOption('12');await page.getByRole('combobox',{name:'Secondary text size',exact:true}).selectOption('10');await page.getByRole('combobox',{name:'Heading italic',exact:true}).selectOption('true');await page.getByRole('combobox',{name:'Body weight',exact:true}).selectOption('700');
 await page.keyboard.press('Escape');await save(page);await page.goto(a.base+'/');await page.locator('[data-design-panel=bins]').waitFor({state:'visible'});
 const sizes=await page.locator('[data-design-panel=bins]').evaluate(el=>({heading:getComputedStyle(el.querySelector('h2')).fontSize,body:getComputedStyle(el.querySelector('h3')).fontSize,secondary:getComputedStyle(el.querySelector('article p')).fontSize,italic:getComputedStyle(el.querySelector('h2')).fontStyle,weight:getComputedStyle(el.querySelector('h3')).fontWeight}));
 assert.deepEqual(sizes,{heading:'16px',body:'12px',secondary:'10px',italic:'italic',weight:'700'});
});
test('Built-in theme loading makes an editable library copy without changing the default catalogue',async t=>{
 const a=await app(t),page=await browserPage(t,a),before=await a.json('/api/themes');const source=page.locator('#designThemeSource');assert.equal(await source.count(),1,'Built-in themes need a load selector');await page.waitForFunction(()=>document.querySelector('#designThemeSource').options.length===17);
 await source.selectOption('metro');await page.locator('#designLoadTheme').click();assert.equal(await page.locator('#designName').inputValue(),'Metro · my design');await page.locator('#designLibrarySave').click();await page.waitForFunction(()=>document.querySelector('#designLibrary').textContent.includes('Metro · my design'));
 assert.deepEqual(await a.json('/api/themes'),before);assert.equal((await a.json('/api/settings')).theme,'homeboard');assert.equal((await a.json('/api/family')).screens[0].design.colors.background,'#10151c');
});
test('Locked panels resist keyboard movement and a clean preview hides editing handles',async t=>{
 const a=await app(t),page=await browserPage(t,a);await page.locator('[data-starter=family]').click();const panel=page.locator('#designCanvas [data-panel=calendar]');await panel.click({button:'right',position:{x:80,y:40}});
 const lock=page.getByRole('menuitem',{name:'Lock position',exact:true});assert.equal(await lock.count(),1,'Panels need a position lock');await lock.click();await panel.focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('#designX').inputValue(),'5');
 await panel.click({button:'right',position:{x:80,y:40}});assert.equal(await page.getByRole('menuitem',{name:'Copy panel style',exact:true}).isEnabled(),true,'Position locks permit copying appearance');await page.getByRole('menuitem',{name:'More layout actions…',exact:true}).click();assert.equal(await page.getByRole('menuitem',{name:'Bring to front',exact:true}).isDisabled(),true,'Position locks protect layer order');await page.keyboard.press('Escape');
 await page.locator('#designPreviewToggle').click();assert.equal(await panel.isVisible(),false);assert.equal(await page.frameLocator('#designPreview').locator('.calendar').isVisible(),true);await page.locator('#designPreviewToggle').click();assert.equal(await panel.isVisible(),true);
});

test('Compact bin styling fits a short panel and copied typography can be pasted independently',async t=>{
 const a=await app(t);await a.post('/api/family',{revision:0,collection:'bins',action:'save',item:{id:'demo-bin',title:'Demo recycling',date:'2026-10-10',every:14,color:'#557860',exceptions:[],reminderDays:1}});
 const page=await browserPage(t,a);await page.locator('[data-starter=family]').click();const bin=page.locator('#designCanvas [data-panel=bins]');await bin.click({button:'right',position:{x:50,y:30}});await page.getByRole('menuitem',{name:'Make compact',exact:true}).click();
 await bin.click({button:'right',position:{x:50,y:30}});await page.getByRole('menuitem',{name:'Copy panel style',exact:true}).click();await page.locator('#designCanvas [data-panel=chores]').click({button:'right',position:{x:50,y:30}});await page.getByRole('menuitem',{name:'Paste panel style',exact:true}).click();await save(page);
 const d=(await a.json('/api/settings')).customDesign;assert.equal(d.panelStyles.bins.headingSize,16);assert.equal(d.panelStyles.bins.padding,8);assert.deepEqual(d.panelStyles.chores,d.panelStyles.bins);
 await page.goto(a.base+'/');await page.locator('[data-design-panel=bins] article').waitFor();assert.equal(await page.locator('[data-design-panel=bins]').evaluate(el=>el.scrollHeight<=el.clientHeight),true,'Compact bin content should fit without internal scrolling');
});
