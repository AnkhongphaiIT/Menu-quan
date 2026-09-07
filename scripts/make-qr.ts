/**
 * TẠO MÃ QR ĐỂ DÁN BÀN
 *
 * Chạy:
 *   npm run qr -- https://dia-chi-web-cua-ban.vercel.app
 *
 * Tạo ra 3 file trong thư mục `qr/`:
 *   menu-qr.svg   - ảnh vector, phóng to bao nhiêu cũng nét. Dùng khi in ở tiệm.
 *   menu-qr.png   - ảnh 1000x1000, dùng khi đăng Facebook/Zalo hoặc in tại nhà.
 *   menu-a6.pdf   - tờ khổ A6 (10.5 x 14.8 cm) có sẵn chữ "QUÉT ĐỂ XEM MENU",
 *                   in ra là dán bàn được ngay.
 *
 * ---------------------------------------------------------------------------
 * BA LỰA CHỌN KỸ THUẬT, GIẢI THÍCH ĐỂ SAU NÀY KHÔNG AI SỬA NHẦM:
 *
 * 1. Mức sửa lỗi H (cao nhất, chịu hỏng tới 30% diện tích mã).
 *    Mã dán bàn quán ăn sẽ bị dính dầu mỡ, nước, trầy xước, che một góc.
 *    Mức H khiến máy vẫn đọc được khi mã đã bẩn. Đổi xuống L/M cho mã nhỏ hơn
 *    là sai lầm: mã gọn hơn chút nhưng bẩn một tí là hỏng.
 *
 * 2. Chừa lề trắng 4 ô quanh mã ("quiet zone").
 *    Đây là yêu cầu bắt buộc của chuẩn QR, không phải để cho đẹp. Không có lề,
 *    camera không tách được mã ra khỏi nền và sẽ quét rất lâu hoặc không ra.
 *
 * 3. Địa chỉ web phải là địa chỉ CỐ ĐỊNH, không bao giờ đổi.
 *    In QR một lần, sau này sửa menu bao nhiêu lần cũng không phải in lại.
 */

import fs from "node:fs";
import path from "node:path";
import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

/* ==========================================================================
   THAM SỐ
   ========================================================================== */

const diaChi = process.argv[2];

if (!diaChi) {
  console.error(`
Thiếu địa chỉ web.

Cách dùng:
  npm run qr -- https://dia-chi-web-cua-ban.vercel.app

Địa chỉ này phải là địa chỉ THẬT của web sau khi đã đưa lên Vercel,
và sẽ không bao giờ đổi nữa — vì mã QR in ra rồi thì không sửa được.
`);
  process.exit(1);
}

if (!/^https?:\/\/.+/i.test(diaChi)) {
  console.error(
    `Địa chỉ "${diaChi}" không hợp lệ. Phải bắt đầu bằng http:// hoặc https://`,
  );
  process.exit(1);
}

if (diaChi.startsWith("http://")) {
  console.warn(
    `\n⚠️  Cảnh báo: địa chỉ dùng http:// chứ không phải https://\n` +
      `   Nếu đây là địa chỉ nội bộ kiểu 192.168.x.x thì KHÔNG nên in mã này —\n` +
      `   khách ngoài quán quét sẽ không vào được. Chỉ in mã của địa chỉ thật.\n`,
  );
}

const thuMucRa = path.join(process.cwd(), "qr");
fs.mkdirSync(thuMucRa, { recursive: true });

/* ==========================================================================
   PHÔNG CHỮ CHO FILE PDF

   Phông mặc định của pdf-lib (Helvetica) KHÔNG có dấu tiếng Việt — chữ
   "QUÉT ĐỂ XEM MENU" sẽ bị lỗi hoặc mất dấu. Nên phải nhúng một phông thật.
   Dùng phông có sẵn trong máy, không tải gì từ mạng.
   ========================================================================== */

const CAC_PHONG_UNG_VIEN = [
  "C:\\Windows\\Fonts\\segoeuib.ttf", // Segoe UI Bold - Windows
  "C:\\Windows\\Fonts\\arialbd.ttf", // Arial Bold   - Windows
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf", // macOS
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", // Linux
];

function timPhongChu(): string {
  const thay = CAC_PHONG_UNG_VIEN.find((p) => fs.existsSync(p));
  if (!thay) {
    throw new Error(
      "Không tìm thấy phông chữ nào có dấu tiếng Việt trên máy này.\n" +
        "Đã thử: " +
        CAC_PHONG_UNG_VIEN.join(", "),
    );
  }
  return thay;
}

/* ==========================================================================
   TẠO FILE
   ========================================================================== */

const TUY_CHON_CHUNG = {
  errorCorrectionLevel: "H" as const,
  margin: 4,
  color: { dark: "#000000", light: "#FFFFFF" },
};

async function taoSvg(): Promise<string> {
  const duongDan = path.join(thuMucRa, "menu-qr.svg");
  const svg = await QRCode.toString(diaChi, {
    ...TUY_CHON_CHUNG,
    type: "svg",
    width: 1000,
  });
  fs.writeFileSync(duongDan, svg, "utf8");
  return duongDan;
}

async function taoPng(): Promise<string> {
  const duongDan = path.join(thuMucRa, "menu-qr.png");
  await QRCode.toFile(duongDan, diaChi, {
    ...TUY_CHON_CHUNG,
    type: "png",
    width: 1000,
  });
  return duongDan;
}

async function taoPdfA6(): Promise<string> {
  const duongDan = path.join(thuMucRa, "menu-a6.pdf");

  // Khổ A6 tính bằng "điểm" của PDF: 1 điểm = 1/72 inch
  const RONG = 297.64; // 10.5 cm
  const CAO = 419.53; // 14.8 cm

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);

  const phong = await pdf.embedFont(fs.readFileSync(timPhongChu()), {
    subset: true, // chỉ nhúng những chữ cái thực sự dùng -> file nhẹ
  });

  const trang = pdf.addPage([RONG, CAO]);
  trang.drawRectangle({
    x: 0,
    y: 0,
    width: RONG,
    height: CAO,
    color: rgb(1, 1, 1),
  });

  /* --- Mã QR ở giữa --- */
  const anhQr = await pdf.embedPng(
    await QRCode.toBuffer(diaChi, { ...TUY_CHON_CHUNG, width: 1200 }),
  );

  const canhQr = RONG * 0.72;
  const qrX = (RONG - canhQr) / 2;
  const qrY = CAO * 0.3;
  trang.drawImage(anhQr, { x: qrX, y: qrY, width: canhQr, height: canhQr });

  /* --- Dòng chữ lớn phía trên mã --- */
  const chinh = "QUÉT ĐỂ XEM MENU";
  const cuChinh = 20;
  const rongChinh = phong.widthOfTextAtSize(chinh, cuChinh);
  trang.drawText(chinh, {
    x: (RONG - rongChinh) / 2,
    y: qrY + canhQr + 28,
    size: cuChinh,
    font: phong,
    color: rgb(0.1, 0.1, 0.1),
  });

  /* --- Dòng nhắc nhỏ phía dưới mã --- */
  const phu = "Đưa camera điện thoại vào mã";
  const cuPhu = 11;
  const rongPhu = phong.widthOfTextAtSize(phu, cuPhu);
  trang.drawText(phu, {
    x: (RONG - rongPhu) / 2,
    y: qrY - 26,
    size: cuPhu,
    font: phong,
    color: rgb(0.45, 0.45, 0.45),
  });

  fs.writeFileSync(duongDan, await pdf.save());
  return duongDan;
}

/* ==========================================================================
   CHẠY
   ========================================================================== */

async function chay() {
  console.log(`\nĐang tạo mã QR cho: ${diaChi}\n`);

  const cacFile = [await taoSvg(), await taoPng(), await taoPdfA6()];

  for (const f of cacFile) {
    const kb = Math.round(fs.statSync(f).size / 1024);
    console.log(`  ✓ ${path.relative(process.cwd(), f)}  (${kb} KB)`);
  }

  console.log(`
Xong. In file menu-a6.pdf ra giấy là dán bàn được ngay.

TRƯỚC KHI IN HÀNG LOẠT, in thử 1 tờ và quét bằng ít nhất 2 điện thoại
khác nhau, ở khoảng cách ngồi ăn thật (khoảng 30 cm), dưới đèn quán.
`);
}

chay().catch((loi) => {
  console.error("\nLỗi khi tạo mã QR:", loi.message);
  process.exit(1);
});
