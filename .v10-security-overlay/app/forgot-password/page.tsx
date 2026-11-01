'use client';
import { FormEvent,useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function ForgotPassword(){
 const [msg,setMsg]=useState(''),[sending,setSending]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setMsg('');setSending(true);
   const email=String(new FormData(e.currentTarget).get('email')||'').trim();
   const origin=window.location.origin;
   const {error}=await createClient().auth.resetPasswordForEmail(email,{redirectTo:`${origin}/auth/confirm?next=/account/update-password`});
   setSending(false);
   setMsg(error?`Não foi possível enviar: ${error.message}`:'Enviamos o link. Abra o e-mail neste mesmo navegador e toque em “Redefinir senha”.');
 }
 return <div className="auth-simple"><form className="form" onSubmit={submit}><span className="eyebrow">RECUPERAR ACESSO</span><h1>Redefinir senha</h1><p className="muted">Informe o e-mail usado na sua conta. O link recebido passará pela confirmação segura antes de abrir a tela de nova senha.</p><label className="field"><span>E-mail</span><input name="email" type="email" required autoComplete="email"/></label>{msg&&<div className="notice">{msg}</div>}<button className="btn primary" disabled={sending}>{sending?'Enviando…':'Enviar link de redefinição'}</button><a href="/login" className="auth-back">← Voltar ao login</a></form></div>
}
