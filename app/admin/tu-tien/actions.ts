"use server";

import { refresh, revalidatePath } from "next/cache";
import { taoKetNoiCoDangNhap } from "@/lib/supabase-auth";

/**
 * LỆNH LƯU CỦA TAB "TU TIÊN" — file riêng, không đụng app/admin/actions.ts.
 *
 * Chỉ ghi vào 4 bảng tu_tien_*. Không bao giờ ghi vào bảng món thật.
 * Bảo vệ thật nằm ở database (RLS): chỉ email trong admin_allowlist ghi được.
 *
 * Ô tên để trống = xoá dòng tu tiên = trang tu tiên quay về hiện tên thật.
 */

export type KetQuaTuTien = { ok: true } | { ok: false; loi: string };

const BANG = {
  "danh-muc": { ten: "tu_tien_danh_muc", khoa: "category_id" },
  mon: { ten: "tu_tien_mon", khoa: "menu_item_id" },
  nhom: { ten: "tu_tien_nhom", khoa: "group_id" },
  "lua-chon": { ten: "tu_tien_lua_chon", khoa: "choice_id" },
} as const;

export type LoaiTuTien = keyof typeof BANG;

const KHONG_LUU_DUOC =
  "Chưa lưu được. Có thể phiên đăng nhập đã hết — tải lại trang, đăng nhập lại rồi thử lại.";

export async function luuTuTien(
  loai: LoaiTuTien,
  id: string,
  ten: string,
  moTa?: string,
): Promise<KetQuaTuTien> {
  const bang = BANG[loai];
  if (!bang) return { ok: false, loi: "Loại dữ liệu không hợp lệ." };
  if (ten.length > 80) return { ok: false, loi: "Tên dài quá, tối đa 80 ký tự." };
  if ((moTa ?? "").length > 300) {
    return { ok: false, loi: "Mô tả dài quá, tối đa 300 ký tự." };
  }

  const db = await taoKetNoiCoDangNhap();
  const tenGon = ten.trim();

  if (!tenGon) {
    const { error } = await db.from(bang.ten).delete().eq(bang.khoa, id);
    if (error) return { ok: false, loi: `Không lưu được: ${error.message}` };
  } else {
    const dong: Record<string, string | null> = {
      [bang.khoa]: id,
      ten: tenGon,
      updated_at: new Date().toISOString(),
    };
    if (loai === "mon") dong.mo_ta = moTa?.trim() || null;

    const { data, error } = await db
      .from(bang.ten)
      .upsert(dong, { onConflict: bang.khoa })
      .select(bang.khoa);

    if (error) {
      const t = error.message.toLowerCase();
      if (t.includes("row-level security") || t.includes("permission denied")) {
        return { ok: false, loi: KHONG_LUU_DUOC };
      }
      return { ok: false, loi: `Không lưu được: ${error.message}` };
    }
    /* RLS chặn thì có khi không báo lỗi mà chỉ trả về 0 dòng. */
    if (!data?.length) return { ok: false, loi: KHONG_LUU_DUOC };
  }

  revalidatePath("/tu-tien");
  refresh();
  return { ok: true };
}
