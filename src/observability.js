class Metrics{
  constructor(){this.startedAt=Date.now();this.counters=new Map();this.latencies=[]}
  inc(name,value=1){this.counters.set(name,(this.counters.get(name)||0)+value)}
  observeRequest(ms){this.latencies.push(ms);if(this.latencies.length>2000)this.latencies.splice(0,this.latencies.length-2000)}
  snapshot(){const xs=[...this.latencies].sort((a,b)=>a-b),pct=p=>xs.length?xs[Math.min(xs.length-1,Math.floor(xs.length*p))]:0;return{uptimeSeconds:Math.floor((Date.now()-this.startedAt)/1000),counters:Object.fromEntries(this.counters),requests:{samples:xs.length,p50Ms:pct(.5),p95Ms:pct(.95),p99Ms:pct(.99)}}}
  prometheus(){const snap=this.snapshot(),lines=[`flowpilot_uptime_seconds ${snap.uptimeSeconds}`];for(const [k,v] of Object.entries(snap.counters))lines.push(`flowpilot_${k.replace(/[^a-zA-Z0-9_:]/g,'_')} ${v}`);lines.push(`flowpilot_request_latency_p50_ms ${snap.requests.p50Ms}`,`flowpilot_request_latency_p95_ms ${snap.requests.p95Ms}`,`flowpilot_request_latency_p99_ms ${snap.requests.p99Ms}`);return lines.join('\n')+'\n'}
}
function log(level,event,meta={}){if(process.env.LOG_FORMAT==='silent')return;const row={ts:new Date().toISOString(),level,event,...meta};console[level==='error'?'error':'log'](JSON.stringify(row))}
module.exports={Metrics,log};
