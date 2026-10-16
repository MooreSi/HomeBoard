import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {app} from '../helpers/app.mjs';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
for(const viewport of [{width:1024,height:650},{width:768,height:1024}])test(`iCloud calendar connects, selects and disconnects at ${viewport.width}×${viewport.height}`,async t=>{
 const a=await app(t,{fake:true}),browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport,isMobile:true,hasTouch:true,deviceScaleFactor:2});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(a.base+'/settings');await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='All changes saved');
 await page.locator('#icloudEmail').fill('demo@example.com');await page.locator('#icloudPassword').fill('aaaa-bbbb-cccc-dddd');await page.locator('#icloudConnect').click();
 await page.locator('#icloudCalendars input').waitFor();assert.equal(await page.locator('#icloudPassword').inputValue(),'');assert.equal(await page.locator('#icloudEmail').inputValue(),'');assert.equal(await page.locator('#icloudCalendars label').textContent(),'Demo family');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.locator('#icloudCalendars input').uncheck();await page.locator('#icloudSelectionSave').click();await page.waitForFunction(()=>document.querySelector('#icloudStatus').textContent==='Calendar selection saved.');assert.deepEqual((await a.json('/api/settings')).icloudCalendarIds,[]);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#icloudStatus').textContent==='iCloud connected. Choose calendars to display.');assert.equal(await page.locator('#icloudCalendars input').isChecked(),false);
 await page.locator('#icloudDisconnect').click();await page.waitForFunction(()=>document.querySelector('#icloudStatus').textContent==='iCloud calendar disconnected.');assert.equal((await a.json('/api/status')).providers.icloud.connected,false);assert.deepEqual(errors,[]);
});
