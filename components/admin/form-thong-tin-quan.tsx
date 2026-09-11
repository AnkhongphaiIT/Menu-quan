"use client";

import { useState } from "react";
import { luuThongTinQuan, type DuLieuQuan } from "@/app/admin/actions";
import type { ShopSettings } from "@/lib/types";
import { NutDangXuat } from "./nut-dang-xuat";

/** Mọi ô đều không bắt buộc — ô nào để trống thì chân trang tự ẩn mục đó đi. */
const CAC_O: {
  khoa: keyof DuLieuQuan;
  nhan: string;
  goiY?: string;
  kieu?: string;
  chuThich?: string;
}[] = [
  { khoa: "shop_name", nhan: "Tên quán", goiY: "Ăn cùng Dì Hai" },
  { khoa: "address", nhan: "Địa chỉ", goiY: "123 Nguyễn Văn A, Quận 1" },
  {
    khoa: "phone",
    nhan: "Số điện thoại",
    goiY: "0901234567",
    kieu: "tel",
    chuThich: "Khách bấm vào là gọi được ngay",
  },
  { khoa: "open_hours", nhan: "Giờ mở cửa", goiY: "8h00 – 22h00 mỗi ngày" },
  {
    khoa: "map_url",
    nhan: "Link Google Maps",
    goiY: "https://maps.app.goo.gl/…",
    kieu: "url",
    chuThich: "Mở Google Maps, tìm quán, bấm Chia sẻ rồi dán link vào đây",
  },
  { khoa: "facebook_url", nhan: "Facebook", goiY: "https://facebook.com/…", kieu: "url" },
  { khoa: "instagram_url", nhan: "Instagram", goiY: "https://instagram.com/…", kieu: "url" },
  { khoa: "tiktok_url", nhan: "TikTok", goiY: "https://tiktok.com/@…", kieu: "url" },
  { khoa: "zalo_url", nhan: "Zalo", goiY: "https://zalo.me/…", kieu: "url" },
];

export function FormThongTinQuan({ quan }: { quan: ShopSettings | null }) {

  const [du, datDu] = useState<DuLieuQuan>({
    shop_name: quan?.shop_name ?? "",
    address: quan?.address ?? "",
    phone: quan?.phone ?? "",
    open_hours: quan?.open_hours ?? "",
    facebook_url: quan?.facebook_url ?? "",
    instagram_url: quan?.instagram_url ?? "",
    tiktok_url: quan?.tiktok_url ?? "",
    zalo_url: quan?.zalo_url ?? "",
    map_url: quan?.map_url ?? "",
  });

  const [dangLuu, datDangLuu] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);
  const [daLuu, datDaLuu] = useState(false);

  async function luu(e: React.FormEvent) {
    e.preventDefault();
    datLoi(null);
    datDaLuu(false);
    datDangLuu(true);

    const kq = await luuThongTinQuan(du);
    datDangLuu(false);

    if (!kq.ok) {
      datLoi(kq.loi);
      return;
    }

    datDaLuu(true);
  }

  return (
    <>
      <form onSubmit={luu} className="flex flex-col gap-4">
        {CAC_O.map((o) => (
          <label key={o.khoa} className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-fg">{o.nhan}</span>
            <input
              type={o.kieu ?? "text"}
              value={du[o.khoa] ?? ""}
              onChange={(e) =>
                datDu((cu) => ({ ...cu, [o.khoa]: e.target.value }))
              }
              placeholder={o.goiY}
              inputMode={o.kieu === "tel" ? "tel" : undefined}
              autoCapitalize={o.kieu === "url" ? "none" : undefined}
              className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg placeholder:text-muted focus:border-brand focus:outline-none"
            />
            {o.chuThich && (
              <span className="text-sm text-muted">{o.chuThich}</span>
            )}
          </label>
        ))}

        {loi && (
          <p
            role="alert"
            className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
          >
            {loi}
          </p>
        )}

        {daLuu && (
          <p
            role="status"
            className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
          >
            Đã lưu. Trang khách cập nhật trong vài giây.
          </p>
        )}

        <button
          type="submit"
          disabled={dangLuu}
          className="h-12 rounded-full bg-brand text-base font-medium text-brand-fg disabled:opacity-60"
        >
          {dangLuu ? "Đang lưu…" : "Lưu thông tin quán"}
        </button>
      </form>

      {/* ---------- Bảo mật ---------- */}
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-base font-bold text-fg">Bảo mật</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Nếu mất điện thoại hoặc nghi ngờ có người khác đăng nhập được, bấm nút
          dưới đây. Mọi thiết bị đang đăng nhập sẽ bị thoát ra, kể cả máy này.
          Sau đó bạn đăng nhập lại bằng email và mật khẩu.
        </p>
        <div className="mt-4">
          <NutDangXuat
            kieu="noi-bat"
            phamVi="moi-thiet-bi"
            nhan="Đăng xuất khỏi mọi thiết bị"
          />
        </div>
      </section>
    </>
  );
}
