# QUY TRÌNH LÀM WEB MENU QR CHO QUÁN ĂN VẶT

> **Cách dùng tài liệu này:** Mỗi phiên làm việc mới với Claude Code, mở đầu bằng:
> *"Đọc file `quy-trinh-menu-qr.md`, xem `git log` để biết đang ở giai đoạn nào, rồi làm tiếp đúng một giai đoạn kế tiếp. Xong thì dừng lại cho tôi nghiệm thu."*
> Làm từng giai đoạn một là cách giảm sai sót nhiều nhất — đừng để Claude Code làm hết một lượt rồi mới kiểm tra.

---

## PHẦN A — CÁC QUYẾT ĐỊNH ĐÃ CHỐT

| Hạng mục | Quyết định |
|---|---|
| Nền tảng | **Next.js (App Router) + TypeScript + Tailwind CSS** |
| Cơ sở dữ liệu & ảnh | **Supabase** (Postgres + Storage + Auth), gói Free |
| Hosting | **Vercel**, gói Hobby (miễn phí) |
| Giỏ hàng | Chỉ **chọn món + tạm tính tiền**. Chưa đặt online — nhưng phải chừa sẵn chỗ để thêm sau |
| Giao diện | **Chỉ làm menu thường**. Chế độ "tiên hiệp" để giai đoạn sau |
| Quy mô | ~54 món, 8 danh mục, tối đa 50 khách cùng lúc |
| Chi phí | 0đ. Chỉ tốn tiền nếu mua tên miền riêng (~250–350k/năm, **không bắt buộc**) |

**Phiên bản thực tế đã cài (Giai đoạn 1, ngày 07/09/2026):**
Next.js **16.3.4** · React **19.2.8** · Tailwind CSS **v4** · TypeScript 5 · Node.js **v24.20.0** · npm 11.19.0

**Vì sao chọn bộ này:** Vercel phục vụ trang menu dạng tĩnh đã dựng sẵn, nên 50 người quét QR cùng lúc chỉ là 50 lượt tải file — nhẹ hơn rất nhiều so với 50 lượt truy vấn database. Supabase lo phần lưu món, lưu ảnh và đăng nhập admin. Cả hai đều miễn phí ở quy mô này và không cần bạn quản lý máy chủ.

---

## PHẦN B — DANH MỤC MÓN (đã chuẩn hoá, đã chốt)

Danh sách gốc có 57 dòng nhưng chỉ **54 món thật** — các dòng trùng đã được gộp.

### 1. Mì – Nui – Bún (món chính)
1. Nui chiên trứng
2. Nui xào bò
3. Mì Ý
4. Mì trộn cá viên sốt mắm tỏi
5. Mì trộn trứng xúc xích
6. Mì trộn trứng cá
7. Mì trộn gà sốt chua ngọt
8. Mì trộn gà sốt phô mai
9. Mì trộn thịt
10. Mì cay
11. Mì tương đen
12. Bún nước tương
13. Lẩu Thái chua cay — **1 món, khách chọn sợi bún hoặc mì (tuỳ chọn, không tách giá)**

### 2. Mì phô mai
14. Mì phô mai trộn cá viên sốt mắm tỏi
15. Mì phô mai trộn trứng xúc xích
16. Mì phô mai trộn trứng cá
17. Mì phô mai trộn gà sốt chua ngọt
18. Mì phô mai trộn gà sốt phô mai

### 3. Bánh tráng
19. Bánh tráng trộn
20. Bánh tráng cuộn
21. Bánh tráng chấm muối hành / muối

### 4. Ăn vặt – Đồ chiên
22. Cá viên sốt mắm tỏi
23. Cá viên đủ loại
24. Bánh khoai mỡ
25. Hot dog
26. Phô mai que
27. **Xúc xích Đức**

### 5. Trà sữa
28. Trà sữa truyền thống
29. Trà sữa khoai môn
30. Trà sữa mix vị
31. Trà sữa Thái xanh
32. Trà sữa Thái đỏ
33. Trà sữa matcha
34. Lipton sữa
35. Sữa tươi trân châu đường đen
36. Matcha latte

### 6. Trà trái cây
37. Trà dâu
38. Trà đào
39. Trà vải
40. Trà ổi hồng chanh dây
41. Trà táo
42. Trà việt quất
43. Trà tắc
44. Trà tắc Thái xanh

### 7. Nước giải khát khác
45. Đá me
46. Cam ép
47. Soda dâu
48. Soda mix vị

### 8. Sữa chua
49. Sữa chua dâu
50. Sữa chua việt quất
51. Sữa chua dưa lưới
52. Sữa chua xoài
53. Sữa chua chanh dây
54. Sữa chua đá

### Ghi chú xử lý dữ liệu gốc
- "Bánh tráng trộn" xuất hiện 3 lần → gộp thành 1 món.
- "Trà táo" và "trà việt quốc" mỗi món xuất hiện 2 lần → gộp. "Việt quốc" = **việt quất**.
- "Xúc xích đứa" là lỗi gõ → tên đúng: **Xúc xích Đức** (chủ quán xác nhận 07/09/2026).
- "Lẩu Thái chua cay (bún, mì)" → **1 món**, loại sợi là tuỳ chọn khi gọi món (chủ quán xác nhận 07/09/2026).
- **Giá bán**: chủ quán sẽ tự nhập qua trang admin ở Giai đoạn 6. Giai đoạn 3 dùng giá tạm 25000đ cho mọi món.

---

## PHẦN C — YÊU CẦU CHỨC NĂNG CHI TIẾT

### F1. Trang menu cho khách
- Một trang duy nhất, cuộn dọc. Có thanh danh mục dính trên đầu (sticky) để bấm nhảy nhanh tới nhóm món.
- Mỗi món hiển thị: ảnh, tên, mô tả ngắn (tuỳ chọn), giá, nút **+** thêm vào giỏ.
- Món hết hàng: hiện mờ, gắn nhãn "Tạm hết", không bấm thêm được.
- Có ô tìm kiếm theo tên món.
- Thiết kế **mobile-first** — 95% khách xem bằng điện thoại. Chữ tối thiểu 16px, nút bấm tối thiểu 44×44px.
- Ảnh dùng `next/image`, định dạng WebP, tải kiểu lazy.

### F2. Giỏ hàng + tạm tính
- Nút giỏ hàng nổi ở góc dưới màn hình, hiện số món và tổng tiền.
- Mở ra xem chi tiết: tăng/giảm số lượng, xoá món, tổng cộng.
- Ghi rõ dòng: *"Đây là bảng tạm tính. Vui lòng gọi món với nhân viên."*
- **Chừa sẵn chỗ cho đặt online sau này**: tách phần logic giỏ hàng ra file riêng (`lib/cart.ts`), đừng viết lẫn vào giao diện.

### F3. Lưu giỏ hàng ít nhất 30 phút ⭐ (yêu cầu quan trọng)
Tình huống thật: khách iPhone lỡ thoát web, mở lại phải chọn từ đầu.

- Lưu giỏ hàng vào **`localStorage`** kèm mốc thời gian `expiresAt`.
- Đặt hạn **60 phút** (rộng hơn mức 30 phút yêu cầu, để chắc chắn).
- **Mỗi lần khách thao tác thì gia hạn lại** `expiresAt` — khách còn ngồi ăn thì giỏ hàng không bao giờ hết hạn.
- Khi mở web: còn hạn thì khôi phục giỏ và hiện thông báo nhẹ *"Đã khôi phục giỏ hàng của bạn"*; hết hạn thì xoá sạch.
- Bọc mọi lệnh đọc/ghi `localStorage` trong `try/catch` — Safari chế độ riêng tư có thể chặn và làm sập trang.
- **Bắt buộc test thật**: quét QR bằng iPhone → thêm 3 món → đóng hẳn tab Safari → mở lại QR sau 5 phút → giỏ hàng phải còn nguyên.

### F4. Quét QR — nhanh và tiện
- QR trỏ tới **một địa chỉ cố định**. Địa chỉ này **không bao giờ đổi**, để in QR một lần duy nhất, sửa menu bao nhiêu lần cũng không phải in lại.
- Trang phải hiện món trong **dưới 2 giây** trên 4G: dựng sẵn trang tĩnh (SSG/ISR), không thư viện nặng, không bắt đăng nhập, không màn hình chờ.
- Hỗ trợ tham số số bàn: `?ban=3` — hiện tại chỉ hiển thị "Bàn 3", sau này dùng cho đặt online.
- Xuất file QR sẵn ở dạng **SVG và PNG** để in dán bàn.

### F5. Trang quản trị — chỉ chủ quán sửa được ⭐
**Nói thẳng một điều kỹ thuật:** web không thể nhận biết chính xác "đây có phải iPhone 12 Pro Max của tôi không". Trình duyệt không cho đọc model máy, và thông tin đó giả mạo được. Khoá theo model máy là **không khả thi**.

Cách thay thế đạt đúng mục tiêu (người ngoài không sửa được), gồm 3 lớp:

1. **Đăng nhập bằng Supabase Auth** — email + mật khẩu riêng.
2. **Danh sách email được phép (allowlist)** — chặn ngay ở tầng database bằng Row Level Security, không chỉ chặn ở giao diện. Đây là lớp bảo vệ thật: kể cả người khác biết đường dẫn `/admin` cũng không ghi được dữ liệu.
3. **Thiết bị tin cậy** — chọn "Ghi nhớ thiết bị này" sau lần đăng nhập đầu. Phiên giữ 30–90 ngày. Mất máy thì vào trang quản trị **thu hồi toàn bộ thiết bị** bằng một nút.

Bổ sung: bật **xác thực 2 bước** cho tài khoản admin; trang `/admin` gắn thẻ `noindex`.

**Trang admin cần làm được:**
- Thêm / sửa / xoá món: tên, mô tả, giá, ảnh, danh mục, còn hàng hay tạm hết.
- Thêm / sửa / xoá / sắp xếp thứ tự danh mục.
- Tải ảnh lên và **tự động nén** (≤ 300KB, chuyển WebP) trước khi lưu — ảnh gốc iPhone 3–5MB sẽ làm trang khách rất chậm.
- Sửa thông tin quán và liên kết mạng xã hội.
- Giao diện dùng tốt trên điện thoại — chủ quán sẽ sửa món ngay tại quán.

### F6. Chân trang (footer)
- Tên quán, địa chỉ, số điện thoại (bấm để gọi), giờ mở cửa.
- Nút liên kết: Facebook, Instagram, TikTok, Zalo.
- Nút "Chỉ đường" mở Google Maps.
- Tất cả nội dung **lấy từ database**, để sau tự sửa trong trang admin, không cần lập trình lại.

### F7. Chịu được 50 khách cùng lúc
- Trang menu dựng sẵn dạng tĩnh, cache trên CDN Vercel, `revalidate = 60` giây.
- Khi sửa món trong admin → gọi `revalidatePath('/')` để trang khách cập nhật ngay.
- Ảnh phục vụ qua CDN.
- Cấu hình như trên chịu được hàng nghìn khách cùng lúc. 50 khách là quá dư.

### F8. Những thứ **không** làm trong giai đoạn này
Không đặt món online, không thanh toán, không tài khoản khách hàng, không đa ngôn ngữ, không giao diện tiên hiệp, không chương trình tích điểm.

---

## PHẦN D — MÔ HÌNH DỮ LIỆU

```
categories
  id            uuid, khoá chính
  name          text        -- "Trà sữa"
  slug          text, duy nhất
  sort_order    int         -- thứ tự hiển thị
  is_active     bool

menu_items
  id            uuid, khoá chính
  category_id   uuid -> categories.id
  name          text
  description   text, cho phép rỗng
  price         int         -- lưu bằng ĐỒNG, kiểu số nguyên. TUYỆT ĐỐI không dùng số thập phân
  image_url     text, cho phép rỗng
  is_available  bool        -- false = "Tạm hết"
  sort_order    int
  created_at    timestamptz

shop_settings          -- chỉ có đúng 1 dòng
  id            int, khoá chính, luôn = 1
  shop_name     text
  address       text
  phone         text
  open_hours    text
  facebook_url  text
  instagram_url text
  tiktok_url    text
  zalo_url      text
  map_url       text

admin_allowlist
  email         text, khoá chính
```

**Quy tắc Row Level Security (bắt buộc, đừng bỏ qua):**
- `categories`, `menu_items`, `shop_settings`: ai cũng **đọc** được (`SELECT` public).
- `INSERT` / `UPDATE` / `DELETE`: chỉ cho phép khi email người đăng nhập có trong bảng `admin_allowlist`.
- Bucket ảnh trên Storage: đọc công khai, ghi chỉ dành cho admin.

---

## PHẦN E — QUY TRÌNH 9 GIAI ĐOẠN

> Nguyên tắc xuyên suốt: **hết mỗi giai đoạn, chủ quán tự mở web kiểm tra rồi mới cho làm tiếp.**

### GIAI ĐOẠN 0 — Chuẩn bị ✅ ĐÃ XONG (07/09/2026)
- [x] Node.js v24.20.0, npm 11.19.0, git 2.55 — đã cài
- [x] Tài khoản GitHub — đã có
- [ ] Tài khoản **Supabase** — CẦN TRƯỚC GIAI ĐOẠN 2
- [ ] Tài khoản **Vercel** — cần trước Giai đoạn 7
- [x] Chốt xong các câu hỏi về danh sách món (xem Phần B)
- [ ] Bảng giá toàn bộ món — cần trước Giai đoạn 6
- [ ] Link Facebook / Instagram / TikTok / Zalo, địa chỉ, SĐT, giờ mở cửa — cần trước Giai đoạn 6
- [ ] Ảnh món — làm song song

### GIAI ĐOẠN 1 — Dựng khung dự án ✅ ĐÃ XONG (07/09/2026)
Next.js + TypeScript + Tailwind trong `C:\menu-quan`, cài `@supabase/supabase-js` + `@supabase/ssr`, tạo `.env.local.example`, `.gitignore` chặn `.env.local`, git commit đầu tiên. Chưa viết giao diện gì.

### GIAI ĐOẠN 2 — Cơ sở dữ liệu
> **Prompt:** "Đọc Phần D. Viết file SQL `supabase/migrations/001_init.sql` tạo đúng 4 bảng đó, kèm đầy đủ policy Row Level Security như mô tả. Tạo thêm bucket Storage tên `menu-images` với quyền đọc công khai, ghi chỉ admin. Viết `supabase/README.md` hướng dẫn chạy file SQL này trên Supabase Dashboard từng bước."

**Chủ quán làm:** dán SQL vào SQL Editor của Supabase, chạy. Thêm email của mình vào bảng `admin_allowlist`. Copy URL + anon key vào `.env.local`.

**Nghiệm thu:** Supabase Table Editor hiện đủ 4 bảng. Thử `INSERT` vào `menu_items` khi chưa đăng nhập → **phải bị từ chối**. Nếu chèn được là RLS sai, dừng lại sửa ngay.

### GIAI ĐOẠN 3 — Trang menu cho khách (dữ liệu giả)
> **Prompt:** "Làm trang menu ở `app/page.tsx` theo F1. Dùng dữ liệu giả trong `lib/mock-data.ts` với đúng 8 danh mục và tên món ở Phần B, giá tạm 25000. Chưa nối Supabase. Mobile-first. Gồm: thanh danh mục sticky, thẻ món, ô tìm kiếm, trạng thái tạm hết. Chưa làm giỏ hàng."

**Nghiệm thu:** mở bằng điện thoại thật (`npm run dev -- -H 0.0.0.0` rồi vào bằng IP máy tính trong cùng wifi). Chữ dễ đọc, nút dễ bấm bằng ngón cái, thanh danh mục nhảy đúng chỗ, không tràn ngang.

### GIAI ĐOẠN 4 — Giỏ hàng + lưu 30 phút ⭐
> **Prompt:** "Làm giỏ hàng theo F2 và F3. Logic đặt trong `lib/cart.ts` (thuần TypeScript, không phụ thuộc React) và React context ở `lib/cart-context.tsx`. Lưu localStorage kèm `expiresAt` mặc định 60 phút, mỗi thao tác gia hạn lại. Bọc mọi truy cập localStorage trong try/catch. Khôi phục được giỏ thì hiện toast nhẹ. Viết unit test cho phần hết hạn và gia hạn trong `lib/cart.test.ts`."

**Nghiệm thu (bằng iPhone thật):**
1. Thêm 3 món → đóng hẳn tab Safari → mở lại → giỏ còn nguyên.
2. Sửa tạm `expiresAt` xuống 1 phút, chờ 2 phút, mở lại → giỏ trống.
3. Tab ẩn danh Safari, thêm món, không trắng trang.
4. `npm test` xanh.

### GIAI ĐOẠN 5 — Nối Supabase + chân trang
> **Prompt:** "Bỏ dữ liệu giả, đọc `categories`, `menu_items`, `shop_settings` từ Supabase bằng Server Component. Đặt `export const revalidate = 60`. Làm chân trang theo F6, lấy nội dung từ `shop_settings`. SĐT dùng link `tel:`, nút chỉ đường mở `map_url`. Ảnh dùng `next/image`, khai báo domain Supabase trong next config."

**Nghiệm thu:** thêm tay 1 danh mục + 2 món trong Supabase → tải lại trang → thấy đúng. Chân trang đủ thông tin, bấm SĐT gọi được.

### GIAI ĐOẠN 6 — Trang quản trị ⭐
> **Prompt:** "Làm trang admin theo F5. Gồm `/admin/login` (Supabase Auth email + mật khẩu), middleware bảo vệ mọi `/admin/*`, `/admin` quản lý món (thêm/sửa/xoá, bật tắt tạm hết, kéo thả sắp xếp), `/admin/categories`, `/admin/settings`. Tải ảnh phải nén phía trình duyệt xuống ≤300KB và chuyển WebP trước khi lên Storage. Sau mỗi thao tác ghi thì gọi `revalidatePath('/')`. Trang admin gắn `noindex`. Dùng tốt trên điện thoại."

**Chủ quán làm ngay sau:** nhập toàn bộ 54 món kèm giá và ảnh. Tốn 1–2 buổi.

**Nghiệm thu:**
- Đăng xuất rồi vào thẳng `/admin` → bị đá về trang đăng nhập.
- Tạo 1 tài khoản Supabase khác (email lạ) → đăng nhập được nhưng **không sửa được gì**. *(Bài test quan trọng nhất của cả dự án.)*
- Tải ảnh 4MB từ iPhone → file trên Storage < 300KB.
- Sửa giá 1 món → trang khách cập nhật trong vài giây.

### GIAI ĐOẠN 7 — Đưa lên mạng + tạo mã QR
> **Prompt:** "Hướng dẫn đẩy code lên GitHub và deploy lên Vercel, liệt kê rõ biến môi trường cần khai báo. Có địa chỉ web rồi thì viết script `scripts/make-qr.ts` tạo QR ra SVG và PNG (1000×1000, mức sửa lỗi H, chừa lề trắng), kèm file PDF khổ A6 có QR ở giữa và dòng chữ 'QUÉT ĐỂ XEM MENU' để in dán bàn."

**Nghiệm thu:** in QR ra giấy, quét bằng 3 điện thoại khác nhau, mỗi máy vào được menu dưới 2 giây bằng 4G (tắt wifi khi test).

### GIAI ĐOẠN 8 — Kiểm thử tổng thể
> **Prompt:** "Chạy `npm run build` kiểm tra không lỗi. Chạy Lighthouse chế độ mobile cho trang chủ, báo cáo Performance và Accessibility. Rà lại mã: không key bí mật nào lộ phía client, không còn dữ liệu giả, mọi truy cập localStorage đều có try/catch. Báo cáo từng mục."

**Checklist tự làm — tick hết mới dùng thật:**
- [ ] Quét QR bằng iPhone (Safari) — vào được, dưới 2 giây
- [ ] Quét QR bằng Android (Chrome) — vào được
- [ ] Ảnh món hiện đủ, không móp méo
- [ ] Thêm món → đóng web → mở lại sau 10 phút → giỏ còn nguyên
- [ ] Tổng tiền tính đúng (thử 3 món số lượng khác nhau, cộng tay đối chiếu)
- [ ] Bấm SĐT ở chân trang → mở app gọi
- [ ] Bấm từng liên kết mạng xã hội → mở đúng trang
- [ ] Đăng nhập admin trên iPhone → sửa 1 món → trang khách đổi theo
- [ ] Người khác vào `/admin` → không làm gì được
- [ ] Nhờ 5 người quét cùng lúc → không ai chậm hay lỗi
- [ ] Bật "Tạm hết" cho 1 món → khách thấy mờ, không thêm được
- [ ] Lighthouse mobile Performance ≥ 85

---

## PHẦN F — CÁCH LÀM VIỆC VỚI CLAUDE CODE ĐỂ ÍT SAI SÓT NHẤT

1. **Một giai đoạn — một phiên làm việc.** Xong thì commit git rồi mới sang giai đoạn sau.
2. **Luôn bắt commit sau mỗi giai đoạn.**
3. **Đừng gộp yêu cầu.** "Làm giỏ hàng và trang admin và deploy luôn" là công thức chắc chắn sinh lỗi.
4. **Khi thấy sai, mô tả hiện tượng chứ đừng đoán nguyên nhân.** Nói "bấm nút + trên iPhone không thêm được món, trên máy tính thì được" tốt hơn "chắc lỗi state".
5. **Bắt Claude Code giải thích trước khi sửa** những chỗ nhạy cảm (quyền admin, RLS).
6. **Không bao giờ dán key vào chat.** Chỉ để trong `.env.local`.
7. **Giữ file này trong thư mục dự án.** Mỗi phiên mới, nhắc Claude Code đọc lại — nó không nhớ phiên trước.

---

## PHẦN G — SAU KHI CHẠY ỔN THÌ LÀM TIẾP GÌ

1. **Đặt món online** — logic giỏ hàng đã tách sẵn ở Giai đoạn 4 nên không phải làm lại từ đầu.
2. **Giao diện tiên hiệp** — nút chuyển chế độ, đổi bảng màu, phông chữ, cách gọi tên món.
3. Thống kê món được xem nhiều nhất.
4. Tên miền riêng cho dễ nhớ.

---

*Tài liệu lập ngày 07/09/2026 — dựa trên danh sách món trong file `nui chiên trứng.txt`.*
*Cập nhật 07/09/2026: chốt tên "Xúc xích Đức", chốt Lẩu Thái là 1 món; ghi nhận phiên bản thực tế đã cài ở Giai đoạn 1.*
