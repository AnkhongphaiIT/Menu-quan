/**
 * CHẾ ĐỘ SÁNG / TỐI — thuần TypeScript, không phụ thuộc React.
 *
 * Quy tắc do chủ quán đặt ra:
 *   - Mặc định LUÔN là nền trắng (chế độ sáng), bất kể điện thoại khách đang
 *     để chế độ tối hay không. Menu quán phải trông giống nhau với mọi khách.
 *   - Khách bấm nút chuyển sang nền đen thì lựa chọn đó được nhớ 60 phút,
 *     giống hệt cách nhớ giỏ hàng.
 *
 * Vì sao 60 phút chứ không nhớ mãi:
 * Đây là điện thoại của khách, nhưng một cái bàn thì phục vụ nhiều lượt khách
 * trong ngày. Hết 60 phút không dùng thì trả về mặc định trắng, để lượt khách
 * sau luôn thấy menu ở trạng thái chuẩn. Cũng khớp với vòng đời giỏ hàng.
 */

import {
  docChuoi,
  ghiChuoi,
  khoMacDinh,
  xoaKhoa,
  type KhoLuu,
} from "./bo-nho";

export type CheDo = "sang" | "toi";

/** Mặc định khi chưa từng chọn, hoặc lựa chọn cũ đã hết hạn. */
export const CHE_DO_MAC_DINH: CheDo = "sang";

/** Nhớ đúng 60 phút, bằng với giỏ hàng. */
export const HAN_GIAO_DIEN_MS = 60 * 60 * 1000;

export const KHOA_GIAO_DIEN = "menu-quan:giao-dien:v1";

export type LuuGiaoDien = {
  cheDo: CheDo;
  hetHanLuc: number;
};

export function conHan(luu: LuuGiaoDien, bayGio: number): boolean {
  return luu.hetHanLuc > bayGio;
}

function hopLe(x: unknown): x is LuuGiaoDien {
  if (typeof x !== "object" || x === null) return false;
  const l = x as Record<string, unknown>;
  return (
    (l.cheDo === "sang" || l.cheDo === "toi") &&
    typeof l.hetHanLuc === "number" &&
    Number.isFinite(l.hetHanLuc)
  );
}

/**
 * Đọc chế độ đã lưu.
 *
 * Trả về null khi: chưa từng chọn, dữ liệu hỏng, đã hết hạn, hoặc trình duyệt
 * chặn localStorage. Bên gọi tự hiểu null nghĩa là dùng mặc định (sáng).
 */
export function docTuBoNho(
  bayGio: number,
  kho: KhoLuu | null = khoMacDinh(),
): CheDo | null {
  const tho = docChuoi(KHOA_GIAO_DIEN, kho);
  if (!tho) return null;

  let luu: unknown;
  try {
    luu = JSON.parse(tho);
  } catch {
    xoaBoNho(kho);
    return null;
  }

  if (!hopLe(luu) || !conHan(luu, bayGio)) {
    xoaBoNho(kho);
    return null;
  }

  return luu.cheDo;
}

/** Ghi lựa chọn, hạn 60 phút kể từ bây giờ. */
export function ghiVaoBoNho(
  cheDo: CheDo,
  bayGio: number,
  kho: KhoLuu | null = khoMacDinh(),
): void {
  const luu: LuuGiaoDien = {
    cheDo,
    hetHanLuc: bayGio + HAN_GIAO_DIEN_MS,
  };
  ghiChuoi(KHOA_GIAO_DIEN, JSON.stringify(luu), kho);
}

export function xoaBoNho(kho: KhoLuu | null = khoMacDinh()): void {
  xoaKhoa(KHOA_GIAO_DIEN, kho);
}

/* ==========================================================================
   ÁP CHẾ ĐỘ VÀO TRANG
   ========================================================================== */

/** Màu thanh địa chỉ trình duyệt, khớp với nền trang. */
const MAU_THANH_DIA_CHI: Record<CheDo, string> = {
  sang: "#fffcf7",
  toi: "#17140f",
};

/**
 * Gắn chế độ vào thẻ <html>.
 *
 * Toàn bộ bảng màu trong globals.css nghe theo thuộc tính data-theme này.
 * Cũng đổi luôn màu thanh địa chỉ của trình duyệt cho khớp — không đổi thì
 * chuyển sang nền đen mà thanh trên cùng vẫn trắng, nhìn rất chỏi.
 */
export function apVaoTrang(cheDo: CheDo): void {
  if (typeof document === "undefined") return;

  const goc = document.documentElement;
  if (cheDo === "toi") {
    goc.dataset.theme = "dark";
  } else {
    delete goc.dataset.theme;
  }

  const the = document.querySelector('meta[name="theme-color"]');
  if (the) the.setAttribute("content", MAU_THANH_DIA_CHI[cheDo]);
}
