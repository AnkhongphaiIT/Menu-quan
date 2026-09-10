-- ============================================================================
--  TUY CHON CHO MON AN (loai mi, topping, loai soi...)
--  File: supabase/migrations/003_tuy_chon.sql
--
--  Truoc day moi to hop duoc ghi thanh mot mon rieng ("Mi pho mai tron ga
--  sot chua ngot", "Mi pho mai tron trung xuc xich"...) - 4 loai mi x 5
--  topping ra 20 dong cho cung mot mon. File nay:
--    1. Tao 2 bang: option_groups (nhom tuy chon) va option_choices (lua chon)
--    2. Tao mon "Mi tron" voi nhom "Loai mi" + nhom "Topping"
--    3. Them nhom "Loai soi" (bun / mi) cho Lau Thai
--    4. Xoa cac mon to hop cu va danh muc "Mi pho mai"
--
--  CACH TINH GIA (lib/tuy-chon.ts):
--    gia = gia goc cua mon
--        + tong(price_delta x so phan) cua moi lua chon
--        + max(0, tong so phan trong nhom - included_qty) x extra_unit_price
--  Voi Mi tron: 20000 + (so phan topping - 1) x 5000.
--
--  File chay lai duoc nhieu lan ma khong tao trung.
-- ============================================================================


-- ============================================================================
--  PHAN 1 - HAI BANG MOI
-- ============================================================================

create table if not exists public.option_groups (
  id                 uuid primary key default gen_random_uuid(),
  menu_item_id       uuid not null references public.menu_items (id) on delete cascade,
  name               text not null,
  -- 'mot'   = chon dung 1 (loai mi, loai soi)
  -- 'nhieu' = chon nhieu, moi lua chon co so phan (topping)
  kind               text not null default 'mot' check (kind in ('mot', 'nhieu')),
  -- Tong so phan toi thieu phai chon. 'mot' + min_qty 1 = bat buoc chon.
  min_qty            integer not null default 0 check (min_qty >= 0),
  -- So phan da gom trong gia goc (Mi tron: 1 phan topping)
  included_qty       integer not null default 0 check (included_qty >= 0),
  -- Gia moi phan vuot qua so da gom (Mi tron: 5000)
  extra_unit_price   integer not null default 0 check (extra_unit_price >= 0),
  -- Moi lua chon toi da bao nhieu phan (topping: cho phep them gap doi)
  max_qty_per_choice integer not null default 1 check (max_qty_per_choice >= 1),
  sort_order         integer not null default 0
);

create table if not exists public.option_choices (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references public.option_groups (id) on delete cascade,
  name               text not null,
  description        text,
  -- Tien cong them cho moi phan cua lua chon nay (thuong la 0)
  price_delta        integer not null default 0 check (price_delta >= 0),
  -- Lua chon nay CHI di voi lua chon kia (o nhom khac).
  -- Vi du: "Ca vien sot mam toi" chi di voi "Mi tron thuong".
  requires_choice_id uuid references public.option_choices (id) on delete set null,
  is_available       boolean not null default true,
  sort_order         integer not null default 0
);

create index if not exists option_groups_item_idx
  on public.option_groups (menu_item_id, sort_order);
create index if not exists option_choices_group_idx
  on public.option_choices (group_id, sort_order);


-- ============================================================================
--  PHAN 2 - PHAN QUYEN: y het cac bang menu khac
--  Ai cung doc duoc, chi admin (email trong admin_allowlist) moi ghi duoc.
-- ============================================================================

alter table public.option_groups  enable row level security;
alter table public.option_choices enable row level security;

drop policy if exists "option_groups: ai cung doc duoc" on public.option_groups;
create policy "option_groups: ai cung doc duoc"
  on public.option_groups for select to anon, authenticated using (true);

drop policy if exists "option_groups: admin them" on public.option_groups;
create policy "option_groups: admin them"
  on public.option_groups for insert to authenticated with check (public.is_admin());

drop policy if exists "option_groups: admin sua" on public.option_groups;
create policy "option_groups: admin sua"
  on public.option_groups for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "option_groups: admin xoa" on public.option_groups;
create policy "option_groups: admin xoa"
  on public.option_groups for delete to authenticated using (public.is_admin());

drop policy if exists "option_choices: ai cung doc duoc" on public.option_choices;
create policy "option_choices: ai cung doc duoc"
  on public.option_choices for select to anon, authenticated using (true);

drop policy if exists "option_choices: admin them" on public.option_choices;
create policy "option_choices: admin them"
  on public.option_choices for insert to authenticated with check (public.is_admin());

drop policy if exists "option_choices: admin sua" on public.option_choices;
create policy "option_choices: admin sua"
  on public.option_choices for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "option_choices: admin xoa" on public.option_choices;
create policy "option_choices: admin xoa"
  on public.option_choices for delete to authenticated using (public.is_admin());

grant select on public.option_groups, public.option_choices to anon, authenticated;
grant insert, update, delete on public.option_groups, public.option_choices to authenticated;
revoke insert, update, delete on public.option_groups, public.option_choices from anon;


-- ============================================================================
--  PHAN 3 - DU LIEU: tao mon Mi tron, tuy chon Lau Thai, xoa mon to hop cu
-- ============================================================================

do $$
declare
  v_dm       uuid;
  v_mon      uuid;
  v_nhom_mi  uuid;
  v_nhom_tp  uuid;
  v_thuong   uuid;
  v_lau      uuid;
  v_nhom_soi uuid;
begin
  select id into v_dm from public.categories where slug = 'mi-nui-bun';
  if v_dm is null then
    raise exception 'Khong tim thay danh muc mi-nui-bun';
  end if;

  -- ---------- Mon "Mi tron" ----------
  if not exists (
    select 1 from public.menu_items where category_id = v_dm and name = 'Mì trộn'
  ) then
    insert into public.menu_items (category_id, name, description, price, sort_order)
    values (v_dm, 'Mì trộn',
            'Đã gồm 1 phần topping, thêm mỗi phần +5.000đ',
            20000, 4)
    returning id into v_mon;

    insert into public.option_groups
      (menu_item_id, name, kind, min_qty, included_qty, extra_unit_price, max_qty_per_choice, sort_order)
    values (v_mon, 'Loại mì', 'mot', 1, 0, 0, 1, 1)
    returning id into v_nhom_mi;

    insert into public.option_choices (group_id, name, description, sort_order)
    values (v_nhom_mi, 'Mì trộn thường', null, 1)
    returning id into v_thuong;

    insert into public.option_choices (group_id, name, description, sort_order) values
      (v_nhom_mi, 'Mì tương đen', 'Không cay, hơi đắng', 2),
      (v_nhom_mi, 'Mì phô mai',   'Cay',                 3),
      (v_nhom_mi, 'Mì sườn bò',   'Cay',                 4);

    insert into public.option_groups
      (menu_item_id, name, kind, min_qty, included_qty, extra_unit_price, max_qty_per_choice, sort_order)
    values (v_mon, 'Topping', 'nhieu', 1, 1, 5000, 5, 2)
    returning id into v_nhom_tp;

    insert into public.option_choices (group_id, name, requires_choice_id, sort_order) values
      (v_nhom_tp, 'Gà sốt phô mai',      null,     1),
      (v_nhom_tp, 'Gà sốt chua ngọt',    null,     2),
      (v_nhom_tp, 'Trứng xúc xích',      null,     3),
      (v_nhom_tp, 'Cá viên chiên',       null,     4),
      (v_nhom_tp, 'Cá viên sốt mắm tỏi', v_thuong, 5),
      (v_nhom_tp, 'Trứng cá',            null,     6),
      (v_nhom_tp, 'Thịt',                null,     7);
  end if;

  -- ---------- Lau Thai: chon bun hoac mi ----------
  select id into v_lau from public.menu_items
  where name = 'Lẩu Thái chua cay' limit 1;

  if v_lau is not null and not exists (
    select 1 from public.option_groups where menu_item_id = v_lau
  ) then
    insert into public.option_groups (menu_item_id, name, kind, min_qty, sort_order)
    values (v_lau, 'Loại sợi', 'mot', 1, 1)
    returning id into v_nhom_soi;

    insert into public.option_choices (group_id, name, sort_order) values
      (v_nhom_soi, 'Bún', 1),
      (v_nhom_soi, 'Mì',  2);

    -- Mo ta cu "chon soi khi goi mon" gio da thanh o chon that
    update public.menu_items set description = null
    where id = v_lau and description = 'Chọn sợi bún hoặc mì khi gọi món';
  end if;

  -- ---------- Xoa cac mon to hop cu ----------
  delete from public.menu_items
  where category_id = v_dm and name in (
    'Mì trộn cá viên sốt mắm tỏi',
    'Mì trộn trứng xúc xích',
    'Mì trộn trứng cá',
    'Mì trộn gà sốt chua ngọt',
    'Mì trộn gà sốt phô mai',
    'Mì trộn thịt',
    'Mì tương đen',
    'Bún nước tương'
  );

  delete from public.menu_items
  where category_id = (select id from public.categories where slug = 'mi-pho-mai');

  delete from public.categories where slug = 'mi-pho-mai';
end $$;


-- ============================================================================
--  PHAN 4 - KIEM TRA KET QUA
-- ============================================================================

select
  (select count(*) from public.categories)     as so_danh_muc,
  (select count(*) from public.menu_items)     as so_mon,
  (select count(*) from public.option_groups)  as so_nhom_tuy_chon,
  (select count(*) from public.option_choices) as so_lua_chon;
