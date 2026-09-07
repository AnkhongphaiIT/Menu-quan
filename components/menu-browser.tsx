"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, MenuItem } from "@/lib/types";
import { khopTimKiem } from "@/lib/format";
import { ItemCard } from "./item-card";

type Props = {
  categories: Category[];
  items: MenuItem[];
  /** slug danh mục -> biểu tượng, dùng làm ảnh tạm cho món chưa có ảnh */
  bieuTuong: Record<string, string>;
};

export function MenuBrowser({ categories, items, bieuTuong }: Props) {
  const [tuKhoa, setTuKhoa] = useState("");
  const [danhMucHienTai, setDanhMucHienTai] = useState(
    categories[0]?.slug ?? "",
  );

  const thanhDinhRef = useRef<HTMLDivElement>(null);
  const mucRef = useRef<Record<string, HTMLElement | null>>({});
  const chipRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const dangTimKiem = tuKhoa.trim().length > 0;

  /* ---------------------------------------------------------------------
     Gom món theo danh mục, sắp xếp sẵn một lần.
     useMemo để không phải gom lại 54 món mỗi lần khách gõ một chữ.
     --------------------------------------------------------------------- */
  const monTheoDanhMuc = useMemo(() => {
    const bang: Record<string, MenuItem[]> = {};
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

  /* Kết quả tìm kiếm: khớp cả tên món lẫn mô tả, bỏ qua dấu và hoa/thường. */
  const ketQuaTimKiem = useMemo(() => {
    if (!dangTimKiem) return [];
    return items.filter(
      (m) =>
        khopTimKiem(m.name, tuKhoa) ||
        (m.description ? khopTimKiem(m.description, tuKhoa) : false),
    );
  }, [items, tuKhoa, dangTimKiem]);

  /* ---------------------------------------------------------------------
     Đo chiều cao thật của thanh dính rồi ghi vào biến CSS --sticky-h.
     Nhờ vậy khi bấm nhảy tới một danh mục, tiêu đề danh mục không bị thanh
     dính che mất. Phải đo động vì thanh này cao thấp khác nhau: lúc đang tìm
     kiếm thì dải danh mục bị ẩn đi, thanh thấp hơn.
     --------------------------------------------------------------------- */
  useEffect(() => {
    const el = thanhDinhRef.current;
    if (!el) return;

    const capNhat = () =>
      document.documentElement.style.setProperty(
        "--sticky-h",
        `${el.offsetHeight}px`,
      );

    capNhat();
    const theoDoi = new ResizeObserver(capNhat);
    theoDoi.observe(el);
    return () => theoDoi.disconnect();
  }, []);

  /* ---------------------------------------------------------------------
     Tự động tô đậm danh mục đang xem khi khách cuộn trang.
     Cách làm: tìm mục cuối cùng có mép trên đã trôi lên phía trên vạch ngay
     dưới thanh dính. Chỉ 8 mục nên vòng lặp này rất nhẹ.
     --------------------------------------------------------------------- */
  useEffect(() => {
    if (dangTimKiem) return; // đang tìm kiếm thì không hiện dải danh mục

    const khiCuon = () => {
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

  /* Kéo dải danh mục sang ngang để chip đang chọn luôn nằm trong tầm nhìn. */
  useEffect(() => {
    chipRef.current[danhMucHienTai]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [danhMucHienTai]);

  function nhayToiDanhMuc(slug: string) {
    setDanhMucHienTai(slug);
    mucRef.current[slug]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* ================= THANH DÍNH: ô tìm kiếm + dải danh mục ================= */}
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
              /* Giữ ngắn để không bị cắt cụt trên màn hình hẹp (iPhone SE, 320px).
                 Việc gõ không dấu vẫn tìm được là chuyện ngầm, khách cứ gõ là ra,
                 không cần nhắc trong ô. */
              placeholder="Tìm món ăn, nước uống…"
              aria-label="Tìm món"
              /* text-base = 16px. Dưới 16px là Safari trên iPhone tự phóng to
                 trang khi khách bấm vào ô nhập — lỗi rất hay gặp. */
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
            <ul className="an-thanh-cuon mx-auto flex w-full max-w-2xl gap-2 overflow-x-auto px-4 pb-3">
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

      {/* ========================= DANH SÁCH MÓN ========================= */}
      <div className="mx-auto w-full max-w-2xl px-4 pb-16">
        {dangTimKiem ? (
          <section aria-label="Kết quả tìm kiếm" className="pt-4">
            <p className="mb-3 text-sm text-muted">
              {ketQuaTimKiem.length > 0
                ? `Tìm thấy ${ketQuaTimKiem.length} món`
                : "Không tìm thấy món nào"}
            </p>

            {ketQuaTimKiem.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {ketQuaTimKiem.map((m) => (
                  <ItemCard
                    key={m.id}
                    item={m}
                    bieuTuong={
                      bieuTuong[
                        categories.find((c) => c.id === m.category_id)?.slug ??
                          ""
                      ] ?? "🍽️"
                    }
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-2xl border border-line bg-surface px-4 py-10 text-center">
                <p className="text-base text-fg">
                  Không có món nào tên “{tuKhoa}”
                </p>
                <p className="mt-1 text-sm text-muted">
                  Thử gõ ngắn hơn, ví dụ “trà” thay vì “trà sữa khoai môn”.
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
                <h2
                  id={`tieu-de-${dm.slug}`}
                  className="mb-3 flex items-center gap-2 text-lg font-bold text-fg"
                >
                  <span aria-hidden>{bieuTuong[dm.slug]}</span>
                  {dm.name}
                  <span className="text-sm font-normal text-muted">
                    ({mon.length} món)
                  </span>
                </h2>

                <ul className="flex flex-col gap-2">
                  {mon.map((m) => (
                    <ItemCard
                      key={m.id}
                      item={m}
                      bieuTuong={bieuTuong[dm.slug] ?? "🍽️"}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </>
  );
}
