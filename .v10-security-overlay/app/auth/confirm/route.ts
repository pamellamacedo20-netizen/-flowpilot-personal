import { NextRequest,NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { EmailOtpType } from '@supabase/supabase-js';
function safeNext(v:string|null){return v&&v.startsWith('/')&&!v.startsWith('//')?v:'/dashboard'}
export async function GET(req:NextRequest){
 const url=new URL(req.url),token_hash=url.searchParams.get('token_hash'),type=url.searchParams.get('type') as EmailOtpType|null,code=url.searchParams.get('code'),next=safeNext(url.searchParams.get('next'));
 const sb=await createClient();
 if(token_hash&&type){const {error}=await sb.auth.verifyOtp({type,token_hash});if(!error)return NextResponse.redirect(new URL(next,url.origin))}
 if(code){const {error}=await sb.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin))}
 const recovery=type==='recovery'||next.includes('update-password');
 return NextResponse.redirect(new URL(recovery?'/forgot-password?error=invalid_link':'/login?auth_error=1',url.origin));
}
