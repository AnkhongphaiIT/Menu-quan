/**
 * NÉN ẢNH NGAY TRONG TRÌNH DUYỆT trước khi tải lên.
 *
 * Vì sao bắt buộc (yêu cầu F5): ảnh chụp bằng iPhone nặng 3–5MB. Menu 54 món
 * mà mỗi ảnh 4MB thì khách quét QR phải tải hơn 200MB — trên 4G là hàng phút,
 * và tốn tiền dữ liệu của khách. Nén xuống dưới 300KB thì cả menu chỉ còn
 * khoảng 15MB, mà ảnh vẫn nét trên màn hình điện thoại.
 *
 * Nén ở TRÌNH DUYỆT chứ không phải máy chủ: ảnh gốc không bao giờ rời khỏi
 * điện thoại, nên chủ quán không phải chờ tải lên 4MB rồi mới biết kết quả.
 *
 * Chuyển sang WebP: cùng độ nét, WebP nhẹ hơn JPEG khoảng 25–35%.
 */

/** Giới hạn theo yêu cầu F5. */
export const KICH_THUOC_TOI_DA = 300 * 1024;

/** Ảnh món hiển thị nhỏ, 1200px là quá đủ kể cả màn hình nét gấp ba. */
const CANH_DAI_TOI_DA = 1200;

export type KetQuaNen = {
  file: File;
  kichThuocGoc: number;
  kichThuocSauNen: number;
};

/**
 * Nén một ảnh xuống dưới 300KB, định dạng WebP.
 *
 * Cách làm: thu nhỏ kích thước trước, rồi hạ dần chất lượng cho tới khi đạt.
 * Thu nhỏ trước vì giảm số điểm ảnh hiệu quả hơn nhiều so với hạ chất lượng,
 * và ít làm ảnh trông bị nhoè hơn.
 */
export async function nenAnh(goc: File): Promise<KetQuaNen> {
  if (!goc.type.startsWith("image/")) {
    throw new Error("Tệp này không phải ảnh. Chọn ảnh chụp món nhé.");
  }

  const anh = await doAnh(goc);

  try {
    const tiLe = Math.min(
      1,
      CANH_DAI_TOI_DA / Math.max(anh.width, anh.height),
    );
    const rong = Math.round(anh.width * tiLe);
    const cao = Math.round(anh.height * tiLe);

    const khung = document.createElement("canvas");
    khung.width = rong;
    khung.height = cao;

    const but = khung.getContext("2d");
    if (!but) throw new Error("Trình duyệt này không nén được ảnh.");

    /* Nền trắng: ảnh PNG có phần trong suốt mà chuyển sang WebP không nền
       sẽ ra mảng đen trên thẻ món. */
    but.fillStyle = "#ffffff";
    but.fillRect(0, 0, rong, cao);
    but.drawImage(anh, 0, 0, rong, cao);

    /* Hạ dần chất lượng. Dưới 0.5 thì ảnh món bắt đầu trông rõ là bị nén,
       nên dừng ở đó và chấp nhận file to hơn một chút. */
    for (const chatLuong of [0.82, 0.7, 0.6, 0.5]) {
      const khoi = await xuatWebp(khung, chatLuong);
      if (khoi.size <= KICH_THUOC_TOI_DA || chatLuong === 0.5) {
        return {
          file: new File([khoi], doiDuoiThanhWebp(goc.name), {
            type: "image/webp",
          }),
          kichThuocGoc: goc.size,
          kichThuocSauNen: khoi.size,
        };
      }
    }

    throw new Error("Không nén được ảnh này.");
  } finally {
    /* Giải phóng bộ nhớ ảnh. Bỏ qua bước này thì chọn liên tiếp nhiều ảnh
       lớn có thể làm trình duyệt trên điện thoại hết bộ nhớ và tự tải lại. */
    anh.close?.();
  }
}

async function doAnh(tep: File): Promise<ImageBitmap> {
  try {
    /* imageOrientation: "from-image" để ảnh chụp dọc bằng điện thoại không bị
       xoay ngang. Điện thoại lưu ảnh kèm thẻ hướng xoay thay vì xoay thật. */
    return await createImageBitmap(tep, { imageOrientation: "from-image" });
  } catch {
    throw new Error(
      "Không đọc được ảnh này. Thử chọn ảnh khác, hoặc chụp lại bằng máy ảnh.",
    );
  }
}

function xuatWebp(khung: HTMLCanvasElement, chatLuong: number): Promise<Blob> {
  return new Promise((tra, loi) => {
    khung.toBlob(
      (khoi) =>
        khoi ? tra(khoi) : loi(new Error("Trình duyệt không xuất được ảnh.")),
      "image/webp",
      chatLuong,
    );
  });
}

function doiDuoiThanhWebp(ten: string): string {
  return `${ten.replace(/\.[^.]+$/, "")}.webp`;
}

/** Đổi số byte thành chuỗi dễ đọc: 3145728 -> "3,0 MB" */
export function doDungLuong(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}
