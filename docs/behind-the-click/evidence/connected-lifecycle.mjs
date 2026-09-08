import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4326/experience';
const out=new URL('./connected/',import.meta.url);await mkdir(out,{recursive:true});
const results=[];
try{
 for(const mode of ['mounted','loading','context-loss-loading']){
  const delayed=mode!=='mounted';
  const context=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await context.newPage();
  let release;const gate=new Promise(resolve=>release=resolve);
  if(delayed)await page.route('**/application-module.glb',async route=>{await gate;await route.continue();});
  await page.goto(base);
  const request=delayed?page.waitForRequest('**/application-module.glb'):null;
  await page.locator('a[href="#mission"]').click();
  if(delayed)await request;else await page.waitForSelector('#mission.journey--active');
  if(mode==='context-loss-loading'){
   await page.locator('[data-journey-scene] canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
   await page.waitForFunction(()=>document.querySelector('[data-journey-scene] canvas').getContext('webgl2').isContextLost());
  }else await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  release();await page.waitForTimeout(1400);
  assert.equal(await page.locator('#mission').evaluate(e=>e.classList.contains('journey--active')),false,mode+' restores static flow');
  for(const id of ['application','docker','kubernetes'])assert.equal(await page.locator('#'+id+' .journey__fallback').isVisible(),true,mode+' keeps '+id+' fallback');
  results.push({event:mode==='context-loss-loading'?'genuine WebGL context loss':'synthetic persisted pagehide',duringLoad:delayed,result:'static fallback remains'});
  await context.close();
 }
 await writeFile(new URL('lifecycle-report.json',out),JSON.stringify({status:'PASS',results},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',results}));
}finally{await browser.close();}
