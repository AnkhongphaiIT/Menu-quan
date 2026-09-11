import type { MetadataRoute } from "next";
import { DIA_CHI_WEB } from "@/lib/seo";

/** Web chỉ có một trang cho khách, nên sitemap chỉ có một dòng. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${DIA_CHI_WEB}/`,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
