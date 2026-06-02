const navToggle = document.getElementById('navToggle');
const mobileNav = document.createElement('div');
mobileNav.className = 'mobile-nav hidden';
mobileNav.innerHTML = `
  <a href="#collections">Coleções</a>
  <a href="#featured">Destaques</a>
  <a href="#about">Sobre</a>
  <a href="#contact">Contato</a>
`;
document.body.appendChild(mobileNav);

navToggle.addEventListener('click', () => {
  const isOpen = !mobileNav.classList.contains('hidden');
  mobileNav.classList.toggle('hidden', isOpen);
  navToggle.setAttribute('aria-label', isOpen ? 'Abrir menu' : 'Fechar menu');
});

const filterButtons = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');
const cartButtons = document.querySelectorAll('.add-to-cart');
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

const products = {
  'swag-core': { id: 'swag-core', name: 'Hoodie Swag Core', price: 239.9 },
  'pulse': { id: 'pulse', name: 'Camiseta Pulse', price: 99.9 },
  'snapback-vibe': { id: 'snapback-vibe', name: 'Snapback Vibe', price: 79.9 },
  'neon-wave': { id: 'neon-wave', name: 'Hoodie Neon Wave', price: 249.9 }
};

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
    cartItemsContainer.innerHTML = '<p class="empty-message">Seu carrinho está vazio. Adicione um item para começar.</p>';
    updateCartCount();
    updateTotals();
    return;
  }

  cartItemsContainer.innerHTML = items.map((item) => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-info">
        <strong>${item.name}</strong>
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
    shippingResult.textContent = 'CEP inválido. Digite 8 dígitos para calcular.';
    cart.shipping = 0;
  } else {
    cart.shipping = shippingCost;
    const formattedCep = cepValue.replace(/(\d{5})(\d{3})/, '$1-$2');
    shippingResult.textContent = `Frete estimado de ${formatCurrency(shippingCost)} para CEP ${formattedCep}.`;
  }
  updateTotals();
};

const toggleCart = (open) => {
  cartDrawer.classList.toggle('open', open);
  backdrop.classList.toggle('hidden', !open);
};

openCart.addEventListener('click', () => toggleCart(true));
closeCart.addEventListener('click', () => toggleCart(false));
backdrop.addEventListener('click', () => toggleCart(false));

cartButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.id;
    const product = products[id];
    if (!product) return;
    cart.items[id] = cart.items[id] || { ...product, quantity: 0 };
    cart.items[id].quantity += 1;
    renderCart();
    toggleCart(true);
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    const filterValue = button.dataset.filter;
    productCards.forEach((card) => {
      const matches = filterValue === 'all' || card.dataset.category === filterValue;
      card.style.display = matches ? 'grid' : 'none';
    });
  });
});

checkShipping.addEventListener('click', showShippingStatus);

checkoutButton.addEventListener('click', () => {
  if (!Object.keys(cart.items).length) {
    alert('Adicione itens ao carrinho antes de finalizar a compra.');
    return;
  }
  if (!cepInput.value.trim() || estimateShipping(cepInput.value) === null) {
    alert('Insira um CEP válido para calcular o frete antes de finalizar.');
    return;
  }
  alert(`Compra finalizada! Total de ${formatCurrency(calculateSubtotal() + cart.shipping)}.`);
  cart.items = {};
  cart.shipping = 0;
  renderCart();
  cepInput.value = '';
  shippingResult.textContent = 'Insira o CEP para estimar o frete.';
});

newsletterForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('newsletterEmail').value.trim();
  if (!email) return;
  alert(`Obrigado! Em breve enviaremos as novidades para ${email}.`);
  newsletterForm.reset();
});

contactForm.addEventListener('submit', (event) => {
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
