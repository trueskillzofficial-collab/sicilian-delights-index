/* ═══════════════════════════════════════════════════════════
   Delizie Siciliane — Shopify Storefront API Client
   ═══════════════════════════════════════════════════════════
   
   ⚠️ CONFIGURAZIONE OBBLIGATORIA:
   Sostituisci i valori "DA_INSERIRE" con le credenziali reali
   del tuo negozio Shopify prima del go-live.
   
   - STOREFRONT_API_URL: l'URL GraphQL del tuo negozio
     Formato: https://TUO-NEGOZIO.myshopify.com/api/2024-01/graphql.json
   
   - STOREFRONT_ACCESS_TOKEN: il token pubblico Storefront
     (non il token Admin — quello è privato!)
     Lo trovi in Shopify Admin > Apps > Develop apps > Storefront API
   ══════════════════════════════════════════════════════════ */

const STOREFRONT_API_URL = "DA_INSERIRE";
const STOREFRONT_ACCESS_TOKEN = "DA_INSERIRE";


/**
 * Helper interno — esegue una query GraphQL verso Shopify Storefront API.
 * @param {string} query - La query GraphQL
 * @param {object} variables - Le variabili della query
 * @returns {Promise<object>} - Il campo `data` della risposta
 */
async function shopifyFetch(query, variables = {}) {
  const res = await fetch(STOREFRONT_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors.map(e => e.message).join(", "));
  }

  return json.data;
}


/**
 * Ottiene o crea un cartId salvato in localStorage.
 * Se il cart non esiste ancora, ne crea uno nuovo via Shopify.
 * @returns {Promise<string>} - L'ID del carrello
 */
async function getOrCreateCartId() {
  let cartId = localStorage.getItem("shopify_cart_id");

  if (cartId) return cartId;

  // Crea un nuovo carrello vuoto
  const data = await shopifyFetch(`
    mutation {
      cartCreate {
        cart { id }
        userErrors { field message }
      }
    }
  `);

  cartId = data.cartCreate.cart.id;
  localStorage.setItem("shopify_cart_id", cartId);
  return cartId;
}


/**
 * Recupera tutti i prodotti, opzionalmente filtrati per collection handle.
 * @param {string|null} collectionHandle - Handle della collezione (es. "cannoli"). null = tutti.
 * @returns {Promise<Array>} - Array di prodotti con id, title, handle, images, variants, tags, priceRange
 */
async function fetchProducts(collectionHandle = null) {
  if (collectionHandle) {
    const data = await shopifyFetch(`
      query GetCollection($handle: String!) {
        collection(handle: $handle) {
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                description
                tags
                images(first: 1) {
                  edges { node { url altText } }
                }
                priceRange {
                  minVariantPrice { amount currencyCode }
                }
                variants(first: 10) {
                  edges {
                    node { id title price { amount currencyCode } availableForSale }
                  }
                }
              }
            }
          }
        }
      }
    `, { handle: collectionHandle });

    return data.collection?.products?.edges?.map(e => e.node) || [];
  }

  // Tutti i prodotti
  const data = await shopifyFetch(`
    query GetAllProducts {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            description
            tags
            images(first: 1) {
              edges { node { url altText } }
            }
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            variants(first: 10) {
              edges {
                node { id title price { amount currencyCode } availableForSale }
              }
            }
          }
        }
      }
    }
  `);

  return data.products?.edges?.map(e => e.node) || [];
}


/**
 * Recupera un singolo prodotto dato il suo handle (slug URL).
 * @param {string} handle - Lo slug del prodotto (es. "kit-cannoli")
 * @returns {Promise<object>} - Oggetto prodotto completo
 */
async function fetchProductByHandle(handle) {
  const data = await shopifyFetch(`
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        handle
        descriptionHtml
        description
        tags
        images(first: 5) {
          edges { node { url altText } }
        }
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        variants(first: 20) {
          edges {
            node { id title price { amount currencyCode } availableForSale }
          }
        }
      }
    }
  `, { handle });

  return data.product;
}


/**
 * Recupera i contenuti del carrello attuale.
 * @param {string} cartId - L'ID del carrello
 * @returns {Promise<object>} - Oggetto carrello con lines e costo totale
 */
async function fetchCart(cartId) {
  const data = await shopifyFetch(`
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        totalQuantity
        cost {
          totalAmount { amount currencyCode }
        }
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
        checkoutUrl
      }
    }
  `, { cartId });

  return data.cart;
}


/**
 * Aggiunge un prodotto (variante) al carrello.
 * Se il carrello non esiste, lo crea automaticamente.
 * @param {string} variantId - L'ID della variante Shopify (formato gid://...)
 * @param {number} quantity - Quantità da aggiungere (default 1)
 * @returns {Promise<object>} - Carrello aggiornato
 */
async function addToCart(variantId, quantity = 1) {
  const cartId = await getOrCreateCartId();

  const data = await shopifyFetch(`
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
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
                    product { title handle }
                  }
                }
              }
            }
          }
        }
        userErrors { field message }
      }
    }
  `, {
    cartId,
    lines: [{ merchandiseId: variantId, quantity }],
  });

  return data.cartLinesAdd.cart;
}


/**
 * Aggiorna la quantità di un articolo già nel carrello.
 * @param {string} cartId - L'ID del carrello
 * @param {string} lineId - L'ID della linea nel carrello
 * @param {number} quantity - Nuova quantità (0 per rimuovere)
 * @returns {Promise<object>} - Carrello aggiornato
 */
async function updateCartItem(cartId, lineId, quantity) {
  const data = await shopifyFetch(`
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          totalQuantity
          cost { totalAmount { amount currencyCode } }
        }
        userErrors { field message }
      }
    }
  `, {
    cartId,
    lines: [{ id: lineId, quantity }],
  });

  return data.cartLinesUpdate.cart;
}


/**
 * Rimuove un articolo dal carrello.
 * @param {string} cartId - L'ID del carrello
 * @param {string} lineId - L'ID della linea da rimuovere
 * @returns {Promise<object>} - Carrello aggiornato
 */
async function removeCartItem(cartId, lineId) {
  const data = await shopifyFetch(`
    mutation RemoveCartLine($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          totalQuantity
          cost { totalAmount { amount currencyCode } }
        }
        userErrors { field message }
      }
    }
  `, {
    cartId,
    lineIds: [lineId],
  });

  return data.cartLinesRemove.cart;
}
