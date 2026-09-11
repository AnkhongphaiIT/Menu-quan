import { describe, expect, it } from "vitest";
import {
  chuoiJsonLd,
  duLieuCauTruc,
  khoangGia,
  moTaTrang,
  tieuDeTrang,
} from "./seo";
import type { Category, MenuItem, ShopSettings } from "./types";

const QUAN: ShopSettings = {
  id: 1,
  shop_name: "Ăn Cùng Dì Hai",
  address: null,
  phone: null,
  open_hours: null,
  facebook_url: null,
  instagram_url: null,
  tiktok_url: null,
  zalo_url: null,
  map_url: null,
};

const DANH_MUC: Category[] = [
  { id: "c1", name: "Mì trộn", slug: "mi-tron", sort_order: 1, is_active: true },
  { id: "c2", name: "Bánh tráng", slug: "banh-trang", sort_order: 2, is_active: true },
  { id: "c3", name: "Rỗng", slug: "rong", sort_order: 3, is_active: true },
];

const mon = (id: string, category_id: string, price: number, is_available = true): MenuItem => ({
  id, category_id, name: `Món ${id}`, description: null, price,
  image_url: null, is_available, sort_order: 1,
});

const MON: MenuItem[] = [
  mon("a", "c1", 20000),
  mon("b", "c2", 25000, false),
  mon("c", "c2", 0),
];

describe("tiêu đề và mô tả trên Google", () => {
  it("tiêu đề có tên quán", () => {
    expect(tieuDeTrang("Ăn Cùng Dì Hai")).toBe("Ăn Cùng Dì Hai – Menu & bảng giá");
  });

  it("mô tả kể tên danh mục và địa chỉ", () => {
    const moTa = moTaTrang("Ăn Cùng Dì Hai", DANH_MUC.slice(0, 2), {
      ...QUAN,
      address: "12 Lê Lợi, Q.1",
    });
    expect(moTa).toContain("mì trộn, bánh tráng");
    expect(moTa).toContain("Địa chỉ: 12 Lê Lợi, Q.1.");
  });

  it("nhiều danh mục thì bỏ bớt cho vừa, không cắt giữa chữ", () => {
    const nhieu = Array.from({ length: 30 }, (_, i) => ({ name: `Danh mục thứ ${i}` }));
    const moTa = moTaTrang("Ăn Cùng Dì Hai", nhieu, QUAN);
    expect(moTa.length).toBeLessThanOrEqual(158);
    expect(moTa).toMatch(/danh mục thứ \d+\. Xem menu/);
  });

  it("chưa có danh mục vẫn ra câu hoàn chỉnh", () => {
    expect(moTaTrang("Ăn Cùng Dì Hai", [], QUAN)).toBe(
      "Ăn Cùng Dì Hai. Xem menu, giá từng món và tạm tính tiền ngay trên điện thoại.",
    );
  });
});

describe("khoảng giá", () => {
  it("bỏ qua món giá 0đ (chưa nhập giá)", () => {
    expect(khoangGia(MON)).toBe("20.000đ – 25.000đ");
  });
  it("một mức giá", () => {
    expect(khoangGia([{ price: 20000 }])).toBe("20.000đ");
  });
  it("không có giá", () => {
    expect(khoangGia([])).toBeNull();
  });
});

describe("dữ liệu có cấu trúc cho Google", () => {
  it("là một quán ăn có tên và thực đơn", () => {
    const du = duLieuCauTruc(QUAN, DANH_MUC, MON);
    expect(du["@type"]).toBe("Restaurant");
    expect(du.name).toBe("Ăn Cùng Dì Hai");
    const menu = du.hasMenu as { hasMenuSection: { name: string; hasMenuItem: unknown[] }[] };
    /* Danh mục không có món thì không khai */
    expect(menu.hasMenuSection.map((s) => s.name)).toEqual(["Mì trộn", "Bánh tráng"]);
    expect(JSON.stringify(du)).toContain("https://schema.org/OutOfStock");
  });

  it("trường chủ quán chưa nhập thì bỏ hẳn, không để rỗng", () => {
    const du = duLieuCauTruc(QUAN, DANH_MUC, MON);
    expect(du).not.toHaveProperty("address");
    expect(du).not.toHaveProperty("telephone");
    expect(du).not.toHaveProperty("sameAs");
  });

  it("nhập rồi thì có", () => {
    const du = duLieuCauTruc(
      { ...QUAN, address: " 12 Lê Lợi ", phone: "0901234567", facebook_url: "https://facebook.com/x", tiktok_url: "  " },
      DANH_MUC,
      MON,
    );
    expect(du.address).toMatchObject({ streetAddress: "12 Lê Lợi" });
    expect(du.telephone).toBe("0901234567");
    expect(du.sameAs).toEqual(["https://facebook.com/x"]);
  });

  it("tên món có </script> không phá được trang", () => {
    const chuoi = chuoiJsonLd({ name: "</script><script>alert(1)</script>" });
    expect(chuoi).not.toContain("<");
    expect(JSON.parse(chuoi).name).toBe("</script><script>alert(1)</script>");
  });
});
