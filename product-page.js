/* ═══════════════════════════════════════════════════════════
   Delizie Siciliane — Product Template Page
   product-page.js

   Dipendenze (caricate prima di questo file in product.html):
     ▸ shopify.js  — fetchProductByHandle, fetchProducts, SHOPIFY_CONFIGURED
     ▸ cart.js     — addToCart, dsCart

   URL:  product.html?handle=cassata-siciliana
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ── Stato pagina ────────────────────────────────────────── */
const _state = {
  product:         null,  // oggetto prodotto da Shopify
  selectedOptions: {},    // { [optionName]: value }  es. { Peso: '500g' }
  qty:             1,
};


/* ═══════════════════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════════════════ */

function initProductPage() {
  const handle = new URLSearchParams(window.location.search).get('handle');
  const main   = document.getElementById('product-main');
  if (!main) return;

  if (!handle) {
    _renderError(main, 'Nessun prodotto specificato.', 'Torna allo shop per sfogliare il catalogo.');
    return;
  }

  if (!SHOPIFY_CONFIGURED) {
    _renderError(
      main,
      'Shopify non ancora configurato.',
      'Inserisci le credenziali in shopify.js per attivare le pagine prodotto dinamiche.'
    );
    return;
  }

  document.title = 'Caricamento… — Delizie Siciliane';
  _renderSkeleton(main);

  fetchProductByHandle(handle)
    .then(product => {
      if (!product) {
        _renderError(main, 'Prodotto non trovato.', `Nessun prodotto con handle "${handle}" su Shopify.`);
        return;
      }
      _state.product = product;
      _initDefaultOptions(product);
      // Registra il prodotto nel catalogo locale così il carrello trova nome/prezzo/immagine
      if (typeof DS_CATALOG !== 'undefined') {
        DS_CATALOG[product.handle] = {
          name:  product.title,
          price: parseFloat(product.priceRange.minVariantPrice.amount),
          image: product.images.edges[0]?.node?.url ?? '',
          page:  `product.html?handle=${product.handle}`,
        };
      }
      _renderProduct(main, product);
      _updatePageMeta(product);
    })
    .catch(err => {
      console.error('[product-page] fetchProductByHandle:', err);
      _renderError(
        main,
        'Errore nel caricamento.',
        'Controlla la connessione e riprova. Se il problema persiste, contattaci.'
      );
    });
}


/* ═══════════════════════════════════════════════════════════
   STATI DI CARICAMENTO / ERRORE
   ═══════════════════════════════════════════════════════════ */

function _renderSkeleton(container) {
  container.innerHTML = `
    <div class="product-hero texture" style="padding:48px 0 64px">
      <div class="container">
        <div class="product-hero-grid">

          <div class="product-gallery">
            <div class="pp-skel pp-skel-img"></div>
            <div class="pp-skel-thumbs">
              <div class="pp-skel pp-skel-thumb"></div>
              <div class="pp-skel pp-skel-thumb"></div>
              <div class="pp-skel pp-skel-thumb"></div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:18px;padding-top:8px">
            <div class="pp-skel" style="height:12px;width:38%;border-radius:4px"></div>
            <div class="pp-skel" style="height:54px;width:82%;border-radius:8px"></div>
            <div class="pp-skel" style="height:34px;width:28%;border-radius:4px"></div>
            <div class="pp-skel" style="height:72px;border-radius:var(--radius-md)"></div>
            <div class="pp-skel" style="height:52px;border-radius:var(--radius-pill)"></div>
          </div>

        </div>
      </div>
    </div>
  `;
}

function _renderError(container, title, message) {
  container.innerHTML = `
    <div style="padding:80px 20px;text-align:center;max-width:480px;margin:0 auto">
      <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--color-rosso)"
           stroke-width="1.5" stroke-linecap="round" style="margin:0 auto 24px;display:block">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h1 style="font-family:var(--font-display);font-size:clamp(22px,4vw,32px);margin-bottom:12px;line-height:1.2">
        ${title}
      </h1>
      <p style="color:var(--color-castagna);font-size:15px;line-height:1.65;margin-bottom:32px">
        ${message}
      </p>
      <a href="shop.html" class="btn btn-primary">Torna allo shop</a>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════════
   META
   ═══════════════════════════════════════════════════════════ */

function _updatePageMeta(product) {
  document.title = `${product.title} — Delizie Siciliane`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.content = (product.description ?? `${product.title} da Delizie Siciliane`).slice(0, 155);
  }
}


/* ═══════════════════════════════════════════════════════════
   STATO VARIANTI
   ═══════════════════════════════════════════════════════════ */

/* Imposta come defaults le opzioni della prima variante disponibile */
function _initDefaultOptions(product) {
  const variants = _flatVariants(product);
  const first    = variants.find(v => v.availableForSale) ?? variants[0];
  _state.selectedOptions = {};
  first?.selectedOptions.forEach(opt => {
    _state.selectedOptions[opt.name] = opt.value;
  });
}

/* Estrae l'array di varianti da product.variants.edges */
function _flatVariants(product) {
  return product.variants.edges.map(e => e.node);
}

/* Trova la variante che corrisponde a tutte le opzioni selezionate */
function _getCurrentVariant() {
  const variants = _flatVariants(_state.product);
  return variants.find(v =>
    v.selectedOptions.every(opt => _state.selectedOptions[opt.name] === opt.value)
  ) ?? variants[0];
}

/* Converte _state.selectedOptions in array per addToCart() */
function _getSelectedOptionsArray() {
  return Object.entries(_state.selectedOptions).map(([name, value]) => ({ name, value }));
}

/* Ritorna true se il prodotto ha solo la variante di default (nessuna scelta reale) */
function _isDefaultVariantOnly(product) {
  const variants = _flatVariants(product);
  return variants.length <= 1 && (variants[0]?.title === 'Default Title' || variants.length === 0);
}


/* ═══════════════════════════════════════════════════════════
   PRICE FORMATTER
   ═══════════════════════════════════════════════════════════ */

function _fmtPrice(amount) {
  return '€' + parseFloat(amount).toFixed(2).replace('.', ',');
}


/* ═══════════════════════════════════════════════════════════
   RENDER PRODOTTO
   ═══════════════════════════════════════════════════════════ */

function _renderProduct(container, product) {
  const variants = _flatVariants(product);
  const images   = product.images.edges.map(e => e.node);
  const variant  = _getCurrentVariant();
  const isBest   = product.tags?.includes('best-seller');
  const isNew    = product.tags?.includes('new');

  container.innerHTML = `

    <!-- ── Breadcrumb ──────────────────────────────────────── -->
    <div class="pp-breadcrumb">
      <div class="container">
        <nav aria-label="Percorso di navigazione" style="font-size:12px;color:var(--color-castagna)">
          <a href="index.html">Home</a>
          <span aria-hidden="true" style="margin:0 6px">›</span>
          <a href="shop.html">Shop</a>
          <span aria-hidden="true" style="margin:0 6px">›</span>
          <span>${product.title}</span>
        </nav>
      </div>
    </div>

    <!-- ── Hero prodotto ───────────────────────────────────── -->
    <section class="product-hero texture" aria-label="${product.title}">
      <div class="container">
        <div class="product-hero-grid">

          <!-- Galleria immagini -->
          <div class="product-gallery" id="ppGallery">
            <div class="main-image" id="ppMainImg">
              ${images.length
                ? `<img src="${images[0].url}"
                        alt="${images[0].altText || product.title}"
                        id="ppMainImgEl"
                        loading="eager"
                        fetchpriority="high">`
                : `<div class="card-img-placeholder">${product.title}</div>`
              }
              ${isBest ? `<span class="badge" style="position:absolute;top:16px;left:16px">BEST<br>SELLER</span>` : ''}
              ${isNew  ? `<span class="badge pp-badge-new" style="position:absolute;top:16px;left:16px">NUOVO</span>` : ''}
            </div>

            ${images.length > 1 ? `
            <div class="thumb-row" role="list">
              ${images.map((img, i) => `
                <div class="thumb ${i === 0 ? 'active' : ''}"
                     role="listitem"
                     tabindex="0"
                     onclick="ppSwitchImg('${img.url}', '${(img.altText || product.title).replace(/'/g, "\\'")}', this)"
                     onkeydown="if(event.key==='Enter')ppSwitchImg('${img.url}','${(img.altText || product.title).replace(/'/g, "\\'")}',this)">
                  <img src="${img.url}" alt="${img.altText || product.title}" loading="lazy">
                </div>
              `).join('')}
            </div>` : ''}
          </div>

          <!-- Info prodotto -->
          <div class="product-essentials" id="ppEssentials">

            <p class="product-eyebrow">
              <span style="font-family:var(--font-script);font-size:16px;color:var(--color-castagna)">Delizie Siciliane</span>
              ${isBest ? '&nbsp;· <strong>Best Seller</strong>' : ''}
            </p>

            <h1>${product.title}</h1>

            <p class="product-price-tag" id="ppPrice">
              ${_fmtPrice(variant.price.amount)}
            </p>

            ${product.description
              ? `<p class="product-short-desc">${product.description.slice(0, 240)}${product.description.length > 240 ? '…' : ''}</p>`
              : ''
            }

            <!-- Varianti (solo se il prodotto ha opzioni reali) -->
            ${_isDefaultVariantOnly(product) ? '' : _buildVariantSelectorHTML(variants)}

            <!-- Quantità + CTA -->
            <div class="cta-area">
              <div class="quantity-selector" role="group" aria-label="Quantità">
                <button class="qty-btn" onclick="ppUpdateQty(-1)" aria-label="Diminuisci quantità">−</button>
                <span class="qty-val" id="ppQty" aria-live="polite">1</span>
                <button class="qty-btn" onclick="ppUpdateQty(1)"  aria-label="Aumenta quantità">+</button>
              </div>
              <button
                class="add-to-cart-big"
                id="ppAddBtn"
                onclick="ppAddToCart()"
                ${!variant.availableForSale ? 'disabled' : ''}
              >
                ${variant.availableForSale
                  ? `Aggiungi al carrello — <span id="ppBtnPrice">${_fmtPrice(variant.price.amount)}</span>`
                  : 'Non disponibile'
                }
              </button>
            </div>

            <!-- Trust badges -->
            <div class="trust-badges-inline">
              <div class="t-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Spedizione refrigerata
              </div>
              <div class="t-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                100% artigianale
              </div>
              <div class="t-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                Consegna 24–48h
              </div>
            </div>

          </div><!-- /product-essentials -->
        </div><!-- /product-hero-grid -->

        <!-- Tabs -->
        ${_buildTabsHTML(product)}

      </div><!-- /container -->
    </section>

    <!-- ── Prodotti correlati ───────────────────────────────── -->
    <section class="related" id="ppRelated" aria-label="Prodotti correlati">
      <div class="container">
        <div class="section-header">
          <p class="eyebrow">Potrebbero piacerti</p>
          <h2 class="section-title">Scopri anche</h2>
        </div>
        <div class="related-grid" id="ppRelatedGrid">
          ${[1,2,3].map(() => `
            <div class="pp-skel" style="height:340px;border-radius:var(--radius-md)"></div>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  // Inizializza tab handler dopo che il DOM è stato inserito
  _initTabs();

  // Carica prodotti correlati in background (non blocca)
  _loadRelated(product.handle);
}


/* ═══════════════════════════════════════════════════════════
   VARIANT SELECTOR HTML
   ═══════════════════════════════════════════════════════════ */

function _buildVariantSelectorHTML(variants) {
  // Raggruppa i valori per nome opzione, preservando l'ordine di apparizione
  const groups = {};       // { [optName]: Set<value> }
  const order  = [];       // ordine dei nomi opzione
  variants.forEach(v => {
    v.selectedOptions.forEach(opt => {
      if (!groups[opt.name]) { groups[opt.name] = new Set(); order.push(opt.name); }
      groups[opt.name].add(opt.value);
    });
  });

  return order.map(name => {
    const values = [...groups[name]];
    return `
      <div class="pp-option-group">
        <p class="pp-option-label">${name}</p>
        <div class="pp-option-btns" role="radiogroup" aria-label="Scegli ${name}">
          ${values.map(val => `
            <button
              class="pp-option-btn${_state.selectedOptions[name] === val ? ' active' : ''}"
              onclick="ppSelectOption('${name}', '${val.replace(/'/g, "\\'")}', this)"
              role="radio"
              aria-checked="${_state.selectedOptions[name] === val ? 'true' : 'false'}"
              data-option="${name}"
              data-value="${val}"
            >${val}</button>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}


/* ═══════════════════════════════════════════════════════════
   TABS HTML
   ═══════════════════════════════════════════════════════════ */

function _buildTabsHTML(product) {
  const hasDesc = product.descriptionHtml?.trim().length > 0;

  return `
    <div class="product-tabs" style="margin-top:40px">
      <ul class="tabs-nav" role="tablist">
        ${hasDesc
          ? `<li><button class="tab-btn active" data-target="pp-tab-desc" role="tab" aria-selected="true">Descrizione</button></li>`
          : ''
        }
        <li>
          <button
            class="tab-btn${!hasDesc ? ' active' : ''}"
            data-target="pp-tab-sped"
            role="tab"
            aria-selected="${!hasDesc ? 'true' : 'false'}"
          >Spedizioni</button>
        </li>
      </ul>

      ${hasDesc ? `
      <div class="tab-panel show pp-desc-html" id="pp-tab-desc" role="tabpanel">
        ${product.descriptionHtml}
      </div>` : ''}

      <div class="tab-panel${!hasDesc ? ' show' : ''}" id="pp-tab-sped" role="tabpanel">
        <h4>Spedizione e Catena del Freddo</h4>
        <p>Spediamo esclusivamente il <strong>Lunedì e il Martedì</strong> per garantire che i prodotti freschi non restino nei magazzini dei corrieri durante il weekend.</p>
        <p><strong>Imballaggio isotermico:</strong> Box in polistirene ad alta densità con ghiaccio secco incluso. La catena del freddo è garantita per 48–72 ore dalla partenza.</p>
        <p>Non spediamo nei periodi con temperature esterne previste superiori a 30°C. La tua sicurezza alimentare viene prima di tutto.</p>
        <p><a href="spedizioni.html" style="color:var(--color-rosso);font-weight:700">Leggi la policy completa sulle spedizioni →</a></p>
      </div>
    </div>
  `;
}

function _initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('show'));
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(btn.dataset.target)?.classList.add('show');
    });
  });
}


/* ═══════════════════════════════════════════════════════════
   PRODOTTI CORRELATI
   ═══════════════════════════════════════════════════════════ */

async function _loadRelated(currentHandle) {
  const section = document.getElementById('ppRelated');
  const grid    = document.getElementById('ppRelatedGrid');
  if (!grid) return;

  try {
    const all     = await fetchProducts();
    const related = all.filter(p => p.handle !== currentHandle).slice(0, 3);

    if (!related.length) {
      section?.remove();
      return;
    }

    grid.innerHTML = related.map(p => {
      const img   = p.images.edges[0]?.node;
      const price = _fmtPrice(p.priceRange.minVariantPrice.amount);
      const desc  = (p.description ?? '').slice(0, 90);
      return `
        <article class="product-card" aria-label="${p.title}">
          <a href="product.html?handle=${p.handle}" class="card-img"
             style="display:block;text-decoration:none">
            ${img
              ? `<img src="${img.url}" alt="${img.altText || p.title}" loading="lazy">`
              : `<div class="card-img-placeholder">${p.title}</div>`
            }
          </a>
          <div class="card-body">
            <h3 class="card-name">
              <a href="product.html?handle=${p.handle}"
                 style="color:inherit;text-decoration:none">${p.title}</a>
            </h3>
            <p class="card-desc">${desc}${desc.length === 90 ? '…' : ''}</p>
            <div class="card-footer">
              <span class="card-price">${price}</span>
              <button class="add-btn" onclick="addToCart('${p.handle}')">Aggiungi</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    // Nasconde la sezione senza rompere nulla — i prodotti correlati sono bonus
    console.warn('[product-page] _loadRelated:', err);
    section?.remove();
  }
}


/* ═══════════════════════════════════════════════════════════
   SYNC UI — aggiorna prezzo e disponibilità al cambio variante
   ═══════════════════════════════════════════════════════════ */

function _syncVariantUI() {
  const v       = _getCurrentVariant();
  const addBtn  = document.getElementById('ppAddBtn');
  if (!v || !addBtn) return;

  const formatted = _fmtPrice(v.price.amount);

  // Aggiorna prezzo nell'header prodotto
  const priceEl = document.getElementById('ppPrice');
  if (priceEl) priceEl.textContent = formatted;

  // Aggiorna bottone
  addBtn.disabled = !v.availableForSale;
  addBtn.innerHTML = v.availableForSale
    ? `Aggiungi al carrello — <span id="ppBtnPrice">${formatted}</span>`
    : 'Non disponibile';
}


/* ═══════════════════════════════════════════════════════════
   FUNZIONI GLOBALI — chiamate dai handler onclick nell'HTML
   ═══════════════════════════════════════════════════════════ */

/** Switcha l'immagine principale della galleria */
function ppSwitchImg(src, alt, thumb) {
  const img = document.getElementById('ppMainImgEl');
  if (img) { img.src = src; img.alt = alt; }
  document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
}

/** Seleziona un valore di variante, aggiorna UI e prezzo */
function ppSelectOption(name, value, btn) {
  _state.selectedOptions[name] = value;

  // Aggiorna bottoni del gruppo corrispondente
  btn.closest('.pp-option-btns')
     .querySelectorAll('.pp-option-btn')
     .forEach(b => {
       b.classList.remove('active');
       b.setAttribute('aria-checked', 'false');
     });
  btn.classList.add('active');
  btn.setAttribute('aria-checked', 'true');

  _syncVariantUI();
}

/** Aggiorna la quantità (+1 / -1) */
function ppUpdateQty(delta) {
  _state.qty = Math.max(1, _state.qty + delta);
  const el = document.getElementById('ppQty');
  if (el) el.textContent = _state.qty;
}

/**
 * Aggiunge il prodotto al carrello DSCart.
 * Chiama addToCart(handle, qty, selectedOptions) da cart.js.
 * selectedOptions = [] per prodotti senza varianti.
 */
function ppAddToCart() {
  if (!_state.product) return;
  const opts = _isDefaultVariantOnly(_state.product) ? [] : _getSelectedOptionsArray();
  addToCart(_state.product.handle, _state.qty, opts);
}


/* ── Start ────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', initProductPage);
