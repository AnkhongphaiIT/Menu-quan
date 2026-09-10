"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ketNoiTrinhDuyet } from "@/lib/supabase-browser";

/**
 * Nút đăng xuất.
 *
 * `pham vi` = "moi-thiet-bi" sẽ thu hồi phiên đăng nhập trên TẤT CẢ máy —
 * dùng khi mất điện thoại (yêu cầu F5). Mặc định chỉ đăng xuất máy này.
 */
export function NutDangXuat({
  kieu = "vien",
  phamVi = "may-nay",
  nhan = "Đăng xuất",
}: {
  kieu?: "vien" | "noi-bat";
  phamVi?: "may-nay" | "moi-thiet-bi";
  nhan?: string;
}) {
  const router = useRouter();
  const [dangChay, datDangChay] = useState(false);

  async function dangXuat() {
    if (
      phamVi === "moi-thiet-bi" &&
      !window.confirm(
        "Thu hồi đăng nhập trên TẤT CẢ thiết bị?\n\n" +
          "Mọi máy đang đăng nhập sẽ bị đăng xuất, kể cả máy này. " +
          "Bạn sẽ phải đăng nhập lại bằng email và mật khẩu.",
      )
    ) {
      return;
    }

    datDangChay(true);
    const db = ketNoiTrinhDuyet();
    await db.auth.signOut({
      scope: phamVi === "moi-thiet-bi" ? "global" : "local",
    });

    router.replace("/admin/login");
    router.refresh();
  }

  const lop =
    kieu === "noi-bat"
      ? "h-12 rounded-full bg-brand px-5 text-base font-medium text-brand-fg"
      : "flex h-11 items-center rounded-full border border-line px-3 text-sm text-fg";

  return (
    <button
      type="button"
      onClick={dangXuat}
      disabled={dangChay}
      className={`${lop} disabled:opacity-60`}
    >
      {dangChay ? "Đang thoát…" : nhan}
    </button>
  );
}
