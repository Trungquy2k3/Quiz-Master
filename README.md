# Quiz Master — Bài kiểm tra điền từ

Website học tập trực tuyến dạng "điền từ còn thiếu", 20 câu hỏi, chạy hoàn toàn
bằng HTML/CSS/JavaScript thuần (không cần backend). Dữ liệu bài làm được lưu
bằng `localStorage` của trình duyệt.

## 1. Cấu trúc thư mục

```
/
├── index.html          # Nhập thông tin học viên + nút bắt đầu
├── quiz.html           # Màn hình làm bài (20 câu)
├── result.html         # Màn hình kết quả + nút "Nộp bài"
├── admin.html          # Đăng nhập + dashboard quản trị
├── css/
│   └── style.css       # Toàn bộ giao diện, animation, responsive
├── js/
│   ├── storage.js       # Lớp lưu trữ dữ liệu (localStorage)
│   ├── confetti.js       # Hiệu ứng confetti (canvas thuần)
│   ├── questions.js       # Ngân hàng 20 câu hỏi
│   ├── quiz.js            # Logic form bắt đầu + logic làm bài
│   ├── result.js          # Logic màn hình kết quả / nộp bài
│   └── admin.js           # Logic trang quản trị
└── assets/
    ├── images/
    └── sounds/          # (không dùng file mp3 — âm thanh tạo bằng Web Audio API)
```

## 2. Cách chạy trên máy tính

Vì trang dùng `fetch`/module ở một số trình duyệt có thể chặn khi mở file
trực tiếp bằng `file://`, cách chắc chắn nhất là chạy qua một local server nhỏ:

**Cách 1 — dùng VS Code:** cài extension "Live Server" → chuột phải vào
`index.html` → "Open with Live Server".

**Cách 2 — dùng Python (đã cài sẵn trên hầu hết máy):**
```bash
cd quiz-master
python3 -m http.server 8080
```
Sau đó mở trình duyệt tại `http://localhost:8080`.

**Cách 3 — đơn giản nhất:** thử mở trực tiếp `index.html` bằng cách double-click.
Nếu trình duyệt chạy bình thường (đa số Chrome/Edge/Firefox đều chạy được vì
trang không dùng module ES6 hay fetch tới file cục bộ) thì không cần server.

## 3. Cách thay đổi 20 câu hỏi

Mở file `js/questions.js`. Mỗi câu hỏi là một object trong mảng `QUESTIONS`:

```javascript
{
  id: 1,
  question: "Tôi ___ học tiếng Trung mỗi ngày.", // "___" là vị trí cần điền
  answer: "đang",                                  // đáp án hiển thị khi sai 3 lần
  acceptedAnswers: ["đang"],                        // các đáp án được chấp nhận
  explanation: "..."                                // giải thích (hiện ở trang kết quả)
}
```

- Có thể thêm nhiều đáp án hợp lệ vào `acceptedAnswers`.
- Việc so sánh đáp án không phân biệt hoa/thường và tự loại bỏ khoảng trắng thừa.
- Giữ đúng 20 phần tử trong mảng để khớp với giao diện "Câu x/20"; nếu muốn
  đổi tổng số câu, sửa thêm phần hiển thị cứng "20" trong `index.html`.

## 4. Đưa website lên GitHub Pages

1. Tạo một repository mới trên GitHub, ví dụ `quiz-master`.
2. Trong thư mục `quiz-master` (thư mục gốc chứa `index.html`):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<ten-tai-khoan>/quiz-master.git
   git push -u origin main
   ```
3. Vào repository trên GitHub → **Settings → Pages**.
4. Ở mục "Build and deployment", chọn **Source: Deploy from a branch**,
   **Branch: main**, thư mục **/(root)** → **Save**.
5. Sau khoảng 1-2 phút, GitHub sẽ cung cấp đường dẫn dạng:
   `https://<ten-tai-khoan>.github.io/quiz-master/`
6. Trang admin sẽ nằm ở: `https://<ten-tai-khoan>.github.io/quiz-master/admin.html`

## 5. Dữ liệu được lưu và Admin đọc dữ liệu như thế nào

Tất cả được lưu trong `localStorage` của **trình duyệt trên máy đang truy cập**
(mỗi trình duyệt/máy có kho dữ liệu riêng, không tự động đồng bộ giữa các máy):

| Key trong localStorage      | Nội dung                                                |
|------------------------------|----------------------------------------------------------|
| `qm_student_info`            | Thông tin học viên của phiên làm bài hiện tại             |
| `qm_current_attempt`         | Tiến trình bài đang làm (câu hiện tại, số lần sai, v.v.)  |
| `qm_pending_result`          | Kết quả vừa hoàn thành, chờ bấm "Nộp bài"                 |
| `qm_submissions`             | **Danh sách tất cả bài đã nộp** — đây là dữ liệu Admin đọc |
| `qm_sound_enabled`           | Tuỳ chọn bật/tắt âm thanh                                  |

Khi học viên bấm **"Nộp bài"** ở `result.html`, một object bài làm (điểm, số
câu đúng/sai, thời gian, chi tiết từng câu...) được thêm vào mảng lưu ở key
`qm_submissions` (xem hàm `DataStore.addSubmission` trong `js/storage.js`).

Trang `admin.html` (qua `js/admin.js`) chỉ đơn giản gọi
`DataStore.getSubmissions()` để đọc lại toàn bộ mảng đó, rồi hiển thị bảng,
thống kê và biểu đồ. Vì vậy: **học viên và Admin phải dùng cùng một trình
duyệt trên cùng một máy** để Admin thấy được bài vừa nộp — đây là giới hạn
tự nhiên của localStorage (không có server trung tâm).

### Nâng cấp lên backend thật (Firebase / Supabase / MySQL+PHP / Node.js)

Toàn bộ phần đọc/ghi dữ liệu được gói gọn trong object `DataStore` ở
`js/storage.js`. Khi muốn chuyển sang lưu trên server:

1. Giữ nguyên chữ ký các hàm của `DataStore` (`getSubmissions()`,
   `addSubmission()`, `deleteSubmission()`, v.v.).
2. Viết lại phần thân hàm để gọi API/SDK tương ứng (ví dụ Firebase
   `Firestore`, Supabase client, hoặc `fetch()` tới API PHP/Node.js) thay vì
   `localStorage.getItem/setItem`.
3. Vì các trang khác chỉ gọi qua `DataStore`, phần giao diện (HTML/CSS) và
   luồng làm bài hầu như không cần sửa gì thêm.

## 6. Tài khoản Admin (demo)

- Username: `admin`
- Password: `123456`

Đây chỉ là cơ chế đăng nhập phía frontend để demo, **không phải bảo mật thực
sự** — bất kỳ ai xem mã nguồn JavaScript đều thấy được mật khẩu. Khi triển
khai thật, cần xác thực qua backend.
