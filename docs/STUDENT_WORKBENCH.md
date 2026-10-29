# Luồng dự thi của sinh viên

## Tham gia và mở code

Đăng nhập, chọn một giải và bấm **Tham gia ngay** nếu giải cho đăng ký trực tiếp. Đã có đội thì vào **Code & chạy thử**. Liên kết trực tiếp có dạng `/competition?tab=submit#<event-id>`; các liên kết giải dành cho sinh viên ưu tiên màn này. Giải dùng danh sách riêng vẫn cần mã BTC.

Màn hình giữ tên giải, hạn nộp, đội thi và giới hạn chạy ở đầu; phần code và phản hồi nằm cạnh nhau trên desktop, xếp dọc trên điện thoại. Các nút chạy kiểm tra, chọn đối thủ và chạy hai ván nằm ngay dưới editor. Quyền điều hành của BTC vẫn là mục riêng.

## Chu trình cải thiện bot

1. Viết `choose_move(state)` hoặc mở tệp `.py`. Có thể tải bot mẫu trong phần **API bot và mã mẫu**. Nạp mã mẫu thay bản nháp qua hành động xác nhận riêng; không tự nộp vào giải.
2. Chọn **Chạy kiểm tra**. Bộ chấm chạy kiểm tra cơ bản ở hai phía; lỗi E01–E06 kèm thông báo và gợi ý sửa. Trạng thái chờ/chạy/kết quả tự cập nhật. Đạt kiểm tra không đảm bảo bot luôn hợp lệ trong mọi trận.
3. Chọn đối thủ rồi **Chạy 2 ván**. Hai ván đổi bên; xem thắng/hòa/thua, nguyên nhân kết thúc và replay ngay trong cùng trang. Lượt thử dùng cấu hình luyện tập hiển thị trên màn hình, có thể khác giải chính thức. Không cập nhật Elo và chưa nộp vào giải.
4. Chọn **Nộp vào giải** trước hạn. Phần **Bài đã nộp** hiển thị lúc tiếp nhận, vị trí hàng đợi nếu có, trạng thái đang kiểm tra và verdict cuối. Lỗi bộ chấm được phân biệt với bài không hợp lệ.
5. Sửa bot, chạy thử và nộp lại. Bản hợp lệ mới nhất trước hạn được chọn khi BTC khóa giải; một lần nộp lỗi không xóa bản hợp lệ trước đó. Sau khóa, giao diện ghi phiên bản được chọn và không cho nộp mới.

Kết quả tự kiểm tra và benchmark khớp theo SHA-256 của mã đang mở. Sửa code sẽ không tiếp tục hiển thị một verdict cũ như kết quả của mã mới. Nếu trình duyệt không cung cấp Web Crypto, lượt vừa chạy vẫn được ghép theo ID và bản mã lúc gửi; kết quả cũ sau khi tải lại không được coi là xác nhận cho code hiện tại.

## Lưu code và xem lại kết quả

- Bản nháp được lưu bằng `sessionStorage`, tách theo tài khoản và giải, giữ khi tải lại trong cùng tab. Đóng tab/xóa dữ liệu trình duyệt có thể mất bản nháp; nút tải code giúp giữ tệp riêng. Giao diện cảnh báo khi không lưu được.
- Khi chưa có bản nháp trong tab, editor tải lại source của bài nộp mới nhất. Lịch sử cho mở từng phiên bản để sửa; không thay đổi bài đã nộp.
- Endpoint `GET /api/competition?submission=<id>` kiểm tra thành viên đội theo session tại thời điểm đọc. Khách, đội khác và người chỉ biết ID không được đọc source; quyền host không tự cho xem code đội khác qua endpoint này. Response không cache.
- **Trận chính thức của đội** hiển thị tối đa 20 ván gần đây của riêng đội, thắng/hòa/thua từ góc nhìn đội, lý do và replay. Phần này không dùng 50 trận công khai gần nhất làm lịch sử cá nhân. Trong lúc nhận bài, màn hình giải thích vì sao chưa có trận chính thức và dẫn đến đấu thử.
- Replay phân biệt luyện tập/chính thức và phía P1/P2 của người xem. Mã phiên bản trong replay là mã thực sự đã thi đấu.

## Kiểm tra đã thực hiện

Unit/regression: `node tests/student-feedback.test.mjs`, `node tests/open-entry.test.mjs`, `node tests/competition.test.mjs`, `npm test`.

Trên profile local demo có dữ liệu fixture của `tests/demo-self-service.test.mjs`, có thể chạy kiểm thử API/worker thật sau khi bật `ARENA_ALLOW_LOAD_TEST=1`:

```sh
node tests/student-workbench-api.test.mjs
```

Phép thử tái sử dụng tài khoản tổng hợp, không gửi email; kiểm tra E01 → sửa hợp lệ → hai ván benchmark/replay, source theo đúng đội, kết quả cá nhân và phiên bản đã khóa. Bằng chứng không chứa thông tin đăng nhập: [student-workbench.json](submission/evidence/student-workbench.json).
