/* ═══════════════════════════════════════════════════════════
   Delizie Siciliane — Sistema Carrello

   ▸ Modalità statica: localStorage (funziona subito)
   ▸ Modalità Shopify: attivare configurando shopify.js
     (sostituire dsCheckout() con la chiamata reale)
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Catalogo prodotti statici ─────────────────────────────── */
const DS_CATALOG = {
  'kit-cannolo':          { name: 'Kit Cannoli Artigianali',      price: 17.50, image: 'Kit Cannolo 1.jpg',             page: 'kit-cannolo.html' },
  'cannolo-ricotta':      { name: 'Cannolo Grande — Ricotta',      price: 3.50,  image: 'Cannolo Ricotta.jpg',           page: 'cannolo-ricotta.html' },
  'cannolo-pistacchio':   { name: 'Cannolo Grande — Pistacchio',   price: 3.50,  image: 'Cannolo Pistacchio.jpg',        page: 'cannolo-pistacchio.html' },
  'cannolo-cioccolato':   { name: 'Cannolo Grande — Cioccolato',   price: 3.50,  image: 'Cannolo Cioccolato.jpg',        page: 'shop.html' },
  'cassatina-siciliana':  { name: 'Cassatina Siciliana',           price: 16.00, image: 'Cassatina Siciliana.jpg',       page: 'cassatina-siciliana.html' },
  'pasta-di-mandorla':    { name: 'Pasta di Mandorla',             price: 12.00, image: 'Pasta di Mandorla.jpg',         page: 'shop.html' },
  'sole-di-sicilia':      { name: 'Sole di Sicilia',               price: 16.00, image: 'Sole di Sicilia 1.jpg',         page: 'shop.html' },
  'torta-cassata':        { name: 'Torta Cassata Siciliana',       price: 35.00, image: 'Torta Cassata Siciliana.jpg',   page: 'torta-cassata.html' },
  'torta-fedora':         { name: 'Torta Fedora',                  price: 34.00, image: 'Torta Fedora 1.jpg',            page: 'shop.html' },
  'torta-pasta-mandorla': { name: 'Torta Pasta di Mandorla',       price: 32.00, image: 'Torta Pasta di Mandorla 1.jpg', page: 'shop.html' },
  'tronchetto-cassata':   { name: 'Tronchetto Cassata',            price: 33.00, image: 'Tronchetto Cassata 1.jpg',      page: 'shop.html' },
};

/* ── Classe carrello ──────────────────────────────────────── */
class DSCart {
  constructor() {
    this._items = this._load();
    this._toastTimer = null;
  }

  /* persistenza */
  _load() {
    try { return JSON.parse(localStorage.getItem('ds_cart') || '[]'); }
    catch { return []; }
  }
  _save() {
    localStorage.setItem('ds_cart', JSON.stringify(this._items));
  }

  /* aggiunge un prodotto (o incrementa qty) */
  add(handle, qty = 1) {
    const info = DS_CATALOG[handle];
    if (!info) { console.warn('DSCart: handle non trovato:', handle); return; }

    const existing = this._items.find(i => i.handle === handle);
    if (existing) {
      existing.qty += qty;
    } else {
      this._items.push({ handle, qty, name: info.name, price: info.price, image: info.image });
    }
    this._save();
    this._sync();
    this.open();
    this._toast(`✓ "${info.name}" aggiunto al carrello`);
  }

  /* imposta quantità (0 = rimuovi) */
  setQty(handle, qty) {
    const n = Math.max(0, parseInt(qty) || 0);
    if (n === 0) {
      this._items = this._items.filter(i => i.handle !== handle);
    } else {
      const item = this._items.find(i => i.handle === handle);
      if (item) item.qty = n;
    }
    this._save();
    this._sync();
  }

  remove(handle) { this.setQty(handle, 0); }

  /* calcoli */
  total() { return this._items.reduce((s, i) => s + i.price * i.qty, 0); }
  count() { return this._items.reduce((s, i) => s + i.qty, 0); }

  /* aggiorna i badge .cart-count in tutta la pagina */
  _sync() {
    const n = this.count();
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = n; });
    this._renderItems();
  }

  /* toast di conferma */
  _toast(msg) {
    const t = document.getElementById('ds-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
  }

  /* ── Drawer ──────────────────────────────────────────────── */
  open() {
    document.getElementById('ds-cart-drawer')?.classList.add('open');
    document.getElementById('ds-cart-overlay')?.classList.add('open');
    document.body.classList.add('ds-cart-open');
  }
  close() {
    document.getElementById('ds-cart-drawer')?.classList.remove('open');
    document.getElementById('ds-cart-overlay')?.classList.remove('open');
    document.body.classList.remove('ds-cart-open');
  }

  _renderItems() {
    const list  = document.getElementById('ds-cart-list');
    const total = document.getElementById('ds-cart-total');
    const btn   = document.getElementById('ds-checkout-btn');
    if (!list) return;

    if (this._items.length === 0) {
      list.innerHTML = `
        <div class="ds-cart-empty">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <p>Il tuo carrello è vuoto.</p>
          <a href="shop.html" class="btn btn-primary" style="margin-top:16px" onclick="dsCart.close()">Scopri i dolci</a>
        </div>`;
      if (total) total.textContent = '€0,00';
      if (btn) btn.disabled = true;
      return;
    }

    list.innerHTML = this._items.map(item => `
      <div class="ds-cart-item">
        <div class="ds-ci-img">
          <img src="assets/images/${item.image}" alt="${item.name}" loading="lazy"
               onerror="this.style.opacity='0'">
        </div>
        <div class="ds-ci-body">
          <span class="ds-ci-name">${item.name}</span>
          <span class="ds-ci-unit-price">€${item.price.toFixed(2).replace('.', ',')} / pz</span>
          <div class="ds-ci-row">
            <div class="ds-ci-qty">
              <button class="ds-qty-btn" onclick="dsCart.setQty('${item.handle}', ${item.qty - 1})" aria-label="Diminuisci">−</button>
              <span class="ds-qty-val">${item.qty}</span>
              <button class="ds-qty-btn" onclick="dsCart.setQty('${item.handle}', ${item.qty + 1})" aria-label="Aumenta">+</button>
            </div>
            <span class="ds-ci-price">€${(item.price * item.qty).toFixed(2).replace('.', ',')}</span>
          </div>
        </div>
        <button class="ds-ci-remove" onclick="dsCart.remove('${item.handle}')" aria-label="Rimuovi ${item.name}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>`).join('');

    if (total) total.textContent = `€${this.total().toFixed(2).replace('.', ',')}`;
    if (btn) btn.disabled = false;
  }

  /* inietta il drawer HTML nel body (una sola volta) */
  _inject() {
    if (document.getElementById('ds-cart-drawer')) return;

    document.body.insertAdjacentHTML('beforeend', `
      <div id="ds-cart-overlay" class="ds-cart-overlay" role="presentation"></div>

      <aside id="ds-cart-drawer" class="ds-cart-drawer" role="dialog" aria-modal="true" aria-label="Carrello acquisti">
        <div class="ds-cart-header">
          <h2 class="ds-cart-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Il tuo carrello
          </h2>
          <button class="ds-cart-close-btn" onclick="dsCart.close()" aria-label="Chiudi carrello">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div id="ds-cart-list" class="ds-cart-list">
          <div class="ds-cart-empty">
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <p>Il tuo carrello è vuoto.</p>
            <a href="shop.html" class="btn btn-primary" style="margin-top:16px" onclick="dsCart.close()">Scopri i dolci</a>
          </div>
        </div>

        <div class="ds-cart-footer">
          <div class="ds-cart-subtotal">
            <span>Subtotale</span>
            <span id="ds-cart-total" class="ds-cart-total-val">€0,00</span>
          </div>
          <p class="ds-cart-note">🚚 Spedizione refrigerata inclusa sopra €60 · Consegna 24–48h</p>
          <button id="ds-checkout-btn" class="btn btn-primary ds-checkout-btn" onclick="dsCheckout()" disabled>
            Procedi al checkout →
          </button>
          <button class="ds-cart-continue" onclick="dsCart.close()">
            ← Continua lo shopping
          </button>
        </div>
      </aside>

      <div id="ds-toast" class="ds-toast" role="status" aria-live="polite"></div>
    `);

    document.getElementById('ds-cart-overlay').addEventListener('click', () => this.close());
  }

  /* init: inietta drawer + collega bottoni */
  init() {
    this._inject();
    this._sync();

    /* apre il drawer al click su qualunque .cart-btn */
    document.querySelectorAll('.cart-btn').forEach(btn => {
      btn.addEventListener('click', () => this.open());
    });
  }
}

/* ── Checkout ─────────────────────────────────────────────── */
function dsCheckout() {
  if (!dsCart._items.length) return;

  /* ══════════════════════════════════════════════════════════
     TODO — Shopify Integration:

     1. Configurare STOREFRONT_API_URL e STOREFRONT_ACCESS_TOKEN
        in shopify.js con le credenziali del negozio.

     2. Sostituire questo blocco con:

        const cartId = await getOrCreateCartId();
        for (const item of dsCart._items) {
          await addToCart(variantId_di_shopify, item.qty);
        }
        const shopCart = await fetchCart(cartId);
        window.location.href = shopCart.checkoutUrl;

     3. Mappare ogni `handle` locale al `variantId` Shopify
        (ottenibile con fetchProductByHandle(handle)).
     ══════════════════════════════════════════════════════════ */

  const righe = dsCart._items
    .map(i => `• ${i.qty}× ${i.name}  €${(i.price * i.qty).toFixed(2)}`)
    .join('\n');

  alert(
    `🛒 Checkout — Shopify non ancora configurato\n\n` +
    `Il pulsante si collegherà automaticamente al tuo negozio Shopify\n` +
    `una volta inserite le credenziali in shopify.js.\n\n` +
    `Ordine attuale:\n${righe}\n\n` +
    `Totale: €${dsCart.total().toFixed(2)}`
  );
}

/* ── Funzione globale addToCart (usata nelle pagine prodotto) */
function addToCart(handle, qty) {
  dsCart.add(handle, parseInt(qty) || 1);
}

/* ── Init ─────────────────────────────────────────────────── */
const dsCart = new DSCart();
document.addEventListener('DOMContentLoaded', () => dsCart.init());
