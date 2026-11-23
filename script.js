(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  var offer = document.getElementById('oferta');
  var final = document.querySelector('.final');

  if (sticky && heroBtn && 'IntersectionObserver' in window) {
    var heroVisible = false;
    var lowerCtaVisible = false;

    var update = function () {
      var on = !heroVisible && !lowerCtaVisible;
      sticky.classList.toggle('is-on', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      var link = sticky.querySelector('a');
      if (link) link.tabIndex = on ? 0 : -1;
    };

    // a barra só fica escondida enquanto o botão do hero aparece inteiro na tela
    new IntersectionObserver(function (e) {
      heroVisible = e[0].intersectionRatio >= 0.99;
      update();
    }, { threshold: [0, 0.99, 1] }).observe(heroBtn);

    // esconde a barra quando a própria oferta ou o CTA final já estão na tela
    var lower = new Set();
    var lowerIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) lower.add(en.target); else lower.delete(en.target);
      });
      lowerCtaVisible = lower.size > 0;
      update();
    }, { threshold: 0.35 });
    [offer, final].forEach(function (el) { if (el) lowerIO.observe(el); });
  }

  /* ---------- Contagem do "108" ---------- */
  var counter = document.querySelector('[data-count]');
  if (counter && 'IntersectionObserver' in window && !reduceMotion) {
    var target = parseInt(counter.getAttribute('data-count'), 10);
    var started = false;

    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting || started) return;
      started = true;
      obs.disconnect();

      var duration = 1100;
      var t0 = performance.now();
      (function tick(now) {
        var p = Math.min((now - t0) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        counter.textContent = Math.round(target * eased);
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.6 }).observe(counter);
  }

  /* ---------- Repertório: expandir lista de músicas ---------- */
  var tracklistToggle = document.getElementById('tracklistToggle');
  var tracklist = document.getElementById('tracklist');
  if (tracklistToggle && tracklist) {
    var extraTracks = tracklist.querySelectorAll('.track--extra');
    tracklistToggle.addEventListener('click', function () {
      var expanded = tracklistToggle.getAttribute('aria-expanded') === 'true';
      extraTracks.forEach(function (el) { el.hidden = expanded; });
      tracklistToggle.setAttribute('aria-expanded', String(!expanded));
      tracklistToggle.textContent = expanded ? 'Ver mais músicas' : 'Ver menos músicas';
    });
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
