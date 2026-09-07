"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart-context";

/**
 * Thông báo nhẹ khi khách mở lại web và giỏ hàng cũ còn hạn (yêu cầu F3).
 *
 * Vì sao cần: khách lỡ thoát Safari rồi quét QR vào lại, thấy giỏ hàng vẫn
 * còn nguyên mà không được báo gì thì dễ tưởng mình bấm nhầm. Một dòng chữ
 * hiện 5 giây là đủ, không cần nút bấm.
 *
 * Đặt ở ĐÁY màn hình, ngay trên nút giỏ hàng — không đặt ở trên đầu.
 * Lý do: thanh dính (ô tìm kiếm + dải danh mục) không nằm sát mép trên màn
 * hình, phía trên nó còn tên quán cuộn được. Nên "ngay dưới thanh dính" là
 * một vị trí thay đổi liên tục theo mức cuộn, đặt thông báo ở đó sẽ đè lên
 * dải danh mục lúc khách đang ở đầu trang. Đáy màn hình thì luôn cố định.
 */
export function ToastKhoiPhuc() {
  const { vuaKhoiPhuc, tatThongBaoKhoiPhuc } = useCart();

  useEffect(() => {
    if (!vuaKhoiPhuc) return;
    const henGio = setTimeout(tatThongBaoKhoiPhuc, 5000);
    return () => clearTimeout(henGio);
  }, [vuaKhoiPhuc, tatThongBaoKhoiPhuc]);

  if (!vuaKhoiPhuc) return null;

  return (
    <div
      /* role="status" để trình đọc màn hình đọc lên mà không cắt ngang
         việc khách đang làm. pointer-events-none để nếu nó có che mất
         nút nào thì khách vẫn bấm xuyên qua được. */
      role="status"
      className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
      /* Nút giỏ hàng ở đáy cao khoảng 80px; đẩy thông báo lên trên nó 8px nữa.
         env(safe-area-inset-bottom) là phần khuyết dành cho thanh vuốt của
         iPhone không viền — không trừ đi thì thông báo bị thanh đó che. */
      style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
    >
      <p className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-fg shadow-lg shadow-black/10">
        Đã khôi phục giỏ hàng của bạn
      </p>
    </div>
  );
}
