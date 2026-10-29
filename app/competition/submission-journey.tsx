'use client';
import {Upload,CheckCircle2,Clock3} from 'lucide-react';
import type {Benchmark,BenchmarkGame} from '../../operations/types';
import {submissionFeedback,gameReason} from '../../lib/student-feedback.mjs';
type Attempt={id:string;sha:string;benchmark:string};
type Accepted={id:string;sha:string;status:string;verdict:string|null;job_status?:string;position?:number|null};
export default function SubmissionJourney({attempt,submission,trial,disabled,onStart,onReplay}:{attempt:Attempt|null;submission?:Accepted;trial?:Benchmark;disabled:boolean;onStart:()=>void;onReplay:(g:BenchmarkGame,sha:string)=>void}){
 const feedback=submissionFeedback(submission);
 const received=!!attempt||!!trial;
 const failed=trial?.games.some(g=>g.status==='failed');
 return <div className="sw-journey" aria-live="polite">
  {!received?<><h3>Thử một lượt thi ngay</h3><p>Code mẫu đã sẵn trong editor. Sửa chiến thuật hoặc giữ nguyên, rồi bấm nút bên dưới.</p><button className="primary" disabled={disabled} onClick={onStart}><Upload size={17}/>Nộp & đấu thử</button><p className="sw-note">Hệ thống tự lưu bài, kiểm tra lỗi và chạy hai ván với đối thủ đã chọn. Kết quả hiện ngay tại đây, không cần BTC thao tác.</p></>:<>
   <h3>Lượt nộp của bạn</h3><p>Phiên bản <code>{(attempt?.sha||trial?.sha||submission?.sha||'').slice(0,8)}</code>. Kết quả bên dưới thuộc code đã gửi; sửa bản nháp không thay lượt đang chạy.</p>
   <ol className="sw-journey-stages">
    <li><CheckCircle2 size={18}/><div><strong>Đã nhận và lưu bài vào giải</strong><p>Mã bài: <code>{(attempt?.id||trial?.submission||'').slice(0,8)}</code>. Có thể tải lại trang mà không mất tiến độ.</p></div></li>
    <li><Clock3 size={18}/><div><strong>{submission?feedback.title:'Đang cập nhật kiểm tra bài'}</strong><p>{submission?feedback.next:'Bộ chấm sẽ kiểm tra bot ở hai phía.'}</p>{submission?.status==='pending'&&submission.job_status==='queued'&&<p>Vị trí hàng đợi: {submission.position??'đang cập nhật'}.</p>}{submission?.verdict&&<pre className={submission.status==='invalid'?'sw-error-text':''}>{submission.verdict}</pre>}</div></li>
    <li><Clock3 size={18}/><div><strong>{failed?'Đấu thử gặp lỗi bộ chấm':trial?.summary.completed===2?'Đấu thử đã hoàn tất':trial?.games.some(g=>g.status==='running')?'Đang đấu thử với bot mẫu':'Đã xếp hàng hai ván đấu thử'}</strong><p>Hai ván đổi bên. Giữ trang mở để kết quả tự cập nhật.</p>{trial&&<><progress max={2} value={trial.summary.completed} aria-label="Tiến độ hai ván đấu thử"/><p><strong>{trial.summary.completed}/2 ván · {trial.summary.wins} thắng / {trial.summary.draws} hòa / {trial.summary.losses} thua</strong></p></>}{failed&&<p>Bài đã nộp vẫn được giữ. Bạn có thể dùng Chạy 2 ván để thử lại hoặc báo BTC.</p>}</div></li>
   </ol>
   {trial?.games.map(g=><div className="sw-game" key={g.id}><div><strong>{g.studentSide} · {g.result?!g.result.winner?'Hòa':g.result.winner===g.studentSide?'Thắng':'Thua':g.status==='running'?'Đang đấu':g.status==='failed'?'Lỗi bộ chấm':'Đang chờ'}</strong><p>{g.result?`${gameReason(g.result.reason)} · ${g.result.moves.length} nước`:'Đợi bộ chấm, kết quả sẽ tự cập nhật.'}{g.result?.message&&<><br/>{g.result.message}</>}</p></div>{g.result&&<button onClick={()=>onReplay(g,trial.sha)}>Xem replay</button>}</div>)}
   {trial?.summary.completed===2&&<p className="sw-next">Tiếp theo: xem replay để tìm nước đi cần cải thiện, sửa code rồi <strong>Nộp & đấu thử</strong> lại.</p>}
   <p className="sw-note">Đây là kết quả đấu thử để cải thiện bot, không phải điểm hay xếp hạng giải chính thức. Nộp cùng phiên bản và cùng đối thủ dùng lại lượt thử đã tạo.</p>
  </>}
 </div>;
}
