const BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper to get token is no longer needed as we use cookies
// function getToken(): string | null { ... }

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // No need to manually attach Authorization header
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    credentials: "include", // Important: send cookies with request
  });

  if (!res.ok) {
    // If 401, it might mean cookie expired. 
    // In a real app, we might redirect to login here.
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──

export interface AuthResponse {
  user: { id: string; email: string; name: string; is_admin: boolean };
  // token: string; // Token is HTTP-only cookie now
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  security_question?: string;
  security_answer?: string;
}

export async function register(params: RegisterRequest) {
  const data = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
  // localStorage.setItem("token", data.token); // No longer needed
  return data;
}

export async function login(email: string, password: string) {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  // localStorage.setItem("token", data.token); // No longer needed
  return data;
}

export async function logout() {
  await request("/api/auth/logout", { method: "POST" });
  // localStorage.removeItem("token"); // No longer needed
}

export async function getMe() {
  return request<{ id: string; email: string; name: string; is_admin: boolean }>("/api/auth/me");
}

// ── Wishlists ──

export interface Wishlist {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  is_public: boolean;
  view_count: number;
  like_count: number;
  created_at: string;
  item_count?: number;
  owner_name?: string;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number | null;
  currency: string;
  tag: string | null;
  url: string | null;
  image_url: string | null;
  is_claimed: boolean;
  claimed_by: string | null;
  created_at: string;
  reservations_count?: number;
  reserver_initials?: string[];
  reservations?: Array<{ id: string; name: string; reserved_at?: string }>;
}

export interface WishlistDetail extends Wishlist {
  items: WishlistItem[];
}

export async function createWishlist(title: string, description?: string, is_public = true) {
  return request<Wishlist>("/api/wishlists", {
    method: "POST",
    body: JSON.stringify({ title, description, is_public }),
  });
}

export async function listWishlists() {
  return request<Wishlist[]>("/api/wishlists");
}

export async function getWishlist(slug: string) {
  return request<WishlistDetail>(`/api/wishlists/${slug}`);
}

export async function updateWishlist(
  id: string,
  data: { title?: string; description?: string; is_public?: boolean }
) {
  return request<Wishlist>(`/api/wishlists/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteWishlist(id: string) {
  return request(`/api/wishlists/${id}`, { method: "DELETE" });
}

export async function likeWishlist(slug: string) {
  return request<{ like_count: number }>(`/api/wishlists/${slug}/like`, { method: "POST" });
}

export async function cloneWishlist(slug: string, title: string) {
  return request<Wishlist>(`/api/wishlists/${slug}/clone`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });
}

// ── URL Scraper ──

export interface ScrapeResult {
  name: string;
  price: number | null;
  currency: string;
  image_url: string;
  url: string;
  source_domain: string;
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  return request<ScrapeResult>("/api/scrape", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
}

// ── Items ──

export async function addItem(
  wishlistId: string,
  item: {
    name: string;
    price?: number;
    currency?: string;
    tag?: string;
    url?: string;
    image_url?: string;
  }
) {
  return request<WishlistItem>(`/api/wishlists/${wishlistId}/items`, {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function updateItem(
  wishlistId: string,
  itemId: string,
  data: {
    name?: string;
    price?: number;
    currency?: string;
    tag?: string;
    url?: string;
    image_url?: string;
  }
) {
  return request<WishlistItem>(`/api/wishlists/${wishlistId}/items/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteItem(wishlistId: string, itemId: string) {
  return request(`/api/wishlists/${wishlistId}/items/${itemId}`, {
    method: "DELETE",
  });
}

export async function claimItem(slug: string, itemId: string, name: string) {
  return request(`/api/wishlists/${slug}/items/${itemId}/claim`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function unclaimItem(slug: string, itemId: string, name: string) {
  return request(`/api/wishlists/${slug}/items/${itemId}/unclaim`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

// ── Analytics ──

export interface WishlistAnalytics {
  wishlist_id: string;
  title: string;
  total_views: number;
  unique_viewers: number;
  daily_views: { date: string; views: number }[];
  top_referrers: { referrer: string; count: number }[];
}

// ── Discovery ──

export interface DiscoveryItem {
  name: string;
  url: string | null;
  image_url: string | null;
  price: number | null;
  currency: string;
  occurrences?: number;
}

export interface PromotedItem extends DiscoveryItem {
  id: string;
  description: string | null;
  created_at: string;
}

export interface CuratedWishlist {
  category: string;
  title: string;
  slug: string;
  description: string | null;
  cover_image: string | null;
  item_count: number;
  owner_name: string;
}

export interface DiscoveryResponse {
  trending: DiscoveryItem[];
  promoted: PromotedItem[];
  curated: CuratedWishlist[];
}

export async function getDiscovery() {
  return request<DiscoveryResponse>("/api/discovery");
}

export async function getWishlistAnalytics(wishlistId: string) {
  return request<WishlistAnalytics>(`/api/wishlists/${wishlistId}/analytics`);
}

// ── Admin ──

export interface AdminStats {
  total_users: number;
  total_wishlists: number;
  total_views: number;
  total_likes: number;
  new_users_30d: number;
}


export interface AdminUser {
  id: string;
  email: string;
  name: string;
  is_admin: boolean;
  created_at: string;
  wishlist_count: number;
}

export interface AdminWishlist {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  like_count: number;
  is_public: boolean;
  created_at: string;
  owner_name: string;
  owner_email: string;
  item_count: number;
}

export interface AdminAnalytics {
  daily_views: { date: string; views: number }[];
  daily_wishlists: { date: string; count: number }[];
}

export interface AdminPromotedWishlist {
  id: string;
  wishlist_id: string;
  category: string;
  display_order: number;
  created_at: string;
  title: string;
  slug: string;
  owner_name: string;
}

export interface AdminUserDetail {
  profile: AdminUser;
  wishlists: AdminWishlist[];
  stats: {
    total_wishlists: number;
    total_views: number;
    daily_views: { date: string; views: number }[];
  };
}

export interface PasswordResetQuestionResponse {
  question: string;
}

export async function getAdminStats() {
  return request<AdminStats>("/api/admin/stats");
}

export async function getAdminUsers() {
  return request<AdminUser[]>("/api/admin/users");
}

export async function getAdminWishlists() {
  return request<AdminWishlist[]>("/api/admin/wishlists");
}

export async function getAdminAnalytics() {
  return request<AdminAnalytics>("/api/admin/analytics");
}

export async function getAdminUserDetail(userId: string) {
  return request<AdminUserDetail>(`/api/admin/users/${userId}`);
}

export async function getResetQuestion(email: string) {
  return request<PasswordResetQuestionResponse>("/api/auth/forgot-password/question", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, answer: string, newPassword: string) {
  return request<{ message: string }>("/api/auth/forgot-password/reset", {
    method: "POST",
    body: JSON.stringify({ email, answer, new_password: newPassword }),
  });
}

export async function adminResetPassword(userId: string, newPassword: string) {
  return request<{ message: string }>(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ new_password: newPassword }),
  });
}

export async function listAdminPromoted() {
  return request<PromotedItem[]>("/api/admin/promoted");
}

export async function createAdminPromoted(item: Partial<PromotedItem>) {
  return request<PromotedItem>("/api/admin/promoted", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function deleteAdminPromoted(id: string) {
  return request(`/api/admin/promoted/${id}`, { method: "DELETE" });
}

export async function listAdminPromotedWishlists() {
  return request<AdminPromotedWishlist[]>("/api/admin/promoted/wishlists");
}

export async function createAdminPromotedWishlist(wishlist_id: string, category = "Seasonal") {
  return request<AdminPromotedWishlist>("/api/admin/promoted/wishlists", {
    method: "POST",
    body: JSON.stringify({ wishlist_id, category }),
  });
}

export async function deleteAdminPromotedWishlist(id: string) {
  return request(`/api/admin/promoted/wishlists/${id}`, { method: "DELETE" });
}
