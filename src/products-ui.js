import { CATALOG_FILTER_LABELS, productMatchesCatalogFilter } from './catalog.js';

export function formatPriceBrl(price) {
  return `R$ ${(Number(price) || 0).toFixed(2).replace('.', ',')}`;
}

export function buildProductCardHtml(product, { escapeHtml, renderProductImage, variant = 'grid' }) {
  const adminCategory = product.adminCategory || 'all';
  const categoryLabel = CATALOG_FILTER_LABELS[adminCategory] || 'Coleção';

  if (variant === 'marquee') {
    return `
      <article class="drop-marquee-card" data-id="${escapeHtml(product.id)}" data-admin-category="${escapeHtml(adminCategory)}">
        <a class="drop-marquee-card__media" href="/catalogo.html">
          ${renderProductImage(product)}
        </a>
        <div class="drop-marquee-card__body">
          <span class="drop-marquee-card__tag">${escapeHtml(categoryLabel)}</span>
          <h3>${escapeHtml(product.name)}</h3>
          <p class="drop-marquee-card__price">${formatPriceBrl(product.price)}</p>
          <button class="quick-add add-to-cart" type="button" data-id="${escapeHtml(product.id)}">Adicionar</button>
        </div>
      </article>
    `;
  }

  return `
    <article class="product-card" data-category="${escapeHtml(product.category || 'all')}" data-admin-category="${escapeHtml(adminCategory)}">
      <div class="product-image">${renderProductImage(product)}</div>
      <div class="product-content">
        <span class="product-tag">${escapeHtml(categoryLabel)}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-price">${formatPriceBrl(product.price)}</p>
        <p class="product-description">${escapeHtml(product.description || '')}</p>
        <button class="quick-add add-to-cart" type="button" data-id="${escapeHtml(product.id)}">Adicionar</button>
      </div>
    </article>
  `;
}

export function sortProducts(list, sortBy) {
  const items = [...list];
  switch (sortBy) {
    case 'price-asc':
      return items.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return items.sort((a, b) => b.price - a.price);
    case 'name':
      return items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    default:
      return items;
  }
}

export function filterProductsByAdminCategory(list, filterId) {
  return list.filter((product) => productMatchesCatalogFilter(product, filterId));
}
