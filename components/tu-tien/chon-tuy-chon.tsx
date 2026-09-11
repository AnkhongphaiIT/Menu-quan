"use client";

import { useEffect, useRef, useState } from "react";
import { formatPrice } from "@/lib/format";
import {
  canHienTenThat,
  type MonTT,
  type NhomTT,
} from "@/lib/tu-tien/du-lieu";
import {
  giaCauHinh,
  kiemTraCauHinh,
  lyDoBiKhoa,
  tongPhanTrongNhom,
  type LuaChon,
} from "@/lib/tuy-chon";

/**
 * Bảng chọn tuỳ chọn của trang tu tiên — chép từ components/chon-tuy-chon.tsx.
 *
 * Luật giá, bắt buộc chọn, "chỉ đi với" vẫn gọi đúng lib/tuy-chon.ts như trang
 * thường, nên giá và luật không bao giờ lệch nhau giữa hai trang.
 *
 * Mọi lựa chọn đều ghi kèm nghĩa thật (mục 5.5 của yêu cầu): "Kết Đan · Cấp 3".
 */
export function ChonTuyChonTuTien({
  mon,
  cacNhom,
  onThem,
  dong,
}: {
  mon: MonTT;
  cacNhom: NhomTT[];
  onThem: (luaChon: LuaChon) => void;
  dong: () => void;
}) {
  const [luaChon, datLuaChon] = useState<LuaChon>({});
  const [loi, datLoi] = useState<string | null>(null);
  const nutDongRef = useRef<HTMLButtonElement>(null);

  const gia = giaCauHinh(mon.price, cacNhom, luaChon);

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

  function chonMot(nhom: NhomTT, id: string) {
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
        aria-labelledby="tieu-de-tuy-chon-tt"
        className="relative flex max-h-[90vh] flex-col rounded-t-3xl border-t border-line bg-bg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 id="tieu-de-tuy-chon-tt" className="text-lg font-bold text-fg">
              {mon.name}
            </h2>
            {canHienTenThat(mon.name, mon.tenThat) && (
              <p className="text-sm text-muted">{mon.tenThat}</p>
            )}
            {mon.description && (
              <p className="mt-1 text-sm text-fg/80 italic">{mon.description}</p>
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
                {canHienTenThat(nhom.name, nhom.tenThat) && (
                  <span className="font-normal text-muted"> · {nhom.tenThat}</span>
                )}
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
                  const khoa = lyDo !== null && !dangChon;
                  const phu = [
                    canHienTenThat(c.name, c.tenThat) ? c.tenThat : null,
                    lyDo ?? c.description,
                  ]
                    .filter(Boolean)
                    .join(" · ");

                  const ten = (
                    <span className="min-w-0 flex-1 text-base text-fg">
                      {c.name}
                      {phu && <span className="block text-sm text-muted">{phu}</span>}
                    </span>
                  );

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
                      {ten}
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
                      {ten}
                      <div className="flex shrink-0 items-center gap-1">
                        {dangChon && (
                          <>
                            <button
                              type="button"
                              onClick={() => datSoPhan(c.id, sl - 1)}
                              aria-label={`Bớt một phần ${c.tenThat}`}
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
                          aria-label={`Thêm một phần ${c.tenThat}`}
                          className="grid size-11 place-items-center rounded-full bg-brand text-xl text-brand-fg disabled:opacity-40"
                        >
                          <span aria-hidden>+</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {nhom.kind === "nhieu" && <GhiChuPhan nhom={nhom} luaChon={luaChon} />}
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
            aria-label={`Thêm vào giỏ, ${formatPrice(gia)}`}
            className="h-12 w-full rounded-full bg-brand text-base font-medium text-brand-fg"
          >
            Thu vào túi · {formatPrice(gia)}
          </button>
          <p className="mt-1 text-center text-xs text-muted">(thêm vào giỏ hàng)</p>
        </div>
      </div>
    </div>
  );
}

function GhiChuPhan({ nhom, luaChon }: { nhom: NhomTT; luaChon: LuaChon }) {
  const tong = tongPhanTrongNhom(nhom, luaChon);
  const tinhThem = Math.max(0, tong - nhom.included_qty);
  if (tong === 0) return null;
  return (
    <p className="mt-2 text-sm text-muted" aria-live="polite">
      Đã gia trì {tong} phần
      {tinhThem > 0 &&
        nhom.extra_unit_price > 0 &&
        ` — ${tinhThem} phần tính thêm (+${formatPrice(tinhThem * nhom.extra_unit_price)})`}
    </p>
  );
}
