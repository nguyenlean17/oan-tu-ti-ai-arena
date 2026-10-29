# Demo từ tài khoản sinh viên

Mở **https://oan-tu-ti-ai-arena.vercel.app/demo**. Tài khoản demo được bàn giao riêng; không lưu mật khẩu trong repository.

## Người trình bày

1. Đăng nhập tài khoản sinh viên. Link `/demo` dẫn thẳng đến giải được cấu hình, không phải tìm giữa các giải cũ.
2. Bấm **Tham gia ngay**. Hệ thống tạo đội của tài khoản đó và mở editor đã có code mẫu.
3. Giữ hoặc sửa code, chọn đối thủ rồi bấm **Nộp & đấu thử**.
4. Phần **Tiến độ** tự hiện bài đã lưu, kiểm tra hợp lệ/lỗi, hai ván đấu thử, thắng/hòa/thua và replay. Không cần BTC khóa giải để có kết quả đấu thử.
5. Mở **Xem replay**, tua nước đi, sửa chiến thuật rồi nộp lại. Gửi lại đúng cùng code và đối thủ dùng lại lượt thử đã tạo, không nhân bản bài hay ván.

Bài chính thức và ván đấu thử dùng đúng cùng source. Đây vẫn là hai loại kết quả khác nhau: kiểm tra hợp lệ không có nghĩa đã thắng giải; điểm và xếp hạng giải chính thức chỉ sinh ra theo lịch thi đấu sau khi BTC chốt bài. Đấu thử không cập nhật Elo.

Khi còn hạn mức nhưng đang có lượt thử khác chờ xử lý, chờ lượt đó xong. Nếu chỉ cần cập nhật bài chính thức, dùng **Chỉ nộp vào giải**. Hạn mức hiện có vẫn áp dụng: 40 ván đấu thử/24 giờ/người. Không nới hạn mức hoặc bỏ kiểm tra quyền để phục vụ demo.

## Máy chạy bộ chấm

Website chạy trên Vercel; máy chạy worker phải bật và có mạng trong buổi trình bày. Sinh viên/người chấm demo chỉ cần trình duyệt.

Image hiện có đã hỗ trợ công việc đấu thử. Khi cần bật lại trên máy BTC, mở Docker Desktop rồi chạy tại thư mục dự án:

```sh
docker compose -f compose.judge.yaml --env-file .env.judge.local up -d --no-build --pull never
```

Lệnh dùng image sẵn có, không build hay tải image. Không reset Docker/database. Nếu image hoặc file cấu hình riêng thiếu, dừng để chuẩn bị trước buổi demo; không tự kéo runtime qua data di động.

## Cấu hình và tính nhất quán

- `DEMO_EVENT_ID` là ID giải mà `/demo` đưa người dùng đến. Không cấp quyền hay tự nhận đội thay người dùng. Link đăng nhập giữ điểm đến `/demo`.
- Request `submit_trial` được xác thực bằng session và kiểm tra email theo chính sách đang bật. Server lấy đội từ membership, kiểm tra hạn nộp, lưu bài và tạo đúng hai công việc đổi bên trong cùng transaction.
- ID lượt thử và công việc được suy ra từ ID bài nộp và đối thủ, giúp chống gửi trùng kể cả khi người dùng bấm lại hoặc tải lại trang. Quota của lượt thử bị từ chối sẽ rollback bài mới trong request kết hợp; không báo đã nhận khi chỉ làm xong một nửa.
- Kết quả lưu ở server cùng ID bài, ID giải và SHA của source, cho phép xem lại sau reload. Code đang sửa không thay đổi source đã nộp hay source của ván đang chạy.

Kiểm thử local: `node tests/submit-trial.test.mjs`. Kiểm thử Production có opt-in `ARENA_ALLOW_CLOUD_SMOKE=1`: `node tests/one-click-demo-cloud.test.mjs`, dùng fixture riêng trong `.secrets/demo-run.json` và `.secrets/demo-handoff.json`, không gửi email. Fixture kiểm thử khác tài khoản bàn giao để tài khoản bàn giao vẫn trải nghiệm bước tham gia lần đầu.

Đã kiểm tra đầu-cuối trên Vercel ngày 30/10/2026 (giờ Việt Nam): bài hợp lệ, hai ván hoàn tất (một hòa, một thua), replay khớp source, gửi trùng được xử lý và kết quả giữ nguyên sau reload. Bằng chứng máy đọc được: [`submission/evidence/one-click-demo.json`](submission/evidence/one-click-demo.json). Đã mở replay và tua nước đi trên giao diện. Đây là một lượt demo thực tế, không phải kết quả kiểm thử tải.

Gói serverless cần đưa `public/bots/*.py` vào cả route `/api/operations` và `/api/competition`. Đọc bot theo thư mục chạy ứng dụng để tránh đường dẫn của máy build bị giữ lại trong bundle.
