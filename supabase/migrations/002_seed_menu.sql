-- ============================================================================
--  NHAP SAN 8 DANH MUC VA 54 MON VAO DATABASE
--  File: supabase/migrations/002_seed_menu.sql
--
--  Muc dich: chu quan khoi phai go tay 54 ten mon tren dien thoai.
--  Ten mon lay dung theo PHAN B cua quy-trinh-menu-qr.md.
--
--  GIA: tat ca de tam 25000d — DUNG BANG voi gia dang hien tren web that
--  luc nay, nen nhap vao khong lam khach thay khac di. Chu quan se sua gia
--  that trong trang admin o Giai doan 6.
--
--  File nay chay lai duoc nhieu lan ma khong tao mon trung (idempotent):
--  danh muc dung on conflict theo slug, mon dung "where not exists".
-- ============================================================================


-- ---------------------------------------------------------------------------
--  1. TAM TAT RLS BANG CACH CHAY VOI QUYEN POSTGRES
--     SQL Editor cua Supabase chay bang quyen postgres nen bo qua RLS,
--     khong can lam gi them. Neu chay file nay bang cach khac thi phai
--     dang nhap bang tai khoan admin.
-- ---------------------------------------------------------------------------


-- ---------------------------------------------------------------------------
--  2. DANH MUC
-- ---------------------------------------------------------------------------

insert into public.categories (name, slug, sort_order, is_active) values
  ('Mì – Nui – Bún',        'mi-nui-bun',      1, true),
  ('Mì phô mai',            'mi-pho-mai',      2, true),
  ('Bánh tráng',            'banh-trang',      3, true),
  ('Ăn vặt – Đồ chiên',     'an-vat-do-chien', 4, true),
  ('Trà sữa',               'tra-sua',         5, true),
  ('Trà trái cây',          'tra-trai-cay',    6, true),
  ('Nước giải khát khác',   'nuoc-giai-khat',  7, true),
  ('Sữa chua',              'sua-chua',        8, true)
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
--  3. MON AN
--     Cot thu 3 la mo ta ngan (de null neu khong co).
--     "where not exists" bao dam chay lai khong sinh mon trung ten.
-- ---------------------------------------------------------------------------

insert into public.menu_items (category_id, name, description, price, sort_order)
select c.id, v.ten, v.mota, 25000, v.stt
from (values
  -- 1. Mì – Nui – Bún
  ('mi-nui-bun', 'Nui chiên trứng',                    null::text,                              1),
  ('mi-nui-bun', 'Nui xào bò',                         null,                                    2),
  ('mi-nui-bun', 'Mì Ý',                               null,                                    3),
  ('mi-nui-bun', 'Mì trộn cá viên sốt mắm tỏi',        null,                                    4),
  ('mi-nui-bun', 'Mì trộn trứng xúc xích',             null,                                    5),
  ('mi-nui-bun', 'Mì trộn trứng cá',                   null,                                    6),
  ('mi-nui-bun', 'Mì trộn gà sốt chua ngọt',           null,                                    7),
  ('mi-nui-bun', 'Mì trộn gà sốt phô mai',             null,                                    8),
  ('mi-nui-bun', 'Mì trộn thịt',                       null,                                    9),
  ('mi-nui-bun', 'Mì cay',                             null,                                   10),
  ('mi-nui-bun', 'Mì tương đen',                       null,                                   11),
  ('mi-nui-bun', 'Bún nước tương',                     null,                                   12),
  ('mi-nui-bun', 'Lẩu Thái chua cay',                  'Chọn sợi bún hoặc mì khi gọi món',      13),

  -- 2. Mì phô mai
  ('mi-pho-mai', 'Mì phô mai trộn cá viên sốt mắm tỏi', null,                                   14),
  ('mi-pho-mai', 'Mì phô mai trộn trứng xúc xích',      null,                                   15),
  ('mi-pho-mai', 'Mì phô mai trộn trứng cá',            null,                                   16),
  ('mi-pho-mai', 'Mì phô mai trộn gà sốt chua ngọt',    null,                                   17),
  ('mi-pho-mai', 'Mì phô mai trộn gà sốt phô mai',      null,                                   18),

  -- 3. Bánh tráng
  ('banh-trang', 'Bánh tráng trộn',                     null,                                   19),
  ('banh-trang', 'Bánh tráng cuộn',                     null,                                   20),
  ('banh-trang', 'Bánh tráng chấm muối hành / muối',    null,                                   21),

  -- 4. Ăn vặt – Đồ chiên
  ('an-vat-do-chien', 'Cá viên sốt mắm tỏi',            null,                                   22),
  ('an-vat-do-chien', 'Cá viên đủ loại',                null,                                   23),
  ('an-vat-do-chien', 'Bánh khoai mỡ',                  null,                                   24),
  ('an-vat-do-chien', 'Hot dog',                        null,                                   25),
  ('an-vat-do-chien', 'Phô mai que',                    null,                                   26),
  ('an-vat-do-chien', 'Xúc xích Đức',                   null,                                   27),

  -- 5. Trà sữa
  ('tra-sua', 'Trà sữa truyền thống',                   null,                                   28),
  ('tra-sua', 'Trà sữa khoai môn',                      null,                                   29),
  ('tra-sua', 'Trà sữa mix vị',                         null,                                   30),
  ('tra-sua', 'Trà sữa Thái xanh',                      null,                                   31),
  ('tra-sua', 'Trà sữa Thái đỏ',                        null,                                   32),
  ('tra-sua', 'Trà sữa matcha',                         null,                                   33),
  ('tra-sua', 'Lipton sữa',                             null,                                   34),
  ('tra-sua', 'Sữa tươi trân châu đường đen',           null,                                   35),
  ('tra-sua', 'Matcha latte',                           null,                                   36),

  -- 6. Trà trái cây
  ('tra-trai-cay', 'Trà dâu',                           null,                                   37),
  ('tra-trai-cay', 'Trà đào',                           null,                                   38),
  ('tra-trai-cay', 'Trà vải',                           null,                                   39),
  ('tra-trai-cay', 'Trà ổi hồng chanh dây',             null,                                   40),
  ('tra-trai-cay', 'Trà táo',                           null,                                   41),
  ('tra-trai-cay', 'Trà việt quất',                     null,                                   42),
  ('tra-trai-cay', 'Trà tắc',                           null,                                   43),
  ('tra-trai-cay', 'Trà tắc Thái xanh',                 null,                                   44),

  -- 7. Nước giải khát khác
  ('nuoc-giai-khat', 'Đá me',                           null,                                   45),
  ('nuoc-giai-khat', 'Cam ép',                          null,                                   46),
  ('nuoc-giai-khat', 'Soda dâu',                        null,                                   47),
  ('nuoc-giai-khat', 'Soda mix vị',                     null,                                   48),

  -- 8. Sữa chua
  ('sua-chua', 'Sữa chua dâu',                          null,                                   49),
  ('sua-chua', 'Sữa chua việt quất',                    null,                                   50),
  ('sua-chua', 'Sữa chua dưa lưới',                     null,                                   51),
  ('sua-chua', 'Sữa chua xoài',                         null,                                   52),
  ('sua-chua', 'Sữa chua chanh dây',                    null,                                   53),
  ('sua-chua', 'Sữa chua đá',                           null,                                   54)
) as v(slug, ten, mota, stt)
join public.categories c on c.slug = v.slug
where not exists (
  select 1 from public.menu_items m
  where m.category_id = c.id and m.name = v.ten
);


-- ---------------------------------------------------------------------------
--  4. KIEM TRA KET QUA
-- ---------------------------------------------------------------------------

select
  (select count(*) from public.categories) as so_danh_muc,
  (select count(*) from public.menu_items) as so_mon;
