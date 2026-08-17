const token=localStorage.getItem('wearwise-guest')||crypto.randomUUID(); localStorage.setItem('wearwise-guest',token);
export async function api(path, options={}) { const res=await fetch(`/api${path}`,{...options,headers:{'x-guest-token':token,...options.headers}}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'Something went wrong'); return data; }
export async function uploadImage(file,type){const form=new FormData();form.append('file',file);form.append('type',type);return api('/upload',{method:'POST',body:form});}
