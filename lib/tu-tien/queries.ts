import { cache } from "react";
import { daCauHinhSupabase, taoKetNoi } from "../supabase";
import { BANG_RONG, type BangTuTien } from "./du-lieu";

/**
 * Đọc 4 bảng chữ tu tiên.
 *
 * KHÔNG BAO GIỜ ném lỗi ra ngoài: bảng tu tiên trục trặc (chưa tạo, mạng
 * chập chờn...) thì trả về bảng rỗng, trang tu tiên sẽ hiện tên thật. Khách
 * vẫn xem được menu và gọi món bình thường. Trang thường không gọi hàm này.
 */
async function docBangTuTien(): Promise<BangTuTien> {
  if (!daCauHinhSupabase()) return BANG_RONG;

  try {
    const db = taoKetNoi();
    const [dm, mon, nhom, lc] = await Promise.all([
      db.from("tu_tien_danh_muc").select("category_id, ten"),
      db.from("tu_tien_mon").select("menu_item_id, ten, mo_ta"),
      db.from("tu_tien_nhom").select("group_id, ten"),
      db.from("tu_tien_lua_chon").select("choice_id, ten"),
    ]);

    const loi = dm.error ?? mon.error ?? nhom.error ?? lc.error;
    if (loi) {
      console.error("[tu-tien] Không đọc được chữ tu tiên:", loi.message);
      return BANG_RONG;
    }

    const bang: BangTuTien = { danhMuc: {}, mon: {}, nhom: {}, luaChon: {} };
    for (const r of dm.data ?? []) bang.danhMuc[r.category_id] = r.ten;
    for (const r of mon.data ?? []) {
      bang.mon[r.menu_item_id] = { ten: r.ten, moTa: r.mo_ta };
    }
    for (const r of nhom.data ?? []) bang.nhom[r.group_id] = r.ten;
    for (const r of lc.data ?? []) bang.luaChon[r.choice_id] = r.ten;
    return bang;
  } catch (e) {
    console.error(
      "[tu-tien] Lỗi kết nối:",
      e instanceof Error ? e.message : String(e),
    );
    return BANG_RONG;
  }
}

/** Dùng chung một lần đọc cho phần tiêu đề và thân trang. */
export const layBangTuTien = cache(docBangTuTien);
