"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ketNoiTrinhDuyet } from "@/lib/supabase-browser";

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

  const [email, datEmail] = useState("");
  const [matKhau, datMatKhau] = useState("");
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);

  async function guiDangNhap(e: React.FormEvent) {
    e.preventDefault();
    datLoi(null);
    datDangGui(true);

    try {
      const db = ketNoiTrinhDuyet();
      const { error } = await db.auth.signInWithPassword({
        email: email.trim(),
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
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => datEmail(e.target.value)}
            required
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            /* text-base = 16px: dưới mức này Safari trên iPhone tự phóng to trang */
            className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-fg">Mật khẩu</span>
          <input
            type="password"
            value={matKhau}
            onChange={(e) => datMatKhau(e.target.value)}
            required
            autoComplete="current-password"
            className="h-12 rounded-xl border border-line bg-surface px-4 text-base text-fg focus:border-brand focus:outline-none"
          />
        </label>

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
