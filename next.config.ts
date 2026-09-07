import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cho phép mở trang bằng địa chỉ IP trong mạng nội bộ khi đang chạy `npm run dev`.
   *
   * Vì sao cần: ở chế độ phát triển, Next.js chỉ phục vụ các tệp JavaScript của nó
   * cho `localhost`. Điện thoại vào bằng `http://192.168.1.10:3000` sẽ bị chặn ở
   * bước tải JavaScript — HTML vẫn hiện đủ món nên nhìn qua tưởng chạy tốt, nhưng
   * mọi nút đều chết: bấm danh mục không nhảy, gõ ô tìm kiếm không lọc.
   * Nhật ký máy chủ khi đó báo "Blocked cross-origin request to Next.js dev resource".
   *
   * ⚠️ Chỉ có tác dụng khi chạy `npm run dev`. Bản chạy thật trên Vercel không dùng
   * tới thiết lập này, nên để đây không ảnh hưởng gì tới bảo mật của trang thật.
   *
   * Nếu đổi wifi khác, địa chỉ IP máy tính sẽ đổi theo. Xem IP mới bằng lệnh
   * `ipconfig` (dòng IPv4 Address) rồi thêm vào danh sách dưới đây.
   */
  allowedDevOrigins: ["192.168.1.10"],
};

export default nextConfig;
