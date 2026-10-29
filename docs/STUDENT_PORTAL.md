# Khu sinh viên và email tài khoản

Phần này áp dụng cho bản PostgreSQL local/Vercel; bản SQLite/ChatGPT Sites cũ không cung cấp khu tài khoản này.

`/student` là điểm bắt đầu sau đăng ký/đăng nhập: xác nhận email, nhận đội bằng
mã BTC cấp, nộp bot vào giải và xem đội của mình. Email không tự sửa trong hồ sơ
để tránh thay đổi ràng buộc mã mời. Thành viên có thể đổi tên đội trước khi danh
sách bị khóa; không thể tự cấp quyền, đổi membership hoặc sửa cấu hình giải.

BTC có mục quản lý tài khoản: tìm tên/email, trạng thái xác minh, khóa/mở khóa
tài khoản thường và thu hồi phiên. Không cho tự khóa hoặc sửa tài khoản BTC;
việc cấp quyền admin vẫn qua công cụ chủ máy. Form tạo đội/cấp mã dành cho BTC;
mã chỉ hiển thị trong phản hồi cấp, cần lưu và gửi riêng. Quản lý thành viên,
cấp lại mã và thu hồi membership vẫn ở Ban tổ chức trong `/competition`.

## Demo local qua Mailpit

```sh
npm run load:init
docker build -f judge/Dockerfile -t uet-arena-judge:operations .
docker build -f docker/Dockerfile.local -t uet-arena-app:operations .
docker compose -f compose.load.yaml -f compose.mail-demo.yaml up -d --wait --scale judge=2
```

Website: http://localhost:3002/student. Hộp thư: http://localhost:8025.
Mailpit chỉ bind loopback và giữ thư thử; không gửi ra Internet. Đây là profile
demo độc lập với dữ liệu thật. Không dùng hộp thư chung Mailpit để xác thực người
thật trong giải công khai. Truy cập `/register?return_to=/student`, chọn một email
VNU giả cho thử nghiệm, mật khẩu riêng; mở thư tương ứng trong Mailpit và nhấn
liên kết rồi nút xác nhận. Tiếp đó nhập mã BTC cấp đúng địa chỉ email đó.

`REQUIRE_EMAIL_VERIFICATION=1` yêu cầu email đã xác nhận trước khi nhận đội hoặc
nộp bài qua web/Git. Tài khoản cũ vẫn có thể đăng nhập để yêu cầu thư xác nhận.
Không tự đánh dấu email cũ là đã xác minh. Profile không bật cờ này giữ hành vi
cũ để không khóa giải đang vận hành ngoài ý muốn.

## Gửi email thật

Hỗ trợ Resend qua `RESEND_API_KEY`, `MAIL_FROM` (địa chỉ thuộc domain đã xác minh
với nhà cung cấp), `PUBLIC_ORIGIN` HTTPS chính xác. Bật
`REQUIRE_EMAIL_VERIFICATION=1` sau khi kiểm tra gửi thư thành công. Không đưa API
key vào code, Git hoặc frontend. Trường có thể bổ sung adapter SMTP theo hạ tầng
riêng; SMTP chưa được tích hợp trong bản này. Không phải VNU SSO.

## Reset và bảo mật

`/forgot-password` luôn phản hồi chung để tránh lộ tài khoản có tồn tại hay không.
Liên kết xác minh/reset chứa token ngẫu nhiên 256 bit; DB chỉ lưu SHA-256, hạn
30 phút, dùng một lần. GET không tiêu thụ token (tránh mail scanner); người dùng
phải POST xác nhận có kiểm tra Origin/CSRF. Reset thành công thu hồi mọi session.
Đổi mật khẩu trong tài khoản yêu cầu mật khẩu hiện tại và xác nhận mật khẩu mới.
Rate limit được lưu tại PostgreSQL. Không trả token hoặc password hash trong API
tài khoản; thư thử chứa liên kết nhạy cảm nên không công khai Mailpit.

Logo dùng asset từ https://mis.uet.edu.vn/uet_logo.ico, lưu local ở
`public/brand/uet.ico`; đây là dự án môn học, không tuyên bố dịch vụ chính thức
hoặc VNU SSO. Các nguồn thiết kế cũ được giữ làm lịch sử; khu sinh viên mới dùng
UET xanh/navy, hàng dữ liệu thật và bước tiếp theo dựa trên tài khoản/membership.

## Trang đầu theo vai trò

Trên bản PostgreSQL, / hiển thị lối vào đăng nhập/xem giải cho khách. BTC đăng nhập vào dashboard điều hành, có nút Tạo giải đấu mở thẳng form cấu hình và liên kết quản lý từng giải. Sinh viên có đúng một đội được chuyển thẳng tới trang viết/nộp bot của giải đó; người chưa có đội hoặc tham gia nhiều giải nhận dashboard để nhập mã/chọn giải. /student vẫn mở được hồ sơ, đội và bảo mật.

Các liên kết /competition?tab=admin&new=1, tab=submit và tab=matches mở đúng chức năng. Mở form bằng GET không tạo giải; quyền tạo/cấu hình/nộp bài vẫn do API xác minh. Khi đã có đội, trang nộp bài không yêu cầu nhập lại mã. /workbench giữ khu luyện tập cũ; các liên kết chơi trực tiếp /?play=1 hoặc /?room=... tiếp tục hoạt động.
