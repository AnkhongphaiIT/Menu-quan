import type { Category, MenuItem, ShopSettings } from "./types";
import { formatPrice } from "./format";

/**
 * NHỮNG GÌ GOOGLE ĐỌC ĐƯỢC VỀ QUÁN.
 *
 * Khách gõ "ăn cùng dì hai" lên Google thì Google phải biết trang này là của
 * quán đó. Nó biết qua ba chỗ, đều lấy từ database để chủ quán sửa trong trang
 * admin là Google thấy theo:
 *
 * 1. Tiêu đề + mô tả (thẻ <title>, <meta description>) — hai dòng hiện trong
 *    kết quả tìm kiếm.
 * 2. Dữ liệu có cấu trúc JSON-LD kiểu Restaurant — nói thẳng với Google đây là
 *    một quán ăn, tên gì, ở đâu, số điện thoại, bán món gì giá bao nhiêu.
 * 3. sitemap.xml + robots.txt — chỉ đường cho Google vào đọc.
 */

/** Đổi sang tên miền riêng thì đặt biến môi trường này trên Vercel, khỏi sửa code. */
export const DIA_CHI_WEB = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ancungdihai.vercel.app"
).replace(/\/+$/, "");

export function tenQuanCua(quan: ShopSettings | null): string {
  return quan?.shop_name?.trim() || "Quán ăn vặt";
}

export function tieuDeTrang(tenQuan: string): string {
  return `${tenQuan} – Menu & bảng giá`;
}

/** Google cắt mô tả ở khoảng 155–160 ký tự, phần sau không hiện. */
const DO_DAI_MO_TA = 158;

/**
 * Mô tả hiện dưới tiêu đề trong kết quả Google.
 *
 * Kể tên các danh mục thật của quán — người ta hay tìm "mì trộn gần đây",
 * "bánh tráng trộn [quận]" — và địa chỉ nếu đã nhập. Danh mục nào không vừa
 * độ dài thì bỏ bớt, không cắt giữa chữ.
 */
export function moTaTrang(
  tenQuan: string,
  danhMuc: Pick<Category, "name">[],
  quan: ShopSettings | null,
): string {
  const diaChi = quan?.address?.trim();
  const duoi =
    ". Xem menu, giá từng món và tạm tính tiền ngay trên điện thoại." +
    (diaChi ? ` Địa chỉ: ${diaChi}.` : "");

  let mon = "";
  for (const dm of danhMuc) {
    const thu = mon ? `${mon}, ${dm.name.toLowerCase()}` : dm.name.toLowerCase();
    if (`${tenQuan}: ${thu}${duoi}`.length > DO_DAI_MO_TA) break;
    mon = thu;
  }

  return mon ? `${tenQuan}: ${mon}${duoi}` : `${tenQuan}${duoi}`;
}

/** Khoảng giá kiểu "20.000đ – 35.000đ" để Google hiện mức giá của quán. */
export function khoangGia(monAn: Pick<MenuItem, "price">[]): string | null {
  const gia = monAn.map((m) => m.price).filter((g) => g > 0);
  if (gia.length === 0) return null;
  const thap = Math.min(...gia);
  const cao = Math.max(...gia);
  return thap === cao
    ? formatPrice(thap)
    : `${formatPrice(thap)} – ${formatPrice(cao)}`;
}

/**
 * Dữ liệu có cấu trúc schema.org/Restaurant.
 *
 * Trường nào chủ quán chưa nhập (địa chỉ, điện thoại...) thì bỏ hẳn, không
 * điền rỗng — Google coi trường rỗng là dữ liệu lỗi.
 */
export function duLieuCauTruc(
  quan: ShopSettings | null,
  danhMuc: Category[],
  monAn: MenuItem[],
): Record<string, unknown> {
  const ten = tenQuanCua(quan);
  const coGiaTri = <T,>(v: T | null | undefined): v is T =>
    v !== null && v !== undefined && String(v).trim() !== "";

  const trangMangXaHoi = [
    quan?.facebook_url,
    quan?.instagram_url,
    quan?.tiktok_url,
    quan?.zalo_url,
  ].filter(coGiaTri);

  const thucDon = danhMuc
    .map((dm) => ({
      "@type": "MenuSection",
      name: dm.name,
      hasMenuItem: monAn
        .filter((m) => m.category_id === dm.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((m) => ({
          "@type": "MenuItem",
          name: m.name,
          ...(coGiaTri(m.description) ? { description: m.description } : {}),
          offers: {
            "@type": "Offer",
            price: m.price,
            priceCurrency: "VND",
            availability: m.is_available
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        })),
    }))
    .filter((phan) => phan.hasMenuItem.length > 0);

  const gia = khoangGia(monAn);
  const diaChi = quan?.address?.trim();
  const dienThoai = quan?.phone?.trim();
  const banDo = quan?.map_url?.trim();

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: ten,
    url: `${DIA_CHI_WEB}/`,
    servesCuisine: ["Ăn vặt", "Món Việt"],
    currenciesAccepted: "VND",
    ...(gia ? { priceRange: gia } : {}),
    ...(diaChi
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: diaChi,
            addressCountry: "VN",
          },
        }
      : {}),
    ...(dienThoai ? { telephone: dienThoai } : {}),
    ...(banDo ? { hasMap: banDo } : {}),
    ...(trangMangXaHoi.length > 0 ? { sameAs: trangMangXaHoi } : {}),
    hasMenu: {
      "@type": "Menu",
      name: `Menu ${ten}`,
      url: `${DIA_CHI_WEB}/`,
      inLanguage: "vi",
      hasMenuSection: thucDon,
    },
  };
}

/**
 * Chuyển sang chuỗi để nhét vào thẻ <script>. Thay dấu "<" bằng mã unicode của nó để một
 * tên món kiểu "</script>..." không phá được trang (hướng dẫn JSON-LD của Next).
 */
export function chuoiJsonLd(du: Record<string, unknown>): string {
  return JSON.stringify(du).replace(/</g, "\\u003c");
}
