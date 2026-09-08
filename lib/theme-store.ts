/**
 * KHO CHẾ ĐỘ SÁNG/TỐI — cầu nối giữa lib/theme.ts và React.
 *
 * Cùng khuôn với lib/cart-store.ts: React hỏi kho này qua useSyncExternalStore,
 * không dùng useEffect + setState (quy tắc react-hooks/set-state-in-effect cấm,
 * và cách đó còn làm trang nháy một nhịp lúc đổi màu).
 */

import * as GiaoDien from "./theme";
import type { CheDo } from "./theme";

let cheDoHienTai: CheDo | null = null;
const nguoiNghe = new Set<() => void>();

/**
 * Đọc bộ nhớ lần đầu.
 *
 * Lưu ý: đoạn script nhỏ trong app/layout.tsx đã gắn data-theme vào thẻ <html>
 * TRƯỚC khi trang vẽ ra, để không bị nháy trắng rồi mới chuyển đen. Hàm này chỉ
 * đọc lại đúng giá trị đó cho React biết, không vẽ lại gì thêm.
 */
function khoiTao(): CheDo {
  return GiaoDien.docTuBoNho(Date.now()) ?? GiaoDien.CHE_DO_MAC_DINH;
}

export function layCheDo(): CheDo {
  if (cheDoHienTai === null) cheDoHienTai = khoiTao();
  return cheDoHienTai;
}

/**
 * Lúc dựng trang trên máy chủ luôn trả về chế độ sáng.
 *
 * Máy chủ không có localStorage, và mặc định của quán là nền trắng — nên HTML
 * máy chủ gửi đi luôn là bản sáng. Máy khách sẽ tự chỉnh lại nếu khách đã chọn
 * nền đen, việc đó do đoạn script trong layout làm trước khi trang kịp hiện.
 */
export function layCheDoMayChu(): CheDo {
  return GiaoDien.CHE_DO_MAC_DINH;
}

export function dangKy(bao: () => void): () => void {
  nguoiNghe.add(bao);
  return () => {
    nguoiNghe.delete(bao);
  };
}

export function datCheDo(moi: CheDo): void {
  cheDoHienTai = moi;
  GiaoDien.apVaoTrang(moi);
  GiaoDien.ghiVaoBoNho(moi, Date.now());
  for (const bao of nguoiNghe) bao();
}

export function doiCheDo(): void {
  datCheDo(layCheDo() === "toi" ? "sang" : "toi");
}

/** Chỉ dùng trong test. */
export function datLaiChoTest(): void {
  cheDoHienTai = null;
  nguoiNghe.clear();
}
