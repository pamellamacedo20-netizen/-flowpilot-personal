'use client';
import { FormEvent,useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { validateStrongPassword } from '@/lib/password';
export default function Signup(){
 const router=useRouter(); const [msg,setMsg]=useState(''),[sending,setSending]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setMsg('');setSending(true);
   const fd=new FormData(e.currentTarget),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||''),fullName=String(fd.get('full_name')||'').trim();
   const strength=validateStrongPassword(password);if(!strength.ok){setSending(false);setMsg(strength.message);return}
   const {data,error}=await createClient().auth.signUp({email,password,options:{data:{full_name:fullName},emailRedirectTo:`${window.location.origin}/auth/confirm?next=/dashboard`}});
   setSending(false);
   if(error){setMsg(error.message);return}
   if(data.session){router.replace('/dashboard');return}
   setMsg('Conta criada. Abra o e-mail de confirmação para liberar o acesso.');
 }
 return <div className="auth-simple"><form className="form" onSubmit={submit}><span className="eyebrow">NOVA CONTA</span><h1>Criar conta</h1><p className="muted">Use o mesmo e-mail da sua matrícula ou compra.</p><label className="field"><span>Nome completo</span><input name="full_name" required autoComplete="name"/></label><label className="field"><span>E-mail</span><input name="email" type="email" required autoComplete="email"/></label><label className="field"><span>Senha</span><input name="password" type="password" required minLength={12} autoComplete="new-password"/></label><small className="muted">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</small>{msg&&<div className="notice">{msg}</div>}<button className="btn primary" disabled={sending}>{sending?'Criando…':'Criar conta'}</button><a className="auth-back" href="/login">← Já tenho conta</a></form></div>
}
