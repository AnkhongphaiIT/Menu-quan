"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { khopTimKiem } from "@/lib/format";
import {
  canHienTenThat,
  type DanhMucTT,
  type MonTT,
  type NhomTT,
} from "@/lib/tu-tien/du-lieu";
import { giaThapNhat } from "@/lib/tuy-chon";
import { ChonTuyChonTuTien } from "./chon-tuy-chon";
import { TheMonTuTien } from "./the-mon";

/**
 * Danh sách món của trang tu tiên — chép từ components/menu-browser.tsx.
 *
 * Giữ nguyên các cách xử lý đã sửa lỗi trên iPhone của bản thường (tự tính vị
 * trí cuộn, không dùng scrollIntoView, khoá tự tô đậm khi đang cuộn). Nếu sau
 * này bản thường sửa thêm lỗi cuộn thì nhớ sửa cả file này.
 *
 * Khác bản thường: tìm kiếm khớp cả tên tu tiên LẪN tên thật — khách gõ
 * "mì cay" vẫn ra "Viêm Hỏa Thần Ti".
 */
export function DanhSachMonTuTien({
  categories,
  items,
  nhomTheoMon,
  bieuTuong,
}: {
  categories: DanhMucTT[];
  items: MonTT[];
  nhomTheoMon: Record<string, NhomTT[]>;
  bieuTuong: Record<string, string>;
}) {
  const { them: themVaoGio } = useCart();
  const [dangChonMon, datDangChonMon] = useState<MonTT | null>(null);

  function moChon(mon: MonTT) {
    if (nhomTheoMon[mon.id]?.length) datDangChonMon(mon);
    else themVaoGio(mon.id);
  }

  function giaTuCua(mon: MonTT): number {
    return giaThapNhat(mon.price, nhomTheoMon[mon.id] ?? []);
  }

  const [tuKhoa, setTuKhoa] = useState("");
  const [danhMucHienTai, setDanhMucHienTai] = useState(categories[0]?.slug ?? "");

  const thanhDinhRef = useRef<HTMLDivElement>(null);
  const daiDanhMucRef = useRef<HTMLUListElement>(null);
  const mucRef = useRef<Record<string, HTMLElement | null>>({});
  const chipRef = useRef<Record<string, HTMLButtonElement | null>>({});
  const dangTuCuon = useRef(false);
  const hetTuCuonRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const dangTimKiem = tuKhoa.trim().length > 0;

  const monTheoDanhMuc = useMemo(() => {
    const bang: Record<string, MonTT[]> = {};
    for (const dm of categories) bang[dm.id] = [];
    for (const m of items) bang[m.category_id]?.push(m);
    for (const id of Object.keys(bang)) {
      bang[id].sort((a, b) => a.sort_order - b.sort_order);
    }
    return bang;
  }, [categories, items]);

  const danhMucHienThi = useMemo(
    () =>
      categories
        .filter((dm) => dm.is_active)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories],
  );

  const ketQuaTimKiem = useMemo(() => {
    if (!dangTimKiem) return [];
    return items.filter((m) =>
      [m.name, m.tenThat, m.description, m.moTaThat].some(
        (chu) => chu && khopTimKiem(chu, tuKhoa),
      ),
    );
  }, [items, tuKhoa, dangTimKiem]);

  useEffect(() => {
    const el = thanhDinhRef.current;
    if (!el) return;
    const capNhat = () =>
      document.documentElement.style.setProperty("--sticky-h", `${el.offsetHeight}px`);
    capNhat();
    const theoDoi = new ResizeObserver(capNhat);
    theoDoi.observe(el);
    return () => theoDoi.disconnect();
  }, []);

  useEffect(() => {
    if (dangTimKiem) return;
    const khiCuon = () => {
      if (dangTuCuon.current) return;
      const vach = (thanhDinhRef.current?.offsetHeight ?? 0) + 16;
      let slug = danhMucHienThi[0]?.slug ?? "";
      for (const dm of danhMucHienThi) {
        const el = mucRef.current[dm.slug];
        if (el && el.getBoundingClientRect().top <= vach) slug = dm.slug;
      }
      setDanhMucHienTai(slug);
    };
    khiCuon();
    window.addEventListener("scroll", khiCuon, { passive: true });
    return () => window.removeEventListener("scroll", khiCuon);
  }, [danhMucHienThi, dangTimKiem]);

  /* Chỉ cuộn dải ngang, không dùng scrollIntoView (xem giải thích ở bản thường). */
  useEffect(() => {
    const chip = chipRef.current[danhMucHienTai];
    const dai = daiDanhMucRef.current;
    if (!chip || !dai) return;
    const oChip = chip.getBoundingClientRect();
    const oDai = dai.getBoundingClientRect();
    const dich = oChip.left - oDai.left - (oDai.width - oChip.width) / 2;
    dai.scrollTo({ left: dai.scrollLeft + dich, behavior: "smooth" });
  }, [danhMucHienTai]);

  function nhayToiDanhMuc(slug: string) {
    const muc = mucRef.current[slug];
    if (!muc) return;
    setDanhMucHienTai(slug);
    dangTuCuon.current = true;
    clearTimeout(hetTuCuonRef.current);
    hetTuCuonRef.current = setTimeout(() => {
      dangTuCuon.current = false;
    }, 800);
    const caoThanhDinh = thanhDinhRef.current?.offsetHeight ?? 0;
    const dich = window.scrollY + muc.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, dich - caoThanhDinh - 12), behavior: "smooth" });
  }

  useEffect(() => () => clearTimeout(hetTuCuonRef.current), []);

  const bieuTuongCua = (m: MonTT) =>
    bieuTuong[categories.find((c) => c.id === m.category_id)?.slug ?? ""] ?? "🍽️";

  return (
    <>
      <div
        ref={thanhDinhRef}
        className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur"
      >
        <div className="mx-auto w-full max-w-2xl px-4 pt-3 pb-2">
          <div className="relative">
            <input
              type="search"
              value={tuKhoa}
              onChange={(e) => setTuKhoa(e.target.value)}
              placeholder="Tìm bảo vật (tìm món)…"
              aria-label="Tìm món"
              className="h-11 w-full rounded-full border border-line bg-surface pr-11 pl-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
            {dangTimKiem && (
              <button
                type="button"
                onClick={() => setTuKhoa("")}
                aria-label="Xoá ô tìm kiếm"
                className="absolute top-0 right-0 grid size-11 place-items-center rounded-full text-xl text-muted"
              >
                <span aria-hidden>×</span>
              </button>
            )}
          </div>
        </div>

        {!dangTimKiem && (
          <nav aria-label="Danh mục món">
            <ul
              ref={daiDanhMucRef}
              className="an-thanh-cuon mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto px-4 pb-3"
            >
              {danhMucHienThi.map((dm) => {
                const dangChon = dm.slug === danhMucHienTai;
                return (
                  <li key={dm.id}>
                    <button
                      type="button"
                      ref={(el) => {
                        chipRef.current[dm.slug] = el;
                      }}
                      onClick={() => nhayToiDanhMuc(dm.slug)}
                      aria-current={dangChon ? "true" : undefined}
                      aria-label={`${dm.name} (${dm.tenThat})`}
                      className={`flex h-10 items-center rounded-full border px-4 text-sm whitespace-nowrap transition-colors ${
                        dangChon
                          ? "border-brand bg-brand font-medium text-brand-fg"
                          : "border-line bg-surface text-fg"
                      }`}
                    >
                      <span aria-hidden className="mr-1.5">
                        {bieuTuong[dm.slug]}
                      </span>
                      {dm.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>

      <div className="mx-auto w-full max-w-2xl px-4 pb-8">
        {dangTimKiem ? (
          <section aria-label="Kết quả tìm kiếm" className="pt-4">
            <p className="mb-3 text-sm text-muted">
              {ketQuaTimKiem.length > 0
                ? `Tìm thấy ${ketQuaTimKiem.length} bảo vật`
                : "Không tìm thấy bảo vật nào"}
            </p>

            {ketQuaTimKiem.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {ketQuaTimKiem.map((m) => (
                  <TheMonTuTien
                    key={m.id}
                    item={m}
                    onThem={moChon}
                    coTuyChon={Boolean(nhomTheoMon[m.id]?.length)}
                    giaHienThi={giaTuCua(m)}
                    bieuTuong={bieuTuongCua(m)}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-line bg-surface px-4 py-10 text-center">
                <p className="text-base text-fg">Không có món nào tên “{tuKhoa}”</p>
                <p className="mt-1 text-sm text-muted">
                  Gõ tên thường cũng được, ví dụ “trà sữa”, “mì cay”.
                </p>
                <button
                  type="button"
                  onClick={() => setTuKhoa("")}
                  className="mt-4 h-11 rounded-full bg-brand px-5 text-base font-medium text-brand-fg"
                >
                  Xem lại toàn bộ menu
                </button>
              </div>
            )}
          </section>
        ) : (
          danhMucHienThi.map((dm) => {
            const mon = monTheoDanhMuc[dm.id] ?? [];
            if (mon.length === 0) return null;

            return (
              <section
                key={dm.id}
                id={`dm-${dm.slug}`}
                ref={(el) => {
                  mucRef.current[dm.slug] = el;
                }}
                className="muc-danh-muc pt-6"
                aria-labelledby={`tieu-de-${dm.slug}`}
              >
                <h2 id={`tieu-de-${dm.slug}`} className="mb-3 text-lg font-bold text-fg">
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{bieuTuong[dm.slug]}</span>
                    {dm.name}
                    <span className="text-sm font-normal text-muted">({mon.length} món)</span>
                  </span>
                  {canHienTenThat(dm.name, dm.tenThat) && (
                    <span className="block text-sm font-normal text-muted">{dm.tenThat}</span>
                  )}
                </h2>

                <ul className="flex flex-col gap-2">
                  {mon.map((m) => (
                    <TheMonTuTien
                      key={m.id}
                      item={m}
                      onThem={moChon}
                      coTuyChon={Boolean(nhomTheoMon[m.id]?.length)}
                      giaHienThi={giaTuCua(m)}
                      bieuTuong={bieuTuong[dm.slug] ?? "🍽️"}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>

      {dangChonMon && (
        <ChonTuyChonTuTien
          mon={dangChonMon}
          cacNhom={nhomTheoMon[dangChonMon.id] ?? []}
          dong={() => datDangChonMon(null)}
          onThem={(luaChon) => {
            themVaoGio(dangChonMon.id, luaChon);
            datDangChonMon(null);
          }}
        />
      )}
    </>
  );
}
