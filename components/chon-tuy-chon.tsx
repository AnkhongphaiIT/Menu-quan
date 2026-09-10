"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  giaCauHinh,
  kiemTraCauHinh,
  lyDoBiKhoa,
  tongPhanTrongNhom,
  type LuaChon,
} from "@/lib/tuy-chon";
import type { MenuItem, OptionGroup } from "@/lib/types";

/**
 * Bảng chọn tuỳ chọn cho khách (loại mì, topping, loại sợi...), mở từ đáy.
 *
 * Toàn bộ luật — giá, bắt buộc chọn, "chỉ đi với" — nằm ở lib/tuy-chon.ts.
 * File này chỉ vẽ ra và gọi vào đó, để luật chỉ có MỘT chỗ duy nhất.
 */
export function ChonTuyChon({
  mon,
  cacNhom,
  onThem,
  dong,
}: {
  mon: MenuItem;
  cacNhom: OptionGroup[];
  onThem: (luaChon: LuaChon) => void;
  dong: () => void;
}) {
  const [luaChon, datLuaChon] = useState<LuaChon>({});
  const [loi, datLoi] = useState<string | null>(null);
  const nutDongRef = useRef<HTMLButtonElement>(null);

  const gia = giaCauHinh(mon.price, cacNhom, luaChon);

  /* Khoá cuộn trang phía sau, bấm Esc để đóng. */
  useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nutDongRef.current?.focus();
    const khiBam = (e: KeyboardEvent) => {
      if (e.key === "Escape") dong();
    };
    window.addEventListener("keydown", khiBam);
    return () => {
      document.body.style.overflow = cu;
      window.removeEventListener("keydown", khiBam);
    };
  }, [dong]);

  function datSoPhan(id: string, sl: number) {
    datLoi(null);
    datLuaChon((cu) => {
      const moi = { ...cu };
      if (sl <= 0) delete moi[id];
      else moi[id] = sl;
      return moi;
    });
  }

  function chonMot(nhom: OptionGroup, id: string) {
    datLoi(null);
    datLuaChon((cu) => {
      const moi = { ...cu };
      for (const c of nhom.choices) delete moi[c.id];
      moi[id] = 1;
      return moi;
    });
  }

  function bamThem() {
    const cacLoi = kiemTraCauHinh(cacNhom, luaChon);
    if (cacLoi.length > 0) {
      datLoi(cacLoi[0]);
      return;
    }
    onThem(luaChon);
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Đóng"
        onClick={dong}
        className="absolute inset-0 bg-black/50"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tieu-de-tuy-chon"
        className="relative flex max-h-[90vh] flex-col rounded-t-3xl border-t border-line bg-bg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id="tieu-de-tuy-chon" className="text-lg font-bold text-fg">
              {mon.name}
            </h2>
            {mon.description && (
              <p className="mt-0.5 text-sm text-muted">{mon.description}</p>
            )}
          </div>
          <button
            ref={nutDongRef}
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="grid size-11 shrink-0 place-items-center rounded-full text-2xl text-muted"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {cacNhom.map((nhom, i) => (
            <fieldset key={nhom.id} className="mb-5">
              <legend className="mb-2 text-base font-bold text-fg">
                {i + 1}. {nhom.name}
                {nhom.min_qty > 0 && (
                  <span className="ml-1 text-brand" aria-label="bắt buộc">
                    *
                  </span>
                )}
                {nhom.kind === "nhieu" && nhom.included_qty > 0 && (
                  <span className="mt-0.5 block text-sm font-normal text-muted">
                    Đã gồm {nhom.included_qty} phần
                    {nhom.extra_unit_price > 0 &&
                      `, thêm mỗi phần +${formatPrice(nhom.extra_unit_price)}`}
                  </span>
                )}
              </legend>

              <div className="flex flex-col gap-2">
                {nhom.choices.map((c) => {
                  const lyDo = lyDoBiKhoa(c, cacNhom, luaChon);
                  const sl = luaChon[c.id] ?? 0;
                  const dangChon = sl > 0;
                  /* Đang chọn thì vẫn cho bấm để bỏ ra, dù bị khoá — tránh kẹt */
                  const khoa = lyDo !== null && !dangChon;

                  return nhom.kind === "mot" ? (
                    <label
                      key={c.id}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-2 ${
                        dangChon ? "border-brand bg-brand-soft" : "border-line bg-surface"
                      } ${khoa ? "opacity-45" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name={nhom.id}
                        checked={dangChon}
                        disabled={khoa}
                        onChange={() => chonMot(nhom, c.id)}
                        className="size-5 shrink-0 accent-[var(--brand)]"
                      />
                      <span className="min-w-0 flex-1 text-base text-fg">
                        {c.name}
                        {(c.description || lyDo) && (
                          <span className="block text-sm text-muted">
                            {lyDo ?? c.description}
                          </span>
                        )}
                      </span>
                      {c.price_delta > 0 && (
                        <span className="text-sm text-muted">
                          +{formatPrice(c.price_delta)}
                        </span>
                      )}
                    </label>
                  ) : (
                    <div
                      key={c.id}
                      className={`flex min-h-12 items-center gap-3 rounded-xl border px-4 py-2 ${
                        dangChon ? "border-brand bg-brand-soft" : "border-line bg-surface"
                      } ${khoa ? "opacity-45" : ""}`}
                    >
                      <span className="min-w-0 flex-1 text-base text-fg">
                        {c.name}
                        {(c.description || lyDo) && (
                          <span className="block text-sm text-muted">
                            {lyDo ?? c.description}
                          </span>
                        )}
                      </span>

                      <div className="flex shrink-0 items-center gap-1">
                        {dangChon && (
                          <>
                            <button
                              type="button"
                              onClick={() => datSoPhan(c.id, sl - 1)}
                              aria-label={`Bớt một phần ${c.name}`}
                              className="grid size-11 place-items-center rounded-full border border-line text-xl text-fg"
                            >
                              <span aria-hidden>−</span>
                            </button>
                            <span
                              className="min-w-6 text-center text-base font-medium text-fg"
                              aria-live="polite"
                            >
                              {sl}
                            </span>
                          </>
                        )}
                        <button
                          type="button"
                          disabled={khoa || sl >= nhom.max_qty_per_choice}
                          onClick={() => datSoPhan(c.id, sl + 1)}
                          aria-label={`Thêm một phần ${c.name}`}
                          className="grid size-11 place-items-center rounded-full bg-brand text-xl text-brand-fg disabled:opacity-40"
                        >
                          <span aria-hidden>+</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {nhom.kind === "nhieu" && (
                <DongGhiChuPhan nhom={nhom} luaChon={luaChon} />
              )}
            </fieldset>
          ))}
        </div>

        <div className="border-t border-line px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {loi && (
            <p role="alert" className="mb-2 text-sm text-fg">
              {loi}
            </p>
          )}
          <button
            type="button"
            onClick={bamThem}
            className="h-12 w-full rounded-full bg-brand text-base font-medium text-brand-fg"
          >
            Thêm vào giỏ · {formatPrice(gia)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** "Đã chọn 3 phần — 2 phần tính thêm" để khách hiểu vì sao giá tăng. */
function DongGhiChuPhan({
  nhom,
  luaChon,
}: {
  nhom: OptionGroup;
  luaChon: LuaChon;
}) {
  const tong = tongPhanTrongNhom(nhom, luaChon);
  const tinhThem = Math.max(0, tong - nhom.included_qty);
  if (tong === 0) return null;
  return (
    <p className="mt-2 text-sm text-muted" aria-live="polite">
      Đã chọn {tong} phần
      {tinhThem > 0 &&
        nhom.extra_unit_price > 0 &&
        ` — ${tinhThem} phần tính thêm (+${formatPrice(tinhThem * nhom.extra_unit_price)})`}
    </p>
  );
}
