# Gửi email bằng Gmail

Adapter tài khoản hỗ trợ `MAIL_PROVIDER=gmail` để gửi xác nhận email và đặt lại mật khẩu qua Gmail SMTP, dùng cùng liên kết một lần có thời hạn 30 phút. Không cần domain gửi riêng cho phương án này.

Cấu hình server:

```dotenv
MAIL_PROVIDER=gmail
SMTP_USER=nguyenlean17@gmail.com
PUBLIC_ORIGIN=https://oan-tu-ti-ai-arena.vercel.app
```

Đặt `SMTP_PASSWORD` trong kho bí mật của nơi triển khai, hoặc dùng `SMTP_PASSWORD_FILE` trỏ đến file riêng trên server. Đây là Mật khẩu ứng dụng Google của tài khoản gửi đã bật xác minh hai bước. Không lưu giá trị vào Git. Bản local chuẩn bị file `.secrets/gmail-app-password`; container cần mount file và truyền biến tương ứng nếu sử dụng.

Gửi qua `smtp.gmail.com:465`, TLS và kiểm tra chứng chỉ mặc định. Địa chỉ người gửi lấy từ `SMTP_USER`. Chọn Gmail rõ ràng sẽ không tự chuyển sang Mailpit/Resend nếu Gmail lỗi. Thư lỗi trả thông báo chung, không đưa phản hồi xác thực hoặc mật khẩu tới trình duyệt.

`REQUIRE_EMAIL_VERIFICATION=1` là chính sách yêu cầu xác nhận trước khi tham gia/nộp bài, cấu hình riêng với nhà cung cấp gửi thư. Không tự bật chỉ vì đổi provider.

Gmail cá nhân phù hợp cho demo nhỏ, vẫn có hạn mức và cơ chế chặn thư của Google. Khi tổ chức quy mô lớn cần đo nhu cầu gửi và dùng dịch vụ gửi thư phù hợp. Google có thể thu hồi mật khẩu ứng dụng khi thay đổi mật khẩu tài khoản.

Kiểm thử adapter: `node tests/gmail-mail.test.mjs` (không gửi thư thật). Lần tích hợp đã xác thực SMTP và gửi một thư kiểm tra được Gmail chấp nhận tới chính tài khoản gửi; việc Gmail chấp nhận không chứng minh thư đã vào Inbox. Kiểm tra hộp thư/Spam để xác nhận nhận thư.

Tham khảo: [Nodemailer Gmail](https://nodemailer.com/usage/using-gmail/), [Google App Passwords](https://support.google.com/accounts/answer/185833).
