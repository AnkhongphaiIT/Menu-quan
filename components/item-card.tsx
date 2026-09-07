import Image from "next/image";
import type { MenuItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";

type Props = {
  item: MenuItem;
  /** Biểu tượng của danh mục, dùng làm ảnh tạm khi món chưa có ảnh thật. */
  bieuTuong: string;
  /**
   * Hàm gọi khi khách bấm nút +.
   *
   * Giai đoạn 3 chưa truyền vào — nút hiện ra nhưng chưa có tác dụng, đúng theo
   * kế hoạch ("chưa làm giỏ hàng"). Giai đoạn 4 sẽ truyền hàm thêm vào giỏ vào
   * đây, không phải sửa lại thẻ món.
   */
  onThem?: (item: MenuItem) => void;
};

export function ItemCard({ item, bieuTuong, onThem }: Props) {
  const tamHet = !item.is_available;

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 ${
        tamHet ? "opacity-55" : ""
      }`}
    >
      {/* ---------- Ảnh món ---------- */}
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            /* Ảnh luôn hiển thị ở khung 80px, xin bản 160px cho màn hình nét gấp đôi. */
            sizes="80px"
            className="object-cover"
            /* loading="lazy" là mặc định của next/image: ảnh dưới màn hình chỉ tải
               khi khách cuộn tới. Với 54 món thì đây là khác biệt rất lớn về tốc độ. */
          />
        ) : (
          /* Món chưa có ảnh: hiện biểu tượng danh mục thay vì để trống trơn.
             aria-hidden vì đây chỉ là trang trí, tên món đã nằm ngay bên cạnh. */
          <span
            aria-hidden
            className="grid size-full place-items-center text-3xl"
          >
            {bieuTuong}
          </span>
        )}
      </div>

      {/* ---------- Tên, mô tả, giá ---------- */}
      <div className="min-w-0 flex-1">
        <p className="text-base leading-snug font-medium text-fg">
          {item.name}
          {tamHet && (
            <span className="ml-2 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs font-medium text-muted">
              Tạm hết
            </span>
          )}
        </p>

        {item.description && (
          <p className="mt-0.5 text-sm leading-snug text-muted">
            {item.description}
          </p>
        )}

        <p className="mt-1 text-base font-bold text-brand">
          {formatPrice(item.price)}
        </p>
      </div>

      {/* ---------- Nút thêm ---------- */}
      {tamHet ? (
        /* Món tạm hết: vẫn giữ đúng khoảng trống 44px để hàng không bị lệch,
           nhưng không có nút nào bấm được. */
        <div className="size-11 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={() => onThem?.(item)}
          /* size-11 = 44x44px — mức tối thiểu để ngón tay bấm trúng (yêu cầu F1) */
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-2xl leading-none font-medium text-brand-fg transition-transform active:scale-90"
          aria-label={`Thêm ${item.name}`}
        >
          <span aria-hidden>+</span>
        </button>
      )}
    </li>
  );
}
