"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { khoMacDinh } from "@/lib/bo-nho";
import { batTuTien, dangBatTuTien, tatTuTien } from "@/lib/tu-tien/che-do";

/**
 * Công tắc chế độ tu tiên: tắt = menu thường (/), bật = trang /tu-tien.
 *
 * Đây là thứ DUY NHẤT của phần tu tiên nằm trên trang thường. Toàn bộ phần
 * còn lại ở trang riêng, code riêng (components/tu-tien), dữ liệu riêng — trang
 * tu tiên có trục trặc gì thì trang thường vẫn chạy bình thường.
 *
 * Bật lên thì nhớ 60 phút: mã QR luôn mở trang thường, nhưng khách đã bật tu
 * tiên mà quét lại trong 60 phút thì được đưa thẳng sang trang tu tiên.
 */
export function NutTuTien({ dangBat }: { dangBat: boolean }) {
  const router = useRouter();

  useEffect(() => {
    const kho = khoMacDinh();
    if (dangBat) {
      /* Đang xem trang tu tiên: gia hạn thêm 60 phút tính từ lúc này. */
      batTuTien(kho, Date.now());
      router.prefetch("/");
    } else if (dangBatTuTien(kho, Date.now())) {
      router.replace("/tu-tien");
    } else {
      /* Tải sẵn trang tu tiên để lúc bấm chuyển sang cho nhanh. */
      router.prefetch("/tu-tien");
    }
  }, [dangBat, router]);

  function bam() {
    const kho = khoMacDinh();
    if (dangBat) {
      tatTuTien(kho);
      router.push("/");
    } else {
      batTuTien(kho, Date.now());
      router.push("/tu-tien");
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dangBat}
      aria-label={dangBat ? "Tắt chế độ tu tiên, về menu thường" : "Bật chế độ tu tiên"}
      onClick={bam}
      className={`flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors ${
        dangBat
          ? "border-brand bg-brand text-brand-fg"
          : "border-line bg-surface text-fg"
      }`}
    >
      <span aria-hidden>☯️</span>
      <span>Tu tiên</span>
      {/* Hình công tắc nhỏ: chấm tròn nằm bên phải là đang bật */}
      <span
        aria-hidden
        className={`relative h-5 w-9 rounded-full transition-colors ${
          dangBat ? "bg-brand-fg/35" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full shadow transition-all ${
            dangBat ? "left-[1.125rem] bg-brand-fg" : "left-0.5 bg-surface"
          }`}
        />
      </span>
    </button>
  );
}
