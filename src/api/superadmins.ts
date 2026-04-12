import { apiFetch } from "@/lib/api";

const S = "/superadmins";

export type ApiSuperAdminSession = {
  id?: string;
  _id?: string;
  fullName?: string;
  email?: string;
};

export async function superAdminLogin(body: { email: string; password: string }) {
  return apiFetch<{ superAdmin: ApiSuperAdminSession }>(`${S}/login`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Session restore without GET /home — 200 means super-admin cookies are valid. */
export async function superAdminSessionProbe() {
  return apiFetch<{ pendingAdmins: unknown[] }>(`${S}/pending-admins`, { method: "GET" });
}

export async function superAdminLogout() {
  return apiFetch<{ message: string }>(`${S}/logout`, { method: "GET" });
}

/** Registration step 1 — blocked in production on backend (403). */
export async function sendSuperAdminSignupOtp(body: { email: string }) {
  return apiFetch<{ message: string }>(`${S}/send-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Registration step 2 — creates super admin and sets session cookies (201). */
export async function verifySuperAdminSignup(body: {
  fullName: string;
  email: string;
  password: string;
  otp: string;
}) {
  return apiFetch<{ superAdmin: ApiSuperAdminSession; message?: string }>(`${S}/verify-otp`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function superAdminForgotPassword(body: { email: string }) {
  return apiFetch<{ message: string }>(`${S}/forgot-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function superAdminResetPassword(body: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiFetch<{ message: string }>(`${S}/reset-password`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getSuperAdminProducts() {
  return apiFetch<{ products: Record<string, unknown>[] }>(`${S}/products`, { method: "GET" });
}

export async function getSuperAdminVenues() {
  return apiFetch<{ venues: Record<string, unknown>[] }>(`${S}/venues`, { method: "GET" });
}

export async function getSuperAdminPendingAdmins() {
  return apiFetch<{ pendingAdmins: Record<string, unknown>[] }>(`${S}/pending-admins`, {
    method: "GET",
  });
}

export async function getSuperAdminAdminsList() {
  return apiFetch<{ admins: Record<string, unknown>[] }>(`${S}/admins`, { method: "GET" });
}

export async function approveSuperAdminVendor(adminId: string) {
  return apiFetch<{ message: string; admin: unknown }>(
    `${S}/approve-admin/${encodeURIComponent(adminId)}`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export async function rejectSuperAdminVendor(adminId: string) {
  return apiFetch<{ message: string }>(
    `${S}/reject-admin/${encodeURIComponent(adminId)}`,
    { method: "POST", body: JSON.stringify({}) }
  );
}
