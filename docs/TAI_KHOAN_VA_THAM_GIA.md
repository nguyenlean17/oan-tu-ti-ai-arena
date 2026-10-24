# Tài khoản và tham gia giải

## Tài khoản

Trên Vercel và Docker, người tham gia đăng ký bằng họ tên, email hợp lệ, số điện thoại và mật khẩu riêng từ 12 đến 128 ký tự. Email không bắt buộc thuộc tên miền VNU. Hệ thống không gửi email hoặc mã xác minh, vì vậy người đăng ký cần tự kiểm tra địa chỉ email trước khi gửi. Mật khẩu được băm bằng scrypt; cookie phiên là HttpOnly và hết hạn sau 7 ngày.

Sites chỉ cung cấp trải nghiệm công khai/ẩn danh. Không có đăng nhập, tài khoản, dữ liệu cá nhân hay dữ liệu thi đấu trên Sites. Tài khoản và dữ liệu ở Vercel, Docker, Sites không tự đồng bộ.

## Đăng ký tham gia

1. Mở **/competition**. Nếu chỉ có một giải đang mở, biểu mẫu chọn giải đó tự động; nếu có nhiều giải, chọn giải muốn tham gia.
2. Chọn vai trò **Trưởng nhóm** hoặc **Thành viên**.
3. Trưởng nhóm đặt tên đội, chọn tổng số thành viên từ 1 đến 4 và khai tên/email của các thành viên còn lại.
4. Thành viên chọn đội chưa đủ 4 người và gửi yêu cầu. Trưởng nhóm duyệt hoặc từ chối yêu cầu tại hồ sơ đội.
5. Người tham gia có thể cập nhật họ tên/số điện thoại, xem danh sách đội, hủy yêu cầu đang chờ, rời đội hoặc chuyển quyền trưởng nhóm. Không thể rời đội sau khi giải khóa danh sách.

Thông tin đội, yêu cầu tham gia và thay đổi quyền được ghi trong cơ sở dữ liệu giải đấu. Các thành viên chỉ xem thông tin liên hệ của đội mình; BTC có thể xem roster và yêu cầu của mọi đội.

## Ban tổ chức

BTC quản lý tài khoản tại **/competition → Tài khoản**: khóa/mở khóa, đặt lại mật khẩu hoặc xóa tài khoản. Xóa cần nhập đúng email của tài khoản và không thể xóa BTC đang đăng nhập hoặc BTC cuối cùng. Nếu người cần xóa đang là trưởng nhóm có thành viên khác, phải chuyển quyền trưởng nhóm trước. Kết quả thi đấu lịch sử được giữ lại.

Đặt lại mật khẩu tạo liên kết dùng một lần, có hiệu lực 30 phút. Liên kết chỉ hiện một lần trong trang quản trị; gửi riêng qua kênh đáng tin cậy. Website không gửi email. BTC có thể xóa/giải tán đội không có bài nộp hoặc lịch sử; dữ liệu đội đã thi đấu không bị xóa khỏi kết quả.

## Lưu trữ và kiểm thử

- Vercel lưu tài khoản và phiên trong PostgreSQL; schema mới thêm số điện thoại, trạng thái khóa và token đặt lại có hạn.
- Docker lưu tài khoản/phiên/token trong `auth.sqlite`, còn roster và yêu cầu đội nằm trong `competition.sqlite`.
- Schema được tạo/migrate khi khởi chạy; sao lưu cả hai SQLite database khi triển khai Docker.
- Kiểm thử cục bộ: `npm run test:accounts`, `npm run test:competition`, `npm run test:docker`.
- Kiểm thử HTTP Vercel chỉ chạy khi được bật rõ ràng và tạo dữ liệu QA có nhãn; không chạy trên dữ liệu production thật.
