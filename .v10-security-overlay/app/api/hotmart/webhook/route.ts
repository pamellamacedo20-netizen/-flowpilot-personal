import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

function safeEqual(a:string,b:string){
  const ab=Buffer.from(a); const bb=Buffer.from(b);
  return ab.length===bb.length && crypto.timingSafeEqual(ab,bb);
}
function eventTimestamp(value:unknown){
  if(typeof value==='number'&&Number.isFinite(value)) return Math.trunc(value);
  if(typeof value==='string'){
    const trimmed=value.trim();
    if(/^\d+$/.test(trimmed)) return Number(trimmed);
    const parsed=Date.parse(trimmed);
    if(Number.isFinite(parsed)) return parsed;
  }
  return Date.now();
}

export async function POST(req:NextRequest){
  const configured=process.env.HOTMART_HOTTOK||'';
  const received=req.headers.get('x-hotmart-hottok')||'';
  if(!configured || !received || !safeEqual(configured,received)){
    return NextResponse.json({ok:false,error:'unauthorized'},{status:401});
  }

  const internalSecret=process.env.HOTMART_INTERNAL_SECRET||'';
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
  const publishable=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'';
  if(!internalSecret || !url || !publishable){
    return NextResponse.json({ok:false,error:'integration_not_configured'},{status:503});
  }

  let payload:any;
  try{ payload=await req.json(); }
  catch{ return NextResponse.json({ok:false,error:'invalid_json'},{status:400}); }

  const event=String(payload?.event||'');
  const data=payload?.data||{};
  const email=String(data?.buyer?.email||'').trim().toLowerCase();
  const ucode=String(data?.product?.ucode||'').trim();
  const transaction=String(data?.purchase?.transaction||payload?.id||'');
  const rawAmount=Number(data?.purchase?.full_price?.value||0);
  const amount=Number.isFinite(rawAmount)?Math.round(rawAmount*100):0;
  const eventAt=eventTimestamp(payload?.creation_date);
  const eventId=String(payload?.id||`${transaction}:${event}`);

  const sb=createClient(url,publishable,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:result,error}=await sb.rpc('ingest_hotmart_event',{
    p_secret:internalSecret,
    p_event_id:eventId,
    p_transaction:transaction,
    p_buyer_email:email,
    p_product_ucode:ucode,
    p_event:event,
    p_amount_cents:amount,
    p_currency:String(data?.purchase?.full_price?.currency_value||'BRL'),
    p_raw:payload,
    p_event_at:eventAt,
  });
  if(error) return NextResponse.json({ok:false,error:'db_ingest'},{status:500});
  return NextResponse.json(result||{ok:true});
}
