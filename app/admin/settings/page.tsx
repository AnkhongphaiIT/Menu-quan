import { AdminShell, KhongCoQuyen } from "@/components/admin/admin-shell";
import { FormThongTinQuan } from "@/components/admin/form-thong-tin-quan";
import {
  laAdmin,
  layNguoiDangNhap,
  taoKetNoiCoDangNhap,
} from "@/lib/supabase-auth";
import type { ShopSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrangThongTinQuan() {
  const nguoiDung = await layNguoiDangNhap();
  const coQuyen = await laAdmin();

  if (!coQuyen) return <KhongCoQuyen email={nguoiDung?.email ?? null} />;

  const db = await taoKetNoiCoDangNhap();
  const { data, error } = await db
    .from("shop_settings")
    .select(
      "id, shop_name, address, phone, open_hours, facebook_url, instagram_url, tiktok_url, zalo_url, map_url",
    )
    .eq("id", 1)
    .maybeSingle();

  return (
    <AdminShell dangO="thong-tin">
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Những thông tin này hiện ở chân trang menu. Ô nào để trống thì tự ẩn đi,
        không hiện chỗ trống.
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
        >
          Không đọc được thông tin quán: {error.message}
        </p>
      ) : (
        <FormThongTinQuan quan={(data ?? null) as ShopSettings | null} />
      )}

      <p className="mt-8 text-sm text-muted">
        Đang đăng nhập: <strong className="text-fg">{nguoiDung?.email}</strong>
      </p>
    </AdminShell>
  );
}
