import { createClient } from "@supabase/supabase-js";

/**
 * Kết nối tới Supabase để ĐỌC dữ liệu công khai (menu, thông tin quán).
 *
 * Cố tình dùng createClient thường, KHÔNG dùng createServerClient của
 * @supabase/ssr. Lý do quan trọng:
 *
 * createServerClient phải đọc cookie để biết ai đang đăng nhập. Chỉ cần đụng
 * tới cookie là Next.js chuyển trang sang chế độ "dựng lại cho từng người",
 * tức là mỗi khách quét QR sẽ tạo một lượt truy vấn database. 50 khách cùng
 * lúc thành 50 lượt truy vấn — đúng cái mà yêu cầu F7 muốn tránh.
 *
 * Trang menu không cần biết ai đang xem: mọi khách thấy cùng một menu. Nên
 * dùng client thường, Next dựng sẵn trang thành file tĩnh, 50 khách chỉ là
 * 50 lượt tải file từ CDN.
 *
 * Trang admin ở Giai đoạn 6 mới cần biết ai đăng nhập, lúc đó mới dùng
 * @supabase/ssr — và trang đó thì không cần dựng tĩnh.
 */

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KHOA_CONG_KHAI = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Đã khai báo đủ 2 biến môi trường chưa.
 *
 * Kiểm tra trước khi gọi, để trang hiện lời nhắc tử tế thay vì sập trắng.
 * Tình huống này xảy ra thật: quên khai báo biến trên Vercel là web thật
 * trống trơn trong khi máy ở nhà vẫn chạy tốt.
 */
export function daCauHinhSupabase(): boolean {
  if (!URL_SUPABASE || !KHOA_CONG_KHAI) return false;

  /* Nhận ra giá trị mẫu trong .env.local.example chưa được thay.
     Nếu không kiểm tra, trang sẽ thật sự thử gọi tới địa chỉ giả rồi báo lỗi
     mạng khó hiểu, thay vì nhắc thẳng "bạn quên điền giá trị thật". */
  const laMau =
    URL_SUPABASE.includes("xxxx") ||
    KHOA_CONG_KHAI.includes("thay-bang") ||
    !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(URL_SUPABASE.trim());

  return !laMau;
}

export function taoKetNoi() {
  if (!URL_SUPABASE || !KHOA_CONG_KHAI) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Trên máy: điền vào file .env.local. " +
        "Trên web thật: Vercel > Settings > Environment Variables.",
    );
  }

  return createClient(URL_SUPABASE, KHOA_CONG_KHAI, {
    auth: {
      // Trang menu không đăng nhập ai cả, tắt hết phần quản lý phiên cho nhẹ
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
