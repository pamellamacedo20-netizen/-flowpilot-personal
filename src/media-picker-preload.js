'use strict';
const http=require('http');
const fs=require('fs');
const path=require('path');
const {createStore}=require('./store');
const {getSessionToken}=require('./auth');
const {decryptString}=require('./secrets');
const instagram=require('./providers/instagram');
const {normalizeMediaResponse,previewForId,isAllowedPreviewUrl}=require('./instagram/media-picker');

const ROOT=path.join(__dirname,'..');
const ORIGINAL_CREATE_SERVER=http.createServer;
let storePromise=null;
function getStore(){return storePromise||(storePromise=createStore(ROOT))}
function json(res,status,data){const body=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(body)}
function js(res,body){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','content-length':Buffer.byteLength(body),'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(body)}
async function context(req,url){
  const token=getSessionToken(req);if(!token)return null;const store=await getStore(),session=await store.findSession(token);if(!session)return null;const userId=session.userId||session.user_id,workspaces=await store.listUserWorkspaces(userId);if(!workspaces.length)return null;
  const requested=req.headers['x-workspace-id']||url.searchParams.get('workspaceId');const workspace=String(process.env.PERSONAL_MODE||'false').toLowerCase()==='true'?workspaces[0]:(requested?workspaces.find(w=>String(w.id)===String(requested)):workspaces[0]);if(!workspace)return null;return{store,workspace,userId};
}
async function instagramConnection(ctx){const c=await ctx.store.getConnection(ctx.workspace.id,'instagram');if(!c)throw Object.assign(new Error('instagram_connection_not_found'),{status:404});return c}
function providerEnv(conn){const token=decryptString(conn.encryptedAccessToken||conn.encrypted_access_token),meta=conn.metadata||{};return{...process.env,META_ACCESS_TOKEN:token,INSTAGRAM_ACCOUNT_ID:meta.instagramAccountId||conn.providerAccountId||conn.provider_account_id}}
async function listMedia(req,res,url){
  const ctx=await context(req,url);if(!ctx)return json(res,401,{error:'authentication_required'});try{const conn=await instagramConnection(ctx),limit=Math.max(1,Math.min(50,Number(url.searchParams.get('limit')||24))),after=url.searchParams.get('after')||null,data=await instagram.listMedia(providerEnv(conn),{limit,after});return json(res,200,normalizeMediaResponse(data))}catch(e){return json(res,e.status||502,{error:e.message==='instagram_connection_not_found'?e.message:'instagram_media_discovery_failed'})}
}
async function previewMedia(req,res,url){
  const ctx=await context(req,url);if(!ctx)return json(res,401,{error:'authentication_required'});const id=String(url.searchParams.get('id')||'');if(!id)return json(res,400,{error:'media_id_required'});
  try{const conn=await instagramConnection(ctx),env=providerEnv(conn),data=await instagram.graphRequest(encodeURIComponent(id),{method:'GET',params:{fields:'id,media_url,thumbnail_url'},env}),remote=previewForId({data:[data]},id);if(!remote||!isAllowedPreviewUrl(remote))return json(res,404,{error:'media_preview_unavailable'});const r=await fetch(remote,{headers:{accept:'image/*'},redirect:'follow'});if(!r.ok)return json(res,502,{error:'media_preview_fetch_failed'});const type=String(r.headers.get('content-type')||'');if(!type.startsWith('image/'))return json(res,415,{error:'media_preview_not_image'});const declared=Number(r.headers.get('content-length')||0);if(declared>8_000_000)return json(res,413,{error:'media_preview_too_large'});const buf=Buffer.from(await r.arrayBuffer());if(buf.length>8_000_000)return json(res,413,{error:'media_preview_too_large'});res.writeHead(200,{'content-type':type,'content-length':buf.length,'cache-control':'private, max-age=300','x-content-type-options':'nosniff'});return res.end(buf)}catch(e){return json(res,e.status||502,{error:e.message==='instagram_connection_not_found'?e.message:'media_preview_failed'})}
}
async function intercept(req,res){
  const url=new URL(req.url||'/','http://localhost');if(req.method==='GET'&&url.pathname==='/api/integrations/instagram/media')return listMedia(req,res,url).then(()=>true);if(req.method==='GET'&&url.pathname==='/api/integrations/instagram/media/preview')return previewMedia(req,res,url).then(()=>true);
  if(req.method==='GET'&&url.pathname==='/app.js'){try{const base=fs.readFileSync(path.join(ROOT,'app.js'),'utf8'),extension=fs.readFileSync(path.join(__dirname,'media-picker-client.js'),'utf8');js(res,`${base}\n\n/* FlowPilot Instagram media picker */\n${extension}\n`);return true}catch{return false}}
  return false;
}
http.createServer=function patchedCreateServer(...args){
  const index=typeof args[0]==='function'?0:1,listener=args[index];if(typeof listener!=='function')return ORIGINAL_CREATE_SERVER.apply(http,args);const wrapped=async(req,res)=>{try{if(await intercept(req,res))return}catch(e){if(!res.headersSent)return json(res,500,{error:'media_picker_extension_error'});return res.destroy()}return listener(req,res)};const next=[...args];next[index]=wrapped;return ORIGINAL_CREATE_SERVER.apply(http,next)};

module.exports={intercept,context,providerEnv};
