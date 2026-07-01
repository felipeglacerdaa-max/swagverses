import { DEFAULT_FEATURED_SECTION, normalizeProductForSite, toShopCategory } from './catalog.js';
import { buildProductImagePath, fileToDataUrl } from './product-image-utils.js';

export const SUPABASE_URL = 'https://nfxwzpkdjzucmpbgbmsp.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5meHd6cGtkanp1Y21wYmdibXNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDAyNDUsImV4cCI6MjA5NTk3NjI0NX0.ZyEe2NIFyzxketUoPPboUSRTxyYK1c4iJ-FgLsyxHTA';

let clientPromise = null;

export function loadSupabaseScript() {
  return new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export async function getSupabaseClient() {
  if (!clientPromise) {
    clientPromise = loadSupabaseScript().then(() =>
      window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    );
  }
  return clientPromise;
}

// ——— Produtos ———

export function rowToAdminProduct(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.admin_category,
    adminCategory: row.admin_category,
    description: row.description || '',
    image: row.image_url || '',
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function adminProductToRow(product, sortOrder = 0) {
  return {
    id: String(product.id),
    name: product.name,
    admin_category: product.category,
    description: product.description || '',
    image_url: product.image || '',
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    active: product.active !== false,
    sort_order: sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchActiveProducts() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.warn('Supabase produtos:', error.message);
      return null;
    }
    if (!data?.length) return null;

    return data.map((row) => normalizeProductForSite(rowToAdminProduct(row)));
  } catch (error) {
    console.warn('Supabase indisponivel:', error);
    return null;
  }
}

export async function fetchAllProductsForAdmin() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToAdminProduct);
}

export async function upsertProducts(products) {
  const supabase = await getSupabaseClient();
  const rows = products.map((product, index) => adminProductToRow(product, index));
  const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteProductById(productId) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('products').delete().eq('id', String(productId));
  if (error) throw error;
}

export async function uploadProductImage(file, productId = Date.now()) {
  if (!file) throw new Error('Nenhum arquivo selecionado.');

  const supabase = await getSupabaseClient();
  const storagePath = buildProductImagePath(file.name, productId);

  try {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('products')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage
      .from('products')
      .getPublicUrl(uploadData?.path || storagePath);

    return publicData?.publicUrl || '';
  } catch (error) {
    console.warn('Falha no upload de imagem para o Storage do Supabase, usando fallback em base64:', error);
    return fileToDataUrl(file);
  }
}

// ——— Pedidos ———

function rowToOrderItem(row) {
  return {
    id: row.product_id,
    productId: row.product_id,
    name: row.name,
    price: Number(row.price) || 0,
    quantity: Number(row.quantity) || 0,
  };
}

export function rowToOrder(row, items = []) {
  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone || '',
    phoneFormatted: row.phone_formatted || '',
    cpf: row.cpf,
    cpfFormatted: row.cpf_formatted || '',
    cep: row.cep || '',
    address: row.address || '',
    paymentMethod: row.payment_method || '',
    subtotal: Number(row.subtotal) || 0,
    shipping: Number(row.shipping) || 0,
    total: Number(row.total) || 0,
    status: row.status || 'pending',
    notes: row.notes || '',
    createdAt: row.created_at,
    items: items.map(rowToOrderItem),
  };
}

function orderToRow(order) {
  return {
    id: String(order.id),
    customer_name: order.customerName,
    email: order.email,
    phone: order.phone || null,
    phone_formatted: order.phoneFormatted || null,
    cpf: order.cpf,
    cpf_formatted: order.cpfFormatted || null,
    cep: order.cep || null,
    payment_method: order.paymentMethod || null,
    subtotal: Number(order.subtotal) || 0,
    shipping: Number(order.shipping) || 0,
    total: Number(order.total) || 0,
    status: order.status || 'pending',
    notes: order.notes || 'Pedido recebido pela loja.',
  };
}

function itemsToPayload(items) {
  return (items || []).map((item) => ({
    product_id: item.id ? String(item.id) : null,
    name: item.name,
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 1,
  }));
}

export async function createOrder(order) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.rpc('place_order', {
    p_order: orderToRow(order),
    p_items: itemsToPayload(order.items),
  });
  if (error) throw error;
  return order;
}

export async function fetchOrdersByCpf(cpfDigits) {
  const supabase = await getSupabaseClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('cpf', cpfDigits)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) throw itemsError;

  const itemsByOrder = {};
  (items || []).forEach((row) => {
    if (!itemsByOrder[row.order_id]) itemsByOrder[row.order_id] = [];
    itemsByOrder[row.order_id].push(row);
  });

  return orders.map((row) => rowToOrder(row, itemsByOrder[row.id] || []));
}

export async function fetchAllOrdersForAdmin() {
  const supabase = await getSupabaseClient();
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) throw itemsError;

  const itemsByOrder = {};
  (items || []).forEach((row) => {
    if (!itemsByOrder[row.order_id]) itemsByOrder[row.order_id] = [];
    itemsByOrder[row.order_id].push(row);
  });

  return orders.map((row) => rowToOrder(row, itemsByOrder[row.id] || []));
}

export async function updateOrderStatus(orderId, status, notes) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase
    .from('orders')
    .update({
      status,
      notes: notes || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', String(orderId));

  if (error) throw error;
}

export async function deleteOrderById(orderId) {
  const supabase = await getSupabaseClient();
  const id = String(orderId);

  const { error: itemsError } = await supabase.from('order_items').delete().eq('order_id', id);
  if (itemsError) throw itemsError;

  const { error } = await supabase.from('orders').delete().eq('id', id);
  if (error) throw error;
}

// ——— Anúncios ———

export function rowToAnnouncement(row) {
  return {
    id: row.id,
    text: row.text,
    position: String(row.position),
    active: Boolean(row.active),
  };
}

export function announcementToRow(announcement) {
  return {
    id: String(announcement.id),
    text: announcement.text,
    position: Number(announcement.position),
    active: Boolean(announcement.active),
    updated_at: new Date().toISOString(),
  };
}

export async function fetchActiveAnnouncements() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('active', true)
      .order('position', { ascending: true });

    if (error) {
      console.warn('Supabase anuncios:', error.message);
      return null;
    }
    return (data || []).map(rowToAnnouncement);
  } catch (error) {
    console.warn('Anuncios indisponiveis:', error);
    return null;
  }
}

export async function fetchAllAnnouncementsForAdmin() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('position', { ascending: true });

  if (error) throw error;
  return (data || []).map(rowToAnnouncement);
}

export async function upsertAnnouncements(announcements) {
  const supabase = await getSupabaseClient();
  const rows = announcements.map(announcementToRow);
  const { error } = await supabase.from('announcements').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteAnnouncementById(id) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('announcements').delete().eq('id', String(id));
  if (error) throw error;
}

// ——— Promoções ———

function dateInputToIso(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T12:00:00`).toISOString();
}

function isoToDateInput(iso) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

export function rowToPromotion(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    image: row.image_url || '',
    startDate: isoToDateInput(row.starts_at),
    endDate: isoToDateInput(row.ends_at),
    active: Boolean(row.active),
    discountPercent: row.discount_percent != null ? Number(row.discount_percent) : null,
  };
}

export function promotionToRow(promo) {
  return {
    id: String(promo.id),
    title: promo.title,
    description: promo.description || '',
    image_url: promo.image || '',
    discount_percent: promo.discountPercent ?? null,
    active: Boolean(promo.active),
    starts_at: dateInputToIso(promo.startDate),
    ends_at: dateInputToIso(promo.endDate),
  };
}

export async function fetchActivePromotions() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase promocoes:', error.message);
      return null;
    }
    return (data || []).map(rowToPromotion);
  } catch (error) {
    console.warn('Promocoes indisponiveis:', error);
    return null;
  }
}

export async function fetchAllPromotionsForAdmin() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('promotions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(rowToPromotion);
}

export async function upsertPromotion(promo) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('promotions').upsert(promotionToRow(promo), { onConflict: 'id' });
  if (error) throw error;
}

export async function deletePromotionById(id) {
  const supabase = await getSupabaseClient();
  const { error } = await supabase.from('promotions').delete().eq('id', String(id));
  if (error) throw error;
}

// ——— Conteúdo do site (destaques da home) ———

export async function fetchFeaturedSection() {
  try {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from('site_content')
      .select('value')
      .eq('key', 'featured_section')
      .maybeSingle();

    if (error) {
      console.warn('Destaques:', error.message);
      return { ...DEFAULT_FEATURED_SECTION };
    }
    return { ...DEFAULT_FEATURED_SECTION, ...(data?.value || {}) };
  } catch (error) {
    console.warn('Destaques indisponiveis:', error);
    return { ...DEFAULT_FEATURED_SECTION };
  }
}

export async function fetchFeaturedSectionForAdmin() {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('site_content')
    .select('value')
    .eq('key', 'featured_section')
    .maybeSingle();

  if (error) throw error;
  return { ...DEFAULT_FEATURED_SECTION, ...(data?.value || {}) };
}

export async function saveFeaturedSection(section) {
  const supabase = await getSupabaseClient();
  const payload = {
    eyebrow: String(section.eyebrow || DEFAULT_FEATURED_SECTION.eyebrow).trim(),
    title: String(section.title || DEFAULT_FEATURED_SECTION.title).trim(),
    productIds: (section.productIds || []).slice(0, 4).map(String),
  };

  const { error } = await supabase.from('site_content').upsert(
    {
      key: 'featured_section',
      value: payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  if (error) throw error;
  return payload;
}

export { toShopCategory };
