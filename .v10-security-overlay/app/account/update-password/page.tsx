'use client';
import { FormEvent,useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateStrongPassword } from '@/lib/password';
export default function UpdatePassword(){
 const router=useRouter();
 const [ready,setReady]=useState(false),[msg,setMsg]=useState(''),[checking,setChecking]=useState(true);
 useEffect(()=>{
   const sb=createClient();
   void sb.auth.getSession().then(({data})=>{setReady(Boolean(data.session));setChecking(false)});
   const {data:{subscription}}=sb.auth.onAuthStateChange((_event,session)=>{setReady(Boolean(session));setChecking(false)});
   return ()=>subscription.unsubscribe();
 },[]);
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setMsg('');
   const fd=new FormData(e.currentTarget),a=String(fd.get('password')||''),b=String(fd.get('confirm')||'');
   if(a!==b){setMsg('As senhas não coincidem.');return}
   const strength=validateStrongPassword(a);if(!strength.ok){setMsg(strength.message);return}
   const {error}=await createClient().auth.updateUser({password:a});
   if(error){setMsg(error.message);return}
   router.replace('/login?password_updated=1');
 }
 return <div className="auth-simple"><form className="form" onSubmit={submit}><span className="eyebrow">SEGURANÇA</span><h1>Criar nova senha</h1>{checking&&<div className="notice">Validando o link de recuperação…</div>}{!checking&&!ready&&<div className="notice">Este link não criou uma sessão válida ou expirou. <a href="/forgot-password" style={{textDecoration:'underline',fontWeight:700}}>Solicitar um novo link</a>.</div>}<label className="field"><span>Nova senha</span><input name="password" type="password" autoComplete="new-password" required minLength={12}/></label><label className="field"><span>Confirmar senha</span><input name="confirm" type="password" autoComplete="new-password" required minLength={12}/></label><small className="muted">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</small>{msg&&<div className="notice">{msg}</div>}<button className="btn primary" disabled={!ready}>Salvar nova senha</button><a className="auth-back" href="/login">Voltar ao login</a></form></div>
}
