import {chromium} from 'playwright-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4325/experience';
const out=new URL('./connected/',import.meta.url);await mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
const frames=['application','docker','kubernetes'];
const save=(page,name)=>page.screenshot({path:new URL(name+'.png',out).pathname});
async function phase(page,name) {
 await page.locator('a[href="#'+name+'"]:visible').first().click();
 await page.waitForFunction(n=>document.querySelector('#mission').dataset.journeyPhase===n,name);
 await page.waitForTimeout(250);
 assert.equal(await page.locator('#mission').getAttribute('data-journey-phase'),name);
 const current=await page.locator('.journey__rail a[aria-current]').evaluateAll(es=>es.filter(e=>e.getAttribute('aria-current')!=='false').map(e=>e.getAttribute('href')));
 assert.deepEqual(current,['#'+name],'chapter rail follows current visual phase');
}
async function mobileZones(page,label) {
 const width=page.viewportSize().width;if(width>=1000)return;
 const id=await page.locator('#mission').getAttribute('data-journey-phase');
 const copy=await page.locator('#'+id+' .journey__copy').boundingBox();
 const scene=await page.locator('[data-journey-scene]').boundingBox();
 const rail=await page.locator('.journey__rail').boundingBox();
 assert.ok(copy&&scene&&rail,'active caption has bounds '+label);
 assert.ok(copy.y>=scene.y+scene.height+8,'caption clears model '+label);
 assert.ok(copy.y+copy.height<=rail.y-8,'caption clears rail '+label);
}
async function position(page,p) {
 await page.locator('#mission').evaluate((e,v)=>scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*v,behavior:'instant'}),p);
 await page.waitForTimeout(200);
 await mobileZones(page,'progress '+p);
 return await page.locator('#mission').getAttribute('data-sc-verify-state');
}
try{
 for(const [width,height] of [[375,900],[768,900],[1440,900],[375,812],[375,667]])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height},colorScheme:theme});
  const page=await context.newPage(),errors=[],models=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().endsWith('application-module.glb'))models.push(r.url());});
  await page.goto(base);await page.evaluate(()=>document.fonts.ready);
  assert.equal(models.length,0,'model stays unloaded before story approaches viewport');
  await page.locator('a[href="#mission"]').click();
  await page.waitForSelector('#mission.journey--active',{timeout:30000});
  assert.ok(models.length>0,'entering story loads model');
  assert.equal(await page.locator('[data-journey-scene] canvas').evaluate(c=>c.width>0&&c.height>0),true,'nonzero rendered backing store');
  for(const name of frames){
   await phase(page,name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'overflow '+width+'/'+theme+'/'+name);
   const contrast=await page.locator('#'+name+' .lead').evaluate(e=>{const lum=c=>{const v=c.match(/[0-9.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*v[0]+.7152*v[1]+.0722*v[2];};const a=lum(getComputedStyle(e).color),b=lum(getComputedStyle(document.querySelector('#mission')).backgroundColor);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);});
   assert.ok(contrast>=4.5,'active copy contrast '+width+'/'+theme+'/'+name+' = '+contrast.toFixed(2));
   await save(page,width+(height===900?'':'x'+height)+'-'+theme+'-'+name);
   await mobileZones(page,width+'x'+height+'/'+name);
   if(width<1000){const copy=await page.locator('#'+name+' .journey__copy').boundingBox();const rail=await page.locator('.journey__rail').boundingBox();assert.ok(copy&&rail&&copy.y+copy.height<=rail.y-8,'caption clears chapter rail '+width+'/'+theme+'/'+name);}
  }
  const end=await position(page,.92);const start=await position(page,.02);const returned=await position(page,.92);
  assert.notEqual(start,end,'scroll must transform visible scene');
  assert.equal(returned,end,'reverse travel must reproduce same scene');
  if((width===1440&&theme==='dark')||(width===375&&height===812&&theme==='light'))for(const p of [.0,.18,.32,.45,.58,.72,.88,1]){await position(page,p);await save(page,(width<1000?'mobile-':'')+'timeline-'+Math.round(p*100));}
  await page.locator('[data-stop]').click();assert.equal(await page.locator('[data-recovery]').getAttribute('data-phase'),'recovering');
  await page.locator('[data-reset]').click();assert.equal(await page.locator('[data-recovery]').getAttribute('data-phase'),'ready');
  await page.locator('[data-stop]').click();await page.waitForFunction(()=>document.querySelector('[data-recovery]').dataset.phase==='ready');
  if(width===1440&&theme==='dark'){
   await phase(page,'kubernetes');
   await page.locator('[data-journey-scene] canvas').evaluate(c=>c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
   await page.waitForFunction(()=>!document.querySelector('#mission').classList.contains('journey--active'));
   for(const id of frames) assert.equal(await page.locator('#'+id+' .journey__fallback').isVisible(),true,'context loss restores '+id);
   await save(page,'context-loss');
  }
  const links=await page.locator('.course-row').evaluateAll(es=>es.map(e=>e.getAttribute('href')));
  assert.equal(links.length,4);for(const link of links)assert.equal((await page.request.get(new URL(link,base).href)).status(),200);
  assert.deepEqual(errors,[]);
  console.log('PASS viewport',width,height,theme);results.push({width,height,theme,phases:frames,reversal:'pass',recovery:'pass',overflow:false,pageErrors:errors});await context.close();
 }
 for(const mode of ['nojs','reduced','failed-model']){
  const context=await browser.newContext({viewport:{width:375,height:812},colorScheme:'light',javaScriptEnabled:mode!=='nojs',reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  const page=await context.newPage();if(mode==='failed-model')await page.route('**/application-module.glb',r=>r.abort());
  await page.goto(base+'#mission');await page.waitForTimeout(700);
  assert.equal(await page.locator('#mission').evaluate(e=>e.classList.contains('journey--active')),false);
  let last=-Infinity;
  for(const id of frames){
   const chapter=page.locator('#'+id),image=chapter.locator('.journey__fallback');
   assert.equal(await image.isVisible(),true);
   const top=await chapter.evaluate(e=>e.getBoundingClientRect().top+scrollY);assert.ok(top>last,'all chapters remain normal flow');last=top;
   await chapter.evaluate(e=>e.scrollIntoView({behavior:'instant',block:'start'}));await page.waitForTimeout(150);await save(page,mode+'-'+id);
  }
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  console.log('PASS fallback',mode);results.push({mode,allChapters:'visible in flow'});await context.close();
 }
 const keyboard=await browser.newPage({viewport:{width:1440,height:900}});
 await keyboard.goto(base);await keyboard.keyboard.press('Tab');assert.equal(await keyboard.evaluate(()=>document.activeElement.textContent),'Skip to content');
 await keyboard.keyboard.press('Enter');results.push({keyboard:'skip focus and activation pass'});await keyboard.close();
 await writeFile(new URL('report.json',out),JSON.stringify({status:'PASS',results},null,2)+'\n');
 console.log(JSON.stringify({status:'PASS',results},null,2));
}finally{await browser.close();}
