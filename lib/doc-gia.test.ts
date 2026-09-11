import { describe, expect, it } from "vitest";
import { docGia } from "./doc-gia";

describe("docGia — đọc số tiền gõ vào ô giá", () => {
  it("gõ tắt theo nghìn", () => {
    expect(docGia("25")).toBe(25000);
    expect(docGia("5")).toBe(5000);
    expect(docGia("999")).toBe(999000);
  });

  it("gõ đủ số", () => {
    expect(docGia("25000")).toBe(25000);
    expect(docGia("1000")).toBe(1000);
    expect(docGia("150000")).toBe(150000);
  });

  it("bỏ qua dấu chấm, chữ đ, khoảng trắng", () => {
    expect(docGia("25.000đ")).toBe(25000);
    expect(docGia("25 000")).toBe(25000);
    expect(docGia(" 30.000 ")).toBe(30000);
  });

  it("ô trống không phải là giá 0đ", () => {
    expect(docGia("")).toBeNull();
    expect(docGia("   ")).toBeNull();
    expect(docGia("đ")).toBeNull();
  });

  it("vẫn cho đặt giá 0đ khi gõ số 0 thật", () => {
    expect(docGia("0")).toBe(0);
  });

  it("số quá lớn thì không nhận", () => {
    expect(docGia("99999999999999999999")).toBeNull();
  });
});
