"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  batTatConHang,
  doiChoMon,
  doiGia,
  xoaMon,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import type { Category, MenuItem } from "@/lib/types";
import { FormMon } from "./form-mon";

/**
 * Danh sách món để chủ quán sửa ngay trên điện thoại.
 *
 * Sắp xếp theo mức độ dùng thường xuyên: hai việc làm nhiều nhất trong ngày —
 * bật/tắt "Tạm hết" và đổi giá — đều làm được ngay tại dòng, không phải mở
 * biểu mẫu. Những việc hiếm hơn (đổi tên, đổi ảnh, đổi danh mục) mới nằm
 * trong nút "Sửa".
 */
export function QuanLyMon({
  danhMuc,
  monAn,
}: {
  danhMuc: Category[];
  monAn: MenuItem[];
}) {
  const router = useRouter();
  const [dangChay, batDau] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSua, datDangSua] = useState<MenuItem | null>(null);
  const [themVaoDanhMuc, datThemVaoDanhMuc] = useState<string | null>(null);

  function chay(viec: () => Promise<{ ok: true } | { ok: false; loi: string }>) {
    datLoi(null);
    batDau(async () => {
      const kq = await viec();
      if (!kq.ok) datLoi(kq.loi);
      /* refresh() để đọc lại dữ liệu mới từ máy chủ, không phải tải lại trang */
      else router.refresh();
    });
  }

  return (
    <>
      {loi && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
        >
          {loi}
        </p>
      )}

      {danhMuc.length === 0 && (
        <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          Chưa có danh mục nào. Sang mục <strong>Danh mục</strong> tạo trước đã.
        </p>
      )}

      <div className={dangChay ? "opacity-60 transition-opacity" : ""}>
        {danhMuc.map((dm) => {
          const mon = monAn
            .filter((m) => m.category_id === dm.id)
            .sort((a, b) => a.sort_order - b.sort_order);

          return (
            <section key={dm.id} className="mb-8">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-base font-bold text-fg">
                  {dm.name}{" "}
                  <span className="text-sm font-normal text-muted">
                    ({mon.length})
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => datThemVaoDanhMuc(dm.id)}
                  className="h-10 rounded-full border border-line px-3 text-sm text-fg"
                >
                  + Thêm món
                </button>
              </div>

              <ul className="flex flex-col gap-2">
                {mon.map((m, i) => (
                  <DongMon
                    key={m.id}
                    mon={m}
                    coTren={i > 0}
                    coDuoi={i < mon.length - 1}
                    onLenTren={() => chay(() => doiChoMon(m.id, mon[i - 1].id))}
                    onXuongDuoi={() =>
                      chay(() => doiChoMon(m.id, mon[i + 1].id))
                    }
                    onBatTat={() =>
                      chay(() => batTatConHang(m.id, !m.is_available))
                    }
                    onDoiGia={(gia) => chay(() => doiGia(m.id, gia))}
                    onSua={() => datDangSua(m)}
                    onXoa={() => {
                      if (
                        window.confirm(
                          `Xoá món "${m.name}"?\n\nKhông khôi phục lại được.`,
                        )
                      ) {
                        chay(() => xoaMon(m.id));
                      }
                    }}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      {(dangSua || themVaoDanhMuc) && (
        <FormMon
          mon={dangSua}
          danhMuc={danhMuc}
          danhMucMacDinh={themVaoDanhMuc ?? undefined}
          dong={() => {
            datDangSua(null);
            datThemVaoDanhMuc(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function DongMon({
  mon,
  coTren,
  coDuoi,
  onLenTren,
  onXuongDuoi,
  onBatTat,
  onDoiGia,
  onSua,
  onXoa,
}: {
  mon: MenuItem;
  coTren: boolean;
  coDuoi: boolean;
  onLenTren: () => void;
  onXuongDuoi: () => void;
  onBatTat: () => void;
  onDoiGia: (gia: number) => void;
  onSua: () => void;
  onXoa: () => void;
}) {
  const [dangSuaGia, datDangSuaGia] = useState(false);
  const [giaMoi, datGiaMoi] = useState(String(mon.price));

  function luuGia() {
    const so = Number(giaMoi.replace(/\D/g, ""));
    datDangSuaGia(false);
    if (Number.isInteger(so) && so >= 0 && so !== mon.price) onDoiGia(so);
    else datGiaMoi(String(mon.price));
  }

  return (
    <li
      className={`rounded-2xl border border-line bg-surface p-3 ${
        mon.is_available ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-base leading-snug font-medium text-fg">
          {mon.name}
          {!mon.is_available && (
            <span className="ml-2 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs text-muted">
              Tạm hết
            </span>
          )}
        </p>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onLenTren}
            disabled={!coTren}
            aria-label={`Đưa ${mon.name} lên trên`}
            className="grid size-11 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
          >
            <span aria-hidden>↑</span>
          </button>
          <button
            type="button"
            onClick={onXuongDuoi}
            disabled={!coDuoi}
            aria-label={`Đưa ${mon.name} xuống dưới`}
            className="grid size-11 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
          >
            <span aria-hidden>↓</span>
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {dangSuaGia ? (
          <input
            autoFocus
            value={giaMoi}
            onChange={(e) => datGiaMoi(e.target.value)}
            onBlur={luuGia}
            onKeyDown={(e) => {
              if (e.key === "Enter") luuGia();
              if (e.key === "Escape") {
                datGiaMoi(String(mon.price));
                datDangSuaGia(false);
              }
            }}
            inputMode="numeric"
            aria-label={`Giá của ${mon.name}`}
            className="h-11 w-32 rounded-full border border-brand bg-surface px-4 text-base font-bold text-fg focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => datDangSuaGia(true)}
            aria-label={`Đổi giá ${mon.name}, hiện tại ${formatPrice(mon.price)}`}
            className="h-11 rounded-full border border-line px-4 text-base font-bold text-brand"
          >
            {formatPrice(mon.price)}
          </button>
        )}

        <button
          type="button"
          onClick={onBatTat}
          className={`h-11 rounded-full px-4 text-sm font-medium ${
            mon.is_available
              ? "border border-line text-fg"
              : "bg-brand text-brand-fg"
          }`}
        >
          {mon.is_available ? "Đánh dấu tạm hết" : "Có lại rồi"}
        </button>

        <button
          type="button"
          onClick={onSua}
          className="h-11 rounded-full border border-line px-4 text-sm text-fg"
        >
          Sửa
        </button>

        <button
          type="button"
          onClick={onXoa}
          className="ml-auto h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
        >
          Xoá
        </button>
      </div>
    </li>
  );
}
