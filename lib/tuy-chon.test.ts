import { describe, expect, it } from "vitest";
import type { OptionGroup } from "./types";
import {
  chuanHoa,
  giaCauHinh,
  giaThapNhat,
  khoaCauHinh,
  kiemTraCauHinh,
  lyDoBiKhoa,
  moTaCauHinh,
} from "./tuy-chon";

/* Dựng đúng món Mì trộn như trong supabase/migrations/003_tuy_chon.sql */
function lua(id: string, name: string, extra: Partial<OptionGroup["choices"][number]> = {}) {
  return {
    id,
    group_id: "",
    name,
    description: null,
    price_delta: 0,
    requires_choice_id: null,
    is_available: true,
    sort_order: 0,
    ...extra,
  };
}

const LOAI_MI: OptionGroup = {
  id: "g-mi",
  menu_item_id: "mi-tron",
  name: "Loại mì",
  kind: "mot",
  min_qty: 1,
  included_qty: 0,
  extra_unit_price: 0,
  max_qty_per_choice: 1,
  sort_order: 1,
  choices: [
    lua("thuong", "Mì trộn thường", { sort_order: 1 }),
    lua("tuong", "Mì tương đen", { sort_order: 2 }),
    lua("phomai", "Mì phô mai", { sort_order: 3 }),
    lua("suon", "Mì sườn bò", { sort_order: 4 }),
  ],
};

const TOPPING: OptionGroup = {
  id: "g-tp",
  menu_item_id: "mi-tron",
  name: "Topping",
  kind: "nhieu",
  min_qty: 1,
  included_qty: 1,
  extra_unit_price: 5000,
  max_qty_per_choice: 5,
  sort_order: 2,
  choices: [
    lua("ga-pm", "Gà sốt phô mai", { sort_order: 1 }),
    lua("ga-cn", "Gà sốt chua ngọt", { sort_order: 2 }),
    lua("trung", "Trứng xúc xích", { sort_order: 3 }),
    lua("mamtoi", "Cá viên sốt mắm tỏi", { sort_order: 5, requires_choice_id: "thuong" }),
  ],
};

const MI_TRON = [LOAI_MI, TOPPING];
const GIA_GOC = 20000;

describe("Giá mì trộn", () => {
  it("20.000đ đã gồm 1 phần topping", () => {
    expect(giaCauHinh(GIA_GOC, MI_TRON, { phomai: 1, "ga-cn": 1 })).toBe(20000);
  });

  it("thêm topping khác +5.000đ", () => {
    expect(
      giaCauHinh(GIA_GOC, MI_TRON, { phomai: 1, "ga-cn": 1, trung: 1 }),
    ).toBe(25000);
  });

  it("đã gà thêm gà vẫn +5.000đ", () => {
    expect(giaCauHinh(GIA_GOC, MI_TRON, { phomai: 1, "ga-cn": 2 })).toBe(25000);
  });

  it("4 phần topping = 20.000 + 3 × 5.000", () => {
    expect(
      giaCauHinh(GIA_GOC, MI_TRON, { tuong: 1, "ga-cn": 2, trung: 1, "ga-pm": 1 }),
    ).toBe(35000);
  });

  it("loại mì nào cũng cùng giá", () => {
    for (const mi of ["thuong", "tuong", "phomai", "suon"]) {
      expect(giaCauHinh(GIA_GOC, MI_TRON, { [mi]: 1, trung: 1 })).toBe(20000);
    }
  });

  it("thẻ món hiện 'từ 20.000đ'", () => {
    expect(giaThapNhat(GIA_GOC, MI_TRON)).toBe(20000);
  });

  it("price_delta của lựa chọn được cộng theo số phần", () => {
    const dat: OptionGroup = {
      ...TOPPING,
      choices: [lua("tom", "Tôm", { price_delta: 3000 })],
    };
    // 2 phần tôm: 1 phần đã gồm + 1 phần thêm 5000, cộng 2 × 3000 phụ phí
    expect(giaCauHinh(GIA_GOC, [LOAI_MI, dat], { thuong: 1, tom: 2 })).toBe(31000);
  });
});

describe("Luật cá viên sốt mắm tỏi chỉ đi với mì trộn thường", () => {
  const mamToi = TOPPING.choices.find((c) => c.id === "mamtoi")!;
  const phoMai = LOAI_MI.choices.find((c) => c.id === "phomai")!;
  const thuong = LOAI_MI.choices.find((c) => c.id === "thuong")!;

  it("chưa chọn gì thì chọn được cả hai", () => {
    expect(lyDoBiKhoa(mamToi, MI_TRON, {})).toBeNull();
    expect(lyDoBiKhoa(phoMai, MI_TRON, {})).toBeNull();
  });

  it("đã chọn mì phô mai thì cá viên mắm tỏi bị khoá", () => {
    expect(lyDoBiKhoa(mamToi, MI_TRON, { phomai: 1 })).toBe(
      "Chỉ đi với Mì trộn thường",
    );
  });

  it("đã chọn cá viên mắm tỏi thì mì phô mai bị khoá, mì thường vẫn chọn được", () => {
    expect(lyDoBiKhoa(phoMai, MI_TRON, { mamtoi: 1 })).toBe(
      "Không đi với Cá viên sốt mắm tỏi",
    );
    expect(lyDoBiKhoa(thuong, MI_TRON, { mamtoi: 1 })).toBeNull();
  });

  it("mì thường + cá viên mắm tỏi là hợp lệ", () => {
    expect(kiemTraCauHinh(MI_TRON, { thuong: 1, mamtoi: 1 })).toEqual([]);
  });

  it("mì phô mai + cá viên mắm tỏi bị từ chối kể cả khi gửi thẳng lên", () => {
    expect(kiemTraCauHinh(MI_TRON, { phomai: 1, mamtoi: 1 }).length).toBeGreaterThan(0);
  });
});

describe("Kiểm tra cấu hình", () => {
  it("bắt buộc chọn loại mì", () => {
    expect(kiemTraCauHinh(MI_TRON, { trung: 1 })).toContain("Chọn loại mì.");
  });

  it("bắt buộc ít nhất 1 topping", () => {
    expect(kiemTraCauHinh(MI_TRON, { tuong: 1 })).toContain("Chọn topping.");
  });

  it("không được chọn 2 loại mì", () => {
    expect(
      kiemTraCauHinh(MI_TRON, { tuong: 1, phomai: 1, trung: 1 }),
    ).toContain("Chỉ được chọn 1 loại mì.");
  });

  it("vượt số phần tối đa của một topping bị từ chối", () => {
    expect(
      kiemTraCauHinh(MI_TRON, { tuong: 1, trung: 6 }).some((l) => l.includes("tối đa")),
    ).toBe(true);
  });

  it("lựa chọn tạm hết bị từ chối", () => {
    const hetTrung: OptionGroup = {
      ...TOPPING,
      choices: TOPPING.choices.map((c) =>
        c.id === "trung" ? { ...c, is_available: false } : c,
      ),
    };
    expect(kiemTraCauHinh([LOAI_MI, hetTrung], { tuong: 1, trung: 1 }).length).toBeGreaterThan(0);
  });

  it("món không có tuỳ chọn luôn hợp lệ", () => {
    expect(kiemTraCauHinh([], {})).toEqual([]);
  });
});

describe("Gộp dòng giỏ hàng và mô tả", () => {
  it("cùng cấu hình ra cùng khoá, không phụ thuộc thứ tự", () => {
    expect(khoaCauHinh({ trung: 1, phomai: 1 })).toBe(
      khoaCauHinh({ phomai: 1, trung: 1 }),
    );
  });

  it("khác loại mì ra khoá khác", () => {
    expect(khoaCauHinh({ phomai: 1, trung: 1 })).not.toBe(
      khoaCauHinh({ tuong: 1, trung: 1 }),
    );
  });

  it("lựa chọn 0 phần bị bỏ qua", () => {
    expect(chuanHoa({ a: 0, b: 2, c: -1 })).toEqual({ b: 2 });
    expect(khoaCauHinh({ a: 0, b: 1 })).toBe(khoaCauHinh({ b: 1 }));
  });

  it("mô tả đọc được, có ×2 khi gấp đôi", () => {
    expect(moTaCauHinh(MI_TRON, { "ga-cn": 2, phomai: 1, trung: 1 })).toBe(
      "Mì phô mai · Gà sốt chua ngọt ×2, Trứng xúc xích",
    );
  });
});
