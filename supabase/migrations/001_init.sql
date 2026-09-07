-- ============================================================================
--  MENU QR - KHOI TAO CO SO DU LIEU
--  File: supabase/migrations/001_init.sql
--
--  Chay file nay MOT LAN duy nhat, trong Supabase Dashboard > SQL Editor.
--  Xem huong dan tung buoc o file supabase/README.md
--
--  File nay tao:
--    1. Ham is_admin()        - trai tim cua he thong phan quyen
--    2. Bang admin_allowlist  - danh sach email duoc quyen sua menu
--    3. Bang categories       - danh muc mon
--    4. Bang menu_items       - cac mon an
--    5. Bang shop_settings    - thong tin quan (chi 1 dong duy nhat)
--    6. Bucket menu-images    - noi luu anh mon
--    7. Toan bo policy Row Level Security
--
--  File nay chay lai duoc nhieu lan ma khong hong du lieu (idempotent).
-- ============================================================================


-- ============================================================================
--  PHAN 1 - BANG ADMIN_ALLOWLIST
--  Day la bang quan trong nhat. Email nao nam trong bang nay thi duoc sua menu.
-- ============================================================================

create table if not exists public.admin_allowlist (
  email text primary key
);

comment on table public.admin_allowlist is
  'Danh sach email duoc quyen sua menu. Chi sua duoc bang SQL Editor cua Supabase, khong sua duoc tu trang web.';


-- ============================================================================
--  PHAN 2 - HAM IS_ADMIN()
--
--  Ham nay tra ve true neu nguoi dang gui yeu cau co email nam trong
--  admin_allowlist. Moi policy ghi du lieu ben duoi deu goi ham nay.
--
--  Vi sao dung "security definer":
--    Bang admin_allowlist duoc bao ve boi RLS, nguoi thuong khong doc duoc.
--    Nhung ham nay CAN doc duoc no de kiem tra. "security definer" cho phep
--    ham chay voi quyen cua chu so huu (postgres) nen doc duoc bang do,
--    trong khi nguoi goi ham van khong doc truc tiep duoc.
--
--  Vi sao dung lower():
--    De "Toi@Gmail.com" va "toi@gmail.com" duoc coi la mot.
--
--  Vi sao "set search_path = public, pg_temp":
--    Chan kieu tan cong doi duong dan schema de lua ham nay goi nham bang.
-- ============================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_allowlist a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

comment on function public.is_admin() is
  'Tra ve true neu email trong the dang nhap (JWT) co trong admin_allowlist.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;


-- ============================================================================
--  PHAN 3 - BANG CATEGORIES (danh muc mon)
-- ============================================================================

create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text    not null,
  slug       text    not null unique,
  sort_order int     not null default 0,
  is_active  boolean not null default true
);

create index if not exists categories_sort_idx
  on public.categories (sort_order, name);

comment on column public.categories.slug is
  'Ten khong dau, khong khoang trang, dung cho lien ket nhay toi danh muc. Vi du: "tra-sua".';


-- ============================================================================
--  PHAN 4 - BANG MENU_ITEMS (cac mon)
--
--  LUU Y VE GIA: cot price kieu integer, luu bang DONG.
--  25000 nghia la 25.000d. TUYET DOI khong dung so thap phan -
--  so thap phan trong tien te sinh loi lam tron rat kho truy.
-- ============================================================================

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid not null references public.categories (id) on delete restrict,
  name         text not null,
  description  text,
  price        integer not null default 0 check (price >= 0),
  image_url    text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists menu_items_category_idx
  on public.menu_items (category_id, sort_order, name);

comment on column public.menu_items.price is
  'Gia ban tinh bang DONG, so nguyen. Vi du 25000 = 25.000d.';
comment on column public.menu_items.is_available is
  'false = mon dang "Tam het": trang khach hien mo va khong bam them duoc.';


-- ============================================================================
--  PHAN 5 - BANG SHOP_SETTINGS (thong tin quan)
--
--  Bang nay CHI duoc phep co dung 1 dong. Rang buoc check (id = 1) bao dam
--  dieu do: khong the chen dong thu hai vao duoc.
-- ============================================================================

create table if not exists public.shop_settings (
  id            integer primary key default 1 check (id = 1),
  shop_name     text,
  address       text,
  phone         text,
  open_hours    text,
  facebook_url  text,
  instagram_url text,
  tiktok_url    text,
  zalo_url      text,
  map_url       text
);

-- Tao san dong duy nhat voi noi dung tam, de trang khach khong bi trong.
-- Chu quan se sua lai o trang /admin/settings (Giai doan 6).
insert into public.shop_settings (id, shop_name, address, phone, open_hours)
values (1, 'Quan an vat', 'Chua cap nhat dia chi', '', 'Chua cap nhat gio mo cua')
on conflict (id) do nothing;


-- ============================================================================
--  PHAN 6 - BAT ROW LEVEL SECURITY CHO CA 4 BANG
--
--  Sau lenh nay, mac dinh la CAM HET. Khong co policy nao cho phep thi
--  khong ai lam gi duoc. Cac policy o Phan 7 moi mo tung cua mot.
-- ============================================================================

alter table public.admin_allowlist enable row level security;
alter table public.categories      enable row level security;
alter table public.menu_items      enable row level security;
alter table public.shop_settings   enable row level security;


-- ============================================================================
--  PHAN 7 - CAC POLICY
--
--  Quy tac chung cho categories / menu_items / shop_settings:
--    - DOC   : ai cung doc duoc (khach quet QR khong can dang nhap)
--    - GHI   : chi khi is_admin() = true
--
--  Rieng admin_allowlist:
--    - DOC   : chi admin doc duoc
--    - GHI   : KHONG CO POLICY NAO -> khong ai ghi duoc tu trang web.
--              Muon them admin phai vao SQL Editor cua Supabase.
--
--  Dung "drop policy if exists" truoc moi lenh de file chay lai duoc.
-- ============================================================================

-- ---------- admin_allowlist ----------
drop policy if exists "allowlist: admin doc duoc" on public.admin_allowlist;
create policy "allowlist: admin doc duoc"
  on public.admin_allowlist
  for select
  to authenticated
  using (public.is_admin());

-- Khong tao policy insert/update/delete cho bang nay. Do la chu y.


-- ---------- categories ----------
drop policy if exists "categories: ai cung doc duoc" on public.categories;
create policy "categories: ai cung doc duoc"
  on public.categories
  for select
  to anon, authenticated
  using (true);

drop policy if exists "categories: admin them" on public.categories;
create policy "categories: admin them"
  on public.categories
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "categories: admin sua" on public.categories;
create policy "categories: admin sua"
  on public.categories
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "categories: admin xoa" on public.categories;
create policy "categories: admin xoa"
  on public.categories
  for delete
  to authenticated
  using (public.is_admin());


-- ---------- menu_items ----------
drop policy if exists "menu_items: ai cung doc duoc" on public.menu_items;
create policy "menu_items: ai cung doc duoc"
  on public.menu_items
  for select
  to anon, authenticated
  using (true);

drop policy if exists "menu_items: admin them" on public.menu_items;
create policy "menu_items: admin them"
  on public.menu_items
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "menu_items: admin sua" on public.menu_items;
create policy "menu_items: admin sua"
  on public.menu_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "menu_items: admin xoa" on public.menu_items;
create policy "menu_items: admin xoa"
  on public.menu_items
  for delete
  to authenticated
  using (public.is_admin());


-- ---------- shop_settings ----------
drop policy if exists "shop_settings: ai cung doc duoc" on public.shop_settings;
create policy "shop_settings: ai cung doc duoc"
  on public.shop_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "shop_settings: admin sua" on public.shop_settings;
create policy "shop_settings: admin sua"
  on public.shop_settings
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Khong cho insert/delete: bang nay chi duoc phep co dung 1 dong,
-- dong do da duoc tao san o Phan 5. Chi can sua, khong can them hay xoa.


-- ============================================================================
--  PHAN 8 - CAP QUYEN CHO CAC VAI TRO API
--
--  RLS quyet dinh "duoc lam gi voi TUNG DONG". GRANT quyet dinh
--  "co duoc dung toi BANG do hay khong". Can ca hai.
--
--  Supabase thuong tu dong cap quyen nay, nhung khai bao ro rang o day
--  de file chay dung ke ca khi tuy chon "tu dong hien thi bang moi" bi tat.
-- ============================================================================

grant usage on schema public to anon, authenticated;

grant select on public.categories, public.menu_items, public.shop_settings
  to anon, authenticated;

grant insert, update, delete on public.categories, public.menu_items
  to authenticated;

grant update on public.shop_settings to authenticated;

grant select on public.admin_allowlist to authenticated;

-- Thu hoi ro rang moi quyen GHI cua khach vang lai (anon).
-- Supabase mac dinh cap kha rong cho bang moi; day la lop chan thu hai,
-- nam duoi RLS. Khach chi con quyen DOC, dung nhu yeu cau.
revoke insert, update, delete
  on public.categories, public.menu_items, public.shop_settings
  from anon;

-- Khach vang lai khong duoc dung toi bang admin_allowlist du chi de doc.
revoke all on public.admin_allowlist from anon;


-- ============================================================================
--  PHAN 9 - BUCKET LUU ANH MON
--
--  public = true nghia la ai cung XEM anh duoc qua duong dan cong khai
--  (bat buoc, vi khach quet QR khong dang nhap ma van phai thay anh mon).
--  Nhung TAI ANH LEN va XOA ANH thi chi admin lam duoc - xem policy ben duoi.
--
--  file_size_limit 1MB: chan an toan. Trang admin da nen anh xuong <=300KB
--  truoc khi tai len roi, nen 1MB la du rong.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  1048576,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


-- ---------- policy cho anh ----------
-- Neu 4 lenh duoi bao "permission denied for table objects", xem muc
-- "Neu gap loi" trong supabase/README.md - lam bang giao dien thay the.

drop policy if exists "menu-images: ai cung xem duoc" on storage.objects;
create policy "menu-images: ai cung xem duoc"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "menu-images: admin tai len" on storage.objects;
create policy "menu-images: admin tai len"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu-images: admin thay the" on storage.objects;
create policy "menu-images: admin thay the"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin())
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "menu-images: admin xoa" on storage.objects;
create policy "menu-images: admin xoa"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());


-- ============================================================================
--  XONG PHAN TAO BANG.
--
--  CON MOT VIEC BAT BUOC NUA: them email cua ban vao admin_allowlist.
--  Khong lam buoc nay thi KHONG AI sua duoc menu, ke ca ban.
--
--  Mo mot tab SQL Editor moi va chay lenh duoi day, nho thay email that vao:
--
--      insert into public.admin_allowlist (email)
--      values (lower('EMAIL-CUA-BAN@gmail.com'))
--      on conflict (email) do nothing;
--
--  Email nay phai TRUNG KHOP voi email ban dung de dang nhap trang /admin
--  o Giai doan 6.
--
--  Khong ghi san email vao file nay, vi file se duoc day len GitHub.
-- ============================================================================
