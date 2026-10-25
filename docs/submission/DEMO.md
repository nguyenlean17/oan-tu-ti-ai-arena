# Kịch bản trình bày và bàn giao

## Trình bày trong 8-10 phút

1. Giới thiệu sơ đồ: browser -> reverse proxy HTTPS -> app -> PostgreSQL; worker chủ động lấy lease từ app và chạy Python trong WASI. Browser không phải nguồn quyết định kết quả.
2. BTC tạo giải nháp trong `/competition`: chốt luật, seed, thời gian nộp, số bảng và số suất đi tiếp. Tạo đội, gắn email/MSSV và phát mã mời riêng.
3. Sinh viên đăng nhập, nhận đội bằng mã mời, tải `.py` hoặc lấy `bot.py` từ commit GitHub công khai đã duyệt. Hiển thị hash và trạng thái pending/valid/invalid. Gửi lại cùng source không tạo thêm job.
4. Mở `/operations`: kiểm tra worker, hàng đợi, backup/restore và chạy self-test. Nộp bot lỗi để minh họa E01-E06; không thực thi mã nguy hiểm trên Python máy chủ.
5. Sau hạn nộp và khi validation đã xong, freeze danh sách. Quan sát chia bảng, các trận đổi bên, vòng loại trực tiếp. Kiểm tra replay trước khi publish, tải export/replay HTML.
6. Mở `/practice`: nộp bot vào Elo riêng, giải thích đấu tập không sửa điểm giải chính thức.
7. Mở http://localhost:3002/load-demo khi profile thử tải đang chạy. Chọn phát lại dữ liệu đã ghi; chỉ rõ đây là replay telemetry. Nếu máy demo chưa bật, dùng biểu đồ và evidence JSON trong bộ nộp.
8. Nêu kết quả: 4.000 bài HTTP, concurrency tối đa 64, 0 lỗi HTTP; 4.032 validation hoàn tất, 8 invalid dự kiến; giải riêng 32 đội/126 ván được xác minh. Không suy diễn thành 4.000 người đồng thời hay đo đủ giải 4.000 đội.

## Trước ngày thi

- Trường cấp tên miền/DNS, cấu hình TLS và firewall; kiểm tra từ mạng sinh viên. Dùng `deploy/compose.local-public.yaml` cùng profile PostgreSQL.
- Đối chiếu danh sách sinh viên, phát mã riêng, xử lý tài khoản bị đăng ký trước; email VNU tự khai chưa xác thực.
- Kiểm tra cấu hình luật, seed, tie-break, giới hạn runtime; thử bot mẫu bằng chính worker chính thức.
- Chốt image/runtime tương thích; không nâng engine giữa giải đang freeze.
- Chạy backup + restore test; sao chép backup và secret ra nơi riêng được bảo vệ. Cài timer Linux theo `docs/OPERATIONS.md`.
- Kiểm tra CPU/RAM/SSD, dung lượng đĩa, UPS và chế độ không sleep. Giữ máy phát tải tách khỏi máy chủ nếu đánh giá năng lực chính thức.
- Đo lại với kích thước source, bot, polling, tài khoản và lịch đấu thực tế. Theo dõi backlog thay vì chỉ nhìn HTTP 200.

## Kết thúc

Kiểm tra failed jobs và replay, công bố giải, xuất kết quả, lưu audit/backup. Dừng bằng `stop`; không dùng `down -v` để dừng thông thường. Không đưa backup/secret vào bộ tài liệu nộp.

## Trạng thái kiểm tra giao diện

Kiểm tra source, TypeScript và API được thực hiện. Chụp/đánh giá giao diện desktop-mobile chưa hoàn tất vì công cụ điều khiển trình duyệt bị chặn do không xác định URL tin cậy; không xem đây là bằng chứng đã kiểm tra giao diện trực quan. Cần kiểm tra thủ công `/operations`, `/practice`, `/competition` trên desktop và điện thoại trước ngày thi.
