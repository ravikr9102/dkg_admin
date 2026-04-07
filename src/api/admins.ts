import { apiFetch } from "@/lib/api";

const A = "/admins";

export type ApiAdminSession = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
};

export async function adminLogin(body: { email: string; password: string }) {
  return apiFetch<{ admin: { id?: string; fullName: string; email: string } }>(
    `${A}/login`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export async function adminHome() {
  return apiFetch<{ admin: ApiAdminSession }>(`${A}/home`, { method: "GET" });
}

export async function adminLogout() {
  return apiFetch<{ message: string }>(`${A}/logout`, { method: "GET" });
}

/** Registration step 1 — requires EMAIL_USER/EMAIL_PASS on backend to send real OTP. */
export async function sendAdminSignupOtp(body: { email: string }) {
  return apiFetch<{ message: string }>(`${A}/send-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Registration step 2 — creates admin; super admin must approve before /admins/login works. */
export async function verifyAdminSignup(body: {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}) {
  return apiFetch<{ message: string }>(`${A}/verify-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type ApiCategoryMain = {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  subCategories?: ApiCategorySub[];
};

export type ApiCategorySub = {
  _id: string;
  name: string;
  description?: string;
  mainCategory?: string;
  createdAt?: string;
  updatedAt?: string;
  thirdCategories?: ApiCategoryThird[];
};

export type ApiCategoryThird = {
  _id: string;
  name: string;
  description?: string;
  subCategory?: string;
  createdAt?: string;
  updatedAt?: string;
};

/** Nested additional categories under a third category (from GET /admins/category-tree). */
export type ApiAdditionalCategoryNode = {
  _id: string;
  name: string;
  description?: string;
  parentCategory?: string;
  parentModel?: "ThirdCategory" | "AdditionalCategory";
  level?: number;
  createdAt?: string;
  updatedAt?: string;
  children?: ApiAdditionalCategoryNode[];
};

export type ApiCategoryTreeThird = ApiCategoryThird & {
  additionalCategories?: ApiAdditionalCategoryNode[];
};

export type ApiCategoryTreeSub = ApiCategorySub & {
  thirdCategories?: ApiCategoryTreeThird[];
};

export type ApiCategoryTreeMain = ApiCategoryMain & {
  subCategories?: ApiCategoryTreeSub[];
};

export async function getCategories() {
  return apiFetch<{ categories: ApiCategoryMain[] }>(`${A}/categories`, {
    method: "GET",
  });
}

export async function addMainCategory(body: { name: string }) {
  return apiFetch<{ category: ApiCategoryMain }>(`${A}/addcategory`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function addSubCategory(body: {
  name: string;
  mainCategory: string;
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("mainCategory", body.mainCategory);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ subCategory: ApiCategorySub }>(`${A}/addsubcategory`, {
    method: "POST",
    body: fd,
  });
}

export async function addThirdCategory(body: {
  name: string;
  subCategory: string;
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("subCategory", body.subCategory);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ thirdCategory: ApiCategoryThird }>(`${A}/addthirdcategory`, {
    method: "POST",
    body: fd,
  });
}

/** Full tree including nested additional categories (GET /admins/category-tree). */
export async function getCategoryTree() {
  return apiFetch<{ categoryTree: ApiCategoryTreeMain[] }>(`${A}/category-tree`, {
    method: "GET",
  });
}

/** POST /admins/create-additional-category — parentName is third or additional category name. */
export async function createAdditionalCategory(body: {
  name: string;
  parentName: string;
  parentModel: "ThirdCategory" | "AdditionalCategory";
  bannerImage?: File | null;
}) {
  const fd = new FormData();
  fd.append("name", body.name);
  fd.append("parentName", body.parentName);
  fd.append("parentModel", body.parentModel);
  if (body.bannerImage) fd.append("bannerImage", body.bannerImage);
  return apiFetch<{ success: boolean; message?: string }>(
    `${A}/create-additional-category`,
    {
      method: "POST",
      body: fd,
    }
  );
}

export type ApiProductDoc = Record<string, unknown> & {
  _id: string;
  name: string;
  description?: string;
  price: number;
  discountedPrice?: number | null;
  images?: string[];
  isFeatured?: boolean;
  tier?: string;
  mainCategory?: unknown;
  subCategory?: unknown;
  thirdCategory?: unknown;
};

export async function getAdminProducts() {
  return apiFetch<{ products: ApiProductDoc[] }>(`${A}/products`, {
    method: "GET",
  });
}

export type AddProductBody = {
  name: string;
  description: string;
  price: number;
  discountedPrice?: number;
  mainCategory: string;
  subCategory: string;
  thirdCategory: string;
  images?: string[];
  /** Sent as `tags` in JSON; backend also accepts legacy `keywords`. */
  tags?: string[];
  keywords?: string[];
  isFeatured?: boolean;
  tier?: string;
  additionalCategories?: string[];
  customizationSections?: string[];
  serviceableAreas?: { city: string; districts?: string[] }[];
  inclusions?: string[];
  experiences?: string[];
  keyHighlights?: string[];
  location?: string;
  setupDuration?: string;
  teamSize?: string;
  advanceBooking?: string;
  cancellationPolicy?: string;
  youtubeVideoLink?: string;
  addons?: { name: string; isDefault?: boolean }[];
};

export async function addProduct(body: AddProductBody) {
  return apiFetch<{ product: ApiProductDoc }>(`${A}/addproducts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function toggleProductFeatured(productId: string, isFeatured: boolean) {
  return apiFetch<{ product: ApiProductDoc }>(
    `${A}/toggle-featured/${productId}`,
    { method: "PUT", body: JSON.stringify({ isFeatured }) }
  );
}

export async function toggleProductTier(productId: string, tier: "standard" | "premium") {
  return apiFetch<{ product: ApiProductDoc }>(`${A}/toggle-tier/${productId}`, {
    method: "PUT",
    body: JSON.stringify({ tier }),
  });
}

export type ApiBlogDoc = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  tags?: string[];
  published?: boolean;
  author?: { fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};

export async function getAdminBlogs() {
  return apiFetch<{ blogs: ApiBlogDoc[] }>(`${A}/blogs`, { method: "GET" });
}

export type CreateBlogBody = {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags?: string[];
  published?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage: File;
};

export async function createBlog(body: CreateBlogBody) {
  const fd = new FormData();
  fd.append("title", body.title);
  fd.append("content", body.content);
  fd.append("excerpt", body.excerpt);
  fd.append("category", body.category);
  fd.append("tags", JSON.stringify(body.tags ?? []));
  fd.append("published", body.published ? "true" : "false");
  if (body.metaTitle) fd.append("metaTitle", body.metaTitle);
  if (body.metaDescription) fd.append("metaDescription", body.metaDescription);
  fd.append("featuredImage", body.featuredImage);
  return apiFetch<{ blog: ApiBlogDoc; message?: string }>(`${A}/create-blog`, {
    method: "POST",
    body: fd,
  });
}

export type UpdateBlogBody = Partial<{
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  published: boolean;
  metaTitle: string;
  metaDescription: string;
  featuredImage: File;
}>;

export async function updateBlog(blogId: string, body: UpdateBlogBody) {
  const fd = new FormData();
  if (body.title != null) fd.append("title", body.title);
  if (body.content != null) fd.append("content", body.content);
  if (body.excerpt != null) fd.append("excerpt", body.excerpt);
  if (body.category != null) fd.append("category", body.category);
  if (body.tags != null) fd.append("tags", JSON.stringify(body.tags));
  if (body.published != null) fd.append("published", body.published ? "true" : "false");
  if (body.metaTitle != null) fd.append("metaTitle", body.metaTitle);
  if (body.metaDescription != null) fd.append("metaDescription", body.metaDescription);
  if (body.featuredImage instanceof File) fd.append("featuredImage", body.featuredImage);
  return apiFetch<{ blog: ApiBlogDoc; message?: string }>(`${A}/edit-blog/${blogId}`, {
    method: "PUT",
    body: fd,
  });
}

export async function deleteBlog(blogId: string) {
  return apiFetch<{ message: string }>(`${A}/delete-blog/${blogId}`, {
    method: "DELETE",
  });
}

export type ApiVenueDoc = {
  _id: string;
  name: string;
  description?: string;
  location?: { address?: string; lat?: number; lng?: number };
  images?: string[];
  startingPrice?: number;
  typesOfVenues?: string[];
  facilities?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminVenues() {
  return apiFetch<{ venues: ApiVenueDoc[] }>(`${A}/venues`, { method: "GET" });
}

export type CreateVenueBody = {
  name: string;
  description: string;
  startingPrice: number;
  location: { address: string; lat?: number; lng?: number };
  typesOfVenues: string[];
  facilities: string[];
  accessibilityFeatures?: string[];
  restrictions?: string[];
  otherInformation?: { inHouseDecor?: boolean; advanceBookingWeeks?: number };
  capacity?: { min?: number; max?: number };
  imageFiles: File[];
};

export async function createVenue(body: CreateVenueBody) {
  const fd = new FormData();
  fd.append("name", body.name.trim());
  fd.append("description", body.description.trim());
  fd.append("startingPrice", String(body.startingPrice));
  fd.append("location", JSON.stringify(body.location));
  fd.append("typesOfVenues", JSON.stringify(body.typesOfVenues ?? []));
  fd.append("facilities", JSON.stringify(body.facilities ?? []));
  fd.append("accessibilityFeatures", JSON.stringify(body.accessibilityFeatures ?? []));
  fd.append("restrictions", JSON.stringify(body.restrictions ?? []));
  if (body.otherInformation != null) {
    fd.append("otherInformation", JSON.stringify(body.otherInformation));
  }
  if (body.capacity != null) {
    fd.append("capacity", JSON.stringify(body.capacity));
  }
  for (const f of body.imageFiles.slice(0, 10)) {
    fd.append("images", f);
  }
  return apiFetch<{ message?: string; venue: ApiVenueDoc }>(`${A}/add-venue`, {
    method: "POST",
    body: fd,
  });
}
