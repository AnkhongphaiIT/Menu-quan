/**
 * KHO GIỎ HÀNG — cầu nối giữa lib/cart.ts và React. Thuần TypeScript.
 *
 * Vì sao có file này thay vì nhét thẳng vào React:
 *
 * localStorage là dữ liệu nằm NGOÀI React. Cách cũ — dùng useEffect để đọc
 * rồi setState — bị React cảnh báo, và có một lỗi thật: giữa lúc trang hiện
 * ra và lúc effect chạy xong, giao diện hiện giỏ rỗng rồi mới nhảy sang giỏ
 * đầy, gây giật một nhịp.
 *
 * Cách đúng là `useSyncExternalStore`: React tự hỏi kho này "giỏ hàng hiện
 * ra sao?" mỗi khi cần vẽ lại. Trên máy chủ nó hỏi layTrangThaiMayChu()
 * (luôn trả giỏ rỗng, vì máy chủ không có localStorage), ở máy khách nó hỏi
 * layTrangThai(). Không effect, không setState, không lệch HTML.
 *
 * File này cũng không import React — giữ đúng nguyên tắc tách phần tính toán
 * ra khỏi giao diện, để tính năng đặt món online sau này dùng lại được.
 */

import * as Gio from "./cart";
import type { GioHang } from "./cart";

export type TrangThaiGio = {
  gio: GioHang;
  /** true khi vừa khôi phục được giỏ cũ — dùng để hiện thông báo nhẹ */
  vuaKhoiPhuc: boolean;
};

/**
 * Trạng thái lúc dựng trang trên máy chủ: luôn là giỏ rỗng.
 *
 * Phải là MỘT vật cố định dùng đi dùng lại (không tạo mới mỗi lần gọi),
 * nếu không React thấy vật khác nhau sau mỗi lần hỏi và vẽ lại vô tận.
 */
const TRANG_THAI_MAY_CHU: TrangThaiGio = {
  gio: { dong: [], hetHanLuc: 0 },
  vuaKhoiPhuc: false,
};

/** null = chưa đọc bộ nhớ lần nào. Chỉ tồn tại ở máy khách. */
let trangThai: TrangThaiGio | null = null;

const nguoiNghe = new Set<() => void>();

/** Đọc bộ nhớ trình duyệt một lần duy nhất, lúc cần tới đầu tiên. */
function khoiTao(): TrangThaiGio {
  const bayGio = Date.now();
  const daLuu = Gio.docTuBoNho(bayGio);

  if (daLuu && daLuu.dong.length > 0) {
    // Mở lại trang cũng tính là một thao tác của khách, nên gia hạn thêm 60 phút
    const gio = Gio.giaHan(daLuu, bayGio);
    Gio.ghiVaoBoNho(gio);
    return { gio, vuaKhoiPhuc: true };
  }

  return { gio: Gio.gioRong(bayGio), vuaKhoiPhuc: false };
}

export function layTrangThai(): TrangThaiGio {
  if (trangThai === null) trangThai = khoiTao();
  return trangThai;
}

export function layTrangThaiMayChu(): TrangThaiGio {
  return TRANG_THAI_MAY_CHU;
}

export function dangKy(bao: () => void): () => void {
  nguoiNghe.add(bao);
  return () => {
    nguoiNghe.delete(bao);
  };
}

function dat(moi: TrangThaiGio): void {
  trangThai = moi;
  for (const bao of nguoiNghe) bao();
}

/**
 * Đổi giỏ hàng, lưu lại, rồi báo cho React vẽ lại.
 *
 * Mọi thao tác đều tắt thông báo "đã khôi phục" — khách đã bấm nút rồi thì
 * không cần nhắc nữa.
 */
function doiGio(bienDoi: (gio: GioHang, bayGio: number) => GioHang): void {
  const bayGio = Date.now();
  const gio = bienDoi(layTrangThai().gio, bayGio);
  Gio.ghiVaoBoNho(gio);
  dat({ gio, vuaKhoiPhuc: false });
}

export function them(id: string): void {
  doiGio((gio, bayGio) => Gio.them(gio, id, bayGio));
}

export function bot(id: string): void {
  doiGio((gio, bayGio) => Gio.bot(gio, id, bayGio));
}

export function xoa(id: string): void {
  doiGio((gio, bayGio) => Gio.xoa(gio, id, bayGio));
}

export function xoaSach(): void {
  doiGio((_gio, bayGio) => Gio.xoaSach(bayGio));
}

export function tatThongBaoKhoiPhuc(): void {
  const hienTai = layTrangThai();
  if (!hienTai.vuaKhoiPhuc) return;
  dat({ ...hienTai, vuaKhoiPhuc: false });
}

/** Chỉ dùng trong test: đưa kho về trạng thái chưa đọc bộ nhớ. */
export function datLaiChoTest(): void {
  trangThai = null;
  nguoiNghe.clear();
}
