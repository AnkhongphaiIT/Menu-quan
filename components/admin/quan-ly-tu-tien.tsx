"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { luuTuTien, type LoaiTuTien } from "@/app/admin/tu-tien/actions";
import { formatPrice } from "@/lib/format";
import type { Category, MenuItem, OptionGroup } from "@/lib/types";

/**
 * Sửa chữ tu tiên ngay trên điện thoại.
 *
 * MỘT kiểu lưu duy nhất: sửa xong một ô, chạm ra ngoài là tự lưu, mỗi ô tự
 * ghi "✓ Đã lưu". Không có nút Lưu nào — bài học từ bảng topping trước đây,
 * nhiều loại nút Lưu làm chủ quán mất dữ liệu mà không biết.
 *
 * Ô tên để trống = trang tu tiên hiện tên thật của món đó.
 */
export function QuanLyTuTien({
  danhMuc,
  monAn,
  nhomTheoMon,
  ttDanhMuc,
  ttMon,
  ttNhom,
  ttLuaChon,
}: {
  danhMuc: Category[];
  monAn: MenuItem[];
  nhomTheoMon: Record<string, OptionGroup[]>;
  ttDanhMuc: Record<string, string>;
  ttMon: Record<string, { ten: string; moTa: string | null }>;
  ttNhom: Record<string, string>;
  ttLuaChon: Record<string, string>;
}) {
  const chuaCo = monAn.filter((m) => !ttMon[m.id]).length;

  return (
    <>
      <div className="mb-5 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-fg">
        <p>
          Chữ ở đây chỉ hiện trên <strong>trang tu tiên</strong>, không đụng gì
          tới menu thường. Tên thật và giá sửa ở tab <strong>Món ăn</strong>.
        </p>
        <p className="mt-1 text-muted">
          Sửa xong một ô, chạm ra ngoài là tự lưu. Để trống tên thì trang tu
          tiên hiện tên thật.
          {chuaCo > 0 && ` Còn ${chuaCo} món chưa có tên tu tiên.`}
        </p>
        <Link
          href="/tu-tien"
          target="_blank"
          className="mt-3 inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-medium text-fg"
        >
          ☯️ Xem trang tu tiên
        </Link>
      </div>

      {danhMuc.map((dm) => {
        const mon = monAn
          .filter((m) => m.category_id === dm.id)
          .sort((a, b) => a.sort_order - b.sort_order);

        return (
          <section key={dm.id} className="mb-8">
            <div className="mb-3 rounded-2xl bg-brand-soft p-3">
              <p className="text-sm text-muted">Danh mục: {dm.name}</p>
              <OTen loai="danh-muc" id={dm.id} tenThat={dm.name} dauTien={ttDanhMuc[dm.id] ?? ""} />
            </div>

            <ul className="flex flex-col gap-3">
              {mon.map((m) => (
                <li key={m.id} className="rounded-2xl border border-line bg-surface p-3">
                  <p className="text-sm text-muted">
                    {m.name} · {formatPrice(m.price)}
                  </p>
                  <OMon
                    id={m.id}
                    tenThat={m.name}
                    dauTien={ttMon[m.id] ?? { ten: "", moTa: null }}
                  />

                  {(nhomTheoMon[m.id] ?? []).map((n) => (
                    <details key={n.id} className="mt-3 rounded-xl border border-line px-3 py-2">
                      <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium text-fg">
                        Tuỳ chọn: {n.name} ({n.choices.length})
                      </summary>
                      <OTen loai="nhom" id={n.id} tenThat={n.name} dauTien={ttNhom[n.id] ?? ""} nhan="Tên nhóm" />
                      {n.choices.map((c) => (
                        <OTen
                          key={c.id}
                          loai="lua-chon"
                          id={c.id}
                          tenThat={c.name}
                          dauTien={ttLuaChon[c.id] ?? ""}
                          nhan={c.name}
                        />
                      ))}
                    </details>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}

type TrangThai = { loai: "dang" | "xong" | "loi"; chu?: string } | null;

function DongTrangThai({ tt }: { tt: TrangThai }) {
  if (!tt) return null;
  return (
    <p
      role={tt.loai === "loi" ? "alert" : undefined}
      aria-live="polite"
      className={`mt-1 text-xs ${tt.loai === "loi" ? "text-fg" : "text-muted"}`}
    >
      {tt.loai === "dang" ? "Đang lưu…" : tt.loai === "xong" ? "✓ Đã lưu" : tt.chu}
    </p>
  );
}

/** Một ô tên tu tiên (danh mục, nhóm, lựa chọn). Rời ô là lưu. */
function OTen({
  loai,
  id,
  tenThat,
  dauTien,
  nhan = "Tên tu tiên",
}: {
  loai: LoaiTuTien;
  id: string;
  tenThat: string;
  dauTien: string;
  nhan?: string;
}) {
  const [giaTri, datGiaTri] = useState(dauTien);
  const [daLuu, datDaLuu] = useState(dauTien);
  const [tt, datTt] = useState<TrangThai>(null);
  const [, batDau] = useTransition();

  function luu() {
    if (giaTri.trim() === daLuu.trim()) return;
    datTt({ loai: "dang" });
    const muonLuu = giaTri;
    batDau(async () => {
      let kq;
      try {
        kq = await luuTuTien(loai, id, muonLuu);
      } catch {
        kq = { ok: false as const, loi: "Mất kết nối, chưa lưu được. Thử lại nhé." };
      }
      if (kq.ok) {
        datDaLuu(muonLuu);
        datTt({ loai: "xong" });
      } else {
        datTt({ loai: "loi", chu: kq.loi });
      }
    });
  }

  return (
    <label className="mt-2 block">
      <span className="text-xs text-muted">{nhan}</span>
      <input
        value={giaTri}
        onChange={(e) => datGiaTri(e.target.value)}
        onBlur={luu}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder={tenThat}
        maxLength={80}
        className="mt-0.5 h-11 w-full rounded-xl border border-line bg-bg px-3 text-base text-fg focus:border-brand focus:outline-none"
      />
      <DongTrangThai tt={tt} />
    </label>
  );
}

/** Tên + mô tả tu tiên của một món — rời ô nào cũng lưu cả hai. */
function OMon({
  id,
  tenThat,
  dauTien,
}: {
  id: string;
  tenThat: string;
  dauTien: { ten: string; moTa: string | null };
}) {
  const [ten, datTen] = useState(dauTien.ten);
  const [moTa, datMoTa] = useState(dauTien.moTa ?? "");
  const [daLuu, datDaLuu] = useState({ ten: dauTien.ten, moTa: dauTien.moTa ?? "" });
  const [tt, datTt] = useState<TrangThai>(null);
  const [, batDau] = useTransition();

  function luu() {
    if (ten.trim() === daLuu.ten.trim() && moTa.trim() === daLuu.moTa.trim()) return;
    if (!ten.trim() && moTa.trim()) {
      datTt({ loai: "loi", chu: "Nhập tên tu tiên trước, mô tả mới lưu được." });
      return;
    }
    const muonLuu = { ten, moTa };
    datTt({ loai: "dang" });
    batDau(async () => {
      let kq;
      try {
        kq = await luuTuTien("mon", id, muonLuu.ten, muonLuu.moTa);
      } catch {
        kq = { ok: false as const, loi: "Mất kết nối, chưa lưu được. Thử lại nhé." };
      }
      if (kq.ok) {
        datDaLuu(muonLuu);
        datTt({ loai: "xong" });
      } else {
        datTt({ loai: "loi", chu: kq.loi });
      }
    });
  }

  return (
    <div>
      <label className="mt-2 block">
        <span className="text-xs text-muted">Tên tu tiên</span>
        <input
          value={ten}
          onChange={(e) => datTen(e.target.value)}
          onBlur={luu}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder={tenThat}
          maxLength={80}
          className="mt-0.5 h-11 w-full rounded-xl border border-line bg-bg px-3 text-base font-bold text-fg focus:border-brand focus:outline-none"
        />
      </label>
      <label className="mt-2 block">
        <span className="text-xs text-muted">Mô tả tu tiên (không bắt buộc)</span>
        <textarea
          value={moTa}
          onChange={(e) => datMoTa(e.target.value)}
          onBlur={luu}
          rows={2}
          maxLength={300}
          className="mt-0.5 w-full rounded-xl border border-line bg-bg px-3 py-2 text-base text-fg focus:border-brand focus:outline-none"
        />
      </label>
      <DongTrangThai tt={tt} />
    </div>
  );
}
