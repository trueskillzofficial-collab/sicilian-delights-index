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

function _lcp(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  let   handle = params.get('handle');
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

  try {
    let product = await fetchProductByHandle(handle);

    if (!product) {
      // Handle non trovato: cerca il prodotto più simile tra tutti quelli su Shopify
      const all = await fetchProducts().catch(() => []);
      let best = null, bestScore = 2;
      all.forEach(p => {
        const s = _lcp(handle, p.handle);
        if (s > bestScore) { best = p.handle; bestScore = s; }
      });
      if (best) {
        handle = best;
        history.replaceState(null, '', '?handle=' + encodeURIComponent(best));
        product = await fetchProductByHandle(best);
      }
    }

    if (!product) {
      _renderError(main, 'Prodotto non trovato.', 'Nessun prodotto corrispondente trovato nel catalogo.');
      return;
    }

    _state.product = product;
    _initDefaultOptions(product);
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

  } catch (err) {
    console.error('[product-page] initProductPage:', err);
    _renderError(
      main,
      'Errore nel caricamento.',
      'Controlla la connessione e riprova. Se il problema persiste, contattaci.'
    );
  }
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
   METAFIELDS — helper
   ═══════════════════════════════════════════════════════════ */

/** Estrae il metafield { namespace, key } dall'array product.metafields */
function _getMetafield(product, namespace, key) {
  const list = product?.metafields;
  if (!Array.isArray(list)) return null;
  return list.find(m => m && m.namespace === namespace && m.key === key) || null;
}

/** Converte il valore di un metafield in HTML renderizzabile.
 *  Supporta: rich_text_field (JSON), multi_line_text_field,
 *  single_line_text_field, html (legacy).
 *  Ritorna '' se vuoto o non parsabile. */
function _metafieldToHtml(mf) {
  if (!mf || !mf.value) return '';
  const type = mf.type || '';
  const val  = mf.value;

  if (type === 'rich_text_field') {
    try {
      const node = JSON.parse(val);
      return _richTextNodeToHtml(node);
    } catch (e) {
      console.warn('[product-page] rich_text_field non parsabile:', e);
      return _escapeHtml(val).replace(/\n/g, '<br>');
    }
  }

  if (type === 'multi_line_text_field') {
    // Converte doppi a capo in paragrafi, singoli in <br>
    return _escapeHtml(val)
      .split(/\n{2,}/)
      .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  // single_line_text_field, html, altro → paragrafo semplice/HTML grezzo
  if (type === 'html' || /^<[a-z]/i.test(val.trim())) return val;
  return `<p>${_escapeHtml(val)}</p>`;
}

/** Converte il JSON Rich Text di Shopify in HTML minimale. */
function _richTextNodeToHtml(node) {
  if (!node) return '';
  if (Array.isArray(node)) return node.map(_richTextNodeToHtml).join('');

  const kids = () => (node.children || []).map(_richTextNodeToHtml).join('');

  switch (node.type) {
    case 'root':      return kids();
    case 'paragraph': return `<p>${kids()}</p>`;
    case 'heading': {
      const lvl = Math.min(Math.max(parseInt(node.level) || 4, 2), 6);
      return `<h${lvl}>${kids()}</h${lvl}>`;
    }
    case 'list': {
      const tag = node.listType === 'ordered' ? 'ol' : 'ul';
      return `<${tag}>${kids()}</${tag}>`;
    }
    case 'list-item': return `<li>${kids()}</li>`;
    case 'link': {
      const href = _escapeHtml(node.url || '#');
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${kids()}</a>`;
    }
    case 'text': {
      let t = _escapeHtml(node.value || '');
      if (node.bold)   t = `<strong>${t}</strong>`;
      if (node.italic) t = `<em>${t}</em>`;
      return t;
    }
    default:
      return kids();
  }
}

function _escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Estrae il valore testuale di un metafield "single_line_text_field"
 *  restituendo '' se vuoto o assente. */
function _getTextMetafield(product, namespace, key) {
  const mf = _getMetafield(product, namespace, key);
  return (mf?.value ?? '').trim();
}

/** Suffisso unità di misura per il prezzo unitario: "pz", "kit", "box"…
 *  Legge custom.unita (default "pz"). Sanitizza a max 16 char. */
function _getUnitLabel(product) {
  const raw = _getTextMetafield(product, 'custom', 'unita');
  const val = (raw || 'pz').slice(0, 16);
  return _escapeHtml(val);
}

/** Parsa il metafield JSON custom.opzioni_visuali. Esempio valido:
 *  {
 *    "Ripieno": {
 *      "style": "card",
 *      "values": {
 *        "Ricotta classica": { "color": "#f0ede0", "subtitle": "500g…" }
 *      }
 *    }
 *  }
 *  Ritorna {} se il metafield è assente/non parsabile. */
function _getVisualOptions(product) {
  const mf = _getMetafield(product, 'custom', 'opzioni_visuali');
  if (!mf || !mf.value) return {};
  try {
    const parsed = JSON.parse(mf.value);
    return (parsed && typeof parsed === 'object') ? parsed : {};
  } catch (e) {
    console.warn('[product-page] custom.opzioni_visuali non è JSON valido:', e);
    return {};
  }
}

/** True se il prodotto è del sub-brand "la Cannoleria" (tag shopify). */
function _hasCannoleriaTag(product) {
  return Array.isArray(product?.tags) && product.tags.includes('cannoleria');
}

/** Estrae il gruppo cross-product (cannolo ricotta/pistacchio/cioccolato, ecc.)
 *  Restituisce { label, items } dove items = [{handle, title, etichetta, isCurrent, isAvailable}]
 *  oppure null se il prodotto non fa parte di nessun gruppo cross. */
function _getCrossGroup(product) {
  if (!product) return null;

  const mf = _getMetafield(product, 'custom', 'cross_gruppo');
  const refEdges = mf?.references?.edges;
  if (!Array.isArray(refEdges) || !refEdges.length) return null;

  // Etichetta del gruppo (es. "Farcitura"); fallback "Variante"
  const label = _getTextMetafield(product, 'custom', 'cross_gruppo_label') || 'Variante';
  // Etichetta del prodotto corrente nello switcher
  const myEtichetta = _getTextMetafield(product, 'custom', 'cross_etichetta');

  // Mappiamo i prodotti referenziati + includiamo il prodotto corrente (se non già listato)
  const items = refEdges
    .map(e => e?.node)
    .filter(n => n && n.__typename === 'Product')
    .map(n => ({
      handle:      n.handle,
      title:       n.title,
      etichetta:  (n.crossEtichetta?.value ?? '').trim() || n.title,
      isCurrent:   n.handle === product.handle,
      isAvailable: n.availableForSale !== false,
    }));

  // Se il cliente non ha incluso il prodotto corrente nella lista,
  // lo aggiungiamo noi all'inizio così lo switcher è sempre completo.
  if (!items.some(i => i.isCurrent)) {
    items.unshift({
      handle:      product.handle,
      title:       product.title,
      etichetta:   myEtichetta || product.title,
      isCurrent:   true,
      isAvailable: true,
    });
  }

  // Se rimane un solo elemento (solo se stesso) non ha senso mostrare lo switcher
  if (items.length < 2) return null;

  return { label, items };
}


/* ═══════════════════════════════════════════════════════════
   RENDER PRODOTTO
   ═══════════════════════════════════════════════════════════ */

function _renderProduct(container, product) {
  const variants       = _flatVariants(product);
  const images         = product.images.edges.map(e => e.node);
  const variant        = _getCurrentVariant();
  const isBest         = product.tags?.includes('best-seller');
  const isNew          = product.tags?.includes('new');
  const isCann         = _hasCannoleriaTag(product);
  const isBrevettato   = _getTextMetafield(product, 'custom', 'brevettato') === 'true';
  const unitLabel      = _getUnitLabel(product);

  // Banner brevetto full-width — iniettato prima del #product-main
  const oldBanner = document.getElementById('pp-brevetto-banner');
  if (oldBanner) oldBanner.remove();
  if (isBrevettato) {
    const banner = document.createElement('div');
    banner.id        = 'pp-brevetto-banner';
    banner.className = 'brevetto-banner';
    banner.setAttribute('role', 'complementary');
    banner.innerHTML = '<span>★</span> Prodotto <span>brevettato</span> — Invenzione originale di Delizie Siciliane <span>★</span>';
    container.before(banner);
  }

  container.innerHTML = `

    <!-- ── Breadcrumb ──────────────────────────────────────── -->
    <div class="pp-breadcrumb">
      <div class="container">
        <nav aria-label="Percorso di navigazione" style="font-size:12px;color:var(--color-castagna)">
          <a href="home.html">Home</a>
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
              ${isBest        ? `<span class="badge" style="position:absolute;top:16px;left:16px">BEST<br>SELLER</span>` : ''}
              ${isNew         ? `<span class="badge pp-badge-new" style="position:absolute;top:16px;left:16px">NUOVO</span>` : ''}
              ${isBrevettato  ? `<span class="badge badge-left">Brevettato</span>` : ''}
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
              ${isCann
                ? `<span class="card-cannoleria" style="font-size:15px">la Cannoleria</span>`
                : `<span style="font-family:var(--font-script);font-size:16px;color:var(--color-castagna)">Delizie Siciliane</span>`
              }
              ${isBest ? '&nbsp;· <strong>Best Seller</strong>' : ''}
              ${isNew  ? '&nbsp;· <strong>Nuovo</strong>'       : ''}
            </p>

            <h1>${product.title}</h1>

            <p class="product-price-tag" id="ppPrice">
              ${_fmtPrice(variant.price.amount)}
              <span style="font-size:16px;color:var(--color-castagna);font-family:var(--font-body);font-weight:500">/ ${unitLabel}</span>
            </p>

            ${product.description
              ? `<p class="product-short-desc">${product.description.slice(0, 240)}${product.description.length > 240 ? '…' : ''}</p>`
              : ''
            }

            ${isBrevettato ? `<div class="brevetto-tag">Brevetto esclusivo Delizie Siciliane</div>` : ''}

            <!-- Switcher tra prodotti fratelli (es. cannolo ricotta / pistacchio / cioccolato) -->
            ${_buildCrossGroupHTML(product)}

            <!-- Varianti interne al singolo prodotto (peso, taglia, ripieno kit…) -->
            ${_isDefaultVariantOnly(product) ? '' : _buildVariantSelectorHTML(variants, product)}

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
                  ? `Aggiungi al carrello — €<span id="ppBtnPrice">${parseFloat(variant.price.amount).toFixed(2).replace('.', ',')}</span>`
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
                ${isBrevettato ? 'Ricetta brevettata' : '100% artigianale'}
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

/* ═══════════════════════════════════════════════════════════
   CROSS-PRODUCT SWITCHER
   (stessa famiglia: cannolo ricotta / pistacchio / cioccolato)
   ═══════════════════════════════════════════════════════════ */

function _buildCrossGroupHTML(product) {
  const group = _getCrossGroup(product);
  if (!group) return '';

  return `
    <div class="pp-option-group pp-cross-group" data-option-group="${_attr(group.label)}">
      <p class="pp-option-label">${_escapeHtml(group.label)}</p>
      <div class="pp-option-btns" role="group" aria-label="Scegli ${_attr(group.label)}">
        ${group.items.map(it => {
          if (it.isCurrent) {
            return `
              <button
                type="button"
                class="pp-option-btn active pp-cross-btn"
                aria-current="page"
                disabled
              >${_escapeHtml(it.etichetta)}</button>
            `;
          }
          const href = `product.html?handle=${encodeURIComponent(it.handle)}`;
          const unavailableCls = it.isAvailable ? '' : ' unavailable';
          return `
            <a href="${href}"
               class="pp-cross-link${unavailableCls}"
               aria-label="Vai a ${_attr(it.title)}">
              <span class="pp-option-btn pp-cross-btn${unavailableCls}">${_escapeHtml(it.etichetta)}</span>
            </a>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/** Escape per inserimento dentro un attributo HTML tra doppi apici. */
function _attr(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Escape di una stringa JS destinata a un attributo onclick="…".
 *  Restituisce il letterale da mettere tra apici singoli, es:
 *  onclick="ppSelectOption('Name','<escaped>', this)". */
function _jsAttr(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '&quot;')
    .replace(/</g, '\\u003C');
}

function _buildVariantSelectorHTML(variants, product) {
  // Raggruppa i valori per nome opzione, preservando l'ordine di apparizione
  const groups = {};       // { [optName]: Set<value> }
  const order  = [];       // ordine dei nomi opzione
  variants.forEach(v => {
    v.selectedOptions.forEach(opt => {
      if (!groups[opt.name]) { groups[opt.name] = new Set(); order.push(opt.name); }
      groups[opt.name].add(opt.value);
    });
  });

  const visualMap = _getVisualOptions(product);

  return order.map(name => {
    const values    = [...groups[name]];
    const visualCfg = visualMap[name];
    const isCard    = visualCfg && visualCfg.style === 'card';

    return `
      <div class="pp-option-group" data-option-group="${_attr(name)}">
        <p class="pp-option-label">${_escapeHtml(name)}</p>
        ${isCard
          ? _buildCardOptionsHTML(name, values, visualCfg.values || {})
          : _buildPillOptionsHTML(name, values)
        }
      </div>
    `;
  }).join('');
}

/** Rendering "classico" a pill orizzontali — per Peso, Taglia, ecc. */
function _buildPillOptionsHTML(name, values) {
  return `
    <div class="pp-option-btns" role="radiogroup" aria-label="Scegli ${_attr(name)}">
      ${values.map(val => {
        const active = _state.selectedOptions[name] === val;
        return `
          <button
            class="pp-option-btn${active ? ' active' : ''}"
            onclick="ppSelectOption('${_jsAttr(name)}', '${_jsAttr(val)}', this)"
            role="radio"
            aria-checked="${active ? 'true' : 'false'}"
            data-option="${_attr(name)}"
            data-value="${_attr(val)}"
          >${_escapeHtml(val)}</button>
        `;
      }).join('')}
    </div>
  `;
}

/** Rendering a card verticali con pallino colorato + sottotitolo —
 *  per scelte "ricche" come il ripieno del Kit Cannoli.
 *  valueMeta = { "<optionValue>": { color: "#…", subtitle: "…" } } */
function _buildCardOptionsHTML(name, values, valueMeta) {
  return `
    <div class="pp-option-cards" role="radiogroup" aria-label="Scegli ${_attr(name)}">
      ${values.map(val => {
        const meta     = valueMeta[val] || {};
        const color    = meta.color    || 'var(--color-crema)';
        const subtitle = meta.subtitle || '';
        const active   = _state.selectedOptions[name] === val;
        return `
          <button
            type="button"
            class="pp-option-card${active ? ' selected' : ''}"
            onclick="ppSelectOption('${_jsAttr(name)}', '${_jsAttr(val)}', this)"
            role="radio"
            aria-checked="${active ? 'true' : 'false'}"
            data-option="${_attr(name)}"
            data-value="${_attr(val)}"
          >
            <span class="pp-option-dot" style="background:${_attr(color)}"></span>
            <span class="pp-option-card-body">
              <span class="pp-option-card-name">${_escapeHtml(val)}</span>
              ${subtitle ? `<span class="pp-option-card-sub">${_escapeHtml(subtitle)}</span>` : ''}
            </span>
            <svg class="pp-option-card-check" width="16" height="16" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"
                 aria-hidden="true">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </button>
        `;
      }).join('')}
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════════
   TABS HTML — fino a 6 tab, tutte opzionali tranne Descrizione
   e Spedizioni (quest'ultima con fallback generico). Ordine:
     Descrizione · Cosa comprende · Preparazione ·
     Ingredienti · Conservazione · Spedizioni
   Tab mostrata solo se il metafield corrispondente è compilato.
   ═══════════════════════════════════════════════════════════ */

/* Testo di default per la tab Spedizioni — usato se il prodotto
   non ha il metafield custom.spedizioni valorizzato. */
const _DEFAULT_SPEDIZIONI_HTML = `
  <h4>Spedizione e Catena del Freddo</h4>
  <p>Spediamo esclusivamente il <strong>Lunedì e il Martedì</strong> per garantire che i prodotti freschi non restino nei magazzini dei corrieri durante il weekend.</p>
  <p><strong>Imballaggio isotermico:</strong> Box in polistirene ad alta densità con ghiaccio secco incluso. La catena del freddo è garantita per 48–72 ore dalla partenza.</p>
  <p>Non spediamo nei periodi con temperature esterne previste superiori a 30°C. La tua sicurezza alimentare viene prima di tutto.</p>
  <p><a href="spedizioni.html" style="color:var(--color-rosso);font-weight:700">Leggi la policy completa sulle spedizioni →</a></p>
`;

function _buildTabsHTML(product) {
  // Tab "Descrizione" → SOLO dal metafield custom.descrizione.
  // Il campo Description standard di Shopify viene usato altrove (short-desc hero),
  // quindi qui NON facciamo fallback su descriptionHtml.
  const descHtml           = _metafieldToHtml(_getMetafield(product, 'custom', 'descrizione'));

  const composizioneHtml   = _metafieldToHtml(_getMetafield(product, 'custom', 'composizione'));
  const preparazioneHtml   = _metafieldToHtml(_getMetafield(product, 'custom', 'preparazione'));
  const ingredientiHtml    = _metafieldToHtml(_getMetafield(product, 'custom', 'ingredienti'));
  const conservazioneHtml  = _metafieldToHtml(_getMetafield(product, 'custom', 'conservazione'));
  const spedizioniCustom   = _metafieldToHtml(_getMetafield(product, 'custom', 'spedizioni'));
  const spedizioniHtml     = spedizioniCustom || _DEFAULT_SPEDIZIONI_HTML;

  // Ordine delle tab. Mostrate solo se il rispettivo metafield è compilato.
  // Spedizioni è l'unica con fallback generico → di fatto sempre presente.
  // Descrizione legge da custom.descrizione: se vuoto, la tab scompare
  // (il field Description standard di Shopify è già visibile nella hero).
  const tabs = [
    { id: 'pp-tab-desc',    label: 'Descrizione',    html: descHtml },
    { id: 'pp-tab-comp',    label: 'Cosa comprende', html: composizioneHtml },
    { id: 'pp-tab-prep',    label: 'Preparazione',   html: preparazioneHtml },
    { id: 'pp-tab-ingred',  label: 'Ingredienti',    html: ingredientiHtml },
    { id: 'pp-tab-conserv', label: 'Conservazione',  html: conservazioneHtml },
    { id: 'pp-tab-sped',    label: 'Spedizioni',     html: spedizioniHtml },
  ].filter(t => t.html && t.html.trim().length > 0);

  if (!tabs.length) return '';

  // La prima tab con contenuto è attiva di default
  const buttons = tabs.map((t, i) => `
    <li>
      <button
        class="tab-btn${i === 0 ? ' active' : ''}"
        data-target="${t.id}"
        role="tab"
        aria-selected="${i === 0 ? 'true' : 'false'}"
      >${t.label}</button>
    </li>
  `).join('');

  const panels = tabs.map((t, i) => `
    <div class="tab-panel${i === 0 ? ' show' : ''} pp-desc-html" id="${t.id}" role="tabpanel">
      ${t.html}
    </div>
  `).join('');

  return `
    <div class="product-tabs" style="margin-top:40px">
      <ul class="tabs-nav" role="tablist">
        ${buttons}
      </ul>
      ${panels}
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
   SYNC UI — aggiorna prezzo e disponibilità al cambio variante.
   Il prezzo "grande" resta il prezzo unitario (/ pz);
   il bottone "Aggiungi al carrello" mostra il TOTALE (unit × qty).
   Fonte di verità sui prezzi = Shopify (qui la UI è di supporto).
   ═══════════════════════════════════════════════════════════ */

function _syncVariantUI() {
  const v      = _getCurrentVariant();
  const addBtn = document.getElementById('ppAddBtn');
  if (!v || !addBtn) return;

  const unitLabel = _getUnitLabel(_state.product);

  // Aggiorna prezzo unitario nell'header prodotto
  const priceEl = document.getElementById('ppPrice');
  if (priceEl) {
    priceEl.innerHTML =
      `${_fmtPrice(v.price.amount)}` +
      `<span style="font-size:16px;color:var(--color-castagna);font-family:var(--font-body);font-weight:500">/ ${unitLabel}</span>`;
  }

  // Aggiorna bottone (disponibilità + prezzo totale)
  addBtn.disabled = !v.availableForSale;
  if (v.availableForSale) {
    const total = parseFloat(v.price.amount) * _state.qty;
    addBtn.innerHTML =
      `Aggiungi al carrello — €<span id="ppBtnPrice">${total.toFixed(2).replace('.', ',')}</span>`;
  } else {
    addBtn.innerHTML = 'Non disponibile';
  }
}

/** Aggiorna solo il prezzo totale nel bottone — chiamato al cambio qty. */
function _syncTotalPrice() {
  const v = _getCurrentVariant();
  const priceSpan = document.getElementById('ppBtnPrice');
  if (!v || !priceSpan) return;
  const total = parseFloat(v.price.amount) * _state.qty;
  priceSpan.textContent = total.toFixed(2).replace('.', ',');
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

/** Seleziona un valore di variante, aggiorna UI e prezzo.
 *  Funziona sia con i pill (.pp-option-btn) che con le card (.pp-option-card). */
function ppSelectOption(name, value, btn) {
  _state.selectedOptions[name] = value;

  // Aggiorna tutti i bottoni del gruppo (pill o card)
  const group = btn.closest('.pp-option-group');
  if (group) {
    group.querySelectorAll('.pp-option-btn, .pp-option-card').forEach(b => {
      b.classList.remove('active', 'selected');
      b.setAttribute('aria-checked', 'false');
    });
  }

  // Classe corretta in base al tipo di bottone
  btn.classList.add(btn.classList.contains('pp-option-card') ? 'selected' : 'active');
  btn.setAttribute('aria-checked', 'true');

  _syncVariantUI();
}

/** Aggiorna la quantità (+1 / -1) e ricalcola il prezzo totale nel bottone. */
function ppUpdateQty(delta) {
  _state.qty = Math.max(1, _state.qty + delta);
  const el = document.getElementById('ppQty');
  if (el) el.textContent = _state.qty;
  _syncTotalPrice();
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
