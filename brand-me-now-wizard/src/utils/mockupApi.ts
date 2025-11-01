// Client utilities to fetch categories/products via preview-server without exposing tokens
export type MockupProduct = {
  id?: string | number;
  name?: string;
  category?: string;
  image_url: string;
  mask_url?: string;
};

const getApiBase = () => {
  // Use same origin in production; during Vite preview use port 5500 proxy
  const isLocal = typeof location !== 'undefined' && location.port && location.port !== '';
  // Prefer preview-server on 5502 for local dev to avoid conflicts with older 5500 instances
  const origin = isLocal ? `${location.protocol}//${location.hostname}:5502` : `${location.origin}`;
  return `${origin}/wp-json/agui-chat/v1/mockups`;
};

export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${getApiBase()}/categories`, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`);
  const j = await res.json();
  if (!j?.ok) throw new Error(j?.error || 'Unknown category error');
  return Array.isArray(j.categories) ? j.categories : [];
}

export async function fetchProductsByCategory(category?: string): Promise<MockupProduct[]> {
  const url = category ? `${getApiBase()}/products?category=${encodeURIComponent(category)}` : `${getApiBase()}/products`;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const j = await res.json();
  if (!j?.ok) throw new Error(j?.error || 'Unknown products error');
  return Array.isArray(j.products) ? j.products : [];
}