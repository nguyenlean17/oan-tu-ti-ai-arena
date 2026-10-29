# Bộ nộp - UET AI Coding Arena

Mục tiêu triển khai: trường sở hữu tên miền, chạy toàn bộ web/API/PostgreSQL/worker trên hạ tầng local. Vercel được giữ độc lập để demo khi cần; không phải thành phần bắt buộc.

## Nội dung

- `BAO_CAO_UET_ARENA.pdf`: báo cáo kiến trúc, bảo mật, an toàn thực thi, ổn định, chi phí, setup và kết quả đo.
- `load-overview.png`: biểu đồ từ dữ liệu thật; không phải mô phỏng.
- `evidence/load-run.json`, `evidence/scale-evidence.json`: số liệu đã loại thông tin đăng nhập.
- `evidence/restore-after-load.json`: kết quả restore backup sau đợt tải, gồm các bảng giải và operations; tổng số bản ghi bao gồm cả lịch sử thử trước.
- `DEMO.md`: kịch bản trình bày và checklist bàn giao.
- `tournament-example.json`: config hợp lệ cho ví dụ 32 đội/8 bảng; sửa deadline theo ngày thi thật (giá trị mẫu là UTC). BTC dán vào phần cấu hình JSON khi tạo giải nháp. Không thay cấu hình đã freeze.
- `VALIDATION.md`: kết quả kiểm tra và các giới hạn nghiệm thu.
- `../STUDENT_TOOLS.md`: đối chiếu từng mục từ repo/nhánh tham khảo; cách tự kiểm tra, benchmark và dùng 5 bot mẫu trên web/CLI. `evidence/student-tools-check.json` ghi kết quả HTTP thực.
- Mã nguồn đầy đủ trong repository, nhánh `integrate-safe-enhancements`.
- `../../deploy/LOCAL_POSTGRES.md`, `../OPERATIONS.md`: hướng dẫn chi tiết; ưu tiên các lệnh PostgreSQL local, không dùng hướng dẫn SQLite cũ cho cấu hình mới.

Không nộp `.secrets/`, `.env*`, backup database, cookie, token hoặc danh sách tài khoản thật. Máy mới tự tạo secret và tài khoản quản trị; không có mật khẩu admin dùng chung trong bộ nộp.

## Chạy nhanh

```sh
npm ci
npm run local:init
docker compose -f compose.local.yaml up -d --build --wait
```

Mở http://localhost:3000/login, đăng ký tài khoản VNU riêng, rồi cấp BTC:

```sh
docker compose -f compose.local.yaml exec app node scripts/local-admin.mjs your@vnu.edu.vn
```

Đăng xuất/đăng nhập lại; mở `/competition`, `/operations`, `/practice`.
Máy chủ cần Docker Linux containers và Node 22.16+; lần build đầu cần Internet.

Để tái lập biểu đồ/PDF khi đã có evidence: chạy `scripts/build-submission-report.py` bằng Python có reportlab, matplotlib và pypdf. Bộ ZIP được tạo từ các tệp Git được quản lý cộng tài liệu cuối; không chứa dữ liệu vận hành riêng.

Để tạo ZIP từ commit đã chốt và working tree sạch: `node scripts/package-submission.mjs`. Kết quả trong `output/handin/`, kèm commit và SHA-256. Bộ ZIP gồm mã nguồn và toàn bộ thư mục tài liệu này; bot mẫu ở `public/bots/`.

## Bổ sung ngày 29/10/2026

Khu sinh viên, quản lý tài khoản/đội, xác nhận và khôi phục mật khẩu: [hướng dẫn và cấu hình Mailpit](../STUDENT_PORTAL.md). Bằng chứng chức năng [student-journey.json](evidence/student-journey.json). Báo cáo PDF hiện có là snapshot ngày 25/10; hướng dẫn mới bổ sung và thay thế phần chính sách email chưa xác minh trong snapshot đó.
