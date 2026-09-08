"use client";

import { useSyncExternalStore } from "react";
import * as Kho from "@/lib/theme-store";

/**
 * Nút chuyển giữa nền trắng và nền đen.
 *
 * Mặc định là nền trắng. Khách bấm sang nền đen thì lựa chọn được nhớ 60 phút.
 *
 * Nút hiện biểu tượng của chế độ SẼ CHUYỂN SANG khi bấm (đang sáng thì hiện
 * mặt trăng), chứ không phải chế độ đang dùng — đây là cách quen thuộc, khách
 * nhìn là hiểu bấm vào sẽ ra gì.
 */
export function ThemeToggle() {
  const cheDo = useSyncExternalStore(
    Kho.dangKy,
    Kho.layCheDo,
    Kho.layCheDoMayChu,
  );

  const dangToi = cheDo === "toi";

  return (
    <button
      type="button"
      onClick={Kho.doiCheDo}
      /* aria-pressed cho trình đọc màn hình biết đây là nút bật/tắt và đang
         ở trạng thái nào, thay vì chỉ đọc ra một biểu tượng vô nghĩa. */
      aria-pressed={dangToi}
      aria-label={dangToi ? "Chuyển sang nền trắng" : "Chuyển sang nền đen"}
      title={dangToi ? "Nền trắng" : "Nền đen"}
      className="grid size-11 shrink-0 place-items-center rounded-full border border-line bg-surface text-xl transition-transform active:scale-90"
    >
      <span aria-hidden>{dangToi ? "☀️" : "🌙"}</span>
    </button>
  );
}
