/**
 * LÕI GIỎ HÀNG — thuần TypeScript, KHÔNG phụ thuộc React.
 *
 * Vì sao tách riêng file này (yêu cầu F2 trong tài liệu):
 * Giai đoạn sau sẽ thêm tính năng đặt món online. Lúc đó phần tính toán giỏ
 * hàng phải dùng lại được nguyên vẹn — kể cả ở phía máy chủ, nơi không có
 * React và không có trình duyệt. Nên ở đây tuyệt đối không import React,
 * và mọi hàm đều là hàm thuần: nhận vào giỏ cũ, trả ra giỏ MỚI, không sửa
 * giỏ cũ tại chỗ. Nhờ vậy viết test rất dễ và không sinh lỗi khó truy.
 *
 * Thời gian luôn được truyền vào qua tham số `bayGio` thay vì gọi Date.now()
 * bên trong. Đây là điểm mấu chốt để test được chuyện hết hạn: test chỉ cần
 * truyền vào mốc thời gian giả, không phải ngồi chờ 60 phút.
 */

import type { MenuItem, OptionGroup } from "./types";
import {
  docChuoi,
  ghiChuoi,
  khoMacDinh,
  xoaKhoa,
  type KhoLuu,
} from "./bo-nho";
import {
  chuanHoa,
  giaCauHinh,
  khoaCauHinh,
  kiemTraCauHinh,
  moTaCauHinh,
  type LuaChon,
} from "./tuy-chon";

/** Dùng lại kiểu từ lib/bo-nho.ts. Xuất lại ở đây cho các file cũ khỏi phải sửa. */
export type { KhoLuu };

/**
 * Giỏ hàng sống 60 phút kể từ thao tác cuối cùng.
 *
 * Chủ quán yêu cầu tối thiểu 30 phút. Để rộng gấp đôi cho chắc, vì thời gian
 * này được GIA HẠN LẠI sau mỗi lần khách bấm — khách còn ngồi ăn và còn chọn
 * món thì giỏ hàng không bao giờ hết hạn. 60 phút chỉ tính từ lúc khách
 * ngừng hẳn thao tác.
 */
export const HAN_GIO_HANG_MS = 60 * 60 * 1000;

/**
 * Khoá lưu trong localStorage.
 *
 * Giữ nguyên ":v1" dù đã thêm tuỳ chọn: trường `luaChon` là KHÔNG BẮT BUỘC,
 * nên giỏ hàng cũ (chưa có tuỳ chọn) vẫn đọc được bình thường. Chỉ khi đổi cấu
 * trúc theo kiểu không tương thích mới cần đổi thành ":v2".
 */
export const KHOA_BO_NHO = "menu-quan:gio-hang:v1";

/**
 * Một dòng trong giỏ: mã món, số lượng, và các lựa chọn (loại mì, topping...).
 *
 * Hai dòng cùng món nhưng khác lựa chọn là HAI dòng riêng: "Mì phô mai + Gà"
 * và "Mì tương đen + Gà" phải hiện tách ra, nhân viên mới biết làm gì.
 */
export type DongGio = {
  id: string;
  soLuong: number;
  luaChon?: LuaChon;
};

export type GioHang = {
  dong: DongGio[];
  /** Mốc thời gian hết hạn, tính bằng mili giây kiểu Date.now() */
  hetHanLuc: number;
};

/**
 * Cố tình KHÔNG lưu tên món và giá vào giỏ hàng.
 *
 * Nếu lưu, khách để giỏ hàng qua đêm rồi chủ quán đổi giá thì hôm sau khách
 * mở ra vẫn thấy giá cũ — sai và dễ gây tranh cãi khi tính tiền. Chỉ lưu mã
 * món và mã lựa chọn; tên, giá, luật topping đều lấy từ menu hiện tại mỗi lần
 * hiển thị, nên luôn đúng.
 */
export type DongHienThi = {
  /** Mã nhận diện dòng — dùng cho nút bớt/xoá */
  khoa: string;
  mon: MenuItem;
  soLuong: number;
  luaChon: LuaChon;
  /** "Mì phô mai · Gà sốt chua ngọt ×2" — chuỗi rỗng nếu món không có tuỳ chọn */
  moTa: string;
  donGia: number;
  thanhTien: number;
};

/** Mã nhận diện một dòng: cùng món + cùng lựa chọn thì cùng mã. */
export function khoaDong(id: string, luaChon?: LuaChon | null): string {
  return `${id}|${khoaCauHinh(luaChon)}`;
}

function khoaCuaDong(d: DongGio): string {
  return khoaDong(d.id, d.luaChon);
}

/* ==========================================================================
   TẠO VÀ KIỂM TRA HẠN
   ========================================================================== */

export function gioRong(bayGio: number): GioHang {
  return { dong: [], hetHanLuc: bayGio + HAN_GIO_HANG_MS };
}

export function conHan(gio: GioHang, bayGio: number): boolean {
  return gio.hetHanLuc > bayGio;
}

/** Đẩy hạn ra xa thêm 60 phút nữa kể từ bây giờ. */
export function giaHan(gio: GioHang, bayGio: number): GioHang {
  return { ...gio, hetHanLuc: bayGio + HAN_GIO_HANG_MS };
}

/* ==========================================================================
   CÁC THAO TÁC — mọi thao tác đều tự gia hạn
   ========================================================================== */

export function them(
  gio: GioHang,
  id: string,
  bayGio: number,
  soLuong = 1,
  luaChon?: LuaChon,
): GioHang {
  if (soLuong <= 0) return giaHan(gio, bayGio);

  const sach = chuanHoa(luaChon);
  const coLuaChon = Object.keys(sach).length > 0;
  const khoa = khoaDong(id, sach);

  const daCo = gio.dong.find((d) => khoaCuaDong(d) === khoa);
  const dong = daCo
    ? gio.dong.map((d) =>
        khoaCuaDong(d) === khoa ? { ...d, soLuong: d.soLuong + soLuong } : d,
      )
    : [
        ...gio.dong,
        coLuaChon ? { id, soLuong, luaChon: sach } : { id, soLuong },
      ];

  return { dong, hetHanLuc: bayGio + HAN_GIO_HANG_MS };
}

/** Giảm 1. Giảm về 0 thì dòng đó biến mất khỏi giỏ. `khoa` lấy từ khoaDong(). */
export function bot(gio: GioHang, khoa: string, bayGio: number): GioHang {
  const dong = gio.dong
    .map((d) => (khoaCuaDong(d) === khoa ? { ...d, soLuong: d.soLuong - 1 } : d))
    .filter((d) => d.soLuong > 0);

  return { dong, hetHanLuc: bayGio + HAN_GIO_HANG_MS };
}

export function xoa(gio: GioHang, khoa: string, bayGio: number): GioHang {
  return {
    dong: gio.dong.filter((d) => khoaCuaDong(d) !== khoa),
    hetHanLuc: bayGio + HAN_GIO_HANG_MS,
  };
}

export function xoaSach(bayGio: number): GioHang {
  return gioRong(bayGio);
}

/** Tổng số món trong giỏ, tính cả số lượng. 2 ly trà + 1 tô mì = 3. */
export function tongSoMon(gio: GioHang): number {
  return gio.dong.reduce((tong, d) => tong + d.soLuong, 0);
}

/* ==========================================================================
   GHÉP VỚI MENU ĐỂ HIỂN THỊ
   ========================================================================== */

/**
 * Ghép giỏ hàng với menu hiện tại để lấy ra tên và giá.
 *
 * Bỏ qua dòng khi:
 *   - Món không còn trong menu (chủ quán đã xoá)
 *   - Lựa chọn không còn hợp lệ (chủ quán xoá topping, hoặc đổi luật)
 * Hiện một dòng với giá tính sai còn tệ hơn là không hiện.
 */
export function ghepVoiMenu(
  gio: GioHang,
  menu: MenuItem[],
  nhomTheoMon: Record<string, OptionGroup[]> = {},
): DongHienThi[] {
  const tra = new Map(menu.map((m) => [m.id, m]));

  return gio.dong.flatMap((d) => {
    const mon = tra.get(d.id);
    if (!mon) return [];

    const cacNhom = nhomTheoMon[mon.id] ?? [];
    const luaChon = chuanHoa(d.luaChon);

    if (kiemTraCauHinh(cacNhom, luaChon).length > 0) return [];

    const donGia = giaCauHinh(mon.price, cacNhom, luaChon);
    return [
      {
        khoa: khoaCuaDong(d),
        mon,
        soLuong: d.soLuong,
        luaChon,
        moTa: moTaCauHinh(cacNhom, luaChon),
        donGia,
        thanhTien: donGia * d.soLuong,
      },
    ];
  });
}

export function tongTien(dong: DongHienThi[]): number {
  return dong.reduce((tong, d) => tong + d.thanhTien, 0);
}

/**
 * Lọc ra những mã món trong giỏ mà menu hiện tại không còn.
 * Dùng để dọn giỏ hàng cho sạch sau khi tải menu mới.
 */
export function timMonDaBienMat(gio: GioHang, menu: MenuItem[]): string[] {
  const coTrongMenu = new Set(menu.map((m) => m.id));
  return gio.dong.filter((d) => !coTrongMenu.has(d.id)).map((d) => d.id);
}

/* ==========================================================================
   ĐỌC / GHI localStorage

   MỌI truy cập localStorage đi qua lib/bo-nho.ts, nơi đã bọc try/catch
   (yêu cầu F3). Safari chế độ Duyệt riêng tư ném lỗi ngay khi mới đọc
   localStorage — không bắt lỗi thì cả trang trắng xoá.
   ========================================================================== */

function laLuaChonHopLe(x: unknown): boolean {
  if (x === undefined) return true;
  if (typeof x !== "object" || x === null || Array.isArray(x)) return false;
  return Object.values(x as Record<string, unknown>).every(
    (v) => typeof v === "number" && Number.isInteger(v) && v > 0,
  );
}

/**
 * Kiểm tra dữ liệu đọc từ localStorage có đúng hình dạng không.
 *
 * Không tin dữ liệu này: người dùng sửa tay được, hoặc nó là rác còn sót từ
 * phiên bản cũ. Sai hình dạng thì coi như không có giỏ hàng, còn hơn để
 * dữ liệu hỏng chui vào rồi làm sập trang lúc hiển thị.
 */
function hopLe(x: unknown): x is GioHang {
  if (typeof x !== "object" || x === null) return false;
  const g = x as Record<string, unknown>;

  if (typeof g.hetHanLuc !== "number" || !Number.isFinite(g.hetHanLuc)) {
    return false;
  }
  if (!Array.isArray(g.dong)) return false;

  return g.dong.every((d) => {
    if (typeof d !== "object" || d === null) return false;
    const dg = d as Record<string, unknown>;
    return (
      typeof dg.id === "string" &&
      dg.id.length > 0 &&
      typeof dg.soLuong === "number" &&
      Number.isInteger(dg.soLuong) &&
      dg.soLuong > 0 &&
      laLuaChonHopLe(dg.luaChon)
    );
  });
}

/**
 * Đọc giỏ hàng đã lưu.
 *
 * Trả về null trong mọi trường hợp không dùng được: chưa từng lưu, dữ liệu
 * hỏng, đã hết hạn, hoặc trình duyệt chặn localStorage. Hết hạn thì xoá luôn
 * cho sạch bộ nhớ máy khách.
 */
export function docTuBoNho(
  bayGio: number,
  kho: KhoLuu | null = khoMacDinh(),
): GioHang | null {
  const tho = docChuoi(KHOA_BO_NHO, kho);
  if (!tho) return null;

  let gio: unknown;
  try {
    gio = JSON.parse(tho);
  } catch {
    // Chuỗi hỏng, không phải JSON. Dọn đi cho sạch.
    xoaBoNho(kho);
    return null;
  }

  if (!hopLe(gio) || !conHan(gio, bayGio)) {
    xoaBoNho(kho);
    return null;
  }

  return gio;
}

export function ghiVaoBoNho(
  gio: GioHang,
  kho: KhoLuu | null = khoMacDinh(),
): void {
  ghiChuoi(KHOA_BO_NHO, JSON.stringify(gio), kho);
}

export function xoaBoNho(kho: KhoLuu | null = khoMacDinh()): void {
  xoaKhoa(KHOA_BO_NHO, kho);
}
