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

export async function getCategories() {
  return apiFetch<{ categories: ApiCategoryMain[] }>(`${A}/categories`, {
    method: "GET",
  });
}

export async function addMainCategory(body: { name: string; description?: string }) {
  return apiFetch<{ category: ApiCategoryMain }>(`${A}/addcategory`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function addSubCategory(body: {
  name: string;
  description?: string;
  mainCategory: string;
}) {
  return apiFetch<{ subCategory: ApiCategorySub }>(`${A}/addsubcategory`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function addThirdCategory(body: {
  name: string;
  description?: string;
  subCategory: string;
}) {
  return apiFetch<{ thirdCategory: ApiCategoryThird }>(
    `${A}/addthirdcategory`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

export type ApiProductDoc = Record<string, unknown> & {
  _id: string;
  name: string;
  description?: string;
  price: number;
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
  content: string;
  tags?: string[];
  published?: boolean;
  author?: { fullName?: string; email?: string };
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminBlogs() {
  return apiFetch<{ blogs: ApiBlogDoc[] }>(`${A}/blogs`, { method: "GET" });
}

export async function createBlog(body: {
  title: string;
  content: string;
  tags?: string[];
  published?: boolean;
}) {
  return apiFetch<{ blog: ApiBlogDoc }>(`${A}/create-blog`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateBlog(
  blogId: string,
  body: Partial<{
    title: string;
    content: string;
    tags: string[];
    published: boolean;
  }>
) {
  return apiFetch<{ blog: ApiBlogDoc }>(`${A}/edit-blog/${blogId}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteBlog(blogId: string) {
  return apiFetch<{ message: string }>(`${A}/delete-blog/${blogId}`, {
    method: "DELETE",
  });
}
