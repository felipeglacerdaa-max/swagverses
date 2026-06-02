// ===== SUPABASE AUTH =====
const SUPABASE_URL = 'https://nfxwzpkdjzucmpbgbmsp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meHd6cGtkanp1Y21wYmdibXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDAyNDUsImV4cCI6MjA5NTk3NjI0NX0.ZyEe2NIFyzxketUoPPboUSRTxyYK1c4iJ-FgLsyxHTA';

let supabaseClient = null;
let adminManager = null;

function byId(id) {
  return document.getElementById(id);
}

function money(value) {
  return `R$ ${(Number(value) || 0).toFixed(2).replace('.', ',')}`;
}

function loadSupabaseScript() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function requireSupabaseAdmin() {
  await loadSupabaseScript();
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'admin-login.html';
    return null;
  }

  const userName = document.querySelector('.user-name');
  if (userName) userName.textContent = session.user.email || 'Administrador';
  return session;
}

class AdminManager {
  constructor() {
    this.products = this.load('products') || [];
    this.orders = this.load('orders') || [];
    this.promotions = this.load('promotions') || [];
    this.announcements = this.load('announcements') || [];
    this.payments = this.load('payments') || {};
    this.currentTab = 'dashboard';
    this.currentCategory = 'blusa';
    this.currentPaymentFilter = 'all';
    this.init();
  }

  load(key) {
    try {
      const data = localStorage.getItem(`admin_${key}`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  save(key, data) {
    localStorage.setItem(`admin_${key}`, JSON.stringify(data));
  }

  init() {
    this.loadDefaultData();
    this.bindEvents();
    this.syncProductsToMainSite();
    this.updateDashboard();
    this.updateTimestamp();
    setInterval(() => this.updateTimestamp(), 1000);
  }

  bindEvents() {
    document.querySelectorAll('.nav-item').forEach(button => {
      button.addEventListener('click', () => this.switchTab(button.dataset.tab));
    });

    byId('addProductBtn')?.addEventListener('click', () => this.openProductModal());
    byId('productForm')?.addEventListener('submit', event => this.saveProduct(event));
    byId('cancelProductBtn')?.addEventListener('click', () => this.closeModal('productModal'));

    document.querySelectorAll('.category-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.category-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        this.currentCategory = button.dataset.category;
        this.renderProducts();
      });
    });

    byId('stockForm')?.addEventListener('submit', event => this.updateStock(event));
    byId('cancelStockBtn')?.addEventListener('click', () => this.closeModal('stockModal'));
    byId('orderSearch')?.addEventListener('input', event => this.filterOrders(event.target.value));

    byId('addPromotionBtn')?.addEventListener('click', () => this.openPromotionModal());
    byId('promotionForm')?.addEventListener('submit', event => this.savePromotion(event));
    byId('cancelPromotionBtn')?.addEventListener('click', () => this.closeModal('promotionModal'));

    document.querySelectorAll('.payments-filters .filter-btn').forEach(button => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.payments-filters .filter-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        this.currentPaymentFilter = button.dataset.status;
        this.renderPayments();
      });
    });

    byId('paymentForm')?.addEventListener('submit', event => this.savePayment(event));
    byId('cancelPaymentBtn')?.addEventListener('click', () => this.closeModal('paymentModal'));

    byId('addAnnouncementBtn')?.addEventListener('click', () => this.openAnnouncementModal());
    byId('announcementForm')?.addEventListener('submit', event => this.saveAnnouncement(event));
    byId('cancelAnnouncementBtn')?.addEventListener('click', () => this.closeModal('announcementModal'));

    byId('logoutBtn')?.addEventListener('click', () => this.logout());
    byId('closeOrderBtn')?.addEventListener('click', () => this.closeModal('orderModal'));

    document.querySelectorAll('.close').forEach(button => {
      button.addEventListener('click', event => this.closeModal(event.target.closest('.modal')?.id));
    });
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', event => {
        if (event.target === modal) this.closeModal(modal.id);
      });
    });
  }

  loadDefaultData() {
    if (!this.products.length) {
      this.products = [
        { id: '1', name: 'Blusa Oversized Preta', category: 'blusa', description: 'Blusa oversized com modelagem confortavel', image: 'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=600', price: 129.9, stock: 15, createdAt: new Date().toISOString() },
        { id: '2', name: 'Blusa Oversized Branca', category: 'blusa', description: 'Blusa oversized em branco off-white', image: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600', price: 129.9, stock: 12, createdAt: new Date().toISOString() },
        { id: '3', name: 'Jaqueta de Frio', category: 'blusa-frio', description: 'Jaqueta quentinha para dias frios', image: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600', price: 249.9, stock: 8, createdAt: new Date().toISOString() },
        { id: '4', name: 'Bone Snapback', category: 'bone', description: 'Bone em estilo snapback com ajuste livre', image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=600', price: 79.9, stock: 20, createdAt: new Date().toISOString() }
      ];
      this.save('products', this.products);
    }

    if (!this.announcements.length) {
      this.announcements = [
        { id: '1', text: 'Drop 06 liberado', position: '1', active: true },
        { id: '2', text: 'Frete gratis acima de R$ 349', position: '2', active: true },
        { id: '3', text: 'Troca facil em ate 7 dias', position: '3', active: true }
      ];
      this.save('announcements', this.announcements);
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.nav-item').forEach(button => button.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    byId(tabName)?.classList.add('active');

    const titles = {
      dashboard: ['Dashboard', 'Visao geral do seu negocio'],
      products: ['Gerenciar Produtos', 'Adicione, edite ou remova produtos do catalogo'],
      prices: ['Gerenciar Precos', 'Atualize os precos dos produtos'],
      stock: ['Controle de Estoque', 'Monitore e atualize o estoque'],
      orders: ['Pedidos', 'Visualize todas as compras realizadas'],
      promotions: ['Promocoes', 'Gerencie promocoes e ofertas especiais'],
      payments: ['Pagamentos', 'Controle o status de pagamentos'],
      announcements: ['Anuncios', 'Customize os anuncios do site']
    };

    const [title, subtitle] = titles[tabName] || titles.dashboard;
    byId('pageTitle').textContent = title;
    byId('pageSubtitle').textContent = subtitle;
    this.currentTab = tabName;

    const renderers = {
      dashboard: () => { this.reloadOrdersFromStorage(); this.updateDashboard(); },
      products: () => this.renderProducts(),
      prices: () => this.renderPrices(),
      stock: () => this.renderStock(),
      orders: () => { this.reloadOrdersFromStorage(); this.renderOrders(); },
      promotions: () => this.renderPromotions(),
      payments: () => { this.reloadOrdersFromStorage(); this.renderPayments(); },
      announcements: () => this.renderAnnouncements()
    };
    renderers[tabName]?.();
  }

  reloadOrdersFromStorage() {
    const storedOrders = this.load('orders');
    if (storedOrders) this.orders = storedOrders;
    const storedPayments = this.load('payments');
    if (storedPayments) this.payments = storedPayments;
  }

  updateDashboard() {
    byId('totalOrders').textContent = this.orders.length;
    byId('totalRevenue').textContent = money(this.orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0));
    byId('totalStock').textContent = this.products.reduce((sum, product) => sum + (Number(product.stock) || 0), 0);
    byId('pendingPayments').textContent = Object.values(this.payments).filter(payment => payment.status === 'pending').length;
  }

  getCategoryLabel(category) {
    return { blusa: 'Blusa', 'blusa-frio': 'Blusa de Frio', bone: 'Bone', camisa: 'Camisa' }[category] || category;
  }

  getProductImage(product) {
    const image = product.image || '';
    if (image.startsWith('http') || image.startsWith('data:')) {
      return `<img src="${image}" alt="${product.name}">`;
    }
    return `<span>${image || product.name.charAt(0)}</span>`;
  }

  renderProducts() {
    const products = this.products.filter(product => product.category === this.currentCategory);
    byId('productsGrid').innerHTML = products.length ? products.map(product => `
      <div class="product-card">
        <div class="product-image">${this.getProductImage(product)}</div>
        <div class="product-info">
          <div class="product-name">${product.name}</div>
          <div class="product-category">${this.getCategoryLabel(product.category)}</div>
          <div class="product-price">${money(product.price)}</div>
          <div class="product-stock">Estoque: ${product.stock}</div>
          <div class="product-actions">
            <button class="btn btn-primary btn-small" onclick="adminManager.openProductModal('${product.id}')">Editar</button>
            <button class="btn btn-danger btn-small" onclick="adminManager.deleteProduct('${product.id}')">Deletar</button>
          </div>
        </div>
      </div>
    `).join('') : '<div class="empty-state" style="grid-column:1/-1;"><p>Nenhum produto nesta categoria</p></div>';
  }

  openProductModal(productId = null) {
    byId('productForm').reset();
    byId('productId').value = '';
    byId('modalTitle').textContent = productId ? 'Editar Produto' : 'Adicionar Produto';

    const product = this.products.find(item => item.id === productId);
    if (product) {
      byId('productId').value = product.id;
      byId('productName').value = product.name;
      byId('productCategory').value = product.category;
      byId('productDescription').value = product.description || '';
      byId('productImage').value = product.image || '';
      byId('productPrice').value = product.price;
      byId('productStock').value = product.stock;
    }
    this.openModal('productModal');
  }

  saveProduct(event) {
    event.preventDefault();
    const id = byId('productId').value || Date.now().toString();
    const existing = this.products.find(item => item.id === id);
    const product = {
      id,
      name: byId('productName').value,
      category: byId('productCategory').value,
      description: byId('productDescription').value,
      image: byId('productImage').value,
      price: Number(byId('productPrice').value),
      stock: Number(byId('productStock').value),
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    if (existing) this.products = this.products.map(item => item.id === id ? product : item);
    else this.products.push(product);
    this.afterProductsChange();
    this.closeModal('productModal');
    this.renderProducts();
    this.notify('Produto salvo com sucesso.');
  }

  deleteProduct(productId) {
    if (!confirm('Tem certeza que deseja deletar este produto?')) return;
    this.products = this.products.filter(product => product.id !== productId);
    this.afterProductsChange();
    this.renderProducts();
    this.notify('Produto deletado com sucesso.');
  }

  afterProductsChange() {
    this.save('products', this.products);
    this.syncProductsToMainSite();
    this.updateDashboard();
  }

  syncProductsToMainSite() {
    // Sync all products: first 4 map to legacy IDs, rest use their own IDs
    const defaultIds = ['heavy-hoodie', 'archive-tee', 'canvas-cap', 'zip-hoodie'];
    const products = {};
    this.products.forEach((product, index) => {
      const siteId = index < defaultIds.length ? defaultIds[index] : product.id;
      products[siteId] = { ...product, id: siteId };
    });
    localStorage.setItem('mainSiteProducts', JSON.stringify(products));
    localStorage.setItem('mainSiteProductsList', JSON.stringify(this.products));
    window.dispatchEvent(new Event('admin-products-updated'));
  }

  renderPrices() {
    byId('pricesContainer').innerHTML = this.products.map(product => `
      <div class="price-card">
        <div class="price-card-header">
          <div>
            <div class="price-product-name">${product.name}</div>
            <div class="price-product-category">${this.getCategoryLabel(product.category)}</div>
          </div>
        </div>
        <div class="price-current">${money(product.price)}</div>
        <div class="price-input-group">
          <input type="number" id="price-${product.id}" value="${product.price}" step="0.01" placeholder="0.00">
          <button class="btn btn-primary btn-small" onclick="adminManager.updatePrice('${product.id}', document.getElementById('price-${product.id}').value)">Atualizar</button>
        </div>
      </div>
    `).join('');
  }

  updatePrice(productId, value) {
    const product = this.products.find(item => item.id === productId);
    const price = Number(value);
    if (!product || Number.isNaN(price) || price < 0) return alert('Preco invalido');
    product.price = price;
    this.afterProductsChange();
    this.renderPrices();
    this.notify('Preco atualizado com sucesso.');
  }

  renderStock() {
    byId('stockTableBody').innerHTML = this.products.map(product => `
      <tr>
        <td>${product.name}</td>
        <td>${this.getCategoryLabel(product.category)}</td>
        <td>${product.stock}</td>
        <td><button class="btn btn-primary btn-small" onclick="adminManager.openStockModal('${product.id}')">Editar</button></td>
      </tr>
    `).join('');
  }

  openStockModal(productId) {
    const product = this.products.find(item => item.id === productId);
    if (!product) return;
    byId('stockProductId').value = product.id;
    byId('currentStockDisplay').textContent = `${product.stock} unidades`;
    byId('newStockQuantity').value = product.stock;
    this.openModal('stockModal');
  }

  updateStock(event) {
    event.preventDefault();
    const product = this.products.find(item => item.id === byId('stockProductId').value);
    if (!product) return;
    product.stock = Number(byId('newStockQuantity').value);
    this.afterProductsChange();
    this.closeModal('stockModal');
    this.renderStock();
    this.notify('Estoque atualizado com sucesso.');
  }

  renderOrders(orders = this.orders) {
    byId('ordersTableBody').innerHTML = orders.length ? orders.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customerName || 'N/A'}</td>
        <td>${order.email || 'N/A'}</td>
        <td>${order.phone || 'N/A'}</td>
        <td>${order.cpfFormatted || order.cpf || 'N/A'}</td>
        <td>${money(order.total)}</td>
        <td><span class="status-badge status-${this.getOrderStatus(order.id)}">${this.getPaymentStatusLabel(this.getOrderStatus(order.id))}</span></td>
        <td><button class="btn btn-primary btn-small" onclick="adminManager.openOrderModal('${order.id}')">Ver</button></td>
      </tr>
    `).join('') : '<tr><td colspan="8" style="text-align:center;padding:40px;">Nenhum pedido realizado ainda</td></tr>';
  }

  openOrderModal(orderId) {
    const order = this.orders.find(item => item.id === orderId);
    if (!order) return;
    const items = (order.items || []).map(item => `
      <div class="order-item"><span>${item.name}</span><span>Qtd: ${item.quantity} - ${money((item.price || 0) * (item.quantity || 1))}</span></div>
    `).join('');

    byId('orderDetails').innerHTML = `
      ${this.detailRow('ID do Pedido:', `#${order.id}`)}
      ${this.detailRow('Cliente:', order.customerName || 'N/A')}
      ${this.detailRow('Email:', order.email || 'N/A')}
      ${this.detailRow('Telefone:', order.phone || 'N/A')}
      ${this.detailRow('CPF:', order.cpfFormatted || order.cpf || 'N/A')}
      ${this.detailRow('CEP:', order.cep || 'N/A')}
      ${this.detailRow('Endereco:', order.address || 'N/A')}
      ${this.detailRow('Metodo de Pagamento:', order.paymentMethod || 'N/A')}
      ${this.detailRow('Status do Pedido:', this.getPaymentStatusLabel(this.getOrderStatus(order.id)))}
      ${this.detailRow('Total:', money(order.total))}
      <h4>Itens do Pedido:</h4>
      <div class="order-items">${items || 'Nenhum item informado'}</div>
      <div class="order-detail-row" style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border-color);">
        <button class="btn btn-primary" onclick="adminManager.openPaymentModal('${order.id}')">Atualizar Status</button>
      </div>
    `;
    this.openModal('orderModal');
  }

  detailRow(label, value) {
    return `<div class="order-detail-row"><div><span class="order-detail-label">${label}</span></div><div><span class="order-detail-value">${value}</span></div></div>`;
  }

  filterOrders(searchTerm) {
    const term = searchTerm.toLowerCase();
    this.renderOrders(this.orders.filter(order =>
      String(order.id).includes(searchTerm) ||
      (order.customerName || '').toLowerCase().includes(term) ||
      (order.email || '').toLowerCase().includes(term) ||
      (order.phone || '').includes(searchTerm) ||
      (order.cpf || '').includes(searchTerm.replace(/\D/g, '')) ||
      (order.cpfFormatted || '').includes(searchTerm)
    ));
  }

  renderPromotions() {
    byId('promotionsGrid').innerHTML = this.promotions.length ? this.promotions.map(promo => `
      <div class="promotion-card">
        <div class="promotion-image">${this.getInlineImage(promo.image, promo.title)}</div>
        <div class="promotion-content">
          <div class="promotion-title">${promo.title}</div>
          <div class="promotion-date">${promo.startDate || '-'} ate ${promo.endDate || '-'}</div>
          <div class="promotion-status ${promo.active ? '' : 'inactive'}">${promo.active ? 'Ativa' : 'Inativa'}</div>
          <div class="promotion-actions">
            <button class="btn btn-primary btn-small" onclick="adminManager.openPromotionModal('${promo.id}')">Editar</button>
            <button class="btn btn-danger btn-small" onclick="adminManager.deletePromotion('${promo.id}')">Deletar</button>
          </div>
        </div>
      </div>
    `).join('') : '<div class="empty-state" style="grid-column:1/-1;"><p>Nenhuma promocao cadastrada</p></div>';
  }

  openPromotionModal(id = null) {
    byId('promotionForm').reset();
    byId('promotionId').value = '';
    byId('promotionActive').checked = true;
    byId('promotionModalTitle').textContent = id ? 'Editar Promocao' : 'Adicionar Promocao';
    const promo = this.promotions.find(item => item.id === id);
    if (promo) {
      byId('promotionId').value = promo.id;
      byId('promotionTitle').value = promo.title;
      byId('promotionDescription').value = promo.description || '';
      byId('promotionImage').value = promo.image || '';
      byId('promotionStartDate').value = promo.startDate || '';
      byId('promotionEndDate').value = promo.endDate || '';
      byId('promotionActive').checked = Boolean(promo.active);
    }
    this.openModal('promotionModal');
  }

  savePromotion(event) {
    event.preventDefault();
    const id = byId('promotionId').value || Date.now().toString();
    const promo = {
      id,
      title: byId('promotionTitle').value,
      description: byId('promotionDescription').value,
      image: byId('promotionImage').value,
      startDate: byId('promotionStartDate').value,
      endDate: byId('promotionEndDate').value,
      active: byId('promotionActive').checked
    };
    this.promotions = this.promotions.some(item => item.id === id)
      ? this.promotions.map(item => item.id === id ? promo : item)
      : [...this.promotions, promo];
    this.save('promotions', this.promotions);
    this.closeModal('promotionModal');
    this.renderPromotions();
    this.notify('Promocao salva com sucesso.');
  }

  deletePromotion(id) {
    if (!confirm('Tem certeza que deseja deletar esta promocao?')) return;
    this.promotions = this.promotions.filter(item => item.id !== id);
    this.save('promotions', this.promotions);
    this.renderPromotions();
    this.notify('Promocao deletada com sucesso.');
  }

  renderPayments() {
    let rows = this.orders.map(order => ({ ...order, status: this.getOrderStatus(order.id) }));
    if (this.currentPaymentFilter !== 'all') rows = rows.filter(order => order.status === this.currentPaymentFilter);

    byId('paymentsTableBody').innerHTML = rows.length ? rows.map(order => `
      <tr>
        <td>#${order.id}</td>
        <td>${order.customerName || 'N/A'}</td>
        <td>${order.cpfFormatted || order.cpf || 'N/A'}</td>
        <td>${money(order.total)}</td>
        <td>${order.paymentMethod || 'N/A'}</td>
        <td><span class="status-badge status-${order.status}">${this.getPaymentStatusLabel(order.status)}</span></td>
        <td><button class="btn btn-primary btn-small" onclick="adminManager.openPaymentModal('${order.id}')">Editar</button></td>
      </tr>
    `).join('') : '<tr><td colspan="7" style="text-align:center;padding:40px;">Nenhum pagamento encontrado</td></tr>';
  }

  getOrderStatus(orderId) {
    return this.payments[orderId]?.status || 'pending';
  }

  getPaymentStatusLabel(status) {
    return {
      pending: 'Aguardando',
      paid: 'Pago',
      preparing: 'Em Separacao',
      shipped: 'Enviado',
      delivered: 'Entregue',
      failed: 'Falha'
    }[status] || status;
  }

  openPaymentModal(orderId) {
    byId('paymentOrderId').value = orderId;
    byId('paymentStatus').value = this.getOrderStatus(orderId);
    byId('paymentNotes').value = this.payments[orderId]?.notes || '';
    this.openModal('paymentModal');
  }

  savePayment(event) {
    event.preventDefault();
    const orderId = byId('paymentOrderId').value;
    this.payments[orderId] = {
      status: byId('paymentStatus').value,
      notes: byId('paymentNotes').value,
      updatedAt: new Date().toISOString()
    };
    this.save('payments', this.payments);
    this.closeModal('paymentModal');
    this.renderPayments();
    this.renderOrders();
    this.updateDashboard();
    this.notify('Status de pagamento atualizado.');
  }

  renderAnnouncements() {
    byId('announcementsContainer').innerHTML = this.announcements.map(announcement => `
      <div class="announcement-card ${announcement.active ? '' : 'inactive'}">
        <div class="announcement-text">${announcement.text}</div>
        <div class="announcement-position">Posicao: ${announcement.position}</div>
        <div class="announcement-status ${announcement.active ? '' : 'inactive'}">${announcement.active ? 'Ativo' : 'Inativo'}</div>
        <div class="announcement-actions">
          <button class="btn btn-primary btn-small" onclick="adminManager.openAnnouncementModal('${announcement.id}')">Editar</button>
          <button class="btn btn-danger btn-small" onclick="adminManager.deleteAnnouncement('${announcement.id}')">Deletar</button>
        </div>
      </div>
    `).join('');
  }

  openAnnouncementModal(id = null) {
    byId('announcementForm').reset();
    byId('announcementId').value = '';
    byId('announcementActive').checked = true;
    byId('announcementModalTitle').textContent = id ? 'Editar Anuncio' : 'Adicionar Anuncio';
    const announcement = this.announcements.find(item => item.id === id);
    if (announcement) {
      byId('announcementId').value = announcement.id;
      byId('announcementText').value = announcement.text;
      byId('announcementPosition').value = announcement.position;
      byId('announcementActive').checked = Boolean(announcement.active);
    }
    this.openModal('announcementModal');
  }

  saveAnnouncement(event) {
    event.preventDefault();
    const id = byId('announcementId').value || Date.now().toString();
    const announcement = {
      id,
      text: byId('announcementText').value,
      position: byId('announcementPosition').value,
      active: byId('announcementActive').checked
    };
    this.announcements = this.announcements.some(item => item.id === id)
      ? this.announcements.map(item => item.id === id ? announcement : item)
      : [...this.announcements, announcement];
    this.save('announcements', this.announcements);
    this.closeModal('announcementModal');
    this.renderAnnouncements();
    this.notify('Anuncio salvo com sucesso.');
  }

  deleteAnnouncement(id) {
    if (!confirm('Tem certeza que deseja deletar este anuncio?')) return;
    this.announcements = this.announcements.filter(item => item.id !== id);
    this.save('announcements', this.announcements);
    this.renderAnnouncements();
    this.notify('Anuncio deletado com sucesso.');
  }

  getInlineImage(image, label) {
    if (image && (image.startsWith('http') || image.startsWith('data:'))) {
      return `<img src="${image}" alt="${label}">`;
    }
    return image || label?.charAt(0) || '';
  }

  updateTimestamp() {
    const now = new Date();
    byId('timestamp').textContent = `${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${now.toLocaleDateString('pt-BR')}`;
  }

  openModal(id) {
    byId(id)?.classList.add('show');
  }

  closeModal(id) {
    if (id) byId(id)?.classList.remove('show');
  }

  notify(message) {
    const notification = document.createElement('div');
    notification.className = 'success-message show';
    notification.textContent = message;
    notification.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2500);
  }

  async logout() {
    if (!confirm('Tem certeza que deseja sair?')) return;
    await supabaseClient?.auth.signOut();
    window.location.href = 'admin-login.html';
  }

  addOrder(orderData) {
    const order = { id: Date.now().toString(), ...orderData };
    this.orders.push(order);
    this.save('orders', this.orders);
    this.payments[order.id] = { status: 'pending', notes: '' };
    this.save('payments', this.payments);
    this.updateDashboard();
    return order;
  }
}

async function initializeAdminPage() {
  try {
    const session = await requireSupabaseAdmin();
    if (!session) return;
    adminManager = new AdminManager();
    window.adminManager = adminManager;
  } catch (error) {
    console.error('Erro ao validar login Supabase:', error);
    window.location.href = 'admin-login.html';
  }
}

window.addSampleOrder = function addSampleOrder() {
  if (!adminManager) return;
  adminManager.addOrder({
    customerName: 'Joao Silva',
    email: 'joao@example.com',
    phone: '(11) 98765-4321',
    cep: '01234-567',
    address: 'Rua Teste, 123 - Sao Paulo, SP',
    paymentMethod: 'Cartao de Credito',
    total: 499.8,
    items: [
      { name: 'Blusa Oversized Preta', quantity: 1, price: 129.9 },
      { name: 'Jaqueta de Frio', quantity: 1, price: 249.9 },
      { name: 'Bone Snapback', quantity: 1, price: 79.9 }
    ]
  });
};

window.submitOrder = function submitOrder(orderData) {
  if (!adminManager) return null;
  return adminManager.addOrder(orderData);
};

initializeAdminPage();
