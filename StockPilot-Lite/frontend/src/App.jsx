import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Boxes, ChartNoAxesCombined,
  CircleDollarSign, ClipboardList, LayoutDashboard, Package, Plus, RefreshCw,
  Search, ShoppingCart, X, Pencil, Trash2, Check, ChevronDown
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid
} from "recharts";
import { api } from "./api.js";

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value || 0));

const blankProduct = {
  name: "", sku: "", category: "Accessories", purchasePrice: "0",
  sellingPrice: "0", quantity: "0", minStock: "5", supplier: ""
};
const chartColors = ["#4f46e5", "#0d9488", "#f59e0b", "#ec4899", "#64748b", "#8b5cf6"];

function StatCard({ title, value, detail, icon: Icon, tone = "indigo" }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={20} /></div>
    <div className="stat-content">
      <span className="stat-title">{title}</span>
      <strong>{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  </div>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section className="modal">
      <div className="modal-heading"><div><h2>{title}</h2><p>Enter the details below.</p></div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19} /></button>
      </div>
      {children}
    </section>
  </div>;
}

function ProductModal({ product, onClose, onSave, busy }) {
  const [form, setForm] = useState(product ? {
    name: product.name, sku: product.sku, category: product.category,
    purchasePrice: String(product.purchasePrice), sellingPrice: String(product.sellingPrice),
    quantity: String(product.quantity), minStock: String(product.minStock),
    supplier: product.supplier || ""
  } : blankProduct);
  const [error, setError] = useState("");
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setError("Name, SKU and category are required."); return;
    }
    for (const field of ["purchasePrice", "sellingPrice", "quantity", "minStock"]) {
      if (form[field] === "" || !Number.isFinite(Number(form[field])) || Number(form[field]) < 0) {
        setError(`${field.replace(/([A-Z])/g, " $1")} must be zero or greater.`); return;
      }
    }
    if (!Number.isInteger(Number(form.quantity)) || !Number.isInteger(Number(form.minStock))) {
      setError("Quantity and minimum stock must be whole numbers."); return;
    }
    try {
      await onSave({ ...form, purchasePrice: Number(form.purchasePrice), sellingPrice: Number(form.sellingPrice), quantity: Number(form.quantity), minStock: Number(form.minStock) });
    } catch (err) { setError(err.message); }
  };
  return <Modal title={product ? "Edit product" : "Add a product"} onClose={onClose}>
    <form className="form-grid" onSubmit={submit}>
      <label className="field full">Product name<input name="name" value={form.name} onChange={change} placeholder="e.g. Wireless Mouse" required /></label>
      <label className="field">SKU<input name="sku" value={form.sku} onChange={change} placeholder="e.g. ACC-005" required /></label>
      <label className="field">Category<select name="category" value={form.category} onChange={change}>
        {["Accessories", "Displays", "Office", "Storage", "Computers", "Other"].map(x => <option key={x}>{x}</option>)}
      </select></label>
      <label className="field">Purchase price (₹)<input type="number" name="purchasePrice" min="0" step="0.01" value={form.purchasePrice} onChange={change} required /></label>
      <label className="field">Selling price (₹)<input type="number" name="sellingPrice" min="0" step="0.01" value={form.sellingPrice} onChange={change} required /></label>
      <label className="field">Quantity<input type="number" name="quantity" min="0" step="1" value={form.quantity} onChange={change} required /></label>
      <label className="field">Low-stock threshold<input type="number" name="minStock" min="0" step="1" value={form.minStock} onChange={change} required /></label>
      <label className="field full">Supplier (optional)<input name="supplier" value={form.supplier} onChange={change} placeholder="Supplier or brand" /></label>
      {error && <p className="form-error full">{error}</p>}
      <div className="form-actions full"><button type="button" className="button secondary" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={busy}>{busy ? "Saving..." : <><Check size={16} /> Save product</>}</button></div>
    </form>
  </Modal>;
}

function SaleModal({ products, onClose, onSave, busy }) {
  const available = products.filter(p => p.quantity > 0);
  const [productId, setProductId] = useState(available[0]?._id || "");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const selected = available.find(p => p._id === productId);
  const submit = async (e) => {
    e.preventDefault(); setError("");
    const amount = Number(quantity);
    if (!selected) { setError("Choose a product with available stock."); return; }
    if (!Number.isInteger(amount) || amount < 1) { setError("Quantity must be a whole number greater than zero."); return; }
    try { await onSave(productId, amount); } catch (err) { setError(err.message); }
  };
  return <Modal title="Record a sale" onClose={onClose}>
    <form className="form-grid" onSubmit={submit}>
      <label className="field full">Product<select value={productId} onChange={e => setProductId(e.target.value)} required>
        {available.map(p => <option key={p._id} value={p._id}>{p.name} · {p.quantity} in stock · {money(p.sellingPrice)}</option>)}
      </select></label>
      <label className="field full">Quantity sold<input type="number" min="1" max={selected?.quantity || 1} step="1" value={quantity} onChange={e => setQuantity(e.target.value)} required /></label>
      {selected && <div className="sale-preview full"><span>Sale total</span><strong>{money(selected.sellingPrice * Number(quantity || 0))}</strong><small>{selected.quantity} units currently available</small></div>}
      {error && <p className="form-error full">{error}</p>}
      <div className="form-actions full"><button type="button" className="button secondary" onClick={onClose}>Cancel</button>
        <button className="button primary" disabled={busy || !available.length}>{busy ? "Recording..." : <><ShoppingCart size={16} /> Record sale</>}</button></div>
    </form>
  </Modal>;
}

export default function App() {
  const [page, setPage] = useState("Overview");
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All categories");
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [mode, setMode] = useState("demo");
  const [loadError, setLoadError] = useState("");

  const refresh = useCallback(async () => {
    setLoadError("");
    try {
      const [allProducts, allSales, stats, health] = await Promise.all([
        api.products(), api.sales(), api.dashboard(), api.health()
      ]);
      setProducts(allProducts);
      setSales(allSales);
      setDashboard(stats);
      setMode(health.mode);
    } catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(id);
  }, [notice]);

  const categories = useMemo(() => ["All categories", ...new Set(products.map(p => p.category).filter(Boolean))], [products]);
  const visibleProducts = useMemo(() => products.filter(p => {
    const q = search.trim().toLowerCase();
    return (!q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      && (category === "All categories" || p.category === category);
  }), [products, search, category]);
  const lowStock = products.filter(p => p.quantity <= p.minStock).sort((a, b) => a.quantity - b.quantity);
  const latestSales = [...sales].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt)).slice(0, 6);

  const saveProduct = async (payload) => {
    setBusy(true);
    try {
      if (modal.product) await api.updateProduct(modal.product._id, payload);
      else await api.createProduct(payload);
      setModal(null); setNotice({ type: "success", text: modal.product ? "Product updated." : "Product added." });
      await refresh();
    } finally { setBusy(false); }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return;
    try {
      await api.deleteProduct(product._id);
      setNotice({ type: "success", text: "Product deleted." }); await refresh();
    } catch (err) { setNotice({ type: "error", text: err.message }); }
  };

  const recordSale = async (productId, quantity) => {
    setBusy(true);
    try {
      await api.createSale(productId, quantity);
      setModal(null); setPage("Sales");
      setNotice({ type: "success", text: "Sale recorded and stock updated." });
      await refresh();
    } finally { setBusy(false); }
  };

  const navItems = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Products", icon: Package },
    { label: "Sales", icon: ShoppingCart }
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Boxes size={22} /></div><div><strong>StockPilot</strong><span>INVENTORY LITE</span></div></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{navItems.map(item => <button key={item.label} className={`nav-item ${page === item.label ? "active" : ""}`} onClick={() => setPage(item.label)}><item.icon size={18} /><span>{item.label}</span>{page === item.label && <span className="nav-dot" />}</button>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Activity size={17} /></div><strong>Keep stock in sync</strong><p>Record every sale to keep inventory numbers accurate.</p><button onClick={() => setModal({ type: "sale" })}>Record a sale <ArrowUpRight size={14} /></button></div>
        <div className="profile-row"><div className="avatar">SP</div><div><strong>Store workspace</strong><span>{mode === "demo" ? "Demo mode" : "MongoDB connected"}</span></div><ChevronDown size={16} /></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Boxes size={20} /></div><strong>StockPilot</strong></div>
        <div className="breadcrumbs">Workspace <span>/</span> <strong>{page}</strong></div>
        <div className="top-actions"><span className={`mode-pill ${mode}`}>{mode === "demo" ? "● Demo data" : "● Database connected"}</span><button className="icon-button" onClick={refresh} title="Refresh data"><RefreshCw size={17} /></button>
          <button className="button primary small" onClick={() => setModal({ type: "product" })}><Plus size={16} /> Add product</button></div>
      </header>

      <div className="page-wrap">
        {loadError && <div className="error-banner"><AlertTriangle size={18} /><div><strong>Cannot load the backend</strong><p>{loadError}</p><small>Start the backend in a terminal with <code>cd backend</code> then <code>npm run dev</code>.</small></div><button className="icon-button" onClick={refresh}><RefreshCw size={16} /></button></div>}
        {loading && !dashboard ? <div className="loading-panel"><RefreshCw className="spin" size={24} /><p>Loading your inventory...</p></div> : <>
          {page === "Overview" && <Overview dashboard={dashboard} lowStock={lowStock} latestSales={latestSales} products={products} onProducts={() => setPage("Products")} onSales={() => setPage("Sales")} onRecordSale={() => setModal({ type: "sale" })} totalSalesCount={sales.length} />}
          {page === "Products" && <section className="page-section"><div className="section-heading"><div><span className="eyebrow">CATALOGUE</span><h1>Products</h1><p>Manage your catalogue and stock levels.</p></div><button className="button primary" onClick={() => setModal({ type: "product" })}><Plus size={16} /> Add product</button></div>
            <div className="panel"><div className="table-toolbar"><div className="search-box"><Search size={17} /><input placeholder="Search name or SKU..." value={search} onChange={e => setSearch(e.target.value)} /></div><select className="filter-select" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select><span className="results-count">{visibleProducts.length} products</span></div>
              <ProductTable products={visibleProducts} onEdit={p => setModal({ type: "product", product: p })} onDelete={deleteProduct} />
              {!visibleProducts.length && <div className="empty-state"><Package size={30} /><strong>No products found</strong><p>Try another search or add a new product.</p></div>}
            </div>
          </section>}
          {page === "Sales" && <SalesPage sales={sales} products={products} onRecord={() => setModal({ type: "sale" })} />}
        </>}
        <footer className="footer"><span>StockPilot Lite</span><span>Inventory made easier · Portfolio project</span></footer>
      </div>
    </main>

    {modal?.type === "product" && <ProductModal product={modal.product} onClose={() => setModal(null)} onSave={saveProduct} busy={busy} />}
    {modal?.type === "sale" && <SaleModal products={products} onClose={() => setModal(null)} onSave={recordSale} busy={busy} />}
    {notice && <div className={`toast ${notice.type}`}><Check size={17} />{notice.text}<button className="icon-button" onClick={() => setNotice(null)}><X size={15} /></button></div>}
  </div>;
}

function Overview({ dashboard, lowStock, latestSales, products, onProducts, onSales, onRecordSale, totalSalesCount }) {
  const categoryData = dashboard?.categoryCounts || [];
  const topProducts = [...products].sort((a, b) => b.quantity * b.purchasePrice - a.quantity * a.purchasePrice).slice(0, 5);
  return <section className="page-section">
    <div className="section-heading overview-heading"><div><span className="eyebrow">STORE OVERVIEW</span><h1>Good day, Store Manager <span className="wave">✦</span></h1><p>Here's what's happening with your inventory today.</p></div>
      <button className="button secondary" onClick={onRecordSale}><ShoppingCart size={16} /> Record sale</button></div>
    <div className="stats-grid">
      <StatCard title="Total products" value={dashboard?.totalProducts ?? "—"} detail="Unique items in catalogue" icon={Package} tone="indigo" />
      <StatCard title="Units in stock" value={Number(dashboard?.totalUnits || 0).toLocaleString("en-IN")} detail="Across all products" icon={Boxes} tone="teal" />
      <StatCard title="Inventory value" value={money(dashboard?.inventoryValue)} detail="Based on purchase price" icon={CircleDollarSign} tone="amber" />
      <StatCard title="Low-stock items" value={dashboard?.lowStockCount ?? "—"} detail="At or below threshold" icon={AlertTriangle} tone="rose" />
    </div>
    <div className="dashboard-grid">
      <div className="panel chart-panel"><div className="panel-heading"><div><h2>Products by category</h2><p>Catalogue distribution</p></div><span className="heading-icon"><ChartNoAxesCombined size={18} /></span></div>
        {categoryData.length ? <div className="chart-body"><div className="donut-wrap"><ResponsiveContainer width="100%" height={220}><PieChart><Pie data={categoryData} dataKey="count" nameKey="category" innerRadius={62} outerRadius={88} paddingAngle={4} stroke="none">{categoryData.map((entry, index) => <Cell key={entry.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value, name) => [`${value} products`, name]} /></PieChart></ResponsiveContainer><div className="donut-center"><strong>{dashboard?.totalProducts || 0}</strong><span>products</span></div></div>
          <div className="legend">{categoryData.map((entry, i) => <div className="legend-row" key={entry.category}><span className="legend-dot" style={{ background: chartColors[i % chartColors.length] }} /><span>{entry.category}</span><strong>{entry.count}</strong></div>)}</div></div> : <div className="empty-chart">Add products to see category analytics.</div>}
      </div>
      <div className="panel revenue-panel"><div className="panel-heading"><div><h2>Sales snapshot</h2><p>Revenue recorded in this workspace</p></div><span className="heading-icon green"><ArrowUpRight size={18} /></span></div>
        <div className="revenue-number">{money(dashboard?.totalSalesRevenue)}</div><span className="revenue-caption">Total recorded sales revenue</span>
        <div className="revenue-divider" />
        <div className="revenue-stat"><span>This month</span><strong>{money(dashboard?.monthSalesRevenue)}</strong></div>
        <div className="revenue-stat"><span>Sales transactions</span><strong>{totalSalesCount}</strong></div>
        <button className="text-link" onClick={onSales}>View sales history <ArrowUpRight size={15} /></button>
      </div>
    </div>
    <div className="bottom-grid">
      <div className="panel"><div className="panel-heading"><div><h2>Low-stock alerts</h2><p>Items that may need replenishing</p></div><button className="text-link" onClick={onProducts}>View products <ArrowUpRight size={15} /></button></div>
        {lowStock.length ? <div className="alert-list">{lowStock.slice(0, 5).map(p => <div className="alert-row" key={p._id}><div className="product-avatar"><Package size={17} /></div><div className="alert-product"><strong>{p.name}</strong><span>{p.sku} · {p.category}</span></div><div className="stock-status"><strong>{p.quantity} left</strong><span>Minimum {p.minStock}</span></div><span className="status-badge low">Low stock</span></div>)}</div> : <div className="success-empty"><Check size={18} />All products are above their minimum stock levels.</div>}
      </div>
      <div className="panel"><div className="panel-heading"><div><h2>Inventory value</h2><p>Top products by stock cost</p></div><span className="heading-icon"><ClipboardList size={18} /></span></div>
        <div className="value-list">{topProducts.map((p, i) => <div className="value-row" key={p._id}><span className="rank">{String(i + 1).padStart(2, "0")}</span><div className="value-product"><strong>{p.name}</strong><span>{p.quantity} units × {money(p.purchasePrice)}</span></div><strong className="value-amount">{money(p.quantity * p.purchasePrice)}</strong></div>)}</div>
      </div>
    </div>
    <div className="panel recent-panel"><div className="panel-heading"><div><h2>Recent sales</h2><p>Latest recorded transactions</p></div><button className="text-link" onClick={onSales}>All sales <ArrowUpRight size={15} /></button></div>
      {latestSales.length ? <div className="sales-mini-list">{latestSales.slice(0, 4).map(s => <div className="sales-mini-row" key={s._id}><div className="sale-icon"><ShoppingCart size={17} /></div><div className="sale-info"><strong>{s.productName}</strong><span>{s.sku} · {s.quantity} unit{s.quantity === 1 ? "" : "s"} · {new Date(s.soldAt).toLocaleDateString()}</span></div><strong>{money(s.total)}</strong></div>)}</div> : <div className="empty-state compact"><ShoppingCart size={24} /><p>No sales recorded yet.</p></div>}
    </div>
  </section>;
}


function ProductTable({ products, onEdit, onDelete }) {
  return <div className="table-scroll"><table className="data-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>STATUS</th><th></th></tr></thead><tbody>
    {products.map(p => {
      const low = p.quantity <= p.minStock;
      return <tr key={p._id}><td><div className="product-cell"><div className="product-avatar"><Package size={17} /></div><div><strong>{p.name}</strong><span>{p.supplier || "No supplier"}</span></div></div></td><td><code className="sku">{p.sku}</code></td><td><span className="category-tag">{p.category}</span></td><td><strong>{money(p.sellingPrice)}</strong><small className="cell-sub">Cost {money(p.purchasePrice)}</small></td><td><strong>{p.quantity}</strong><small className="cell-sub">Min. {p.minStock}</small></td><td><span className={`status-badge ${low ? "low" : "healthy"}`}><span />{low ? "Low stock" : "In stock"}</span></td><td><div className="row-actions"><button className="icon-button" title="Edit product" onClick={() => onEdit(p)}><Pencil size={15} /></button><button className="icon-button danger-hover" title="Delete product" onClick={() => onDelete(p)}><Trash2 size={15} /></button></div></td></tr>;
    })}
  </tbody></table></div>;
}

function SalesPage({ sales, products, onRecord }) {
  const sorted = [...sales].sort((a, b) => new Date(b.soldAt) - new Date(a.soldAt));
  const revenue = sorted.reduce((sum, sale) => sum + sale.total, 0);
  const units = sorted.reduce((sum, sale) => sum + sale.quantity, 0);
  return <section className="page-section"><div className="section-heading"><div><span className="eyebrow">TRANSACTIONS</span><h1>Sales history</h1><p>Every sale updates the corresponding stock quantity.</p></div><button className="button primary" onClick={onRecord}><Plus size={16} /> Record sale</button></div>
    <div className="stats-grid sales-stats"><StatCard title="Recorded revenue" value={money(revenue)} detail="All saved transactions" icon={CircleDollarSign} tone="teal" /><StatCard title="Units sold" value={units} detail="Total units across sales" icon={ShoppingCart} tone="indigo" /><StatCard title="Transactions" value={sales.length} detail="Recorded sales entries" icon={ClipboardList} tone="amber" /><StatCard title="Products tracked" value={products.length} detail="Current catalogue size" icon={Package} tone="rose" /></div>
    <div className="panel"><div className="panel-heading sales-table-heading"><div><h2>All transactions</h2><p>{sorted.length} sale records</p></div></div>
      {sorted.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>PRODUCT</th><th>SKU</th><th>QUANTITY</th><th>UNIT PRICE</th><th>TOTAL</th><th>DATE</th></tr></thead><tbody>{sorted.map(s => <tr key={s._id}><td><div className="product-cell"><div className="sale-icon"><ShoppingCart size={16} /></div><div><strong>{s.productName}</strong><span>Sale recorded</span></div></div></td><td><code className="sku">{s.sku}</code></td><td>{s.quantity}</td><td>{money(s.unitPrice)}</td><td><strong>{money(s.total)}</strong></td><td>{new Date(s.soldAt).toLocaleString()}</td></tr>)}</tbody></table></div> : <div className="empty-state"><ShoppingCart size={30} /><strong>No sales yet</strong><p>Record your first sale to see it here.</p></div>}
    </div>
  </section>;
}
