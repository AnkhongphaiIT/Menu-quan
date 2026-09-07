import { describe, expect, it } from "vitest";
import type { MenuItem } from "./types";
import {
  HAN_GIO_HANG_MS,
  KHOA_BO_NHO,
  type KhoLuu,
  bot,
  conHan,
  docTuBoNho,
  ghepVoiMenu,
  ghiVaoBoNho,
  giaHan,
  gioRong,
  them,
  timMonDaBienMat,
  tongSoMon,
  tongTien,
  xoa,
} from "./cart";

/* ==========================================================================
   DỤNG CỤ THỬ NGHIỆM
   ========================================================================== */

/** Mốc thời gian giả, cố định. Nhờ vậy test không phụ thuộc lúc chạy. */
const T0 = 1_700_000_000_000;
const PHUT = 60 * 1000;

/** localStorage giả, chạy trong bộ nhớ. */
function khoGia(banDau: Record<string, string> = {}): KhoLuu & {
  duLieu: Record<string, string>;
} {
  const duLieu = { ...banDau };
  return {
    duLieu,
    getItem: (k) => (k in duLieu ? duLieu[k] : null),
    setItem: (k, v) => {
      duLieu[k] = v;
    },
    removeItem: (k) => {
      delete duLieu[k];
    },
  };
}

/** localStorage luôn ném lỗi — mô phỏng Safari ở chế độ Duyệt riêng tư. */
function khoNemLoi(): KhoLuu {
  const noiLoi = () => {
    throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
  };
  return { getItem: noiLoi, setItem: noiLoi, removeItem: noiLoi };
}

function monGia(id: string, ten: string, gia: number): MenuItem {
  return {
    id,
    category_id: "cat-1",
    name: ten,
    description: null,
    price: gia,
    image_url: null,
    is_available: true,
    sort_order: 1,
  };
}

const MENU: MenuItem[] = [
  monGia("m1", "Nui chiên trứng", 25000),
  monGia("m2", "Trà sữa truyền thống", 20000),
  monGia("m3", "Bánh tráng trộn", 15000),
];

/* ==========================================================================
   HẾT HẠN VÀ GIA HẠN  — phần quan trọng nhất, yêu cầu F3
   ========================================================================== */

describe("Hết hạn giỏ hàng", () => {
  it("giỏ mới tạo có hạn đúng 60 phút kể từ bây giờ", () => {
    const gio = gioRong(T0);
    expect(gio.hetHanLuc).toBe(T0 + HAN_GIO_HANG_MS);
    expect(HAN_GIO_HANG_MS).toBe(60 * PHUT);
  });

  it("còn hạn khi chưa tới mốc, hết hạn khi đã qua mốc", () => {
    const gio = gioRong(T0);

    expect(conHan(gio, T0)).toBe(true);
    expect(conHan(gio, T0 + 59 * PHUT)).toBe(true);
    // Đúng ngay giây hết hạn thì coi là đã hết
    expect(conHan(gio, T0 + 60 * PHUT)).toBe(false);
    expect(conHan(gio, T0 + 61 * PHUT)).toBe(false);
  });

  it("giỏ để quá 30 phút — mức chủ quán yêu cầu — vẫn còn nguyên", () => {
    const gio = them(gioRong(T0), "m1", T0);
    expect(conHan(gio, T0 + 30 * PHUT)).toBe(true);
    expect(tongSoMon(gio)).toBe(1);
  });
});

describe("Gia hạn sau mỗi thao tác", () => {
  it("giaHan đẩy mốc hết hạn ra 60 phút kể từ lúc gọi", () => {
    const gio = gioRong(T0);
    const sau = giaHan(gio, T0 + 45 * PHUT);
    expect(sau.hetHanLuc).toBe(T0 + 45 * PHUT + HAN_GIO_HANG_MS);
  });

  it("thêm / bớt / xoá đều tự gia hạn", () => {
    const luc45 = T0 + 45 * PHUT;
    const goc = gioRong(T0);

    expect(them(goc, "m1", luc45).hetHanLuc).toBe(luc45 + HAN_GIO_HANG_MS);

    const coMon = them(goc, "m1", T0, 2);
    expect(bot(coMon, "m1", luc45).hetHanLuc).toBe(luc45 + HAN_GIO_HANG_MS);
    expect(xoa(coMon, "m1", luc45).hetHanLuc).toBe(luc45 + HAN_GIO_HANG_MS);
  });

  it("khách ngồi ăn 3 tiếng, cứ 50 phút bấm một lần thì giỏ không bao giờ mất", () => {
    let gio = them(gioRong(T0), "m1", T0);
    let luc = T0;

    // 3 tiếng, mỗi 50 phút thêm một món
    for (let i = 0; i < 4; i++) {
      luc += 50 * PHUT;
      expect(conHan(gio, luc)).toBe(true); // vẫn còn hạn tại thời điểm bấm
      gio = them(gio, "m2", luc);
    }

    expect(conHan(gio, luc)).toBe(true);
    expect(tongSoMon(gio)).toBe(5);
  });

  it("nhưng ngừng bấm quá 60 phút thì hết hạn", () => {
    const gio = them(gioRong(T0), "m1", T0);
    expect(conHan(gio, T0 + 61 * PHUT)).toBe(false);
  });
});

/* ==========================================================================
   CÁC THAO TÁC CƠ BẢN
   ========================================================================== */

describe("Thêm, bớt, xoá", () => {
  it("thêm cùng một món hai lần thì cộng dồn số lượng, không tạo dòng mới", () => {
    let gio = them(gioRong(T0), "m1", T0);
    gio = them(gio, "m1", T0);

    expect(gio.dong).toHaveLength(1);
    expect(gio.dong[0].soLuong).toBe(2);
  });

  it("bớt về 0 thì dòng biến mất khỏi giỏ", () => {
    let gio = them(gioRong(T0), "m1", T0);
    gio = bot(gio, "m1", T0);

    expect(gio.dong).toHaveLength(0);
    expect(tongSoMon(gio)).toBe(0);
  });

  it("không sửa giỏ cũ tại chỗ — luôn trả ra giỏ mới", () => {
    const goc = them(gioRong(T0), "m1", T0);
    const sau = them(goc, "m2", T0);

    expect(goc.dong).toHaveLength(1);
    expect(sau.dong).toHaveLength(2);
  });

  it("tongSoMon cộng cả số lượng, không chỉ đếm số dòng", () => {
    let gio = them(gioRong(T0), "m1", T0, 2);
    gio = them(gio, "m2", T0, 3);

    expect(gio.dong).toHaveLength(2);
    expect(tongSoMon(gio)).toBe(5);
  });
});

/* ==========================================================================
   TÍNH TIỀN
   ========================================================================== */

describe("Ghép với menu và tính tiền", () => {
  it("tính đúng thành tiền và tổng cộng", () => {
    let gio = them(gioRong(T0), "m1", T0, 2); // 25.000 x 2 = 50.000
    gio = them(gio, "m3", T0, 3); //             15.000 x 3 = 45.000

    const dong = ghepVoiMenu(gio, MENU);
    expect(dong.map((d) => d.thanhTien)).toEqual([50000, 45000]);
    expect(tongTien(dong)).toBe(95000);
  });

  it("bỏ qua món đã bị xoá khỏi menu, không làm hỏng phần tính tiền", () => {
    let gio = them(gioRong(T0), "m1", T0);
    gio = them(gio, "mon-khong-ton-tai", T0, 5);

    const dong = ghepVoiMenu(gio, MENU);
    expect(dong).toHaveLength(1);
    expect(tongTien(dong)).toBe(25000);
    expect(timMonDaBienMat(gio, MENU)).toEqual(["mon-khong-ton-tai"]);
  });

  it("giỏ trống thì tổng tiền bằng 0", () => {
    expect(tongTien(ghepVoiMenu(gioRong(T0), MENU))).toBe(0);
  });
});

/* ==========================================================================
   LƯU VÀO BỘ NHỚ TRÌNH DUYỆT
   ========================================================================== */

describe("Lưu và khôi phục giỏ hàng", () => {
  it("ghi rồi đọc lại ra đúng giỏ cũ", () => {
    const kho = khoGia();
    const gio = them(gioRong(T0), "m1", T0, 2);

    ghiVaoBoNho(gio, kho);
    expect(docTuBoNho(T0 + 10 * PHUT, kho)).toEqual(gio);
  });

  it("giỏ đã hết hạn thì trả về null VÀ xoá khỏi bộ nhớ máy khách", () => {
    const kho = khoGia();
    ghiVaoBoNho(them(gioRong(T0), "m1", T0), kho);

    expect(docTuBoNho(T0 + 61 * PHUT, kho)).toBeNull();
    expect(kho.duLieu[KHOA_BO_NHO]).toBeUndefined();
  });

  it("chưa từng lưu gì thì trả về null", () => {
    expect(docTuBoNho(T0, khoGia())).toBeNull();
  });

  it("dữ liệu hỏng (không phải JSON) thì trả về null, không ném lỗi", () => {
    const kho = khoGia({ [KHOA_BO_NHO]: "{{{ khong phai json" });
    expect(() => docTuBoNho(T0, kho)).not.toThrow();
    expect(docTuBoNho(T0, kho)).toBeNull();
  });

  it("dữ liệu sai hình dạng thì bị bỏ qua và dọn sạch", () => {
    const cacKieuSai = [
      '{"dong":"day khong phai mang","hetHanLuc":9999999999999}',
      '{"dong":[],"hetHanLuc":"khong phai so"}',
      '{"dong":[{"id":"m1"}],"hetHanLuc":9999999999999}', // thiếu soLuong
      '{"dong":[{"id":"m1","soLuong":-3}],"hetHanLuc":9999999999999}', // số âm
      '{"dong":[{"id":"","soLuong":1}],"hetHanLuc":9999999999999}', // id rỗng
      "null",
      "[]",
    ];

    for (const sai of cacKieuSai) {
      const kho = khoGia({ [KHOA_BO_NHO]: sai });
      expect(docTuBoNho(T0, kho), `phải bỏ qua: ${sai}`).toBeNull();
      expect(kho.duLieu[KHOA_BO_NHO], `phải dọn sạch: ${sai}`).toBeUndefined();
    }
  });
});

describe("Trình duyệt chặn localStorage (Safari chế độ riêng tư)", () => {
  it("đọc không ném lỗi, chỉ trả về null", () => {
    expect(() => docTuBoNho(T0, khoNemLoi())).not.toThrow();
    expect(docTuBoNho(T0, khoNemLoi())).toBeNull();
  });

  it("ghi không ném lỗi — khách vẫn dùng được giỏ hàng trong phiên này", () => {
    expect(() =>
      ghiVaoBoNho(them(gioRong(T0), "m1", T0), khoNemLoi()),
    ).not.toThrow();
  });

  it("không có localStorage (kho = null) thì mọi hàm vẫn chạy êm", () => {
    expect(() => ghiVaoBoNho(gioRong(T0), null)).not.toThrow();
    expect(docTuBoNho(T0, null)).toBeNull();
  });
});
