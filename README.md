# Moody

Ứng dụng web theo dõi tâm trạng hằng ngày — mobile-first, hỗ trợ cài đặt như PWA. Xây dựng với React, Vite, Tailwind CSS và Firebase (Authentication + Firestore).

![Node](https://img.shields.io/badge/node-%3E%3D18-informational)
![License](https://img.shields.io/badge/license-private-lightgrey)

<br/>

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ](#công-nghệ)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Cấu hình Firebase](#cấu-hình-firebase)
- [Scripts](#scripts)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Mô hình dữ liệu](#mô-hình-dữ-liệu)
- [Hệ thống màu & dark mode](#hệ-thống-màu--dark-mode)
- [Thông báo (Notifications)](#thông-báo-notifications)
- [PWA & cài đặt ứng dụng](#pwa--cài-đặt-ứng-dụng)
- [Build & triển khai](#build--triển-khai)
- [Lộ trình](#lộ-trình)

<br/>

## Tính năng

| Trang | Mô tả |
|---|---|
| **Hôm nay** | Bảng chào mừng, trạng thái check-in trong ngày, dải 7 ngày (Thứ 2 → Chủ nhật), chuỗi ngày liên tiếp, mood trung bình tuần, 3 check-in gần nhất |
| **Check-in** | Chọn ngày & giờ (mặc định hiện tại), chọn 1 trong 5 mức tâm trạng, chọn hoạt động trong ngày (icon emoji), ghi chú nhanh tự giãn dòng, lưu hoặc chỉnh sửa lại bất kỳ lúc nào |
| **Lịch sử** | 2 chế độ xem — *Danh sách* (tìm kiếm, bộ lọc dạng dropdown theo thời gian/cảm xúc, sắp xếp, **vuốt phải để sửa / vuốt trái để xóa** — thực hiện ngay, có thông báo xác nhận sau khi hoàn tất) và *Lịch* (xem mood theo từng ngày trong tháng, chạm vào ngày trống để tạo check-in ngay cho ngày đó) |
| **Thống kê** | Chọn khoảng Ngày / Tuần / Tháng / Năm, biểu đồ cột + biểu đồ tròn (xu hướng mood, phân bố cảm xúc, hoạt động thường gặp), xuất báo cáo PDF theo khoảng đang chọn |
| **Cài đặt** | Giao diện Sáng/Tối/Hệ thống, cỡ chữ, nhắc nhở check-in & báo cáo tuần/tháng, cài đặt ứng dụng (PWA), xuất/xóa dữ liệu |
| **Quản lý hoạt động** *(sidebar)* | Thêm/sửa/xóa hoạt động (mặc định lẫn tự tạo), **kéo-thả để sắp xếp thứ tự**, vuốt phải/trái để sửa/xóa |
| **Quản lý tâm trạng** *(sidebar)* | Đổi emoji + tên hiển thị cho 5 mức tâm trạng, khôi phục về mặc định bất kỳ lúc nào |

Điều hướng chính nằm ở **bottom bar** (mobile-first) với nút check-in nổi ở giữa; **sidebar** (mở qua icon ☰ ở header) chứa đầy đủ điều hướng cộng thêm 2 trang Quản lý.

Ứng dụng hoạt động được ngay cả khi **chưa đăng nhập** (chế độ khách — dữ liệu lưu trong `localStorage`). Khi đăng nhập bằng Google, dữ liệu tự động đồng bộ lên Firestore theo từng tài khoản.

<br/>

## Công nghệ

- **React 18** + **Vite 5** — SPA, dev server nhanh, HMR
- **Tailwind CSS 3** — toàn bộ theme (màu, khoảng cách, bo góc) khai báo tại [`tailwind.config.js`](./tailwind.config.js)
- **Firebase** — Authentication (Google Sign-In) + Cloud Firestore
- **React Router 6** (`HashRouter`) — điều hướng phía client, tương thích tốt khi host tĩnh
- **Recharts** — biểu đồ cột & tròn trong trang Thống kê
- **jsPDF + html2canvas** — xuất báo cáo PDF (render HTML → ảnh → PDF, tránh lỗi font tiếng Việt)
- **lucide-react** — bộ icon dùng trong toàn app
- **vite-plugin-pwa** — service worker, manifest, khả năng cài đặt như app
- **Pointer Events API** (native, không thư viện ngoài) — cử chỉ vuốt trong `components/SwipeableRow.jsx`

<br/>

## Bắt đầu nhanh

```bash
# 1. Cài dependencies
npm install

# 2. Điền API key Firebase vào file .env (xem mục bên dưới)

# 3. Chạy dev server
npm run dev
```

Yêu cầu Node.js ≥ 18.

<br/>

## Cấu hình Firebase

Dự án đã có sẵn file **`.env`** ở thư mục gốc — chỉ cần điền giá trị vào, không cần sửa code.

1. Tạo project tại [Firebase Console](https://console.firebase.google.com).
2. **Authentication → Sign-in method** → bật **Google**.
3. **Firestore Database** → tạo database (chế độ Production hoặc Test).
4. **Project settings → General → Your apps** → tạo Web app, copy từng giá trị vào `.env`:

   ```bash
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
   VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
   ```

   (`.env.example` là bản mẫu tham khảo cùng cấu trúc.) Sau khi điền, khởi động lại `npm run dev` để Vite nạp biến môi trường mới.

5. Thiết lập **Firestore Security Rules** để mỗi người dùng chỉ đọc/ghi được dữ liệu của chính mình:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

Không cấu hình Firebase vẫn chạy được app — chỉ là dữ liệu sẽ lưu cục bộ (`localStorage`) thay vì đồng bộ đám mây. `.env` đã được thêm vào `.gitignore`, không lo lộ key khi đưa code lên git.

<br/>

## Scripts

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy dev server (Vite) |
| `npm run build` | Build production vào `dist/` |
| `npm run preview` | Chạy thử bản build production |

<br/>

## Cấu trúc thư mục

```
src/
├── firebase.js                    # Đọc cấu hình Firebase từ biến môi trường (.env)
├── App.jsx                        # Router gốc + gate đăng nhập/khách
├── main.jsx                       # Entry point, khởi tạo theme trước khi render
│
├── context/
│   ├── AuthContext.jsx            # Trạng thái đăng nhập Google
│   ├── MoodEntriesContext.jsx     # Dữ liệu check-in — nạp MỘT LẦN ở gốc app, dùng chung mọi trang
│   ├── ActivitiesContext.jsx      # Hoạt động (mặc định + tùy chỉnh + thứ tự)
│   ├── MoodsContext.jsx           # Emoji/tên hiển thị 5 mức mood
│   └── ToastContext.jsx           # Thông báo nhẹ tự ẩn
│
├── hooks/
│   ├── useMoodEntries.js          # Re-export từ MoodEntriesContext (Firestore, fallback localStorage)
│   ├── useActivities.js           # Hoạt động mặc định + tùy chỉnh (thêm/sửa/xóa/sắp xếp)
│   ├── useMoods.js                # Emoji + tên hiển thị của 5 mức mood (có thể tùy chỉnh)
│   ├── useInstallPrompt.js        # Bắt sự kiện beforeinstallprompt (PWA)
│   ├── useNotificationScheduler.js# Kiểm tra mỗi phút để bắn thông báo nhắc nhở
│   └── useIsDark.js                # Theme hiện tại — dùng tô màu chữ trong biểu đồ SVG
│
├── lib/
│   ├── moodConfig.js               # Định nghĩa GỐC: key/score/color 5 mức mood (cố định), hoạt động mặc định
│   ├── dateUtils.js                # Tiện ích ngày tháng, streak, nhãn tương đối
│   ├── statsUtils.js               # Gom nhóm dữ liệu theo ngày/tuần/tháng/năm
│   ├── reportGenerator.js          # Xuất PDF (html2canvas + jsPDF)
│   ├── notifications.js            # Nhắc check-in / báo cáo tuần / báo cáo tháng
│   └── theme.js                    # Dark mode + cỡ chữ
│
├── components/
│   ├── Login.jsx                   # Màn hình đăng nhập / chế độ khách
│   ├── AppShell.jsx                # Header + bottom nav (4 tab) + FAB check-in + scroll-to-top
│   ├── Sidebar.jsx                 # Drawer menu đầy đủ (mở qua icon ☰ ở header)
│   ├── Dialog.jsx                  # Dialog form (thêm/sửa) căn giữa
│   ├── PageSkeleton.jsx            # Skeleton hiển thị khi trang đang tải (lazy route)
│   ├── SwipeableRow.jsx            # Cử tay vuốt trái/phải cho card trong Lịch sử
│   └── ConfirmDialog.jsx           # Hộp thoại xác nhận dùng lại nhiều nơi
│
└── pages/
    ├── Dashboard.jsx                # "Hôm nay"
    ├── CheckIn.jsx                  # Check-in mới / chỉnh sửa (có chọn ngày giờ)
    ├── History.jsx                  # "Lịch sử" — tab Danh sách (vuốt để sửa/xóa) & Lịch
    ├── Statistics.jsx                # "Thống kê"
    ├── Settings.jsx                  # "Cài đặt"
    ├── ManageActivities.jsx          # CRUD + sắp xếp hoạt động (route /manage/activities)
    └── ManageMoods.jsx               # Sửa emoji/tên 5 mức mood (route /manage/moods)
```

<br/>

## Mô hình dữ liệu

**MoodEntry** — lưu tại `users/{uid}/entries/{entryId}` (Firestore) hoặc `localStorage` ở chế độ khách:

```
├── date          "YYYY-MM-DD"     (người dùng chọn được khi check-in, không bắt buộc là hôm nay)
├── time           ISO timestamp   (kết hợp từ ngày + giờ chọn trong form)
├── mood            "great" | "good" | "okay" | "sad" | "angry"   (key cố định, nhãn hiển thị có thể đổi)
├── score           1–5             (cố định theo key, không đổi khi sửa tên/emoji mood)
├── activities[]    id các hoạt động đã chọn, tham chiếu tới Activity bên dưới
└── note            string
```

**Activity** — mặc định khai báo tại `lib/moodConfig.js`; danh sách tùy chỉnh + thứ tự lưu tại `users/{uid}/meta/activities`:

```
├── id
├── emoji     nhập tự do từ bàn phím emoji của hệ điều hành
├── label
└── custom    true nếu do người dùng tự tạo (chỉ hoạt động custom mới sửa/xóa được — mặc định chỉ sắp xếp được)
```

**Mood override** — lưu tại `users/{uid}/meta/moods`, dạng `{ overrides: { [key]: { emoji, label } } }`. `key`, `score`, `color` gốc trong `moodConfig.js` không bao giờ đổi, đảm bảo logic thống kê/streak luôn nhất quán dù người dùng đổi tên/emoji hiển thị.

<br/>

## Hệ thống màu & dark mode

Toàn bộ màu nền/chữ dùng CSS custom properties (`--c-paper`, `--c-ink`, `--c-inkmuted`, `--c-line`, `--c-surface`, `--c-accent`), khai báo tại [`src/index.css`](./src/index.css) và đổi giá trị theo class `.dark` trên `<html>` — nên tự động đảo màu đúng ở mọi nơi trong app, kể cả input/select gốc của trình duyệt (`color-scheme`).

- **`primary`** — màu thương hiệu cố định (Tailwind `teal-600` / `#0D9488`), dùng làm nền các nút hành động chính (CTA), không đổi theo theme.
- **`oncolor`** — màu chữ sáng cố định, luôn dùng cùng `primary` hoặc các màu mood đậm để đảm bảo tương phản ở cả 2 theme.
- **`accent`** — màu nhấn *đổi theo theme* (xanh lục đậm `teal-700` ở giao diện sáng → xanh lục nhạt `teal-300` ở giao diện tối), dùng cho text/icon/viền cần nổi bật trên nền trang (tab đang chọn, nút sửa, viền focus…).

Muốn đổi tông màu chủ đạo: sửa `primary` trong [`tailwind.config.js`](./tailwind.config.js) và `--c-accent` (2 giá trị sáng/tối) trong [`src/index.css`](./src/index.css), cùng hằng số `THEME.light/dark.accent` trong `pages/Statistics.jsx` (biểu đồ dùng màu literal, xem ghi chú bên dưới).

Biểu đồ Recharts dùng màu literal tính từ `useIsDark()` thay vì `var()` trực tiếp trong SVG, vì một số trình duyệt không resolve đúng CSS variable trong thuộc tính SVG.

<br/>

## Thông báo (Notifications)

Trang Cài đặt cho phép bật:
- **Nhắc check-in hằng ngày** vào giờ tùy chọn
- **Nhắc xem báo cáo tuần** (mỗi thứ 2)
- **Nhắc xem báo cáo tháng** (ngày 1 hằng tháng)

Cơ chế dùng Web Notification API thuần (`hooks/useNotificationScheduler.js` kiểm tra mỗi phút) — **chỉ hoạt động khi Moody đang mở trong trình duyệt hoặc PWA**. Để nhắc nhở chạy nền thật sự kể cả khi đã đóng app, cần bổ sung service worker + push server (Firebase Cloud Messaging là lựa chọn phù hợp vì dự án đã dùng Firebase).

<br/>

## PWA & cài đặt ứng dụng

- Icon và manifest khai báo tại [`vite.config.js`](./vite.config.js) (qua `vite-plugin-pwa`) và các file trong [`public/`](./public) (`favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icons/`).
- Trang Cài đặt hiện thẻ **"Cài đặt ứng dụng"** khi trình duyệt bắn sự kiện `beforeinstallprompt` (Chrome/Edge trên Android & desktop) và app chưa được cài.
- Safari/iOS không hỗ trợ sự kiện này — người dùng cài thủ công qua **Share → Thêm vào Màn hình chính**.

<br/>

## Build & triển khai

```bash
npm run build
```

Deploy thư mục `dist/` lên bất kỳ static host nào (Firebase Hosting, Vercel, Netlify, Cloudflare Pages…). Vì dùng `HashRouter`, không cần cấu hình rewrite rule cho SPA routing.

<br/>

## Lộ trình

Đã lên khung, có thể làm thêm ở bản sau:

- Journal — nhật ký dài kèm tìm kiếm nội dung
- Goals & Streak — mốc thành tích 7/30/100 ngày
- Insights tự động (vd. "Mood tuần này cao hơn tuần trước")
- Import dữ liệu từ file JSON đã xuất
- Push notification chạy nền thật sự (service worker + push server)

## Ghi chú hiệu năng

- Dữ liệu (check-in, hoạt động, tâm trạng) được nạp **một lần** ở gốc app qua Context nên chuyển trang không bị tải lại.
- Các trang được **lazy-load** (code splitting) và **preload khi trình duyệt rảnh**; thư viện PDF (`jspdf`, `html2canvas`) chỉ được nạp khi bấm xuất báo cáo.
- Hộp thoại xác nhận (`ConfirmDialog`, `z-[80]`) luôn nằm trên mọi dialog/form khác.
