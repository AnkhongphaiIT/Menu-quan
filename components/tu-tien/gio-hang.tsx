"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { ghepVoiMenu, tongTien } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import {
  canHienTenThat,
  coiAo,
  type MonTT,
  type NhomTT,
} from "@/lib/tu-tien/du-lieu";

/**
 * "Túi Trữ Vật" — giỏ hàng của trang tu tiên, chép từ components/cart-bar.tsx.
 *
 * Dùng CHUNG giỏ hàng với trang thường (cùng lib/cart-store.ts, cùng mã món),
 * nên khách chuyển qua lại giữa hai chế độ không mất món nào.
 *
 * Mỗi dòng ghi cả tên tu tiên lẫn tên thật + lựa chọn thật (loại mì, cấp cay...)
 * — khách đưa điện thoại cho nhân viên thì nhân viên đọc dòng thật là làm được.
 */
export function GioHangTuTien({
  menu,
  nhomTheoMon,
}: {
  menu: MonTT[];
  nhomTheoMon: Record<string, NhomTT[]>;
}) {
  const { gioHang, soMon, them, bot, xoa, xoaSach } = useCart();
  const [dangMo, datDangMo] = useState(false);
  const nutDongRef = useRef<HTMLButtonElement>(null);

  const that = useMemo(() => coiAo(menu, nhomTheoMon), [menu, nhomTheoMon]);
  const dong = ghepVoiMenu(gioHang, menu, nhomTheoMon);
  /* Cùng giỏ, cùng mã, cùng luật lọc → hai danh sách khớp nhau từng dòng. */
  const dongThat = new Map(
    ghepVoiMenu(gioHang, that.monAn, that.nhomTheoMon).map((d) => [d.khoa, d]),
  );
  const tenThat = new Map(menu.map((m) => [m.id, m.tenThat]));
  const tong = tongTien(dong);

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

  if (soMon === 0) {
    if (dangMo) datDangMo(false);
    return null;
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => datDangMo(true)}
          aria-expanded={dangMo}
          aria-label={`Giỏ hàng, ${soMon} món, ${formatPrice(tong)}`}
          className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between gap-3 rounded-full bg-brand px-5 text-brand-fg shadow-lg shadow-black/20"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden className="text-xl">
              🎒
            </span>
            <span className="text-base font-medium">Túi Trữ Vật · {soMon} món</span>
          </span>
          <span className="text-base font-bold">{formatPrice(tong)}</span>
        </button>
      </div>

      {dangMo && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Đóng giỏ hàng"
            onClick={() => datDangMo(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="tieu-de-tui"
            className="relative flex max-h-[85vh] flex-col rounded-t-3xl border-t border-line bg-bg"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 id="tieu-de-tui" className="text-lg font-bold text-fg">
                Túi Trữ Vật của khách quan
                <span className="block text-sm font-normal text-muted">(giỏ hàng)</span>
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

            <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
              {dong.map((d) => {
                const t = dongThat.get(d.khoa);
                const tenMonThat = tenThat.get(d.mon.id) ?? d.mon.name;
                return (
                  <li key={d.khoa} className="py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-base leading-snug font-bold text-fg">
                          {d.mon.name}
                        </p>
                        {d.moTa && (
                          <p className="text-sm leading-snug text-fg">{d.moTa}</p>
                        )}
                        {/* Dòng cho nhân viên: tên thật + lựa chọn thật */}
                        {(canHienTenThat(d.mon.name, tenMonThat) || t?.moTa) && (
                          <p className="mt-0.5 text-sm leading-snug text-muted">
                            {tenMonThat}
                            {t?.moTa ? ` · ${t.moTa}` : ""}
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
                        aria-label={`Bớt một ${tenMonThat}`}
                        className="grid size-11 place-items-center rounded-full border border-line text-2xl leading-none text-fg active:scale-90"
                      >
                        <span aria-hidden>−</span>
                      </button>
                      <span
                        className="min-w-10 text-center text-base font-medium text-fg"
                        aria-live="polite"
                        aria-label={`Số lượng ${tenMonThat}`}
                      >
                        {d.soLuong}
                      </span>
                      <button
                        type="button"
                        onClick={() => them(d.mon.id, d.luaChon)}
                        aria-label={`Thêm một ${tenMonThat}`}
                        className="grid size-11 place-items-center rounded-full border border-line text-2xl leading-none text-fg active:scale-90"
                      >
                        <span aria-hidden>+</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => xoa(d.khoa)}
                        className="ml-auto h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
                      >
                        Bỏ khỏi túi
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="border-t border-line px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="flex items-baseline justify-between">
                <span className="text-base font-medium text-fg">
                  Tổng kết <span className="text-sm font-normal text-muted">(tổng cộng)</span>
                </span>
                <span className="text-2xl font-bold text-brand">{formatPrice(tong)}</span>
              </div>

              {/* BẮT BUỘC (yêu cầu F2): nói rõ đây chỉ là tạm tính. */}
              <p className="mt-2 rounded-xl bg-brand-soft px-3 py-2 text-sm leading-snug text-fg">
                Đây là bảng tổng kết tạm (tạm tính). Khách quan vui lòng gọi món
                với tiểu nhị (nhân viên).
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={xoaSach}
                  className="h-12 flex-1 rounded-full border border-line text-base text-muted"
                >
                  Bỏ hết
                </button>
                <button
                  type="button"
                  onClick={() => datDangMo(false)}
                  className="h-12 flex-2 rounded-full bg-brand text-base font-medium text-brand-fg"
                >
                  Chọn thêm bảo vật
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
