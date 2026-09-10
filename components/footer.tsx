import type { ShopSettings } from "@/lib/types";

/**
 * Chân trang — yêu cầu F6.
 *
 * TOÀN BỘ nội dung lấy từ bảng shop_settings trong database, không viết cứng
 * dòng nào. Nhờ vậy chủ quán đổi số điện thoại hay giờ mở cửa thì tự sửa được
 * trong trang admin, không cần gọi ai sửa code.
 *
 * Mục nào chưa điền thì tự ẩn đi, không hiện ô trống hay chữ "chưa cập nhật".
 */

type LienKet = {
  ten: string;
  bieuTuong: string;
  url: string | null;
};

/** Liên kết đã lọc bỏ những cái chưa điền — url chắc chắn có giá trị. */
type LienKetCoThat = Omit<LienKet, "url"> & { url: string };

/** Số điện thoại phải bỏ hết dấu cách và dấu chấm mới bấm gọi được. */
function chuanHoaSoDienThoai(so: string): string {
  return so.replace(/[^\d+]/g, "");
}

export function Footer({ quan }: { quan: ShopSettings | null }) {
  if (!quan) return null;

  /* Cố ý KHÔNG ghi kiểu là LienKet[] ở đây: ghi vậy sẽ xoá mất kết quả lọc,
     TypeScript lại tưởng url có thể rỗng và báo lỗi ở chỗ dùng href. */
  const cacLienKet: LienKetCoThat[] = (
    [
      { ten: "Facebook", bieuTuong: "📘", url: quan.facebook_url },
      { ten: "Instagram", bieuTuong: "📷", url: quan.instagram_url },
      { ten: "TikTok", bieuTuong: "🎵", url: quan.tiktok_url },
      { ten: "Zalo", bieuTuong: "💬", url: quan.zalo_url },
    ] satisfies LienKet[]
  ).filter((l): l is LienKetCoThat => Boolean(l.url?.trim()));

  const soDienThoai = quan.phone?.trim();
  const diaChi = quan.address?.trim();
  const gioMoCua = quan.open_hours?.trim();
  const banDo = quan.map_url?.trim();

  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-2xl px-4 pt-8 pb-[max(7rem,calc(6rem+env(safe-area-inset-bottom)))]">
        {quan.shop_name?.trim() && (
          <h2 className="text-lg font-bold text-fg">{quan.shop_name}</h2>
        )}

        <dl className="mt-3 space-y-2 text-base">
          {diaChi && (
            <div className="flex gap-2">
              <dt aria-hidden className="shrink-0">
                📍
              </dt>
              <dd className="text-muted">
                <span className="sr-only">Địa chỉ: </span>
                {diaChi}
              </dd>
            </div>
          )}

          {gioMoCua && (
            <div className="flex gap-2">
              <dt aria-hidden className="shrink-0">
                🕐
              </dt>
              <dd className="text-muted">
                <span className="sr-only">Giờ mở cửa: </span>
                {gioMoCua}
              </dd>
            </div>
          )}
        </dl>

        {/* ---------- Hai nút hành động chính ---------- */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          {soDienThoai && (
            /* Link tel: — bấm là điện thoại mở sẵn màn hình gọi.
               Đây là nút quan trọng nhất chân trang: khách muốn hỏi món,
               đặt bàn, hay gọi giao hàng đều bấm vào đây. */
            <a
              href={`tel:${chuanHoaSoDienThoai(soDienThoai)}`}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-base font-medium text-brand-fg"
            >
              <span aria-hidden>📞</span>
              Gọi {soDienThoai}
            </a>
          )}

          {banDo && (
            <a
              href={banDo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-line text-base font-medium text-fg"
            >
              <span aria-hidden>🗺️</span>
              Chỉ đường
            </a>
          )}
        </div>

        {/* ---------- Mạng xã hội ---------- */}
        {cacLienKet.length > 0 && (
          <nav aria-label="Mạng xã hội" className="mt-5">
            <ul className="flex flex-wrap gap-2">
              {cacLienKet.map((l) => (
                <li key={l.ten}>
                  <a
                    href={l.url}
                    target="_blank"
                    /* noopener: chặn trang mới can thiệp ngược vào trang menu.
                       Bắt buộc với mọi link target="_blank". */
                    rel="noopener noreferrer"
                    className="flex h-11 items-center gap-2 rounded-full border border-line px-4 text-base text-fg"
                  >
                    <span aria-hidden>{l.bieuTuong}</span>
                    {l.ten}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </footer>
  );
}
