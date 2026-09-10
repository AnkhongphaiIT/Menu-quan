import { describe, expect, it } from "vitest";
import {
  bot,
  docTuBoNho,
  ghepVoiMenu,
  ghiVaoBoNho,
  gioRong,
  khoaDong,
  KHOA_BO_NHO,
  them,
  tongSoMon,
  tongTien,
  xoa,
  type KhoLuu,
} from "./cart";
import type { MenuItem, OptionGroup } from "./types";

/* Giỏ hàng khi món có tuỳ chọn (loại mì, topping). */

const T0 = 1_700_000_000_000;

const MI_TRON: MenuItem = {
  id: "mi-tron",
  category_id: "cat-1",
  name: "Mì trộn",
  description: null,
  price: 20000,
  image_url: null,
  is_available: true,
  sort_order: 4,
};

const TRA_SUA: MenuItem = { ...MI_TRON, id: "tra-sua", name: "Trà sữa", price: 25000 };

function lua(id: string, name: string, sort_order: number, requires: string | null = null) {
  return {
    id,
    group_id: "",
    name,
    description: null,
    price_delta: 0,
    requires_choice_id: requires,
    is_available: true,
    sort_order,
  };
}

const NHOM: Record<string, OptionGroup[]> = {
  "mi-tron": [
    {
      id: "g-mi", menu_item_id: "mi-tron", name: "Loại mì", kind: "mot",
      min_qty: 1, included_qty: 0, extra_unit_price: 0, max_qty_per_choice: 1, sort_order: 1,
      choices: [lua("thuong", "Mì trộn thường", 1), lua("phomai", "Mì phô mai", 2)],
    },
    {
      id: "g-tp", menu_item_id: "mi-tron", name: "Topping", kind: "nhieu",
      min_qty: 1, included_qty: 1, extra_unit_price: 5000, max_qty_per_choice: 5, sort_order: 2,
      choices: [
        lua("ga", "Gà sốt chua ngọt", 1),
        lua("trung", "Trứng xúc xích", 2),
        lua("mamtoi", "Cá viên sốt mắm tỏi", 3, "thuong"),
      ],
    },
  ],
};

const MENU = [MI_TRON, TRA_SUA];

describe("Giỏ hàng có tuỳ chọn", () => {
  it("cùng món khác topping là hai dòng riêng", () => {
    let gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, ga: 1 });
    gio = them(gio, "mi-tron", T0, 1, { phomai: 1, trung: 1 });
    expect(gio.dong).toHaveLength(2);
    expect(tongSoMon(gio)).toBe(2);
  });

  it("cùng món cùng topping thì cộng dồn vào một dòng", () => {
    let gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, ga: 1 });
    gio = them(gio, "mi-tron", T0, 1, { ga: 1, phomai: 1 });
    expect(gio.dong).toHaveLength(1);
    expect(gio.dong[0].soLuong).toBe(2);
  });

  it("tính đúng giá theo topping: đã gà thêm gà +5.000đ", () => {
    const gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, ga: 2 });
    const [d] = ghepVoiMenu(gio, MENU, NHOM);
    expect(d.donGia).toBe(25000);
    expect(d.moTa).toBe("Mì phô mai · Gà sốt chua ngọt ×2");
  });

  it("tổng tiền trộn món có và không có tuỳ chọn", () => {
    let gio = them(gioRong(T0), "mi-tron", T0, 2, { phomai: 1, ga: 1, trung: 1 }); // 25.000 x2
    gio = them(gio, "tra-sua", T0); //                                              25.000
    expect(tongTien(ghepVoiMenu(gio, MENU, NHOM))).toBe(75000);
  });

  it("bớt và xoá đúng dòng theo mã dòng, không đụng dòng khác cùng món", () => {
    let gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, ga: 1 });
    gio = them(gio, "mi-tron", T0, 1, { phomai: 1, trung: 1 });

    gio = xoa(gio, khoaDong("mi-tron", { phomai: 1, ga: 1 }), T0);
    expect(gio.dong).toHaveLength(1);
    expect(gio.dong[0].luaChon).toEqual({ phomai: 1, trung: 1 });

    gio = bot(gio, khoaDong("mi-tron", { trung: 1, phomai: 1 }), T0);
    expect(gio.dong).toHaveLength(0);
  });

  it("dòng có tổ hợp phạm luật (mì phô mai + cá viên mắm tỏi) bị bỏ, không hiện giá sai", () => {
    const gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, mamtoi: 1 });
    expect(ghepVoiMenu(gio, MENU, NHOM)).toEqual([]);
  });

  it("chủ quán xoá mất topping đang có trong giỏ thì dòng đó bị bỏ", () => {
    const gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, "topping-da-xoa": 1 });
    expect(ghepVoiMenu(gio, MENU, NHOM)).toEqual([]);
  });

  it("món thường không có tuỳ chọn vẫn chạy như cũ", () => {
    const gio = them(gioRong(T0), "tra-sua", T0);
    expect(gio.dong[0]).toEqual({ id: "tra-sua", soLuong: 1 });
    expect(tongTien(ghepVoiMenu(gio, MENU, NHOM))).toBe(25000);
  });
});

describe("Lưu giỏ hàng có tuỳ chọn", () => {
  function khoGia(banDau: Record<string, string> = {}): KhoLuu & { duLieu: Record<string, string> } {
    const duLieu = { ...banDau };
    return {
      duLieu,
      getItem: (k) => (k in duLieu ? duLieu[k] : null),
      setItem: (k, v) => { duLieu[k] = v; },
      removeItem: (k) => { delete duLieu[k]; },
    };
  }

  it("ghi rồi đọc lại giữ nguyên lựa chọn", () => {
    const kho = khoGia();
    const gio = them(gioRong(T0), "mi-tron", T0, 1, { phomai: 1, ga: 2 });
    ghiVaoBoNho(gio, kho);
    expect(docTuBoNho(T0, kho)).toEqual(gio);
  });

  it("giỏ cũ lưu trước khi có tuỳ chọn vẫn đọc được", () => {
    const cu = JSON.stringify({ dong: [{ id: "tra-sua", soLuong: 2 }], hetHanLuc: T0 + 1000 });
    expect(docTuBoNho(T0, khoGia({ [KHOA_BO_NHO]: cu }))?.dong).toHaveLength(1);
  });

  it("lựa chọn hỏng (số âm, chữ) thì bỏ cả giỏ", () => {
    const hong = JSON.stringify({
      dong: [{ id: "mi-tron", soLuong: 1, luaChon: { ga: -1 } }],
      hetHanLuc: T0 + 1000,
    });
    expect(docTuBoNho(T0, khoGia({ [KHOA_BO_NHO]: hong }))).toBeNull();
  });
});
