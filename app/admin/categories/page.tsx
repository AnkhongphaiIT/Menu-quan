import { AdminShell, KhongCoQuyen } from "@/components/admin/admin-shell";
import { QuanLyDanhMuc } from "@/components/admin/quan-ly-danh-muc";
import {
  laAdmin,
  layNguoiDangNhap,
  taoKetNoiCoDangNhap,
} from "@/lib/supabase-auth";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrangDanhMuc() {
  const nguoiDung = await layNguoiDangNhap();
  const coQuyen = await laAdmin();

  if (!coQuyen) return <KhongCoQuyen email={nguoiDung?.email ?? null} />;

  const db = await taoKetNoiCoDangNhap();
  const [danhMuc, monAn] = await Promise.all([
    db
      .from("categories")
      .select("id, name, slug, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    db.from("menu_items").select("category_id"),
  ]);

  /* Đếm số món của từng danh mục để hiện ngay trên dòng — chủ quán biết được
     danh mục nào còn món trước khi bấm xoá. */
  const soMonTheoDanhMuc: Record<string, number> = {};
  for (const m of monAn.data ?? []) {
    const id = (m as { category_id: string }).category_id;
    soMonTheoDanhMuc[id] = (soMonTheoDanhMuc[id] ?? 0) + 1;
  }

  return (
    <AdminShell dangO="danh-muc">
      {danhMuc.error ? (
        <p
          role="alert"
          className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
        >
          Không đọc được danh mục: {danhMuc.error.message}
        </p>
      ) : (
        <QuanLyDanhMuc
          danhMuc={(danhMuc.data ?? []) as Category[]}
          soMonTheoDanhMuc={soMonTheoDanhMuc}
        />
      )}
    </AdminShell>
  );
}
