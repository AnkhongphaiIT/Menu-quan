import Link from "next/link";
import { NutDangXuat } from "./nut-dang-xuat";

/**
 * Khung chung của các trang quản trị: thanh điều hướng + phần nội dung.
 *
 * Thiết kế cho ngón tay cái trên điện thoại — chủ quán sẽ dùng ngay tại quán,
 * một tay cầm máy. Mọi thứ bấm được đều tối thiểu 44px.
 */
export function AdminShell({
  dangO,
  children,
}: {
  dangO: "mon" | "danh-muc" | "thong-tin" | "tu-tien";
  children: React.ReactNode;
}) {
  const cacMuc = [
    { khoa: "mon", ten: "Món ăn", duongDan: "/admin" },
    { khoa: "danh-muc", ten: "Danh mục", duongDan: "/admin/categories" },
    { khoa: "thong-tin", ten: "Thông tin quán", duongDan: "/admin/settings" },
    { khoa: "tu-tien", ten: "☯️ Tu tiên", duongDan: "/admin/tu-tien" },
  ] as const;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto w-full max-w-2xl px-4 pt-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg font-bold text-fg">Quản trị menu</h1>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="flex h-11 items-center rounded-full border border-line px-3 text-sm text-fg"
              >
                Xem trang khách
              </Link>
              <NutDangXuat />
            </div>
          </div>

          <nav aria-label="Mục quản trị">
            <ul className="an-thanh-cuon flex gap-2 overflow-x-auto py-3">
              {cacMuc.map((m) => {
                const dangChon = m.khoa === dangO;
                return (
                  <li key={m.khoa}>
                    <Link
                      href={m.duongDan}
                      aria-current={dangChon ? "page" : undefined}
                      className={`flex h-10 items-center rounded-full border px-4 text-sm whitespace-nowrap ${
                        dangChon
                          ? "border-brand bg-brand font-medium text-brand-fg"
                          : "border-line bg-surface text-fg"
                      }`}
                    >
                      {m.ten}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-4 pb-[max(3rem,env(safe-area-inset-bottom))]">
        {children}
      </main>
    </div>
  );
}

/**
 * Lời nhắc khi tài khoản đăng nhập được nhưng không nằm trong danh sách admin.
 *
 * Đây là tình huống của Bài 3 trong supabase/test-rls.sql: người lạ tạo tài
 * khoản thật rồi mò vào /admin. Họ vào được tới đây, nhưng database từ chối
 * mọi lệnh ghi. Hiện lời nhắc rõ ràng thay vì để họ bấm nút rồi nhận lỗi lạ.
 */
export function KhongCoQuyen({ email }: { email: string | null }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <p className="text-lg font-bold text-fg">Tài khoản không có quyền</p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {email ? (
          <>
            Email <strong className="text-fg">{email}</strong> không nằm trong
            danh sách quản trị của quán.
          </>
        ) : (
          "Tài khoản này không nằm trong danh sách quản trị của quán."
        )}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Nếu đây là tài khoản của bạn, thêm email này vào bảng{" "}
        <code className="text-fg">admin_allowlist</code> trong Supabase.
      </p>
      <div className="mt-6 flex justify-center">
        <NutDangXuat kieu="noi-bat" />
      </div>
    </div>
  );
}
