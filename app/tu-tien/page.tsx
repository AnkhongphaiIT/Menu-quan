import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { NutTuTien } from "@/components/nut-tu-tien";
import { ThemeToggle } from "@/components/theme-toggle";
import { DanhSachMonTuTien } from "@/components/tu-tien/danh-sach-mon";
import { GioHangTuTien } from "@/components/tu-tien/gio-hang";
import { ThongBaoKhoiPhucTuTien } from "@/components/tu-tien/thong-bao-khoi-phuc";
import { bangBieuTuong } from "@/lib/bieu-tuong";
import { CartProvider } from "@/lib/cart-context";
import { layDuLieuMenuMotLan } from "@/lib/queries";
import { tenQuanCua } from "@/lib/seo";
import { khoacAo } from "@/lib/tu-tien/du-lieu";
import { layBangTuTien } from "@/lib/tu-tien/queries";

/**
 * TRANG MENU CHẾ ĐỘ TU TIÊN — tách riêng hẳn khỏi trang thường (app/page.tsx).
 *
 * Đọc menu thật y như trang thường, đọc thêm 4 bảng chữ tu tiên, rồi "khoác
 * áo" (lib/tu-tien/du-lieu.ts). Bảng tu tiên lỗi thì hiện tên thật, không bao
 * giờ ra trang trắng. Trang thường không đọc gì của phần tu tiên.
 *
 * Dựng sẵn và làm mới mỗi 60 giây giống trang thường; chủ quán sửa trong
 * admin thì trang này được làm mới ngay.
 */
export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const { thongTinQuan } = await layDuLieuMenuMotLan();
  return {
    title: `${tenQuanCua(thongTinQuan)} – Chế độ tu tiên`,
    /* Không cho Google đọc: nội dung trùng trang chính, để Google chỉ tập
       trung vào trang chính mà chủ quán đã đăng ký trên Search Console. */
    robots: { index: false, follow: true },
  };
}

export default async function TrangTuTien() {
  const [{ danhMuc, monAn, nhomTheoMon, thongTinQuan, loi }, bang] =
    await Promise.all([layDuLieuMenuMotLan(), layBangTuTien()]);

  const ao = khoacAo(bang, danhMuc, monAn, nhomTheoMon);

  return (
    <CartProvider>
      <header className="mx-auto flex w-full max-w-2xl items-start justify-between gap-3 px-4 pt-6 pb-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-fg">{tenQuanCua(thongTinQuan)}</h1>
          <p className="mt-1 text-sm text-muted">
            Khách quan chọn món rồi gọi tiểu nhị nhé
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <NutTuTien dangBat />
          <ThemeToggle />
        </div>
      </header>

      <p className="mx-auto w-full max-w-2xl px-4 pt-1 text-xs text-muted">
        Tên thật của món ghi nhỏ dưới mỗi tên tu tiên. Giá tính bằng VNĐ.
      </p>

      <main className="flex-1">
        {loi || ao.monAn.length === 0 ? (
          <div className="mx-auto w-full max-w-2xl px-4 pt-8">
            <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
              <p className="text-base font-medium text-fg">Tàng Kinh Các tạm đóng cửa</p>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                Chưa đọc được menu. Khách quan vui lòng gọi món trực tiếp với
                nhân viên, hoặc tắt chế độ tu tiên để xem menu thường.
              </p>
            </div>
          </div>
        ) : (
          <DanhSachMonTuTien
            categories={ao.danhMuc}
            items={ao.monAn}
            nhomTheoMon={ao.nhomTheoMon}
            bieuTuong={bangBieuTuong(danhMuc)}
          />
        )}
      </main>

      <Footer quan={thongTinQuan} />

      <ThongBaoKhoiPhucTuTien />
      <GioHangTuTien menu={ao.monAn} nhomTheoMon={ao.nhomTheoMon} />
    </CartProvider>
  );
}
