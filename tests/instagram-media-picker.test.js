const test=require('node:test');
const assert=require('node:assert/strict');
const {normalizeMediaResponse,isAllowedPreviewUrl,previewForId}=require('../src/instagram/media-picker');

test('media picker response exposes only safe media metadata and cursor',()=>{
  const raw={data:[{id:'m1',caption:'Legenda',media_type:'VIDEO',media_product_type:'REELS',media_url:'https://scontent.cdninstagram.com/a.jpg',thumbnail_url:'https://scontent.cdninstagram.com/t.jpg',permalink:'https://www.instagram.com/reel/x/',timestamp:'2026-11-02T12:00:00Z',comments_count:12,access_token:'secret'}],paging:{cursors:{after:'cursor_1'},next:'https://graph.example/?access_token=secret'}};
  const out=normalizeMediaResponse(raw);assert.equal(out.items.length,1);assert.equal(out.items[0].id,'m1');assert.equal(out.items[0].productType,'REELS');assert.equal(out.items[0].hasPreview,true);assert.equal(out.cursor,'cursor_1');assert.equal('mediaUrl' in out.items[0],false);assert.equal('thumbnailUrl' in out.items[0],false);assert.doesNotMatch(JSON.stringify(out),/secret/);
});

test('preview proxy only accepts expected Instagram/Facebook CDN hosts',()=>{
  for(const u of ['https://scontent.cdninstagram.com/x.jpg','https://abc.fbcdn.net/x.jpg','https://www.instagram.com/x.jpg'])assert.equal(isAllowedPreviewUrl(u),true);
  for(const u of ['http://cdninstagram.com/x.jpg','https://evil.example/x.jpg','file:///etc/passwd','javascript:alert(1)'])assert.equal(isAllowedPreviewUrl(u),false);
});

test('previewForId chooses thumbnail before full media and rejects unsafe URL',()=>{
  assert.equal(previewForId({data:[{id:'m1',thumbnail_url:'https://scontent.cdninstagram.com/t.jpg',media_url:'https://scontent.cdninstagram.com/v.mp4'}]},'m1'),'https://scontent.cdninstagram.com/t.jpg');
  assert.equal(previewForId({data:[{id:'m2',thumbnail_url:'https://evil.example/t.jpg'}]},'m2'),null);
});
