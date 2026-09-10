import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Kết nối Supabase CÓ MANG THEO PHIÊN ĐĂNG NHẬP, dùng cho trang quản trị.
 *
 * Khác gì với lib/supabase.ts:
 *   lib/supabase.ts      - đọc menu công khai, không biết ai đang xem, trang
 *                          dựng sẵn thành file tĩnh cho 50 khách quét QR.
 *   file này (auth)      - đọc cookie để biết ai đang đăng nhập. Nhờ vậy
 *                          database mới kiểm tra được email có nằm trong
 *                          admin_allowlist hay không.
 *
 * Đụng vào cookie khiến trang phải dựng lại cho từng người — với trang admin
 * thì đó là điều BẮT BUỘC, và cũng không sao vì chỉ mình chủ quán dùng.
 *
 * Toàn bộ phần chặn ghi dữ liệu vẫn nằm ở tầng database (Row Level Security),
 * không nằm ở đây. File này chỉ có nhiệm vụ chuyển thẻ đăng nhập xuống cho
 * database xem. Kể cả file này bị viết sai, người lạ vẫn không ghi được.
 */
export async function taoKetNoiCoDangNhap() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const khoa = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !khoa) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const khoBanh = await cookies();

  return createServerClient(url, khoa, {
    cookies: {
      getAll() {
        return khoBanh.getAll();
      },
      setAll(danhSach) {
        try {
          for (const { name, value, options } of danhSach) {
            khoBanh.set(name, value, options);
          }
        } catch {
          /* Server Component không được phép ghi cookie — Next.js chặn.
             Bỏ qua ở đây là ĐÚNG: việc làm mới phiên đăng nhập đã do
             proxy.ts lo, nó chạy trước và có quyền ghi cookie. */
        }
      },
    },
  });
}

/**
 * Lấy thông tin người đang đăng nhập, hoặc null nếu chưa đăng nhập.
 *
 * Dùng getUser() chứ KHÔNG dùng getSession(). Khác biệt quan trọng:
 * getSession() chỉ đọc cookie trong máy và tin luôn — cookie giả mạo được.
 * getUser() gửi thẻ lên máy chủ Supabase để xác minh chữ ký. Chậm hơn một
 * chút nhưng đây là chỗ không được phép tin bừa.
 */
export async function layNguoiDangNhap() {
  const db = await taoKetNoiCoDangNhap();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user;
}

/**
 * Kiểm tra người đang đăng nhập có nằm trong danh sách admin không.
 *
 * Đây là kiểm tra ở tầng GIAO DIỆN, chỉ để hiện lời nhắc tử tế thay vì để
 * khách bấm nút rồi nhận lỗi database khó hiểu. Nó KHÔNG phải lớp bảo vệ —
 * lớp bảo vệ thật là Row Level Security, và nó vẫn chặn dù hàm này có sai.
 */
export async function laAdmin(): Promise<boolean> {
  const db = await taoKetNoiCoDangNhap();
  const { data, error } = await db.rpc("is_admin");
  if (error) {
    console.error("[admin] Không kiểm tra được quyền:", error.message);
    return false;
  }
  return data === true;
}
