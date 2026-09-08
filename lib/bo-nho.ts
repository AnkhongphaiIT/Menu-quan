/**
 * TRUY CẬP localStorage AN TOÀN — dùng chung cho giỏ hàng và giao diện.
 *
 * Vì sao tách riêng: Safari ở chế độ Duyệt riêng tư, và một số trình duyệt khi
 * người dùng chặn cookie, sẽ NÉM LỖI ngay cả khi chỉ mới ĐỌC thuộc tính
 * localStorage — chưa gọi getItem gì cả. Không bắt lỗi thì cả trang trắng xoá,
 * khách quét QR không thấy gì.
 *
 * Mỗi chỗ dùng localStorage mà tự viết try/catch riêng thì sớm muộn sẽ có chỗ
 * quên. Gom về đây một lần cho chắc.
 */

/** Phần localStorage mà dự án dùng tới. Tách ra để test truyền kho giả vào. */
export type KhoLuu = {
  getItem(khoa: string): string | null;
  setItem(khoa: string, giaTri: string): void;
  removeItem(khoa: string): void;
};

export function khoMacDinh(): KhoLuu | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const ls = (globalThis as { localStorage?: KhoLuu }).localStorage;
    return ls ?? null;
  } catch {
    // Một số trình duyệt ném lỗi ngay ở bước ĐỌC thuộc tính localStorage
    return null;
  }
}

/** Đọc một chuỗi. Trả về null nếu không có hoặc trình duyệt chặn. */
export function docChuoi(khoa: string, kho: KhoLuu | null): string | null {
  if (!kho) return null;
  try {
    return kho.getItem(khoa);
  } catch {
    return null;
  }
}

/**
 * Ghi một chuỗi. Thất bại thì im lặng bỏ qua.
 *
 * Không ghi được (hết dung lượng, chế độ riêng tư) thì khách vẫn dùng web
 * bình thường trong phiên này, chỉ là đóng tab thì mất. Thà vậy còn hơn sập trang.
 */
export function ghiChuoi(
  khoa: string,
  giaTri: string,
  kho: KhoLuu | null,
): void {
  if (!kho) return;
  try {
    kho.setItem(khoa, giaTri);
  } catch {
    // bỏ qua có chủ ý
  }
}

export function xoaKhoa(khoa: string, kho: KhoLuu | null): void {
  if (!kho) return;
  try {
    kho.removeItem(khoa);
  } catch {
    // bỏ qua có chủ ý
  }
}
