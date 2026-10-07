/* phần cốt lõi: cuộn mượt (smooth scroll), ticker, thanh điều hướng (nav), tiến trình, màn intro, các hàm bổ trợ nhỏ.
   Script thuần (không dùng module) để trang web có thể chạy trực tiếp từ giao thức file://. */
(function () {
  var GC = (window.GC = window.GC || {});
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  GC.reduced = mq.matches;
  GC.qs = function (s, r) { return (r || document).querySelector(s); };
  GC.qsa = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  GC.mobile = function () { return window.matchMedia('(max-width: 860px)').matches; };
  GC.inits = [];
  GC.register = function (fn) { GC.inits.push(fn); };
  GC.escape = function (s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };

  /* bộ tách dòng tự viết: từ -> đo đạc các dòng -> bọc các thẻ span cho từng dòng. Giữ lại thẻ <em>/<br>. */
  GC.splitLines = function (el) {
    if (el.__split) return el.__split;
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var re = /[　-鿿＀-￯]|[^\s　-鿿＀-￯]+|\s+/g;
    var items = [], pend = false;
    el.childNodes.forEach(function (n) {
      var tag = n.nodeType === 1 ? n.nodeName.toLowerCase() : '';
      if (tag === 'br') { items.push({ br: true }); return; }
      (n.textContent.match(re) || []).forEach(function (p) {
        if (/^\s+$/.test(p)) { items.push({ sp: true }); pend = true; return; }
        var w = document.createElement('span'); w.className = 'w'; w.style.display = 'inline-block'; w.textContent = p;
        var node = w;
        if (tag) { var h = document.createElement(tag); h.style.display = 'inline-block'; h.appendChild(w); node = h; }
        node.__sp = pend; pend = false; items.push({ node: node });
      });
    });
    el.textContent = '';
    items.forEach(function (it) {
      if (it.br) el.appendChild(document.createElement('br'));
      else if (it.sp) el.appendChild(document.createTextNode(' '));
      else el.appendChild(it.node);
    });
    var lines = [], last = null, cur = null;
    items.forEach(function (it) {
      if (it.br) { last = null; return; }
      if (!it.node) return;
      var rc = it.node.getBoundingClientRect(), top = Math.round(rc.top + rc.height / 2), tol = Math.max(8, rc.height * 0.45);
      if (last === null || Math.abs(top - last) > tol) { cur = []; lines.push(cur); last = top; }
      cur.push(it.node);
    });
    el.textContent = '';
    el.setAttribute('aria-label', label);
    el.__split = lines.map(function (nodes) {
      var m = document.createElement('span'); m.className = 'ln'; m.setAttribute('aria-hidden', 'true');
      var s = document.createElement('span'); m.appendChild(s);
      nodes.forEach(function (n, i) { if (i && n.__sp) s.appendChild(document.createTextNode(' ')); s.appendChild(n); });
      el.appendChild(m);
      return s;
    });
    return el.__split;
  };

  /* hiệu ứng rơi đàn hồi an toàn cho SVG: dùng các thuộc tính CSS transform riêng lẻ để giữ nguyên thuộc tính transform sẵn có của phần tử */
  GC.dropIn = function (el, o) {
    o = o || {};
    gsap.killTweensOf(el); if (el.__dt) el.__dt.kill();
    var p = { y: o.from == null ? -40 : o.from, s: 0.92, a: 0 };
    el.style.transformBox = 'fill-box'; el.style.transformOrigin = '0 0';
    function apply() { el.style.translate = '0px ' + p.y.toFixed(2) + 'px'; el.style.scale = p.s.toFixed(4); el.style.opacity = p.a.toFixed(3); }
    apply();
    el.__dt = gsap.to(p, { y: 0, s: 1, a: 1, duration: o.duration || 1, delay: o.delay || 0, ease: o.ease || 'elastic.out(1,0.65)', onUpdate: apply, onComplete: function () { el.style.translate = ''; el.style.scale = ''; el.style.opacity = ''; el.style.transformBox = ''; } , overwrite: false });
    return el.__dt;
  };
  GC.killDrop = function (el) { if (el.__dt) { el.__dt.kill(); el.__dt = null; } gsap.killTweensOf(el); };
  GC.hideSvg = function (el) { el.style.opacity = '0'; };

  // chỉ preload font qua giao thức http(s): việc preload có thuộc tính crossorigin sẽ bị chặn trên file://
  if (/^https?:/.test(location.protocol)) {
    ['inter-tight-latin-500-normal', 'instrument-serif-latin-400-italic'].forEach(function (n) {
      var l = document.createElement('link');
      l.rel = 'preload'; l.as = 'font'; l.type = 'font/woff2'; l.crossOrigin = ''; l.href = 'vendor/fonts/' + n + '.woff2';
      document.head.appendChild(l);
    });
  }

  GC.init = function () {
    try { history.scrollRestoration = 'manual'; } catch (e) {}
    window.scrollTo(0, 0);
    document.documentElement.classList.add('js');
    gsap.registerPlugin(ScrollTrigger);
    gsap.defaults({ ease: 'power3.out' });
    gsap.ticker.lagSmoothing(0);

    var lenis = null;
    if (!GC.reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    }
    GC.lenis = lenis;
    GC.scrollTo = function (target, opts) {
      if (lenis) lenis.scrollTo(target, Object.assign({ duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } }, opts || {}));
      else { var el = typeof target === 'string' ? GC.qs(target) : target; if (el) el.scrollIntoView(); }
    };

    /* liên kết neo (anchor links) */
    GC.qsa('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = GC.qs(id); if (!t) return;
        e.preventDefault();
        GC.scrollTo(t, { offset: 0 });
      });
    });

    /* thanh hiển thị tiến trình cuộn */
    var bar = GC.qs('.progress');
    if (bar) {
      var setP = gsap.quickSetter(bar, 'scaleX');
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (s) { setP(s.progress); } });
    }

    /* ẩn / hiện / làm đặc nền thanh điều hướng (nav) */
    var nav = GC.qs('.nav'), lastY = 0;
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (s) {
        var y = s.scroll();
        nav.classList.toggle('is-solid', y > 40);
        if (y > 320 && y > lastY + 4) nav.classList.add('is-hidden');
        else if (y < lastY - 4 || y <= 320) nav.classList.remove('is-hidden');
        lastY = y;
      }
    });
    GC.qsa('.nav ul a').forEach(function (a) {
      var t = GC.qs(a.getAttribute('href'));
      if (!t) return;
      ScrollTrigger.create({ trigger: t, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (s) { a.classList.toggle('is-on', s.isActive); } });
    });

    /* hiệu ứng hút nam châm (magnetic elements): dùng lerp, biên độ <=10px */
    if (!GC.reduced && window.matchMedia('(hover: hover)').matches) {
      GC.qsa('[data-magnetic]').forEach(function (el) {
        var tx = 0, ty = 0, cx = 0, cy = 0, run = false;
        var max = 10;
        function loop() {
          cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
          el.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
          if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) requestAnimationFrame(loop);
          else { run = false; if (tx === 0 && ty === 0) el.style.transform = ''; }
        }
        window.addEventListener('pointermove', function (e) {
          var r = el.getBoundingClientRect();
          var mx = r.left + r.width / 2, my = r.top + r.height / 2;
          var dx = e.clientX - mx, dy = e.clientY - my;
          var d = Math.hypot(dx, dy), reach = Math.max(r.width, r.height) * 0.9;
          if (d < reach) { tx = Math.max(-max, Math.min(max, dx * 0.14)); ty = Math.max(-max, Math.min(max, dy * 0.14)); }
          else { tx = 0; ty = 0; }
          if (!run) { run = true; requestAnimationFrame(loop); }
        }, { passive: true });
      });
    }

    /* các nút sao chép (copy) */
    GC.qsa('[data-copy]').forEach(function (b) {
      b.addEventListener('click', function () {
        var txt = b.getAttribute('data-copy');
        var done = function () {
          var lab = GC.qs('.copy-l', b); if (!lab) return;
          if (!b.__orig) b.__orig = lab.textContent;
          b.classList.add('is-copied');
          gsap.fromTo(lab, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'expo.out' });
          lab.textContent = 'Đã sao chép'; // Đã dịch từ '已复制'
          clearTimeout(b.__t);
          b.__t = setTimeout(function () {
            gsap.fromTo(lab, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .5, ease: 'expo.out' });
            lab.textContent = b.__orig; b.classList.remove('is-copied');
          }, 1800);
        };
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback);
        else fallback();
        function fallback() {
          var ta = document.createElement('textarea'); ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); done();
        }
      });
    });

    /* tạm dừng các phần tử nằm ngoài màn hình hiển thị */
    GC.visible = function (el, on, off) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { e.isIntersecting ? on() : off && off(); }); }, { rootMargin: '10% 0px' });
      io.observe(el); return io;
    };

    runIntro().then(function () {
      GC.inits.forEach(function (fn) { try { fn(); } catch (err) { console.error(err); } });
      ScrollTrigger.refresh();
      document.dispatchEvent(new Event('gc:ready'));
    });
  };

  function runIntro() {
    var intro = GC.qs('.intro');
    var seen = false;
    try { seen = sessionStorage.getItem('gc-intro') === '1'; } catch (e) {}
    GC.introDone = new Promise(function (r) { GC._introResolve = r; });
    if (!intro) return Promise.resolve();
    if (seen || GC.reduced) { intro.remove(); try { sessionStorage.setItem('gc-intro', '1'); } catch (e) {} return Promise.resolve(); }
    try { sessionStorage.setItem('gc-intro', '1'); } catch (e) {}
    return new Promise(function (resolve) {
      if (GC.lenis) GC.lenis.stop();
      var skipped = false;
      var tl = gsap.timeline({ onComplete: finish });
      var mark = GC.qs('.intro-mark', intro), line = GC.qs('.intro-line', intro);
      tl.fromTo(mark, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .55, ease: 'power3.out' }, 0.05)
        .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: .7, ease: 'power3.inOut' }, 0.15)
        .to(mark, { opacity: 0, y: -10, duration: .3, ease: 'power2.in' }, 0.85)
        .to(line, { opacity: 0, duration: .25 }, 0.9);
      function finish() {
        if (finish.done) return; finish.done = true;
        gsap.to(intro, { opacity: 0, duration: .45, ease: 'power2.inOut', onComplete: function () { intro.remove(); } });
        if (GC.lenis) GC.lenis.start();
        window.removeEventListener('wheel', skip); window.removeEventListener('touchstart', skip); window.removeEventListener('keydown', skip);
        intro.removeEventListener('click', skip);
        resolve();
      }
      function skip() { if (skipped) return; skipped = true; tl.kill(); finish(); }
      intro.addEventListener('click', skip);
      window.addEventListener('wheel', skip, { passive: true });
      window.addEventListener('touchstart', skip, { passive: true });
      window.addEventListener('keydown', skip);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var go = function () { GC.init(); };
    if (document.fonts && document.fonts.ready) {
      // không chờ font tải quá lâu (timeout tối đa 1.2s)
      Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(go);
    } else go();
  });
})();