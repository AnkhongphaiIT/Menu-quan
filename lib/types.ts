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
