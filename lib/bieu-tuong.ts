/**
 * Biểu tượng đại diện cho từng danh mục.
 *
 * Dùng làm ảnh tạm khi món chưa có ảnh thật. Không phải để trang trí: lúc mới
 * nhập menu, chủ quán chưa kịp chụp ảnh 54 món, mà thẻ món trống trơn thì rất
 * xấu và khó phân biệt nhóm.
 *
 * Tra theo `slug` của danh mục. Chủ quán tự đặt slug khi tạo danh mục mới, nên
 * bảng này không thể phủ hết — có hàm dự phòng bên dưới.
 */

const THEO_SLUG: Record<string, string> = {
  "mi-nui-bun": "🍜",
  "mi-pho-mai": "🧀",
  "banh-trang": "🌯",
  "an-vat-do-chien": "🍢",
  "tra-sua": "🧋",
  "tra-trai-cay": "🍹",
  "nuoc-giai-khat": "🥤",
  "sua-chua": "🍨",
};

/**
 * Đoán biểu tượng theo từ khoá có trong slug.
 *
 * Nhờ vậy chủ quán tạo danh mục mới tên "Trà đá" (slug `tra-da`) vẫn ra được
 * biểu tượng đồ uống, không rơi về hình đĩa chung chung.
 * Thứ tự trong danh sách có ý nghĩa: từ khoá cụ thể để trước, chung chung để sau.
 */
const THEO_TU_KHOA: [string, string][] = [
  ["pho-mai", "🧀"],
  ["banh-trang", "🌯"],
  ["banh", "🥐"],
  ["mi", "🍜"],
  ["nui", "🍜"],
  ["bun", "🍜"],
  ["pho", "🍜"],
  ["com", "🍚"],
  ["lau", "🍲"],
  ["chien", "🍢"],
  ["nuong", "🍡"],
  ["tra-sua", "🧋"],
  ["tra", "🍹"],
  ["ca-phe", "☕"],
  ["cafe", "☕"],
  ["sinh-to", "🥤"],
  ["nuoc", "🥤"],
  ["soda", "🥤"],
  ["sua-chua", "🍨"],
  ["sua", "🥛"],
  ["kem", "🍦"],
  ["chè", "🍧"],
  ["che", "🍧"],
];

/** Biểu tượng dùng khi không đoán được gì. */
export const BIEU_TUONG_MAC_DINH = "🍽️";

export function bieuTuongCuaDanhMuc(slug: string): string {
  const khoa = slug.toLowerCase();

  if (THEO_SLUG[khoa]) return THEO_SLUG[khoa];

  for (const [tuKhoa, hinh] of THEO_TU_KHOA) {
    if (khoa.includes(tuKhoa)) return hinh;
  }

  return BIEU_TUONG_MAC_DINH;
}

/** Dựng sẵn bảng tra slug -> biểu tượng cho danh sách danh mục hiện có. */
export function bangBieuTuong(
  danhMuc: { slug: string }[],
): Record<string, string> {
  const bang: Record<string, string> = {};
  for (const dm of danhMuc) bang[dm.slug] = bieuTuongCuaDanhMuc(dm.slug);
  return bang;
}
