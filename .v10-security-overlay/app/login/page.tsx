'use client';
import { FormEvent,useState } from 'react';
import { useRouter,useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function Login(){
 const router=useRouter();
 const params=useSearchParams();
 const [msg,setMsg]=useState(params.get('password_updated')==='1'?'Senha atualizada. Entre com sua nova senha.':'');
 const demo=process.env.NEXT_PUBLIC_DEMO_MODE==='true';
 async function submit(e:FormEvent<HTMLFormElement>){
   e.preventDefault();setMsg('');
   const fd=new FormData(e.currentTarget),email=String(fd.get('email')||'').trim(),password=String(fd.get('password')||'');
   if(demo){localStorage.setItem('pa_demo_user',email||'demo@pamella.academy');router.push('/dashboard');return}
   try{
     const {error}=await createClient().auth.signInWithPassword({email,password});
     if(error)throw error;
     const next=params.get('next');
     router.push(next&&next.startsWith('/')&&!next.startsWith('//')?next:'/dashboard');
   }catch(err:any){setMsg(err.message||'Não foi possível entrar.')}
 }
 return <div className="loginwrap"><section className="loginvisual"><div className="brand"><span className="brandmark">PM</span><span><strong>PAMELLA</strong><small>ACADEMY</small></span></div><div><span className="eyebrow" style={{color:'#f2d6c2'}}>CONHECIMENTO QUE VIRA PRÁTICA</span><h1>Sua formação, organizada em uma experiência premium.</h1><p style={{maxWidth:560,opacity:.8}}>Cursos, comunidade, materiais, progresso e certificados em um único ambiente.</p></div><small>© 2026 Pamella Academy</small></section><section className="loginpane"><form className="form" onSubmit={submit}><span className="eyebrow">ÁREA DE MEMBROS</span><h2 className="title" style={{fontSize:32}}>Entre na sua conta</h2><p className="muted">Use o e-mail da sua matrícula.</p><label className="field"><span>E-mail</span><input name="email" type="email" required placeholder="voce@email.com"/></label><label className="field"><span>Senha</span><input name="password" type="password" required minLength={8} placeholder="••••••••••••"/></label><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:14}}><a className="forgot-link" href="/forgot-password">Esqueci minha senha</a><a className="forgot-link" href="/signup">Criar minha conta</a></div>{msg&&<div className="notice">{msg}</div>}<button className="btn primary" style={{width:'100%'}}>Entrar</button></form></section></div>
}
