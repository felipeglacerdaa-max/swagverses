export function sanitizeImageFileName(fileName = 'image') {
  const extension = (fileName.split('.').pop() || 'jpg').toLowerCase();
  const baseName = String(fileName || 'image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'image';

  return `${baseName}.${extension}`;
}

export function buildProductImagePath(fileName = 'image', productId = Date.now()) {
  const safeName = sanitizeImageFileName(fileName);
  const safeProductId = String(productId).replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-') || 'product';
  return `products/${safeProductId}/${Date.now()}-${safeName}`;
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(reader.error || new Error('Erro ao ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}
