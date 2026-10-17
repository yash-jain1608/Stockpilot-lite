const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || "Request failed. Is the backend running?");
  return data;
}

export const api = {
  health: () => request("/health"),
  dashboard: () => request("/dashboard"),
  products: (search = "", category = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    return request(`/products?${params.toString()}`);
  },
  createProduct: (product) => request("/products", { method: "POST", body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),
  sales: () => request("/sales"),
  createSale: (productId, quantity) => request("/sales", { method: "POST", body: JSON.stringify({ productId, quantity }) })
};
