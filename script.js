import {
  createOrder,
  fetchActiveAnnouncements,
  fetchActiveProducts,
  fetchFeaturedSection,
  fetchOrdersByCpf,
} from './src/supabase-client.js';
import { CATALOG_FILTERS, DEFAULT_FEATURED_SECTION, normalizeProductForSite } from './src/catalog.js';
import {
  buildProductCardHtml,
  filterProductsByAdminCategory,
  sortProducts,
} from './src/products-ui.js';

const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
navToggle.addEventListener('click', () => {
  const isOpen = mobileNav.classList.toggle('open');
  navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-label', 'Abrir menu');
  });
});

const openCart = document.getElementById('openCart');
const closeCart = document.getElementById('closeCart');
const cartDrawer = document.getElementById('cartDrawer');
const backdrop = document.getElementById('backdrop');
const cartCount = document.getElementById('cartCount');
const cartItemsContainer = document.getElementById('cartItems');
const subtotalValue = document.getElementById('subtotalValue');
const shippingValue = document.getElementById('shippingValue');
const totalValue = document.getElementById('totalValue');
const shippingResult = document.getElementById('shippingResult');
const cepInput = document.getElementById('cepInput');
const checkShipping = document.getElementById('checkShipping');
const checkoutButton = document.getElementById('checkoutButton');
const checkoutName = document.getElementById('checkoutName');
const checkoutPhone = document.getElementById('checkoutPhone');
const checkoutEmail = document.getElementById('checkoutEmail');
const checkoutCpf = document.getElementById('checkoutCpf');
const paymentMethod = document.getElementById('paymentMethod');
const checkoutForm = document.getElementById('checkoutForm');
const orderStatusForm = document.getElementById('orderStatusForm');
const orderCpfSearch = document.getElementById('orderCpfSearch');
const orderStatusResult = document.getElementById('orderStatusResult');

const scrollToSection = (sectionId = 'top') => {
  const targetId = sectionId === 'top' ? 'top' : sectionId;
  const target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
};

const handleSectionNavigation = (sectionId) => {
  if (!sectionId) return;

  if (window.location.pathname === '/' && !window.location.search) {
    scrollToSection(sectionId);
    return;
  }

  sessionStorage.setItem('swagverse-target-section', sectionId);
  window.location.assign('/');
};

const applyPendingSectionNavigation = () => {
  const pendingSection = sessionStorage.getItem('swagverse-target-section');
  if (!pendingSection) return;

  sessionStorage.removeItem('swagverse-target-section');
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      scrollToSection(pendingSection);
    });
  });
};

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-section-target]');
  if (!link) return;

  event.preventDefault();
  handleSectionNavigation(link.dataset.sectionTarget);
});

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

const formatCpf = (value = '') => {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const formatPhone = (value = '') => {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return '';
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0,4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0,5)}-${rest.slice(5)}`;
};

const isImageUrl = (value = '') => /^(https?:\/\/|data:image\/)/i.test(String(value).trim());

const getStatusLabel = (status) => ({
  pending: 'Aguardando pagamento',
  paid: 'Pago',
  preparing: 'Em separacao',
  shipped: 'Enviado',
  delivered: 'Entregue',
  failed: 'Falha ou cancelado'
}[status] || status || 'Aguardando pagamento');

const renderProductImage = (product) => {
  const image = String(product.image || '').trim();
  if (isImageUrl(image)) {
    return `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy">`;
  }
  return `<span>${escapeHtml(image || 'Produto')}</span>`;
};

// Produtos padrao (fallback caso admin nao tenha configurado)
const defaultProducts = {
  'heavy-hoodie': { id: 'heavy-hoodie', name: 'Hoodie Swag Core', price: 239.9, category: 'hoodie', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80', description: 'Modelagem oversized, tecido pesado.' },
  'archive-tee': { id: 'archive-tee', name: 'Camiseta Pulse', price: 99.9, category: 'tee', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80', description: 'Grafico exclusivo drop 06.' },
  'canvas-cap': { id: 'canvas-cap', name: 'Snapback Vibe', price: 79.9, category: 'accessory', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80', description: 'Ajuste snapback, aba plana.' },
  'zip-hoodie': { id: 'zip-hoodie', name: 'Hoodie Neon Wave', price: 249.9, category: 'hoodie', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', description: 'Ziper duplo, silhueta relaxada.' }
};

// Inicializar produtos com os padroes
const products = { ...defaultProducts };

function applyProductsList(list) {
  Object.keys(products).forEach((id) => delete products[id]);
  list.forEach((item) => {
    const normalized = normalizeProductForSite({ ...item, id: item.id });
    products[normalized.id] = normalized;
  });
}

function applyAnnouncements(list) {
  list.forEach((announcement) => {
    const element = document.getElementById(`announcement${announcement.position}`);
    if (element) element.textContent = announcement.text;
  });
}

let catalogFilter = 'all';
let catalogSort = 'featured';
let featuredSection = { ...DEFAULT_FEATURED_SECTION };

const cardHelpers = { escapeHtml, renderProductImage };

function applyFeaturedSection(section) {
  featuredSection = { ...DEFAULT_FEATURED_SECTION, ...section };
  const eyebrow = document.getElementById('shopEyebrow');
  const title = document.getElementById('shopTitle');
  if (eyebrow) eyebrow.textContent = featuredSection.eyebrow;
  if (title) title.textContent = featuredSection.title;
}

function getFeaturedProducts() {
  const ids = (featuredSection.productIds || []).map(String).filter(Boolean);
  if (!ids.length) return getAllProducts().slice(0, 4);
  return ids.map((id) => products[id]).filter(Boolean);
}

function getAllProducts() {
  return Object.values(products);
}

function renderDropMarquee() {
  const track = document.getElementById('dropsMarqueeTrack');
  if (!track) return;

  const list = getAllProducts();
  if (!list.length) {
    track.innerHTML = '<p class="drops-marquee__empty">Cadastre produtos no painel admin para exibir o drop.</p>';
    return;
  }

  const cards = list
    .map((product) => buildProductCardHtml(product, { ...cardHelpers, variant: 'marquee' }))
    .join('');

  track.innerHTML = `
    <div class="drops-marquee__group">${cards}</div>
    <div class="drops-marquee__group" aria-hidden="true">${cards}</div>
  `;
}

function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  const filtersNav = document.getElementById('catalogFilters');
  const countEl = document.getElementById('catalogCount');
  const emptyEl = document.getElementById('catalogEmpty');
  if (!grid || !filtersNav) return;

  filtersNav.innerHTML = CATALOG_FILTERS.map(
    (filter) => `
      <button
        type="button"
        class="catalog-filter-btn${filter.id === catalogFilter ? ' active' : ''}"
        data-filter="${filter.id}"
        role="tab"
        aria-selected="${filter.id === catalogFilter}"
      >${escapeHtml(filter.label)}</button>
    `
  ).join('');

  let list = filterProductsByAdminCategory(getAllProducts(), catalogFilter);
  list = sortProducts(list, catalogSort);

  if (countEl) {
    countEl.textContent = `${list.length} ${list.length === 1 ? 'peca' : 'pecas'}`;
  }
  if (emptyEl) emptyEl.hidden = list.length > 0;

  if (!list.length) {
    grid.innerHTML = '';
    attachCartButtonListeners();
    return;
  }

  grid.innerHTML = list
    .map((product) => buildProductCardHtml(product, cardHelpers))
    .join('');

  attachCartButtonListeners();
}

function renderFeaturedGrid() {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

  const list = getFeaturedProducts();

  if (!list.length) {
    productGrid.innerHTML = '<p style="padding:40px 32px;color:var(--muted);">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  productGrid.innerHTML = list
    .map((product) => buildProductCardHtml(product, cardHelpers))
    .join('');

  attachCartButtonListeners();
}

const isCatalogPage = document.body.classList.contains('page-catalog');

function renderAllProductViews() {
  if (!isCatalogPage) renderDropMarquee();
  renderCatalog();
  if (!isCatalogPage) renderFeaturedGrid();
}

function initCatalogControls() {
  document.getElementById('catalogFilters')?.addEventListener('click', (event) => {
    const button = event.target.closest('.catalog-filter-btn');
    if (!button) return;
    catalogFilter = button.dataset.filter || 'all';
    renderCatalog();
  });

  document.getElementById('catalogSort')?.addEventListener('change', (event) => {
    catalogSort = event.target.value;
    renderCatalog();
  });
}

function initCatalogPageFromUrl() {
  const filter = new URLSearchParams(window.location.search).get('filter');
  if (filter && CATALOG_FILTERS.some((item) => item.id === filter)) {
    catalogFilter = filter;
  }
}

async function bootstrapSite() {
  const remoteProducts = await fetchActiveProducts();

  if (remoteProducts?.length) {
    applyProductsList(remoteProducts);
  }

  if (isCatalogPage) {
    initCatalogPageFromUrl();
  } else {
    const featured = await fetchFeaturedSection();
    applyFeaturedSection(featured);
  }

  renderAllProductViews();

  const announcements = await fetchActiveAnnouncements();
  if (announcements?.length) applyAnnouncements(announcements);
}

function attachCartButtonListeners() {
  document.querySelectorAll('.add-to-cart').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      const product = products[id];
      if (!product) {
        console.warn(`Produto ${id} nao encontrado`);
        return;
      }
      cart.items[id] = cart.items[id] || { ...product, quantity: 0 };
      cart.items[id].quantity += 1;
      renderCart();
      toggleCart(true);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCatalogControls();
  bootstrapSite().finally(() => {
    applyPendingSectionNavigation();
  });
});

const cart = {
  items: {},
  shipping: 0
};

const formatCurrency = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const updateCartCount = () => {
  const totalItems = Object.values(cart.items).reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
};

const calculateSubtotal = () => {
  return Object.values(cart.items).reduce((sum, item) => sum + item.quantity * item.price, 0);
};

const updateTotals = () => {
  const subtotal = calculateSubtotal();
  const total = subtotal + (cart.shipping ?? 0);
  subtotalValue.textContent = formatCurrency(subtotal);
  shippingValue.textContent = formatCurrency(cart.shipping);
  totalValue.textContent = formatCurrency(total);
};

const renderCart = () => {
  const items = Object.values(cart.items);
  if (!items.length) {
    cartItemsContainer.innerHTML = '<p class="empty-message">Seu carrinho esta vazio. Adicione um item para comecar.</p>';
    updateCartCount();
    updateTotals();
    return;
  }

  cartItemsContainer.innerHTML = items.map((item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${item.quantity} × ${formatCurrency(item.price)}</span>
      </div>
      <div class="cart-item-controls">
        <button type="button" class="remove-item" data-id="${item.id}">Remover</button>
      </div>
    </div>`).join('');

  document.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.id;
      if (!cart.items[id]) return;
      delete cart.items[id];
      renderCart();
    });
  });

  updateCartCount();
  updateTotals();
};

const estimateShipping = (cep) => {
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) {
    return null;
  }
  const prefix = parseInt(cleaned.slice(0, 2), 10);
  if (prefix <= 29) return 18.0;
  if (prefix <= 59) return 26.0;
  if (prefix <= 79) return 33.0;
  return 42.0;
};

const showShippingStatus = () => {
  const cepValue = cepInput.value.trim();
  const shippingCost = estimateShipping(cepValue);
  if (shippingCost === null) {
    shippingResult.textContent = 'CEP invalido. Digite 8 digitos para calcular.';
    cart.shipping = 0;
  } else {
    cart.shipping = shippingCost;
    const formattedCep = cepValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    shippingResult.textContent = `Frete estimado de ${formatCurrency(shippingCost)} para CEP ${formattedCep}.`;
  }
  updateTotals();
};

const buildOrder = () => {
  const subtotal = calculateSubtotal();
  const total = subtotal + (cart.shipping ?? 0);
  const cpfDigits = onlyDigits(checkoutCpf.value);
  return {
    id: Date.now().toString(),
    customerName: checkoutName.value.trim(),
    email: checkoutEmail.value.trim(),
    phone: onlyDigits(checkoutPhone.value),
    phoneFormatted: formatPhone(checkoutPhone.value),
    cpf: cpfDigits,
    cpfFormatted: formatCpf(cpfDigits),
    cep: cepInput.value.trim(),
    paymentMethod: paymentMethod.value,
    total,
    subtotal,
    shipping: cart.shipping ?? 0,
    createdAt: new Date().toISOString(),
    items: Object.values(cart.items).map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  };
};

const saveOrderForAdmin = async (order) => {
  await createOrder({
    ...order,
    status: 'pending',
    notes: 'Pedido recebido pela loja.'
  });
};

const clearCheckout = () => {
  cart.items = {};
  cart.shipping = 0;
  renderCart();
  checkoutForm.reset();
  cepInput.value = '';
  shippingResult.textContent = 'Insira o CEP para estimar o frete.';
};

const renderOrdersByCpf = async (cpfDigits) => {
  orderStatusResult.innerHTML = '<p>Buscando pedidos...</p>';
  let orders;
  try {
    orders = await fetchOrdersByCpf(cpfDigits);
  } catch (error) {
    console.error(error);
    orderStatusResult.innerHTML = '<p>Nao foi possivel consultar pedidos. Tente novamente em instantes.</p>';
    return;
  }

  if (!orders.length) {
    orderStatusResult.innerHTML = '<p>Nenhum pedido encontrado para este CPF.</p>';
    return;
  }

  orderStatusResult.innerHTML = orders.map((order) => {
    const items = (order.items || []).map((item) => `${escapeHtml(String(item.quantity))}x ${escapeHtml(item.name)}`).join(', ');
    const statusLabel = getStatusLabel(order.status);
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '';
    return `
      <article class="order-status-card" data-status="${escapeHtml(order.status || 'pending')}">
        <div>
          <span>Pedido #${escapeHtml(order.id)}${dateStr ? ` &mdash; ${dateStr}` : ''}</span>
          <strong>${escapeHtml(statusLabel)}</strong>
        </div>
        <p>${items || 'Itens nao informados'}</p>
        <small>Total: ${formatCurrency(Number(order.total) || 0)}</small>
        ${order.notes ? `<small>Obs: ${escapeHtml(order.notes)}</small>` : ''}
      </article>
    `;
  }).join('');
};

const toggleCart = (open) => {
  cartDrawer.classList.toggle('open', open);
  backdrop.classList.toggle('visible', open);
};

openCart.addEventListener('click', () => toggleCart(true));
closeCart.addEventListener('click', () => toggleCart(false));
backdrop.addEventListener('click', () => toggleCart(false));

checkShipping.addEventListener('click', showShippingStatus);

[checkoutCpf, orderCpfSearch].forEach((input) => {
  input?.addEventListener('input', () => {
    input.value = formatCpf(input.value);
  });
});

// Format phone in cart: accept only digits but display as (DD) NNNNN-NNNN
checkoutPhone?.addEventListener('input', () => {
  checkoutPhone.value = formatPhone(checkoutPhone.value);
  // move cursor to end for smoother typing experience
  try {
    checkoutPhone.setSelectionRange(checkoutPhone.value.length, checkoutPhone.value.length);
  } catch (e) {
    // ignore if not supported
  }
});

orderStatusForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const cpfDigits = onlyDigits(orderCpfSearch.value);
  if (cpfDigits.length !== 11) {
    orderStatusResult.innerHTML = '<p>Digite um CPF valido com 11 numeros.</p>';
    return;
  }
  await renderOrdersByCpf(cpfDigits);
});

checkoutButton.addEventListener('click', async () => {
  if (!Object.keys(cart.items).length) {
    alert('Adicione itens ao carrinho antes de finalizar a compra.');
    return;
  }
  if (!checkoutForm.reportValidity()) {
    return;
  }
  if (onlyDigits(checkoutCpf.value).length !== 11) {
    alert('Digite um CPF valido com 11 numeros.');
    checkoutCpf.focus();
    return;
  }
  if (!cepInput.value.trim() || estimateShipping(cepInput.value) === null) {
    alert('Insira um CEP valido para calcular o frete antes de finalizar.');
    return;
  }
  const order = buildOrder();
  checkoutButton.disabled = true;
  checkoutButton.textContent = 'Enviando...';
  try {
    await saveOrderForAdmin(order);
    alert(`Pedido #${order.id} criado com sucesso! Consulte o andamento usando o CPF informado na secao "Pedidos".`);
    clearCheckout();
    toggleCart(false);
  } catch (error) {
    console.error(error);
    alert('Nao foi possivel registrar o pedido. Verifique sua conexao e tente novamente.');
  } finally {
    checkoutButton.disabled = false;
    checkoutButton.textContent = 'Finalizar compra';
  }
});

const contactForm = document.getElementById('contactForm');
contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();
  if (!name || !email || !message) {
    alert('Por favor, preencha todos os campos antes de enviar.');
    return;
  }
  alert('Mensagem enviada! Em breve responderemos pelo e-mail informado.');
  contactForm.reset();
});

renderCart();
