import { AdminShell, KhongCoQuyen } from "@/components/admin/admin-shell";
import { QuanLyTuTien } from "@/components/admin/quan-ly-tu-tien";
import { COT_LUA_CHON, COT_NHOM, rapNhomTuyChon } from "@/lib/queries";
import { laAdmin, layNguoiDangNhap, taoKetNoiCoDangNhap } from "@/lib/supabase-auth";
import type { Category, MenuItem, OptionChoice, OptionGroup } from "@/lib/types";

/**
 * Tab "Tu tiên" của trang quản trị: sửa tên + mô tả tu tiên trên điện thoại.
 *
 * Chỉ ĐỌC bảng món thật (để hiện tên thật, giá bên cạnh cho dễ đối chiếu),
 * còn mọi lệnh ghi đều vào 4 bảng tu_tien_* — xem app/admin/tu-tien/actions.ts.
 */
export const dynamic = "force-dynamic";

export default async function TrangQuanTriTuTien() {
  const nguoiDung = await layNguoiDangNhap();
  const coQuyen = await laAdmin();
  if (!coQuyen) return <KhongCoQuyen email={nguoiDung?.email ?? null} />;

  const db = await taoKetNoiCoDangNhap();
  const [danhMuc, monAn, nhom, luaChon, ttDm, ttMon, ttNhom, ttLc] = await Promise.all([
    db.from("categories").select("id, name, slug, sort_order, is_active").order("sort_order"),
    db
      .from("menu_items")
      .select("id, category_id, name, description, price, image_url, is_available, sort_order")
      .order("sort_order"),
    db.from("option_groups").select(COT_NHOM),
    db.from("option_choices").select(COT_LUA_CHON),
    db.from("tu_tien_danh_muc").select("category_id, ten"),
    db.from("tu_tien_mon").select("menu_item_id, ten, mo_ta"),
    db.from("tu_tien_nhom").select("group_id, ten"),
    db.from("tu_tien_lua_chon").select("choice_id, ten"),
  ]);

  const loi = [danhMuc, monAn, nhom, luaChon, ttDm, ttMon, ttNhom, ttLc].find(
    (r) => r.error,
  )?.error?.message;

  return (
    <AdminShell dangO="tu-tien">
      {loi ? (
        <p role="alert" className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg">
          Không đọc được dữ liệu: {loi}
        </p>
      ) : (
        <QuanLyTuTien
          danhMuc={(danhMuc.data ?? []) as Category[]}
          monAn={(monAn.data ?? []) as MenuItem[]}
          nhomTheoMon={rapNhomTuyChon(
            (nhom.data ?? []) as Omit<OptionGroup, "choices">[],
            (luaChon.data ?? []) as OptionChoice[],
          )}
          ttDanhMuc={Object.fromEntries((ttDm.data ?? []).map((r) => [r.category_id, r.ten]))}
          ttMon={Object.fromEntries(
            (ttMon.data ?? []).map((r) => [r.menu_item_id, { ten: r.ten, moTa: r.mo_ta }]),
          )}
          ttNhom={Object.fromEntries((ttNhom.data ?? []).map((r) => [r.group_id, r.ten]))}
          ttLuaChon={Object.fromEntries((ttLc.data ?? []).map((r) => [r.choice_id, r.ten]))}
        />
      )}
    </AdminShell>
  );
}
