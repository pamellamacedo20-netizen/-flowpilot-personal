const PLANS={
  free:{id:'free',label:'Free',contactLimit:100,messageLimit:1000,automationRunLimit:2500},
  pro:{id:'pro',label:'Pro',contactLimit:10000,messageLimit:50000,automationRunLimit:100000},
  business:{id:'business',label:'Business',contactLimit:100000,messageLimit:500000,automationRunLimit:1000000}
};
function normalizePlan(name='free'){const n=String(name).toLowerCase();if(n.includes('business')||n.includes('enterprise'))return'business';if(n.includes('pro'))return'pro';return'free'}
function periodKey(date=new Date()){return date.toISOString().slice(0,7)}
function planFor(workspace){return PLANS[normalizePlan(workspace?.plan)]}
function billingSnapshot(workspace,usage={},contactCount=0){const plan=planFor(workspace);return{plan,period:periodKey(),usage:{contacts:contactCount,messages:Number(usage.messages||0),automationRuns:Number(usage.automation_runs||usage.automationRuns||0)},remaining:{contacts:Math.max(0,plan.contactLimit-contactCount),messages:Math.max(0,plan.messageLimit-Number(usage.messages||0)),automationRuns:Math.max(0,plan.automationRunLimit-Number(usage.automation_runs||usage.automationRuns||0))}}}
function enforce(snapshot,metric,amount=1){const key=metric==='automation_runs'?'automationRuns':metric;const used=Number(snapshot.usage[key]||0),limit=metric==='contacts'?snapshot.plan.contactLimit:metric==='messages'?snapshot.plan.messageLimit:snapshot.plan.automationRunLimit;if(used+amount>limit){const e=new Error(`plan_limit_exceeded:${metric}`);e.code='PLAN_LIMIT_EXCEEDED';e.status=402;throw e}return true}
module.exports={PLANS,normalizePlan,periodKey,planFor,billingSnapshot,enforce};
