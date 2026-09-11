import { describe, expect, it } from "vitest";
import type { KhoLuu } from "../bo-nho";
import type { Category, MenuItem, OptionGroup } from "../types";
import {
  batTuTien,
  dangBatTuTien,
  HAN_TU_TIEN_MS,
  KHOA_TU_TIEN,
  tatTuTien,
} from "./che-do";
import { BANG_RONG, canHienTenThat, coiAo, khoacAo, type BangTuTien } from "./du-lieu";

function khoGia(): KhoLuu & { du: Record<string, string> } {
  const du: Record<string, string> = {};
  return {
    du,
    getItem: (k) => du[k] ?? null,
    setItem: (k, v) => {
      du[k] = v;
    },
    removeItem: (k) => {
      delete du[k];
    },
  };
}

const DM: Category[] = [
  { id: "c1", name: "Mì – Nui – Bún", slug: "mi", sort_order: 1, is_active: true },
];
const MON: MenuItem[] = [
  { id: "m1", category_id: "c1", name: "Mì cay", description: null, price: 25000, image_url: null, is_available: true, sort_order: 1 },
  { id: "m2", category_id: "c1", name: "Mì trộn", description: "Đã gồm 1 phần topping", price: 20000, image_url: null, is_available: true, sort_order: 2 },
];
const NHOM: Record<string, OptionGroup[]> = {
  m1: [{
    id: "g1", menu_item_id: "m1", name: "Cấp độ cay", kind: "mot", min_qty: 1, included_qty: 0,
    extra_unit_price: 0, max_qty_per_choice: 1, sort_order: 1,
    choices: [
      { id: "k0", group_id: "g1", name: "Cấp 0 (không cay)", description: null, price_delta: 0, requires_choice_id: null, is_available: true, sort_order: 1 },
      { id: "k7", group_id: "g1", name: "Cấp 7 (cay nhất)", description: null, price_delta: 0, requires_choice_id: null, is_available: true, sort_order: 2 },
    ],
  }],
};
const BANG: BangTuTien = {
  danhMuc: { c1: "Linh Thực Các" },
  mon: { m1: { ten: "Viêm Hỏa Thần Ti", moTa: "Mỗi sợi mì đều ngấm hỏa khí. Mì cay." } },
  nhom: { g1: "Cảnh Giới" },
  luaChon: { k0: "Phàm Nhân", k7: "Độ Kiếp" },
};

describe("Khoác áo tu tiên lên menu thật", () => {
  const ao = khoacAo(BANG, DM, MON, NHOM);

  it("thay tên hiển thị, giữ tên thật để hiện dòng nhỏ", () => {
    expect(ao.monAn[0].name).toBe("Viêm Hỏa Thần Ti");
    expect(ao.monAn[0].tenThat).toBe("Mì cay");
    expect(ao.danhMuc[0].name).toBe("Linh Thực Các");
    expect(ao.danhMuc[0].tenThat).toBe("Mì – Nui – Bún");
    expect(ao.nhomTheoMon.m1[0].name).toBe("Cảnh Giới");
    expect(ao.nhomTheoMon.m1[0].choices[1]).toMatchObject({ name: "Độ Kiếp", tenThat: "Cấp 7 (cay nhất)" });
  });

  it("KHÔNG đổi mã món, giá, danh mục — giỏ hàng dùng chung được", () => {
    ao.monAn.forEach((m, i) => {
      expect(m.id).toBe(MON[i].id);
      expect(m.price).toBe(MON[i].price);
      expect(m.category_id).toBe(MON[i].category_id);
      expect(m.is_available).toBe(MON[i].is_available);
    });
    expect(ao.nhomTheoMon.m1[0].choices.map((c) => c.id)).toEqual(["k0", "k7"]);
  });

  it("món chưa có tên tu tiên thì dùng tên và mô tả thật", () => {
    expect(ao.monAn[1].name).toBe("Mì trộn");
    expect(ao.monAn[1].description).toBe("Đã gồm 1 phần topping");
  });

  it("bảng tu tiên đọc lỗi (rỗng) thì trang vẫn hiện đủ món bằng tên thật", () => {
    const rong = khoacAo(BANG_RONG, DM, MON, NHOM);
    expect(rong.monAn.map((m) => m.name)).toEqual(["Mì cay", "Mì trộn"]);
    expect(rong.nhomTheoMon.m1[0].choices[0].name).toBe("Cấp 0 (không cay)");
  });

  it("tên tu tiên chỉ toàn khoảng trắng thì coi như chưa có", () => {
    const b = khoacAo({ ...BANG, mon: { m1: { ten: "   ", moTa: " " } } }, DM, MON, NHOM);
    expect(b.monAn[0].name).toBe("Mì cay");
    expect(b.monAn[0].description).toBeNull();
  });

  it("cởi áo trả về đúng tên thật cho nhân viên đọc", () => {
    const that = coiAo(ao.monAn, ao.nhomTheoMon);
    expect(that.monAn.map((m) => m.name)).toEqual(["Mì cay", "Mì trộn"]);
    expect(that.nhomTheoMon.m1[0].choices[1].name).toBe("Cấp 7 (cay nhất)");
  });

  it("chỉ hiện dòng tên thật khi nó khác tên đang hiện", () => {
    expect(canHienTenThat("Viêm Hỏa Thần Ti", "Mì cay")).toBe(true);
    expect(canHienTenThat("Mì trộn", "mì trộn ")).toBe(false);
  });
});

describe("Nhớ chế độ tu tiên 60 phút", () => {
  it("chưa bật thì là menu thường", () => {
    expect(dangBatTuTien(khoGia(), 0)).toBe(false);
  });

  it("bật rồi thì nhớ trong 60 phút, quá hạn thì tự quên", () => {
    const kho = khoGia();
    batTuTien(kho, 1000);
    expect(dangBatTuTien(kho, 1000 + HAN_TU_TIEN_MS - 1)).toBe(true);
    expect(dangBatTuTien(kho, 1000 + HAN_TU_TIEN_MS)).toBe(false);
    expect(kho.du[KHOA_TU_TIEN]).toBeUndefined();
  });

  it("tắt là quên ngay", () => {
    const kho = khoGia();
    batTuTien(kho, 0);
    tatTuTien(kho);
    expect(dangBatTuTien(kho, 1)).toBe(false);
  });

  it("dữ liệu hỏng hoặc trình duyệt chặn bộ nhớ thì không sập", () => {
    const kho = khoGia();
    kho.du[KHOA_TU_TIEN] = "{hong";
    expect(dangBatTuTien(kho, 0)).toBe(false);
    expect(dangBatTuTien(null, 0)).toBe(false);
    expect(() => batTuTien(null, 0)).not.toThrow();
  });
});
