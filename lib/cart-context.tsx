"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { tongSoMon } from "./cart";
import type { GioHang } from "./cart";
import * as Kho from "./cart-store";

/**
 * Lớp vỏ React mỏng bọc quanh lib/cart-store.ts.
 *
 * Cả file này không có một cái useEffect nào, cũng không có useState.
 * React tự hỏi kho giỏ hàng qua useSyncExternalStore mỗi khi cần vẽ lại.
 * Toàn bộ phần tính toán nằm ở lib/cart.ts, phần lưu trữ ở lib/cart-store.ts.
 */

type BoiCanh = {
  gioHang: GioHang;
  soMon: number;
  them: (id: string) => void;
  bot: (id: string) => void;
  xoa: (id: string) => void;
  xoaSach: () => void;
  /** true khi vừa khôi phục được giỏ hàng cũ — dùng để hiện thông báo nhẹ */
  vuaKhoiPhuc: boolean;
  tatThongBaoKhoiPhuc: () => void;
};

const NoiChua = createContext<BoiCanh | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  /* Ba tham số lần lượt là: cách đăng ký nhận tin, cách lấy trạng thái ở máy
     khách, và cách lấy trạng thái lúc dựng trang trên máy chủ. Có tham số thứ
     ba thì HTML máy chủ và máy khách khớp nhau, không sinh lỗi lệch. */
  const trangThai = useSyncExternalStore(
    Kho.dangKy,
    Kho.layTrangThai,
    Kho.layTrangThaiMayChu,
  );

  const giaTri = useMemo<BoiCanh>(
    () => ({
      gioHang: trangThai.gio,
      soMon: tongSoMon(trangThai.gio),
      vuaKhoiPhuc: trangThai.vuaKhoiPhuc,
      them: Kho.them,
      bot: Kho.bot,
      xoa: Kho.xoa,
      xoaSach: Kho.xoaSach,
      tatThongBaoKhoiPhuc: Kho.tatThongBaoKhoiPhuc,
    }),
    [trangThai],
  );

  return <NoiChua.Provider value={giaTri}>{children}</NoiChua.Provider>;
}

export function useCart(): BoiCanh {
  const ctx = useContext(NoiChua);
  if (!ctx) {
    throw new Error("useCart phải được dùng bên trong <CartProvider>");
  }
  return ctx;
}
