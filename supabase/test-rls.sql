-- ============================================================================
--  BAI KIEM TRA PHAN QUYEN (Row Level Security)
--  File: supabase/test-rls.sql
--
--  Day la buoc NGHIEM THU cua Giai doan 2. Chay xong 4 bai duoi day va
--  doi chieu ket qua. Neu co MOT bai sai, DUNG LAI, dung lam Giai doan 3.
--
--  Chay o dau: Supabase Dashboard > SQL Editor > New query.
--  Chay tung bai mot (boi den doan do roi bam Run), de doc ket qua cho ro.
--
--  ---------------------------------------------------------------------------
--  MOT DIEU RAT QUAN TRONG PHAI HIEU TRUOC KHI CHAY:
--
--  SQL Editor cua Supabase chay voi quyen "postgres" - quyen cao nhat.
--  Quyen nay BO QUA moi rao can RLS. Nen neu ban go thang lenh:
--
--        insert into menu_items ...
--
--  thi no SE CHAY DUOC, va dieu do KHONG co nghia la RLS bi hong.
--
--  Vi vay moi bai duoi day deu co dong "set local role ..." de HA quyen
--  xuong dung muc cua khach / cua nguoi la, roi moi thu. Do moi la phep
--  thu that. Dung bo dong do di.
--
--  Moi bai deu boc trong begin ... rollback nen KHONG luu gi vao database.
-- ============================================================================


-- ============================================================================
--  BAI 1 - KHACH VANG LAI PHAI DOC DUOC MENU
--  Ket qua mong doi: CHAY DUOC, tra ve mot bang (co the trong neu chua nhap mon).
--  Neu bao loi -> khach quet QR se khong thay mon nao. Sai.
-- ============================================================================

begin;
  set local role anon;

  select 'BAI 1: doc categories' as bai, count(*) as so_dong from public.categories;
  select 'BAI 1: doc menu_items' as bai, count(*) as so_dong from public.menu_items;
  select 'BAI 1: doc shop_settings' as bai, count(*) as so_dong from public.shop_settings;
rollback;


-- ============================================================================
--  BAI 2 - KHACH VANG LAI KHONG DUOC GHI  *** BAI QUAN TRONG NHAT ***
--
--  Ket qua mong doi: BAO LOI mau do. Noi dung loi la MOT TRONG HAI cau sau,
--  ca hai deu la KET QUA DUNG:
--
--     a) permission denied for table menu_items
--        -> bi chan ngay o lop cap quyen, chua toi luot RLS. Chan cang som cang tot.
--
--     b) new row violates row-level security policy for table "menu_items"
--        -> bi chan o lop RLS.
--
--  BAO LOI LA DUNG. Do la dau hieu database dang bao ve menu cua ban.
--  Neu lenh nay CHAY DUOC ma khong bao loi -> RLS hong, dung lai sua ngay.
-- ============================================================================

begin;
  set local role anon;

  insert into public.menu_items (category_id, name, price)
  values (gen_random_uuid(), 'MON GIA - NEU THAY DONG NAY LA RLS HONG', 1000);
rollback;


-- ============================================================================
--  BAI 3 - NGUOI LA DA DANG NHAP CUNG KHONG DUOC GHI
--  Gia lap mot nguoi da tao tai khoan Supabase nhung email KHONG nam trong
--  admin_allowlist. Day dung la tinh huong "nguoi ngoai vao /admin".
--
--  Ket qua mong doi: BAO LOI giong Bai 2. Bao loi la dung.
-- ============================================================================

begin;
  select set_config(
    'request.jwt.claims',
    '{"role":"authenticated","email":"nguoi-la-hoan-toan@example.com"}',
    true
  );
  set local role authenticated;

  -- Kiem tra truoc: is_admin() phai tra ve false
  select 'BAI 3: is_admin cua nguoi la' as bai, public.is_admin() as ket_qua;

  -- Va lenh ghi nay phai bi tu choi
  insert into public.categories (name, slug)
  values ('DANH MUC GIA - NEU THAY DONG NAY LA RLS HONG', 'danh-muc-gia');
rollback;


-- ============================================================================
--  BAI 4 - CHU QUAN (email trong allowlist) PHAI GHI DUOC
--  Ket qua mong doi: CHAY DUOC, is_admin tra ve true, chen duoc 1 dong.
--
--  Neu bao loi -> nhieu kha nang ban CHUA them email vao admin_allowlist.
--  Chay lenh nay de kiem tra:   select * from public.admin_allowlist;
--  Bang trong nghia la chua them. Xem cuoi file 001_init.sql de biet cach them.
-- ============================================================================

begin;
  -- Lay email dau tien trong allowlist de gia lap dang nhap bang email do
  select set_config(
    'request.jwt.claims',
    json_build_object(
      'role',  'authenticated',
      'email', (select email from public.admin_allowlist order by email limit 1)
    )::text,
    true
  );
  set local role authenticated;

  select 'BAI 4: is_admin cua chu quan' as bai, public.is_admin() as ket_qua;

  insert into public.categories (name, slug, sort_order)
  values ('Danh muc thu nghiem', 'danh-muc-thu-nghiem', 999)
  returning 'BAI 4: da chen duoc' as bai, name;
rollback;


-- ============================================================================
--  BANG DOI CHIEU KET QUA
--
--    Bai 1  ->  chay duoc, tra ve so dong          (khong bao loi)
--    Bai 2  ->  BAO LOI: "permission denied" HOAC "violates row-level security"
--    Bai 3  ->  is_admin = false, roi BAO LOI "violates row-level security"
--    Bai 4  ->  is_admin = true,  chen duoc 1 dong  (khong bao loi)
--
--  Dung het 4 dong tren -> Giai doan 2 dat, di tiep Giai doan 3.
--  Sai bat ky dong nao  -> dung lai, bao Claude Code kem noi dung loi.
--
--  Tat ca deu rollback nen database van sach, khong con du lieu thu nghiem.
-- ============================================================================
