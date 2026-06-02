import './style.css';

const navToggle = document.getElementById('navToggle');
const mobileNav = document.getElementById('mobileNav');
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
const contactForm = document.getElementById('contactForm');
const filterButtons = document.querySelectorAll('.filter-btn');
const productCards = document.querySelectorAll('.product-card');
const addButtons = document.querySelectorAll('.add-to-cart');

const products = {
  'heavy-hoodie': {
    id: 'heavy-hoodie',
    name: 'Concrete Oversized Hoodie',
    price: 289.9,
  },
  'archive-tee': {
    id: 'archive-tee',
    name: 'Archive Logo Tee',
    price: 129.9,
  },
  'canvas-cap': {
    id: 'canvas-cap',
    name: 'Canvas Low Cap',
    price: 89.9,
  },
  'zip-hoodie': {
    id: 'zip-hoodie',
    name: 'Night Shift Zip Hoodie',
    price: 319.9,
  },
};

const cart = {
  items: {},
  shipping: 0,
};

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const calculateSubtotal = () =>
  Object.values(cart.items).reduce((total, item) => total + item.price * item.quantity, 0);

const updateCartCount = () => {
  const count = Object.values(cart.items).reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = count;
};

const updateTotals = () => {
  const subtotal = calculateSubtotal();
  subtotalValue.textContent = formatCurrency(subtotal);
  shippingValue.textContent = formatCurrency(cart.shipping);
  totalValue.textContent = formatCurrency(subtotal + cart.shipping);
};

const renderCart = () => {
  const items = Object.values(cart.items);

  if (!items.length) {
    cartItemsContainer.innerHTML =
      '<p class="empty-message">Sua sacola esta vazia. Escolha uma peca do drop para comecar.</p>';
    updateCartCount();
    updateTotals();
    return;
  }

  cartItemsContainer.innerHTML = items
    .map(
      (item) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <strong>${item.name}</strong>
            <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          </div>
          <button class="remove-item" type="button" data-id="${item.id}">Remover</button>
        </div>
      `
    )
    .join('');

  document.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', () => {
      delete cart.items[button.dataset.id];
      renderCart();
    });
  });

  updateCartCount();
  updateTotals();
};

const toggleCart = (open) => {
  cartDrawer.classList.toggle('open', open);
  cartDrawer.setAttribute('aria-hidden', String(!open));
  backdrop.classList.toggle('visible', open);
};

const estimateShipping = (cep) => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  const prefix = Number(digits.slice(0, 2));
  if (prefix <= 29) return 18;
  if (prefix <= 59) return 24;
  if (prefix <= 79) return 32;
  return 39;
};

const checkShippingValue = () => {
  const shipping = estimateShipping(cepInput.value);

  if (shipping === null) {
    cart.shipping = 0;
    shippingResult.textContent = 'CEP invalido. Use 8 digitos para estimar.';
    updateTotals();
    return;
  }

  cart.shipping = shipping;
  shippingResult.textContent = `Frete estimado: ${formatCurrency(shipping)}.`;
  updateTotals();
};

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

openCart.addEventListener('click', () => toggleCart(true));
closeCart.addEventListener('click', () => toggleCart(false));
backdrop.addEventListener('click', () => toggleCart(false));

addButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const product = products[button.dataset.id];
    if (!product) return;

    cart.items[product.id] ||= { ...product, quantity: 0 };
    cart.items[product.id].quantity += 1;
    renderCart();
    toggleCart(true);
  });
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    productCards.forEach((card) => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.style.display = visible ? 'grid' : 'none';
    });
  });
});

checkShipping.addEventListener('click', checkShippingValue);

checkoutButton.addEventListener('click', () => {
  if (!Object.keys(cart.items).length) {
    window.alert('Adicione uma peca na sacola antes de finalizar.');
    return;
  }

  if (estimateShipping(cepInput.value) === null) {
    window.alert('Digite um CEP valido para calcular o frete.');
    return;
  }

  window.alert(`Pedido registrado. Total: ${formatCurrency(calculateSubtotal() + cart.shipping)}.`);
  cart.items = {};
  cart.shipping = 0;
  cepInput.value = '';
  shippingResult.textContent = 'Digite o CEP para estimar a entrega.';
  renderCart();
  toggleCart(false);
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  window.alert("Mensagem enviada. A equipe SwagVerse's entra em contato em breve.");
  contactForm.reset();
});

renderCart();
