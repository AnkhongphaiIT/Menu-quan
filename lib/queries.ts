import { daCauHinhSupabase, taoKetNoi } from "./supabase";
import type { Category, MenuItem, ShopSettings } from "./types";

/**
 * Đọc toàn bộ dữ liệu cần cho trang menu, trong MỘT lần gọi.
 *
 * Vì sao gộp cả ba bảng vào một hàm: trang menu luôn cần đủ cả ba, và cả ba
 * truy vấn chạy song song bằng Promise.all nên tổng thời gian bằng truy vấn
 * chậm nhất chứ không phải tổng cộng ba cái.
 *
 * Hàm này KHÔNG BAO GIỜ ném lỗi ra ngoài. Menu quán mà sập trắng vì database
 * trục trặc thì khách quét QR không thấy gì cả — tệ hơn nhiều so với việc hiện
 * một lời nhắc. Nên mọi trục trặc đều trả về qua trường `loi` để trang tự
 * quyết định hiển thị thế nào.
 */

export type DuLieuMenu = {
  danhMuc: Category[];
  monAn: MenuItem[];
  thongTinQuan: ShopSettings | null;
  /** null nghĩa là mọi thứ bình thường */
  loi: string | null;
};

const RONG: DuLieuMenu = {
  danhMuc: [],
  monAn: [],
  thongTinQuan: null,
  loi: null,
};

export async function layDuLieuMenu(): Promise<DuLieuMenu> {
  if (!daCauHinhSupabase()) {
    return {
      ...RONG,
      loi: "chua-cau-hinh",
    };
  }

  try {
    const db = taoKetNoi();

    const [danhMuc, monAn, thongTinQuan] = await Promise.all([
      db
        .from("categories")
        .select("id, name, slug, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      db
        .from("menu_items")
        .select(
          "id, category_id, name, description, price, image_url, is_available, sort_order",
        )
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),

      // maybeSingle() thay vì single(): bảng chỉ có 1 dòng, nhưng nếu vì lý do
      // nào đó chưa có dòng nào thì maybeSingle trả về null, còn single sẽ ném lỗi.
      db
        .from("shop_settings")
        .select(
          "id, shop_name, address, phone, open_hours, facebook_url, instagram_url, tiktok_url, zalo_url, map_url",
        )
        .eq("id", 1)
        .maybeSingle(),
    ]);

    const loiDau =
      danhMuc.error?.message ?? monAn.error?.message ?? thongTinQuan.error?.message;

    if (loiDau) {
      console.error("[menu] Lỗi khi đọc dữ liệu từ Supabase:", loiDau);
      return { ...RONG, loi: loiDau };
    }

    return {
      danhMuc: (danhMuc.data ?? []) as Category[],
      monAn: (monAn.data ?? []) as MenuItem[],
      thongTinQuan: (thongTinQuan.data ?? null) as ShopSettings | null,
      loi: null,
    };
  } catch (e) {
    const thongDiep = e instanceof Error ? e.message : String(e);
    console.error("[menu] Không kết nối được Supabase:", thongDiep);
    return { ...RONG, loi: thongDiep };
  }
}
