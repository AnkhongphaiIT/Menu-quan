/**
 * Đọc số tiền chủ quán gõ vào ô giá.
 *
 * Chủ quán hay gõ tắt "25" cho 25.000đ. Món ăn không có giá dưới 1.000đ, nên
 * số từ 1 đến 999 chắc chắn là đang gõ theo nghìn. Dấu chấm, chữ "đ", khoảng
 * trắng... đều bị bỏ qua, nên "25.000đ" hay "25 000" đều đọc được.
 *
 * Trả về null khi ô trống — ô trống nghĩa là chưa gõ gì, KHÔNG phải giá 0đ.
 */
export function docGia(chu: string): number | null {
  const chiSo = chu.replace(/\D/g, "");
  if (chiSo === "") return null;
  const n = Number(chiSo);
  if (!Number.isSafeInteger(n)) return null;
  return n > 0 && n < 1000 ? n * 1000 : n;
}
