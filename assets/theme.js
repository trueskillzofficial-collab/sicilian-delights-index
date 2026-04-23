/**
 * Delizie Siciliane — tema Shopify
 * Menu mobile, animazioni fade-up, carosello best seller, FAQ spedizioni, anchor smooth.
 */
(function () {
  'use strict';

  function initMobileNav() {
    var hamburger = document.getElementById('hamburger');
    var mobileNav = document.getElementById('mobileNav');
    if (!hamburger || !mobileNav) return;

    hamburger.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
      hamburger.setAttribute(
        'aria-label',
        isOpen ? window.__DS_I18N__ && window.__DS_I18N__.closeMenu ? window.__DS_I18N__.closeMenu : 'Chiudi menu' : window.__DS_I18N__ && window.__DS_I18N__.openMenu ? window.__DS_I18N__.openMenu : 'Apri menu'
      );
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initFadeUp() {
    var fadeEls = document.querySelectorAll('.fade-up');
    if (!fadeEls.length || !('IntersectionObserver' in window)) {
      fadeEls.forEach(function (el) {
        el.classList.add('in');
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    fadeEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var id = anchor.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function initBestSellersCarousel() {
    var wrap = document.querySelector('[data-best-sellers-carousel]');
    var track = wrap && wrap.querySelector('[data-carousel-track]');
    if (!wrap || !track) return;

    track.style.animation = 'none';
    track.style.willChange = 'transform';

    var AUTO_SPEED = 0.65;
    var FRICTION = 0.92;
    var posX = 0;
    var halfWidth = 0;
    var velX = 0;
    var dragging = false;
    var hasMoved = false;
    var startX = 0;
    var startY = 0;
    var startPos = 0;
    var prevX = 0;
    var prevT = 0;
    var lockAxis = null;
    var rafId = null;
    var isWheeling = false;
    var wheelTimer = null;

    function measure() {
      halfWidth = track.scrollWidth / 2;
    }

    function wrapX(x) {
      if (!halfWidth) return x;
      x = x % halfWidth;
      if (x > 0) x -= halfWidth;
      if (x <= -halfWidth) x += halfWidth;
      return x;
    }

    function setPos(x) {
      posX = wrapX(x);
      track.style.transform = 'translateX(' + posX + 'px)';
    }

    function loop() {
      if (!dragging && !isWheeling) {
        if (Math.abs(velX) > 0.08) {
          velX *= FRICTION;
          setPos(posX + velX);
        } else {
          velX = 0;
          setPos(posX - AUTO_SPEED);
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    function onStart(e) {
      if (e.button > 0) return;
      if (e.target.closest('button')) return;
      if (e.touches && e.touches.length > 1) return;
      var t = e.touches ? e.touches[0] : e;
      dragging = true;
      hasMoved = false;
      lockAxis = null;
      startX = t.clientX;
      startY = t.clientY;
      startPos = posX;
      velX = 0;
      prevX = startX;
      prevT = performance.now();
      wrap.classList.add('is-grabbing');
    }

    function onMove(e) {
      if (!dragging) return;
      var t = e.touches ? e.touches[0] : e;
      var cx = t.clientX;
      var cy = t.clientY;
      var dx = cx - startX;
      var dy = cy - startY;

      if (!lockAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        lockAxis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      }

      if (lockAxis === 'v') {
        dragging = false;
        wrap.classList.remove('is-grabbing');
        return;
      }
      if (lockAxis !== 'h') return;

      if (e.cancelable) e.preventDefault();

      var now = performance.now();
      var dt = Math.max(now - prevT, 1);
      velX = ((cx - prevX) / dt) * 16;
      prevX = cx;
      prevT = now;

      if (Math.abs(dx) > 4) hasMoved = true;
      setPos(startPos + dx);
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      wrap.classList.remove('is-grabbing');
    }

    wrap.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    wrap.addEventListener('touchstart', onStart, { passive: true });
    wrap.addEventListener('touchmove', onMove, { passive: false });
    wrap.addEventListener('touchend', onEnd, { passive: true });
    wrap.addEventListener('touchcancel', onEnd, { passive: true });

    wrap.addEventListener(
      'wheel',
      function (e) {
        var dx = e.deltaX;
        var dy = e.deltaY;
        if (Math.abs(dx) < 3) return;
        if (Math.abs(dy) > Math.abs(dx) * 1.5) return;
        e.preventDefault();
        isWheeling = true;
        velX = 0;
        setPos(posX - dx);
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(function () {
          isWheeling = false;
        }, 150);
      },
      { passive: false }
    );

    wrap.addEventListener(
      'click',
      function (e) {
        if (hasMoved) {
          if (e.target.closest('button')) {
            hasMoved = false;
            return;
          }
          e.preventDefault();
          e.stopPropagation();
          hasMoved = false;
        }
      },
      true
    );

    function start() {
      measure();
      if (!halfWidth) {
        requestAnimationFrame(start);
        return;
      }
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(loop);
    }

    if (document.readyState === 'complete') {
      requestAnimationFrame(start);
    } else {
      window.addEventListener('load', function () {
        requestAnimationFrame(start);
      });
    }

    if ('ResizeObserver' in window) {
      new ResizeObserver(measure).observe(track);
    }
  }

  function initShippingFaq() {
    document.querySelectorAll('.faq-section .faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.parentElement;
        var answer = item.querySelector('.faq-answer');
        var isOpen = item.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));

        if (answer) {
          if (isOpen) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
          } else {
            answer.style.maxHeight = '0';
          }
        }

        document.querySelectorAll('.faq-section .faq-item').forEach(function (other) {
          if (other !== item && other.classList.contains('open')) {
            other.classList.remove('open');
            var ob = other.querySelector('.faq-question');
            var oa = other.querySelector('.faq-answer');
            if (ob) ob.setAttribute('aria-expanded', 'false');
            if (oa) oa.style.maxHeight = '0';
          }
        });
      });
    });
  }

  function initShopifyCart() {
    var overlay   = document.getElementById('dsCartOverlay');
    var drawer    = document.getElementById('dsCartDrawer');
    var closeBtn  = document.getElementById('dsCartClose');
    var contBtn   = document.getElementById('dsCartContinue');
    var toast     = document.getElementById('dsToast');
    var toastTmr  = null;

    if (!overlay || !drawer) return;

    function showToast(msg) {
      if (!toast) return;
      toast.textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTmr);
      toastTmr = setTimeout(function () { toast.classList.remove('show'); }, 2800);
    }

    function openDrawer() {
      drawer.hidden = false;
      overlay.removeAttribute('aria-hidden');
      requestAnimationFrame(function () {
        overlay.classList.add('open');
        drawer.classList.add('open');
      });
      document.body.classList.add('ds-cart-open');
      renderCart();
    }

    function closeDrawer() {
      overlay.classList.remove('open');
      drawer.classList.remove('open');
      document.body.classList.remove('ds-cart-open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('.cart-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.preventDefault(); openDrawer(); });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (contBtn)  contBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    });

    document.addEventListener('submit', function (e) {
      var form = e.target;
      if (!form || !form.querySelector('[name="add"]')) return;
      e.preventDefault();
      var idInput  = form.querySelector('[name="id"]');
      var qtyInput = form.querySelector('[name="quantity"]');
      if (!idInput) return;
      var addBtn = form.querySelector('[name="add"]');
      if (addBtn) { addBtn.disabled = true; addBtn.textContent = '…'; }

      fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ items: [{ id: parseInt(idInput.value), quantity: parseInt((qtyInput && qtyInput.value) || 1) }] })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status) {
            showToast(data.description || 'Errore durante l\'aggiunta');
          } else {
            openDrawer();
          }
          if (addBtn) { addBtn.disabled = false; addBtn.textContent = addBtn.dataset.label || 'Aggiungi'; }
        })
        .catch(function () {
          showToast('Errore di connessione');
          if (addBtn) { addBtn.disabled = false; addBtn.textContent = addBtn.dataset.label || 'Aggiungi'; }
        });
    });

    function fmt(cents) {
      return (cents / 100).toLocaleString('it-IT', { style: 'currency', currency: 'EUR' });
    }

    function renderCart() {
      fetch('/cart.js', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.json(); })
        .then(updateUI)
        .catch(function () {
          document.getElementById('dsCartList').innerHTML =
            '<div class="ds-cart-empty"><p>Errore caricamento carrello</p></div>';
        });
    }

    function updateUI(cart) {
      var list      = document.getElementById('dsCartList');
      var footer    = document.getElementById('dsCartFooter');
      var countEl   = document.getElementById('dsCartDrawerCount');
      var totalEl   = document.getElementById('dsCartTotalVal');
      var hdrCount  = document.querySelector('.cart-count');

      if (hdrCount) hdrCount.textContent = cart.item_count;
      if (countEl)  countEl.textContent  = cart.item_count > 0 ? '(' + cart.item_count + ')' : '';

      if (cart.item_count === 0) {
        list.innerHTML = '<div class="ds-cart-empty">' +
          '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" style="opacity:.3" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
          '<p>Il carrello è vuoto</p>' +
          '<a href="/collections/all" class="btn btn-outline" style="margin-top:16px;font-size:13px">Scopri i dolci</a>' +
          '</div>';
        if (footer) footer.hidden = true;
        return;
      }

      if (footer) footer.hidden = false;
      if (totalEl) totalEl.textContent = fmt(cart.total_price);

      var html = '';
      cart.items.forEach(function (item, idx) {
        var line = idx + 1;
        html += '<div class="ds-cart-item">';
        html += '<div class="ds-ci-img">';
        if (item.image) html += '<img src="' + item.image + '" alt="' + (item.product_title || '') + '" loading="lazy">';
        html += '</div>';
        html += '<div class="ds-ci-body">';
        html += '<p class="ds-ci-name">' + item.product_title + '</p>';
        if (item.variant_title && item.variant_title !== 'Default Title') {
          html += '<p class="ds-ci-unit-price">' + item.variant_title + '</p>';
        }
        html += '<div class="ds-ci-row">';
        html += '<div class="ds-ci-qty">';
        html += '<button class="ds-qty-btn" data-line="' + line + '" data-delta="-1" type="button" aria-label="Diminuisci">−</button>';
        html += '<span class="ds-qty-val">' + item.quantity + '</span>';
        html += '<button class="ds-qty-btn" data-line="' + line + '" data-delta="1"  type="button" aria-label="Aumenta">+</button>';
        html += '</div>';
        html += '<span class="ds-ci-price">' + fmt(item.final_line_price) + '</span>';
        html += '</div></div>';
        html += '<button class="ds-ci-remove" data-line="' + line + '" type="button" aria-label="Rimuovi ' + item.product_title + '">';
        html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
        html += '</button></div>';
      });
      list.innerHTML = html;

      list.querySelectorAll('.ds-qty-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var qtyEl  = btn.parentElement.querySelector('.ds-qty-val');
          var newQty = Math.max(0, parseInt(qtyEl.textContent) + parseInt(btn.dataset.delta));
          changeLine(parseInt(btn.dataset.line), newQty);
        });
      });

      list.querySelectorAll('.ds-ci-remove').forEach(function (btn) {
        btn.addEventListener('click', function () { changeLine(parseInt(btn.dataset.line), 0); });
      });
    }

    function changeLine(line, qty) {
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify({ line: line, quantity: qty })
      })
        .then(function (r) { return r.json(); })
        .then(updateUI)
        .catch(function () { showToast('Errore di aggiornamento'); });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initFadeUp();
    initSmoothAnchors();
    initBestSellersCarousel();
    initShippingFaq();
    initShopifyCart();
  });
})();
