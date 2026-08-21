/* KHLA Shop prototype engine: i18n, data, cart, drawer, chrome. No build step. */
window.KHLA = (() => {
  'use strict';

  /* ------------------------------------------------------------------ i18n */
  const STR = {
    en: {
      'nav.shop': 'Shop', 'nav.back': 'Back to the foundation', 'nav.cart': 'Open your bag',
      'banner': 'Free shipping over $50 · Free pickup in Miami',
      'home.eyebrow': 'The shop', 'home.h1': 'Wear her light.',
      'home.lede': 'Apparel made by Stephanie’s family and friends. Every piece funds water‑safety education in South Florida.',
      'home.cta': 'Shop the collection', 'home.cta2': 'Why we make these',
      'home.impact.coins': 'coins shared hand to hand', 'home.impact.events': 'safety days held', 'home.impact.people': 'people reached on the water',
      'home.featured': 'Featured', 'home.all': 'Everything we make',
      'home.tab.all': 'All', 'home.tab.apparel': 'Apparel', 'home.tab.coin': 'Coin', 'home.tab.accessory': 'Accessories',
      'home.why.h2': 'Why we make these', 'home.why.p': 'Stephanie lit up every room she walked into. We could not keep her, so we keep her light — on the water, at the dock, and on the people who carry her message. All of it is about who comes home.',
      'home.why.link': 'Read Stephanie’s story',
      'home.how.h2': 'How it works', 'home.how.1': 'Pick your size', 'home.how.1p': 'Real measurements in inches and centimeters on every page.',
      'home.how.2': 'Pay with a thumbprint', 'home.how.2p': 'Apple Pay, Google Pay, or card. No account, ever.',
      'home.how.3': 'Ships in 3–5 days', 'home.how.3p': 'From Miami by USPS, with tracking. Or pick up free.',
      'home.faq': 'Good to know',
      'cat.apparel': 'Apparel', 'cat.coin': 'Coin', 'cat.accessory': 'Accessory', 'card.new': 'New', 'card.low': 'Only a few left', 'card.soldout': 'Sold out',
      'pdp.crumb': 'Shop', 'pdp.size': 'Size', 'pdp.pack': 'Pack', 'pdp.sizeGuide': 'Size guide', 'pdp.chooseSize': 'Choose a size',
      'pdp.add': 'Add to bag', 'pdp.added': 'Added to your bag', 'pdp.onlyLeft': 'Only {n} left', 'pdp.soldOut': 'Sold out',
      'pdp.notify': 'Email me when it’s back', 'pdp.notifyOk': 'We’ll email you the day it’s back.', 'pdp.qty': 'Quantity',
      'pdp.shipsIn': 'Ships in 3–5 business days', 'pdp.flat': '$5 flat', 'pdp.freeOver': 'free over $50', 'pdp.pickup': 'free pickup in Miami',
      'pdp.secure': 'Secure checkout by Stripe', 'pdp.storyTitle': 'Why this design',
      'pdp.fabric': 'Fabric & fit', 'pdp.care': 'Care', 'pdp.shipping': 'Shipping & returns', 'pdp.tax': 'Is this tax‑deductible?',
      'pdp.shippingBody': 'Packed within 3–5 business days and shipped USPS from Miami with tracking. $5 flat, free over $50, or free pickup. Unworn apparel exchanges within 30 days.',
      'pdp.taxBody': 'No — this is a purchase at fair value, not a gift. A separate donation added at checkout is fully deductible and receipted separately with our EIN.',
      'pdp.trust.1': 'Run by Stephanie’s family and friends', 'pdp.trust.2': '501(c)(3) nonprofit · EIN XX‑XXXXXXX', 'pdp.trust.3': 'Questions? DM @keepherlightalive',
      'pdp.alsoLike': 'You might also like', 'pdp.sizeTable.caption': 'Measurements are of the garment, laid flat.',
      'pdp.soldOutNow': 'Sorry — {size} just sold out.',
      'cart.title': 'Your bag', 'cart.empty': 'Your bag is empty.', 'cart.emptyCta': 'See the collection', 'cart.remove': 'Remove', 'cart.undo': 'Undo',
      'cart.removed': 'Removed from your bag', 'cart.ship': 'Ship', 'cart.pickup': 'Pick up in Miami', 'cart.pickupHint': 'We’ll email you when it’s ready.',
      'cart.subtotal': 'Subtotal', 'cart.shipping': 'Shipping', 'cart.free': 'Free', 'cart.tax': 'Tax calculated at checkout',
      'cart.donation.title': 'Add a gift to the Foundation', 'cart.donation.sub': 'Optional and tax‑deductible. Receipted separately.',
      'cart.donation.none': 'No gift', 'cart.donation.other': 'Other',
      'cart.disclosure': 'Florida solicitation disclosure', 'cart.promoHint': 'Have a code? You can enter it on the next screen.',
      'cart.checkout': 'Checkout', 'cart.checkoutNote': 'You’ll pay securely on Stripe. Apple Pay, Google Pay, and cards accepted. No account needed.',
      'cart.keep': 'Keep shopping', 'cart.reserving': 'Reserving your items…',
      'cart.progress': 'You’re {amt} away from free shipping', 'cart.progressDone': 'You’ve unlocked free shipping',
      'cart.cap': 'Only {n} available', 'cart.lineSoldOut': '{item} sold out while you were shopping — removed.',
      'cart.saved': 'Your bag is saved. Nothing was charged.', 'cart.close': 'Close', 'cart.capAdded': 'Only {n} available — we added what’s left.', 'cart.adjusted': 'Stock changed: {item} is now {n} in your bag.', 'cart.policies': 'Shipping · Returns · Questions: Keepherlightalivesmr@gmail.com', 'ty.sample': 'Prototype preview — sample order, nothing was charged', 'ty.taxEst': 'Tax (estimated)',
      'ty.h1': 'Thank you, {name}.', 'ty.order': 'Order', 'ty.email': 'We’ll email {email} in a minute with your receipt.',
      'ty.next': 'What happens next', 'ty.s1': 'Confirmed', 'ty.s1p': 'Today', 'ty.s2': 'Packed', 'ty.s2p': 'Within 3–5 business days', 'ty.s3': 'Shipped', 'ty.s3p': 'You’ll get a tracking email',
      'ty.s3pick': 'Ready for pickup', 'ty.s3pickp': 'We’ll email you when it’s ready in Miami',
      'ty.summary': 'Your order', 'ty.donation': 'Gift to the Foundation',
      'ty.receipt': 'This transaction is a purchase of merchandise, not a charitable contribution, and is not tax‑deductible. Keep Her Light Alive Foundation, Inc. is a 501(c)(3) tax‑exempt organization; EIN XX‑XXXXXXX.',
      'ty.receiptGift': 'Thank you for your gift of {amt} to Keep Her Light Alive Foundation, Inc. No goods or services were provided in exchange, and it is fully tax‑deductible to the extent allowed by law. Keep this receipt for your records.',
      'ty.mission': 'Your order funds water‑safety education in South Florida. That is how we keep her light alive.',
      'ty.account.h': 'Want to see this order later?', 'ty.account.p': 'We’ll email you a sign‑in link. No password.', 'ty.account.cta': 'Send me a link', 'ty.account.ok': 'Check your email.',
      'ty.share': 'Tell a friend', 'ty.copy': 'Copy link', 'ty.copied': 'Link copied', 'ty.back': 'Back to the shop',
      'footer.tagline': 'Honoring the memory of Stephanie M. Rodriguez by ensuring safety and serenity on the waters we all love.',
      'footer.shop': 'Shop', 'footer.policies': 'Policies', 'footer.shipping': 'Shipping', 'footer.returns': 'Returns', 'footer.terms': 'Terms of sale', 'footer.privacy': 'Privacy', 'footer.track': 'Track an order',
      'footer.disclosure': 'A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE FLORIDA DIVISION OF CONSUMER SERVICES. [VERIFY CURRENT STATUTORY TEXT + CH# BEFORE LAUNCH]',
      'a11y.gallery': 'Product photos', 'a11y.prev': 'Previous photo', 'a11y.next': 'Next photo', 'a11y.dec': 'Decrease quantity', 'a11y.inc': 'Increase quantity', 'a11y.lang': 'Switch language',
      'ph.pending': 'Photo pending',
    },
    es: {
      'nav.shop': 'Tienda', 'nav.back': 'Volver a la fundación', 'nav.cart': 'Abrir tu bolsa',
      'banner': 'Envío gratis en compras de más de $50 · Recogida gratis en Miami',
      'home.eyebrow': 'La tienda', 'home.h1': 'Lleva su luz.',
      'home.lede': 'Ropa hecha por la familia y las amigas de Stephanie. Cada pieza financia educación sobre seguridad en el agua en el sur de la Florida.',
      'home.cta': 'Ver la colección', 'home.cta2': 'Por qué las hacemos',
      'home.impact.coins': 'monedas compartidas de mano en mano', 'home.impact.events': 'jornadas de seguridad', 'home.impact.people': 'personas alcanzadas en el agua',
      'home.featured': 'Destacados', 'home.all': 'Todo lo que hacemos',
      'home.tab.all': 'Todo', 'home.tab.apparel': 'Ropa', 'home.tab.coin': 'Moneda', 'home.tab.accessory': 'Accesorios',
      'home.why.h2': 'Por qué las hacemos', 'home.why.p': 'Stephanie iluminaba cada lugar al que entraba. No pudimos quedarnos con ella, así que nos quedamos con su luz: en el agua, en el muelle y en la gente que lleva su mensaje. Todo esto es para que todos vuelvan a casa.',
      'home.why.link': 'Lee la historia de Stephanie',
      'home.how.h2': 'Así funciona', 'home.how.1': 'Elige tu talla', 'home.how.1p': 'Medidas reales en pulgadas y centímetros en cada página.',
      'home.how.2': 'Paga con tu huella digital', 'home.how.2p': 'Apple Pay, Google Pay o tarjeta. Sin crear cuenta, nunca.',
      'home.how.3': 'Llega en 3 a 5 días', 'home.how.3p': 'Desde Miami por USPS, con rastreo. O recógelo gratis.',
      'home.faq': 'Información útil',
      'cat.apparel': 'Ropa', 'cat.coin': 'Moneda', 'cat.accessory': 'Accesorio', 'card.new': 'Nuevo', 'card.low': 'Quedan pocas', 'card.soldout': 'Agotado',
      'pdp.crumb': 'Tienda', 'pdp.size': 'Talla', 'pdp.pack': 'Paquete', 'pdp.sizeGuide': 'Guía de tallas', 'pdp.chooseSize': 'Elige una talla',
      'pdp.add': 'Añadir a la bolsa', 'pdp.added': 'Añadido a tu bolsa', 'pdp.onlyLeft': 'Solo quedan {n}', 'pdp.soldOut': 'Agotado',
      'pdp.notify': 'Avísame cuando vuelva', 'pdp.notifyOk': 'Te escribimos el día que vuelva.', 'pdp.qty': 'Cantidad',
      'pdp.shipsIn': 'Se envía en 3 a 5 días hábiles', 'pdp.flat': '$5 fijo', 'pdp.freeOver': 'gratis en compras de más de $50', 'pdp.pickup': 'recogida gratis en Miami',
      'pdp.secure': 'Pago seguro con Stripe', 'pdp.storyTitle': 'Por qué este diseño',
      'pdp.fabric': 'Tela y corte', 'pdp.care': 'Cuidado', 'pdp.shipping': 'Envío y cambios', 'pdp.tax': '¿Es deducible de impuestos?',
      'pdp.shippingBody': 'Empacado en 3 a 5 días hábiles y enviado por USPS desde Miami con rastreo. $5 fijo, gratis en compras de más de $50, o recogida gratis. La ropa sin usar se cambia en 30 días.',
      'pdp.taxBody': 'No. Es una compra a precio justo, no una donación. Una donación aparte al pagar sí es deducible y se emite un comprobante por separado con nuestro EIN.',
      'pdp.trust.1': 'Dirigida por la familia y las amigas de Stephanie', 'pdp.trust.2': 'Organización 501(c)(3) · EIN XX‑XXXXXXX', 'pdp.trust.3': '¿Dudas? Escríbenos a @keepherlightalive',
      'pdp.alsoLike': 'También te puede gustar', 'pdp.sizeTable.caption': 'Medidas de la prenda, extendida.',
      'pdp.soldOutNow': 'Lo sentimos: la talla {size} se acaba de agotar.',
      'cart.title': 'Tu bolsa', 'cart.empty': 'Tu bolsa está vacía.', 'cart.emptyCta': 'Ver la colección', 'cart.remove': 'Quitar', 'cart.undo': 'Deshacer',
      'cart.removed': 'Quitado de tu bolsa', 'cart.ship': 'Envío', 'cart.pickup': 'Recoger en Miami', 'cart.pickupHint': 'Te avisamos por correo cuando esté listo.',
      'cart.subtotal': 'Subtotal', 'cart.shipping': 'Envío', 'cart.free': 'Gratis', 'cart.tax': 'Impuestos calculados al pagar',
      'cart.donation.title': 'Añade un regalo a la Fundación', 'cart.donation.sub': 'Opcional y deducible de impuestos. Recibo aparte.',
      'cart.donation.none': 'Sin regalo', 'cart.donation.other': 'Otro',
      'cart.disclosure': 'Aviso de solicitación de la Florida', 'cart.promoHint': '¿Tienes un código? Lo puedes poner en la siguiente pantalla.',
      'cart.checkout': 'Pagar', 'cart.checkoutNote': 'Pagarás de forma segura en Stripe. Aceptamos Apple Pay, Google Pay y tarjetas. No hace falta cuenta.',
      'cart.keep': 'Seguir mirando', 'cart.reserving': 'Reservando tus artículos…',
      'cart.progress': 'Te faltan {amt} para el envío gratis', 'cart.progressDone': 'Tienes envío gratis',
      'cart.cap': 'Solo hay {n} disponibles', 'cart.lineSoldOut': '{item} se agotó mientras mirabas; lo quitamos.',
      'cart.saved': 'Tu bolsa está guardada. No se cobró nada.', 'cart.close': 'Cerrar', 'cart.capAdded': 'Solo hay {n} disponibles; añadimos los que quedan.', 'cart.adjusted': 'Cambió el inventario: ahora tienes {n} de {item} en tu bolsa.', 'cart.policies': 'Envíos · Cambios · Dudas: Keepherlightalivesmr@gmail.com', 'ty.sample': 'Vista previa del prototipo: pedido de muestra, no se cobró nada', 'ty.taxEst': 'Impuestos (estimado)',
      'ty.h1': 'Gracias, {name}.', 'ty.order': 'Pedido', 'ty.email': 'En un minuto te llega el recibo a {email}.',
      'ty.next': 'Qué sigue', 'ty.s1': 'Confirmado', 'ty.s1p': 'Hoy', 'ty.s2': 'Empacado', 'ty.s2p': 'En 3 a 5 días hábiles', 'ty.s3': 'Enviado', 'ty.s3p': 'Te llega un correo con el rastreo',
      'ty.s3pick': 'Listo para recoger', 'ty.s3pickp': 'Te avisamos cuando esté listo en Miami',
      'ty.summary': 'Tu pedido', 'ty.donation': 'Regalo a la Fundación',
      'ty.receipt': 'Esta transacción es una compra de mercancía, no una contribución caritativa, y no es deducible de impuestos. Keep Her Light Alive Foundation, Inc. es una organización exenta 501(c)(3); EIN XX‑XXXXXXX.',
      'ty.receiptGift': 'Gracias por tu regalo de {amt} a Keep Her Light Alive Foundation, Inc. No se entregaron bienes ni servicios a cambio, y es totalmente deducible según lo permita la ley. Guarda este recibo.',
      'ty.mission': 'Tu pedido financia educación sobre seguridad en el agua en el sur de la Florida. Así mantenemos su luz viva.',
      'ty.account.h': '¿Quieres ver este pedido después?', 'ty.account.p': 'Te enviamos un enlace para entrar. Sin contraseña.', 'ty.account.cta': 'Envíame el enlace', 'ty.account.ok': 'Revisa tu correo.',
      'ty.share': 'Cuéntale a alguien', 'ty.copy': 'Copiar enlace', 'ty.copied': 'Enlace copiado', 'ty.back': 'Volver a la tienda',
      'footer.tagline': 'Honrando la memoria de Stephanie M. Rodriguez, cuidando la seguridad y la serenidad en las aguas que todos amamos.',
      'footer.shop': 'Tienda', 'footer.policies': 'Políticas', 'footer.shipping': 'Envíos', 'footer.returns': 'Cambios', 'footer.terms': 'Términos de venta', 'footer.privacy': 'Privacidad', 'footer.track': 'Rastrear un pedido',
      'footer.disclosure': 'UNA COPIA DEL REGISTRO OFICIAL Y LA INFORMACIÓN FINANCIERA PUEDE OBTENERSE DE LA DIVISIÓN DE SERVICIOS AL CONSUMIDOR DE LA FLORIDA. [VERIFICAR TEXTO LEGAL VIGENTE Y CH# ANTES DEL LANZAMIENTO]',
      'a11y.gallery': 'Fotos del producto', 'a11y.prev': 'Foto anterior', 'a11y.next': 'Foto siguiente', 'a11y.dec': 'Reducir cantidad', 'a11y.inc': 'Aumentar cantidad', 'a11y.lang': 'Cambiar idioma',
      'ph.pending': 'Foto pendiente',
    }
  };
  let lang = localStorage.getItem('preferredLanguage') === 'es' ? 'es' : 'en';
  const t = (k, vars) => {
    let s = (STR[lang] && STR[lang][k]) ?? STR.en[k] ?? k;
    if (vars) for (const [kk, v] of Object.entries(vars)) s = s.replace(`{${kk}}`, v);
    return s;
  };
  const L = (o) => (o == null ? '' : typeof o === 'string' ? o : (o[lang] ?? o.en ?? ''));
  function applyI18n(root = document) {
    root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-label]').forEach(e => { e.textContent = lang === 'en' ? 'ES' : 'EN'; });
  }
  function setLang(l) {
    lang = l === 'es' ? 'es' : 'en';
    localStorage.setItem('preferredLanguage', lang);
    applyI18n();
    document.dispatchEvent(new CustomEvent('khla:lang'));
  }
  const toggleLang = () => setLang(lang === 'en' ? 'es' : 'en');

  /* ------------------------------------------------------------------ data */
  let DATA = null;
  const ready = fetch('data/products.json').then(r => r.json()).then(d => (DATA = d));
  const money = (c) => new Intl.NumberFormat(lang === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: c % 100 ? 2 : 0 }).format(c / 100);
  const product = (slug) => DATA.products.find(p => p.slug === slug);
  const variant = (sku) => { for (const p of DATA.products) for (const v of p.variants) if (v.sku === sku) return { p, v }; return null; };
  const productAvailable = (p) => p.variants.reduce((s, v) => s + v.available, 0);
  const categoryLabel = (c) => t('home.tab.' + c);

  /* ------------------------------------------------------------------ cart */
  const KEY = 'khla_cart_v1';
  const blank = () => ({ items: [], fulfil: 'ship', donation: 0 });
  function getCart() { try { return Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch { return blank(); } }
  function save(c) { localStorage.setItem(KEY, JSON.stringify(c)); document.dispatchEvent(new CustomEvent('khla:cart')); return c; }
  function add(sku, qty = 1) {
    const c = getCart(); const { v } = variant(sku);
    const line = c.items.find(i => i.sku === sku);
    const cur = line ? line.qty : 0;
    const next = Math.min(v.available, cur + qty);
    if (next === cur) return { ok: false, capped: true };
    if (line) line.qty = next; else c.items.push({ sku, qty: next });
    save(c); return { ok: true, capped: next < cur + qty };
  }
  function setQty(sku, qty) {
    const c = getCart(); const { v } = variant(sku);
    const line = c.items.find(i => i.sku === sku); if (!line) return;
    line.qty = Math.max(0, Math.min(v.available, qty));
    if (line.qty === 0) c.items = c.items.filter(i => i.sku !== sku);
    save(c);
  }
  let lastRemoved = null;
  function remove(sku) { const c = getCart(); lastRemoved = c.items.find(i => i.sku === sku); c.items = c.items.filter(i => i.sku !== sku); save(c); }
  function undoRemove() { if (!lastRemoved) return; add(lastRemoved.sku, lastRemoved.qty); lastRemoved = null; }
  function setFulfil(f) { const c = getCart(); c.fulfil = f; save(c); }
  function setDonation(cents) { const c = getCart(); c.donation = Math.max(0, cents | 0); save(c); }
  function count() { return getCart().items.reduce((s, i) => s + i.qty, 0); }
  function totals(c = getCart()) {
    const S = DATA.settings;
    const subtotal = c.items.reduce((s, i) => s + variant(i.sku).p.priceCents * i.qty, 0);
    const free = subtotal >= S.freeShippingThresholdCents;
    const shipping = c.items.length === 0 ? 0 : c.fulfil === 'pickup' ? 0 : free ? 0 : S.flatShippingCents;
    const remaining = Math.max(0, S.freeShippingThresholdCents - subtotal);
    return { subtotal, shipping, free, remaining, donation: c.donation, total: subtotal + shipping + c.donation, progress: Math.min(1, subtotal / S.freeShippingThresholdCents) };
  }

  /* ------------------------------------------------------------------ ui helpers */
  const esc = (s) => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const icons = () => window.lucide && window.lucide.createIcons();
  function imgOrPh(img, cls = '', compact = false) {
    if (img && img.src) return `<img src="${esc(img.src)}" alt="${esc(L(img.alt))}" class="card-img absolute inset-0 w-full h-full object-contain p-6 ${img.fit === 'circle' ? 'img-circle' : img.fit === 'cover' ? 'img-cover' : ''} ${cls}" loading="lazy" decoding="async">`;
    const label = compact ? '' : `<span class="text-center px-4">${t('ph.pending')}${img && img.label ? ' · ' + img.label : ''}</span>`;
    return `<div class="ph card-img" role="img" aria-label="${esc(L(img && img.alt) || '')}"><i data-lucide="sun" class="${compact ? 'w-5 h-5' : 'w-7 h-7'} text-brand-gold/70"></i>${label}</div>`;
  }
  function cardHTML(p) {
    const avail = productAvailable(p);
    const low = avail > 0 && p.variants.some(v => v.available > 0 && v.available <= 3) && avail <= 12;
    const chip = avail === 0 ? `<span class="text-[11px] font-semibold uppercase tracking-widest text-gray-500">${t('card.soldout')}</span>`
      : low ? `<span class="text-[11px] font-semibold uppercase tracking-widest" style="color:var(--gold-deep)">${t('card.low')}</span>`
      : p.isNew ? `<span class="text-[11px] font-semibold uppercase tracking-widest text-brand-navy">${t('card.new')}</span>` : '';
    return `<a href="product.html?slug=${p.slug}" class="card group block overflow-hidden ${avail === 0 ? 'sold-out' : ''}" aria-label="${esc(L(p.title))}, ${money(p.priceCents)}">
      <div class="relative aspect-square bg-brand-sand overflow-hidden">${imgOrPh(p.images[0])}</div>
      <div class="p-5">
        <div class="flex items-center justify-between gap-2 mb-1.5"><span class="text-[11px] uppercase tracking-[0.18em] text-gray-500 truncate">${esc(t('cat.' + p.category))}</span><span class="shrink-0 whitespace-nowrap">${chip}</span></div>
        <div class="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-4">
          <h3 class="font-serif text-[1.05rem] sm:text-lg leading-snug text-gray-900">${esc(L(p.title))}</h3>
          <span class="tnum font-medium shrink-0">${money(p.priceCents)}</span>
        </div>
      </div></a>`;
  }

  /* ------------------------------------------------------------------ chrome */
  function mountHeader() {
    const el = document.getElementById('site-header'); if (!el) return;
    el.innerHTML = `
    <div class="banner text-center text-[12px] tracking-wide py-2 px-4" data-i18n="banner"></div>
    <div class="max-w-[1400px] mx-auto px-5 lg:px-12">
      <div class="flex items-center justify-between h-20">
        <a href="../index.html" class="flex items-center gap-3 group" aria-label="Keep Her Light Alive Foundation">
          <img src="assets/logo.png" alt="" class="h-16 w-auto object-contain">
          <span class="hidden sm:block font-serif text-lg text-gray-900">Keep Her Light Alive</span>
        </a>
        <nav class="flex items-center gap-2 sm:gap-3" aria-label="Shop">
          <a href="index.html" class="hidden sm:inline text-sm font-medium text-gray-700 hover:text-gray-900 px-3" data-i18n="nav.shop"></a>
          <button type="button" id="lang-toggle" class="btn-press h-11 px-4 rounded-full border border-black/10 text-sm font-medium hover:bg-black/5" data-i18n-aria="a11y.lang"><span data-lang-label>ES</span></button>
          <button type="button" id="cart-btn" class="btn-press relative h-11 w-11 rounded-full bg-brand-dark text-white grid place-items-center hover:bg-black" data-i18n-aria="nav.cart">
            <i data-lucide="shopping-bag" class="w-5 h-5"></i>
            <span id="cart-badge" class="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 rounded-full bg-brand-gold text-black text-[11px] font-bold grid place-items-center tnum" hidden>0</span>
          </button>
        </nav>
      </div>
    </div>`;
    el.querySelector('#lang-toggle').addEventListener('click', toggleLang);
    el.querySelector('#cart-btn').addEventListener('click', () => openDrawer());
    updateBadge();
  }
  function updateBadge() {
    const b = document.getElementById('cart-badge'); if (!b) return;
    const n = count(); b.textContent = n; b.hidden = n === 0;
  }
  function mountFooter() {
    const el = document.getElementById('site-footer'); if (!el) return;
    el.innerHTML = `
    <div class="max-w-[1400px] mx-auto px-5 lg:px-12">
      <div class="flex flex-col lg:flex-row justify-between items-start gap-14 mb-16">
        <div class="max-w-md">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-white rounded-full flex items-center justify-center"><img src="assets/logo.png" class="w-10 h-10 object-contain" alt=""></div>
            <h2 class="font-serif text-2xl">Keep Her Light Alive</h2>
          </div>
          <p class="text-gray-400 leading-relaxed mb-6" data-i18n="footer.tagline"></p>
          <div class="flex gap-3">
            <a href="https://instagram.com/keepherlightalive" class="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Instagram"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a>
            <a href="mailto:Keepherlightalivesmr@gmail.com" class="w-10 h-10 rounded-full border border-gray-800 flex items-center justify-center hover:bg-white hover:text-black transition-colors" aria-label="Email"><i data-lucide="mail" class="w-5 h-5"></i></a>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-12">
          <div><h4 class="text-white font-medium mb-5" data-i18n="footer.shop"></h4>
            <ul class="space-y-3 text-gray-400 text-sm">
              <li><a href="index.html" class="hover:text-white" data-i18n="home.all"></a></li>
              <li><a href="#" class="hover:text-white" data-i18n="footer.track"></a></li>
              <li><a href="../index.html" class="hover:text-white" data-i18n="nav.back"></a></li>
            </ul></div>
          <div><h4 class="text-white font-medium mb-5" data-i18n="footer.policies"></h4>
            <ul class="space-y-3 text-gray-400 text-sm">
              <li><a href="#" class="hover:text-white" data-i18n="footer.shipping"></a></li>
              <li><a href="#" class="hover:text-white" data-i18n="footer.returns"></a></li>
              <li><a href="#" class="hover:text-white" data-i18n="footer.terms"></a></li>
              <li><a href="../privacy-policy.html" class="hover:text-white" data-i18n="footer.privacy"></a></li>
            </ul></div>
        </div>
      </div>
      <p id="fl-disclosure" class="text-[10px] leading-relaxed text-gray-600 mb-8 max-w-3xl scroll-mt-8" data-i18n="footer.disclosure"></p>
      <div class="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 uppercase tracking-widest gap-3">
        <p>&copy; 2026 Keep Her Light Alive Foundation, Inc.</p><p>Designed by OAC Digital Innovations</p>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------------ drawer */
  let lastFocus = null;
  function mountDrawer() {
    if (document.getElementById('cart-drawer')) return;
    const d = document.createElement('div');
    d.id = 'cart-drawer'; d.setAttribute('aria-hidden', 'true');
    d.className = 'fixed inset-0 z-50';
    d.innerHTML = `
      <div id="cart-drawer-backdrop" class="absolute inset-0 bg-black/50"></div>
      <section id="cart-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title"
        class="absolute bottom-0 inset-x-0 md:inset-y-0 md:left-auto md:right-0 md:w-[440px] max-h-[92dvh] md:max-h-none bg-white rounded-t-[1.5rem] md:rounded-none md:rounded-l-[1.5rem] shadow-2xl flex flex-col">
        <div class="flex items-center justify-between px-6 pt-5 pb-4 border-b border-black/5">
          <h2 id="cart-title" class="font-serif text-2xl"></h2>
          <button type="button" id="cart-close" class="btn-press w-10 h-10 rounded-full hover:bg-black/5 grid place-items-center" data-i18n-aria="cart.close"><i data-lucide="x" class="w-5 h-5"></i></button>
        </div>
        <div id="cart-body" class="flex-1 overflow-y-auto px-6 py-4"></div>
        <div id="cart-foot" class="border-t border-black/5 px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"></div>
      </section>
      <div id="toast" class="toast items-center gap-3 bg-brand-dark text-white text-sm rounded-full pl-5 pr-2 py-2 shadow-xl" hidden role="status" aria-live="polite"><span id="toast-text"></span><button type="button" id="toast-action" class="btn-press h-8 px-3 rounded-full bg-white/10 hover:bg-white/20 font-medium"></button></div>`;
    document.body.appendChild(d);
    d.querySelector('#cart-drawer-backdrop').addEventListener('click', closeDrawer);
    d.querySelector('#cart-close').addEventListener('click', closeDrawer);
    d.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
      if (e.key !== 'Tab') return;
      const f = [...d.querySelectorAll('#cart-drawer-panel a[href],#cart-drawer-panel button:not([disabled]),#cart-drawer-panel input,#cart-drawer-panel [tabindex]:not([tabindex="-1"])')].filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // swipe-down to dismiss on touch
    let y0 = null; const panel = d.querySelector('#cart-drawer-panel');
    panel.addEventListener('touchstart', e => { if (panel.querySelector('#cart-body').scrollTop === 0) y0 = e.touches[0].clientY; }, { passive: true });
    panel.addEventListener('touchmove', e => { if (y0 == null) return; const dy = e.touches[0].clientY - y0; if (dy > 0) panel.style.transform = `translateY(${Math.min(dy, 200) * 0.6}px)`; }, { passive: true });
    panel.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; panel.style.transform = ''; if (dy > 90) closeDrawer(); y0 = null; });
    document.addEventListener('khla:cart', () => { updateBadge(); if (d.getAttribute('aria-hidden') === 'false') renderCart(); });
    document.addEventListener('khla:lang', () => { renderCart(); });
  }
  function openDrawer(highlightSku) {
    mountDrawer();
    const d = document.getElementById('cart-drawer');
    lastFocus = document.activeElement;
    renderCart(highlightSku);
    d.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => d.querySelector('#cart-close').focus(), 30);
  }
  function closeDrawer() {
    const d = document.getElementById('cart-drawer'); if (!d) return;
    d.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  let toastTimer = null;
  function toast(text, actionLabel, onAction) {
    mountDrawer();
    const tst = document.getElementById('toast'), txt = document.getElementById('toast-text'), act = document.getElementById('toast-action');
    txt.textContent = text; act.textContent = actionLabel || ''; act.hidden = !actionLabel;
    act.onclick = () => { onAction && onAction(); tst.hidden = true; };
    tst.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { tst.hidden = true; }, 5000);
  }

  /* cart body + footer: used by the drawer and by cart.html */
  function cartBodyHTML(c, highlightSku) {
    if (!c.items.length) return `<div class="py-14 text-center">
        <div class="mx-auto w-14 h-14 rounded-full bg-brand-sand grid place-items-center mb-4"><i data-lucide="shopping-bag" class="w-6 h-6 text-gray-500"></i></div>
        <p class="text-gray-700 mb-5">${t('cart.empty')}</p>
        <a href="index.html" class="cta btn-press" data-close>${t('cart.emptyCta')}<span class="chev"><i data-lucide="arrow-right" class="w-4 h-4"></i></span></a>
      </div>`;
    const T = totals(c);
    const lines = c.items.map(i => {
      const { p, v } = variant(i.sku);
      const capped = i.qty >= v.available;
      return `<li class="flex gap-4 py-4 border-b border-black/5 ${i.sku === highlightSku ? 'line-flash' : ''} rounded-lg" data-sku="${i.sku}">
        <a href="product.html?slug=${p.slug}" class="relative w-20 h-20 rounded-xl bg-brand-sand overflow-hidden shrink-0">${imgOrPh(p.images[0], 'p-2', true)}</a>
        <div class="flex-1 min-w-0">
          <div class="flex justify-between gap-3">
            <div class="min-w-0"><p class="font-serif text-[1.05rem] leading-snug truncate">${esc(L(p.title))}</p>
              <p class="text-sm text-gray-500">${esc(L(p.optionName === 'Pack' ? t('pdp.pack') : t('pdp.size')))}: ${esc(v.optionValue)}</p></div>
            <p class="tnum font-medium shrink-0">${money(p.priceCents * i.qty)}</p>
          </div>
          <div class="flex items-center justify-between mt-3">
            <div class="stepper" aria-label="${t('pdp.qty')}">
              <button type="button" data-dec aria-label="${t('a11y.dec')}"><i data-lucide="minus" class="w-4 h-4"></i></button>
              <output class="tnum">${i.qty}</output>
              <button type="button" data-inc ${capped ? 'disabled' : ''} aria-label="${t('a11y.inc')}"><i data-lucide="plus" class="w-4 h-4"></i></button>
            </div>
            <button type="button" data-remove class="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4">${t('cart.remove')}</button>
          </div>
          ${capped ? `<p class="text-xs mt-2" style="color:var(--gold-deep)">${t('cart.cap', { n: v.available })}</p>` : ''}
        </div></li>`;
    }).join('');
    const donate = [500, 1000, 2500];
    return `<ul class="mb-5">${lines}</ul>
      <div class="mb-5">
        <div class="flex items-center justify-between text-sm mb-2">
          <span class="${T.free ? 'font-medium' : 'text-gray-700'}" style="${T.free ? 'color:var(--gold-deep)' : ''}">${T.free ? t('cart.progressDone') : t('cart.progress', { amt: money(T.remaining) })}</span>
          ${T.free ? '<i data-lucide="check" class="w-4 h-4" style="color:var(--gold-deep)"></i>' : ''}
        </div>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(T.progress * 100)}"><span style="transform:scaleX(${T.progress})"></span></div>
      </div>
      <div class="grid grid-cols-2 gap-2 p-1 rounded-full bg-brand-sand mb-2" role="radiogroup" aria-label="${t('cart.shipping')}">
        <button type="button" data-fulfil="ship" role="radio" aria-checked="${c.fulfil === 'ship'}" class="btn-press h-10 rounded-full text-sm font-medium ${c.fulfil === 'ship' ? 'bg-white shadow-sm' : 'text-gray-600'}">${t('cart.ship')}</button>
        <button type="button" data-fulfil="pickup" role="radio" aria-checked="${c.fulfil === 'pickup'}" class="btn-press h-10 rounded-full text-sm font-medium ${c.fulfil === 'pickup' ? 'bg-white shadow-sm' : 'text-gray-600'}">${t('cart.pickup')}</button>
      </div>
      ${c.fulfil === 'pickup' ? `<p class="text-xs text-gray-500 mb-4 px-1">${t('cart.pickupHint')}</p>` : '<div class="mb-4"></div>'}
      <div class="rounded-2xl border border-black/8 bg-brand-slate p-4 mb-2">
        <div class="flex items-start gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-white grid place-items-center shrink-0"><i data-lucide="sun" class="w-4 h-4" style="color:var(--gold-deep)"></i></div>
          <div><p class="font-medium leading-tight">${t('cart.donation.title')}</p><p class="text-xs text-gray-500 mt-0.5">${t('cart.donation.sub')}</p></div>
        </div>
        <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="${t('cart.donation.title')}">
          <button type="button" data-donate="0" role="radio" aria-checked="${c.donation === 0}" class="pill !h-10 text-sm">${t('cart.donation.none')}</button>
          ${donate.map(d => `<button type="button" data-donate="${d}" role="radio" aria-checked="${c.donation === d}" class="pill !h-10 text-sm tnum">${money(d)}</button>`).join('')}
          <label class="pill !h-10 text-sm flex items-center gap-1 ${c.donation && !donate.includes(c.donation) ? 'ring' : ''}">$<input type="number" min="1" step="1" inputmode="numeric" data-donate-other placeholder="${t('cart.donation.other')}" value="${c.donation && !donate.includes(c.donation) ? c.donation / 100 : ''}" class="w-14 bg-transparent outline-none tnum"></label>
        </div>
        <a href="index.html#fl-disclosure" class="inline-block text-[11px] text-gray-500 underline underline-offset-4 mt-3">${t('cart.disclosure')}</a>
      </div>`;
  }
  function cartFootHTML(c) {
    if (!c.items.length) return '';
    const T = totals(c);
    return `<dl class="text-sm space-y-1.5 mb-4">
        <div class="flex justify-between"><dt class="text-gray-600">${t('cart.subtotal')}</dt><dd class="tnum">${money(T.subtotal)}</dd></div>
        <div class="flex justify-between"><dt class="text-gray-600">${t('cart.shipping')}</dt><dd class="tnum">${T.shipping === 0 ? t('cart.free') : money(T.shipping)}</dd></div>
        ${T.donation ? `<div class="flex justify-between"><dt class="text-gray-600">${t('ty.donation')}</dt><dd class="tnum">${money(T.donation)}</dd></div>` : ''}
        <div class="flex justify-between text-xs text-gray-500"><dt>${t('cart.tax')}</dt><dd></dd></div>
      </dl>
      <button type="button" id="checkout-btn" class="cta btn-press w-full text-base"><span class="flex-1 text-left">${t('cart.checkout')} · <span class="tnum">${money(T.total)}</span></span><span class="chev"><svg width="26" height="11" viewBox="0 0 26 11" aria-hidden="true" fill="currentColor"><path d="M4.4 1.7c.5-.6 1.2-1 1.9-.9.1.7-.2 1.4-.6 1.9-.5.6-1.2 1-1.9.9-.1-.7.2-1.4.6-1.9zm1.9 2.2c-1 0-1.9.6-2.4.6-.5 0-1.3-.6-2.1-.6C.7 3.9-.3 4.5-.8 5.5c-1 1.8-.3 4.5.7 6 .5.7 1.1 1.5 1.8 1.5.7 0 1-.5 1.9-.5s1.1.5 1.9.5c.8 0 1.3-.7 1.8-1.5.6-.8.8-1.6.8-1.7 0 0-1.6-.6-1.6-2.4 0-1.5 1.2-2.2 1.3-2.2-.7-1-1.8-1.2-2.2-1.2z" transform="translate(2 -.5) scale(.75)"/><text x="10" y="9" font-size="8" font-weight="700" font-family="Inter,sans-serif">Pay</text></svg></span></button>
      <p class="text-[12px] text-gray-500 leading-relaxed mt-3">${t('cart.checkoutNote')}</p>
      <p class="text-[12px] text-gray-500 mt-1">${t('cart.promoHint')}</p>
      <p class="text-[12px] text-gray-500 mt-1">${t('cart.policies')}</p>
      <button type="button" data-close class="block mx-auto mt-3 text-sm font-medium underline underline-offset-4">${t('cart.keep')}</button>`;
  }
  function wireCart(root) {
    root.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', e => { const sku = e.target.closest('[data-sku]').dataset.sku; setQty(sku, getCart().items.find(i => i.sku === sku).qty + 1); }));
    root.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', e => { const sku = e.target.closest('[data-sku]').dataset.sku; setQty(sku, getCart().items.find(i => i.sku === sku).qty - 1); }));
    root.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', e => { remove(e.target.closest('[data-sku]').dataset.sku); toast(t('cart.removed'), t('cart.undo'), undoRemove); }));
    root.querySelectorAll('[data-fulfil]').forEach(b => b.addEventListener('click', e => setFulfil(e.currentTarget.dataset.fulfil)));
    root.querySelectorAll('[data-donate]').forEach(b => b.addEventListener('click', e => setDonation(+e.currentTarget.dataset.donate)));
    const other = root.querySelector('[data-donate-other]');
    if (other) other.addEventListener('change', e => setDonation(Math.round(parseFloat(e.target.value || '0') * 100)));
    root.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeDrawer));
    const co = root.querySelector('#checkout-btn'); if (co) co.addEventListener('click', checkout);
    icons();
  }
  function renderCart(highlightSku) {
    const d = document.getElementById('cart-drawer'); if (!d) return;
    const c = getCart();
    d.querySelector('#cart-title').textContent = `${t('cart.title')}${c.items.length ? ` (${count()})` : ''}`;
    d.querySelector('#cart-body').innerHTML = cartBodyHTML(c, highlightSku);
    d.querySelector('#cart-foot').innerHTML = cartFootHTML(c);
    wireCart(d);
  }
  /* checkout simulation: re-price, reserve, redirect. In production this is POST /api/checkout → 302 Stripe. */
  function checkout() {
    const btn = document.getElementById('checkout-btn'); if (!btn) return;
    const c = getCart();
    btn.disabled = true; btn.innerHTML = `<span class="flex-1 text-left">${t('cart.reserving')}</span><span class="chev"><i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i></span>`; icons();
    setTimeout(() => {
      // server-side availability check (simulated)
      const gone = c.items.filter(i => variant(i.sku).v.available < i.qty);
      if (gone.length) {
        gone.forEach(i => { const { p, v } = variant(i.sku); remove(i.sku); toast(t('cart.lineSoldOut', { item: `${L(p.title)} ${v.optionValue}` })); });
        return;
      }
      const T = totals(c);
      sessionStorage.setItem('khla_last_order', JSON.stringify({ items: c.items, fulfil: c.fulfil, donation: c.donation, totals: T, number: 'KHLA-' + (1042 + Math.floor(Math.random() * 50)), ts: Date.now(), lang }));
      localStorage.removeItem(KEY);
      location.href = 'thank-you.html';
    }, 900);
  }

  /* ------------------------------------------------------------------ misc */
  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
  /* re-validate persisted lines against current stock (server does this for real on /api/checkout) */
  function reconcile() {
    const c = getCart(); const notes = [];
    c.items = c.items.filter(i => {
      const hit = variant(i.sku); if (!hit) return false;
      const { p, v } = hit;
      if (v.available === 0) { notes.push(t('cart.lineSoldOut', { item: `${L(p.title)} ${v.optionValue}` })); return false; }
      if (i.qty > v.available) { notes.push(t('cart.adjusted', { item: `${L(p.title)} ${v.optionValue}`, n: v.available })); i.qty = v.available; }
      return true;
    });
    if (notes.length) { save(c); notes.forEach((n, k) => setTimeout(() => toast(n), 400 + k * 300)); }
  }
  async function boot(page) {
    await ready;
    mountHeader(); mountFooter(); mountDrawer(); reconcile();
    applyI18n();
    if (page) await page();
    applyI18n(); icons(); reveal();
    if (new URLSearchParams(location.search).get('canceled') === '1') toast(t('cart.saved'));
    document.addEventListener('khla:lang', () => { updateBadge(); icons(); });
  }

  return { t, L, get lang() { return lang; }, applyI18n, get data() { return DATA; }, money, product, variant, productAvailable, categoryLabel,
    getCart, add, count, totals, cardHTML, imgOrPh, esc, icons, openDrawer, toast, cartBodyHTML, cartFootHTML, wireCart, boot };
})();
