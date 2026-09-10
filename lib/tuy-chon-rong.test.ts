import { describe, expect, it } from "vitest";
import { boNhomRong } from "./queries";
import { giaCauHinh, giaThapNhat, kiemTraCauHinh } from "./tuy-chon";
import type { OptionGroup } from "./types";

/*
 * Tình huống thật (10/09/2026): chủ quán gõ "rau muống" vào ô TÊN NHÓM thay vì
 * thêm làm lựa chọn, tạo ra một nhóm không có lựa chọn nào trên món Lẩu Thái.
 * Nhóm rỗng không được làm hỏng món.
 */

const SOI: OptionGroup = {
  id: "g-soi", menu_item_id: "lau", name: "Loại sợi", kind: "mot",
  min_qty: 1, included_qty: 0, extra_unit_price: 0, max_qty_per_choice: 1, sort_order: 1,
  choices: [
    { id: "bun", group_id: "g-soi", name: "Bún", description: null, price_delta: 0, requires_choice_id: null, is_available: true, sort_order: 1 },
    { id: "mi", group_id: "g-soi", name: "Mì", description: null, price_delta: 5000, requires_choice_id: null, is_available: true, sort_order: 2 },
  ],
};

const NHOM_RONG: OptionGroup = {
  id: "g-rau", menu_item_id: "lau", name: "rau muống", kind: "nhieu",
  min_qty: 1, included_qty: 0, extra_unit_price: 0, max_qty_per_choice: 1, sort_order: 2,
  choices: [],
};

describe("Nhóm tuỳ chọn chưa có lựa chọn nào", () => {
  it("không chặn khách thêm món vào giỏ, kể cả khi nhóm bị đặt bắt buộc", () => {
    expect(kiemTraCauHinh([SOI, NHOM_RONG], { bun: 1 })).toEqual([]);
  });

  it("không làm sai giá", () => {
    expect(giaCauHinh(25000, [SOI, NHOM_RONG], { mi: 1 })).toBe(30000);
    expect(giaThapNhat(25000, [SOI, NHOM_RONG])).toBe(25000);
  });

  it("trang khách không thấy nhóm rỗng", () => {
    expect(boNhomRong({ lau: [SOI, NHOM_RONG] })).toEqual({ lau: [SOI] });
  });

  it("món chỉ còn nhóm rỗng thì coi như món thường, bấm + là thêm thẳng", () => {
    expect(boNhomRong({ lau: [NHOM_RONG] })).toEqual({});
  });
});
