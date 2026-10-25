# Nhật ký xác nhận và giới hạn

## Đã qua

- Build production Docker app từ source cuối: Next.js compile + TypeScript thành công (25/10/2026).
- `npm test`: engine, human play, VNU account/origin policy, local sandbox template, offline replay, diagnostics/Elo/source limits.
- `npm run test:competition`: identity, invitation, quota/deadline, immutable entries, runtime, lease/heartbeat/fencing, retry, duplicate results, groups/knockout, publication/export/restart.
- `npm run test:competition:api`: worker secret, CSRF, spoofed identity, JSON/body bounds.
- ESLint cho operations/practice/load-demo, widget queue, operations backend và diagnostics: không phát hiện lỗi.
- `tests/operations-api.test.mjs`: ẩn metrics quản trị, demo chỉ đọc, CSRF, queue đúng chủ đội, giới hạn UTF-8, không lộ source.
- PostgreSQL operations schema tạm, parser AST và WASI bot tests đã qua trong quá trình triển khai ngày 24/10. Phiên load thật đã chạy xuyên suốt API và worker.
- Run `859f0c413587`: 4.000 bài HTTP tiếp nhận; 4.032 validation và 126 game done; replay xác minh; Elo giữ nguyên sau restart. Xem evidence JSON, không chỉ ảnh biểu đồ.
- PDF 8 trang: đã render và kiểm tra font tiếng Việt, bố cục, sơ đồ và biểu đồ.
- Ngày 25/10 sau khi khôi phục Docker: chạy lại PostgreSQL operations và API, đều PASS. `/health`, `/load-demo`, demo metrics trả 200; metrics quản trị không đăng nhập trả 401. Hai worker healthy; kết quả 4.000 bài và 126 trận của phiên đo được giữ nguyên.
- Backup sau burst đã restore vào DB riêng và đối chiếu khớp: 4.134 accounts, 6 events, 4.160 submissions, 252 games, 6 ops_bots, 6 ops_ratings, 16 ops_pairs và 44 ops_jobs. Đây là tổng database gồm cả các lần thử trước; không phải số riêng run 859f0c413587. Xem `evidence/restore-after-load.json`. Bản kiểm tra đối chiếu số bản ghi, không phải chứng minh mọi giá trị từng hàng đều giống nhau.

## Bổ sung công cụ sinh viên, 25/10

- PostgreSQL kiểm tra thêm: draft không tạo bot Elo, benchmark không thay rating/official games, đổi bên cùng seed, hạn mức compute, cách ly chủ bài và không ghép Elo vượt 200 điểm.
- WASI/CLI thực: cả 5 bot mẫu hợp lệ; diagnostic trả đúng E03 cho nước sai; benchmark đo thời gian và đổi bên; kết quả chính thức không thêm timing ngoài yêu cầu.
- HTTP với tài khoản QA mới: 5 bot mẫu tải được, E01 syntax, 2 ván benchmark có timing và 2 replay hợp lệ, không tự tham gia Elo, người khác không đọc được kết quả. Xem `evidence/student-tools-check.json`.
- Unit tests và targeted lint qua. Build production app qua TypeScript. Các số liệu tải 4.000 bài ngày 24/10 không bị ghi đè và không đại diện cho 4.000 người dùng tool cùng lúc.

## Giới hạn nghiệm thu còn lại

- Không có visual QA desktop/mobile đầy đủ. Xem UI_REVIEW.md (`disposition: recapture`).
- Chưa cài DNS/TLS và systemd backup timer trên hạ tầng trường; chưa thử HA hoặc 4.000 người đồng thời.

Các lần kiểm tra bị treo khi Docker không phản hồi không được tính là PASS; chỉ lần chạy hoàn tất sau khôi phục mới được ghi nhận. Kết quả đo tải gốc được giữ bất biến. Không đưa tài khoản fixture, token/cookie, backup hoặc secret vào bộ nộp.
