"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import {
  batTatConHang,
  doiChoMon,
  doiGia,
  suaTenDanhMuc,
  xoaMon,
  type KetQua,
} from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";
import { docGia } from "@/lib/doc-gia";
import type { Category, MenuItem, OptionGroup } from "@/lib/types";
import { FormMon } from "./form-mon";

/**
 * Danh sách món để chủ quán sửa ngay trên điện thoại.
 *
 * Sắp xếp theo mức độ dùng thường xuyên: hai việc làm nhiều nhất trong ngày —
 * bật/tắt "Tạm hết" và đổi giá — đều làm được ngay tại dòng, không phải mở
 * biểu mẫu. Những việc hiếm hơn (đổi tên, đổi ảnh, đổi danh mục) mới nằm
 * trong nút "Sửa".
 *
 * Đổi giá và bật/tắt "Tạm hết" LƯU NGẦM: giá mới hiện ngay, dòng đó ghi
 * "Đang lưu…" rồi "✓ Đã lưu", còn cả trang vẫn bấm được bình thường. Trước
 * đây cả danh sách mờ đi trong lúc chờ máy chủ, chủ quán tưởng bị khoá, không
 * sửa liên tục được nhiều món.
 */
export function QuanLyMon({
  danhMuc,
  monAn,
  nhomTheoMon = {},
}: {
  danhMuc: Category[];
  monAn: MenuItem[];
  nhomTheoMon?: Record<string, OptionGroup[]>;
}) {
  /* Chỉ dùng cho việc đổi CẤU TRÚC (đổi chỗ, xoá, đổi tên danh mục) — những
     việc mà bấm tiếp khi chưa xong sẽ ra kết quả sai. */
  const [dangChay, batDau] = useTransition();
  const [loi, datLoi] = useState<string | null>(null);
  const [dangSua, datDangSua] = useState<MenuItem | null>(null);
  const [themVaoDanhMuc, datThemVaoDanhMuc] = useState<string | null>(null);
  /** Món đang mở ô giá. Giữ ở đây chứ không ở từng dòng, để Enter nhảy được
      sang món kế tiếp. */
  const [oGiaDangMo, datOGiaDangMo] = useState<string | null>(null);

  function chay(viec: () => Promise<KetQua>) {
    datLoi(null);
    batDau(async () => {
      /* Không cần router.refresh(): lệnh lưu tự gửi kèm dữ liệu mới về. */
      const kq = await viec();
      if (!kq.ok) datLoi(kq.loi);
    });
  }

  const cacNhomMon = danhMuc.map((dm) => ({
    dm,
    mon: monAn
      .filter((m) => m.category_id === dm.id)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
  /* Thứ tự đúng như trên màn hình, để Enter biết "món kế tiếp" là món nào. */
  const thuTuMon = cacNhomMon.flatMap(({ mon }) => mon.map((m) => m.id));

  function moGiaKeTiep(id: string) {
    const ke = thuTuMon[thuTuMon.indexOf(id) + 1];
    datOGiaDangMo(ke ?? null);
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

      {monAn.length > 0 && (
        <p className="mb-4 text-sm text-muted">
          Đổi giá nhanh: bấm vào giá, gõ số, bấm <strong>Enter</strong> là lưu
          và nhảy sang món tiếp theo. Gõ <strong>25</strong> hiểu là 25.000đ.
        </p>
      )}

      {cacNhomMon.map(({ dm, mon }) => (
        <section key={dm.id} className="mb-8">
          <div className="mb-2 flex items-center justify-between gap-2">
            <TieuDeDanhMuc
              danhMuc={dm}
              soMon={mon.length}
              onDoiTen={(ten) => chay(() => suaTenDanhMuc(dm.id, ten))}
            />
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
                khoaDoiCho={dangChay}
                onLenTren={() => chay(() => doiChoMon(m.id, mon[i - 1].id))}
                onXuongDuoi={() => chay(() => doiChoMon(m.id, mon[i + 1].id))}
                dangSuaGia={oGiaDangMo === m.id}
                onMoGia={() => datOGiaDangMo(m.id)}
                onDongGia={() =>
                  /* Chỉ đóng nếu ô đang mở vẫn là của món này — Enter có thể
                     vừa chuyển sang món kế tiếp ngay trước đó. */
                  datOGiaDangMo((dangMo) => (dangMo === m.id ? null : dangMo))
                }
                onGiaKeTiep={() => moGiaKeTiep(m.id)}
                onDoiGia={(gia) => doiGia(m.id, gia)}
                onBatTat={(conHang) => batTatConHang(m.id, conHang)}
                onSua={() => datDangSua(m)}
                soNhomTuyChon={nhomTheoMon[m.id]?.length ?? 0}
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
      ))}

      {/* Báo nhỏ ở cuối màn hình thay vì làm mờ cả trang. */}
      {dangChay && (
        <p
          role="status"
          className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full bg-fg px-4 py-2 text-sm text-bg shadow-lg"
        >
          Đang lưu…
        </p>
      )}

      {(dangSua || themVaoDanhMuc) && (
        <FormMon
          mon={dangSua}
          danhMuc={danhMuc}
          nhomTheoMon={nhomTheoMon}
          danhMucMacDinh={themVaoDanhMuc ?? undefined}
          dong={() => {
            datDangSua(null);
            datThemVaoDanhMuc(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Tiêu đề một danh mục, kèm nút ✏️ để đổi tên ngay tại chỗ.
 *
 * Tab "Danh mục" cũng đổi tên được, nhưng chủ quán thường đang ở tab Món ăn
 * khi thấy tên danh mục cần sửa — không bắt chuyển tab cho một việc nhỏ.
 * Chỉ đổi TÊN hiển thị; mã rút gọn (slug) giữ nguyên để không làm hỏng liên kết.
 */
function TieuDeDanhMuc({
  danhMuc,
  soMon,
  onDoiTen,
}: {
  danhMuc: Category;
  soMon: number;
  onDoiTen: (ten: string) => void;
}) {
  const [dangSua, datDangSua] = useState(false);
  const [ten, datTen] = useState(danhMuc.name);

  function luu() {
    datDangSua(false);
    if (ten.trim() && ten.trim() !== danhMuc.name) onDoiTen(ten);
    else datTen(danhMuc.name);
  }

  function huy() {
    datTen(danhMuc.name);
    datDangSua(false);
  }

  if (dangSua) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <input
          autoFocus
          value={ten}
          onChange={(e) => datTen(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") luu();
            if (e.key === "Escape") huy();
          }}
          aria-label={`Tên mới cho danh mục ${danhMuc.name}`}
          className="h-11 min-w-0 flex-1 rounded-xl border border-brand bg-surface px-3 text-base font-bold text-fg focus:outline-none"
        />
        <button
          type="button"
          onClick={luu}
          className="h-11 shrink-0 rounded-full bg-brand px-4 text-sm font-medium text-brand-fg"
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={huy}
          aria-label="Huỷ đổi tên"
          className="grid size-11 shrink-0 place-items-center rounded-full text-xl text-muted"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <h2 className="min-w-0 text-base font-bold text-fg">
        {danhMuc.name}{" "}
        <span className="text-sm font-normal text-muted">({soMon})</span>
      </h2>
      <button
        type="button"
        onClick={() => {
          datTen(danhMuc.name);
          datDangSua(true);
        }}
        aria-label={`Đổi tên danh mục ${danhMuc.name}`}
        title="Đổi tên danh mục"
        className="grid size-11 shrink-0 place-items-center rounded-full text-base"
      >
        <span aria-hidden>✏️</span>
      </button>
    </div>
  );
}

/** Ô giá vừa mở thì tô sẵn cả số cũ, gõ số mới là đè lên luôn. Hàm để
    ngoài component để không bị tạo lại mỗi lần gõ phím (tạo lại thì React
    gọi lại, ô sẽ bị tô chọn lại giữa chừng). */
function focusVaChonHet(o: HTMLInputElement | null) {
  if (o) {
    o.focus();
    o.select();
  }
}

function DongMon({
  mon,
  coTren,
  coDuoi,
  khoaDoiCho,
  onLenTren,
  onXuongDuoi,
  dangSuaGia,
  onMoGia,
  onDongGia,
  onGiaKeTiep,
  onDoiGia,
  onBatTat,
  onSua,
  onXoa,
  soNhomTuyChon,
}: {
  mon: MenuItem;
  coTren: boolean;
  coDuoi: boolean;
  khoaDoiCho: boolean;
  onLenTren: () => void;
  onXuongDuoi: () => void;
  dangSuaGia: boolean;
  onMoGia: () => void;
  onDongGia: () => void;
  onGiaKeTiep: () => void;
  onDoiGia: (gia: number) => Promise<KetQua>;
  onBatTat: (conHang: boolean) => Promise<KetQua>;
  onSua: () => void;
  onXoa: () => void;
  soNhomTuyChon: number;
}) {
  const [dangLuu, batDauLuu] = useTransition();
  /* Giá trị "tạm" hiện ngay khi bấm; máy chủ trả dữ liệu mới về thì tự thay
     bằng giá trị thật. Lưu lỗi thì tự quay về giá trị cũ. */
  const [gia, datGiaTam] = useOptimistic(mon.price);
  const [conHang, datConHangTam] = useOptimistic(mon.is_available);
  const [giaMoi, datGiaMoi] = useState(String(mon.price));
  const [vuaLuu, datVuaLuu] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);
  /* Ref chứ không phải state: Escape rồi rời ô xảy ra liền nhau trong cùng
     một cú bấm, state chưa kịp cập nhật thì hàm lưu đã chạy. */
  const huyGia = useRef(false);

  /* Ô giá có thể được mở từ dòng trên (Enter) chứ không chỉ từ nút giá của
     dòng này, nên mỗi lần ô vừa mở thì nạp lại giá hiện tại vào ô. */
  const [daMoTruocDo, datDaMoTruocDo] = useState(dangSuaGia);
  if (dangSuaGia !== daMoTruocDo) {
    datDaMoTruocDo(dangSuaGia);
    if (dangSuaGia) {
      datGiaMoi(String(gia));
    }
  }

  function luu(viec: () => Promise<KetQua>, hienTam: () => void) {
    datLoi(null);
    datVuaLuu(false);
    batDauLuu(async () => {
      hienTam();
      let kq: KetQua;
      try {
        kq = await viec();
      } catch {
        /* Mất mạng giữa chừng. Không bắt lỗi ở đây thì cả trang admin sập. */
        kq = { ok: false, loi: "Mất kết nối, chưa lưu được. Kiểm tra mạng rồi thử lại." };
      }
      if (!kq.ok) {
        datLoi(kq.loi);
        return;
      }
      datVuaLuu(true);
      setTimeout(() => datVuaLuu(false), 2500);
    });
  }

  function luuGia() {
    onDongGia();
    if (huyGia.current) {
      huyGia.current = false;
      return;
    }
    const so = docGia(giaMoi);
    if (so === null || so === gia) return;
    luu(
      () => onDoiGia(so),
      () => datGiaTam(so),
    );
  }

  return (
    <li
      className={`rounded-2xl border border-line bg-surface p-3 ${
        conHang ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 flex-1 text-base leading-snug font-medium text-fg">
          {mon.name}
          {!conHang && (
            <span className="ml-2 inline-block rounded-full border border-line px-2 py-0.5 align-middle text-xs text-muted">
              Tạm hết
            </span>
          )}
        </p>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onLenTren}
            disabled={!coTren || khoaDoiCho}
            aria-label={`Đưa ${mon.name} lên trên`}
            className="grid size-11 place-items-center rounded-full border border-line text-lg text-fg disabled:opacity-30"
          >
            <span aria-hidden>↑</span>
          </button>
          <button
            type="button"
            onClick={onXuongDuoi}
            disabled={!coDuoi || khoaDoiCho}
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
            ref={focusVaChonHet}
            value={giaMoi}
            onChange={(e) => datGiaMoi(e.target.value)}
            onBlur={luuGia}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                /* Mở ô món sau TRƯỚC, rồi mới rời ô này (rời ô = lưu). */
                onGiaKeTiep();
                e.currentTarget.blur();
              }
              if (e.key === "Escape") {
                huyGia.current = true;
                e.currentTarget.blur();
              }
            }}
            inputMode="numeric"
            enterKeyHint="next"
            aria-label={`Giá của ${mon.name}`}
            className="h-11 w-32 rounded-full border border-brand bg-surface px-4 text-base font-bold text-fg focus:outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={onMoGia}
            aria-label={`Đổi giá ${mon.name}, hiện tại ${formatPrice(gia)}`}
            className="h-11 rounded-full border border-line px-4 text-base font-bold text-brand"
          >
            {formatPrice(gia)}
          </button>
        )}

        <button
          type="button"
          onClick={() =>
            luu(
              () => onBatTat(!conHang),
              () => datConHangTam(!conHang),
            )
          }
          className={`h-11 rounded-full px-4 text-sm font-medium ${
            conHang ? "border border-line text-fg" : "bg-brand text-brand-fg"
          }`}
        >
          {conHang ? "Đánh dấu tạm hết" : "Có lại rồi"}
        </button>

        <button
          type="button"
          onClick={onSua}
          className="h-11 rounded-full border border-line px-4 text-sm text-fg"
        >
          {/* Topping, loại mì... nằm ngay trong ô Sửa. Nhãn nói rõ để chủ
              quán biết món nào đang có tuỳ chọn. */}
          {soNhomTuyChon > 0 ? "Sửa · món & topping" : "Sửa"}
        </button>

        <button
          type="button"
          onClick={onXoa}
          className="ml-auto h-11 rounded-full px-3 text-sm text-muted underline underline-offset-2"
        >
          Xoá
        </button>
      </div>

      {(dangLuu || vuaLuu) && (
        <p aria-live="polite" className="mt-2 text-sm text-muted">
          {dangLuu ? "Đang lưu…" : "✓ Đã lưu"}
        </p>
      )}

      {loi && (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-line bg-brand-soft px-3 py-2 text-sm text-fg"
        >
          {loi}
        </p>
      )}
    </li>
  );
}
