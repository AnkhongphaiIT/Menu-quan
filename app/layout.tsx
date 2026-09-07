import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

/**
 * Phông chữ: Be Vietnam Pro.
 *
 * create-next-app cài sẵn phông Geist, nhưng Geist chỉ có bộ ký tự "latin" —
 * KHÔNG có dấu tiếng Việt. Chữ "Trà sữa khoai môn" sẽ bị rơi về phông dự phòng
 * của máy, mỗi điện thoại hiện một kiểu. Be Vietnam Pro được thiết kế riêng cho
 * tiếng Việt nên dấu nằm đúng chỗ, chữ đều và dễ đọc.
 *
 * next/font tải phông về máy chủ của mình rồi phục vụ cùng trang, không gọi
 * sang Google lúc khách mở web — nhanh hơn và không lộ IP khách cho bên thứ ba.
 * Chỉ lấy 3 độ đậm để file phông nhẹ (yêu cầu F4: mở trang dưới 2 giây trên 4G).
 */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Menu quán",
  description: "Menu quán ăn vặt — quét mã QR để xem món và tạm tính tiền.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Không khoá phóng to: khách lớn tuổi cần phóng to chữ để đọc.
     Khoá zoom là lỗi tiếp cận rất hay gặp trên web menu. */
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffcf7" },
    { media: "(prefers-color-scheme: dark)", color: "#17140f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      /* Next 16 không còn tự ghi đè scroll-behavior khi chuyển trang.
         Thuộc tính này bảo Next tạm tắt cuộn mượt lúc chuyển trang (để trang
         mới hiện ngay từ đầu), nhưng vẫn giữ cuộn mượt khi bấm vào danh mục
         trong cùng một trang. */
      data-scroll-behavior="smooth"
      className={`${beVietnam.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
