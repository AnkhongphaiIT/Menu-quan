import { describe, expect, it } from "vitest";
import type { KhoLuu } from "./bo-nho";
import {
  CHE_DO_MAC_DINH,
  HAN_GIAO_DIEN_MS,
  KHOA_GIAO_DIEN,
  docTuBoNho,
  ghiVaoBoNho,
} from "./theme";

const T0 = 1_700_000_000_000;
const PHUT = 60 * 1000;

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
    throw new DOMException("Bi chan", "SecurityError");
  };
  return { getItem: noiLoi, setItem: noiLoi, removeItem: noiLoi };
}

describe("Mặc định là nền trắng", () => {
  it("chế độ mặc định là sáng", () => {
    expect(CHE_DO_MAC_DINH).toBe("sang");
  });

  it("chưa từng chọn gì thì trả về null để bên gọi dùng mặc định", () => {
    expect(docTuBoNho(T0, khoGia())).toBeNull();
  });
});

describe("Nhớ lựa chọn nền đen trong 60 phút", () => {
  it("hạn đúng 60 phút, bằng với giỏ hàng", () => {
    expect(HAN_GIAO_DIEN_MS).toBe(60 * PHUT);
  });

  it("chọn nền đen rồi đọc lại vẫn ra nền đen", () => {
    const kho = khoGia();
    ghiVaoBoNho("toi", T0, kho);

    expect(docTuBoNho(T0, kho)).toBe("toi");
    expect(docTuBoNho(T0 + 30 * PHUT, kho)).toBe("toi");
    expect(docTuBoNho(T0 + 59 * PHUT, kho)).toBe("toi");
  });

  it("quá 60 phút thì quên đi và dọn sạch bộ nhớ", () => {
    const kho = khoGia();
    ghiVaoBoNho("toi", T0, kho);

    expect(docTuBoNho(T0 + 61 * PHUT, kho)).toBeNull();
    expect(kho.duLieu[KHOA_GIAO_DIEN]).toBeUndefined();
  });

  it("bấm nút lần nữa thì hạn được tính lại từ lúc đó", () => {
    const kho = khoGia();
    ghiVaoBoNho("toi", T0, kho);
    ghiVaoBoNho("toi", T0 + 50 * PHUT, kho);

    // Nếu không gia hạn thì mốc 70 phút đã hết hạn rồi
    expect(docTuBoNho(T0 + 70 * PHUT, kho)).toBe("toi");
  });

  it("chọn lại nền trắng cũng được nhớ, không phải chỉ xoá đi", () => {
    const kho = khoGia();
    ghiVaoBoNho("toi", T0, kho);
    ghiVaoBoNho("sang", T0, kho);

    expect(docTuBoNho(T0, kho)).toBe("sang");
  });
});

describe("Dữ liệu hỏng hoặc trình duyệt chặn", () => {
  it("chuỗi không phải JSON thì bỏ qua và dọn sạch", () => {
    const kho = khoGia({ [KHOA_GIAO_DIEN]: "{{{ hong" });
    expect(() => docTuBoNho(T0, kho)).not.toThrow();
    expect(docTuBoNho(T0, kho)).toBeNull();
    expect(kho.duLieu[KHOA_GIAO_DIEN]).toBeUndefined();
  });

  it("sai hình dạng thì bỏ qua và dọn sạch", () => {
    const cacKieuSai = [
      '{"cheDo":"mau-hong","hetHanLuc":9999999999999}',
      '{"cheDo":"toi"}',
      '{"cheDo":"toi","hetHanLuc":"khong phai so"}',
      "null",
      "[]",
    ];

    for (const sai of cacKieuSai) {
      const kho = khoGia({ [KHOA_GIAO_DIEN]: sai });
      expect(docTuBoNho(T0, kho), `phải bỏ qua: ${sai}`).toBeNull();
      expect(kho.duLieu[KHOA_GIAO_DIEN], `phải dọn: ${sai}`).toBeUndefined();
    }
  });

  it("Safari riêng tư chặn localStorage thì không ném lỗi", () => {
    expect(() => docTuBoNho(T0, khoNemLoi())).not.toThrow();
    expect(docTuBoNho(T0, khoNemLoi())).toBeNull();
    expect(() => ghiVaoBoNho("toi", T0, khoNemLoi())).not.toThrow();
  });

  it("không có localStorage thì mọi hàm vẫn chạy êm", () => {
    expect(docTuBoNho(T0, null)).toBeNull();
    expect(() => ghiVaoBoNho("toi", T0, null)).not.toThrow();
  });
});
