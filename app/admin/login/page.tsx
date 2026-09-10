"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { ketNoiTrinhDuyet } from "@/lib/supabase-browser";

/**
 * Ô tên đăng nhập được điền sẵn đuôi này, chủ quán chỉ gõ phần tên phía trước.
 * Muốn dùng email khác Gmail thì xoá đuôi đi rồi gõ đầy đủ — vẫn được.
 */
const DUOI_MAC_DINH = "@gmail.com";

function ghepEmail(nhapVao: string): string {
  const s = nhapVao.trim();
  if (!s) return "";
  /* Lỡ xoá mất đuôi mà chỉ gõ tên thì tự thêm lại, cho chắc. */
  return s.includes("@") ? s : s + DUOI_MAC_DINH;
}

export default function TrangDangNhap() {
  return (
    <Suspense fallback={null}>
      <FormDangNhap />
    </Suspense>
  );
}

function FormDangNhap() {
  const router = useRouter();
  const thamSo = useSearchParams();
  /* proxy.ts nhớ lại chỗ khách định vào trước khi bị đá về đây */
  const diTiepToi = thamSo.get("tiep") ?? "/admin";

  /* Điền sẵn "@gmail.com" ngay từ đầu */
  const [tenDangNhap, datTenDangNhap] = useState(DUOI_MAC_DINH);
  const [matKhau, datMatKhau] = useState("");
  const [hienMatKhau, datHienMatKhau] = useState(false);
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);

  const oTenRef = useRef<HTMLInputElement>(null);
  const emailDayDu = ghepEmail(tenDangNhap);
  /* Chưa gõ gì ngoài cái đuôi điền sẵn */
  const chuaGoTen = tenDangNhap.trim() === DUOI_MAC_DINH;

  /**
   * Đưa con trỏ về ĐẦU ô khi chủ quán bấm vào, chừng nào ô mới chỉ có đuôi
   * điền sẵn. Không có bước này thì con trỏ nhảy xuống cuối và gõ ra
   * "@gmail.comnguyenan" — sai hoàn toàn.
   *
   * Phải hoãn lại một nhịp vì trình duyệt tự đặt vị trí con trỏ SAU khi sự
   * kiện focus chạy xong; chỉnh ngay lập tức sẽ bị nó ghi đè.
   *
   * Dùng setTimeout chứ KHÔNG dùng requestAnimationFrame: rAF chỉ chạy khi
   * trang đang được vẽ ra. Trang bị ẩn (chuyển tab, thu nhỏ trình duyệt) là
   * rAF đứng im và con trỏ không bao giờ được đưa về đầu.
   */
  function conTroVeDau() {
    const o = oTenRef.current;
    if (!o || o.value !== DUOI_MAC_DINH) return;
    setTimeout(() => o.setSelectionRange(0, 0), 0);
  }

  async function guiDangNhap(e: React.FormEvent) {
    e.preventDefault();
    datLoi(null);

    if (!emailDayDu || chuaGoTen) {
      datLoi("Chưa nhập tên đăng nhập (phần trước @gmail.com).");
      return;
    }

    datDangGui(true);

    try {
      const db = ketNoiTrinhDuyet();
      const { error } = await db.auth.signInWithPassword({
        email: emailDayDu,
        password: matKhau,
      });

      if (error) {
        /* Cố tình KHÔNG nói rõ "sai mật khẩu" hay "email không tồn tại".
           Nói rõ là giúp người lạ dò xem email nào có tài khoản. */
        datLoi("Email hoặc mật khẩu không đúng. Thử lại nhé.");
        datDangGui(false);
        return;
      }

      /* refresh() để máy chủ đọc lại cookie phiên đăng nhập vừa tạo,
         nếu không trang đích vẫn tưởng chưa đăng nhập và đá ngược về đây. */
      router.replace(diTiepToi);
      router.refresh();
    } catch {
      datLoi("Không kết nối được. Kiểm tra mạng rồi thử lại.");
      datDangGui(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <h1 className="text-2xl font-bold text-fg">Quản trị menu</h1>
      <p className="mt-1 text-sm text-muted">
        Đăng nhập bằng email của chủ quán
      </p>

      <form onSubmit={guiDangNhap} className="mt-6 flex flex-col gap-4">
        {/* ---------- Tên đăng nhập ---------- */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="ten-dang-nhap" className="text-sm font-medium text-fg">
            Tên đăng nhập
          </label>

          <input
            id="ten-dang-nhap"
            ref={oTenRef}
            value={tenDangNhap}
            onChange={(e) => datTenDangNhap(e.target.value)}
            onFocus={conTroVeDau}
            onClick={conTroVeDau}
            required
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            /* text-base = 16px: dưới mức này Safari trên iPhone tự phóng to trang */
            className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
          />

          <p className="text-sm text-muted">
            {chuaGoTen ? (
              <>
                Gõ phần tên vào <strong className="text-fg">phía trước</strong>{" "}
                chữ @gmail.com có sẵn.
              </>
            ) : (
              <>
                Sẽ đăng nhập bằng{" "}
                <strong className="text-fg">{emailDayDu}</strong>
              </>
            )}
          </p>
        </div>

        {/* ---------- Mật khẩu ---------- */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mat-khau" className="text-sm font-medium text-fg">
            Mật khẩu
          </label>

          <div className="relative">
            <input
              id="mat-khau"
              type={hienMatKhau ? "text" : "password"}
              value={matKhau}
              onChange={(e) => datMatKhau(e.target.value)}
              required
              autoComplete="current-password"
              /* pr-14 chừa chỗ cho nút con mắt, không để chữ chui xuống dưới nút */
              className="h-12 w-full rounded-xl border border-line bg-surface pr-14 pl-4 text-base text-fg focus:border-brand focus:outline-none"
            />

            <button
              type="button"
              onClick={() => datHienMatKhau((cu) => !cu)}
              /* aria-pressed cho trình đọc màn hình biết đây là nút bật/tắt.
                 Nhãn nói rõ hành động sẽ xảy ra khi bấm, không phải trạng thái. */
              aria-pressed={hienMatKhau}
              aria-label={hienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              title={hienMatKhau ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              /* size-11 = 44px, mức tối thiểu để ngón tay bấm trúng */
              className="absolute top-0.5 right-0.5 grid size-11 place-items-center rounded-full text-xl"
            >
              <span aria-hidden>{hienMatKhau ? "🙈" : "👁️"}</span>
            </button>
          </div>

          <p className="text-sm text-muted">
            Bấm hình con mắt để xem mật khẩu đang gõ.
          </p>
        </div>

        {loi && (
          <p
            role="alert"
            className="rounded-xl border border-line bg-brand-soft px-4 py-3 text-sm text-fg"
          >
            {loi}
          </p>
        )}

        <button
          type="submit"
          disabled={dangGui}
          className="h-12 rounded-full bg-brand text-base font-medium text-brand-fg disabled:opacity-60"
        >
          {dangGui ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-sm leading-relaxed text-muted">
        Máy này sẽ được ghi nhớ, bạn không phải đăng nhập lại mỗi ngày. Nếu mất
        máy, vào mục <strong className="text-fg">Thông tin quán</strong> bấm
        “Đăng xuất khỏi mọi thiết bị”.
      </p>
    </main>
  );
}
