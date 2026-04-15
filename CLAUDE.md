# CLAUDE.md — Delizie Siciliane · Progetto Web

> Questo file è la guida definitiva per Claude Code.
> Leggilo integralmente prima di scrivere qualsiasi riga di codice.

---

## 1. Contesto del progetto

**Delizie Siciliane** è una pasticceria artigianale siciliana con sede ad Ariano Irpino (AV) che spedisce dolci tipici in tutta Italia. Il sito è un e-commerce statico/vetrina in HTML + CSS + JS vanilla (nessun framework pesante), ottimizzato per conversione e fiducia.

**Sub-brand:** "la Cannoleria" — usato per la linea cannoli.

**Payoff:** *Sicilia bedda*

---

## 2. Struttura cartella progetto

```
/
├── CLAUDE.md              ← questo file
├── prodotti.md            ← catalogo completo con prezzi
├── Logo.svg               ← logo ufficiale vettoriale
├── assets/
│   ├── images/            ← foto prodotti (nominate con slug prodotto)
│   └── fonts/             ← font locali se necessario
├── index.html             ← homepage (landing + shop)
├── prodotto.html          ← template pagina singolo prodotto
├── spedizioni.html        ← pagina norme spedizione alimentare
├── chi-siamo.html         ← storia del brand
└── style.css              ← foglio stile globale
```

---

## 3. Brand Identity — NON derogare

### 3.1 Palette colori ufficiale (usa SEMPRE questi hex)

**Primari:**
| Nome (dialetto) | Hex | Uso |
|---|---|---|
| U Russu | `#D94B32` | Colore primario, CTA, headline |
| La Crèma | `#E8E2CD` | Background principale, sezioni chiare |
| Lu Giàrdu | `#F1DD4E` | Accenti, badge BEST SELLER, highlights |

**Secondari:**
| Nome | Hex | Uso |
|---|---|---|
| L'Aranciu Scùru | `#DA6C39` | Hover stati, decorazioni calde |
| L'Aranciu | `#E99B3F` | Icone, bordi decorativi |
| Lu Virdi Sàvia | `#B9BB90` | Elementi naturali, tag categoria |
| Lu Virdi Chiaru | `#DBD4A1` | Sfondi secondari, card |
| Lu Castagni Ruci | `#B5876F` | Testi secondari, note |
| Lu Ròsa Pacatu | `#D7B7A3` | Elementi soft, sfondi sezione |

**Neutri:**
- Bianco: `#FFFFFF`
- Testo principale: `#1A1A1A`

### 3.2 Tipografia

Il brand usa un carattere Art Déco su misura per il logo (non replicabile in web font). Per il web:

- **Display / Titoli grandi:** `Playfair Display` — eleganza, tradizione, retrò (Google Fonts)
- **Headlines corpo:** `DM Sans` Bold / ExtraBold — geometrico, pulito
- **Corpo testo:** `DM Sans` Regular — leggibile, moderno
- **Sub-brand "la Cannoleria":** usa font corsivo `Dancing Script` o `Great Vibes` (Google Fonts)

Importa sempre da Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;700&family=Dancing+Script:wght@700&display=swap" rel="stylesheet">
```

### 3.3 Direzione estetica

- **Stile generale:** Art Déco contemporaneo · caldo · artigianale · siciliano
- **Ispirazione layout:** casainfante.it (food photography in grande, sezioni editoriali, griglia generosa)
- **Ispirazione conversione:** lapagnottapasticceria.com (CTA chiare, bundle prominenti, social proof)
- **Ispirazione compliance alimentare:** sicilyaddict.it (sezione dedicata spedizioni, temperature, packaging)
- **NON usare:** sfondi bianchi piatti senza texture · layout troppo minimal · colori freddi · bordi netti senza respiro

### 3.4 Elementi grafici ricorrenti

- Il **cuore-testa di moro** (Logo.svg) come icona decorativa e watermark
- Forme rotonde e morbide (border-radius generosi: 16–24px)
- Texture granulosa sottile su sfondi crema (noise overlay CSS, opacity 3–5%)
- Bordi sottili in `#D94B32` come separatori decorativi
- Badge arrotondati in giallo `#F1DD4E` per BEST SELLER e promo

---

## 4. Pagine da costruire

### 4.1 `index.html` — Homepage

**Sezioni in ordine:**

1. **Navbar** — Logo a sinistra, nav centrale (Shop, Chi siamo, Spedizioni), carrello icona a destra. Background `#D94B32`, testo/logo in `#E8E2CD`.

2. **Hero** — Full-width, foto prodotto principale (usa prima immagine disponibile in `/assets/images/`). Headline grande in Playfair Display: *"Sicilia bedda, a casa tua."* Sottotitolo in DM Sans. CTA doppio: "Scopri i dolci" (primario rosso) + "Come spediamo" (secondario outline).

3. **Barra fiducia** — Strip crema con 4 icone + testo: 🧊 Spedizione refrigerata | 📦 Packaging alimentare certificato | 🚚 Consegna in 24–48h | ❤️ Artigianale dal laboratorio.

4. **Best Seller** — Sezione su sfondo crema `#E8E2CD`. Griglia 3 colonne desktop, 1 colonna mobile. Card prodotto con: foto, nome, prezzo, badge (BEST SELLER in giallo). Il Kit Cannoli deve avere il badge prominente.

5. **Categorie** — Griglia 2×3 con foto categoria. Categorie: Cannoli · Dolci al cucchiaio · Fiori di Mandorla · Pasta di Mandorla · Salato · Torte.

6. **Storia del brand** — Sezione su sfondo `#D94B32`. Testo bianco/crema. Headline: *"Da Ariano Irpino, con l'anima della Sicilia."* Copy breve che racconta l'incontro tra Irpinia e Sicilia.

7. **Sezione spedizioni** — Card con icone su sfondo `#E8E2CD`. Messaggi chiave: imballaggio isotermico, gel refrigerante incluso, spedizione express, non spediamo con temperature >30°C.

8. **Social proof** — 3 recensioni clienti in card. Stelle in giallo `#F1DD4E`.

9. **Footer** — Sfondo `#1A1A1A`. Logo bianco. Link utili. P.IVA. Note allergeni. "Sicilia bedda ❤️"

### 4.2 `prodotto.html`

Template riutilizzabile. Sezioni: foto grande | nome + prezzo | descrizione | ingredienti/allergeni | bottone "Aggiungi al carrello" (CTA rosso grande) | prodotti correlati.

### 4.3 `spedizioni.html`

Pagina dedicata alle norme di spedizione alimentare. Ispirazione: sicilyaddict.it. Sezioni: come imballiamo | temperature di trasporto | zone di spedizione | tempi | FAQ. Tono rassicurante e trasparente.

### 4.4 `chi-siamo.html`

Storia del brand. Due radici: Ariano Irpino e Sicilia. Foto laboratorio. Timeline. Valori: artigianalità, territorio, passione.

---

## 5. Prodotti (sintesi — vedi prodotti.md per dettaglio)

Leggi sempre `prodotti.md` per nomi, prezzi e varianti aggiornati.

**Prodotti principali:**
- Cannolo Grande — €3,50
- Kit Cannoli 5 pz (BEST SELLER) — €17,50
- Vulcano 150g · 6 pz
- Cassatina Siciliana 110g · 6 pz
- Fiori (Mandorla, Pistacchio, Limone, Cacao e Rum, Miste)
- Fior di Arancia — 500g / 1kg
- Pasta di Mandorla — 250g / 500g / 1kg
- Arancino Classico al Ragù · 6 pz
- Sole di Sicilia · 6 pz
- Torte intere 1kg (Cassata, Pasta di Mandorla, Fedora, Tronchetto)

Per prezzi mancanti: fai riferimento ai prezzi comparabili su sicilyaddict.it (stesso segmento di mercato).

---

## 6. Immagini

Le foto dei prodotti sono in `/assets/images/` con nome file = slug del prodotto (es. `cannolo-grande.jpg`, `kit-cannoli.jpg`, `vulcano.jpg`).

Se un'immagine non esiste, usa un placeholder crema `#E8E2CD` con il nome del prodotto centrato in `#D94B32`, **non** usare servizi esterni di placeholder.

---

## 7. Norme tecniche

- HTML5 semantico (`<main>`, `<section>`, `<article>`, `<nav>`, `<footer>`)
- CSS custom properties per tutti i colori e font (definisci su `:root`)
- Mobile-first responsive (breakpoint: 768px tablet, 1200px desktop)
- Nessun framework JS pesante — vanilla JS per interazioni (menu mobile, slider semplice)
- Accessibilità: `alt` su tutte le immagini, contrasto WCAG AA minimo
- Performance: niente JavaScript inutile, immagini con `loading="lazy"`
- Il logo SVG va inline nel `<header>` per controllare colori via CSS

---

## 8. CSS Variables (copia esatta da usare)

```css
:root {
  /* Primari */
  --color-rosso: #D94B32;
  --color-crema: #E8E2CD;
  --color-giallo: #F1DD4E;

  /* Secondari */
  --color-arancio-scuro: #DA6C39;
  --color-arancio: #E99B3F;
  --color-verde-salvia: #B9BB90;
  --color-verde-chiaro: #DBD4A1;
  --color-castagna: #B5876F;
  --color-rosa: #D7B7A3;

  /* Neutri */
  --color-bianco: #FFFFFF;
  --color-nero: #1A1A1A;

  /* Font */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
  --font-script: 'Dancing Script', cursive;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-pill: 999px;
}
```

---

## 9. Tono di voce (copy)

- Caldo, diretto, affettuoso — come un artigiano che ti parla di persona
- Italiano corretto con qualche parola in dialetto siciliano (sempre spiegata o intuitiva)
- Enfasi sulla freschezza, l'artigianalità e la provenienza degli ingredienti
- Rassicurante sulle spedizioni: "sappiamo quanto è prezioso ricevere un dolce integro"
- Mai freddo o corporate

---

## 10. Checklist prima del commit

- [ ] Tutti i colori usano le CSS variables definite in `:root`
- [ ] Il logo è inline SVG, non `<img>`
- [ ] Mobile testato a 375px (iPhone SE)
- [ ] Il Kit Cannoli ha il badge BEST SELLER in evidenza
- [ ] La sezione spedizioni/fiducia è visibile sopra il fold su mobile
- [ ] Nessun link rotto
- [ ] `prodotti.md` è stato letto prima di scrivere i prezzi
