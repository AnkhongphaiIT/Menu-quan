"use client";

import { useState, useTransition } from "react";
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
import type { OptionChoice, OptionGroup } from "@/lib/types";

/**
 * Phần quản lý tuỳ chọn của một món: loại mì, topping, loại sợi...
 * Nằm NGAY TRONG biểu mẫu "Sửa món" (components/admin/form-mon.tsx).
 *
 * TỰ LƯU: sửa xong một ô, chạm ra ngoài là lưu; tick/chọn trong danh sách là
 * lưu ngay. Không có nút "Lưu" riêng cho từng dòng nữa.
 *
 * Vì sao đổi (10/09/2026): bản trước có ba loại nút Lưu trong cùng một bảng
 * ("Lưu" từng dòng, "Lưu nhóm", "Lưu thông tin món"). Chủ quán sửa giá Bún/Mì
 * rồi bấm nhầm nút khác — giá không được lưu mà không có gì báo. Tự lưu khi
 * rời ô thì bấm nút nào cũng không mất: trình duyệt luôn bỏ con trỏ khỏi ô
 * (sự kiện blur) TRƯỚC khi xử lý cú bấm nút.
 *
 * ⚠️ Không dùng thẻ <form> nào trong file này: nó nằm lọt trong <form> của
 * biểu mẫu món, mà form lồng form là HTML sai.
 */
export function NoiDungTuyChon({
  menuItemId,
  cacNhom,
}: {
  menuItemId: string;
  cacNhom: OptionGroup[];
}) {
  const [dangChay, batDau] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);

  function chay(viec: () => Promise<KetQua>, xong?: () => void) {
    datLoi(null);
    batDau(async () => {
      const kq = await viec();
      /* Không cần router.refresh(): lệnh lưu tự gửi kèm dữ liệu mới về. */
      if (!kq.ok) datLoi(kq.loi);
      else xong?.();
    });
  }

  const tatCaLuaChon = cacNhom.flatMap((n) =>
    n.choices.map((c) => ({ ...c, tenNhom: n.name })),
  );

  return (
    <div
      /* Enter trong các ô ở đây KHÔNG được bấm nút "Lưu thông tin món" bên
         ngoài. Enter thì coi như rời ô — cũng tự lưu. */
      onKeyDown={(e) => {
        const t = e.target as HTMLElement;
        if (e.key === "Enter" && t.tagName === "INPUT") {
          e.preventDefault();
          if (!t.dataset.themMoi) (t as HTMLInputElement).blur();
        }
      }}
    >
      <p
        aria-live="polite"
        className="mb-3 min-h-5 text-sm text-muted"
      >
        {dangChay ? "Đang lưu…" : "Sửa xong một ô, chạm ra ngoài là tự lưu."}
      </p>

      {loi && (
        <p
          role="alert"
          className="mb-3 rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
        >
          {loi}
        </p>
      )}

      {cacNhom.length === 0 && (
        <p className="mb-3 rounded-xl border border-line bg-surface px-4 py-4 text-sm text-muted">
          Món này chưa có tuỳ chọn — khách bấm + là thêm thẳng vào giỏ. Nếu món
          có nhiều loại hoặc có đồ thêm, bấm “Thêm nhóm tuỳ chọn” bên dưới.
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
        onThem={(du, xong) => chay(() => themNhom(menuItemId, du), xong)}
      />
    </div>
  );
}

/* ==========================================================================
   MỘT NHÓM
   ========================================================================== */

type Chay = (viec: () => Promise<KetQua>, xong?: () => void) => void;
type Doi<T> = (thayDoi: Partial<T>, luuNgay?: boolean) => void;

function nhomTuDb(n: OptionGroup): DuLieuNhom {
  return {
    name: n.name,
    kind: n.kind,
    min_qty: n.min_qty,
    included_qty: n.included_qty,
    extra_unit_price: n.extra_unit_price,
    max_qty_per_choice: n.max_qty_per_choice,
  };
}

function giongNhau<T extends object>(a: T, b: T): boolean {
  return (Object.keys(a) as (keyof T)[]).every(
    (k) => (a[k] ?? "") === (b[k] ?? ""),
  );
}

function KhungNhom({
  nhom,
  luaChonNhomKhac,
  chay,
}: {
  nhom: OptionGroup;
  luaChonNhomKhac: (OptionChoice & { tenNhom: string })[];
  chay: Chay;
}) {
  const [du, datDu] = useState<DuLieuNhom>(() => nhomTuDb(nhom));
  const [tenMoi, datTenMoi] = useState("");
  const daLuu = giongNhau(du, nhomTuDb(nhom));

  function luu(moi: DuLieuNhom) {
    if (!giongNhau(moi, nhomTuDb(nhom))) chay(() => suaNhom(nhom.id, moi));
  }

  const doi: Doi<DuLieuNhom> = (thayDoi, luuNgay) => {
    const moi = { ...du, ...thayDoi };
    datDu(moi);
    if (luuNgay) luu(moi);
  };

  function themLuaChonMoi() {
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
  }

  return (
    <section className="mb-4 rounded-2xl border border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wide text-muted uppercase">
          Nhóm
        </span>
        <TrangThaiLuu daLuu={daLuu} />
      </div>

      <CacONhom du={du} doi={doi} onRoi={() => luu(du)} />

      <h4 className="mt-5 mb-2 text-sm font-bold text-fg">
        Các lựa chọn trong nhóm ({nhom.choices.length})
      </h4>

      {nhom.choices.length === 0 && (
        <p
          role="alert"
          className="mb-2 rounded-xl border border-brand bg-brand-soft px-3 py-2 text-sm leading-snug text-fg"
        >
          Nhóm này <strong>chưa có lựa chọn nào</strong> nên khách chưa thấy nó.
          Gõ tên từng lựa chọn (ví dụ “Rau muống”) vào ô dưới rồi bấm{" "}
          <strong>+ Thêm</strong>.
        </p>
      )}

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

      <div className="mt-3 flex gap-2">
        <input
          value={tenMoi}
          data-them-moi="1"
          onChange={(e) => datTenMoi(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") themLuaChonMoi();
          }}
          placeholder={nhom.kind === "mot" ? "Tên loại mới" : "Rau muống"}
          aria-label={`Tên lựa chọn mới cho ${nhom.name}`}
          className="h-11 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <button
          type="button"
          onClick={themLuaChonMoi}
          className="h-11 rounded-full bg-brand px-4 text-sm font-medium text-brand-fg"
        >
          + Thêm
        </button>
      </div>

      <div className="mt-4 flex justify-end">
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
          className="h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
        >
          Xoá cả nhóm
        </button>
      </div>
    </section>
  );
}

/** "✓ Đã lưu" hoặc "Chưa lưu — chạm ra ngoài ô" */
function TrangThaiLuu({ daLuu }: { daLuu: boolean }) {
  return daLuu ? (
    <span className="text-xs text-muted">✓ Đã lưu</span>
  ) : (
    <span className="text-xs font-medium text-brand">
      Chưa lưu — chạm ra ngoài ô
    </span>
  );
}

/**
 * Các ô chỉnh một nhóm — dùng chung cho sửa nhóm và tạo nhóm mới.
 * Ô chữ/số: báo `onRoi` khi rời ô. Ô chọn/tick: báo `doi(..., true)` ngay.
 */
function CacONhom({
  du,
  doi,
  onRoi,
}: {
  du: DuLieuNhom;
  doi: Doi<DuLieuNhom>;
  onRoi?: () => void;
}) {
  const oSo = (khoa: keyof DuLieuNhom, nhan: string, chuThich?: string) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-fg">{nhan}</span>
      <input
        inputMode="numeric"
        value={String(du[khoa])}
        onChange={(e) =>
          doi({ [khoa]: Number(e.target.value.replace(/\D/g, "") || 0) })
        }
        onBlur={onRoi}
        className="h-11 rounded-xl border border-line bg-bg px-3 text-base text-fg focus:border-brand focus:outline-none"
      />
      {chuThich && <span className="text-xs text-muted">{chuThich}</span>}
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm text-fg">
          Tên nhóm{" "}
          <span className="text-xs text-muted">(tiêu đề khách thấy)</span>
        </span>
        <input
          value={du.name}
          onChange={(e) => doi({ name: e.target.value })}
          onBlur={onRoi}
          placeholder="Thêm rau"
          className="h-11 rounded-xl border border-line bg-bg px-3 text-base font-medium text-fg placeholder:text-muted focus:border-brand focus:outline-none"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm text-fg">Kiểu chọn</span>
        <select
          value={du.kind}
          onChange={(e) =>
            doi({ kind: e.target.value as DuLieuNhom["kind"] }, true)
          }
          className="h-11 rounded-xl border border-line bg-bg px-3 text-base text-fg focus:border-brand focus:outline-none"
        >
          <option value="mot">Chọn đúng 1 (như loại mì, loại sợi)</option>
          <option value="nhieu">Chọn nhiều, có số phần (như topping, thêm rau)</option>
        </select>
      </label>

      <label className="flex items-center justify-between gap-3">
        <span className="text-sm text-fg">Bắt buộc khách phải chọn</span>
        <input
          type="checkbox"
          checked={du.min_qty > 0}
          onChange={(e) =>
            doi({ min_qty: e.target.checked ? Math.max(1, du.min_qty) : 0 }, true)
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
    kind: "nhieu",
    min_qty: 0,
    included_qty: 0,
    extra_unit_price: 0,
    max_qty_per_choice: 1,
  };
  const [mo, datMo] = useState(false);
  const [du, datDu] = useState<DuLieuNhom>(macDinh);
  const doi: Doi<DuLieuNhom> = (thayDoi) => datDu((cu) => ({ ...cu, ...thayDoi }));

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
      <h4 className="text-base font-bold text-fg">Nhóm mới</h4>
      <p className="mt-1 mb-3 text-sm leading-relaxed text-muted">
        <strong className="text-fg">Nhóm</strong> là tiêu đề, ví dụ “Thêm rau”
        hay “Loại sợi”. Tạo nhóm xong mới thêm từng{" "}
        <strong className="text-fg">lựa chọn</strong> bên trong, ví dụ “Rau
        muống”, “Cải thảo”.
      </p>
      <CacONhom du={du} doi={doi} />
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
   MỘT LỰA CHỌN — tự lưu khi rời ô
   ========================================================================== */

function luaTuDb(c: OptionChoice): DuLieuLuaChon {
  return {
    name: c.name,
    description: c.description,
    price_delta: c.price_delta,
    requires_choice_id: c.requires_choice_id,
    is_available: c.is_available,
  };
}

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
  const [du, datDu] = useState<DuLieuLuaChon>(() => luaTuDb(lua));
  const daLuu = giongNhau(du, luaTuDb(lua));

  function luu(moi: DuLieuLuaChon) {
    if (!giongNhau(moi, luaTuDb(lua))) onLuu(moi);
  }

  const doi: Doi<DuLieuLuaChon> = (thayDoi, luuNgay) => {
    const moi = { ...du, ...thayDoi };
    datDu(moi);
    if (luuNgay) luu(moi);
  };

  return (
    <li
      className={`rounded-xl border bg-bg p-3 ${
        daLuu ? "border-line" : "border-brand"
      } ${du.is_available ? "" : "opacity-60"}`}
    >
      <div className="flex items-center gap-2">
        <input
          value={du.name}
          onChange={(e) => doi({ name: e.target.value })}
          onBlur={() => luu(du)}
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
            onChange={(e) => doi({ description: e.target.value })}
            onBlur={() => luu(du)}
            placeholder="Cay"
            className="h-11 rounded-xl border border-line bg-surface px-3 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted">Tính thêm (đồng)</span>
          <input
            inputMode="numeric"
            value={String(du.price_delta)}
            onChange={(e) =>
              doi({ price_delta: Number(e.target.value.replace(/\D/g, "") || 0) })
            }
            onBlur={() => luu(du)}
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
            onChange={(e) => doi({ requires_choice_id: e.target.value || null }, true)}
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
            onChange={(e) => doi({ is_available: e.target.checked }, true)}
            className="size-5 accent-[var(--brand)]"
          />
          Còn hàng
        </label>
        <span className="ml-auto">
          <TrangThaiLuu daLuu={daLuu} />
        </span>
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
