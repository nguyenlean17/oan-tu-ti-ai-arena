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

## Chưa khẳng định

- Bản restore đã thành công trước burst 4.000 bài; không phải bằng chứng restore toàn bộ dữ liệu sau burst.
- Kiểm tra bổ sung restore các bảng ops_* và chạy lại PostgreSQL cuối bị gián đoạn do Docker daemon không phản hồi sau sự cố đầy ổ host. Không tính lần chạy treo là PASS.
- Không có visual QA desktop/mobile đầy đủ. Xem UI_REVIEW.md (`disposition: recapture`).
- Chưa cài DNS/TLS và systemd backup timer trên hạ tầng trường; chưa thử HA hoặc 4.000 người đồng thời.

Trạng thái cuối có thể cập nhật khi Docker được khôi phục; giữ kết quả đo gốc bất biến. Không đưa tài khoản fixture, token/cookie, backup hoặc secret vào bộ nộp.
