'use strict';

function safeText(value,max=500){return String(value||'').slice(0,max)}
function previewUrl(item={}){return item.thumbnail_url||item.thumbnailUrl||item.media_url||item.mediaUrl||''}
function normalizeMediaResponse(data={}){
  const items=(Array.isArray(data.data)?data.data:[]).map(item=>({
    id:safeText(item.id,128),
    caption:safeText(item.caption,500),
    mediaType:safeText(item.media_type||item.mediaType,32),
    productType:safeText(item.media_product_type||item.productType,32),
    permalink:safeText(item.permalink,1000),
    timestamp:safeText(item.timestamp,64),
    commentsCount:Number(item.comments_count??item.commentsCount??0)||0,
    hasPreview:!!previewUrl(item)
  })).filter(item=>item.id);
  return {items,cursor:safeText(data.paging?.cursors?.after,512)||null};
}
function isAllowedPreviewUrl(raw){
  try{
    const u=new URL(String(raw||''));if(u.protocol!=='https:')return false;
    const h=u.hostname.toLowerCase();return h==='instagram.com'||h.endsWith('.instagram.com')||h==='cdninstagram.com'||h.endsWith('.cdninstagram.com')||h==='fbcdn.net'||h.endsWith('.fbcdn.net')||h==='facebook.com'||h.endsWith('.facebook.com');
  }catch{return false}
}
function previewForId(data,id){
  const item=(Array.isArray(data?.data)?data.data:[]).find(x=>String(x.id)===String(id));if(!item)return null;const url=previewUrl(item);return isAllowedPreviewUrl(url)?url:null;
}
module.exports={normalizeMediaResponse,isAllowedPreviewUrl,previewForId,previewUrl};
