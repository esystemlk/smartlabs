import type { User } from 'firebase/auth';
export async function learningRequest(user:User|null,path='',options:RequestInit={}){
  const token=user?await user.getIdToken():null;
  const response=await fetch(`/api/recorded-learning${path}`,{...options,cache:'no-store',headers:{...options.headers,...(token?{Authorization:`Bearer ${token}`}:{})}});
  const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load recorded learning.');return data;
}
