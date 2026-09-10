import { AdminShell, KhongCoQuyen } from "@/components/admin/admin-shell";
import { QuanLyMon } from "@/components/admin/quan-ly-mon";
import {
  laAdmin,
  layNguoiDangNhap,
  taoKetNoiCoDangNhap,
} from "@/lib/supabase-auth";
import type { Category, MenuItem } from "@/lib/types";

/**
 * Trang quản trị món ăn.
 *
 * Đọc cookie để biết ai đăng nhập, nên Next.js dựng lại cho từng lần xem thay
 * vì cache. Đúng mong muốn: chỉ mình chủ quán dùng, và vừa sửa xong phải thấy
 * ngay dữ liệu mới.
 */
export const dynamic = "force-dynamic";

export default async function TrangQuanTriMon() {
  const nguoiDung = await layNguoiDangNhap();
  const coQuyen = await laAdmin();

  if (!coQuyen) return <KhongCoQuyen email={nguoiDung?.email ?? null} />;

  const db = await taoKetNoiCoDangNhap();
  const [danhMuc, monAn] = await Promise.all([
    db
      .from("categories")
      .select("id, name, slug, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    db
      .from("menu_items")
      .select(
        "id, category_id, name, description, price, image_url, is_available, sort_order",
      )
      .order("sort_order", { ascending: true }),
  ]);

  const loi = danhMuc.error?.message ?? monAn.error?.message;

  return (
    <AdminShell dangO="mon">
      {loi ? (
        <p
          role="alert"
          className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
        >
          Không đọc được dữ liệu: {loi}
        </p>
      ) : (
        <QuanLyMon
          danhMuc={(danhMuc.data ?? []) as Category[]}
          monAn={(monAn.data ?? []) as MenuItem[]}
        />
      )}
    </AdminShell>
  );
}
