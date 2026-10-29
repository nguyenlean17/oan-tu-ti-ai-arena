/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {ArrowRight,ArrowUpRight,Code2,Flag,Hand,Hexagon,Scissors} from 'lucide-react';
import {createInitialBoard,applyMove,simulate} from '../lib/engine.mjs';
import './entry.css';
const example=simulate('greedy','random',42);
export default function Entry({demo=false}:{demo?:boolean}){
 const board=createInitialBoard();for(let i=0;i<12;i++)applyMove(board,example.moves[i],i%2?'P2':'P1');
 const create=demo?'/login?return_to='+encodeURIComponent('/competition?tab=admin&new=1'):'/login?return_to=%2F';
 return <div className="entry">
 <div className="entry-stage"><header><Link className="entry-brand" href="/"><img src="/brand/uet.ico" width="46" height="46" alt="UET"/><span>UET Arena<small>Trường Đại học Công nghệ · ĐHQGHN</small></span></Link><nav aria-label="Điều hướng"><Link href="/competition">Giải đấu</Link><Link href="/practice">Luyện tập</Link><Link className="entry-signin" href="/login?return_to=%2F">Đăng nhập <ArrowUpRight size={16}/></Link></nav></header>
 <main><div className="entry-copy"><h1>Đưa bot của bạn<br/>vào <span>cuộc đấu.</span></h1><p>{demo?'Tự tạo một giải đấu, mở đăng ký và tham gia bằng bot Python. Không cần mã BTC trong bản demo.':'Viết chiến thuật bằng Python. Thi đấu cùng các đội sinh viên UET trên bàn cờ 9×9.'}</p><div className="entry-actions"><Link className="entry-primary" href={create}>{demo?'Tạo giải & thử ngay':'Vào không gian thi'} <ArrowRight size={20}/></Link><Link className="entry-secondary" href="/competition">Tham gia giải <ArrowUpRight size={18}/></Link></div><p className="entry-register">Chưa có tài khoản? <Link href="/register?return_to=%2F">Đăng ký{demo?'':' bằng email VNU'}</Link></p><div className="entry-code"><Code2 size={18}/><code>def choose_move(state):<br/>&nbsp;&nbsp;return state[&quot;legal_moves&quot;][0]</code></div></div>
 <figure className="entry-game"><div className="entry-board" role="img" aria-label="Ván minh hoạ trên bàn cờ 9 nhân 9 sau 12 nước đi">{board.flatMap((row:({type:string;player:string}|null)[],y:number)=>row.map((piece,x)=>{const coord=String.fromCharCode(65+x)+(y+1),Icon=piece?.type==='ROCK'?Hexagon:piece?.type==='PAPER'?Hand:Scissors;return <div className={'entry-cell '+((x+y)%2?'shade ':'')+(example.moves[11].to===coord?'last':'')} key={coord}><small>{coord}</small>{piece?<span className={'entry-piece '+piece.player}><Icon size={20} strokeWidth={1.8}/></span>:['I1','A9'].includes(coord)?<Flag size={18}/>:null}</div>;}))}</div><figcaption><span>Ván minh hoạ · 12 nước</span><strong>Greedy <span>×</span> Random</strong><Link href="/practice">Đấu thử bot <ArrowRight size={16}/></Link></figcaption></figure>
 </main></div>
 <section className="entry-path" aria-label="Cách thử một giải đấu"><div><span>01</span><h2>Tạo giải của bạn</h2><p>Đặt tên, chọn cách chia bảng và mở đăng ký ngay trên web.</p></div><div><span>02</span><h2>Tham gia trực tiếp</h2><p>Đăng nhập, chọn giải đang mở và tạo đội bằng một nút bấm.</p></div><div><span>03</span><h2>Để code lên tiếng</h2><p>Nộp Python, đấu với bot mẫu rồi xem kết quả và replay.</p></div></section>
 <footer><span>UET Arena · VNU</span><p>Dự án môn Lập trình mạng · Python · Bàn cờ 9×9</p><Link href="/competition">Khám phá giải đấu <ArrowUpRight size={16}/></Link></footer>
 </div>;
}
