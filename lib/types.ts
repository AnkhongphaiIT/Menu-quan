/**
 * Kiểu dữ liệu dùng chung cho toàn bộ trang.
 *
 * QUAN TRỌNG: các kiểu dưới đây khớp CHÍNH XÁC với cấu trúc bảng trong
 * supabase/migrations/001_init.sql (Phần D của tài liệu quy trình).
 * Nhờ vậy tới Giai đoạn 5, khi bỏ dữ liệu giả và đọc thật từ Supabase,
 * chỉ cần đổi nguồn dữ liệu — không phải sửa một dòng giao diện nào.
 *
 * Nếu sau này sửa bảng trong database, nhớ sửa cả file này cho khớp.
 */

/** Danh mục món — bảng `categories` */
export type Category = {
  id: string;
  name: string;
  /** Tên không dấu, dùng cho liên kết nhảy tới danh mục. Ví dụ: "tra-sua" */
  slug: string;
  sort_order: number;
  is_active: boolean;
};

/** Một món trong menu — bảng `menu_items` */
export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  /**
   * Giá bán tính bằng ĐỒNG, luôn là số nguyên.
   * 25000 nghĩa là 25.000đ. Không bao giờ dùng số thập phân cho tiền tệ.
   */
  price: number;
  image_url: string | null;
  /** false = "Tạm hết": hiện mờ, không bấm thêm được */
  is_available: boolean;
  sort_order: number;
};

/** Một lựa chọn trong nhóm tuỳ chọn — bảng `option_choices` */
export type OptionChoice = {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  /** Tiền cộng thêm cho mỗi phần của lựa chọn này, thường là 0 */
  price_delta: number;
  /** Lựa chọn này CHỈ đi với lựa chọn kia (ở nhóm khác), ví dụ cá viên mắm tỏi -> mì thường */
  requires_choice_id: string | null;
  is_available: boolean;
  sort_order: number;
};

/**
 * Nhóm tuỳ chọn của một món — bảng `option_groups`.
 * Trong code luôn mang kèm danh sách lựa chọn (`choices`), khác với database
 * nơi hai thứ nằm ở hai bảng riêng.
 */
export type OptionGroup = {
  id: string;
  menu_item_id: string;
  name: string;
  /** "mot" = chọn đúng 1 (loại mì) · "nhieu" = chọn nhiều, có số phần (topping) */
  kind: "mot" | "nhieu";
  /** Tổng số phần tối thiểu. "mot" + 1 = bắt buộc chọn */
  min_qty: number;
  /** Số phần đã gồm trong giá gốc của món */
  included_qty: number;
  /** Giá mỗi phần vượt quá số đã gồm */
  extra_unit_price: number;
  max_qty_per_choice: number;
  sort_order: number;
  choices: OptionChoice[];
};

/** Thông tin quán — bảng `shop_settings`, chỉ có đúng 1 dòng. Dùng từ Giai đoạn 5. */
export type ShopSettings = {
  id: number;
  shop_name: string | null;
  address: string | null;
  phone: string | null;
  open_hours: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  zalo_url: string | null;
  map_url: string | null;
};
