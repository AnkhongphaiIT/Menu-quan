-- ============================================================================
--  004 - CHE DO TU TIEN (11/09/2026)
--
--  Chu quan yeu cau: phan tu tien phai TACH RIENG, khong duoc gay loi cho
--  menu thuong. Vi vay:
--    * 4 bang MOI, ten bat dau bang tu_tien_. KHONG them/sua/xoa cot nao cua
--      bang cu. Ten that, gia that van nam nguyen o bang cu.
--    * Bang moi chi chua chu tu tien, noi voi mon that bang ma (id).
--    * Xoa mon that thi dong tu tien cua mon do tu xoa theo (on delete cascade).
--
--  Thay doi DUY NHAT dung toi menu that: them nhom tuy chon "Cap do cay"
--  (0-7, cung gia, bat buoc chon) cho Mi cay - qua dung bang tuy chon san co.
--
--  HOAN TAC phan tu tien (menu thuong khong anh huong):
--    drop table public.tu_tien_lua_chon, public.tu_tien_nhom,
--               public.tu_tien_mon, public.tu_tien_danh_muc;
--  HOAN TAC cap do cay: vao admin, Sua Mi cay, xoa nhom "Cap do cay".
--
--  Chay lai file nay lan nua KHONG tao trung du lieu.
-- ============================================================================


-- ============================================================================
--  PHAN 1 - BANG MOI
-- ============================================================================

create table if not exists public.tu_tien_danh_muc (
  category_id uuid primary key references public.categories (id) on delete cascade,
  ten         text not null check (length(trim(ten)) > 0),
  updated_at  timestamptz not null default now()
);

create table if not exists public.tu_tien_mon (
  menu_item_id uuid primary key references public.menu_items (id) on delete cascade,
  ten          text not null check (length(trim(ten)) > 0),
  mo_ta        text,
  updated_at   timestamptz not null default now()
);

create table if not exists public.tu_tien_nhom (
  group_id   uuid primary key references public.option_groups (id) on delete cascade,
  ten        text not null check (length(trim(ten)) > 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.tu_tien_lua_chon (
  choice_id  uuid primary key references public.option_choices (id) on delete cascade,
  ten        text not null check (length(trim(ten)) > 0),
  updated_at timestamptz not null default now()
);


-- ============================================================================
--  PHAN 2 - PHAN QUYEN: y het cac bang menu khac
--  Ai cung doc duoc, chi admin (email trong admin_allowlist) moi ghi duoc.
-- ============================================================================

alter table public.tu_tien_danh_muc enable row level security;

drop policy if exists "tu_tien_danh_muc: ai cung doc duoc" on public.tu_tien_danh_muc;
create policy "tu_tien_danh_muc: ai cung doc duoc"
  on public.tu_tien_danh_muc for select to anon, authenticated using (true);

drop policy if exists "tu_tien_danh_muc: admin them" on public.tu_tien_danh_muc;
create policy "tu_tien_danh_muc: admin them"
  on public.tu_tien_danh_muc for insert to authenticated with check (public.is_admin());

drop policy if exists "tu_tien_danh_muc: admin sua" on public.tu_tien_danh_muc;
create policy "tu_tien_danh_muc: admin sua"
  on public.tu_tien_danh_muc for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tu_tien_danh_muc: admin xoa" on public.tu_tien_danh_muc;
create policy "tu_tien_danh_muc: admin xoa"
  on public.tu_tien_danh_muc for delete to authenticated using (public.is_admin());

alter table public.tu_tien_mon enable row level security;

drop policy if exists "tu_tien_mon: ai cung doc duoc" on public.tu_tien_mon;
create policy "tu_tien_mon: ai cung doc duoc"
  on public.tu_tien_mon for select to anon, authenticated using (true);

drop policy if exists "tu_tien_mon: admin them" on public.tu_tien_mon;
create policy "tu_tien_mon: admin them"
  on public.tu_tien_mon for insert to authenticated with check (public.is_admin());

drop policy if exists "tu_tien_mon: admin sua" on public.tu_tien_mon;
create policy "tu_tien_mon: admin sua"
  on public.tu_tien_mon for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tu_tien_mon: admin xoa" on public.tu_tien_mon;
create policy "tu_tien_mon: admin xoa"
  on public.tu_tien_mon for delete to authenticated using (public.is_admin());

alter table public.tu_tien_nhom enable row level security;

drop policy if exists "tu_tien_nhom: ai cung doc duoc" on public.tu_tien_nhom;
create policy "tu_tien_nhom: ai cung doc duoc"
  on public.tu_tien_nhom for select to anon, authenticated using (true);

drop policy if exists "tu_tien_nhom: admin them" on public.tu_tien_nhom;
create policy "tu_tien_nhom: admin them"
  on public.tu_tien_nhom for insert to authenticated with check (public.is_admin());

drop policy if exists "tu_tien_nhom: admin sua" on public.tu_tien_nhom;
create policy "tu_tien_nhom: admin sua"
  on public.tu_tien_nhom for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tu_tien_nhom: admin xoa" on public.tu_tien_nhom;
create policy "tu_tien_nhom: admin xoa"
  on public.tu_tien_nhom for delete to authenticated using (public.is_admin());

alter table public.tu_tien_lua_chon enable row level security;

drop policy if exists "tu_tien_lua_chon: ai cung doc duoc" on public.tu_tien_lua_chon;
create policy "tu_tien_lua_chon: ai cung doc duoc"
  on public.tu_tien_lua_chon for select to anon, authenticated using (true);

drop policy if exists "tu_tien_lua_chon: admin them" on public.tu_tien_lua_chon;
create policy "tu_tien_lua_chon: admin them"
  on public.tu_tien_lua_chon for insert to authenticated with check (public.is_admin());

drop policy if exists "tu_tien_lua_chon: admin sua" on public.tu_tien_lua_chon;
create policy "tu_tien_lua_chon: admin sua"
  on public.tu_tien_lua_chon for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "tu_tien_lua_chon: admin xoa" on public.tu_tien_lua_chon;
create policy "tu_tien_lua_chon: admin xoa"
  on public.tu_tien_lua_chon for delete to authenticated using (public.is_admin());

grant select on public.tu_tien_danh_muc, public.tu_tien_mon, public.tu_tien_nhom, public.tu_tien_lua_chon
  to anon, authenticated;
grant insert, update, delete on public.tu_tien_danh_muc, public.tu_tien_mon, public.tu_tien_nhom, public.tu_tien_lua_chon
  to authenticated;
revoke insert, update, delete on public.tu_tien_danh_muc, public.tu_tien_mon, public.tu_tien_nhom, public.tu_tien_lua_chon
  from anon;


-- ============================================================================
--  PHAN 3 - CAP DO CAY CHO MI CAY (menu that, dung bang tuy chon san co)
-- ============================================================================

do $$
declare
  v_mon  uuid;
  v_nhom uuid;
begin
  select id into v_mon from public.menu_items where name = 'Mì cay' limit 1;
  if v_mon is null then
    raise notice 'Khong tim thay mon Mi cay - bo qua cap do cay';
    return;
  end if;

  select id into v_nhom from public.option_groups
   where menu_item_id = v_mon and name = 'Cấp độ cay' limit 1;
  if v_nhom is not null then
    raise notice 'Mi cay da co nhom Cap do cay - khong tao lai';
  else
    insert into public.option_groups
      (menu_item_id, name, kind, min_qty, included_qty, extra_unit_price, max_qty_per_choice, sort_order)
    values (v_mon, 'Cấp độ cay', 'mot', 1, 0, 0, 1, 1)
    returning id into v_nhom;

    insert into public.option_choices (group_id, name, price_delta, sort_order) values
      (v_nhom, 'Cấp 0 (không cay)', 0, 1),
      (v_nhom, 'Cấp 1', 0, 2),
      (v_nhom, 'Cấp 2', 0, 3),
      (v_nhom, 'Cấp 3', 0, 4),
      (v_nhom, 'Cấp 4', 0, 5),
      (v_nhom, 'Cấp 5', 0, 6),
      (v_nhom, 'Cấp 6', 0, 7),
      (v_nhom, 'Cấp 7 (cay nhất)', 0, 8);
  end if;

  insert into public.tu_tien_nhom (group_id, ten) values (v_nhom, 'Cảnh Giới')
  on conflict (group_id) do update set ten = excluded.ten, updated_at = now();

  insert into public.tu_tien_lua_chon (choice_id, ten)
  select c.id, v.ten from public.option_choices c
  join (values
    ('Cấp 0 (không cay)', 'Phàm Nhân'),
    ('Cấp 1', 'Luyện Khí'),
    ('Cấp 2', 'Trúc Cơ'),
    ('Cấp 3', 'Kết Đan'),
    ('Cấp 4', 'Nguyên Anh'),
    ('Cấp 5', 'Hóa Thần'),
    ('Cấp 6', 'Luyện Hư'),
    ('Cấp 7 (cay nhất)', 'Độ Kiếp')
  ) as v(ten_that, ten) on v.ten_that = c.name
  where c.group_id = v_nhom
  on conflict (choice_id) do update set ten = excluded.ten, updated_at = now();
end $$;


-- ============================================================================
--  PHAN 4 - CHU TU TIEN (lay tu menu-tu-tien-review.md da duyet)
-- ============================================================================

insert into public.tu_tien_danh_muc (category_id, ten) values
  ('4e3665eb-cf04-4b91-b27c-366c8500ae4c', 'Linh Thực Các'),  -- Mì – Nui – Bún
  ('6251ee7f-074a-4f12-84cd-ccd320dae1fd', 'Phù Lục Đường'),  -- Bánh tráng
  ('0cec0076-bf21-4154-af2c-c828c1beca19', 'Hoàng Kim Lò'),  -- Ăn vặt – Đồ chiên
  ('8be6bcc2-4bc9-4cc6-8c19-cbe16e29309a', 'Linh Nhũ Điện'),  -- Trà sữa
  ('c5ab83a6-8149-483a-bbb6-dbbbf8dff3c0', 'Thiên Hương Trà Viên'),  -- Trà trái cây
  ('898a12db-37cd-4e2b-a41d-0e0f5a8f03ae', 'Linh Tuyền Đình'),  -- Nước giải khát khác
  ('6fafc349-ef1b-4433-8ead-14b5acd79119', 'Bạch Ngọc Đài')  -- Sữa chua
on conflict (category_id) do update set ten = excluded.ten, updated_at = now();

insert into public.tu_tien_mon (menu_item_id, ten, mo_ta) values
  ('d4d9207e-28e1-4621-be9b-da662ed784e3', 'Kim Hương Ngư Đan', 'Kim đan luyện từ cá, chiên vàng rồi phủ sốt mắm tỏi màu nâu, thơm mà không cay. Cá viên chiên sốt mắm tỏi.'),  -- Cá viên sốt mắm tỏi
  ('07d97691-2890-4068-85ed-47fe060edb3d', 'Kim Giáp Bách Bảo', 'Trăm món bảo vật khoác kim giáp, chiên vàng một lượt. Cá viên đủ loại: có tôm bột, ốc bột, đùi bột, viên lẩu…'),  -- Cá viên đủ loại
  ('20bed3d1-97b2-411d-8af3-a2e11cb996dd', 'Tử Ngọc Linh Căn Bánh', 'Linh căn tử ngọc đào từ lòng đất, làm thành bánh rồi luyện qua chảo lửa. Bánh khoai mỡ tím chiên.'),  -- Bánh khoai mỡ
  ('749c99c6-f4d1-40df-8b3e-0ac941854e11', 'Kim Y Nhũ Tâm Côn', 'Linh côn khoác kim y bằng bột chiên vàng, bên trong giấu xúc xích cùng lõi phô mai sệt. Hot dog phô mai chiên.'),  -- Hot dog
  ('a1f7f8b7-ceed-424a-a41d-01e7e3427d4d', 'Kim Nhũ Linh Kiếm', 'Thanh linh kiếm luyện từ phô mai, sắc vàng như ánh kim đan. Phô mai que.'),  -- Phô mai que
  ('820c6455-460a-46a0-ba1d-0b93e6abfa2a', 'Đức Quốc Kim Côn', 'Pháp khí từ Đức Quốc xa xôi, chiên vàng óng, thân tròn dài như cây côn trấn điếm. Xúc xích Đức chiên.'),  -- Xúc xích Đức
  ('ad8a4414-c2f9-4ad0-ac8d-032c248b5c36', 'Hoàng Kim Linh Nui', 'Nui được luyện qua chảo lửa rồi khoác một lớp trứng hoàng kim. Nui chiên trứng, chọn kèm hành phi, dưa chua hoặc rau răm.'),  -- Nui chiên trứng
  ('9ac0a0a4-3856-458c-9fef-bd074d1ed07a', 'Ngưu Vị Thần Nui', 'Thịt bò cùng nui đảo qua lửa lớn, linh khí quyện vào từng ống nui. Nui xào bò.'),  -- Nui xào bò
  ('4aaee57a-cf5e-481b-9c3a-97e6c1881727', 'Tây Dương Hồng Tương Ti', 'Sợi mì từ Tây Dương xa xôi, phủ một lớp hồng tương cà chua. Mì Ý sốt cà chua.'),  -- Mì Ý
  ('041a6eda-cd2d-4591-ac43-51918af3c6ef', 'Vạn Vị Linh Ti', 'Một bát linh ti, đạo hữu tự chọn pháp môn và gia trì. Mì trộn, đã gồm 1 phần topping, thêm mỗi phần +5.000đ.'),  -- Mì trộn
  ('888a808b-bfa4-4a3a-a3ee-46c610c6f3d2', 'Viêm Hỏa Thần Ti', 'Mỗi sợi mì đều ngấm hỏa khí; tu vi chưa tới, chớ vội thử cảnh giới Độ Kiếp. Mì cay, chọn cấp độ cay 0–7.'),  -- Mì cay
  ('a7687b48-5533-4eed-9c0e-949aa86bde71', 'Xiêm La Liệt Hỏa Lẩu', 'Nồi lẩu đất Xiêm La sôi sục hỏa khí, chua cay đánh thức cả kinh mạch. Lẩu Thái chua cay, chọn sợi bún hoặc mì.'),  -- Lẩu Thái chua cay
  ('8660693b-3a82-4d92-8dad-6f92d08cf6c1', 'Vạn Vị Linh Phù', 'Linh phù xé sợi, trộn vạn vị trong một chiêu, bí pháp bổn điếm không truyền ra ngoài. Bánh tráng trộn.'),  -- Bánh tráng trộn
  ('4f062115-1e71-4c21-8e4d-e6e5dedd227b', 'Thiên Phù Quyển', 'Linh phù cuộn chặt như một quyển trục bí kíp của bổn điếm. Bánh tráng cuộn.'),  -- Bánh tráng cuộn
  ('e1d61c03-7e15-4332-8212-d13dac35ac74', 'Diêm Vị Phù Phiến', 'Từng tấm linh phù chấm vào diêm tinh mà luyện vị. Bánh tráng chấm muối hành hoặc muối.'),  -- Bánh tráng chấm muối hành / muối
  ('9ff0673a-f291-4b9a-92e4-267bf8974a6c', 'Hồng Ngọc Nhũ', 'Bạch ngọc nhũ điểm sắc hồng, thoảng hương dâu. Sữa chua dâu.'),  -- Sữa chua dâu
  ('6a2b08d0-c0cd-4f2e-a6af-92cd71f6c216', 'Lam Ngọc Nhũ', 'Bạch ngọc nhũ điểm sắc lam tím của việt quất. Sữa chua việt quất.'),  -- Sữa chua việt quất
  ('0e980b46-cb79-402a-ae04-2b48ca894d0d', 'Hương Qua Ngọc Nhũ', 'Bạch ngọc nhũ thấm hương dưa lưới thơm dịu. Sữa chua dưa lưới.'),  -- Sữa chua dưa lưới
  ('374cd431-f2e8-48ca-959c-4875ca70affb', 'Hoàng Ngọc Nhũ', 'Bạch ngọc nhũ điểm sắc vàng của xoài. Sữa chua xoài.'),  -- Sữa chua xoài
  ('ca74395c-5034-4afa-b65b-3aba42a403a4', 'Bách Hương Ngọc Nhũ', 'Chanh dây, xưa gọi bách hương quả, hòa cùng bạch ngọc nhũ chua dịu. Sữa chua chanh dây.'),  -- Sữa chua chanh dây
  ('07777e2e-7739-4755-aa2b-30c61bc8267b', 'Băng Tuyết Ngọc Nhũ', 'Bạch ngọc nhũ gặp băng tuyết, mát lạnh tận đan điền. Sữa chua đá.'),  -- Sữa chua đá
  ('a17d2421-6ef5-431c-833c-ffe092395ea8', 'Băng Hàn Me Lộ', 'Me chua ngọt gặp hàn băng, tu sĩ vừa xuất quan uống là tỉnh người. Đá me.'),  -- Đá me
  ('6fb6aebd-5cf5-4367-9e91-6876ab954443', 'Kim Cam Linh Thủy', 'Linh thủy vàng óng ép từ cam, sắc như kim đan. Cam ép.'),  -- Cam ép
  ('a3d2a05d-a6a1-4c40-86f3-92e9545ef5dd', 'Hồng Lôi Tiên Thủy', 'Tiên thủy sắc hồng, bọt ga nổ lách tách như lôi kiếp nhỏ. Soda dâu.'),  -- Soda dâu
  ('d91d4964-0579-4241-9342-99c6fac8572a', 'Bách Vị Lôi Thủy', 'Trăm vị hội tụ, bọt ga lách tách như sấm sét độ kiếp. Soda mix vị.'),  -- Soda mix vị
  ('5e574296-93e5-43bb-9c0c-e9f8d22ea0a4', 'Cổ Pháp Nhũ Trà', 'Pha theo cổ pháp lưu truyền, trà và sữa hòa làm một. Trà sữa truyền thống.'),  -- Trà sữa truyền thống
  ('36e4366c-919c-4782-99db-e959a8e930ba', 'Tử Sắc Châu Nhũ Trà', 'Linh nhũ nhuộm sắc tím, dưới đáy ẩn từng hạt trân châu. Trà sữa khoai môn (bột khoai môn), có trân châu.'),  -- Trà sữa khoai môn
  ('2dfda1ce-a6ed-4ba7-bba9-9b90a459e929', 'Bách Vị Nhũ Trà', 'Trăm vị hội tụ trong một chén linh nhũ, mỗi ngụm một cảnh giới. Trà sữa mix vị.'),  -- Trà sữa mix vị
  ('b4e51793-7496-410f-b97c-5f5a66428e66', 'Thanh Diệp Nhũ Trà', 'Lá trà xanh biếc hòa cùng linh nhũ, sắc như ngọc bích. Trà sữa Thái xanh.'),  -- Trà sữa Thái xanh
  ('f1e45338-4e4c-4849-82ec-5eba9e203635', 'Hoàng Hôn Nhũ Trà', 'Sắc cam đỏ như ráng hoàng hôn trên đỉnh tông môn. Trà sữa Thái đỏ.'),  -- Trà sữa Thái đỏ
  ('f09232aa-441a-4752-a453-1168bf924914', 'Mạt Trà Linh Nhũ', 'Bột trà xanh mài mịn, hòa cùng linh nhũ thành chén bích lục. Trà sữa matcha.'),  -- Trà sữa matcha
  ('0a97a889-0f5b-4a17-932c-a64164e14554', 'Hồng Trà Thần Nhũ', 'Hồng trà hòa cùng linh nhũ, giản dị mà vững như đạo tâm. Lipton sữa.'),  -- Lipton sữa
  ('ba8ade18-d98a-4ef9-abe4-b11ab6e86932', 'Hắc Châu Cam Lộ Nhũ', 'Hắc châu thấm cam lộ đen, chìm trong linh nhũ tươi. Sữa tươi trân châu đường đen.'),  -- Sữa tươi trân châu đường đen
  ('d6ab7566-4ad5-400d-8d01-76829f63c857', 'Bích Tuyết Tiên Nhũ', 'Bột trà xanh hòa cùng sữa, xanh như bích ngọc, trắng như tuyết. Matcha latte.'),  -- Matcha latte
  ('ff1833b4-0717-4e32-9ac3-8ba1907a615c', 'Dâu Hồng Tiên Lộ', 'Tiên lộ nhuộm sắc hồng, thoảng hương dâu. Trà dâu.'),  -- Trà dâu
  ('c4b1da68-7405-4117-b15a-248602d7a185', 'Tiên Đào Ngọc Lộ', 'Tương truyền đào tiên nghìn năm mới chín, bổn điếm chỉ lấy hương đào pha thành ngọc lộ. Trà đào.'),  -- Trà đào
  ('928e66fb-fdea-4093-8465-693c38e01b10', 'Lệ Chi Hương Tuyền', 'Hương lệ chi thanh ngọt, xưa kia chỉ bậc đế vương mới được thưởng. Trà vải.'),  -- Trà vải
  ('cb47777f-783d-4edb-a9f6-925f2921787d', 'Song Hương Hồng Thủy', 'Hai luồng hương ổi hồng và chanh dây giao hòa trong một chén hồng thủy. Trà ổi hồng chanh dây.'),  -- Trà ổi hồng chanh dây
  ('24360a73-5ecd-40ba-af3e-4f185c009705', 'Táo Hương Linh Lộ', 'Linh lộ thấm hương táo, một ngụm là tỉnh cả thần thức. Trà táo.'),  -- Trà táo
  ('bcfd82e3-3293-4031-b9cc-17e43e788cca', 'Lam Hương Tiên Tuyền', 'Sắc lam tím của việt quất nhuộm cả dòng tiên tuyền. Trà việt quất.'),  -- Trà việt quất
  ('c0ec7c56-f47d-4c66-a0a5-607ec6ce8a21', 'Kim Quất Linh Lộ', 'Vị quất chua thanh, một ngụm là linh khí tụ về đan điền. Trà tắc.'),  -- Trà tắc
  ('de69b907-a669-4117-b1a5-4cda48ca2bf9', 'Bích Quất Thần Tuyền', 'Trà Thái xanh gặp quất chua thanh, sắc bích như hồ tiên. Trà tắc Thái xanh.')  -- Trà tắc Thái xanh
on conflict (menu_item_id) do update set ten = excluded.ten, mo_ta = excluded.mo_ta, updated_at = now();

insert into public.tu_tien_nhom (group_id, ten) values
  ('46bdd7a5-9d37-4434-9253-17461503ed72', 'Bảo Vật Kèm'),  -- Nui chiên trứng: đồ ăn kèm
  ('7ec9d2c3-d077-4c22-ac33-3c80bef8dffa', 'Pháp Môn'),  -- Mì trộn: Loại mì
  ('9fd0df6d-4859-466c-9b69-fec81a49baea', 'Gia Trì'),  -- Mì trộn: Topping
  ('f7d80849-6a72-4f1a-9935-b5251179f263', 'Tuyển Ti')  -- Lẩu Thái chua cay: Loại sợi
on conflict (group_id) do update set ten = excluded.ten, updated_at = now();

insert into public.tu_tien_lua_chon (choice_id, ten) values
  ('107bc335-86f2-4204-80e8-78a60d8e2e6b', 'Hắc Tương Pháp'),  -- Mì trộn / Loại mì / Mì tương đen
  ('20f9f62b-5015-4e58-922b-cbb82f2c3886', 'Linh Nhục'),  -- Mì trộn / Topping / Thịt
  ('40b0a966-179e-4cdc-954a-0eb91e2b0dea', 'Bích Diệp'),  -- Nui chiên trứng / đồ ăn kèm / rau răm
  ('42f51bad-d55b-4977-8937-fa2a58e20c83', 'Ngưu Vị Hỏa Pháp'),  -- Mì trộn / Loại mì / Mì sườn bò
  ('48a8a01c-d05d-49a4-b411-b415db41b0c6', 'Kim Phiến'),  -- Nui chiên trứng / đồ ăn kèm / hành phi
  ('5c413364-fcdb-4c4f-bc61-684b3c9c8f51', 'Bạch Ti'),  -- Lẩu Thái chua cay / Loại sợi / Bún
  ('5f671e0e-da95-49fa-ae08-140a6835d061', 'Hoàng Kim Côn'),  -- Mì trộn / Topping / Trứng xúc xích
  ('63c7257e-c943-4a5a-82f9-21f9ff8602fe', 'Kim Hương Ngư Đan'),  -- Mì trộn / Topping / Cá viên sốt mắm tỏi
  ('7eafdb38-4c9b-46c2-91b9-31f619127678', 'Cam Lộ Phượng'),  -- Mì trộn / Topping / Gà sốt chua ngọt
  ('8fc217e8-1ce8-4177-b86c-5a54090eb31b', 'Kim Phượng'),  -- Mì trộn / Topping / Gà sốt phô mai
  ('9593891c-df49-42f0-9dcc-38244c437512', 'Thần Ti'),  -- Lẩu Thái chua cay / Loại sợi / Mì
  ('9872e409-2210-4404-93bf-bf812283ef53', 'Ngư Châu'),  -- Mì trộn / Topping / Trứng cá
  ('9e41e897-a8e5-4daa-9f1b-0a9a50bce610', 'Bản Nguyên Pháp'),  -- Mì trộn / Loại mì / Mì trộn thường
  ('b86061df-2a68-44ee-a0b7-bb3de6dc3fb7', 'Thanh Tịnh'),  -- Nui chiên trứng / đồ ăn kèm / không thêm
  ('eb76ace9-ebc1-4a4f-a496-5db46ece91ed', 'Kim Hỏa Pháp'),  -- Mì trộn / Loại mì / Mì phô mai
  ('f4b5723a-d47f-4874-bc0d-49187be797db', 'Linh Dưa'),  -- Nui chiên trứng / đồ ăn kèm / dưa chua
  ('fa2cf777-9921-4f7c-8235-3b622c2e217e', 'Kim Ngư Đan')  -- Mì trộn / Topping / Cá viên chiên
on conflict (choice_id) do update set ten = excluded.ten, updated_at = now();


-- ============================================================================
--  PHAN 5 - KIEM TRA: phai ra 7 / 42 / 5 / 25
-- ============================================================================
select
  (select count(*) from public.tu_tien_danh_muc) as danh_muc,
  (select count(*) from public.tu_tien_mon)      as mon,
  (select count(*) from public.tu_tien_nhom)     as nhom,
  (select count(*) from public.tu_tien_lua_chon) as lua_chon;
