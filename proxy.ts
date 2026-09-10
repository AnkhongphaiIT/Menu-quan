import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * CHẶN NGƯỜI CHƯA ĐĂNG NHẬP VÀO TRANG QUẢN TRỊ.
 *
 * ⚠️ Ở Next.js 16, file này BẮT BUỘC tên là `proxy.ts` và hàm phải tên `proxy`.
 * Trước đây nó tên `middleware.ts` / `middleware()`. Đổi lại tên cũ là mất
 * tác dụng hoàn toàn — trang admin sẽ mở toang mà không báo lỗi gì.
 *
 * File này còn một việc nữa quan trọng không kém: LÀM MỚI PHIÊN ĐĂNG NHẬP.
 * Thẻ đăng nhập của Supabase hết hạn sau khoảng một giờ. Chỉ ở đây mới ghi
 * được cookie mới, vì Server Component không có quyền ghi cookie. Không có
 * bước này thì chủ quán bị đăng xuất liên tục.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI LỚP BẢO VỆ CHÍNH.
 * Nó chỉ đá người chưa đăng nhập về màn hình đăng nhập cho gọn. Lớp bảo vệ
 * thật là Row Level Security trong database: kể cả người lạ đăng nhập được
 * và vào tới `/admin`, database vẫn từ chối mọi lệnh ghi. Điều này đã được
 * kiểm chứng bằng Bài 3 trong supabase/test-rls.sql.
 */
export async function proxy(request: NextRequest) {
  let phanHoi = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const khoa = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /* Chưa khai báo biến môi trường thì không kiểm tra được gì. Cho đi tiếp để
     trang admin tự hiện lời nhắc "chưa cấu hình", thay vì đá vòng vòng. */
  if (!url || !khoa) return phanHoi;

  const db = createServerClient(url, khoa, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(danhSach) {
        for (const { name, value } of danhSach) {
          request.cookies.set(name, value);
        }
        phanHoi = NextResponse.next({ request });
        for (const { name, value, options } of danhSach) {
          phanHoi.cookies.set(name, value, options);
        }
      },
    },
  });

  /* Bắt buộc gọi getUser() ở đây: chính lệnh này kích hoạt việc làm mới thẻ
     đăng nhập và ghi cookie mới qua setAll ở trên. Bỏ đi là phiên đăng nhập
     không bao giờ được gia hạn. */
  const {
    data: { user },
  } = await db.auth.getUser();

  const duongDan = request.nextUrl.pathname;
  const laTrangDangNhap = duongDan.startsWith("/admin/login");

  // Chưa đăng nhập mà đòi vào trang quản trị -> đá về màn hình đăng nhập
  if (!user && !laTrangDangNhap) {
    const dich = request.nextUrl.clone();
    dich.pathname = "/admin/login";
    /* Nhớ lại chỗ khách định vào, đăng nhập xong quay lại đúng chỗ đó. */
    dich.searchParams.set("tiep", duongDan);
    return NextResponse.redirect(dich);
  }

  // Đã đăng nhập rồi mà còn mở màn hình đăng nhập -> đưa thẳng vào quản trị
  if (user && laTrangDangNhap) {
    const dich = request.nextUrl.clone();
    dich.pathname = "/admin";
    dich.search = "";
    return NextResponse.redirect(dich);
  }

  return phanHoi;
}

export const config = {
  /* Chỉ chạy cho đường dẫn /admin. Không đặt matcher thì nó chạy cho MỌI yêu
     cầu kể cả ảnh, CSS, JavaScript — vừa chậm vừa dễ chặn nhầm. */
  matcher: ["/admin/:path*"],
};
