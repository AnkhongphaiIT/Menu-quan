"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Kết nối Supabase chạy trong trình duyệt, dùng cho trang quản trị.
 *
 * Dùng ở hai chỗ:
 *   - Màn hình đăng nhập (gửi email + mật khẩu)
 *   - Tải ảnh món lên kho ảnh
 *
 * Phiên đăng nhập được lưu trong cookie chứ không phải localStorage, để máy
 * chủ cũng đọc được — nhờ vậy proxy.ts chặn được người chưa đăng nhập ngay
 * trước khi trang kịp hiện ra.
 */

let ketNoi: ReturnType<typeof createBrowserClient> | null = null;

export function ketNoiTrinhDuyet() {
  /* Dùng lại một kết nối duy nhất cho cả trang. Tạo mới mỗi lần gọi sẽ sinh
     nhiều bộ theo dõi phiên đăng nhập chạy song song, gây đăng xuất bất chợt. */
  if (ketNoi) return ketNoi;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const khoa = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !khoa) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  ketNoi = createBrowserClient(url, khoa);
  return ketNoi;
}
