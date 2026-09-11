import type {
  Category,
  MenuItem,
  OptionChoice,
  OptionGroup,
} from "../types";

/**
 * CHỮ TU TIÊN — lớp "áo" khoác lên menu thật.
 *
 * Chủ quán yêu cầu phần tu tiên phải TÁCH RIÊNG để không gây lỗi cho menu
 * thường. Nên chữ tu tiên nằm ở 4 bảng riêng (supabase/migrations/004), và
 * file này chỉ làm một việc: lấy menu thật, thay tên hiển thị bằng tên tu
 * tiên, đồng thời GIỮ tên thật ở trường tenThat để hiện thành dòng chữ nhỏ.
 *
 * Mã món, giá, danh mục, tuỳ chọn không đổi gì cả — nhờ vậy giỏ hàng dùng
 * chung được với menu thường, chuyển qua lại không mất món.
 *
 * Món nào chưa có tên tu tiên (ví dụ món mới thêm) thì dùng luôn tên thật.
 */

export type BangTuTien = {
  /** mã danh mục -> tên tu tiên */
  danhMuc: Record<string, string>;
  /** mã món -> tên + mô tả tu tiên */
  mon: Record<string, { ten: string; moTa: string | null }>;
  /** mã nhóm tuỳ chọn -> tên tu tiên */
  nhom: Record<string, string>;
  /** mã lựa chọn -> tên tu tiên */
  luaChon: Record<string, string>;
};

export const BANG_RONG: BangTuTien = {
  danhMuc: {},
  mon: {},
  nhom: {},
  luaChon: {},
};

export type DanhMucTT = Category & { tenThat: string };
export type MonTT = MenuItem & { tenThat: string; moTaThat: string | null };
export type LuaChonTT = OptionChoice & { tenThat: string };
export type NhomTT = Omit<OptionGroup, "choices"> & {
  tenThat: string;
  choices: LuaChonTT[];
};

/** Tên tu tiên trống hoặc chỉ toàn khoảng trắng thì coi như chưa có. */
function chon(tuTien: string | null | undefined, that: string): string {
  const t = tuTien?.trim();
  return t ? t : that;
}

export function khoacAo(
  bang: BangTuTien,
  danhMuc: Category[],
  monAn: MenuItem[],
  nhomTheoMon: Record<string, OptionGroup[]>,
): {
  danhMuc: DanhMucTT[];
  monAn: MonTT[];
  nhomTheoMon: Record<string, NhomTT[]>;
} {
  const nhomMoi: Record<string, NhomTT[]> = {};
  for (const [idMon, cacNhom] of Object.entries(nhomTheoMon)) {
    nhomMoi[idMon] = cacNhom.map((n) => ({
      ...n,
      name: chon(bang.nhom[n.id], n.name),
      tenThat: n.name,
      choices: n.choices.map((c) => ({
        ...c,
        name: chon(bang.luaChon[c.id], c.name),
        tenThat: c.name,
      })),
    }));
  }

  return {
    danhMuc: danhMuc.map((d) => ({
      ...d,
      name: chon(bang.danhMuc[d.id], d.name),
      tenThat: d.name,
    })),
    monAn: monAn.map((m) => {
      const tt = bang.mon[m.id];
      return {
        ...m,
        name: chon(tt?.ten, m.name),
        /* Có mô tả tu tiên thì dùng; không có thì giữ mô tả thật (ví dụ
           "Đã gồm 1 phần topping") — thông tin đó khách vẫn cần biết. */
        description: tt?.moTa?.trim() ? tt.moTa.trim() : m.description,
        tenThat: m.name,
        moTaThat: m.description,
      };
    }),
    nhomTheoMon: nhomMoi,
  };
}

/**
 * Cởi áo: trả về đúng tên thật. Dùng để viết dòng chữ nhỏ trong giỏ hàng —
 * nhân viên đọc dòng đó mới biết làm món gì, loại mì gì, cấp cay mấy.
 */
export function coiAo(
  monAn: MonTT[],
  nhomTheoMon: Record<string, NhomTT[]>,
): { monAn: MenuItem[]; nhomTheoMon: Record<string, OptionGroup[]> } {
  const nhom: Record<string, OptionGroup[]> = {};
  for (const [idMon, cacNhom] of Object.entries(nhomTheoMon)) {
    nhom[idMon] = cacNhom.map((n) => ({
      ...n,
      name: n.tenThat,
      choices: n.choices.map((c) => ({ ...c, name: c.tenThat })),
    }));
  }
  return {
    monAn: monAn.map((m) => ({ ...m, name: m.tenThat, description: m.moTaThat })),
    nhomTheoMon: nhom,
  };
}

/** Tên thật chỉ hiện thành dòng nhỏ khi nó khác tên đang hiển thị. */
export function canHienTenThat(ten: string, tenThat: string): boolean {
  return ten.trim().toLowerCase() !== tenThat.trim().toLowerCase();
}
