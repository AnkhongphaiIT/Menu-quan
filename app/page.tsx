import { CartBar } from "@/components/cart-bar";
import { MenuBrowser } from "@/components/menu-browser";
import { ToastKhoiPhuc } from "@/components/toast-khoi-phuc";
import { CartProvider } from "@/lib/cart-context";
import {
  bieuTuongDanhMuc,
  mockCategories,
  mockMenuItems,
} from "@/lib/mock-data";

/**
 * Trang menu cho khách.
 *
 * Giai đoạn 3–4: dữ liệu lấy từ lib/mock-data.ts (dữ liệu giả).
 * Giai đoạn 5: sẽ thay bằng truy vấn Supabase ngay tại đây và thêm
 *              `export const revalidate = 60`. Phần giao diện bên dưới
 *              không phải sửa gì, vì mọi thành phần chỉ nhận dữ liệu qua props.
 */
export default function TrangMenu() {
  return (
    <CartProvider>
      <header className="mx-auto w-full max-w-2xl px-4 pt-6 pb-1">
        <h1 className="text-2xl font-bold text-fg">Quán ăn vặt</h1>
        <p className="mt-1 text-sm text-muted">
          Chọn món rồi gọi với nhân viên nhé
        </p>
      </header>

      <main className="flex-1">
        <MenuBrowser
          categories={mockCategories}
          items={mockMenuItems}
          bieuTuong={bieuTuongDanhMuc}
        />
      </main>

      <ToastKhoiPhuc />
      <CartBar menu={mockMenuItems} />
    </CartProvider>
  );
}
