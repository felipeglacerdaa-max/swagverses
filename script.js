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

const filterButtons = document.querySelectorAll('.filter-btn');
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

const isImageUrl = (value = '') => /^(https?:\/\/|data:image\/)/i.test(String(value).trim());

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key, value) => localStorage.setItem(key, JSON.stringify(value));

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
  'heavy-hoodie': { id: 'heavy-hoodie', name: 'Hoodie Swag Core', price: 239.9, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80', description: 'Modelagem oversized, tecido pesado.' },
  'archive-tee': { id: 'archive-tee', name: 'Camiseta Pulse', price: 99.9, image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80', description: 'Grafico exclusivo drop 06.' },
  'canvas-cap': { id: 'canvas-cap', name: 'Snapback Vibe', price: 79.9, image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80', description: 'Ajuste snapback, aba plana.' },
  'zip-hoodie': { id: 'zip-hoodie', name: 'Hoodie Neon Wave', price: 249.9, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', description: 'Ziper duplo, silhueta relaxada.' }
};

// Inicializar produtos com os padroes
const products = { ...defaultProducts };

// Funcao para carregar produtos do admin (substitui produtos padrao pelas versoes do admin)
function loadAdminPrices() {
  const adminProducts = localStorage.getItem('mainSiteProducts');
  if (adminProducts) {
    try {
      const adminData = JSON.parse(adminProducts);
      // Limpar e recarregar todos os produtos do admin
      Object.keys(products).forEach(id => delete products[id]);
      Object.keys(adminData).forEach(id => {
        const p = adminData[id];
        products[id] = {
          id: id,
          name: p.name || 'Produto',
          price: Number(p.price) || 0,
          image: p.image || '',
          description: p.description || '',
          category: p.category || 'all'
        };
      });
      console.log('✅ Produtos carregados do admin panel');
    } catch (e) {
      console.log('Info: Usando produtos padrao');
    }
  }
}

// Carregar produtos na inicializacao
loadAdminPrices();

// Recarregar produtos quando admin os atualizar
window.addEventListener('admin-products-updated', () => {
  loadAdminPrices();
  console.log('🔄 Produtos atualizados do admin panel');
  renderProductGrid();
});

// Renderizar grid de produtos
function renderProductGrid() {
  const productGrid = document.getElementById('productGrid');
  if (!productGrid) return;

  const productsArray = Object.values(products);

  if (!productsArray.length) {
    productGrid.innerHTML = '<p style="padding:40px 32px;color:var(--muted);">Nenhum produto cadastrado ainda.</p>';
    return;
  }

  productGrid.innerHTML = productsArray.map(product => `
    <article class="product-card" data-category="${escapeHtml(product.category || 'all')}">
      <div class="product-image">${renderProductImage(product)}</div>
      <div class="product-content">
        <h3>${escapeHtml(product.name)}</h3>
        <p class="product-price">R$ ${(Number(product.price) || 0).toFixed(2).replace('.', ',')}</p>
        <p class="product-description">${escapeHtml(product.description || '')}</p>
        <button class="quick-add add-to-cart" type="button" data-id="${escapeHtml(product.id)}">Adicionar</button>
      </div>
    </article>
  `).join('');

  // Reattach event listeners to new buttons
  attachCartButtonListeners();
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

// Renderizar produtos na inicializacao
document.addEventListener('DOMContentLoaded', () => {
  renderProductGrid();
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
    phone: checkoutPhone.value.trim(),
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

const saveOrderForAdmin = (order) => {
  const orders = readStorage('admin_orders', []);
  writeStorage('admin_orders', [order, ...orders]);

  const payments = readStorage('admin_payments', {});
  payments[order.id] = {
    status: 'pending',
    notes: 'Pedido recebido pela loja.',
    updatedAt: new Date().toISOString()
  };
  writeStorage('admin_payments', payments);
};

const clearCheckout = () => {
  cart.items = {};
  cart.shipping = 0;
  renderCart();
  checkoutForm.reset();
  cepInput.value = '';
  shippingResult.textContent = 'Insira o CEP para estimar o frete.';
};

const renderOrdersByCpf = (cpfDigits) => {
  const orders = readStorage('admin_orders', [])
    .filter((order) => onlyDigits(order.cpf || order.cpfFormatted) === cpfDigits);
  const payments = readStorage('admin_payments', {});

  if (!orders.length) {
    orderStatusResult.innerHTML = '<p>Nenhum pedido encontrado para este CPF.</p>';
    return;
  }

  orderStatusResult.innerHTML = orders.map((order) => {
    const payment = payments[order.id] || { status: 'pending', notes: '' };
    const items = (order.items || []).map((item) => `${escapeHtml(String(item.quantity))}x ${escapeHtml(item.name)}`).join(', ');
    const statusLabel = getStatusLabel(payment.status);
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : '';
    return `
      <article class="order-status-card" data-status="${escapeHtml(payment.status || 'pending')}">
        <div>
          <span>Pedido #${escapeHtml(order.id)}${dateStr ? ` &mdash; ${dateStr}` : ''}</span>
          <strong>${escapeHtml(statusLabel)}</strong>
        </div>
        <p>${items || 'Itens nao informados'}</p>
        <small>Total: ${formatCurrency(Number(order.total) || 0)}</small>
        ${payment.notes ? `<small>Obs: ${escapeHtml(payment.notes)}</small>` : ''}
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

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    const filterValue = button.dataset.filter;
    document.querySelectorAll('.product-card').forEach((card) => {
      const matches = filterValue === 'all' || card.dataset.category === filterValue;
      card.style.display = matches ? '' : 'none';
    });
  });
});

checkShipping.addEventListener('click', showShippingStatus);

[checkoutCpf, orderCpfSearch].forEach((input) => {
  input?.addEventListener('input', () => {
    input.value = formatCpf(input.value);
  });
});

orderStatusForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const cpfDigits = onlyDigits(orderCpfSearch.value);
  if (cpfDigits.length !== 11) {
    orderStatusResult.innerHTML = '<p>Digite um CPF valido com 11 numeros.</p>';
    return;
  }
  renderOrdersByCpf(cpfDigits);
});

checkoutButton.addEventListener('click', () => {
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
  saveOrderForAdmin(order);
  alert(`Pedido #${order.id} criado com sucesso! Consulte o andamento usando o CPF informado na secao "Pedidos".`);
  clearCheckout();
  toggleCart(false);
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
