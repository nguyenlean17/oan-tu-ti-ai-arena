'use client';
import { useMemo, useState } from 'react';

type EventOption = { id: string; name: string; status: string };
type TeamOption = { id: string; name: string; size?: number; deleted?: number };
type ParticipantData = {
  user: { id: string; name: string; email?: string; phone?: string } | null;
  owned?: string;
  ownedTeam?: { id: string; name: string; leader: string | null };
  teams?: TeamOption[];
  roster?: { id:string; name: string; email: string; account_id: string | null }[];
  requests?: { id: string; team: string; name: string; email: string; status: string }[];
  members?: { user: string; team: string; student: string }[];
};

async function post(body: Record<string, unknown>) {
  const response = await fetch('/api/competition', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || 'Không thể gửi đăng ký.');
  return result;
}

export default function ParticipationForm({
  events, eventId, data, onEvent, onRefresh, onMessage,
}: {
  events: EventOption[];
  eventId: string;
  data: ParticipantData;
  onEvent: (id: string) => void;
  onRefresh: () => Promise<void>;
  onMessage: (value: string) => void;
}) {
  return <ParticipationFormContent key={data.user?.id || 'anonymous'} {...{ events, eventId, data, onEvent, onRefresh, onMessage }} />;
}

function ParticipationFormContent({
  events, eventId, data, onEvent, onRefresh, onMessage,
}: {
  events: EventOption[];
  eventId: string;
  data: ParticipantData;
  onEvent: (id: string) => void;
  onRefresh: () => Promise<void>;
  onMessage: (value: string) => void;
}) {
  const openEvents = useMemo(() => events.filter(event => event.status === 'open'), [events]);
  const selectedEvent = eventId || (openEvents.length === 1 ? openEvents[0].id : '');
  const [role, setRole] = useState<'leader' | 'member'>('leader');
  const [teamName, setTeamName] = useState('');
  const [teamChoice, setTeamChoice] = useState('');
  const [roster, setRoster] = useState<{ name: string; email: string }[]>([]);
  const [name, setName] = useState(data.user?.name || '');
  const [email, setEmail] = useState(data.user?.email || '');
  const [phone, setPhone] = useState(data.user?.phone || '');
  const [profileName,setProfileName]=useState(data.user?.name||'');
  const [profilePhone,setProfilePhone]=useState(data.user?.phone||'');
  const [extraName,setExtraName]=useState('');
  const [extraEmail,setExtraEmail]=useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const team = data.ownedTeam;
  const requests = data.requests || [];
  const memberCount = roster.length + 1;

  function changeEvent(value: string) {
    onEvent(value);
  }
  function resizeRoster(count: number) {
    setRoster(current => Array.from({ length: Math.max(0, count - 1) }, (_, i) => current[i] || { name: '', email: '' }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    onMessage('');
    try {
      await post(data.user ? {
        action: 'register-team', event: selectedEvent, role,
        ...(role === 'leader' ? { teamName, roster } : { team: teamChoice }),
      } : {
        action: 'register', event: selectedEvent, role, name, email, phone,
        password, confirm,
        ...(role === 'leader' ? { teamName, roster } : { team: teamChoice }),
      });
      onMessage(role === 'leader' ? 'Đăng ký thành công. Đội của bạn đã được tạo.' : 'Đã gửi yêu cầu tham gia đội. Hãy chờ trưởng nhóm duyệt.');
      setPassword('');
      setConfirm('');
      await onRefresh();
    } catch (error) {
      onMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function teamAction(body: Record<string, unknown>, message: string) {
    setBusy(true);
    onMessage('');
    try {
      await post({ event: selectedEvent, team: team?.id, ...body });
      onMessage(message);
      await onRefresh();
    } catch (error) {
      onMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveProfile(event:React.FormEvent) {
    event.preventDefault();setBusy(true);onMessage('');
    try {
      const response=await fetch('/api/accounts',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile',name:profileName,phone:profilePhone})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||'Không cập nhật được hồ sơ.');
      onMessage('Đã lưu hồ sơ cá nhân.');
      await onRefresh();
    } catch(error) { onMessage((error as Error).message); }
    finally { setBusy(false); }
  }
  if (!openEvents.length) return <section className="tc-participation"><h2>Hồ sơ tham gia</h2>{data.user&&<form className="tc-profile-form" onSubmit={saveProfile}><h3>Thông tin tài khoản</h3><div className="tc-registration-grid"><label>Họ và tên *<input required minLength={2} maxLength={60} value={profileName} onChange={event=>setProfileName(event.target.value)} /></label><label>Email<input readOnly value={email} /><small>Email không được xác minh bằng mã gửi thư.</small></label><label>Số điện thoại *<input required minLength={7} maxLength={30} type="tel" value={profilePhone} onChange={event=>setProfilePhone(event.target.value)} /></label></div><button disabled={busy}>Lưu thông tin</button></form>}<p>Hiện chưa có giải đấu nào mở đăng ký.</p></section>;

  return <section className="tc-participation">
    <h2>Hồ sơ tham gia</h2>
    <p>Cung cấp thông tin để gia nhập giải đang mở. Email không được xác minh bằng mã gửi thư.</p>
    {openEvents.length > 1 && <label>Giải đấu<select value={selectedEvent} onChange={event => changeEvent(event.target.value)} required><option value="">Chọn giải đấu</option>{openEvents.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    {data.user && <form className="tc-profile-form" onSubmit={saveProfile}><h3>Thông tin tài khoản</h3><div className="tc-registration-grid"><label>Họ và tên *<input required minLength={2} maxLength={60} value={profileName} onChange={event=>setProfileName(event.target.value)} /></label><label>Email<input readOnly value={email} /><small>Email không được xác minh bằng mã gửi thư.</small></label><label>Số điện thoại *<input required minLength={7} maxLength={30} type="tel" value={profilePhone} onChange={event=>setProfilePhone(event.target.value)} /></label></div><button disabled={busy}>Lưu thông tin</button></form>}
    {selectedEvent && team ? <div className="tc-participant-team">
      <h3>{team.name}</h3>
      <p>{team.leader === data.user?.id ? 'Bạn là trưởng nhóm.' : 'Bạn là thành viên đội.'} · {data.roster?.length || 0}/4 thành viên</p>
      <ul>{data.roster?.map(person => <li key={person.id}>{person.name} · {person.email}{team.leader === data.user?.id && (person.account_id ? person.account_id !== team.leader && <button className="tc-small" disabled={busy} onClick={() => teamAction({ action: 'team-remove-member', user: person.account_id }, 'Đã xóa thành viên khỏi đội.')}>Xóa</button> : <button className="tc-small" disabled={busy} onClick={() => teamAction({ action: 'team-roster-remove', roster:person.id }, 'Đã xóa thành viên khỏi roster.')}>Xóa</button>)}</li>)}</ul>
      {team.leader === data.user?.id && <>
        {(data.roster?.length||0)<4&&<form className="tc-registration-grid" onSubmit={event=>{event.preventDefault();void teamAction({action:'team-roster-add',name:extraName,email:extraEmail},'Đã thêm thành viên vào roster.');setExtraName('');setExtraEmail('');}}><label>Thêm thành viên · Họ tên<input required minLength={2} maxLength={60} value={extraName} onChange={event=>setExtraName(event.target.value)}/></label><label>Email<input required type="email" maxLength={254} value={extraEmail} onChange={event=>setExtraEmail(event.target.value)}/></label><button disabled={busy}>Thêm vào đội</button></form>}
        <h3>Yêu cầu đang chờ</h3>
        {requests.filter(request => request.team === team.id).length ? requests.filter(request => request.team === team.id).map(request => <p key={request.id}>{request.name} · {request.email} <button className="tc-small" disabled={busy} onClick={() => teamAction({ action: 'team-request', request: request.id, approve: true }, 'Đã duyệt thành viên.')}>Duyệt</button><button className="tc-small" disabled={busy} onClick={() => teamAction({ action: 'team-request', request: request.id, approve: false }, 'Đã từ chối yêu cầu.')}>Từ chối</button></p>) : <p>Chưa có yêu cầu tham gia.</p>}
        {data.roster?.some(person => person.account_id && person.account_id !== data.user?.id) && <label>Chuyển quyền trưởng nhóm<select defaultValue="" onChange={event => { if (event.target.value) void teamAction({ action: 'team-leader', user: event.target.value }, 'Đã chuyển quyền trưởng nhóm.'); }}><option value="">Chọn thành viên</option>{data.roster.filter(person => person.account_id && person.account_id !== data.user?.id).map(person => <option key={person.account_id} value={person.account_id!}>{person.name}</option>)}</select></label>}
        <button disabled={busy} onClick={() => { if (window.confirm('Giải tán đội? Đội có bài nộp hoặc lịch sử sẽ được giữ nguyên và không thể xóa.')) void teamAction({ action: 'team-delete' }, 'Đã giải tán đội.'); }}>Giải tán đội</button>
      </>}
      {team.leader !== data.user?.id && <button disabled={busy} onClick={() => { if (window.confirm('Rời đội này?')) void teamAction({ action: 'team-leave' }, 'Bạn đã rời đội.'); }}>Rời đội</button>}
    </div> : selectedEvent && requests.some(request => request.status === 'pending' && request.team) ? <div><p>Yêu cầu tham gia đội đang chờ trưởng nhóm duyệt.</p>{requests.filter(request=>request.status==='pending'&&request.team).map(request=><p key={request.id}><button disabled={busy} onClick={()=>void teamAction({action:'team-request-cancel',team:request.team,request:request.id},'Đã hủy yêu cầu tham gia.')}>Hủy yêu cầu</button></p>)}</div> : selectedEvent && <form onSubmit={submit} className="tc-participation-form">
      {!data.user && <div className="tc-registration-grid">
        <label>Họ và tên *<input required minLength={2} maxLength={60} value={name} onChange={event => setName(event.target.value)} autoComplete="name" /></label>
        <label>Email *<input required type="email" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" /></label>
        <label>Số điện thoại *<input required type="tel" minLength={7} maxLength={30} value={phone} onChange={event => setPhone(event.target.value)} autoComplete="tel" /></label>
        <label>Mật khẩu *<input required type="password" minLength={12} maxLength={128} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" /></label>
        <label>Nhập lại mật khẩu *<input required type="password" minLength={12} maxLength={128} value={confirm} onChange={event => setConfirm(event.target.value)} autoComplete="new-password" /></label>
      </div>}
      {data.user && <p>Đăng ký bằng tài khoản <strong>{data.user.name}</strong> ({data.user.email}).</p>}
      <label>Vai trò trong đội *<select value={role} onChange={event => setRole(event.target.value as 'leader' | 'member')}><option value="leader">Trưởng nhóm</option><option value="member">Thành viên</option></select></label>
      {role === 'leader' ? <>
        <label>Tên đội *<input required minLength={2} maxLength={80} value={teamName} onChange={event => setTeamName(event.target.value)} /></label>
        <label>Số lượng thành viên *<select value={memberCount} onChange={event => resizeRoster(Number(event.target.value))}>{[1,2,3,4].map(count => <option key={count} value={count}>{count}</option>)}</select></label>
        {roster.map((person, index) => <fieldset className="tc-registration-grid" key={index}><legend>Thành viên {index + 2}</legend><label>Họ và tên *<input required minLength={2} maxLength={60} value={person.name} onChange={event => setRoster(rows => rows.map((row, i) => i === index ? { ...row, name: event.target.value } : row))} /></label><label>Email *<input required type="email" maxLength={254} value={person.email} onChange={event => setRoster(rows => rows.map((row, i) => i === index ? { ...row, email: event.target.value } : row))} /></label></fieldset>)}
      </> : <label>Tên đội *<select required value={teamChoice} onChange={event => setTeamChoice(event.target.value)}><option value="">Chọn đội</option>{(data.teams || []).filter(item => !item.deleted && (item.size ?? 0) < 4).map(item => <option key={item.id} value={item.id}>{item.name} ({item.size ?? 0}/4)</option>)}</select></label>}
      {data.user?.id && requests.some(request => request.status === 'pending') && <p>Yêu cầu tham gia của bạn đang chờ trưởng nhóm duyệt.</p>}
      <button className="primary" disabled={busy || !selectedEvent}>{busy ? 'Đang gửi…' : data.user ? 'Gửi đăng ký đội' : 'Tạo tài khoản và đăng ký'}</button>
    </form>}
  </section>;
}
