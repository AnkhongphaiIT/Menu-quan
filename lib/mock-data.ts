/**
 * DỮ LIỆU GIẢ — chỉ dùng cho Giai đoạn 3 để dựng và kiểm tra giao diện.
 *
 * ⚠️ TỚI GIAI ĐOẠN 5 FILE NÀY SẼ BỊ XOÁ, thay bằng dữ liệu thật đọc từ Supabase.
 * Đừng thêm logic gì vào đây — nó chỉ là dữ liệu tĩnh.
 *
 * Danh sách món lấy đúng theo Phần B của quy-trinh-menu-qr.md: 8 danh mục, 54 món.
 * Giá tạm để 25000đ cho mọi món (bảng giá thật sẽ nhập ở trang admin, Giai đoạn 6).
 */

import type { Category, MenuItem } from "./types";

/** Giá tạm dùng chung cho mọi món ở giai đoạn dựng giao diện. */
const GIA_TAM = 25000;

export const mockCategories: Category[] = [
  { id: "cat-1", name: "Mì – Nui – Bún", slug: "mi-nui-bun", sort_order: 1, is_active: true },
  { id: "cat-2", name: "Mì phô mai", slug: "mi-pho-mai", sort_order: 2, is_active: true },
  { id: "cat-3", name: "Bánh tráng", slug: "banh-trang", sort_order: 3, is_active: true },
  { id: "cat-4", name: "Ăn vặt – Đồ chiên", slug: "an-vat-do-chien", sort_order: 4, is_active: true },
  { id: "cat-5", name: "Trà sữa", slug: "tra-sua", sort_order: 5, is_active: true },
  { id: "cat-6", name: "Trà trái cây", slug: "tra-trai-cay", sort_order: 6, is_active: true },
  { id: "cat-7", name: "Nước giải khát khác", slug: "nuoc-giai-khat", sort_order: 7, is_active: true },
  { id: "cat-8", name: "Sữa chua", slug: "sua-chua", sort_order: 8, is_active: true },
];

/**
 * Biểu tượng đại diện cho từng danh mục.
 *
 * Dùng làm ảnh tạm khi món chưa có ảnh thật (image_url = null). Đây KHÔNG phải
 * dữ liệu giả — trang chính thức cũng cần nó, vì lúc mới nhập món chủ quán
 * chưa kịp chụp ảnh, mà thẻ món trống trơn thì rất xấu.
 */
export const bieuTuongDanhMuc: Record<string, string> = {
  "mi-nui-bun": "🍜",
  "mi-pho-mai": "🧀",
  "banh-trang": "🌯",
  "an-vat-do-chien": "🍢",
  "tra-sua": "🧋",
  "tra-trai-cay": "🍹",
  "nuoc-giai-khat": "🥤",
  "sua-chua": "🍨",
};

/** Rút gọn việc khai báo món: chỉ cần tên, phần còn lại điền tự động. */
function mon(
  stt: number,
  category_id: string,
  name: string,
  extra: Partial<MenuItem> = {},
): MenuItem {
  return {
    id: `mon-${String(stt).padStart(2, "0")}`,
    category_id,
    name,
    description: null,
    price: GIA_TAM,
    image_url: null,
    is_available: true,
    sort_order: stt,
    ...extra,
  };
}

export const mockMenuItems: MenuItem[] = [
  // ---------- 1. Mì – Nui – Bún ----------
  mon(1, "cat-1", "Nui chiên trứng"),
  mon(2, "cat-1", "Nui xào bò"),
  mon(3, "cat-1", "Mì Ý"),
  mon(4, "cat-1", "Mì trộn cá viên sốt mắm tỏi"),
  mon(5, "cat-1", "Mì trộn trứng xúc xích"),
  mon(6, "cat-1", "Mì trộn trứng cá"),
  mon(7, "cat-1", "Mì trộn gà sốt chua ngọt"),
  mon(8, "cat-1", "Mì trộn gà sốt phô mai"),
  mon(9, "cat-1", "Mì trộn thịt"),
  // Món tạm hết — để kiểm tra trạng thái "Tạm hết" ở Giai đoạn 3
  mon(10, "cat-1", "Mì cay", { is_available: false }),
  mon(11, "cat-1", "Mì tương đen"),
  mon(12, "cat-1", "Bún nước tương"),
  mon(13, "cat-1", "Lẩu Thái chua cay", {
    description: "Chọn sợi bún hoặc mì khi gọi món",
  }),

  // ---------- 2. Mì phô mai ----------
  mon(14, "cat-2", "Mì phô mai trộn cá viên sốt mắm tỏi"),
  mon(15, "cat-2", "Mì phô mai trộn trứng xúc xích"),
  mon(16, "cat-2", "Mì phô mai trộn trứng cá"),
  mon(17, "cat-2", "Mì phô mai trộn gà sốt chua ngọt"),
  mon(18, "cat-2", "Mì phô mai trộn gà sốt phô mai"),

  // ---------- 3. Bánh tráng ----------
  mon(19, "cat-3", "Bánh tráng trộn"),
  mon(20, "cat-3", "Bánh tráng cuộn"),
  mon(21, "cat-3", "Bánh tráng chấm muối hành / muối"),

  // ---------- 4. Ăn vặt – Đồ chiên ----------
  mon(22, "cat-4", "Cá viên sốt mắm tỏi"),
  mon(23, "cat-4", "Cá viên đủ loại"),
  mon(24, "cat-4", "Bánh khoai mỡ", { is_available: false }),
  mon(25, "cat-4", "Hot dog"),
  mon(26, "cat-4", "Phô mai que"),
  mon(27, "cat-4", "Xúc xích Đức"),

  // ---------- 5. Trà sữa ----------
  mon(28, "cat-5", "Trà sữa truyền thống"),
  mon(29, "cat-5", "Trà sữa khoai môn"),
  mon(30, "cat-5", "Trà sữa mix vị"),
  mon(31, "cat-5", "Trà sữa Thái xanh"),
  mon(32, "cat-5", "Trà sữa Thái đỏ"),
  mon(33, "cat-5", "Trà sữa matcha"),
  mon(34, "cat-5", "Lipton sữa"),
  mon(35, "cat-5", "Sữa tươi trân châu đường đen"),
  mon(36, "cat-5", "Matcha latte"),

  // ---------- 6. Trà trái cây ----------
  mon(37, "cat-6", "Trà dâu"),
  mon(38, "cat-6", "Trà đào"),
  mon(39, "cat-6", "Trà vải"),
  mon(40, "cat-6", "Trà ổi hồng chanh dây"),
  mon(41, "cat-6", "Trà táo"),
  mon(42, "cat-6", "Trà việt quất"),
  mon(43, "cat-6", "Trà tắc"),
  mon(44, "cat-6", "Trà tắc Thái xanh"),

  // ---------- 7. Nước giải khát khác ----------
  mon(45, "cat-7", "Đá me"),
  mon(46, "cat-7", "Cam ép"),
  mon(47, "cat-7", "Soda dâu"),
  mon(48, "cat-7", "Soda mix vị", { is_available: false }),

  // ---------- 8. Sữa chua ----------
  mon(49, "cat-8", "Sữa chua dâu"),
  mon(50, "cat-8", "Sữa chua việt quất"),
  mon(51, "cat-8", "Sữa chua dưa lưới"),
  mon(52, "cat-8", "Sữa chua xoài"),
  mon(53, "cat-8", "Sữa chua chanh dây"),
  mon(54, "cat-8", "Sữa chua đá"),
];
