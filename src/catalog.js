/** Categorias do painel admin → agrupamento legado na home (shop). */
export const ADMIN_TO_SHOP_CATEGORY = {
  blusa: 'hoodie',
  'blusa-frio': 'hoodie',
  bone: 'accessory',
  camisa: 'tee',
};

export const VALID_ADMIN_CATEGORIES = new Set(['blusa', 'blusa-frio', 'bone', 'camisa']);

/** Filtros do catálogo completo (sidebar). */
export const CATALOG_FILTERS = [
  { id: 'all', label: 'Todos os itens' },
  { id: 'blusa', label: 'Blusas' },
  { id: 'blusa-frio', label: 'Blusas de frio' },
  { id: 'camisa', label: 'Camisetas & regatas' },
  { id: 'bone', label: 'Bonés & acessórios' },
];

export const CATALOG_FILTER_LABELS = Object.fromEntries(
  CATALOG_FILTERS.map((f) => [f.id, f.label])
);

export const DEFAULT_FEATURED_SECTION = {
  eyebrow: 'Destaques',
  title: 'Selecao rapida do drop.',
  productIds: [],
};

export function toShopCategory(adminCategory) {
  return ADMIN_TO_SHOP_CATEGORY[adminCategory] || 'all';
}

/**
 * Resolve a categoria do admin (blusa, camisa…) sem confundir com slug da loja (hoodie, tee…).
 */
export function resolveAdminCategory(product = {}) {
  const candidates = [
    product.admin_category,
    product.adminCategory,
    product.category,
  ].filter(Boolean);

  for (const value of candidates) {
    if (VALID_ADMIN_CATEGORIES.has(value)) return value;
  }

  return 'all';
}

export function normalizeProductForSite(product) {
  const adminCategory = resolveAdminCategory(product);
  return {
    id: product.id,
    name: product.name || 'Produto',
    price: Number(product.price) || 0,
    image: product.image || product.image_url || '',
    description: product.description || '',
    category: toShopCategory(adminCategory),
    adminCategory,
    stock: Number(product.stock) || 0,
  };
}

export function productMatchesCatalogFilter(product, filterId) {
  if (filterId === 'all') return true;
  return resolveAdminCategory(product) === filterId;
}
