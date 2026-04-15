# Delizie Siciliane — Documentazione progetto

Sito e-commerce per pasticceria artigianale siciliana con sede ad Ariano Irpino (AV).
Stack attuale: HTML5 + CSS vanilla + JS vanilla, nessun framework.

---

## Struttura cartella

```
/
├── README.md                  ← questo file
├── CLAUDE.md                  ← guida per Claude Code (brand identity, specifiche)
├── prodotti.md                ← catalogo completo con prezzi e slug immagini
├── Logo.svg                   ← logo ufficiale vettoriale (inline nell'HTML)
│
├── index.html                 ← homepage (landing + shop + recensioni + footer)
├── prodotto.html              ← template pagina singolo prodotto        [da creare]
├── spedizioni.html            ← norme spedizione alimentare             [da creare]
├── chi-siamo.html             ← storia del brand                        [da creare]
│
├── style.css                  ← foglio stile globale con CSS variables
│
└── assets/
    └── images/
        ├── HERO IMAGE.jpg
        ├── Cannoli Siciliani.jpg
        ├── Cannolo Ricotta.jpg
        ├── Cannolo Ricotta 1.jpg
        ├── Cannolo Pistacchio.jpg
        ├── Cannolo Pistacchio 1.jpg
        ├── Cannolo Pistacchio 2.jpg
        ├── Cannolo Cioccolato.jpg
        ├── Cannolo Cioccolato 2.jpg
        ├── Cannolo Cioccolato 3.jpg
        ├── Cannolo Cioccolato 4.jpg
        ├── Kit Cannolo.jpg
        ├── Kit Cannolo 1.jpg
        ├── Cassatina Siciliana.jpg
        ├── Cassatina Siciliana 1.jpg
        ├── Cassatina Siciliana 2.jpg
        ├── Vulcano.jpg
        ├── Vulcano 1.jpg
        ├── Pasta di Mandorla.jpg
        ├── Pasta di Mandorla 1.jpg
        ├── Sole di Sicilia 1.jpg
        ├── Sole di Sicilia 2.jpg
        ├── Torta Cassata Siciliana.jpg
        ├── Torta Cassata Siciliana 1.jpg
        ├── Torta Cassata Siciliana 2.jpg
        ├── Torta Fedora 1.jpg
        ├── Torta Fedora 2.jpg
        ├── Torta Fedora 3.jpg
        ├── Torta Pasta di Mandorla 1.jpg
        ├── Torta Pasta di Mandorla 2.jpg
        ├── Tronchetto Cassata.jpg
        ├── Tronchetto Cassata 1.jpg
        ├── Tronchetto Cassata 2.jpg
        ├── Tronchetto Cassata 3.jpg
        ├── Tronchetto Cassata 4.jpg
        ├── Tronchetto Cassata 5.jpg
        └── Tronchetto Cassata 6.jpg
```

---

## CSS Variables (`style.css` — `:root`)

Tutte le variabili sono definite in `:root` e devono essere usate ovunque tramite `var()`.
Nessun valore hex o `rgba()` con canali numerici diretti è ammesso fuori dal blocco `:root`.

### Colori primari

| Variabile | Valore | Nome dialettale | Uso principale |
|---|---|---|---|
| `--color-rosso` | `#D94B32` | U Russu | CTA, headline, navbar, accenti |
| `--color-crema` | `#E8E2CD` | La Crèma | Background principale, sezioni chiare |
| `--color-giallo` | `#F1DD4E` | Lu Giàrdu | Badge BEST SELLER, accenti, highlights |

### Colori secondari

| Variabile | Valore | Nome dialettale | Uso |
|---|---|---|---|
| `--color-arancio-scuro` | `#DA6C39` | L'Aranciu Scùru | Hover stati, decorazioni calde |
| `--color-arancio` | `#E99B3F` | L'Aranciu | Icone, bordi decorativi |
| `--color-verde-salvia` | `#B9BB90` | Lu Virdi Sàvia | Tag categoria, elementi naturali |
| `--color-verde-chiaro` | `#DBD4A1` | Lu Virdi Chiaru | Sfondi secondari, card |
| `--color-castagna` | `#B5876F` | Lu Castagni Ruci | Testi secondari, note, sottotitoli |
| `--color-rosa` | `#D7B7A3` | Lu Ròsa Pacatu | Elementi soft, sfondi sezione |

### Colori neutri

| Variabile | Valore | Uso |
|---|---|---|
| `--color-bianco` | `#FFFFFF` | Sfondi card, navbar |
| `--color-nero` | `#1A1A1A` | Testo principale, footer |

### Canali RGB (solo per `rgba()`)

Usati esclusivamente come argomento di `rgba(var(--color-X-rgb), opacity)`.
Non usare mai direttamente nei valori di colore solidi.

| Variabile | Valore |
|---|---|
| `--color-rosso-rgb` | `217, 75, 50` |
| `--color-crema-rgb` | `232, 226, 205` |
| `--color-giallo-rgb` | `241, 221, 78` |
| `--color-nero-rgb` | `26, 26, 26` |

### Font

| Variabile | Valore |
|---|---|
| `--font-display` | `'Playfair Display', Georgia, serif` |
| `--font-body` | `'DM Sans', system-ui, sans-serif` |
| `--font-script` | `'Dancing Script', cursive` |

### Border radius

| Variabile | Valore | Uso tipico |
|---|---|---|
| `--radius-sm` | `8px` | Elementi piccoli |
| `--radius-md` | `16px` | Card categorie |
| `--radius-lg` | `24px` | Card prodotto, review |
| `--radius-pill` | `999px` | Badge, bottoni, input |

### Ombre

| Variabile | Valore |
|---|---|
| `--shadow-sm` | `0 2px 12px rgba(var(--color-nero-rgb), 0.07)` |
| `--shadow-md` | `0 8px 32px rgba(var(--color-nero-rgb), 0.12)` |
| `--shadow-lg` | `0 20px 60px rgba(var(--color-nero-rgb), 0.18)` |

---

## Font

Tre font caricati da Google Fonts, dichiarati nell'`<head>` di ogni pagina HTML prima del foglio stile.

```html
<link
  href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;700;800&family=Dancing+Script:wght@700&display=swap"
  rel="stylesheet"
>
```

| Font | Pesi caricati | Variabile CSS | Utilizzo |
|---|---|---|---|
| **Playfair Display** | 700, 900, 700 italic | `--font-display` | Headline, titoli sezione, prezzi, virgolettoni |
| **DM Sans** | 400, 500, 700, 800 | `--font-body` | Corpo testo, nav, label, bottoni |
| **Dancing Script** | 700 | `--font-script` | Sub-brand *la Cannoleria*, elementi script |

Il parametro `display=swap` assicura che il testo sia visibile durante il caricamento dei font (FOUT accettabile, nessun FOIT).

---

## Architettura futura — Shopify Headless

Il progetto evolverà verso un'architettura headless con Shopify come backend e-commerce.

- **Backend**: Shopify — gestione prodotti, inventario, checkout, ordini, clienti
- **API**: Shopify Storefront API (GraphQL) — accesso pubblico a prodotti, collezioni, carrello e checkout
- **Frontend**: le pagine aggiuntive e l'integrazione con la Storefront API verranno sviluppate su **Lovable**

Il design system definito in questo progetto (palette, variabili CSS, tipografia, componenti) costituisce la base visiva da replicare nell'implementazione su Lovable.

### Riferimenti Storefront API

Le query GraphQL principali da implementare:

```graphql
# Prodotti per collezione
query CollectionProducts($handle: String!) {
  collection(handle: $handle) {
    products(first: 20) {
      edges {
        node {
          id
          title
          handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 1) { edges { node { url altText } } }
        }
      }
    }
  }
}

# Creazione carrello
mutation CartCreate($input: CartInput!) {
  cartCreate(input: $input) {
    cart { id checkoutUrl }
  }
}
```

---

*Ultimo aggiornamento: aprile 2026*
