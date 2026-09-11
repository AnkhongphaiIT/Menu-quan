import { CartBar } from "@/components/cart-bar";
import { Footer } from "@/components/footer";
import { MenuBrowser } from "@/components/menu-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { ToastKhoiPhuc } from "@/components/toast-khoi-phuc";
import { bangBieuTuong } from "@/lib/bieu-tuong";
import { CartProvider } from "@/lib/cart-context";
import type { Metadata } from "next";
import { layDuLieuMenuMotLan } from "@/lib/queries";
import {
  chuoiJsonLd,
  duLieuCauTruc,
  moTaTrang,
  tenQuanCua,
  tieuDeTrang,
} from "@/lib/seo";

/**
 * Dựng sẵn trang thành file tĩnh, làm mới lại sau mỗi 60 giây (yêu cầu F7).
 *
 * Nghĩa là: 50 khách quét QR cùng lúc chỉ là 50 lượt tải file từ CDN, database
 * gần như không bị đụng tới. Trong 60 giây đó dù có 1000 lượt xem thì Supabase
 * cũng chỉ bị hỏi đúng 1 lần.
 *
 * Chủ quán sửa món trong trang admin thì không phải chờ 60 giây: Giai đoạn 6 sẽ
 * gọi revalidatePath('/') sau mỗi lần ghi, trang khách cập nhật trong vài giây.
 */
export const revalidate = 60;

/**
 * Tiêu đề và mô tả hiện trên Google, Zalo, Facebook khi ai đó tìm hoặc gửi
 * link. Lấy tên quán từ mục Cài đặt trong admin — đổi tên ở đó là Google
 * thấy theo ở lần ghé sau.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { danhMuc, thongTinQuan } = await layDuLieuMenuMotLan();
  const ten = tenQuanCua(thongTinQuan);
  const tieuDe = tieuDeTrang(ten);
  const moTa = moTaTrang(ten, danhMuc, thongTinQuan);

  return {
    title: tieuDe,
    description: moTa,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      locale: "vi_VN",
      url: "/",
      siteName: ten,
      title: tieuDe,
      description: moTa,
    },
  };
}

export default async function TrangMenu() {
  const { danhMuc, monAn, nhomTheoMon, thongTinQuan, loi } =
    await layDuLieuMenuMotLan();

  const tenQuan = tenQuanCua(thongTinQuan);

  return (
    <CartProvider>
      {!loi && (
        <script
          type="application/ld+json"
          /* Khai với Google: đây là một quán ăn, tên, địa chỉ, món và giá.
             Xem lib/seo.ts. */
          dangerouslySetInnerHTML={{
            __html: chuoiJsonLd(duLieuCauTruc(thongTinQuan, danhMuc, monAn)),
          }}
        />
      )}
      <header className="mx-auto flex w-full max-w-2xl items-start justify-between gap-3 px-4 pt-6 pb-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-fg">{tenQuan}</h1>
          <p className="mt-1 text-sm text-muted">
            Chọn món rồi gọi với nhân viên nhé
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1">
        {loi ? (
          <ThongBao
            tieuDe={
              loi === "chua-cau-hinh"
                ? "Chưa nối với kho dữ liệu"
                : "Không đọc được menu"
            }
            noiDung={
              loi === "chua-cau-hinh"
                ? "Website chưa được khai báo địa chỉ kho dữ liệu Supabase. Kiểm tra file .env.local trên máy, hoặc mục Environment Variables trên Vercel."
                : "Kho dữ liệu đang trục trặc. Vui lòng gọi món trực tiếp với nhân viên, và thử tải lại trang sau ít phút."
            }
          />
        ) : danhMuc.length === 0 || monAn.length === 0 ? (
          <ThongBao
            tieuDe="Menu chưa có món nào"
            noiDung="Chủ quán vào trang quản trị để thêm danh mục và món ăn. Sau khi thêm, menu sẽ hiện ở đây trong vài giây."
          />
        ) : (
          <MenuBrowser
            categories={danhMuc}
            items={monAn}
            nhomTheoMon={nhomTheoMon}
            bieuTuong={bangBieuTuong(danhMuc)}
          />
        )}
      </main>

      <Footer quan={thongTinQuan} />

      <ToastKhoiPhuc />
      <CartBar menu={monAn} nhomTheoMon={nhomTheoMon} />
    </CartProvider>
  );
}

/**
 * Khung thông báo dùng chung cho các trường hợp không có món để hiện.
 *
 * Cố ý viết bằng lời khách hiểu được, không phải mã lỗi kỹ thuật — khách quét
 * QR mà thấy "Error 500" thì hoang mang, còn thấy "gọi món với nhân viên" thì
 * vẫn ăn uống bình thường.
 */
function ThongBao({
  tieuDe,
  noiDung,
}: {
  tieuDe: string;
  noiDung: string;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-8">
      <div className="rounded-2xl border border-line bg-surface px-5 py-10 text-center">
        <p className="text-base font-medium text-fg">{tieuDe}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {noiDung}
        </p>
      </div>
    </div>
  );
}
