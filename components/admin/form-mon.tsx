"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { themMon, suaMon, type DuLieuMon } from "@/app/admin/actions";
import { doDungLuong, nenAnh } from "@/lib/nen-anh";
import { ketNoiTrinhDuyet } from "@/lib/supabase-browser";
import type { Category, MenuItem, OptionGroup } from "@/lib/types";
import { NoiDungTuyChon } from "./quan-ly-tuy-chon";

const KHO_ANH = "menu-images";

/**
 * Biểu mẫu thêm/sửa món, mở lên từ đáy màn hình.
 *
 * Gộp thêm và sửa vào một biểu mẫu: hai màn hình gần như giống hệt nhau, tách
 * ra chỉ tạo hai chỗ để sai khác nhau.
 */
export function FormMon({
  mon,
  danhMuc,
  danhMucMacDinh,
  nhomTheoMon = {},
  dong,
}: {
  /** null = thêm món mới */
  mon: MenuItem | null;
  danhMuc: Category[];
  danhMucMacDinh?: string;
  /** Mã món -> nhóm tuỳ chọn, để hiện phần topping ngay trong biểu mẫu */
  nhomTheoMon?: Record<string, OptionGroup[]>;
  dong: () => void;
}) {
  const router = useRouter();
  /* Món mới vừa bấm "Tạo món" xong: giữ mã lại để biểu mẫu KHÔNG đóng, mà
     chuyển sang chế độ sửa và hiện luôn phần thêm topping cho món đó. */
  const [idDaTao, datIdDaTao] = useState<string | null>(null);
  const idHienTai = mon?.id ?? idDaTao;
  const cacNhomHienTai = idHienTai ? (nhomTheoMon[idHienTai] ?? []) : [];
  const [tinTao, datTinTao] = useState<string | null>(null);
  const [ten, datTen] = useState(mon?.name ?? "");
  const [moTa, datMoTa] = useState(mon?.description ?? "");
  const [gia, datGia] = useState(String(mon?.price ?? 25000));
  const [idDanhMuc, datIdDanhMuc] = useState(
    mon?.category_id ?? danhMucMacDinh ?? danhMuc[0]?.id ?? "",
  );
  const [conHang, datConHang] = useState(mon?.is_available ?? true);
  const [anh, datAnh] = useState<string | null>(mon?.image_url ?? null);

  const [dangTaiAnh, datDangTaiAnh] = useState(false);
  const [tinAnh, datTinAnh] = useState<string | null>(null);
  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);

  async function chonAnh(e: React.ChangeEvent<HTMLInputElement>) {
    const tep = e.target.files?.[0];
    if (!tep) return;

    datLoi(null);
    datDangTaiAnh(true);
    datTinAnh("Đang nén ảnh…");

    try {
      const ketQua = await nenAnh(tep);
      datTinAnh(
        `Đã nén ${doDungLuong(ketQua.kichThuocGoc)} → ${doDungLuong(ketQua.kichThuocSauNen)}. Đang tải lên…`,
      );

      const db = ketNoiTrinhDuyet();
      /* Tên tệp ngẫu nhiên: tránh hai ảnh trùng tên đè lên nhau, và tránh lỗi
         khi tên ảnh gốc có dấu tiếng Việt hoặc ký tự lạ. */
      const duongDan = `mon/${crypto.randomUUID()}.webp`;

      const { error } = await db.storage
        .from(KHO_ANH)
        .upload(duongDan, ketQua.file, {
          contentType: "image/webp",
          upsert: false,
        });

      if (error) {
        datLoi(
          error.message.toLowerCase().includes("policy") ||
            error.message.toLowerCase().includes("unauthorized")
            ? "Tài khoản này không có quyền tải ảnh lên."
            : `Không tải được ảnh: ${error.message}`,
        );
        datTinAnh(null);
        return;
      }

      const { data } = db.storage.from(KHO_ANH).getPublicUrl(duongDan);
      datAnh(data.publicUrl);
      datTinAnh(
        `Xong — ảnh còn ${doDungLuong(ketQua.kichThuocSauNen)} (từ ${doDungLuong(ketQua.kichThuocGoc)}).`,
      );
    } catch (e) {
      datLoi(e instanceof Error ? e.message : "Không xử lý được ảnh này.");
      datTinAnh(null);
    } finally {
      datDangTaiAnh(false);
      /* Xoá lựa chọn để chọn lại đúng tệp đó lần nữa vẫn kích hoạt sự kiện */
      e.target.value = "";
    }
  }

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    datLoi(null);

    const soGia = Number(gia.replace(/\D/g, ""));
    if (!Number.isInteger(soGia) || soGia < 0) {
      datLoi("Giá phải là số, nhập bằng đồng. Ví dụ: 25000");
      return;
    }

    datDangLuu(true);

    const du: DuLieuMon = {
      name: ten,
      description: moTa || null,
      price: soGia,
      category_id: idDanhMuc,
      image_url: anh,
      is_available: conHang,
    };

    const ketQua = idHienTai ? await suaMon(idHienTai, du) : await themMon(du);

    if (!ketQua.ok) {
      datLoi(ketQua.loi);
      datDangLuu(false);
      return;
    }

    /* Vừa tạo món mới: không đóng, mở luôn phần tuỳ chọn cho món đó. */
    if (!idHienTai && "id" in ketQua && typeof ketQua.id === "string") {
      datIdDaTao(ketQua.id);
      datTinTao(
        "Đã tạo món. Nếu món có nhiều loại hoặc có topping, thêm ngay ở mục Tuỳ chọn bên dưới. Xong thì bấm Đóng.",
      );
      datDangLuu(false);
      router.refresh();
      return;
    }

    dong();
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
        aria-label={mon ? "Sửa món" : "Thêm món"}
        className="relative flex max-h-[92vh] flex-col rounded-t-3xl border-t border-line bg-bg"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-bold text-fg">
            {idHienTai ? "Sửa món" : "Thêm món mới"}
          </h2>
          <button
            type="button"
            onClick={dong}
            aria-label="Đóng"
            className="grid size-11 place-items-center rounded-full text-2xl text-muted"
          >
            <span aria-hidden>×</span>
          </button>
        </div>

        <form
          onSubmit={luu}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-4"
        >
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">Tên món</span>
            <input
              value={ten}
              onChange={(e) => datTen(e.target.value)}
              required
              className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">
              Giá <span className="font-normal text-muted">(đồng)</span>
            </span>
            <input
              value={gia}
              onChange={(e) => datGia(e.target.value)}
              inputMode="numeric"
              required
              className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">Danh mục</span>
            <select
              value={idDanhMuc}
              onChange={(e) => datIdDanhMuc(e.target.value)}
              required
              className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
            >
              {danhMuc.map((dm) => (
                <option key={dm.id} value={dm.id}>
                  {dm.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">
              Mô tả ngắn{" "}
              <span className="font-normal text-muted">(không bắt buộc)</span>
            </span>
            <input
              value={moTa}
              onChange={(e) => datMoTa(e.target.value)}
              placeholder="Ví dụ: Chọn sợi bún hoặc mì"
              className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
          </label>

          {/* ---------- Ảnh món ---------- */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-fg">Ảnh món</span>

            <div className="flex items-center gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-brand-soft">
                {anh && (
                  <Image
                    src={anh}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <label className="flex h-11 cursor-pointer items-center justify-center rounded-full border border-line px-4 text-sm text-fg">
                  {anh ? "Đổi ảnh khác" : "Chọn ảnh từ máy"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={chonAnh}
                    disabled={dangTaiAnh}
                    className="sr-only"
                  />
                </label>

                {anh && (
                  <button
                    type="button"
                    onClick={() => {
                      datAnh(null);
                      datTinAnh(null);
                    }}
                    className="h-11 rounded-full text-sm text-muted underline underline-offset-2"
                  >
                    Bỏ ảnh
                  </button>
                )}
              </div>
            </div>

            {tinAnh && (
              <p aria-live="polite" className="text-sm text-muted">
                {tinAnh}
              </p>
            )}
          </div>

          {/* ---------- Còn hàng ---------- */}
          <label className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span className="text-base text-fg">
              Còn hàng
              <span className="mt-0.5 block text-sm text-muted">
                Tắt đi thì khách thấy nhãn “Tạm hết”
              </span>
            </span>
            <input
              type="checkbox"
              checked={conHang}
              onChange={(e) => datConHang(e.target.checked)}
              className="size-6 shrink-0 accent-[var(--brand)]"
            />
          </label>

          {/* ---------- Tuỳ chọn: loại, topping... ---------- */}
          <section className="mt-2 border-t border-line pt-4">
            <h3 className="text-base font-bold text-fg">
              Tuỳ chọn (loại, topping…)
            </h3>

            {tinTao && (
              <p
                role="status"
                className="mt-2 rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
              >
                {tinTao}
              </p>
            )}

            {idHienTai ? (
              <>
                <p className="mt-1 mb-1 text-sm leading-relaxed text-muted">
                  Phần này tự lưu, không cần bấm “Lưu thông tin món” ở dưới.
                </p>
                <NoiDungTuyChon
                  menuItemId={idHienTai}
                  cacNhom={cacNhomHienTai}
                />
              </>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Bấm “Tạo món” trước, sau đó thêm loại và topping ngay tại đây.
              </p>
            )}
          </section>

          {loi && (
            <p
              role="alert"
              className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
            >
              {loi}
            </p>
          )}

          <div className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t border-line bg-bg px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={dong}
              className="h-12 flex-1 rounded-full border border-line text-base text-muted"
            >
              {idDaTao ? "Đóng" : "Huỷ"}
            </button>
            <button
              type="submit"
              disabled={dangLuu || dangTaiAnh}
              className="h-12 flex-2 rounded-full bg-brand text-base font-medium text-brand-fg disabled:opacity-60"
            >
              {dangLuu
                ? "Đang lưu…"
                : idHienTai
                  ? "Lưu thông tin món"
                  : "Tạo món"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
