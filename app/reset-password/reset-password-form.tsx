'use client';
import { useState } from 'react';

export default function ResetPasswordForm({ initialToken }: { initialToken: string }) {
  const [token,setToken]=useState(initialToken);
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault();setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password,confirm})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Không thể đổi mật khẩu.');
      setMessage('Đã đặt mật khẩu mới. Đăng nhập lại để tiếp tục.');
      setPassword('');setConfirm('');setToken('');
    } catch(error) { setMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="reset-password"><h1>Đặt lại mật khẩu</h1><p>Liên kết có hiệu lực 30 phút và chỉ dùng một lần.</p>{message&&<p role="status">{message}</p>}
    {token?<form onSubmit={submit}><label>Mật khẩu mới<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={event=>setPassword(event.target.value)}/></label><label>Nhập lại mật khẩu<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={event=>setConfirm(event.target.value)}/></label><button disabled={busy}>{busy?'Đang lưu…':'Đặt mật khẩu mới'}</button></form>:message.startsWith('Đã đặt mật khẩu')?<a href="/login?return_to=/competition">Đăng nhập</a>:<p>Thiếu liên kết đặt lại. Hãy liên hệ ban tổ chức để xin liên kết mới.</p>}
  </main>;
}
