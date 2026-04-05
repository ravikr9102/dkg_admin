import type { ApiBlogDoc, ApiProductDoc } from "@/api/admins";
import type { Blog, Product } from "@/types";

function popName(v: unknown): string | undefined {
  if (v && typeof v === "object" && "name" in v) {
    return String((v as { name: string }).name);
  }
  return undefined;
}

export function apiProductToProduct(p: ApiProductDoc): Product {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.name.toLowerCase().replace(/\s+/g, "-"),
    description: String(p.description ?? ""),
    price: Number(p.price),
    sku: "—",
    stock: 0,
    categoryId: "",
    categoryName: popName(p.mainCategory),
    subCategoryId: "",
    subCategoryName: popName(p.subCategory),
    thirdSubCategoryId: "",
    thirdSubCategoryName: popName(p.thirdCategory),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    status: "active",
    featured: Boolean(p.isFeatured),
    createdAt: String((p as { createdAt?: string }).createdAt ?? ""),
    updatedAt: String((p as { updatedAt?: string }).updatedAt ?? ""),
  };
}

export function apiBlogToBlog(b: ApiBlogDoc): Blog {
  const authorName =
    b.author && typeof b.author === "object"
      ? b.author.fullName ?? b.author.email ?? "—"
      : "—";
  return {
    id: String(b._id),
    title: b.title,
    slug: b.title.toLowerCase().replace(/\s+/g, "-"),
    content: b.content,
    excerpt: b.content.slice(0, 120) + (b.content.length > 120 ? "…" : ""),
    author: authorName,
    status: b.published ? "published" : "draft",
    tags: b.tags ?? [],
    createdAt: String(b.createdAt ?? ""),
    updatedAt: String(b.updatedAt ?? ""),
  };
}
