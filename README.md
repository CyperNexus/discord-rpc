# OuterVerse Panel ⚡

> **Multi-Account Discord Selfbot & Dynamic Rich Presence Control Dashboard**

OuterVerse Panel là hệ thống Dashboard quản lý đa tài khoản Discord nâng cao (không giới hạn số lượng tài khoản) với giao diện kính mờ Glassmorphic kết hợp mạng lưới hạt Neon linh hoạt, hỗ trợ phát Rich Presence xoay vòng bài hát, đếm thời lượng vô cực, treo Voice 24/7 và tự động phản hồi AFK.

> [!IMPORTANT]
> **🔑 Lấy Khóa Bảo Vệ (Secret Key / Activation Key):**
> Hệ thống OuterVerse Panel được phát hành hoàn toàn miễn phí. Để lấy mã bảo mật kích hoạt khi khởi chạy Panel, vui lòng liên hệ qua Discord: **`._almighty`** (hỗ trợ 100% miễn phí).

> [!TIP]
> **💡 Mẹo cấu hình hình ảnh / GIF / video (RPC Assets):**
> Để tránh tình trạng ảnh bị lỗi (chấm hỏi) do các link Discord CDN hết hạn sau 24 giờ hoặc các dịch vụ upload ảnh ngoài (như Catbox, ImgBB) bị chặn bởi hệ thống Cloudflare của Discord, bạn nên **tải các file ảnh/video/GIF lên một kho lưu trữ GitHub công khai** của mình, sau đó copy đường dẫn gốc (**`raw.githubusercontent.com`**) của tệp để dán vào cấu hình RPC. CDN của GitHub cực kỳ ổn định, tải nhanh và không bao giờ bị Discord chặn.

---

## ✨ Tính Năng Nổi Bật

- 👥 **Quản Lý Đa Tài Khoản (Multi-Account):** Thêm / Xóa động không giới hạn tài khoản Discord trực tiếp trên giao diện.
- 💾 **Tách biệt Cấu hình (Per-Account Config Storage):** Cấu hình của từng tài khoản được lưu trữ độc lập tại thư mục `accounts/` (ví dụ `rpc-config-1.json`), tối ưu I/O ghi đĩa và giảm thiểu tối đa RAM tiêu thụ trên VPS yếu.
- 🔑 **Khóa Mật Khẩu Tài Khoản (Account Password Lock):** Đặt mật khẩu bảo vệ riêng cho từng tài khoản khi thêm mới. Yêu cầu nhập mật khẩu để mở khóa thao tác config hoặc xác nhận xóa tài khoản.
- 🎵 **Rich Presence Xoay Vòng (RPC Rotation):**
  - Tạo không giới hạn danh sách bài hát / hoạt động (Profile RPC).
  - Tùy chọn phát **SEQUENTIAL (Lần lượt)** hoặc **RANDOM (Ngẫu nhiên)**.
  - Tùy chỉnh mốc thời gian chuyển bài theo từng **Giây (Seconds)**.
- ⏳ **Thanh Thời Lượng Phát Nhạc (Spotify-Style Progress Bar):**
  - Tùy chọn **VÔ TẬN (`496179:23:13 --- 23999999999:59:59`)**.
  - Chế độ **THỰC TẾ** (Đếm từ 00:00 đến hết bài) hoặc **TẮT**.
- 💬 **Dynamic Status Rotation:** Tùy chỉnh danh sách trạng thái chữ + emoji tự động xoay theo từng mốc giây.
- 🔊 **Voice Channel Holder:** Treo tài khoản trong kênh thoại máy chủ Discord với tùy chọn Tắt Mic / Tắt Tai nghe, tích hợp cơ chế chống rớt phòng 24/7.
- 🎯 **Discord Quests Auto-Completer (Interactive DM Bot Control):**
  - Tự động quét, nhận và làm các nhiệm vụ Discord Quest (video, stream, game) với cơ chế giả lập RPC ứng dụng Game và nhịp tim heartbeat chuẩn xác.
  - Tích hợp **Discord Bot tương tác qua DM**: Gửi tin nhắn riêng đi kèm bảng điều khiển nút bấm (**Khởi chạy, Tạm dừng, Danh sách Quest**) đến tài khoản của bạn.
  - Cơ chế **Hàng đợi ưu tiên**: Tự động nhận diện và làm các nhiệm vụ có phần thưởng Orbs cao trước.
  - Cơ chế **Khôi phục/Tạm dừng phiên**: Lưu lại tiến độ làm quest hiện tại vào tệp JSON nhẹ (`quest-database.json`) để tiếp tục làm tiếp khi khôi phục, tránh nhảy sang nhiệm vụ khác gây mất tiến độ.
- 🎨 **Giao Diện Neon Glassmorphism:** Hiệu ứng mạng lưới hạt Neon sống động, hỗ trợ tải lên ảnh nền (PNG, JPEG, JPG, GIF) hoặc **video hình nền (MP4, WebM, Ogg)**.
- 📁 **Hạn mức dung lượng theme:** Bạn có thể cấu hình phím `"maxThemeSizeMB"` trực tiếp trong file cấu hình `.json` của từng tài khoản (ví dụ: `10`, `50`, `100` MB) để đặt hạn mức tải lên. Nếu khi khởi động/tải lại cấu hình phát hiện theme hiện tại vượt giới hạn này, hệ thống sẽ tự động xóa theme để tránh nặng ổ đĩa.

---

## ⚙️ Cấu hình Discord Quest Bot

Để sử dụng tính năng điều khiển làm nhiệm vụ qua DM Bot, bạn cần tạo tệp cấu hình **`bot-config.json`** tại thư mục gốc của dự án (nằm ngoài thư mục `accounts/` và được tự động ẩn khỏi git commit) với nội dung như sau:

```json
{
  "token": "YOUR_DISCORD_BOT_TOKEN",
  "guildId": "YOUR_DISCORD_SERVER_ID",
  "ownerId": "YOUR_DISCORD_USER_ID"
}
```

*Trong đó:*
- `token`: Token của Discord Bot (được tạo từ Discord Developer Portal).
- `guildId`: ID máy chủ của bạn.
- `ownerId`: ID tài khoản Discord của bạn (người sở hữu bot, dùng để phân quyền bấm nút).

---

## 🕹️ Lệnh Console Command

Khi chương trình đang chạy, bạn có thể gõ trực tiếp lệnh này vào màn hình terminal/console của panel:

- **`loadconfig`**: Tải nóng lại toàn bộ cấu hình từ thư mục `accounts/` vào bộ nhớ và tự động làm mới giao diện tất cả trình duyệt đang mở mà không cần khởi động lại toàn bộ panel.

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu cầu hệ thống
- Node.js version `>= 18.x`

### 2. Cài đặt các gói phụ thuộc (Dependencies)
```bash
npm install
```

### 3. Khởi chạy ứng dụng
```bash
node index.js
```

Mở trình duyệt web và truy cập: **`http://localhost:3000`**

---

## 🔒 Bảo Mật & Lưu Ý (Security Notice)

- Các file cấu hình trong thư mục `accounts/`, `bot-config.json`, `quest-database.json` và `afk-logs.json` được tự động bỏ qua qua `.gitignore` tránh làm lộ Token.
- Tài khoản đăng nhập Dashboard mặc định (khi mở trên Server/VPS):
  - **Username:** `outerverse`
  - **Password:** `outerverse`

---

## 📄 License
Project này được phát hành dưới giấy phép phi thương mại của CyperNexus. Nghiêm cấm mọi hành vi sao chép, chỉnh sửa, hoặc sử dụng mã nguồn/sản phẩm cho mục đích thương mại hoặc kinh doanh trả phí dưới mọi hình thức.
