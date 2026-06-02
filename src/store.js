const STORE_KEYS = {
  products: 'swagverses.products',
  content: 'swagverses.content',
  inventory: 'swagverses.inventory',
  orders: 'swagverses.orders',
};

export const defaultProducts = [
  {
    id: 'heavy-hoodie',
    type: 'blusa de frio',
    category: 'hoodie',
    label: 'Heavy hoodie',
    name: 'Concrete Oversized Hoodie',
    price: 289.9,
    variant: 'Preto lavado',
    image:
      'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'archive-tee',
    type: 'camisa',
    category: 'tee',
    label: 'Graphic tee',
    name: 'Archive Logo Tee',
    price: 129.9,
    variant: 'Off-white',
    image:
      'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'canvas-cap',
    type: 'bone',
    category: 'accessory',
    label: 'Cap',
    name: 'Canvas Low Cap',
    price: 89.9,
    variant: 'Oliva seco',
    image:
      'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
  {
    id: 'zip-hoodie',
    type: 'blusa de frio',
    category: 'hoodie',
    label: 'Zip hoodie',
    name: 'Night Shift Zip Hoodie',
    price: 319.9,
    variant: 'Grafite',
    image:
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    active: true,
  },
];

export const defaultInventory = [
  { id: crypto.randomUUID(), productId: 'heavy-hoodie', size: 'P', color: 'Preto lavado', quantity: 8 },
  { id: crypto.randomUUID(), productId: 'heavy-hoodie', size: 'M', color: 'Preto lavado', quantity: 12 },
  { id: crypto.randomUUID(), productId: 'archive-tee', size: 'G', color: 'Off-white', quantity: 18 },
  { id: crypto.randomUUID(), productId: 'canvas-cap', size: 'Unico', color: 'Oliva seco', quantity: 10 },
];

export const defaultContent = {
  announcement1: 'Drop 06 liberado',
  announcement2: 'Frete gratis acima de R$ 349',
  announcement3: 'Troca facil em ate 7 dias',
  heroEyebrow: 'Streetwear brasileiro / pecas limitadas',
  heroTitle: 'Roupa de rua com peso, corte e presenca.',
  heroText:
    'Essenciais oversized, camisetas graficas e acessorios em uma direcao visual mais limpa: urbano, premium e sem exagero.',
  heroImage:
    'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1400&q=80',
  heroLabel: 'Drop atual',
  heroDrop: 'Concrete Season',
  shopEyebrow: 'Shop the drop',
  shopTitle: 'Pecas prontas para montar o fit.',
  drop1Title: 'Modelagem oversized',
  drop1Text: 'Caimento amplo, ombro deslocado e tecido com estrutura.',
  drop2Title: 'Paleta neutra',
  drop2Text: 'Preto lavado, concreto, off-white, grafite e oliva seco.',
  drop3Title: 'Drop limitado',
  drop3Text: 'Reposicao curta para manter exclusividade nas combinacoes.',
  editorialEyebrow: 'Editorial',
  editorialTitle: 'Menos efeito. Mais textura, proporcao e atitude.',
  editorialText:
    'A colecao foi pensada para parecer roupa que voce realmente usaria na rua: base neutra, silhueta relaxada, grafismos pontuais e acabamento suficiente para vender como marca seria.',
  galleryMain:
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=80',
  gallerySide:
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80',
  lookbookLine: "SwagVerse's / Concrete Season / Drop 06 / Sao Paulo",
  lookbookTitle: 'Essenciais para quem prefere estilo direto, sem barulho visual.',
  contactPhone: '+55 11 9XXXX-XXXX',
  contactEmail: 'contato@swagverses.com',
  contactInstagram: '@swagverses',
};

const read = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('swagverses:data-change', { detail: { key } }));
};

export const getProducts = () => read(STORE_KEYS.products, defaultProducts);
export const saveProducts = (products) => write(STORE_KEYS.products, products);

export const getContent = () => read(STORE_KEYS.content, defaultContent);
export const saveContent = (content) => write(STORE_KEYS.content, content);

export const getInventory = () => read(STORE_KEYS.inventory, defaultInventory);
export const saveInventory = (inventory) => write(STORE_KEYS.inventory, inventory);

export const getOrders = () => read(STORE_KEYS.orders, []);
export const saveOrders = (orders) => write(STORE_KEYS.orders, orders);

export const addOrder = (order) => saveOrders([order, ...getOrders()]);

export const resetStore = () => {
  saveProducts(defaultProducts);
  saveContent(defaultContent);
  saveInventory(defaultInventory);
  saveOrders([]);
};

export const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
