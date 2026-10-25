# Đối chiếu tính năng và công cụ sinh viên

Các ý tưởng từ [repo Wolf-Alone `8bb2e8a`](https://github.com/Wolf-Alone-06/keobuabao/tree/8bb2e8a39213dd19845b5eaaf3706e5aea947d73) và nhánh `enhancements` `72b5558` được
chọn lọc cho kiến trúc hiện tại. Hai bot mẫu được thích nghi từ `enhancements`;
các công cụ mới dùng bộ chấm WASI, transaction và phân quyền của dự án, không
chép nguyên cơ chế thực thi Python máy chủ. Tài liệu này ghi nhận đóng góp về ý
tưởng; không tuyên bố mọi thành phần là mã nguồn nguyên bản từ repo tham chiếu.

| Mục trong ảnh | Trạng thái hiện tại |
|---|---|
| `starter_config.py` | Có: nạp trong `/practice`, sửa `BOT_CONFIG`, tự kiểm tra/benchmark hoặc tham gia Elo. |
| `heuristic_hunter.py` | Có, cùng Sprinter, Guardian và Tactician: tổng 5 bot tham chiếu. |
| Dynamic Elo | Có Elo bền vững K=24. Giữ công thức đối xứng; không áp dụng thưởng chuỗi thắng, giảm phạt chuỗi thua hay sàn 600 gây trôi tổng điểm. |
| Tie-break 5 tầng | Không thay luật thi hiện hành. CPU không phải thước đo công bằng giữa các máy; komi và tiêu chí mới cần chốt luật riêng trước giải. |
| Review AST | Có, BTC gọi trong `/operations`; tối đa 100 bài mới nhất hợp lệ, miễn trừ cấu trúc starter được duyệt. Chỉ hỗ trợ review, không tự phạt. |
| `benchmark-arena.mjs` | Có: trên web và CLI, 1-5 cặp đổi bên, cùng seed mỗi cặp; thống kê T/H/B, thời gian ván/nước và replay. Không cập nhật Elo. |
| Replay HTML ngoại tuyến | Có ở giải và kết quả benchmark; không chạy Python hoặc truy cập mạng. |
| Tests Elo/tie-break | Elo, lease và điểm cập nhật một lần được kiểm thử. Không thêm tests giả cho công thức/tie-break không sử dụng. |
| Diagnostic/self-test | Sinh viên tự kiểm tra bản nháp trong `/practice` hoặc CLI; không cần nộp bản nháp vào giải/Elo. BTC còn có self-test hạ tầng riêng. |
| Automatic matchmaking | Có: gần Elo nhất trong khoảng tối đa 200 điểm; đổi bên; giới hạn cặp/người/đối thủ mỗi ngày. Không có tên/ID đối thủ trong state gửi cho bot. Đây là giảm nguy cơ bơm điểm, không phải chứng minh chống mọi thông đồng. |

## Sinh viên sử dụng web

1. Đăng nhập và vào `/practice`.
2. Dán hoặc tải `.py`; hoặc chọn bot mẫu rồi **Nạp mã bot mẫu**.
3. **Tự kiểm tra bản nháp**: worker kiểm tra cơ bản ở P1/P2 và trả mã lỗi.
4. Chọn đối thủ mẫu và 1-5 cặp, bấm **Benchmark bản nháp**. Xem T/H/B và tải
   JSON/replay HTML trong **Kết quả benchmark**. Lượt thử không tự kích hoạt Elo.
5. Khi muốn tham gia ladder, bấm **Tham gia đấu tập Elo**. Bản hợp lệ mới nhất
   thay bot đang hoạt động; đổi source không reset rating. Nếu không có đối thủ
   trong khoảng 200 Elo, ladder đợi; benchmark mẫu vẫn dùng được.

Profile PostgreSQL có worker là bắt buộc cho các chức năng này. Việc nền nhận
lease sau công việc chính thức ở slot tương ứng. Không hủy trận nền đã chạy khi
có job chính thức mới; worker lấy job chính thức ở vòng lease tiếp theo.

## Chẩn đoán

E01: cú pháp/thụt lề; E02: giao diện hoặc lỗi Python khởi tạo; E03: nước đi sai;
E04: vượt thời gian; E05: khả năng/thư viện không hỗ trợ; E06: memory/fuel/output.
Các mã dựa trên kết quả thực thi, không dựa vào danh sách từ khóa để tuyên bố an
toàn. Chỉnh bản sao `state` trong guest không sửa trạng thái trọng tài, nên không
bị tự động kết tội. Không coi `import os` hay `eval` là bằng chứng thoát sandbox.

Kiểm tra cơ bản không bao phủ mọi thế cờ. Benchmark mặc định 40 nước/ván,
1.000 ms/nước, startup 8 giây, memory Wasm 128 MiB. Giải có thể dùng config khác;
validation chính thức của giải vẫn là chuẩn. Thời gian đo gồm startup/IPC và phụ
thuộc máy/tải; không dùng timing làm tie-break. Thống kê nước chỉ gồm lời gọi
hoàn tất, không gồm lời gọi lỗi hoặc timeout. Worker cũ có thể không gửi timing;
UI ghi chưa đo thay vì 0 ms.

Hạn mức riêng: 50 lượt diagnostic/24 giờ, 40 ván benchmark/24 giờ; mỗi loại chỉ
có một lượt chờ/đang chạy, cách nhau ít nhất 5 giây. 1-5 cặp tương đương 2-10
ván. API lấy chủ từ session; không nhận user/team tùy ý. Kết quả chỉ người nộp
đọc được. Nguồn bản nháp được lưu trong payload công việc nội bộ phục vụ chấm;
không đưa trường source/payload vào báo cáo hoặc phản hồi cho người khác. Thông
báo lỗi riêng của người nộp có thể trích một dòng source để giúp sửa lỗi. BTC cần theo
dõi dung lượng và có chính sách lưu giữ dữ liệu luyện tập khi mở cho nhiều lớp.

## CLI tùy chọn, chạy local bằng Docker

Không bắt buộc sinh viên cài Docker; web ở trên là cách đơn giản nhất. Với máy
đã có profile PostgreSQL, build worker mới một lần rồi chạy công cụ trong worker.
Ví dụ PowerShell, chạy tại root repository:

```powershell
docker compose -f compose.local.yaml build judge
docker compose -f compose.local.yaml run --rm --no-deps -v "${PWD}/public/bots:/bots:ro" judge node scripts/diagnose-bot.mjs /bots/starter_config.py
docker compose -f compose.local.yaml run --rm --no-deps -v "${PWD}/public/bots:/bots:ro" judge node scripts/benchmark-arena.mjs /bots/starter_config.py /bots/heuristic_hunter.py 2
```

Thay thư mục bind mount bằng thư mục chứa bot của bạn. Source được đọc UTF-8,
tối đa 64 KiB, rồi chạy trong CPython WASI. Không có fallback sang Python host.
Diagnostic exit 0 khi đạt, 1 khi bot không đạt, 2 khi công cụ/runtime gặp lỗi.
Benchmark có thể ghi JSON bằng đối số cuối; từ chối ghi đè file đã tồn tại.
Report chỉ chứa hash/config/replay/thời gian; không kèm source. CLI không gọi
website, không cần tài khoản và không sửa database/Elo.

Khi đã có image, CLI dùng được offline. Tạo giải chính thức vẫn theo quy trình
freeze, luật và runtime đã chốt; các tool luyện tập không thay đổi quy trình này.
