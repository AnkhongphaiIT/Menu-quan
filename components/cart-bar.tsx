"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { ghepVoiMenu, tongTien } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { MenuItem, OptionGroup } from "@/lib/types";

/**
 * Nút giỏ hàng nổi ở đáy màn hình, và bảng chi tiết mở ra từ dưới lên.
 *
 * Đây CHỈ là bảng tạm tính — khách vẫn phải gọi món với nhân viên.
 * Chưa có đặt món online (yêu cầu F8: giai đoạn này không làm).
 */
export function CartBar({
  menu,
  nhomTheoMon = {},
}: {
  menu: MenuItem[];
  nhomTheoMon?: Record<string, OptionGroup[]>;
}) {
  const { gioHang, soMon, them, bot, xoa, xoaSach } = useCart();
  const [dangMo, datDangMo] = useState(false);
  const nutDongRef = useRef<HTMLButtonElement>(null);

  const dong = ghepVoiMenu(gioHang, menu, nhomTheoMon);
  const tong = tongTien(dong);

  /* Mở bảng thì khoá cuộn trang phía sau, và bấm Esc thì đóng. */
  useEffect(() => {
    if (!dangMo) return;

    const cuOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nutDongRef.current?.focus();

    const khiBamPhim = (e: KeyboardEvent) => {
      if (e.key === "Escape") datDangMo(false);
    };
    window.addEventListener("keydown", khiBamPhim);

    return () => {
      document.body.style.overflow = cuOverflow;
      window.removeEventListener("keydown", khiBamPhim);
    };
  }, [dangMo]);

  /* Giỏ vơi hết thì cả nút lẫn bảng đều biến mất.
     Đồng thời gấp bảng lại, để lát nữa khách thêm món mới thì bảng không tự
     bật ra. Đây là cách React khuyên dùng khi cần chỉnh trạng thái theo dữ
     liệu đầu vào: sửa ngay trong lúc vẽ, không dùng useEffect — dùng effect
     sẽ khiến trang vẽ thừa một lượt. */
  if (soMon === 0) {
    if (dangMo) datDangMo(false);
    return null;
  }

  return (
    <>
      {/* ==================== NÚT NỔI Ở ĐÁY ==================== */}
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => datDangMo(true)}
          aria-expanded={dangMo}
          className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 rounded-full bg-brand px-5 text-brand-fg shadow-lg shadow-black/20"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              🧾
            </span>
            <span className="text-base font-medium">{soMon} món</span>
          </span>
          <span className="text-base font-bold">{formatPrice(tong)}</span>
        </button>
      </div>

      {/* ==================== BẢNG CHI TIẾT ==================== */}
      {dangMo && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Nền mờ phía sau, bấm vào để đóng */}
          <button
            type="button"
            aria-label="Đóng giỏ hàng"
            onClick={() => datDangMo(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tieu-de-gio-hang"
            className="relative flex max-h-[85vh] flex-col rounded-t-3xl border-t border-line bg-bg"
          >
            {/* --- Đầu bảng --- */}
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="tieu-de-gio-hang" className="text-lg font-bold text-fg">
                Giỏ hàng của bạn
              </h2>
              <button
                ref={nutDongRef}
                type="button"
                onClick={() => datDangMo(false)}
                aria-label="Đóng"
                className="grid size-11 place-items-center rounded-full text-2xl text-muted"
              >
                <span aria-hidden>×</span>
              </button>
            </div>

            {/* --- Danh sách món --- */}
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
              {dong.map((d) => (
                <li key={d.khoa} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base leading-snug font-medium text-fg">
                        {d.mon.name}
                      </p>
                      {/* Loại mì, topping... — nhân viên đọc dòng này là biết làm gì */}
                      {d.moTa && (
                        <p className="mt-0.5 text-sm leading-snug text-fg">
                          {d.moTa}
                        </p>
                      )}
                      <p className="mt-0.5 text-sm text-muted">
                        {formatPrice(d.donGia)} / phần
                      </p>
                    </div>
                    <p className="text-base font-bold whitespace-nowrap text-brand">
                      {formatPrice(d.thanhTien)}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => bot(d.khoa)}
                      aria-label={`Bớt một ${d.mon.name}`}
                      className="grid size-11 place-items-center rounded-full border border-line text-2xl leading-none text-fg active:scale-90"
                    >
                      <span aria-hidden>−</span>
                    </button>

                    <span
                      className="min-w-10 text-center text-base font-medium text-fg"
                      aria-live="polite"
                      aria-label={`Số lượng ${d.mon.name}`}
                    >
                      {d.soLuong}
                    </span>

                    <button
                      type="button"
                      onClick={() => them(d.mon.id, d.luaChon)}
                      aria-label={`Thêm một ${d.mon.name}`}
                      className="grid size-11 place-items-center rounded-full border border-line text-2xl leading-none text-fg active:scale-90"
                    >
                      <span aria-hidden>+</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => xoa(d.khoa)}
                      className="ml-auto h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
                    >
                      Xoá món
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            {/* --- Chân bảng: tổng tiền + lời nhắc --- */}
            <div className="border-t border-line px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium text-fg">Tổng cộng</span>
                <span className="text-2xl font-bold text-brand">
                  {formatPrice(tong)}
                </span>
              </div>

              {/* Câu này BẮT BUỘC phải có (yêu cầu F2): giỏ hàng chỉ là bảng
                  tạm tính, chưa phải đơn đặt món. Không được bỏ đi. */}
              <p className="mt-2 rounded-xl bg-brand-soft px-3 py-2 text-sm leading-snug text-fg">
                Đây là bảng tạm tính. Vui lòng gọi món với nhân viên.
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={xoaSach}
                  className="h-12 flex-1 rounded-full border border-line text-base text-muted"
                >
                  Xoá hết
                </button>
                <button
                  type="button"
                  onClick={() => datDangMo(false)}
                  className="h-12 flex-2 rounded-full bg-brand text-base font-medium text-brand-fg"
                >
                  Chọn thêm món
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
