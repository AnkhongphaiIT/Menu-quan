/**
 * Các hàm tiện ích nhỏ, thuần TypeScript, không phụ thuộc React.
 * Giai đoạn 4 (giỏ hàng) và Giai đoạn 5 (Supabase) đều dùng lại được.
 */

/** Dải ký tự dấu thanh tổ hợp trong Unicode (huyền, sắc, hỏi, ngã, nặng...).
 *  Dựng bằng String.fromCharCode thay vì gõ thẳng vào regex, vì dấu thanh tổ hợp
 *  là ký tự VÔ HÌNH: gõ thẳng thì trong trình soạn thảo trông như ô trống,
 *  rất dễ bị xoá nhầm hoặc bị công cụ khác làm hỏng mà không ai nhìn ra. */
const DAU_THANH = new RegExp(
  `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
  "g",
);

/**
 * Định dạng giá tiền theo kiểu Việt Nam: 25000 -> "25.000đ"
 *
 * Dùng dấu chấm ngăn cách hàng nghìn (đúng chuẩn vi-VN), không phải dấu phẩy.
 * Không dùng Intl.NumberFormat với style "currency" vì nó cho ra "25.000 ₫"
 * kèm khoảng trắng và ký hiệu ₫ — trên menu quán thì "25.000đ" quen mắt hơn.
 */
export function formatPrice(dong: number): string {
  return `${new Intl.NumberFormat("vi-VN").format(dong)}đ`;
}

/**
 * Bỏ dấu tiếng Việt và chuyển về chữ thường, để tìm kiếm dễ hơn.
 *
 *   "Trà sữa khoai môn"  ->  "tra sua khoai mon"
 *   "Bánh Tráng Trộn"    ->  "banh trang tron"
 *
 * Nhờ vậy khách gõ "tra sua" (không dấu, gõ nhanh trên điện thoại) vẫn tìm ra
 * "Trà sữa". Chi tiết nhỏ nhưng khách Việt gõ không dấu rất nhiều.
 *
 * Cách hoạt động:
 *   - normalize("NFD") tách chữ cái và dấu thanh thành 2 ký tự riêng
 *   - xoá toàn bộ dấu thanh vừa tách ra
 *   - đ/Đ không tách được bằng NFD nên phải thay tay
 */
export function boDau(text: string): string {
  return text
    .normalize("NFD")
    .replace(DAU_THANH, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/**
 * Kiểm tra `text` có khớp với `tuKhoa` không.
 *
 * Bỏ qua dấu, bỏ qua hoa/thường, và tách từ khoá thành từng chữ rời —
 * khớp khi CÓ ĐỦ mọi chữ, không cần đúng thứ tự, không cần liền nhau:
 *
 *   "dau sua"      -> khớp "Sữa chua dâu"       (đảo thứ tự vẫn ra)
 *   "mi ga"        -> khớp "Mì trộn gà sốt phô mai"
 *   "tra"          -> khớp mọi món có chữ "trà"
 *
 * Nhờ vậy khách gõ tới đâu danh sách lọc tới đó, gõ thiếu chữ giữa cũng ra.
 * Nếu chỉ dùng includes() nguyên chuỗi thì "dau sua" sẽ không ra món nào.
 */
export function khopTimKiem(text: string, tuKhoa: string): boolean {
  const noiDung = boDau(text);
  const cacChu = boDau(tuKhoa).split(/\s+/).filter(Boolean);
  if (cacChu.length === 0) return true;
  return cacChu.every((chu) => noiDung.includes(chu));
}
