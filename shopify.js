/* ═══════════════════════════════════════════════════════════
   Delizie Siciliane — Shopify Storefront API Client

   CONFIGURAZIONE OBBLIGATORIA prima del go-live:
   - STOREFRONT_API_URL  →  https://TUO-NEGOZIO.myshopify.com/api/2024-01/graphql.json
   - STOREFRONT_ACCESS_TOKEN  →  token pubblico Storefront
     (Shopify Admin › Apps › Develop apps › Storefront API)
   ═══════════════════════════════════════════════════════════ */

'use strict';

const STOREFRONT_API_URL          = "https://dih01d-54.myshopify.com/api/2024-01/graphql.json";
const STOREFRONT_ACCESS_TOKEN     = "d9385641acaafb3356fc88558fc3ef92";
const SHOPIFY_CONFIGURED          = (STOREFRONT_API_URL !== "DA_INSERIRE");


/* ── GraphQL helper ──────────────────────────────────────── */

async function shopifyFetch(query, variables = {}) {
  const res = await fetch(STOREFRONT_API_URL, {
    method:  'POST',
    headers: {
      'Content-Type':                         'application/json',
      'X-Shopify-Storefront-Access-Token':    STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Shopify HTTP ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map(e => e.message).join(', '));

  return json.data;
}


/* ── Cart ID — localStorage ──────────────────────────────── */

function _getCartId()      { return localStorage.getItem('shopify_cart_id'); }
function _setCartId(id)    { localStorage.setItem('shopify_cart_id', id); }
function _clearCartId()    { localStorage.removeItem('shopify_cart_id'); }


/* ── Create Shopify cart ─────────────────────────────────── */

async function shopifyCreateCart() {
  const data = await shopifyFetch(`
    mutation {
      cartCreate {
        cart { id checkoutUrl }
        userErrors { field message }
      }
    }
  `);

  const { cart, userErrors } = data.cartCreate;
  if (userErrors?.length) throw new Error(userErrors.map(e => e.message).join(', '));

  _setCartId(cart.id);
  return cart.id;
}


/* ── Get or create cart ID ───────────────────────────────── */

async function getOrCreateCartId() {
  return _getCartId() || shopifyCreateCart();
}


/* ── Resolve variantId from handle + selectedOptions ─────── */

/**
 * Fetches the product from Shopify and returns the correct variantId.
 *
 * @param {string}  handle           - Shopify product handle (es. "kit-cannolo")
 * @param {Array}   selectedOptions  - es. [{name:"Peso", value:"500g"}]
 *                                     Passare [] per prodotti senza varianti.
 * @returns {Promise<string>}  variantId nel formato gid://shopify/ProductVariant/...
 */
async function resolveVariantId(handle, selectedOptions = []) {
  const data = await shopifyFetch(`
    query GetVariants($handle: String!) {
      product(handle: $handle) {
        variants(first: 50) {
          edges {
            node {
              id
              availableForSale
              selectedOptions { name value }
            }
          }
        }
      }
    }
  `, { handle });

  if (!data.product) throw new Error(`Prodotto non trovato su Shopify: "${handle}"`);

  const variants = data.product.variants.edges.map(e => e.node);

  // Nessuna opzione richiesta → prima variante disponibile (o prima in assoluto)
  if (!selectedOptions.length) {
    const pick = variants.find(v => v.availableForSale) ?? variants[0];
    if (!pick) throw new Error(`Nessuna variante per: "${handle}"`);
    return pick.id;
  }

  // Match esatto su tutte le opzioni richieste
  const match = variants.find(v =>
    selectedOptions.every(opt =>
      v.selectedOptions.some(so => so.name === opt.name && so.value === opt.value)
    )
  );

  if (!match) {
    throw new Error(
      `Variante non trovata per "${handle}" con opzioni: ` +
      selectedOptions.map(o => `${o.name}=${o.value}`).join(', ')
    );
  }

  return match.id;
}


/* ── Add lines to Shopify cart ───────────────────────────── */

/**
 * Aggiunge un array di linee a un carrello Shopify.
 * Se il cartId è scaduto, lo ricrea automaticamente e riprova (una volta).
 *
 * @param {Array<{merchandiseId: string, quantity: number}>} lines
 * @returns {Promise<{id, checkoutUrl, totalQuantity, cost}>}
 */
async function shopifyAddLines(lines) {
  let cartId = await getOrCreateCartId();

  const mutation = `
    mutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          totalQuantity
          cost { totalAmount { amount currencyCode } }
        }
        userErrors { field message }
      }
    }
  `;

  let data;
  try {
    data = await shopifyFetch(mutation, { cartId, lines });
  } catch (err) {
    // Cart scaduto o non valido → ricrea e riprova una volta
    const msg = err.message.toLowerCase();
    if (msg.includes('not found') || msg.includes('invalid') || msg.includes('does not exist')) {
      _clearCartId();
      cartId = await shopifyCreateCart();
      data   = await shopifyFetch(mutation, { cartId, lines });
    } else {
      throw err;
    }
  }

  const { cart, userErrors } = data.cartLinesAdd;
  if (userErrors?.length) throw new Error(userErrors.map(e => e.message).join(', '));

  return cart;
}


/* ── Fetch cart ──────────────────────────────────────────── */

async function fetchCart(cartId) {
  const data = await shopifyFetch(`
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price { amount currencyCode }
                  product { title handle }
                  image { url altText }
                }
              }
            }
          }
        }
      }
    }
  `, { cartId });

  return data.cart;
}


/* ── Update/remove cart lines ────────────────────────────── */

async function updateCartItem(cartId, lineId, quantity) {
  const data = await shopifyFetch(`
    mutation UpdateLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { id totalQuantity cost { totalAmount { amount currencyCode } } }
        userErrors { field message }
      }
    }
  `, { cartId, lines: [{ id: lineId, quantity }] });

  const { userErrors } = data.cartLinesUpdate;
  if (userErrors?.length) throw new Error(userErrors.map(e => e.message).join(', '));

  return data.cartLinesUpdate.cart;
}

async function removeCartItem(cartId, lineId) {
  const data = await shopifyFetch(`
    mutation RemoveLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { id totalQuantity cost { totalAmount { amount currencyCode } } }
        userErrors { field message }
      }
    }
  `, { cartId, lineIds: [lineId] });

  const { userErrors } = data.cartLinesRemove;
  if (userErrors?.length) throw new Error(userErrors.map(e => e.message).join(', '));

  return data.cartLinesRemove.cart;
}


/* ── Fetch products / single product ─────────────────────── */

async function fetchProducts(collectionHandle = null) {
  if (collectionHandle) {
    const data = await shopifyFetch(`
      query GetCollection($handle: String!) {
        collection(handle: $handle) {
          products(first: 50) {
            edges {
              node {
                id title handle description tags
                images(first: 1) { edges { node { url altText } } }
                priceRange { minVariantPrice { amount currencyCode } }
                variants(first: 10) {
                  edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } }
                }
              }
            }
          }
        }
      }
    `, { handle: collectionHandle });
    return data.collection?.products?.edges?.map(e => e.node) ?? [];
  }

  const data = await shopifyFetch(`
    query GetAllProducts {
      products(first: 50) {
        edges {
          node {
            id title handle description tags
            images(first: 1) { edges { node { url altText } } }
            priceRange { minVariantPrice { amount currencyCode } }
            variants(first: 10) {
              edges { node { id title price { amount currencyCode } availableForSale selectedOptions { name value } } }
            }
          }
        }
      }
    }
  `);
  return data.products?.edges?.map(e => e.node) ?? [];
}

/* ── Metafields richiesti sulle pagine prodotto ──────────────
   Da creare su Shopify Admin › Settings › Custom data › Products
   (tutti con "Storefronts" spuntato in Access).

   BASE (consigliati su tutti i prodotti):
     • custom.descrizione     → Rich text           → tab "Descrizione" (testo esteso/editoriale).
                                                        Il campo "Description" standard di Shopify
                                                        viene invece usato SOLO come short-desc
                                                        nella hero (sotto il prezzo).
     • custom.ingredienti     → Rich text           → tab "Ingredienti"
     • custom.conservazione   → Rich text           → tab "Conservazione"
     • custom.spedizioni      → Rich text (opz.)    → tab "Spedizioni" (override)
     • custom.unita           → Single line text    → suffisso prezzo ("pz", "kit",
                                                        "box", "g", "kg"…)
                                                        default "pz" se vuoto

   EXTRA (solo per prodotti complessi come kit / box):
     • custom.composizione    → Rich text             → tab "Cosa comprende"
     • custom.preparazione    → Rich text             → tab "Preparazione"
     • custom.opzioni_visuali → JSON                  → rendering a card delle varianti
                                                          (pallino colorato + sottotitolo)

   GRUPPO CROSS-PRODUCT (per prodotti separati collegati, es. cannoli
   ricotta/pistacchio/cioccolato: stesso gruppo, pagine diverse):
     • custom.cross_gruppo       → List of product references
                                    → gli altri prodotti del gruppo
                                      (consiglio: stessa lista su tutti e 3,
                                       il codice auto-identifica quello corrente)
     • custom.cross_gruppo_label → Single line text    → label del gruppo
                                                          es. "Farcitura" (default "Variante")
     • custom.cross_etichetta    → Single line text    → testo del bottone sullo switcher
                                                          per QUESTO prodotto
                                                          es. "Pistacchio". Se vuoto usa
                                                          il titolo del prodotto.

   Se un metafield manca o è vuoto, la funzione corrispondente
   viene nascosta automaticamente (graceful degrade).
   ───────────────────────────────────────────────────────────── */
const PRODUCT_METAFIELD_IDS = [
  { namespace: "custom", key: "descrizione"        },
  { namespace: "custom", key: "ingredienti"        },
  { namespace: "custom", key: "conservazione"      },
  { namespace: "custom", key: "spedizioni"         },
  { namespace: "custom", key: "unita"              },
  { namespace: "custom", key: "composizione"       },
  { namespace: "custom", key: "preparazione"       },
  { namespace: "custom", key: "opzioni_visuali"    },
  { namespace: "custom", key: "cross_gruppo"       },
  { namespace: "custom", key: "cross_gruppo_label" },
  { namespace: "custom", key: "cross_etichetta"    },
  { namespace: "custom", key: "brevettato"         },
];

async function fetchProductByHandle(handle) {
  const data = await shopifyFetch(`
    query GetProduct($handle: String!, $mfIds: [HasMetafieldsIdentifier!]!) {
      product(handle: $handle) {
        id title handle descriptionHtml description tags
        images(first: 5) { edges { node { url altText } } }
        priceRange { minVariantPrice { amount currencyCode } }
        variants(first: 20) {
          edges {
            node {
              id title price { amount currencyCode }
              availableForSale
              selectedOptions { name value }
            }
          }
        }
        metafields(identifiers: $mfIds) {
          namespace
          key
          value
          type
          references(first: 20) {
            edges {
              node {
                __typename
                ... on Product {
                  id
                  handle
                  title
                  availableForSale
                  featuredImage { url altText }
                  crossEtichetta: metafield(namespace: "custom", key: "cross_etichetta") {
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `, { handle, mfIds: PRODUCT_METAFIELD_IDS });
  return data.product;
}


/* ═══════════════════════════════════════════════════════════
   dsCheckout — sincronizza DSCart locale → Shopify → redirect
   ═══════════════════════════════════════════════════════════ */

/**
 * Punto d'ingresso del checkout. Chiamato dal bottone nel drawer:
 *   onclick="dsCheckout()"
 *
 * Flusso:
 *   1. Controlla che Shopify sia configurato
 *   2. Per ogni item in DSCart: risolve il variantId su Shopify
 *   3. Aggiunge tutte le linee al carrello Shopify in una mutation
 *   4. Redirect a checkoutUrl
 *
 * In caso di errore: mostra un messaggio inline nel drawer (niente alert).
 */
async function dsCheckout() {
  // dsCart è definito in cart.js, caricato dopo questo file
  if (typeof dsCart === 'undefined' || !dsCart._items.length) return;

  const btn = document.getElementById('ds-checkout-btn');

  // Se Shopify non è ancora configurato → feedback chiaro (non alert)
  if (!SHOPIFY_CONFIGURED) {
    _showCheckoutError(
      'Il checkout Shopify non è ancora configurato. ' +
      'Inserisci le credenziali in shopify.js per attivarlo.'
    );
    return;
  }

  // Stato di caricamento sul bottone
  const originalLabel = btn?.innerHTML ?? '';
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = 'Preparazione checkout&hellip;';
  }

  try {
    // Crea sempre un carrello Shopify nuovo per evitare duplicati
    // se l'utente torna indietro dal checkout e riprova
    _clearCartId();

    // Risolve tutti i variantId in parallelo
    const lines = await Promise.all(
      dsCart._items.map(async item => {
        const variantId = await resolveVariantId(
          item.handle,
          item.selectedOptions ?? []
        );
        return { merchandiseId: variantId, quantity: item.qty };
      })
    );

    // Aggiunge tutte le linee in una sola mutation
    const cart = await shopifyAddLines(lines);

    // Redirect verso il checkout Shopify
    window.location.href = cart.checkoutUrl;

  } catch (err) {
    console.error('[dsCheckout]', err);

    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = originalLabel;
    }

    _showCheckoutError('Errore durante il checkout. Riprova tra qualche secondo.');
  }
}

/* Mostra un messaggio di errore inline nel drawer (nessun alert) */
function _showCheckoutError(msg) {
  const list = document.getElementById('ds-cart-list');
  if (!list) return;

  list.querySelectorAll('.ds-checkout-error').forEach(el => el.remove());

  const el = document.createElement('p');
  el.className  = 'ds-checkout-error';
  el.style.cssText =
    'color:var(--color-rosso);font-size:13px;padding:10px 0 0;text-align:center;line-height:1.5;';
  el.textContent = msg;
  list.prepend(el);
}
