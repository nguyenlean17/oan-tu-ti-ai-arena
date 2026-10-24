'use client';
import { useCallback, useEffect, useState } from 'react';

type Account = { id:string; email:string; name:string; phone:string; is_admin:number; disabled:number; created:number };
export default function AccountManagement({ onMessage }:{onMessage:(message:string)=>void}) {
  const [accounts,setAccounts]=useState<Account[]>([]);
  const [currentUser,setCurrentUser]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [resetLink,setResetLink]=useState('');
  const refresh=useCallback(async()=>{
    const response=await fetch('/api/accounts');
    const data=await response.json() as {error?:string;accounts:Account[];currentUser:string};
    if(!response.ok)throw new Error(data.error||'Không tải được tài khoản.');
    setAccounts(data.accounts);
    setCurrentUser(data.currentUser);
  },[]);
  useEffect(()=>{
    let active=true;
    async function load() {
      try {
        const response=await fetch('/api/accounts');
        const data=await response.json() as {error?:string;accounts:Account[];currentUser:string};
        if(!response.ok)throw new Error(data.error||'Không tải được tài khoản.');
        if(active){setAccounts(data.accounts);setCurrentUser(data.currentUser);}
      } catch(error) {
        if(active)setError((error as Error).message);
      }
    }
    void load();
    return ()=>{active=false;};
  },[]);
  async function update(body:Record<string,unknown>) {
    setBusy(true);setError('');setResetLink('');
    try {
      const response=await fetch('/api/accounts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
      const data=await response.json() as {error?:string;token?:string};
      if(!response.ok)throw new Error(data.error||'Không thể cập nhật tài khoản.');
      if(body.action==='reset')setResetLink(`${window.location.origin}/reset-password?token=${data.token}`);
      else onMessage('Đã cập nhật tài khoản.');
      await refresh();
    } catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  async function remove(account:Account) {
    const confirm=window.prompt(`Để xóa ${account.email}, nhập chính xác email này. Thao tác không thể hoàn tác.`);
    if(confirm===null)return;
    setBusy(true);setError('');
    try {
      const response=await fetch('/api/accounts',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({user:account.id,confirm})});
      const data=await response.json() as {error?:string};
      if(!response.ok)throw new Error(data.error||'Không thể xóa tài khoản.');
      onMessage('Đã xóa tài khoản và gỡ thành viên khỏi đội.');
      await refresh();
    } catch(error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }
  return <section className="tc-account-management">
    <div className="tc-section-title"><div><h2>Tài khoản tham gia</h2><p>Quản lý trạng thái, đặt lại mật khẩu hoặc xóa tài khoản.</p></div><button disabled={busy} onClick={()=>void refresh()}>Làm mới</button></div>
    {error&&<div className="tc-message error" role="alert">{error}</div>}
    {resetLink&&<div className="tc-issued"><strong>Liên kết đặt lại — chỉ hiển thị lần này</strong><p>Gửi riêng cho người dùng qua kênh đáng tin cậy. Liên kết hết hạn sau 30 phút và chỉ dùng một lần.</p><input readOnly value={resetLink} onFocus={event=>event.target.select()} /></div>}
    <div className="tc-table-wrap"><table><thead><tr><th>Họ tên</th><th>Email</th><th>Điện thoại</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      {accounts.map(account=><tr key={account.id}><td>{account.name}{account.is_admin?' · BTC':''}</td><td>{account.email}</td><td>{account.phone||'—'}</td><td>{account.disabled?'Đã khóa':'Đang hoạt động'}</td><td><div className="tc-account-actions"><button className="tc-small" disabled={busy} onClick={()=>void update({action:'reset',user:account.id})}>Đặt lại mật khẩu</button>{account.disabled?<button className="tc-small" disabled={busy||account.id===currentUser} onClick={()=>void update({action:'enable',user:account.id})}>Mở khóa</button>:<button className="tc-small" disabled={busy||account.id===currentUser} onClick={()=>void update({action:'disable',user:account.id})}>Khóa</button>}<button className="tc-small" disabled={busy||account.id===currentUser} onClick={()=>void remove(account)}>Xóa</button></div></td></tr>)}
      {!accounts.length&&<tr><td colSpan={5}>Chưa có tài khoản.</td></tr>}
    </tbody></table></div>
  </section>;
}
