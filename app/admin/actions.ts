"use server";

import { refresh, revalidatePath } from "next/cache";
import { taoKetNoiCoDangNhap } from "@/lib/supabase-auth";

/**
 * CÁC LỆNH GHI DỮ LIỆU CỦA TRANG QUẢN TRỊ.
 *
 * "use server" nghĩa là những hàm này chạy trên máy chủ, dù được bấm từ điện
 * thoại. Trình duyệt chỉ gửi yêu cầu chứ không tự ghi vào database.
 *
 * ⚠️ Đừng nhầm: đây KHÔNG phải lớp bảo vệ. Mọi lệnh dưới đây đều đi qua Row
 * Level Security — database tự kiểm tra email người gửi có trong
 * admin_allowlist không. Người lạ gọi thẳng vào những hàm này cũng bị chặn,
 * đúng như Bài 3 trong supabase/test-rls.sql đã chứng minh.
 *
 * Sau mỗi lần ghi đều gọi revalidatePath("/") để trang khách cập nhật ngay
 * trong vài giây, thay vì phải chờ hết 60 giây của bộ nhớ đệm.
 */

export type KetQua = { ok: true } | { ok: false; loi: string };

/** Dịch lỗi kỹ thuật của database sang câu chủ quán hiểu được. */
function dichLoi(thongDiep: string): string {
  const t = thongDiep.toLowerCase();

  if (t.includes("row-level security") || t.includes("permission denied")) {
    return "Tài khoản này không có quyền sửa menu. Kiểm tra lại email trong danh sách quản trị.";
  }
  if (t.includes("duplicate key") && t.includes("slug")) {
    return "Đã có danh mục dùng tên rút gọn này rồi. Đổi tên khác nhé.";
  }
  if (t.includes("violates foreign key")) {
    return "Danh mục này vẫn còn món bên trong. Xoá hoặc chuyển các món đi trước.";
  }
  if (t.includes("check constraint") && t.includes("price")) {
    return "Giá không hợp lệ. Giá phải là số không âm.";
  }
  return `Không lưu được: ${thongDiep}`;
}

/**
 * Gọi sau mỗi lần ghi thành công.
 *
 * - revalidatePath("/"): trang khách cập nhật ngay, không phải chờ hết 60 giây cache.
 * - refresh(): trang admin đang mở nhận dữ liệu mới NGAY TRONG phản hồi của
 *   lệnh này. Trước đây trình duyệt phải gọi thêm router.refresh() — tức là
 *   mỗi lần đổi giá đi hai vòng máy chủ thay vì một.
 */
function lamMoiTrangKhach() {
  revalidatePath("/");
  refresh();
}

/**
 * Database chặn bằng RLS thì KHÔNG báo lỗi — nó chỉ lặng lẽ sửa 0 dòng. Nên
 * với lệnh sửa, phải hỏi lại "đã sửa được dòng nào chưa". Không có dòng nào
 * thì báo rõ, để trang admin không hiện "✓ Đã lưu" sai sự thật.
 */
const KHONG_SUA_DUOC =
  "Chưa lưu được. Có thể phiên đăng nhập đã hết — tải lại trang, đăng nhập lại rồi thử lại.";

/* ==========================================================================
   MÓN ĂN
   ========================================================================== */

export type DuLieuMon = {
  name: string;
  description: string | null;
  price: number;
  category_id: string;
  image_url: string | null;
  is_available: boolean;
};

function kiemTraMon(du: DuLieuMon): string | null {
  if (!du.name.trim()) return "Chưa nhập tên món.";
  if (!du.category_id) return "Chưa chọn danh mục cho món.";
  if (!Number.isInteger(du.price) || du.price < 0) {
    return "Giá phải là số nguyên không âm. Nhập bằng đồng, ví dụ 25000.";
  }
  return null;
}

/** Thêm món trả về cả mã món mới, để biểu mẫu mở tiếp phần tuỳ chọn cho món đó. */
export type KetQuaThem = { ok: true; id: string } | { ok: false; loi: string };

export async function themMon(du: DuLieuMon): Promise<KetQuaThem> {
  const sai = kiemTraMon(du);
  if (sai) return { ok: false, loi: sai };

  const db = await taoKetNoiCoDangNhap();

  /* Đặt món mới xuống cuối danh mục, để không xáo trộn thứ tự đang có. */
  const { data: cuoi } = await db
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", du.category_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: moi, error } = await db
    .from("menu_items")
    .insert({
      ...du,
      name: du.name.trim(),
      description: du.description?.trim() || null,
      sort_order: (cuoi?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  if (error || !moi) {
    return { ok: false, loi: dichLoi(error?.message ?? "Không tạo được món.") };
  }
  lamMoiTrangKhach();
  return { ok: true, id: moi.id as string };
}

export async function suaMon(id: string, du: DuLieuMon): Promise<KetQua> {
  const sai = kiemTraMon(du);
  if (sai) return { ok: false, loi: sai };

  const db = await taoKetNoiCoDangNhap();
  const { error } = await db
    .from("menu_items")
    .update({
      ...du,
      name: du.name.trim(),
      description: du.description?.trim() || null,
    })
    .eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

/**
 * Bật/tắt "Tạm hết" — thao tác dùng nhiều nhất trong ngày.
 *
 * Tách riêng khỏi suaMon để chỉ cần một cú chạm, không phải mở cả biểu mẫu.
 * Giữa buổi hết nguyên liệu là tắt ngay tại quầy.
 */
export async function batTatConHang(
  id: string,
  conHang: boolean,
): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { data, error } = await db
    .from("menu_items")
    .update({ is_available: conHang })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, loi: dichLoi(error.message) };
  if (!data?.length) return { ok: false, loi: KHONG_SUA_DUOC };
  lamMoiTrangKhach();
  return { ok: true };
}

/** Đổi riêng giá — thao tác nhiều thứ hai, cũng chỉ cần một ô nhập. */
export async function doiGia(id: string, gia: number): Promise<KetQua> {
  if (!Number.isInteger(gia) || gia < 0) {
    return { ok: false, loi: "Giá phải là số nguyên không âm, ví dụ 25000." };
  }

  const db = await taoKetNoiCoDangNhap();
  const { data, error } = await db
    .from("menu_items")
    .update({ price: gia })
    .eq("id", id)
    .select("id");

  if (error) return { ok: false, loi: dichLoi(error.message) };
  if (!data?.length) return { ok: false, loi: KHONG_SUA_DUOC };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function xoaMon(id: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { error } = await db.from("menu_items").delete().eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

/**
 * Đổi chỗ hai món cho nhau trong danh sách.
 *
 * Cố tình dùng nút mũi tên lên/xuống thay vì kéo thả. Kéo thả trên điện thoại
 * hay bị nhầm với thao tác cuộn trang, và rất khó dùng khi danh sách dài hơn
 * một màn hình. Hai nút thì lúc nào cũng bấm trúng.
 */
export async function doiChoMon(idA: string, idB: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();

  const { data, error: loiDoc } = await db
    .from("menu_items")
    .select("id, sort_order")
    .in("id", [idA, idB]);

  if (loiDoc) return { ok: false, loi: dichLoi(loiDoc.message) };
  if (!data || data.length !== 2) {
    return { ok: false, loi: "Không tìm thấy món cần đổi chỗ." };
  }

  const a = data.find((m) => m.id === idA);
  const b = data.find((m) => m.id === idB);
  if (!a || !b) return { ok: false, loi: "Không tìm thấy món cần đổi chỗ." };

  const [r1, r2] = await Promise.all([
    db.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id),
    db.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  const loi = r1.error?.message ?? r2.error?.message;
  if (loi) return { ok: false, loi: dichLoi(loi) };

  lamMoiTrangKhach();
  return { ok: true };
}

/* ==========================================================================
   DANH MỤC
   ========================================================================== */

export async function themDanhMuc(ten: string): Promise<KetQua> {
  const tenGon = ten.trim();
  if (!tenGon) return { ok: false, loi: "Chưa nhập tên danh mục." };

  const db = await taoKetNoiCoDangNhap();

  const { data: cuoi } = await db
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("categories").insert({
    name: tenGon,
    slug: taoSlug(tenGon),
    sort_order: (cuoi?.sort_order ?? 0) + 1,
    is_active: true,
  });

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function suaTenDanhMuc(
  id: string,
  ten: string,
): Promise<KetQua> {
  const tenGon = ten.trim();
  if (!tenGon) return { ok: false, loi: "Chưa nhập tên danh mục." };

  const db = await taoKetNoiCoDangNhap();
  /* Cố tình KHÔNG đổi slug khi đổi tên. Slug dùng cho liên kết nhảy tới danh
     mục; đổi nó sẽ làm hỏng các liên kết ai đó đã lưu hoặc chia sẻ. */
  const { error } = await db
    .from("categories")
    .update({ name: tenGon })
    .eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function batTatDanhMuc(
  id: string,
  hienThi: boolean,
): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { error } = await db
    .from("categories")
    .update({ is_active: hienThi })
    .eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function xoaDanhMuc(id: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();

  /* Kiểm tra trước cho tử tế. Database cũng chặn (khoá ngoại on delete restrict),
     nhưng lỗi của nó khó hiểu với người không rành kỹ thuật. */
  const { count } = await db
    .from("menu_items")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      loi: `Danh mục này còn ${count} món bên trong. Xoá hoặc chuyển các món sang danh mục khác trước đã.`,
    };
  }

  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) return { ok: false, loi: dichLoi(error.message) };

  lamMoiTrangKhach();
  return { ok: true };
}

export async function doiChoDanhMuc(
  idA: string,
  idB: string,
): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();

  const { data, error: loiDoc } = await db
    .from("categories")
    .select("id, sort_order")
    .in("id", [idA, idB]);

  if (loiDoc) return { ok: false, loi: dichLoi(loiDoc.message) };

  const a = data?.find((m) => m.id === idA);
  const b = data?.find((m) => m.id === idB);
  if (!a || !b) return { ok: false, loi: "Không tìm thấy danh mục cần đổi chỗ." };

  const [r1, r2] = await Promise.all([
    db.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
    db.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  const loi = r1.error?.message ?? r2.error?.message;
  if (loi) return { ok: false, loi: dichLoi(loi) };

  lamMoiTrangKhach();
  return { ok: true };
}

/**
 * Tạo tên rút gọn không dấu từ tên danh mục: "Trà sữa" -> "tra-sua".
 *
 * Dùng cho liên kết nhảy tới danh mục trên trang khách. Phải bỏ dấu vì địa
 * chỉ web có dấu tiếng Việt sẽ bị mã hoá thành chuỗi ký tự khó đọc.
 */
function taoSlug(ten: string): string {
  const daBoDau = ten
    .normalize("NFD")
    .replace(
      new RegExp(
        `[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`,
        "g",
      ),
      "",
    )
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

  const goc = daBoDau
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);

  /* Tên toàn ký tự lạ thì vẫn phải ra một slug hợp lệ, không được để rỗng. */
  return goc || `danh-muc-${Date.now().toString(36)}`;
}

/* ==========================================================================
   TUỲ CHỌN CỦA MÓN (loại mì, topping, loại sợi...)

   Luật tính giá và kiểm tra nằm ở lib/tuy-chon.ts. Ở đây chỉ lưu vào database.
   ========================================================================== */

export type DuLieuNhom = {
  name: string;
  kind: "mot" | "nhieu";
  min_qty: number;
  included_qty: number;
  extra_unit_price: number;
  max_qty_per_choice: number;
};

function kiemTraNhom(du: DuLieuNhom): string | null {
  if (!du.name.trim()) return "Chưa nhập tên nhóm, ví dụ “Topping”.";
  if (du.kind !== "mot" && du.kind !== "nhieu") return "Kiểu nhóm không hợp lệ.";
  const cacSo: [string, number][] = [
    ["Số phần bắt buộc", du.min_qty],
    ["Số phần đã gồm trong giá", du.included_qty],
    ["Giá mỗi phần thêm", du.extra_unit_price],
    ["Tối đa mỗi lựa chọn", du.max_qty_per_choice],
  ];
  for (const [ten, so] of cacSo) {
    if (!Number.isInteger(so) || so < 0) return `${ten} phải là số nguyên không âm.`;
  }
  if (du.max_qty_per_choice < 1) return "Tối đa mỗi lựa chọn phải từ 1 trở lên.";
  return null;
}

/** Nhóm "chọn 1" thì các ô về số phần không có ý nghĩa — ép về giá trị chuẩn. */
function chuanHoaNhom(du: DuLieuNhom): DuLieuNhom {
  if (du.kind === "nhieu") return { ...du, name: du.name.trim() };
  return {
    ...du,
    name: du.name.trim(),
    min_qty: du.min_qty > 0 ? 1 : 0,
    included_qty: 0,
    extra_unit_price: 0,
    max_qty_per_choice: 1,
  };
}

export async function themNhom(
  menuItemId: string,
  duVao: DuLieuNhom,
): Promise<KetQua> {
  const sai = kiemTraNhom(duVao);
  if (sai) return { ok: false, loi: sai };
  const du = chuanHoaNhom(duVao);

  const db = await taoKetNoiCoDangNhap();
  const { data: cuoi } = await db
    .from("option_groups")
    .select("sort_order")
    .eq("menu_item_id", menuItemId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("option_groups").insert({
    ...du,
    menu_item_id: menuItemId,
    sort_order: (cuoi?.sort_order ?? 0) + 1,
  });

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function suaNhom(id: string, duVao: DuLieuNhom): Promise<KetQua> {
  const sai = kiemTraNhom(duVao);
  if (sai) return { ok: false, loi: sai };

  const db = await taoKetNoiCoDangNhap();
  const { error } = await db
    .from("option_groups")
    .update(chuanHoaNhom(duVao))
    .eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

/** Xoá nhóm thì các lựa chọn bên trong tự xoá theo (on delete cascade). */
export async function xoaNhom(id: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { error } = await db.from("option_groups").delete().eq("id", id);
  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export type DuLieuLuaChon = {
  name: string;
  description: string | null;
  price_delta: number;
  requires_choice_id: string | null;
  is_available: boolean;
};

function kiemTraLuaChon(du: DuLieuLuaChon): string | null {
  if (!du.name.trim()) return "Chưa nhập tên lựa chọn.";
  if (!Number.isInteger(du.price_delta) || du.price_delta < 0) {
    return "Giá cộng thêm phải là số nguyên không âm (0 nếu không tính thêm).";
  }
  return null;
}

export async function themLuaChon(
  groupId: string,
  du: DuLieuLuaChon,
): Promise<KetQua> {
  const sai = kiemTraLuaChon(du);
  if (sai) return { ok: false, loi: sai };

  const db = await taoKetNoiCoDangNhap();
  const { data: cuoi } = await db
    .from("option_choices")
    .select("sort_order")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await db.from("option_choices").insert({
    ...du,
    name: du.name.trim(),
    description: du.description?.trim() || null,
    group_id: groupId,
    sort_order: (cuoi?.sort_order ?? 0) + 1,
  });

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function suaLuaChon(
  id: string,
  du: DuLieuLuaChon,
): Promise<KetQua> {
  const sai = kiemTraLuaChon(du);
  if (sai) return { ok: false, loi: sai };
  if (du.requires_choice_id === id) {
    return { ok: false, loi: "Một lựa chọn không thể “chỉ đi với” chính nó." };
  }

  const db = await taoKetNoiCoDangNhap();
  const { error } = await db
    .from("option_choices")
    .update({
      ...du,
      name: du.name.trim(),
      description: du.description?.trim() || null,
    })
    .eq("id", id);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

/** Lựa chọn nào đang "chỉ đi với" lựa chọn bị xoá thì tự bỏ luật (on delete set null). */
export async function xoaLuaChon(id: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { error } = await db.from("option_choices").delete().eq("id", id);
  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}

export async function doiChoLuaChon(idA: string, idB: string): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();
  const { data, error: loiDoc } = await db
    .from("option_choices")
    .select("id, sort_order")
    .in("id", [idA, idB]);

  if (loiDoc) return { ok: false, loi: dichLoi(loiDoc.message) };
  const a = data?.find((c) => c.id === idA);
  const b = data?.find((c) => c.id === idB);
  if (!a || !b) return { ok: false, loi: "Không tìm thấy lựa chọn cần đổi chỗ." };

  const [r1, r2] = await Promise.all([
    db.from("option_choices").update({ sort_order: b.sort_order }).eq("id", a.id),
    db.from("option_choices").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  const loi = r1.error?.message ?? r2.error?.message;
  if (loi) return { ok: false, loi: dichLoi(loi) };

  lamMoiTrangKhach();
  return { ok: true };
}

/* ==========================================================================
   THÔNG TIN QUÁN
   ========================================================================== */

export type DuLieuQuan = {
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

export async function luuThongTinQuan(du: DuLieuQuan): Promise<KetQua> {
  const db = await taoKetNoiCoDangNhap();

  /* Ô để trống thì lưu thành null chứ không lưu chuỗi rỗng — chân trang dựa
     vào null để tự ẩn mục đó đi. */
  const sach = Object.fromEntries(
    Object.entries(du).map(([k, v]) => [k, v?.trim() ? v.trim() : null]),
  );

  const { error } = await db.from("shop_settings").update(sach).eq("id", 1);

  if (error) return { ok: false, loi: dichLoi(error.message) };
  lamMoiTrangKhach();
  return { ok: true };
}
