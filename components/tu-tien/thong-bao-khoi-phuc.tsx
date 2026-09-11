"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/** Chép từ components/toast-khoi-phuc.tsx, chỉ đổi lời. Xem giải thích vị trí ở bản gốc. */
export function ThongBaoKhoiPhucTuTien() {
  const { vuaKhoiPhuc, tatThongBaoKhoiPhuc } = useCart();

  useEffect(() => {
    if (!vuaKhoiPhuc) return;
    const henGio = setTimeout(tatThongBaoKhoiPhuc, 5000);
    return () => clearTimeout(henGio);
  }, [vuaKhoiPhuc, tatThongBaoKhoiPhuc]);

  if (!vuaKhoiPhuc) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <p className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-fg shadow-lg shadow-black/10">
        Túi trữ vật của khách quan vẫn còn nguyên (đã khôi phục giỏ hàng)
      </p>
    </div>
  );
}
