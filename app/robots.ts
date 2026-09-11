import type { MetadataRoute } from "next";
import { DIA_CHI_WEB } from "@/lib/seo";

/**
 * Cho mọi máy tìm kiếm vào đọc, và chỉ chỗ sitemap.
 *
 * Cố ý KHÔNG ghi "Disallow: /admin" ở đây: robots.txt ai cũng đọc được, ghi
 * vào chẳng khác gì dán biển chỉ đường tới trang quản trị. Trang admin đã tự
 * gắn noindex (app/admin/layout.tsx) và không có link nào trỏ tới nó.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${DIA_CHI_WEB}/sitemap.xml`,
    host: DIA_CHI_WEB,
  };
}
