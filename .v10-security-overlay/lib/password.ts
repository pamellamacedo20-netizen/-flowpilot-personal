export function validateStrongPassword(password:string){
 const missing:string[]=[];
 if(password.length<12) missing.push('12 caracteres');
 if(!/[a-z]/.test(password)) missing.push('letra minúscula');
 if(!/[A-Z]/.test(password)) missing.push('letra maiúscula');
 if(!/[0-9]/.test(password)) missing.push('número');
 if(!/[^A-Za-z0-9]/.test(password)) missing.push('símbolo');
 return {ok:missing.length===0,message:missing.length?`Use uma senha com ${missing.join(', ')}.`:''};
}
