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

  images: {
    /**
     * Cho phép next/image tải ảnh món từ kho ảnh Supabase.
     *
     * Không khai báo ở đây thì mọi ảnh món đều lỗi, dù đã tải lên thành công.
     *
     * Dùng `remotePatterns` chứ KHÔNG dùng `images.domains` — Next.js 16 đã bỏ
     * `domains`. Xem PHẦN H trong quy-trinh-menu-qr.md.
     *
     * Dùng dấu sao thay cho mã project (`**.supabase.co`) để nếu sau này đổi
     * sang project Supabase khác thì không phải sửa lại file này. Đường dẫn cũng
     * bó hẹp đúng thư mục kho ảnh công khai, không mở toàn bộ tên miền.
     */
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
