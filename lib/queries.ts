import { daCauHinhSupabase, taoKetNoi } from "./supabase";
import type {
  Category,
  MenuItem,
  OptionChoice,
  OptionGroup,
  ShopSettings,
} from "./types";

/**
 * Đọc toàn bộ dữ liệu cần cho trang menu, trong MỘT lần gọi.
 *
 * Năm truy vấn chạy song song bằng Promise.all nên tổng thời gian bằng truy
 * vấn chậm nhất chứ không phải cộng dồn. Trang còn được dựng sẵn và làm mới
 * mỗi 60 giây, nên 50 khách quét QR cùng lúc vẫn chỉ đụng database 1 lần.
 *
 * Hàm này KHÔNG BAO GIỜ ném lỗi ra ngoài. Menu quán mà sập trắng vì database
 * trục trặc thì khách quét QR không thấy gì cả — tệ hơn nhiều so với việc hiện
 * một lời nhắc. Nên mọi trục trặc đều trả về qua trường `loi`.
 */

export type DuLieuMenu = {
  danhMuc: Category[];
  monAn: MenuItem[];
  /** Mã món -> các nhóm tuỳ chọn (kèm lựa chọn). Món không có tuỳ chọn thì không có mặt. */
  nhomTheoMon: Record<string, OptionGroup[]>;
  thongTinQuan: ShopSettings | null;
  /** null nghĩa là mọi thứ bình thường */
  loi: string | null;
};

const RONG: DuLieuMenu = {
  danhMuc: [],
  monAn: [],
  nhomTheoMon: {},
  thongTinQuan: null,
  loi: null,
};

/**
 * Ráp hai bảng phẳng option_groups + option_choices thành cấu trúc lồng nhau,
 * gom theo món. Dùng chung cho trang khách và trang admin.
 */
export function rapNhomTuyChon(
  nhomTho: Omit<OptionGroup, "choices">[],
  luaTho: OptionChoice[],
): Record<string, OptionGroup[]> {
  const luaTheoNhom = new Map<string, OptionChoice[]>();
  for (const l of luaTho) {
    const ds = luaTheoNhom.get(l.group_id) ?? [];
    ds.push(l);
    luaTheoNhom.set(l.group_id, ds);
  }

  const ra: Record<string, OptionGroup[]> = {};
  for (const n of [...nhomTho].sort((a, b) => a.sort_order - b.sort_order)) {
    const nhom: OptionGroup = {
      ...n,
      choices: (luaTheoNhom.get(n.id) ?? []).sort(
        (a, b) => a.sort_order - b.sort_order,
      ),
    };
    (ra[n.menu_item_id] ??= []).push(nhom);
  }
  return ra;
}

export const COT_NHOM =
  "id, menu_item_id, name, kind, min_qty, included_qty, extra_unit_price, max_qty_per_choice, sort_order";
export const COT_LUA_CHON =
  "id, group_id, name, description, price_delta, requires_choice_id, is_available, sort_order";

export async function layDuLieuMenu(): Promise<DuLieuMenu> {
  if (!daCauHinhSupabase()) {
    return { ...RONG, loi: "chua-cau-hinh" };
  }

  try {
    const db = taoKetNoi();

    const [danhMuc, monAn, nhom, luaChon, thongTinQuan] = await Promise.all([
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

      db.from("option_groups").select(COT_NHOM),

      db.from("option_choices").select(COT_LUA_CHON),

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

    const loiMenu =
      danhMuc.error?.message ?? monAn.error?.message ?? thongTinQuan.error?.message;

    if (loiMenu) {
      console.error("[menu] Lỗi khi đọc dữ liệu từ Supabase:", loiMenu);
      return { ...RONG, loi: loiMenu };
    }

    /* Bảng tuỳ chọn lỗi thì vẫn hiện menu, chỉ là không có ô chọn. Menu
       không có topping vẫn hơn menu trắng trơn. */
    const loiTuyChon = nhom.error?.message ?? luaChon.error?.message;
    if (loiTuyChon) {
      console.error("[menu] Không đọc được tuỳ chọn:", loiTuyChon);
    }

    return {
      danhMuc: (danhMuc.data ?? []) as Category[],
      monAn: (monAn.data ?? []) as MenuItem[],
      nhomTheoMon: loiTuyChon
        ? {}
        : rapNhomTuyChon(
            (nhom.data ?? []) as Omit<OptionGroup, "choices">[],
            (luaChon.data ?? []) as OptionChoice[],
          ),
      thongTinQuan: (thongTinQuan.data ?? null) as ShopSettings | null,
      loi: null,
    };
  } catch (e) {
    const thongDiep = e instanceof Error ? e.message : String(e);
    console.error("[menu] Không kết nối được Supabase:", thongDiep);
    return { ...RONG, loi: thongDiep };
  }
}
