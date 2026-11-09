import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const base = process.env.DT_URL || 'http://127.0.0.1:8765/index.html?qa=1';
const results=[];
const pageErrors=[];
const failedRequests=[];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1200,height:900}});
const page=await context.newPage();
page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
page.on('response',response=>{
  if(response.url().startsWith('http://127.0.0.1:8765/')&&response.status()>=400)failedRequests.push(response.url()+' '+response.status());
});
page.on('dialog',async d=>d.dismiss());

async function check(name,fn) {
  try{await fn();results.push({name,ok:true});console.log('PASS',name);}
  catch(e){results.push({name,ok:false,error:String(e.stack||e)});console.error('FAIL',name,String(e.message||e));}
}
async function browse(name,query,exactTitle) {
  await page.locator('.nav-btn[data-view="'+name+'"]').click();
  await page.locator('#searchInput').fill(query);
  const cards=page.locator('.disease-list .disease-card');
  if(exactTitle) await cards.filter({has:page.getByText(exactTitle,{exact:true})}).first().click();
  else await cards.first().click();
  await page.waitForFunction(()=>document.body.classList.contains('consultorio-detail-mode'),undefined,{timeout:10000});
}
await page.goto(base,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>Array.isArray(window.DERMA_TRICHO_DATA)&&window.DERMA_TRICHO_DATA.length>=56&&!!window.DT_QA,{timeout:30000});
await check('initial catalogs and key modules',async()=>{
  const data=await page.evaluate(()=>({d:window.DERMA_TRICHO_DATA.length,m:window.DERMA_TRICHO_PRESCRIPTIONS.length,qa:!!window.DT_QA,p:!!window.DT_EXPANDED_TREATMENT_PROTOCOLS}));
  assert.equal(data.d,56);assert(data.m>=71);assert(data.qa&&data.p);
});
await check('AFF trichology card and clinical flowchart',async()=>{
  await browse('trichology','fibrosante frontal','Alopecia fibrosante frontal');
  await page.waitForFunction(()=>document.querySelector('#detailPanel .detail-title')?.textContent?.includes('Alopecia fibrosante frontal'),undefined,{timeout:15000});
  assert(await page.locator('[data-dt-flowchart]').count()>0,'missing AFF flowchart');
  assert((await page.locator('#detailPanel').innerText()).includes('Conduta curada'));
});
await check('hanseniase has disease-specific expanded protocol',async()=>{
  await browse('dermatology','Hanseníase','Hanseníase');
  await page.waitForFunction(()=>document.querySelector('[data-expanded-protocol]')?.getAttribute('data-expanded-protocol')==='Hanseníase',undefined,{timeout:15000});
  assert((await page.locator('[data-expanded-protocol]').textContent()).includes('Conduta inicial'));
});
await check('prescription gate and G6PD field',async()=>{
  await browse('prescriptions','Dapsona sistêmica','Dapsona sistêmica');
  await page.waitForFunction(()=>document.querySelector('.rx-safety-gate'),undefined,{timeout:12000});
  assert(await page.locator('[data-rx-profile="g6pd"]').count()>0);
  assert(await page.locator('[data-rx-profile="tb"]').count()>0);
});
await check('DDI refreshes on co-medication edit without DOM replacement loop',async()=>{
  await browse('prescriptions','Isotretinoína','Isotretinoína');
  await page.waitForFunction(()=>document.querySelector('.ddi-critical-layer'),undefined,{timeout:15000});
  await page.locator('[data-rx-profile="meds"]').fill('doxiciclina');
  await page.waitForFunction(()=>document.querySelector('.ddi-critical-layer')?.textContent?.includes('hipertensão intracraniana'),undefined,{timeout:12000});
  const probe=await page.evaluate(()=>{let el=document.querySelector('.ddi-critical-layer');el.dataset.smokeProbe='keep';return !!el});
  assert(probe);
  await page.waitForTimeout(600);
  assert.equal(await page.locator('[data-smoke-probe="keep"]').count(),1,'DDI layer was repeatedly recreated without clinical changes');
  await page.locator('[data-rx-profile="meds"]').fill('');
  await page.waitForFunction(()=>!document.querySelector('.ddi-critical-layer')?.textContent?.includes('hipertensão intracraniana'),undefined,{timeout:15000});
});
await check('unsafe recipe copy never reaches clipboard handler',async()=>{
  await page.evaluate(()=>{
    const bad=[{id:'rx-isotretinoin',name:'Isotretinoína',instructions:'20 mg ao dia'},{id:'rx-doxycycline',name:'Doxiciclina',instructions:'100 mg ao dia'}];
    localStorage.setItem('dt-prescription-cart-v1',JSON.stringify(bad));
    window.__smokeCopies=0;
    if(window.DT_UI)window.DT_UI.copyText=()=>{window.__smokeCopies++;return Promise.resolve(true)};
  });
  await page.locator('[data-open-rx-cart]').click();
  assert((await page.locator('#rxCartDialog').innerText()).includes('EXPORTAÇÃO BLOQUEADA'));
  await page.locator('[data-copy-rx-cart]').click();
  assert.equal(await page.evaluate(()=>window.__smokeCopies),0,'clipboard fallback bypassed cart safety');
  await page.locator('[data-close-rx-cart]').click();
});
await check('mobile navigation and medical detail',async()=>{
  await page.setViewportSize({width:390,height:844});
  await browse('dermatology','acne','Acne vulgar');
  await page.waitForFunction(()=>document.querySelector('#detailPanel .detail-title')?.textContent?.includes('Acne'),undefined,{timeout:10000});
  assert(await page.locator('#detailPanel .detail-title').isVisible());
});
await check('no missing JS/CSS or synchronous script errors',async()=>{
  assert.deepEqual(failedRequests,[]);
  assert.deepEqual(pageErrors,[]);
});

const failures=results.filter(r=>!r.ok);
await fs.mkdir('dermatricho-clinical/tests/results',{recursive:true});
await fs.writeFile('dermatricho-clinical/tests/results/smoke.json',JSON.stringify({at:new Date().toISOString(),base,results,pageErrors,failedRequests},null,2));
await page.screenshot({path:'dermatricho-clinical/tests/results/mobile.png',fullPage:true}).catch(()=>{});
await browser.close();
console.log('TOTAL',results.length,'FAILURES',failures.length);
if(failures.length)process.exitCode=1;
