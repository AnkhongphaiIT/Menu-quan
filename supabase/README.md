# Hướng dẫn dựng cơ sở dữ liệu trên Supabase

Thư mục này chứa 3 file:

| File | Dùng để làm gì |
|---|---|
| `migrations/001_init.sql` | Tạo 4 bảng, phân quyền, tạo kho ảnh. **Chạy một lần.** |
| `test-rls.sql` | Bài kiểm tra chứng minh người ngoài không sửa được menu. **Chạy sau khi tạo xong.** |
| `README.md` | File bạn đang đọc |

Làm theo đúng thứ tự 4 bước dưới. Tổng thời gian khoảng 10 phút.

---

## BƯỚC 1 — Chạy file tạo bảng

1. Mở **https://supabase.com/dashboard** → bấm vào project `menu-quan`.
2. Cột trái, tìm biểu tượng **SQL Editor** (hình tờ giấy có chữ SQL). Bấm vào.
3. Bấm nút **New query** ở góc trên.
4. Mở file `supabase/migrations/001_init.sql` trên máy bằng Notepad → **Ctrl+A** chọn hết → **Ctrl+C** copy.
5. Dán vào ô SQL Editor → bấm nút **Run** (hoặc **Ctrl+Enter**).

**Kết quả đúng:** góc dưới hiện chữ **Success. No rows returned** màu xanh.

> File này chạy lại được nhiều lần mà không hỏng dữ liệu. Nếu lỡ chạy hai lần cũng không sao.

### Kiểm tra nhanh

Cột trái → **Table Editor**. Phải thấy đủ **4 bảng**:

```
admin_allowlist
categories
menu_items
shop_settings
```

Bấm vào `shop_settings` — phải có sẵn **đúng 1 dòng** với `shop_name` = `Quan an vat`. Đó là dòng tạm, Giai đoạn 6 bạn sẽ sửa lại thành tên quán thật.

Cột trái → **Storage**. Phải thấy kho ảnh tên **`menu-images`**.

---

## BƯỚC 2 — Thêm email của bạn vào danh sách admin ⭐

**Đây là bước quan trọng nhất. Bỏ qua bước này thì không ai sửa được menu, kể cả bạn.**

Quay lại **SQL Editor** → **New query** → dán đoạn dưới, **thay email thật của bạn vào**:

```sql
insert into public.admin_allowlist (email)
values (lower('EMAIL-CUA-BAN@gmail.com'))
on conflict (email) do nothing;
```

Bấm **Run**.

⚠️ Email này phải **trùng khớp với email bạn sẽ dùng để đăng nhập trang `/admin`** ở Giai đoạn 6. Gõ sai một chữ là sau này không đăng nhập quản trị được.

Kiểm tra lại bằng lệnh:

```sql
select * from public.admin_allowlist;
```

Phải thấy đúng email của bạn hiện ra.

---

## BƯỚC 3 — Chạy bài kiểm tra phân quyền ⭐

Đây là phần **nghiệm thu** của Giai đoạn 2. Đừng bỏ qua — nó chứng minh menu của bạn thực sự được bảo vệ.

Mở file `supabase/test-rls.sql`, copy toàn bộ, dán vào **SQL Editor**.

**Chạy từng bài một**: bôi đen riêng đoạn của Bài 1 rồi bấm Run, đọc kết quả, rồi mới sang Bài 2. Chạy cả 4 bài cùng lúc thì SQL Editor chỉ hiện kết quả bài cuối, khó đối chiếu.

### Bảng đối chiếu kết quả

| Bài | Nội dung | Kết quả **đúng** |
|---|---|---|
| **1** | Khách vãng lai đọc menu | ✅ Chạy được, trả về số dòng |
| **2** | Khách vãng lai ghi dữ liệu | 🔴 **Báo lỗi đỏ** — `permission denied for table` **hoặc** `violates row-level security policy`. Cả hai câu đều là kết quả đúng, chỉ khác nhau ở chỗ bị chặn sớm hay muộn. |
| **3** | Người lạ đã đăng nhập ghi dữ liệu | 🔴 `is_admin = false`, rồi **báo lỗi đỏ** giống Bài 2 |
| **4** | Chủ quán ghi dữ liệu | ✅ `is_admin = true`, chèn được 1 dòng |

**Bài 2 và Bài 3 BÁO LỖI ĐỎ mới là ĐÚNG.** Lỗi ở đây nghĩa là database đang từ chối người lạ — chính xác là điều bạn muốn. Nếu hai bài đó chạy trót lọt không lỗi thì mới là hỏng.

Cả 4 bài đều tự huỷ thay đổi khi chạy xong (`rollback`), không để lại rác trong database.

### Vì sao phải có dòng `set local role` trong bài kiểm tra

SQL Editor của Supabase chạy với quyền `postgres` — quyền cao nhất, **bỏ qua toàn bộ rào cản RLS**. Nếu bạn gõ thẳng `insert into menu_items ...` trong SQL Editor thì nó sẽ chạy được, và điều đó **không** có nghĩa là bảo mật bị hỏng.

Dòng `set local role anon;` hạ quyền xuống đúng mức của một khách vãng lai quét QR. Chỉ khi hạ quyền rồi thử ghi thì phép thử mới có ý nghĩa. Đừng xoá dòng đó đi.

---

## BƯỚC 4 — Điền URL và key vào máy của bạn

1. Supabase Dashboard → cột trái, cuối cùng → **Project Settings** (biểu tượng bánh răng) → mục **API**.
2. Bạn cần **2 giá trị**:
   - **Project URL** — dạng `https://abcdefgh.supabase.co`
   - **anon public key** (bản Supabase mới có thể gọi là **Publishable key**) — một chuỗi rất dài
3. Trên máy, vào thư mục `C:\menu-quan`, copy file `.env.local.example` thành file mới tên **`.env.local`** rồi mở bằng Notepad, dán 2 giá trị vào:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=chuoi-rat-dai-dan-vao-day
```

4. Lưu file.

### Ba điều phải nhớ về hai giá trị này

- **Không dán chúng vào khung chat với Claude Code.** Không cần thiết, và chat có thể bị lưu lại.
- **File `.env.local` đã được `.gitignore` chặn**, sẽ không bị đẩy lên GitHub. Điều này đã được kiểm tra ở Giai đoạn 1.
- **`anon key` bị lộ cũng không chết.** Nó vốn được nhúng vào trang web cho mọi khách dùng — ai xem mã nguồn trang cũng thấy. Nó an toàn *chính vì* RLS chặn ở tầng database. Cái tuyệt đối không được lộ là **`service_role key`** (nằm ngay dưới trong cùng trang đó) — key này bỏ qua mọi RLS. **Dự án này không dùng tới `service_role key`. Đừng bao giờ copy nó ra khỏi Supabase.**

---

## Nếu gặp lỗi

### `permission denied for table objects`

Xảy ra ở Phần 9 của file SQL, khi tạo phân quyền cho kho ảnh. Một số project Supabase không cho sửa bảng `storage.objects` bằng SQL. Làm bằng giao diện thay thế:

1. Dashboard → **Storage** → bấm vào bucket **`menu-images`** → tab **Policies**.
2. Bấm **New policy** → chọn **For full customization**.
3. Tạo 4 policy theo bảng sau:

| Tên policy | Allowed operation | Target roles | Điều kiện (USING / WITH CHECK) |
|---|---|---|---|
| `menu-images doc` | SELECT | `anon`, `authenticated` | `bucket_id = 'menu-images'` |
| `menu-images tai len` | INSERT | `authenticated` | `bucket_id = 'menu-images' and public.is_admin()` |
| `menu-images thay the` | UPDATE | `authenticated` | `bucket_id = 'menu-images' and public.is_admin()` |
| `menu-images xoa` | DELETE | `authenticated` | `bucket_id = 'menu-images' and public.is_admin()` |

Phần còn lại của file SQL (4 bảng, RLS) vẫn chạy đúng — chỉ riêng phần ảnh phải làm tay.

### `relation "storage.buckets" does not exist`

Project Supabase chưa bật Storage. Vào **Storage** ở cột trái một lần để nó khởi tạo, rồi chạy lại file SQL.

### Bài 4 báo lỗi, `is_admin` trả về `false` hoặc `null`

Bạn chưa làm **Bước 2**, hoặc gõ sai email. Chạy `select * from public.admin_allowlist;` để kiểm tra.

### Lỡ chạy nhầm, muốn xoá sạch làm lại từ đầu

⚠️ Lệnh dưới **xoá toàn bộ dữ liệu menu**. Chỉ dùng khi database còn trống, chưa nhập món thật.

```sql
drop table if exists public.menu_items    cascade;
drop table if exists public.categories    cascade;
drop table if exists public.shop_settings cascade;
drop table if exists public.admin_allowlist cascade;
drop function if exists public.is_admin() cascade;
```

Chạy xong thì chạy lại `001_init.sql` từ Bước 1.

---

## Tóm tắt thiết kế phân quyền

```
                    Yêu cầu ghi dữ liệu
                            │
                            ▼
              Lấy email trong thẻ đăng nhập (JWT)
                            │
                            ▼
              Email có trong admin_allowlist?
                     │              │
                   CÓ│              │KHÔNG
                     ▼              ▼
                 CHO GHI        TỪ CHỐI
```

| Bảng | Ai đọc được | Ai ghi được |
|---|---|---|
| `categories` | Tất cả mọi người | Chỉ admin |
| `menu_items` | Tất cả mọi người | Chỉ admin |
| `shop_settings` | Tất cả mọi người | Chỉ admin (chỉ sửa, không thêm/xoá) |
| `admin_allowlist` | Chỉ admin | **Không ai** — chỉ sửa được trong SQL Editor |
| Kho ảnh `menu-images` | Tất cả mọi người | Chỉ admin |

Kiểm tra này nằm **trong database**, không nằm trong trang web. Người ngoài có sửa mã trang web, gọi thẳng API, hay biết đường dẫn `/admin` thì vẫn bị Postgres chặn.
