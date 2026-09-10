import type { Metadata } from "next";

/**
 * Khung chung cho mọi trang quản trị.
 *
 * Việc quan trọng nhất ở đây là chặn Google lập chỉ mục (yêu cầu F5).
 * Không có phần này thì gõ "menu quán ăn vặt admin" trên Google có thể ra
 * thẳng màn hình đăng nhập của bạn. Nó không làm người ta vào được — Row
 * Level Security vẫn chặn — nhưng không có lý do gì phải mời họ tới cửa.
 */
export const metadata: Metadata = {
  title: "Quản trị menu",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

/* LayoutProps<"/admin"> là kiểu do Next.js 16 tự sinh theo cấu trúc thư mục.
   Tự khai báo kiểu bằng tay sẽ không khớp với bộ kiểm tra của Next và báo lỗi. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <>{children}</>;
}
