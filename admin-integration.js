/* ===== EXEMPLO DE INTEGRAÇÃO - ADMIN COM SITE PRINCIPAL ===== */
/* @deprecated Use src/supabase-client.js — dados 100% na nuvem (Supabase). */

/**
 * Este arquivo mostra exemplos de como integrar a página de administração
 * com o sistema de compras do seu site principal.
 * 
 * Copie e adapte as funções conforme necessário.
 */

// ===== EXEMPLO 1: Integração Básica no Checkout =====

/**
 * Função para ser chamada quando o pedido é completado
 * Integre isso com seu formulário de checkout
 */
function integrateCheckoutWithAdmin() {
  // Quando o cliente clica em "Confirmar Pedido" ou "Finalizar Compra"
  
  // 1. Coletar dados do carrinho
  const cartItems = getCartItems(); // Função que retorna itens do carrinho
  
  // 2. Coletar dados do cliente (formulário)
  const customerName = document.getElementById('customerName').value;
  const customerEmail = document.getElementById('customerEmail').value;
  const customerPhone = document.getElementById('customerPhone').value;
  const customerCEP = document.getElementById('customerCEP').value;
  const customerAddress = document.getElementById('customerAddress').value;
  const paymentMethod = document.getElementById('paymentMethod').value;
  
  // 3. Calcular total
  const subtotal = calculateSubtotal(cartItems);
  const shipping = calculateShipping(customerCEP);
  const total = subtotal + shipping;
  
  // 4. Criar objeto de pedido
  const orderData = {
    customerName: customerName,
    email: customerEmail,
    phone: customerPhone,
    cep: customerCEP,
    address: customerAddress,
    paymentMethod: paymentMethod,
    total: total,
    items: cartItems.map(item => ({
      name: item.productName,
      quantity: item.quantity,
      price: item.price
    }))
  };
  
  // 5. Enviar para o ADM
  if (window.submitOrder) {
    window.submitOrder(orderData);
    console.log('Pedido enviado para o painel administrativo');
  }
  
  // 6. Limpar carrinho
  clearCart();
  
  // 7. Redirecionar ou mostrar confirmação
  alert('Pedido realizado com sucesso! Número: ' + Date.now());
}

// ===== EXEMPLO 2: Atualizar Produtos no Site =====

/**
 * Função para sincronizar produtos do ADM com o site principal
 */
function syncProductsFromAdmin() {
  // Buscar produtos armazenados no ADM
  const adminProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
  
  // Renderizar produtos no site
  const productsContainer = document.getElementById('productsContainer');
  
  adminProducts.forEach(product => {
    if (product.stock > 0) { // Apenas mostrar produtos em estoque
      const productElement = createProductElement(product);
      productsContainer.appendChild(productElement);
    }
  });
}

function createProductElement(product) {
  const div = document.createElement('div');
  div.className = 'product-card';
  div.innerHTML = `
    <div class="product-image">${product.image || '👕'}</div>
    <h3>${product.name}</h3>
    <p>${product.description}</p>
    <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
    <p class="stock">Estoque: ${product.stock} unidades</p>
    <button onclick="addToCart('${product.id}', '${product.name}', ${product.price})">
      Adicionar ao Carrinho
    </button>
  `;
  return div;
}

// ===== EXEMPLO 3: Sistema de Carrinho Integrado =====

/**
 * Função para adicionar produto ao carrinho
 * com validação de estoque do ADM
 */
function addToCartWithStockValidation(productId, quantity) {
  // Buscar produtos do ADM
  const adminProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
  const product = adminProducts.find(p => p.id === productId);
  
  if (!product) {
    alert('Produto não encontrado');
    return;
  }
  
  if (product.stock < quantity) {
    alert(`Desculpe! Apenas ${product.stock} unidades disponíveis`);
    return;
  }
  
  // Adicionar ao carrinho local
  const cart = getOrCreateCart();
  const existingItem = cart.items.find(i => i.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity + quantity > product.stock) {
      alert(`Desculpe! Máximo de ${product.stock} unidades disponíveis`);
      return;
    }
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      id: productId,
      productName: product.name,
      price: product.price,
      quantity: quantity
    });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartDisplay();
}

// ===== EXEMPLO 4: Atualizar Preços Dinamicamente =====

/**
 * Função para atualizar preços em tempo real
 * Útil quando preços mudam no ADM
 */
function updateProductPrices() {
  const adminProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
  
  adminProducts.forEach(product => {
    const priceElement = document.querySelector(`[data-product-id="${product.id}"] .price`);
    if (priceElement) {
      priceElement.textContent = `R$ ${product.price.toFixed(2).replace('.', ',')}`;
    }
  });
}

// Atualizar preços a cada 5 minutos
setInterval(updateProductPrices, 5 * 60 * 1000);

// ===== EXEMPLO 5: Validar Disponibilidade no Checkout =====

/**
 * Função para validar se todos os itens do carrinho
 * ainda estão em estoque antes de finalizar a compra
 */
function validateCartBeforeCheckout() {
  const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
  const adminProducts = JSON.parse(localStorage.getItem('admin_products')) || [];
  
  for (const cartItem of cart.items) {
    const product = adminProducts.find(p => p.id === cartItem.id);
    
    if (!product) {
      alert(`Produto "${cartItem.productName}" não foi encontrado`);
      return false;
    }
    
    if (product.stock < cartItem.quantity) {
      alert(
        `Desculpe! "${product.name}" possui apenas ${product.stock} ` +
        `unidades disponíveis, mas você tem ${cartItem.quantity} no carrinho.`
      );
      return false;
    }
  }
  
  return true;
}

// ===== EXEMPLO 6: Integrar com Promoções do ADM =====

/**
 * Função para aplicar promoções cadastradas no ADM
 */
function getActivePromotions() {
  const promotions = JSON.parse(localStorage.getItem('admin_promotions')) || [];
  const today = new Date();
  
  return promotions.filter(promo => {
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    return promo.active && today >= startDate && today <= endDate;
  });
}

function displayPromotions() {
  const promotions = getActivePromotions();
  const container = document.getElementById('promotionsSection');
  
  if (promotions.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  container.innerHTML = promotions.map(promo => `
    <div class="promotion-banner">
      <h3>${promo.title}</h3>
      <p>${promo.description}</p>
      <img src="${promo.image}" alt="${promo.title}" />
    </div>
  `).join('');
}

// Mostrar promoções ao carregar a página
document.addEventListener('DOMContentLoaded', displayPromotions);

// ===== EXEMPLO 7: Anúncios Dinâmicos =====

/**
 * Função para mostrar anúncios cadastrados no ADM
 */
function updateAnnouncements() {
  const announcements = JSON.parse(localStorage.getItem('admin_announcements')) || [];
  
  // Atualizar cada posição de anúncio
  [1, 2, 3].forEach(position => {
    const announcement = announcements.find(a => a.position === position.toString() && a.active);
    const element = document.getElementById(`announcement${position}`);
    
    if (element && announcement) {
      element.textContent = announcement.text;
    }
  });
}

// Atualizar anúncios ao carregar
updateAnnouncements();

// Atualizar anúncios a cada 30 segundos
setInterval(updateAnnouncements, 30000);

// ===== EXEMPLO 8: Status de Pagamento =====

/**
 * Função para verificar status de pagamento de um pedido
 */
function checkPaymentStatus(orderId) {
  const payments = JSON.parse(localStorage.getItem('admin_payments')) || {};
  const paymentStatus = payments[orderId];
  
  if (!paymentStatus) {
    return { status: 'pending', notes: '' };
  }
  
  return paymentStatus;
}

function displayPaymentStatus(orderId) {
  const payment = checkPaymentStatus(orderId);
  const statusTexts = {
    'pending': 'Aguardando confirmação de pagamento...',
    'paid': 'Pagamento confirmado! ✓',
    'failed': 'Houve um problema com seu pagamento. Por favor, contate o suporte.'
  };
  
  const container = document.getElementById('paymentStatusContainer');
  if (container) {
    container.innerHTML = `
      <p class="status-${payment.status}">
        ${statusTexts[payment.status]}
      </p>
      ${payment.notes ? `<p class="notes">${payment.notes}</p>` : ''}
    `;
  }
}

// ===== EXEMPLO 9: Sincronização em Tempo Real =====

/**
 * Ouvir mudanças no localStorage (para múltiplas abas)
 */
window.addEventListener('storage', (event) => {
  if (event.key === 'admin_products') {
    // Produtos foram atualizados no ADM
    syncProductsFromAdmin();
  } else if (event.key === 'admin_announcements') {
    // Anúncios foram atualizados
    updateAnnouncements();
  } else if (event.key === 'admin_promotions') {
    // Promoções foram atualizadas
    displayPromotions();
  } else if (event.key === 'admin_payments') {
    // Status de pagamento foi atualizado
    const orderId = localStorage.getItem('currentOrderId');
    if (orderId) {
      displayPaymentStatus(orderId);
    }
  }
});

// ===== EXEMPLO 10: Funções Auxiliares =====

function getCartItems() {
  const cart = JSON.parse(localStorage.getItem('cart')) || { items: [] };
  return cart.items;
}

function calculateSubtotal(items) {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function calculateShipping(cep) {
  // Exemplo simples - implemente sua lógica de frete
  if (!cep) return 0;
  // Frete baseado em CEP (exemplo)
  if (cep.substring(0, 5) === '01234') {
    return 15.00; // São Paulo
  }
  return 25.00; // Padrão
}

function clearCart() {
  localStorage.removeItem('cart');
}

function getOrCreateCart() {
  let cart = JSON.parse(localStorage.getItem('cart'));
  if (!cart) {
    cart = { items: [] };
  }
  return cart;
}

function updateCartDisplay() {
  const cart = getOrCreateCart();
  const cartCount = document.getElementById('cartCount');
  if (cartCount) {
    cartCount.textContent = cart.items.length;
  }
}

// ===== EXEMPLO DE USO NO HTML =====

/*
<!-- Adicionar no seu checkout.html ou página de carrinho -->

<div id="promotionsSection"></div>

<form onsubmit="event.preventDefault(); if(validateCartBeforeCheckout()) { integrateCheckoutWithAdmin(); }">
  <input type="text" id="customerName" placeholder="Nome Completo" required>
  <input type="email" id="customerEmail" placeholder="Email" required>
  <input type="tel" id="customerPhone" placeholder="Telefone" required>
  <input type="text" id="customerCEP" placeholder="CEP" required>
  <input type="text" id="customerAddress" placeholder="Endereço Completo" required>
  
  <select id="paymentMethod" required>
    <option value="">Selecione um método de pagamento</option>
    <option value="Cartão de Crédito">Cartão de Crédito</option>
    <option value="Boleto">Boleto</option>
    <option value="PIX">PIX</option>
  </select>
  
  <button type="submit">Confirmar Pedido</button>
</form>

<div id="paymentStatusContainer"></div>
*/

// ===== IMPORTAR ESTE ARQUIVO NO HTML =====
/*
<script src="admin-integration.js"></script>
*/
