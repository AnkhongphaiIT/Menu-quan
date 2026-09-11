import { docChuoi, ghiChuoi, xoaKhoa, type KhoLuu } from "../bo-nho";

/**
 * NHỚ KHÁCH ĐANG BẬT CHẾ ĐỘ TU TIÊN — 60 phút, giống nút sáng/tối và giỏ hàng.
 *
 * Mã QR luôn trỏ về trang thường. Khách đã bật tu tiên mà lỡ thoát ra, quét
 * lại QR trong 60 phút thì trang thường tự chuyển sang /tu-tien. Quá 60 phút
 * thì về mặc định là menu thường.
 *
 * Mọi hàm nhận thời điểm "bây giờ" và kho lưu từ ngoài vào, để kiểm thử được.
 */

export const KHOA_TU_TIEN = "menu-quan:tu-tien:v1";
export const HAN_TU_TIEN_MS = 60 * 60 * 1000;

export function dangBatTuTien(kho: KhoLuu | null, bayGio: number): boolean {
  const chu = docChuoi(KHOA_TU_TIEN, kho);
  if (!chu) return false;
  try {
    const luu = JSON.parse(chu) as { hetHanLuc?: unknown };
    if (typeof luu.hetHanLuc === "number" && luu.hetHanLuc > bayGio) {
      return true;
    }
  } catch {
    // dữ liệu hỏng thì coi như chưa bật
  }
  xoaKhoa(KHOA_TU_TIEN, kho);
  return false;
}

/** Bật, hoặc gia hạn thêm 60 phút nếu đang bật. */
export function batTuTien(kho: KhoLuu | null, bayGio: number): void {
  ghiChuoi(
    KHOA_TU_TIEN,
    JSON.stringify({ hetHanLuc: bayGio + HAN_TU_TIEN_MS }),
    kho,
  );
}

export function tatTuTien(kho: KhoLuu | null): void {
  xoaKhoa(KHOA_TU_TIEN, kho);
}
