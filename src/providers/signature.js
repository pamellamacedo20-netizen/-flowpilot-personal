const crypto=require('crypto');
function verifyMetaSignature(rawBody, header, appSecret){
  if(!appSecret || !header || !header.startsWith('sha256=')) return false;
  const expected='sha256='+crypto.createHmac('sha256',appSecret).update(rawBody).digest('hex');
  const a=Buffer.from(expected); const b=Buffer.from(header);
  return a.length===b.length && crypto.timingSafeEqual(a,b);
}
module.exports={verifyMetaSignature};
