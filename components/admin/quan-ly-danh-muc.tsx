"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  batTatDanhMuc,
  doiChoDanhMuc,
  suaTenDanhMuc,
  themDanhMuc,
  xoaDanhMuc,
} from "@/app/admin/actions";
import type { Category } from "@/lib/types";

export function QuanLyDanhMuc({
  danhMuc,
  soMonTheoDanhMuc,
}: {
  danhMuc: Category[];
  soMonTheoDanhMuc: Record<string, number>;
}) {
  const router = useRouter();
  const [dangChay, batDau] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);
  const [tenMoi, datTenMoi] = useState("");

  function chay(viec: () => Promise<{ ok: true } | { ok: false; loi: string }>) {
    datLoi(null);
    batDau(async () => {
      const kq = await viec();
      if (!kq.ok) datLoi(kq.loi);
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenMoi.trim()) return;
          chay(async () => {
            const kq = await themDanhMuc(tenMoi);
            if (kq.ok) datTenMoi("");
            return kq;
          });
        }}
        className="mb-6 flex gap-2"
      >
        <input
          value={tenMoi}
          onChange={(e) => datTenMoi(e.target.value)}
          placeholder="Tên danh mục mới"
          className="h-12 flex-1 rounded-full border border-line bg-surface px-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
        />
        <button
          type="submit"
          disabled={dangChay}
          className="h-12 rounded-full bg-brand px-5 text-base font-medium text-brand-fg disabled:opacity-60"
        >
          Thêm
        </button>
      </form>

      <ul className={`flex flex-col gap-2 ${dangChay ? "opacity-60" : ""}`}>
        {danhMuc.map((dm, i) => (
          <DongDanhMuc
            key={dm.id}
            danhMuc={dm}
            soMon={soMonTheoDanhMuc[dm.id] ?? 0}
            coTren={i > 0}
            coDuoi={i < danhMuc.length - 1}
            onLenTren={() => chay(() => doiChoDanhMuc(dm.id, danhMuc[i - 1].id))}
            onXuongDuoi={() =>
              chay(() => doiChoDanhMuc(dm.id, danhMuc[i + 1].id))
            }
            onDoiTen={(ten) => chay(() => suaTenDanhMuc(dm.id, ten))}
            onBatTat={() => chay(() => batTatDanhMuc(dm.id, !dm.is_active))}
            onXoa={() => {
              if (window.confirm(`Xoá danh mục "${dm.name}"?`)) {
                chay(() => xoaDanhMuc(dm.id));
              }
            }}
          />
        ))}
      </ul>

      {danhMuc.length === 0 && (
        <p className="rounded-xl border border-line bg-surface px-4 py-8 text-center text-sm text-muted">
          Chưa có danh mục nào. Nhập tên ở ô trên rồi bấm Thêm.
        </p>
      )}
    </>
  );
}

function DongDanhMuc({
  danhMuc,
  soMon,
  coTren,
  coDuoi,
  onLenTren,
  onXuongDuoi,
  onDoiTen,
  onBatTat,
  onXoa,
}: {
  danhMuc: Category;
  soMon: number;
  coTren: boolean;
  coDuoi: boolean;
  onLenTren: () => void;
  onXuongDuoi: () => void;
  onDoiTen: (ten: string) => void;
  onBatTat: () => void;
  onXoa: () => void;
}) {
  const [dangSua, datDangSua] = useState(false);
  const [ten, datTen] = useState(danhMuc.name);

  function luu() {
    datDangSua(false);
    if (ten.trim() && ten.trim() !== danhMuc.name) onDoiTen(ten);
    else datTen(danhMuc.name);
  }

  return (
    <li
      className={`rounded-2xl border border-line bg-surface p-3 ${
        danhMuc.is_active ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        {dangSua ? (
          <input
            autoFocus
            value={ten}
            onChange={(e) => datTen(e.target.value)}
            onBlur={luu}
            onKeyDown={(e) => {
              if (e.key === "Enter") luu();
              if (e.key === "Escape") {
                datTen(danhMuc.name);
                datDangSua(false);
              }
            }}
            aria-label={`Tên danh mục ${danhMuc.name}`}
            className="h-11 min-w-0 flex-1 rounded-xl border border-brand bg-surface px-3 text-base font-medium text-fg focus:outline-none"
          />
        ) : (
          <p className="min-w-0 flex-1 text-base leading-snug font-medium text-fg">
            {danhMuc.name}{" "}
            <span className="text-sm font-normal text-muted">
              ({soMon} món)
            </span>
            {!danhMuc.is_active && (
              <span className="ml-2 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs text-muted">
                Đang ẩn
              </span>
            )}
          </p>
        )}

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onLenTren}
            disabled={!coTren}
            aria-label={`Đưa ${danhMuc.name} lên trên`}
            className="grid size-11 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
          >
            <span aria-hidden>↑</span>
          </button>
          <button
            type="button"
            onClick={onXuongDuoi}
            disabled={!coDuoi}
            aria-label={`Đưa ${danhMuc.name} xuống dưới`}
            className="grid size-11 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
          >
            <span aria-hidden>↓</span>
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => datDangSua(true)}
          className="h-11 rounded-full border border-line px-4 text-sm text-fg"
        >
          Đổi tên
        </button>
        <button
          type="button"
          onClick={onBatTat}
          className={`h-11 rounded-full px-4 text-sm font-medium ${
            danhMuc.is_active
              ? "border border-line text-fg"
              : "bg-brand text-brand-fg"
          }`}
        >
          {danhMuc.is_active ? "Ẩn khỏi menu" : "Hiện lại"}
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
