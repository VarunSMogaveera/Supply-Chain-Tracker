const PRODUCTS_KEY = "products";
const PRODUCT_META_KEY = "productMeta";
const RECENT_ACTIVITY_KEY = "recentActivity";
const SCAN_LOGS_KEY = "scanLogs";

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getStoredProductIds() {
  return readJson(PRODUCTS_KEY, []);
}

export function rememberProduct(product) {
  const ids = getStoredProductIds();
  if (!ids.includes(product.id)) {
    writeJson(PRODUCTS_KEY, [product.id, ...ids]);
  }

  const meta = readJson(PRODUCT_META_KEY, {});
  meta[product.id] = {
    id: product.id,
    name: product.name,
    lastStatus: product.status || "Created",
    updatedAt: new Date().toISOString(),
    owner: product.owner || "",
    historyLength: product.history?.length || 0,
  };
  writeJson(PRODUCT_META_KEY, meta);
}

export function getStoredProductMeta() {
  return readJson(PRODUCT_META_KEY, {});
}

export function recordActivity(entry) {
  const current = readJson(RECENT_ACTIVITY_KEY, []);
  const next = [
    {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    },
    ...current,
  ].slice(0, 8);

  writeJson(RECENT_ACTIVITY_KEY, next);
}

export function getRecentActivity() {
  return readJson(RECENT_ACTIVITY_KEY, []);
}

export function recordScan(entry) {
  const current = readJson(SCAN_LOGS_KEY, []);
  const next = [
    {
      ...entry,
      timestamp: entry.timestamp || new Date().toISOString(),
    },
    ...current,
  ].slice(0, 20);

  writeJson(SCAN_LOGS_KEY, next);
}

export function getScanLogs() {
  return readJson(SCAN_LOGS_KEY, []);
}
