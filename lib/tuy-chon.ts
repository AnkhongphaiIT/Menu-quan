/**
 * TUỲ CHỌN CỦA MÓN (loại mì, topping, loại sợi...) — thuần TypeScript.
 *
 * Cùng nguyên tắc với lib/cart.ts: không React, hàm thuần, dễ test. Máy chủ
 * (đặt món online sau này) và trình duyệt dùng chung đúng một cách tính giá.
 *
 * CÁCH TÍNH GIÁ:
 *   giá = giá gốc của món
 *       + tổng (price_delta × số phần) của mọi lựa chọn
 *       + với mỗi nhóm: max(0, tổng số phần − số phần đã gồm) × giá mỗi phần thêm
 *
 * Ví dụ Mì trộn (giá gốc 20.000đ, nhóm Topping gồm sẵn 1 phần, thêm +5.000đ):
 *   Mì phô mai + Gà chua ngọt                  = 20.000đ
 *   Mì phô mai + Gà chua ngọt ×2               = 25.000đ   (đã gà thêm gà)
 *   Mì phô mai + Gà chua ngọt + Trứng xúc xích = 25.000đ
 */

import type { OptionChoice, OptionGroup } from "./types";

/** Mã lựa chọn -> số phần. Lựa chọn không có mặt hoặc bằng 0 là không chọn. */
export type LuaChon = Record<string, number>;

/** Bỏ các lựa chọn 0 phần hoặc số không hợp lệ. */
export function chuanHoa(luaChon: LuaChon | undefined | null): LuaChon {
  const ra: LuaChon = {};
  if (!luaChon) return ra;
  for (const [id, sl] of Object.entries(luaChon)) {
    if (Number.isInteger(sl) && sl > 0) ra[id] = sl;
  }
  return ra;
}

/**
 * Chuỗi đại diện cho một cấu hình, dùng để gộp dòng trong giỏ hàng.
 * Hai lần thêm "Mì phô mai + Gà" là cùng một dòng (cộng số lượng), còn
 * "Mì phô mai + Gà" và "Mì tương đen + Gà" là hai dòng khác nhau.
 */
export function khoaCauHinh(luaChon: LuaChon | undefined | null): string {
  return Object.entries(chuanHoa(luaChon))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, sl]) => `${id}:${sl}`)
    .join(",");
}

export function tongPhanTrongNhom(nhom: OptionGroup, luaChon: LuaChon): number {
  return nhom.choices.reduce((t, c) => t + (luaChon[c.id] ?? 0), 0);
}

/** Tìm một lựa chọn theo mã, trong mọi nhóm của món. */
function timLuaChon(
  cacNhom: OptionGroup[],
  id: string,
): { nhom: OptionGroup; lua: OptionChoice } | null {
  for (const nhom of cacNhom) {
    const lua = nhom.choices.find((c) => c.id === id);
    if (lua) return { nhom, lua };
  }
  return null;
}

/* ==========================================================================
   GIÁ
   ========================================================================== */

export function giaCauHinh(
  giaGoc: number,
  cacNhom: OptionGroup[],
  luaChonVao: LuaChon,
): number {
  const luaChon = chuanHoa(luaChonVao);
  let gia = giaGoc;

  for (const nhom of cacNhom) {
    let tong = 0;
    for (const c of nhom.choices) {
      const sl = luaChon[c.id] ?? 0;
      tong += sl;
      gia += c.price_delta * sl;
    }
    gia += Math.max(0, tong - nhom.included_qty) * nhom.extra_unit_price;
  }

  return gia;
}

/**
 * Giá thấp nhất khách có thể trả — dùng để hiện "từ 20.000đ" trên thẻ món.
 * Tính theo lựa chọn rẻ nhất còn hàng ở mỗi nhóm bắt buộc.
 */
export function giaThapNhat(giaGoc: number, cacNhom: OptionGroup[]): number {
  let gia = giaGoc;
  for (const nhom of cacNhom) {
    if (nhom.min_qty <= 0) continue;
    const conHang = nhom.choices.filter((c) => c.is_available);
    const reNhat = conHang.length
      ? Math.min(...conHang.map((c) => c.price_delta))
      : 0;
    gia += reNhat * nhom.min_qty;
    gia += Math.max(0, nhom.min_qty - nhom.included_qty) * nhom.extra_unit_price;
  }
  return gia;
}

/* ==========================================================================
   LUẬT "CHỈ ĐI VỚI"
   ========================================================================== */

/**
 * Vì sao lựa chọn này đang bị khoá, hoặc null nếu chọn được.
 *
 * Hai trường hợp, ví dụ với luật "Cá viên sốt mắm tỏi chỉ đi với Mì trộn thường":
 *   - Đã chọn Mì phô mai  -> Cá viên mắm tỏi bị khoá: "Chỉ đi với Mì trộn thường"
 *   - Đã chọn Cá viên mắm tỏi -> Mì phô mai bị khoá: "Không đi với Cá viên sốt mắm tỏi"
 */
export function lyDoBiKhoa(
  lua: OptionChoice,
  cacNhom: OptionGroup[],
  luaChonVao: LuaChon,
): string | null {
  const luaChon = chuanHoa(luaChonVao);

  if (!lua.is_available) return "Tạm hết";

  // (1) Lựa chọn này đòi một lựa chọn khác, mà nhóm kia đã chọn thứ khác
  if (lua.requires_choice_id) {
    const can = timLuaChon(cacNhom, lua.requires_choice_id);
    if (can) {
      const nhomKiaDaChonKhac = can.nhom.choices.some(
        (c) => c.id !== can.lua.id && (luaChon[c.id] ?? 0) > 0,
      );
      if (nhomKiaDaChonKhac) return `Chỉ đi với ${can.lua.name}`;
    }
  }

  // (2) Một lựa chọn đang được chọn đòi thứ khác trong CÙNG nhóm với lựa chọn này
  for (const [id, sl] of Object.entries(luaChon)) {
    if (sl <= 0 || id === lua.id) continue;
    const dangChon = timLuaChon(cacNhom, id);
    const canId = dangChon?.lua.requires_choice_id;
    if (!dangChon || !canId || canId === lua.id) continue;
    const can = timLuaChon(cacNhom, canId);
    if (can && can.nhom.choices.some((c) => c.id === lua.id)) {
      return `Không đi với ${dangChon.lua.name}`;
    }
  }

  return null;
}

/* ==========================================================================
   KIỂM TRA CẤU HÌNH TRƯỚC KHI THÊM VÀO GIỎ
   ========================================================================== */

/** Danh sách lỗi của cấu hình; mảng rỗng nghĩa là hợp lệ. */
export function kiemTraCauHinh(
  cacNhom: OptionGroup[],
  luaChonVao: LuaChon,
): string[] {
  const luaChon = chuanHoa(luaChonVao);
  const loi: string[] = [];

  // Mã lựa chọn không thuộc món này (dữ liệu cũ, hoặc bị sửa tay)
  for (const id of Object.keys(luaChon)) {
    if (!timLuaChon(cacNhom, id)) loi.push("Có lựa chọn không còn tồn tại.");
  }

  for (const nhom of cacNhom) {
    const tong = tongPhanTrongNhom(nhom, luaChon);

    if (nhom.kind === "mot" && tong > 1) {
      loi.push(`Chỉ được chọn 1 ${nhom.name.toLowerCase()}.`);
    }
    if (tong < nhom.min_qty) {
      loi.push(
        nhom.kind === "mot" || nhom.min_qty === 1
          ? `Chọn ${nhom.name.toLowerCase()}.`
          : `Chọn ít nhất ${nhom.min_qty} ${nhom.name.toLowerCase()}.`,
      );
    }

    for (const c of nhom.choices) {
      const sl = luaChon[c.id] ?? 0;
      if (sl <= 0) continue;
      if (sl > nhom.max_qty_per_choice) {
        loi.push(`${c.name}: tối đa ${nhom.max_qty_per_choice} phần.`);
      }
      const khoa = lyDoBiKhoa(c, cacNhom, luaChon);
      if (khoa) loi.push(`${c.name}: ${khoa.toLowerCase()}.`);
    }
  }

  return [...new Set(loi)];
}

/* ==========================================================================
   MÔ TẢ ĐỂ HIỆN TRONG GIỎ HÀNG
   ========================================================================== */

/** "Mì phô mai · Gà sốt chua ngọt ×2, Trứng xúc xích" */
export function moTaCauHinh(cacNhom: OptionGroup[], luaChonVao: LuaChon): string {
  const luaChon = chuanHoa(luaChonVao);
  const cacPhan: string[] = [];

  for (const nhom of [...cacNhom].sort((a, b) => a.sort_order - b.sort_order)) {
    const chon = [...nhom.choices]
      .sort((a, b) => a.sort_order - b.sort_order)
      .filter((c) => (luaChon[c.id] ?? 0) > 0)
      .map((c) => (luaChon[c.id] > 1 ? `${c.name} ×${luaChon[c.id]}` : c.name));
    if (chon.length) cacPhan.push(chon.join(", "));
  }

  return cacPhan.join(" · ");
}
