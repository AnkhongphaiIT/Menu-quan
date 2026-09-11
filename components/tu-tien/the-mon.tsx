import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { canHienTenThat, type MonTT } from "@/lib/tu-tien/du-lieu";

/**
 * Thẻ món của trang tu tiên — chép từ components/item-card.tsx rồi sửa.
 *
 * Cố ý CHÉP chứ không dùng chung, theo yêu cầu tách riêng hẳn của chủ quán:
 * sửa ở đây không bao giờ làm hỏng trang thường. Đổi lại, khi sửa giao diện
 * thẻ món ở trang thường thì nhớ xem có cần sửa file này không.
 *
 * Khác bản thường: tên tu tiên là chữ chính, tên thật là dòng nhỏ ngay dưới —
 * khách dị ứng hay nhân viên nhìn vào vẫn biết ngay đây là món gì.
 */
export function TheMonTuTien({
  item,
  bieuTuong,
  onThem,
  coTuyChon = false,
  giaHienThi,
}: {
  item: MonTT;
  bieuTuong: string;
  onThem: (item: MonTT) => void;
  coTuyChon?: boolean;
  giaHienThi?: number;
}) {
  const tamHet = !item.is_available;

  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 ${
        tamHet ? "opacity-55" : ""
      }`}
    >
      <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.tenThat}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span aria-hidden className="grid size-full place-items-center text-3xl">
            {bieuTuong}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base leading-snug font-bold text-fg">
          {item.name}
          {tamHet && (
            <span className="ml-2 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs font-medium text-muted">
              Tạm hết — linh khí đã cạn
            </span>
          )}
        </p>

        {canHienTenThat(item.name, item.tenThat) && (
          <p className="text-sm leading-snug text-muted">{item.tenThat}</p>
        )}

        {item.description && (
          <p className="mt-1 text-sm leading-snug text-fg/80 italic">
            {item.description}
          </p>
        )}

        <p className="mt-1 text-base font-bold text-brand">
          {coTuyChon
            ? `từ ${formatPrice(giaHienThi ?? item.price)}`
            : formatPrice(item.price)}
        </p>
      </div>

      {tamHet ? (
        <div className="size-11 shrink-0" aria-hidden />
      ) : (
        <button
          type="button"
          onClick={() => onThem(item)}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-2xl leading-none font-medium text-brand-fg transition-transform active:scale-90"
          aria-label={coTuyChon ? `Chọn ${item.tenThat}` : `Thêm ${item.tenThat}`}
        >
          <span aria-hidden>+</span>
        </button>
      )}
    </li>
  );
}
