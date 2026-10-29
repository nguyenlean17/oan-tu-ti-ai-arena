# Demo tự tạo giải, tham gia trực tiếp và Resend

## Chạy tại máy trình bày

```sh
npm ci
npm run load:init
docker build -f docker/Dockerfile.local -t uet-arena-app:operations .
docker build -f judge/Dockerfile -t uet-arena-judge:operations .
docker compose -f compose.load.yaml -f compose.mail-demo.yaml -f compose.demo-self-service.yaml up -d --wait --scale judge=2
```

Website: http://localhost:3002/. Trang giới thiệu mới: http://localhost:3002/welcome (xem được cả khi đã đăng nhập). Profile demo và database này độc lập với profile local chính. Key Resend đọc từ `.secrets/resend-api-key`; đặt key vào file đó trước khi thử gửi thư. File được bỏ qua bởi Git và Docker build context. Biến `MAIL_FROM` thay địa chỉ gửi mặc định khi đã xác minh domain với Resend. Không cần SDK mới: adapter dùng REST API của Resend.

## Kịch bản cho người chấm

1. Đăng ký bằng email và mật khẩu riêng. Bản demo cho phép email ngoài VNU; xác nhận email không chặn thao tác trình diễn.
2. Chọn **Tạo giải đấu**. Nhập tên, chọn cách tham gia trực tiếp, hạn nộp và số bảng; cấu hình luật nâng cao vẫn có thể mở ra.
3. Chọn **Tạo & mở giải**. Giải bắt đầu nhận đăng ký; nút lưu bản nháp dành cho trường hợp chưa muốn mở.
4. Bấm **Tham gia ngay**. Hệ thống tạo đội thuộc tài khoản đang đăng nhập, tự cấp hạt giống và mở trang viết/nộp Python. Không nhập mã BTC.
5. Nộp bot. Về **Ban tổ chức**, chọn **Thêm 2 bot mẫu** để có đối thủ; bot mẫu đi qua cùng hàng đợi kiểm tra và runtime WASI.
6. Khi các đội có bài hợp lệ, chọn **Kết thúc nhận bài & chia bảng** (bản demo đóng hạn và khóa bài trong cùng transaction, không cần chờ đồng hồ). Theo dõi chấm, replay và bảng xếp hạng; công bố kết quả sau khi giải chuyển sang chờ duyệt. Tối thiểu số bảng nhân số suất đi tiếp phải phù hợp số đội. Demo nhỏ dùng 1 bảng, 2 suất đi tiếp.

Người chấm có thể dùng tài khoản thứ hai để tham gia cùng giải. Người tạo có quyền điều hành giải của mình, không trở thành quản trị viên hệ thống và không được sửa giải của người khác. Đăng ký trực tiếp hiện tạo một đội riêng cho mỗi tài khoản; ghép nhiều người vào cùng đội vẫn dùng công cụ danh sách của BTC.

Nếu còn bài đang kiểm tra khi đóng giải, trạng thái chuyển sang chờ khóa; chờ hàng đợi hoàn tất rồi chọn khóa/chia bảng lại. Không bỏ qua kiểm tra bài để chạy nhanh phần demo.

## Cơ chế dữ liệu và đồng thời

### Xoá và khôi phục giải

Trong **Ban tổ chức**, mở **Xoá giải đấu** rồi chọn **Xoá giải này**. Chỉ admin hoặc chủ giải được thực hiện. Đây là chuyển vào thùng rác: giải bị ẩn, đóng thao tác và dừng chấm; đội, bài nộp, kết quả và audit được giữ nguyên. Lượt chấm đang chạy bị thu hồi lease, kết quả gửi muộn bị từ chối.

Ở danh sách giải, mở **Thùng rác** và chọn **Khôi phục giải**. Giải trở lại trạng thái trước khi xoá, bộ chấm vẫn tạm dừng để BTC chủ động chọn **Tiếp tục chấm**. Hạn nộp không tự gia hạn. Thùng rác chỉ hiện các giải mà tài khoản có quyền quản lý.

### Bản demo Vercel không yêu cầu mã

`DEMO_OPEN_ENTRY=1` cho phép đăng nhập rồi bấm **Tham gia ngay** với mọi giải còn đang nhận bài và còn hạn, kể cả config cũ dùng mã BTC. Cờ này độc lập với `DEMO_SELF_SERVICE`: không cấp quyền tạo/điều hành giải cho tài khoản thường, không thay luật đã khóa, không đổi chính sách email VNU, không cho tham gia giải đã đóng hoặc trong thùng rác.

Vercel Production đã bật cờ này cho bản trình bày. Muốn quay lại chính sách mã theo config, đặt cờ về `0` rồi redeploy. Profile local demo trong `compose.demo-self-service.yaml` cũng bật cờ; profile thi thật không tự bật.

Kiểm thử: `node tests/tournament-trash.test.mjs`. Smoke test Vercel có opt-in `ARENA_ALLOW_CLOUD_SMOKE=1`, dùng tài khoản admin từ file riêng được chỉ định bởi `ARENA_CLOUD_ADMIN_FILE` (mặc định `.secrets/vercel-demo-admin.json`), chạy với env database Production: `node --env-file=.env.vercel.local tests/tournament-trash-cloud.test.mjs`. Test chỉ xoá/khôi phục giải mới mang nhãn DEMO do nó tạo, không sửa giải của người dùng và không gửi email. Bằng chứng: `docs/submission/evidence/tournament-trash-cloud.json`.

`event_hosts(event,user_id)` lưu quyền tổ chức từ session; client không tự gán chủ giải. `entryMode` trong config có hai giá trị `open` và `invite`. Giải mới từ biểu mẫu mặc định mở trực tiếp; khi không bật DEMO_OPEN_ENTRY, config cũ thiếu trường này giữ cơ chế mã để không đổi chính sách giải đang tồn tại.

Tham gia trực tiếp tạo team và membership trong một transaction. PostgreSQL sử dụng khóa điều khiển sẵn có để cấp hạt giống duy nhất; gửi lại cùng yêu cầu trả về đội đã có. Đóng đăng ký sau hạn nộp hoặc khi khóa danh sách. Không nhận user ID hoặc team ID từ client làm danh tính người tham gia. Tối đa 4.000 đội/giải; mỗi tài khoản demo tạo tối đa 10 giải/giờ. Nộp bài và chấm giữ các hạn mức, cơ chế lease, retry và kiểm tra phiên bản hiện có.

`DEMO_SELF_SERVICE=1` chỉ có hiệu lực cùng `ARENA_LOAD_DEMO=1`. Không bật hai cờ này cho giải thật. Bản mặc định giữ chính sách email VNU; yêu cầu xác nhận email cho giải thật được bật bằng `REQUIRE_EMAIL_VERIFICATION=1`. Quyền host đã ghi trong DB là quyền cho riêng giải đó.

## Email

`MAIL_PROVIDER=resend` ưu tiên Resend dù Mailpit đang chạy. Hỗ trợ `RESEND_API_KEY_FILE` hoặc `RESEND_API_KEY`, `MAIL_FROM` và `PUBLIC_ORIGIN`. Xác nhận email nằm ở Tài khoản & bảo mật; quên mật khẩu ở trang đăng nhập. Token dùng một lần, hết hạn 30 phút; reset thu hồi các phiên cũ.

Trạng thái thư kiểm tra của lần tích hợp này: provider báo `delivered`. Domain `resend.dev` chỉ phục vụ thử nghiệm theo quy định Resend; muốn gửi cho các người nhận khác phải xác minh domain gửi rồi đổi `MAIL_FROM`. Link local trong thư mở tại máy đang chạy bản demo. Khi đưa lên máy chủ, đặt `PUBLIC_ORIGIN` thành URL thật.

Nguồn: https://resend.com/docs/send-with-nodejs và https://resend.com/docs/knowledge-base/403-error-resend-dev-domain.

## Kiểm tra

```sh
node tests/open-entry.test.mjs
node tests/competition.test.mjs
```

E2E trên profile demo riêng (tạo tài khoản tổng hợp, tạo giải và chạy bộ chấm thật):

```sh
ARENA_ALLOW_LOAD_TEST=1 node tests/demo-self-service.test.mjs
```

Với PowerShell, đặt `$env:ARENA_ALLOW_LOAD_TEST='1'` trước lệnh Node. Test không gửi email đến các địa chỉ tổng hợp. Bằng chứng đã loại thông tin đăng nhập nằm trong `docs/submission/evidence/demo-self-service.json` sau khi chạy thành công. Tài khoản thử không được đưa vào bộ nộp.
