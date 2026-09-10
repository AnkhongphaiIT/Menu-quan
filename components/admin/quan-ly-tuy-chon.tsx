"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  doiChoLuaChon,
  suaLuaChon,
  suaNhom,
  themLuaChon,
  themNhom,
  xoaLuaChon,
  xoaNhom,
  type DuLieuLuaChon,
  type DuLieuNhom,
  type KetQua,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import type { MenuItem, OptionChoice, OptionGroup } from "@/lib/types";

/**
 * Chủ quán tự quản lý tuỳ chọn của một món: loại mì, topping, loại sợi...
 *
 * Mở từ nút "Tuỳ chọn" trên từng dòng món trong trang admin. Dữ liệu `cacNhom`
 * đến từ máy chủ; sau mỗi lần lưu gọi router.refresh() để máy chủ gửi lại bản
 * mới, không tự giữ bản sao ở đây — tránh hai bản dữ liệu lệch nhau.
 */
export function QuanLyTuyChon({
  mon,
  cacNhom,
  dong,
}: {
  mon: MenuItem;
  cacNhom: OptionGroup[];
  dong: () => void;
}) {
  const router = useRouter();
  const [dangChay, batDau] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);

  useEffect(() => {
    const cu = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = cu;
    };
  }, []);

  function chay(viec: () => Promise<KetQua>, xong?: () => void) {
    datLoi(null);
    batDau(async () => {
      const kq = await viec();
      if (!kq.ok) datLoi(kq.loi);
      else {
        xong?.();
        router.refresh();
      }
    });
  }

  /* Lựa chọn thuộc NHÓM KHÁC của cùng món — để chọn luật "chỉ đi với" */
  const tatCaLuaChon = cacNhom.flatMap((n) =>
    n.choices.map((c) => ({ ...c, tenNhom: n.name })),
  );

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
        aria-label={`Tuỳ chọn của ${mon.name}`}
        className="relative flex max-h-[94vh] flex-col rounded-t-3xl border-t border-line bg-bg"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-fg">Tuỳ chọn: {mon.name}</h2>
            <p className="text-sm text-muted">
              Giá gốc {formatPrice(mon.price)} — sửa ở nút “Sửa” của món
            </p>
          </div>
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="grid size-11 shrink-0 place-items-center rounded-full text-2xl text-muted"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto px-4 py-4 ${dangChay ? "opacity-60" : ""}`}
        >
          {loi && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
            >
              {loi}
            </p>
          )}

          {cacNhom.length === 0 && (
            <p className="mb-4 rounded-xl border border-line bg-surface px-4 py-6 text-center text-sm text-muted">
              Món này chưa có tuỳ chọn. Khách bấm + là thêm thẳng vào giỏ.
            </p>
          )}

          {cacNhom.map((nhom) => (
            <KhungNhom
              key={nhom.id}
              nhom={nhom}
              luaChonNhomKhac={tatCaLuaChon.filter((c) => c.group_id !== nhom.id)}
              chay={chay}
            />
          ))}

          <FormThemNhom
            onThem={(du, xong) => chay(() => themNhom(mon.id, du), xong)}
          />
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MỘT NHÓM
   ========================================================================== */

type Chay = (viec: () => Promise<KetQua>, xong?: () => void) => void;

function KhungNhom({
  nhom,
  luaChonNhomKhac,
  chay,
}: {
  nhom: OptionGroup;
  luaChonNhomKhac: (OptionChoice & { tenNhom: string })[];
  chay: Chay;
}) {
  const [du, datDu] = useState<DuLieuNhom>({
    name: nhom.name,
    kind: nhom.kind,
    min_qty: nhom.min_qty,
    included_qty: nhom.included_qty,
    extra_unit_price: nhom.extra_unit_price,
    max_qty_per_choice: nhom.max_qty_per_choice,
  });
  const [tenMoi, datTenMoi] = useState("");

  return (
    <section className="mb-6 rounded-2xl border border-line bg-surface p-3">
      <CacONhom du={du} datDu={datDu} />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => chay(() => suaNhom(nhom.id, du))}
          className="h-11 flex-1 rounded-full bg-brand text-sm font-medium text-brand-fg"
        >
          Lưu nhóm
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                `Xoá nhóm "${nhom.name}" và toàn bộ ${nhom.choices.length} lựa chọn bên trong?`,
              )
            ) {
              chay(() => xoaNhom(nhom.id));
            }
          }}
          className="h-11 rounded-full px-4 text-sm text-muted underline underline-offset-2"
        >
          Xoá nhóm
        </button>
      </div>

      <h3 className="mt-5 mb-2 text-sm font-bold text-fg">
        Các lựa chọn ({nhom.choices.length})
      </h3>

      <ul className="flex flex-col gap-2">
        {nhom.choices.map((c, i) => (
          <DongLuaChon
            key={c.id}
            lua={c}
            luaChonNhomKhac={luaChonNhomKhac}
            coTren={i > 0}
            coDuoi={i < nhom.choices.length - 1}
            onLen={() => chay(() => doiChoLuaChon(c.id, nhom.choices[i - 1].id))}
            onXuong={() => chay(() => doiChoLuaChon(c.id, nhom.choices[i + 1].id))}
            onLuu={(duLua) => chay(() => suaLuaChon(c.id, duLua))}
            onXoa={() => {
              if (window.confirm(`Xoá lựa chọn "${c.name}"?`)) {
                chay(() => xoaLuaChon(c.id));
              }
            }}
          />
        ))}
      </ul>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenMoi.trim()) return;
          chay(
            () =>
              themLuaChon(nhom.id, {
                name: tenMoi,
                description: null,
                price_delta: 0,
                requires_choice_id: null,
                is_available: true,
              }),
            () => datTenMoi(""),
          );
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={tenMoi}
          onChange={(e) => datTenMoi(e.target.value)}
          placeholder={nhom.kind === "mot" ? "Mì trộn thường" : "Gà sốt phô mai"}
          aria-label={`Tên lựa chọn mới cho ${nhom.name}`}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          className="h-11 rounded-full border border-line px-4 text-sm text-fg"
        >
          + Thêm
        </button>
      </form>
    </section>
  );
}

/** Các ô chỉnh một nhóm — dùng chung cho sửa nhóm và thêm nhóm mới. */
function CacONhom({
  du,
  datDu,
}: {
  du: DuLieuNhom;
  datDu: React.Dispatch<React.SetStateAction<DuLieuNhom>>;
}) {
  const oSo = (khoa: keyof DuLieuNhom, nhan: string, chuThich?: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-fg">{nhan}</span>
      <input
        inputMode="numeric"
        value={String(du[khoa])}
        onChange={(e) =>
          datDu((cu) => ({ ...cu, [khoa]: Number(e.target.value.replace(/\D/g, "") || 0) }))
        }
        className="h-11 rounded-xl border border-line bg-bg px-3 text-base text-fg focus:border-brand focus:outline-none"
      />
      {chuThich && <span className="text-xs text-muted">{chuThich}</span>}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-fg">Tên nhóm</span>
        <input
          value={du.name}
          onChange={(e) => datDu((cu) => ({ ...cu, name: e.target.value }))}
          className="h-11 rounded-xl border border-line bg-bg px-3 text-base font-medium text-fg focus:border-brand focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-fg">Kiểu chọn</span>
        <select
          value={du.kind}
          onChange={(e) =>
            datDu((cu) => ({ ...cu, kind: e.target.value as DuLieuNhom["kind"] }))
          }
          className="h-11 rounded-xl border border-line bg-bg px-3 text-base text-fg focus:border-brand focus:outline-none"
        >
          <option value="mot">Chọn đúng 1 (như loại mì, loại sợi)</option>
          <option value="nhieu">Chọn nhiều, có số phần (như topping)</option>
        </select>
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-fg">Bắt buộc khách phải chọn</span>
        <input
          type="checkbox"
          checked={du.min_qty > 0}
          onChange={(e) =>
            datDu((cu) => ({ ...cu, min_qty: e.target.checked ? Math.max(1, cu.min_qty) : 0 }))
          }
          className="size-6 accent-[var(--brand)]"
        />
      </label>

      {du.kind === "nhieu" && (
        <div className="grid grid-cols-2 gap-3">
          {oSo("min_qty", "Ít nhất (phần)")}
          {oSo("included_qty", "Đã gồm trong giá", "Mì trộn: 1")}
          {oSo("extra_unit_price", "Mỗi phần thêm (đồng)", "Mì trộn: 5000")}
          {oSo("max_qty_per_choice", "Tối đa mỗi món", "Gấp đôi = 2")}
        </div>
      )}
    </div>
  );
}

function FormThemNhom({
  onThem,
}: {
  onThem: (du: DuLieuNhom, xong: () => void) => void;
}) {
  const macDinh: DuLieuNhom = {
    name: "",
    kind: "mot",
    min_qty: 1,
    included_qty: 0,
    extra_unit_price: 0,
    max_qty_per_choice: 1,
  };
  const [mo, datMo] = useState(false);
  const [du, datDu] = useState<DuLieuNhom>(macDinh);

  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => datMo(true)}
        className="h-12 w-full rounded-full border border-dashed border-line text-base text-fg"
      >
        + Thêm nhóm tuỳ chọn
      </button>
    );
  }

  return (
    <section className="rounded-2xl border border-brand bg-surface p-3">
      <h3 className="mb-3 text-base font-bold text-fg">Nhóm mới</h3>
      <CacONhom du={du} datDu={datDu} />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            datMo(false);
            datDu(macDinh);
          }}
          className="h-11 flex-1 rounded-full border border-line text-sm text-muted"
        >
          Huỷ
        </button>
        <button
          type="button"
          onClick={() =>
            onThem(du, () => {
              datMo(false);
              datDu(macDinh);
            })
          }
          className="h-11 flex-2 rounded-full bg-brand text-sm font-medium text-brand-fg"
        >
          Tạo nhóm
        </button>
      </div>
    </section>
  );
}

/* ==========================================================================
   MỘT LỰA CHỌN
   ========================================================================== */

function DongLuaChon({
  lua,
  luaChonNhomKhac,
  coTren,
  coDuoi,
  onLen,
  onXuong,
  onLuu,
  onXoa,
}: {
  lua: OptionChoice;
  luaChonNhomKhac: (OptionChoice & { tenNhom: string })[];
  coTren: boolean;
  coDuoi: boolean;
  onLen: () => void;
  onXuong: () => void;
  onLuu: (du: DuLieuLuaChon) => void;
  onXoa: () => void;
}) {
  const [du, datDu] = useState<DuLieuLuaChon>({
    name: lua.name,
    description: lua.description,
    price_delta: lua.price_delta,
    requires_choice_id: lua.requires_choice_id,
    is_available: lua.is_available,
  });

  const daDoi =
    du.name !== lua.name ||
    (du.description ?? "") !== (lua.description ?? "") ||
    du.price_delta !== lua.price_delta ||
    du.requires_choice_id !== lua.requires_choice_id ||
    du.is_available !== lua.is_available;

  return (
    <li
      className={`rounded-xl border border-line bg-bg p-3 ${
        du.is_available ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-2">
        <input
          value={du.name}
          onChange={(e) => datDu((cu) => ({ ...cu, name: e.target.value }))}
          aria-label="Tên lựa chọn"
          className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 text-base font-medium text-fg focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={onLen}
          disabled={!coTren}
          aria-label={`Đưa ${lua.name} lên`}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
        >
          <span aria-hidden>↑</span>
        </button>
        <button
          type="button"
          onClick={onXuong}
          disabled={!coDuoi}
          aria-label={`Đưa ${lua.name} xuống`}
          className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
        >
          <span aria-hidden>↓</span>
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Ghi chú nhỏ</span>
          <input
            value={du.description ?? ""}
            onChange={(e) => datDu((cu) => ({ ...cu, description: e.target.value }))}
            placeholder="Cay"
            className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Tính thêm mỗi phần (đồng)</span>
          <input
            inputMode="numeric"
            value={String(du.price_delta)}
            onChange={(e) =>
              datDu((cu) => ({ ...cu, price_delta: Number(e.target.value.replace(/\D/g, "") || 0) }))
            }
            className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg focus:border-brand focus:outline-none"
          />
        </label>
      </div>

      {luaChonNhomKhac.length > 0 && (
        <label className="mt-2 flex flex-col gap-1">
          <span className="text-xs text-muted">
            Chỉ đi với (để trống nếu đi được với tất cả)
          </span>
          <select
            value={du.requires_choice_id ?? ""}
            onChange={(e) =>
              datDu((cu) => ({ ...cu, requires_choice_id: e.target.value || null }))
            }
            className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg focus:border-brand focus:outline-none"
          >
            <option value="">— Đi được với tất cả —</option>
            {luaChonNhomKhac.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tenNhom}: {c.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex h-11 items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={du.is_available}
            onChange={(e) => datDu((cu) => ({ ...cu, is_available: e.target.checked }))}
            className="size-5 accent-[var(--brand)]"
          />
          Còn hàng
        </label>
        <button
          type="button"
          onClick={() => onLuu(du)}
          disabled={!daDoi}
          className="ml-auto h-11 rounded-full bg-brand px-4 text-sm font-medium text-brand-fg disabled:opacity-40"
        >
          {daDoi ? "Lưu" : "Đã lưu"}
        </button>
        <button
          type="button"
          onClick={onXoa}
          className="h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
        >
          Xoá
        </button>
      </div>
    </li>
  );
}
