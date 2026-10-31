class RateLimiter{
  constructor({windowMs=60_000,max=120,maxKeys=10_000}={}){this.windowMs=windowMs;this.max=max;this.maxKeys=maxKeys;this.map=new Map()}
  consume(key,{windowMs=this.windowMs,max=this.max}={}){
    const now=Date.now();let item=this.map.get(key);
    if(!item||item.resetAt<=now){item={count:0,resetAt:now+windowMs};this.map.set(key,item)}
    item.count++;
    if(this.map.size>this.maxKeys)this.cleanup(now);
    return{ok:item.count<=max,limit:max,remaining:Math.max(0,max-item.count),resetAt:item.resetAt,retryAfterMs:Math.max(0,item.resetAt-now)}
  }
  cleanup(now=Date.now()){
    for(const [k,v] of this.map)if(v.resetAt<=now)this.map.delete(k);
    if(this.map.size>this.maxKeys){const excess=this.map.size-this.maxKeys;let i=0;for(const k of this.map.keys()){this.map.delete(k);if(++i>=excess)break}}
  }
}
function clientIp(req,{trustProxy=process.env.TRUST_PROXY==='true'}={}){
  if(trustProxy){const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();if(forwarded)return forwarded}
  return req.socket?.remoteAddress||'unknown';
}
module.exports={RateLimiter,clientIp};
