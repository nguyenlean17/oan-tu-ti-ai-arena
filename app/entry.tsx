/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import {ArrowRight,Code2,Trophy} from 'lucide-react';
import './entry.css';
export default function Entry(){return <div className="entry">
 <header><Link className="entry-brand" href="/"><img src="/brand/uet.ico" width="46" height="46" alt="UET"/><span>UET Arena<small>Trường Đại học Công nghệ · ĐHQGHN</small></span></Link><Link href="/login?return_to=%2F">Đăng nhập <ArrowRight size={16}/></Link></header>
 <main><h1>Giải đấu lập trình bot.</h1><p>Viết chiến thuật bằng Python. Thi đấu cùng các đội sinh viên UET trên bàn cờ 9×9.</p><div className="entry-actions"><Link className="entry-primary" href="/login?return_to=%2F">Vào không gian thi <ArrowRight size={18}/></Link><Link href="/competition">Xem giải đấu <Trophy size={18}/></Link></div><p className="entry-register">Lần đầu tham gia? <Link href="/register?return_to=%2F">Tạo tài khoản VNU</Link></p>
 <div className="entry-roles"><section><Code2 size={22}/><h2>Dành cho sinh viên</h2><p>Vào giải của đội, viết và nộp bot, theo dõi bảng xếp hạng cùng replay.</p></section><section><Trophy size={22}/><h2>Dành cho ban tổ chức</h2><p>Tạo giải, cấu hình luật và chia bảng. Quản lý đội thi và tiến độ chấm trong một dashboard.</p></section></div></main>
 <footer>UET Arena · Dự án môn Lập trình mạng · Đăng nhập bằng tài khoản đã được BTC cấp quyền để quản lý giải.</footer>
 </div>;}
