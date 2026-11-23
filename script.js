(function () {
  'use strict';

  /* =========================================================
     CONFIGURAÇÃO
     Checkout da Hotmart. Se trocar, troque também nos href do
     index.html (reserva para quem estiver sem JavaScript).
     ========================================================= */
  var CHECKOUT_URL = 'https://pay.hotmart.com/L108625935K';
  var PRICE = 29.90;
  var CURRENCY = 'BRL';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];

  /* ---------- Rastreamento ----------
     Os eventos vão pro dataLayer do GTM. Se um dia o Meta Pixel (fbq)
     for instalado direto na página, ViewContent e InitiateCheckout
     também são disparados pra ele. O PageView do Pixel fica por conta
     do próprio código base do Pixel. */
  function track(name, extra) {
    var data = { event: name, value: PRICE, currency: CURRENCY, content_name: 'O Baú do Corvo' };
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) data[k] = extra[k];
    window.dataLayer.push(data);
    if (typeof window.fbq === 'function' && name !== 'PageView') {
      window.fbq('track', name, { value: PRICE, currency: CURRENCY, content_name: 'O Baú do Corvo' });
    }
  }

  // PageView ao carregar
  window.dataLayer.push({ event: 'PageView' });

  /* ---------- Link do checkout + UTMs ---------- */
  var PASS_PARAMS = /^(utm_[a-z_]+|src|sck|xcod|fbclid|gclid)$/i;

  function checkoutHref() {
    if (!/^https?:\/\//i.test(CHECKOUT_URL)) {
      if (window.console) console.warn('[Baú do Corvo] Link do checkout ainda não configurado em script.js');
      return CHECKOUT_URL;
    }
    var url;
    try { url = new URL(CHECKOUT_URL); } catch (e) { return CHECKOUT_URL; }
    var here = new URLSearchParams(window.location.search);
    here.forEach(function (value, key) {
      if (PASS_PARAMS.test(key) && !url.searchParams.has(key)) url.searchParams.set(key, value);
    });
    return url.toString();
  }

  var href = checkoutHref();
  document.querySelectorAll('a[data-cta]').forEach(function (a) {
    a.href = href;

    // InitiateCheckout em qualquer botão de compra
    a.addEventListener('click', function (e) {
      var cta = a.getAttribute('data-cta');
      var newTab = e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0 || a.target === '_blank';

      if (newTab) { track('InitiateCheckout', { cta: cta }); return; }

      // espera o GTM registrar o evento antes de sair da página (no máximo ~0,9 s)
      e.preventDefault();
      var gone = false;
      var go = function () { if (!gone) { gone = true; window.location.href = a.href; } };
      track('InitiateCheckout', { cta: cta, eventCallback: go, eventTimeout: 800 });
      setTimeout(go, 900);
    });
  });

  /* ---------- ViewContent ao ver a seção de oferta ---------- */
  var offer = document.getElementById('oferta');
  if (offer && 'IntersectionObserver' in window) {
    var vcIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      vcIO.disconnect();
      track('ViewContent');
    }, { threshold: 0.4 });
    vcIO.observe(offer);
  }

  /* ---------- Revelar elementos ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(function (el, i) {
      // pequeno atraso escalonado só nos elementos do hero, que aparecem juntos
      if (el.closest('.hero')) el.style.setProperty('--rd', (i * 0.09).toFixed(2) + 's');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Barra fixa de compra (celular) ---------- */
  var sticky = document.getElementById('sticky');
  var heroBtn = document.querySelector('.hero__buy .btn');

  if (sticky && heroBtn && 'IntersectionObserver' in window) {
    var heroVisible = false;
    var offerVisible = false;
    var stickyLink = sticky.querySelector('a');

    var update = function () {
      var on = !heroVisible && !offerVisible;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      if (stickyLink) stickyLink.tabIndex = on ? 0 : -1;
    };

    // escondida enquanto o botão do hero aparece inteiro na tela
    new IntersectionObserver(function (e) {
      heroVisible = e[0].intersectionRatio >= 0.99;
      update();
    }, { threshold: [0, 0.99, 1] }).observe(heroBtn);

    // escondida quando a oferta já está na tela
    if (offer) {
      new IntersectionObserver(function (e) {
        offerVisible = e[0].isIntersecting;
        update();
      }, { threshold: 0.35 }).observe(offer);
    }
  }

  /* ---------- Comentários (prints reais em publico/comentarios/) ----------
     Procura comentario-1, comentario-2, ... em .jpg, .png, .jpeg ou .webp
     e para no primeiro número que não existir. */
  var comments = document.getElementById('comentarios');
  var grid = document.getElementById('comentariosGrid');
  if (comments && grid) {
    var EXTS = ['jpg', 'png', 'jpeg', 'webp'];
    var MAX = 30;

    var findImage = function (n, i, done) {
      if (i >= EXTS.length) return done(null);
      var src = 'publico/comentarios/comentario-' + n + '.' + EXTS[i];
      var img = new Image();
      img.onload = function () { done(img); };
      img.onerror = function () { findImage(n, i + 1, done); };
      img.src = src;
    };

    var loadNext = function (n) {
      if (n > MAX) return;
      findImage(n, 0, function (img) {
        if (!img) return;
        img.alt = 'Print de comentário sobre o Corvo do Sertão';
        img.decoding = 'async';
        var li = document.createElement('li');
        li.className = 'comment';
        li.appendChild(img);
        grid.appendChild(li);
        comments.hidden = false;
        loadNext(n + 1);
      });
    };

    var start = function () { loadNext(1); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  }

  /* ---------- FAQ: mantém só uma pergunta aberta ---------- */
  var items = document.querySelectorAll('.faq__list details');
  items.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      items.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- Ano do rodapé ---------- */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
})();
