# UET Arena — Đấu trường lập trình bot Python

Nền tảng tổ chức giải đấu bot dành cho sinh viên **Trường Đại học Công nghệ, Đại học Quốc gia Hà Nội (UET – VNU)**. Người chơi viết chiến thuật Python cho bàn cờ Oẳn Tù Tì 9×9; hệ thống tiếp nhận bài, thực thi bot, tổ chức thi đấu và cung cấp kết quả có thể xem lại.

Dự án được xây dựng theo ba tiêu chí: **Ngon — chơi thú vị; Bổ — vận hành ổn định, an toàn và bảo mật; Rẻ — tiết kiệm chi phí triển khai.**

[Trải nghiệm demo](https://oan-tu-ti-ai-arena.vercel.app/demo) · [Hướng dẫn sử dụng](docs/HUONG_DAN_SU_DUNG.md) · [Tài liệu triển khai](deploy/LOCAL_POSTGRES.md) · [Bộ tài liệu nộp](docs/submission/README.md)

## Ngon — Chơi hay, thú vị, dễ bắt đầu

Oẳn Tù Tì được mở rộng thành trò chơi chiến thuật trên bàn cờ 9×9: di chuyển quân, khắc chế theo Đấm – Lá – Kéo và tìm đường đến đích. Sinh viên có thể bắt đầu từ một bot đơn giản, quan sát điểm yếu rồi cải thiện thuật toán qua từng phiên bản.

- **Vào thi nhanh:** chọn giải đang mở, tham gia và mở editor có sẵn code mẫu. Giải hỗ trợ tham gia trực tiếp hoặc danh sách đội có mã, theo cấu hình của BTC.
- **Một lần bấm để trải nghiệm:** **Nộp & đấu thử** lưu bài vào giải, xếp hàng kiểm tra và chạy hai ván đổi bên với bot mẫu. Tiến độ, lỗi và kết quả xuất hiện trong cùng trang.
- **Có đối thủ để luyện tập:** năm bot Python mẫu — Starter Config, Heuristic Hunter, Sprinter, Guardian và Tactician. Starter Config cho phép người mới điều chỉnh trọng số chiến thuật.
- **Học từ kết quả:** xem thắng/hòa/thua, lý do kết thúc và replay từng nước; mở lại phiên bản đã nộp để sửa. Replay có thể xuất thành HTML xem ngoại tuyến.
- **Có lộ trình thi đấu:** luyện tập và Elo riêng; giải chính thức có chia bảng, hai ván đổi bên, vòng loại trực tiếp và công bố kết quả. Điểm luyện tập không được chuyển thành điểm giải.
- **BTC tự tổ chức:** tạo giải, đặt hạn nộp, cấu hình luật và tài nguyên, quản lý đội, khóa phiên bản dự thi, theo dõi hàng đợi và xuất dữ liệu.

Luồng sinh viên: **Đăng nhập → Chọn giải → Tham gia → Viết Python → Nộp & đấu thử → Xem replay → Cải thiện bot.**

```python
def choose_move(state):
    return state["legal_moves"][0]
```

Bot nhận trạng thái và danh sách nước hợp lệ, trả về một nước đi. Bài nộp là tệp Python UTF-8 tối đa 64 KiB. Xem [API, mã mẫu và hạn mức](docs/STUDENT_TOOLS.md), [không gian viết bot](docs/STUDENT_WORKBENCH.md).

## Bổ — Ổn định, an toàn và bảo mật

### Tách website khỏi công việc chấm

Website tiếp nhận bài và ghi công việc vào database; worker riêng lấy việc để chấm. Việc thực thi Python không giữ một yêu cầu web mở suốt trận và không chạy trong tiến trình phục vụ website.

```text
Trình duyệt sinh viên / BTC
             │ HTTPS
             ▼
       Website + API
             │
             ▼
 PostgreSQL: tài khoản, giải, bài nộp,
 hàng đợi, kết quả và nhật ký thao tác
             ▲
             │ lấy việc / gia hạn / trả kết quả
             ▼
       Worker chấm riêng
             │
             ▼
   CPython WASI trên Wasmtime
```

- **Nhận bài nhất quán:** kiểm tra quyền, thời hạn, hạn mức và ghi bài trong transaction. Danh tính đội được lấy từ tài khoản đăng nhập và membership, không tin tên hay ID đội do người nộp tự khai.
- **Chống trùng và mất dấu phiên bản:** bài có SHA-256, lịch sử source và phiên bản khóa cho giải. Gửi lại cùng bài không nhân bản phiên bản; luồng nộp kèm đấu thử dùng ID công việc ổn định để tránh tạo trùng ván.
- **Phục hồi công việc:** hàng đợi có lease, heartbeat và retry hữu hạn. Kết quả được kiểm tra trước khi ghi nhận; công việc không bị coi là hoàn tất chỉ vì worker đã nhận nó.
- **Quan sát và khôi phục:** có dashboard vận hành, trạng thái hàng đợi, nhật ký quản trị và quy trình backup/restore. Xóa giải đưa vào thùng rác để có thể khôi phục.

### Kiểm soát bài nộp nguy hiểm

Bot chạy trong **CPython WASI/Wasmtime**, với giới hạn thời gian, bộ nhớ và đầu ra. Môi trường thực thi không được cấp mạng, secret hay dữ liệu máy chủ. Luật cờ và tính hợp lệ của nước đi do hệ thống kiểm tra; bot không tự khai báo người thắng.

Container giúp đóng gói và tách dịch vụ; giới hạn thực thi bot do môi trường WASI và cấu hình worker đảm nhiệm. Quét mã hoặc chẩn đoán cú pháp chỉ hỗ trợ phát hiện lỗi, không thay thế lớp cách ly khi chạy code.

### Xác thực và chống mạo danh

- Đăng nhập bằng tài khoản website; chính sách sinh viên giới hạn đúng tên miền `@vnu.edu.vn`.
- Phân quyền sinh viên, chủ giải và quản trị viên; kiểm tra quyền ở API, không chỉ ẩn nút trên giao diện.
- Có xác nhận email và đặt lại mật khẩu qua dịch vụ gửi thư. **Phải bật `REQUIRE_EMAIL_VERIFICATION=1` và cấu hình email khi cần xác minh chủ hộp thư.** Chỉ lọc đuôi email không chứng minh người đăng ký sở hữu email đó; bản demo có thể chưa bắt buộc xác nhận.
- Nhận bài trực tiếp bằng `.py`; nhập GitHub theo repository đã được gắn với đội và commit cụ thể. Tên tác giả commit không được dùng làm bằng chứng danh tính sinh viên.
- Review tương đồng AST hỗ trợ BTC xem xét bài giống nhau; không tự kết luận đạo văn chỉ từ điểm tương đồng.

Xem [thiết kế và bất biến bảo mật](competition/README.md), [nộp đồng thời và email VNU](docs/NOP_DONG_THOI_VNU.md), [vận hành](docs/OPERATIONS.md).

## Rẻ — Tận dụng hạ tầng, chi trả theo nhu cầu

### Khi triển khai tại trường

Chạy **website, API, PostgreSQL và worker trên hạ tầng local của trường**, kết hợp tên miền và HTTPS. Không bắt buộc Vercel, database cloud hay dịch vụ trả phí theo lượt chấm. Có thể tận dụng máy sẵn có và bổ sung worker khi đo thấy hàng đợi cần thêm năng lực xử lý.

### Khi trình diễn

Website dùng địa chỉ `vercel.app`, database PostgreSQL trên cloud và worker Docker trên máy BTC. Worker chủ động gọi API nên không cần mở cổng máy chấm ra Internet hoặc mua tên miền để demo. **Máy chấm phải bật, Docker hoạt động và có mạng** để bài được xử lý.

### Những lựa chọn giúp giảm chi phí

| Lựa chọn | Lợi ích |
|---|---|
| Hàng đợi trong PostgreSQL | Không bắt buộc vận hành thêm một dịch vụ hàng đợi riêng. |
| Tách worker khỏi website | Điều chỉnh năng lực chấm theo nhu cầu, không phải nâng toàn bộ hệ thống. |
| Hạn mức bài nộp và đấu thử | Giới hạn tính toán bị lãng phí hoặc lạm dụng. |
| Gửi trùng dùng lại phiên bản/kết quả | Tránh chấm lại cùng công việc không cần thiết. |
| Runtime đóng gói sẵn, không cài dependency cho từng bài | Giảm thời gian chuẩn bị và biến động môi trường. |
| Replay lưu nước đi, xuất HTML ngoại tuyến | Xem lại trận mà không phải chạy lại Python. |

Local vẫn có chi phí điện, phần cứng, lưu trữ, backup và người vận hành. Bản demo cloud phụ thuộc quota của nhà cung cấp; cấu hình miễn phí không đồng nghĩa đủ năng lực cho giải quy mô lớn.

## Setup nhanh

### Phương án chính: toàn bộ local với Docker + PostgreSQL

Chuẩn bị Node.js theo `package.json`, Docker Desktop hoặc Docker Engine và Git. Lần cài đặt/build đầu cần Internet để lấy dependency, image và runtime.

```sh
npm ci
npm run local:init
docker compose -f compose.local.yaml up -d --build --wait
```

Mở **http://localhost:3000/competition**. Làm theo [hướng dẫn local](deploy/LOCAL_POSTGRES.md) để cấp quyền BTC, cấu hình LAN/tên miền, HTTPS, email và backup. Các bản local và cloud có dữ liệu độc lập; không tự đồng bộ với nhau.

### Phương án demo: Vercel + worker Docker local

Làm theo [hướng dẫn Vercel và bộ chấm](deploy/VERCEL_JUDGE.md). Với máy đã có image và cấu hình riêng, bật worker bằng:

```sh
docker compose -f compose.judge.yaml --env-file .env.judge.local up -d --no-build --pull never
```

Lệnh này dùng image có sẵn; không thay thế bước chuẩn bị ban đầu. Xem [kịch bản demo sinh viên](docs/DEMO_STUDENT.md). Không đưa `.env*`, `.secrets/`, mật khẩu, token hay backup vào Git.

## Tổ chức một giải đấu

1. BTC đăng nhập, chọn **Tạo giải đấu**, đặt tên, hạn nộp, số bảng, số đội đi tiếp và luật trận đấu.
2. Mở nhận bài; cho phép tham gia trực tiếp hoặc quản lý danh sách đội bằng mã riêng.
3. Sinh viên nộp Python, xem kiểm tra lỗi và đấu thử để cải thiện bot trước hạn.
4. BTC chốt bài và khóa phiên bản dự thi; hệ thống chia bảng, tạo lịch và chuyển công việc cho worker.
5. Theo dõi tiến độ, xử lý trường hợp cần xem xét, công bố kết quả và xuất dữ liệu/replay.

Các ván đấu thử có kết quả ngay khi worker hoàn tất; bảng xếp hạng chính thức phụ thuộc lịch thi đấu và bước công bố của BTC.

## Bằng chứng kiểm thử và giới hạn

- Đã thực thi giải E2E **16 đội, 62 ván** bằng worker thật và kiểm thử các mẫu Python nguy hiểm.
- Kiểm thử trình duyệt bằng hai agent độc lập: một tạo giải; một tham gia bằng hai tài khoản sinh viên. Kết quả: **2 đội, 3 bài hợp lệ, 6 ván đấu thử hoàn tất, không có ván lỗi**; kiểm tra replay, tải lại trang, gửi trùng và tách lịch sử tài khoản. Xem [báo cáo workflow](docs/WORKFLOW_REVIEW.md).
- Đây là bằng chứng cho các kịch bản đã chạy, **không phải chứng nhận chịu tải 4.000 sinh viên**, cam kết thời gian trả kết quả hay kiểm định bảo mật độc lập. Tham khảo [tài liệu vận hành và kiểm thử tải](docs/OPERATIONS.md) để tái lập, đo và chọn cấu hình phù hợp.
- Luồng tạo giải đã hoạt động nhưng hướng dẫn sau khi tạo còn cần cải thiện; thông báo tái sử dụng bài nộp và trạng thái tài khoản khi tải trang còn điểm cần chỉnh. Chi tiết nằm trong báo cáo workflow.

Một số kiểm thử có thể chạy tại máy:

```sh
npm test
npm run test:competition
npm run test:competition:api
node tests/submit-trial.test.mjs
```

Các bài kiểm thử cần database, Docker hoặc worker phải được chuẩn bị theo tài liệu tương ứng; không chạy kiểm thử phá hủy dữ liệu trên database đang phục vụ giải.

## Tài liệu liên quan

- [Hướng dẫn sử dụng và tổ chức giải](docs/HUONG_DAN_SU_DUNG.md)
- [Setup local, LAN, backup và chuyển dữ liệu](deploy/LOCAL_POSTGRES.md)
- [Dashboard vận hành và kiểm thử tải](docs/OPERATIONS.md)
- [Quản lý tài khoản, đội và email](docs/STUDENT_PORTAL.md)
- [Công cụ sinh viên, bot mẫu và Elo](docs/STUDENT_TOOLS.md)
- [Cấu hình demo tự tổ chức và Resend](docs/DEMO_OPEN_RESEND.md)
- [PDF hướng dẫn sử dụng](docs/huong-dan-su-dung-ai-arena.pdf)
- [Bộ tài liệu nộp](docs/submission/README.md)

Các bản triển khai cũ dùng SQLite hoặc ChatGPT Sites được giữ để tham khảo trong [Docker README](docker/README.md) và tài liệu triển khai. Không trộn cơ chế đăng nhập, dữ liệu hay kết quả luyện tập của các profile với giải chính thức.
