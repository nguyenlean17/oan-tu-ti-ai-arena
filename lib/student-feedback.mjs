const hints={
 E01:'Sửa cú pháp hoặc thụt lề ở dòng được báo, rồi kiểm tra lại.',
 E02:'Kiểm tra hàm choose_move(state), giá trị trả về và lỗi khi khởi tạo.',
 E03:'Chỉ trả về một nước trong state["legal_moves"].',
 E04:'Giảm vòng lặp/tìm kiếm và thời gian khởi tạo; đối chiếu giới hạn của giải.',
 E05:'Bỏ thao tác mạng, tiến trình con hoặc tệp ngoài phạm vi được cấp.',
 E06:'Giảm bộ nhớ, số phép tính và lượng dữ liệu in ra.'
};
export function submissionFeedback(s){
 if(!s)return {tone:'neutral',title:'Chưa nộp vào giải',next:'Viết bot, chạy thử rồi bấm Nộp vào giải.'};
 if(s.status==='valid')return {tone:'success',title:'Bài hợp lệ',next:'Bạn có thể tiếp tục đấu thử và cải thiện. Bản hợp lệ mới nhất trước hạn sẽ được chọn khi khóa giải.'};
 if(s.status==='invalid')return {tone:'error',title:'Bài chưa hợp lệ',next:hints[/\bE0[1-6]\b/.exec(s.verdict||'')?.[0]]||'Xem lỗi bên dưới, sửa code rồi kiểm tra và nộp lại.'};
 if(s.job_status==='failed')return {tone:'error',title:'Bộ chấm gặp sự cố',next:'Đây chưa phải kết luận về bot. Liên hệ BTC để thử lại công việc; không cần nộp trùng mã.'};
 if(s.job_status==='running')return {tone:'neutral',title:'Đang kiểm tra bot',next:'Bộ chấm đang chạy bài ở hai phía. Kết quả sẽ tự cập nhật tại đây.'};
 return {tone:'neutral',title:'Đã nhận bài · đang chờ kiểm tra',next:'Bạn có thể tiếp tục sửa bản nháp. Bài đã gửi được giữ nguyên và kết quả sẽ tự cập nhật.'};
}
export function gameReason(reason){return ({goal:'Đến đích',capture:'Bắt hết quân',elimination:'Hết quân',no_moves:'Không còn nước đi',max_plies:'Đạt giới hạn lượt',move_limit:'Đạt giới hạn lượt',timeout:'Bot quá thời gian',invalid_move:'Bot trả nước không hợp lệ',bot_error:'Bot gặp lỗi khi chạy',output_limit:'Vượt giới hạn dữ liệu trả về',repetition:'Lặp thế cờ'})[reason]||reason;}
