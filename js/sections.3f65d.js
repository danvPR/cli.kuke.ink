(function () {
  var GC = window.GC;

  GC.register(function () {
    var D = window.GC_DATA, reduced = GC.reduced;
    var P = D && D.programs;

    /* ---------- generic reveals ---------- */
    // elements already scrolled past (e.g. after an anchor jump) appear instantly; only the ones in view are staggered
    function split(els) {
      var inView = [], past = [];
      els.forEach(function (e) { var r = e.getBoundingClientRect(); (r.bottom < 0 || r.top > innerHeight * 1.2 ? past : inView).push(e); });
      if (past.length) gsap.set(past, { opacity: 1, y: 0 });
      return inView;
    }
    GC.qsa('.eyebrow .rule').forEach(function (r) {
      if (reduced || r.closest('#top') || r.closest('.bridge-head') || r.closest('.flow-stick')) return;
      gsap.from(r, { scaleX: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: r, start: 'top 90%' } });
    });
    var rev = GC.qsa('[data-reveal]').filter(function (e) { return !e.closest('#top'); });
    if (reduced) gsap.set(rev, { opacity: 1 });
    else {
      gsap.set(rev, { y: 26 });
      ScrollTrigger.batch(rev, {
        start: 'top 90%', once: true,
        onEnter: function (els) { els = split(els); gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, overwrite: true, onComplete: function () { els.forEach(function (e) { e.style.willChange = ''; }); } }); }
      });
    }
    GC.qsa('[data-lines]').forEach(function (h) {
      var lines = GC.splitLines(h);
      if (reduced) return;
      gsap.set(lines, { yPercent: 112 });
      gsap.to(lines, { yPercent: 0, duration: 1.25, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
    // static h2 without data-lines in pinned sections: simple fade
    GC.qsa('.flow-stick .h2, .gal-head .h2, .bridge-head .h2').forEach(function (h) {
      if (reduced) return;
      gsap.from(h, { y: 30, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 92%', once: true } });
    });

    if (!P) return;

    /* ---------- 02 writing ---------- */
    var wp = GC.qs('#w-pre');
    GC.renderCode(wp, P['data-structures'].dsl);
    GC.qsa('.is-at', wp).forEach(function (d) { d.classList.add('is-folded'); }); GC.renumber(wp);
    GC.renderCode(GC.qs('#vs-old'), P.hello.blocksStyle); GC.renderCode(GC.qs('#vs-new'), P.hello.dsl);
    ['#vs-old', '#vs-new'].forEach(function (s) { GC.qsa('.is-at', GC.qs(s)).forEach(function (d) { d.classList.add('is-folded'); }); GC.renumber(GC.qs(s)); });
    if (!reduced) {
      var wl = GC.qsa('.dl', wp);
      gsap.set(wl, { opacity: 0, x: -14 });
      gsap.to(wl, { opacity: 1, x: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: wp, start: 'top 82%', once: true } });
      var ks = GC.qsa('.t-k', wp);
      gsap.fromTo(ks, { color: 'rgba(244,241,234,.5)' }, { color: '#ffab19', duration: 0.8, stagger: 0.08, delay: 0.5, scrollTrigger: { trigger: wp, start: 'top 82%', once: true } });
      GC.qsa('.w-feats li').forEach(function (li, i) {
        var c = GC.qs('code', li);
        ScrollTrigger.create({ trigger: li, start: 'top 90%', once: true, onEnter: function () { gsap.from(c, { opacity: 0, filter: 'blur(4px)', duration: 0.9, delay: 0.1 + i * 0.05 }); } });
      });
    }

    /* ---------- 03 bento ---------- */
    var cards = GC.qsa('[data-card]');
    if (!reduced) {
      gsap.set(cards, { opacity: 0, y: 50 });
      ScrollTrigger.batch(cards, { start: 'top 92%', once: true, onEnter: function (els) {
        els = split(els);
        gsap.to(els, { opacity: 1, y: 0, duration: 1.2, stagger: 0.12, ease: 'expo.out', overwrite: true });
      } });
    }
    var fine = matchMedia('(hover: hover)').matches && !reduced;
    cards.forEach(function (c) {
      var raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, act = false;
      function step() { cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14; c.style.setProperty('--rx', cx.toFixed(2) + 'deg'); c.style.setProperty('--ry', cy.toFixed(2) + 'deg');
        if (act || Math.abs(cx) > 0.02 || Math.abs(cy) > 0.02) raf = requestAnimationFrame(step); else raf = 0; }
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty('--sx', (px * 100).toFixed(1) + '%'); c.style.setProperty('--sy', (py * 100).toFixed(1) + '%');
        if (!fine || e.target.closest('.cmp')) { tx = ty = 0; return; }
        tx = (0.5 - py) * 5; ty = (px - 0.5) * 6; act = true; if (!raf) raf = requestAnimationFrame(step);
      });
      c.addEventListener('pointerleave', function () { tx = ty = 0; act = false; if (!raf) raf = requestAnimationFrame(step); });
    });

    // scenes
    var sv = GC.svgInto(GC.qs('#cv-scenes'), 'multi-scene');
    var sm = P['multi-scene'].marks.marks.filter(function (m) { return m.step != null; }).sort(function (a, b) { return a.step - b.step; });
    var sBlocks = sm.map(function (m) { return sv.querySelector('[data-bid="' + m.id + '"]'); }).filter(Boolean);
    if (!reduced) {
      gsap.set(sBlocks, { opacity: 0 });
      ScrollTrigger.create({ trigger: '#cv-scenes', start: 'top 80%', once: true, onEnter: function () {
        sBlocks.forEach(function (b, i) { GC.dropIn(b, { from: -26, duration: 1, delay: 0.4 + i * 0.28 }); });
      } });
    }

    // data card: real data-structures blocks
    var dsv = GC.svgInto(GC.qs('#cv-data-blocks'), 'data-structures');
    if (dsv && !reduced) {
      var dsb = GC.qsa('[data-bid]', dsv); dsb.forEach(function (b) { b.style.opacity = '0'; });
      ScrollTrigger.create({ trigger: '#cv-data-blocks', start: 'top 82%', once: true, onEnter: function () { dsb.forEach(function (b, i) { GC.dropIn(b, { from: -24, duration: 1, delay: 0.3 + i * 0.12 }); }); } });
    }

    // groups tree
    if (!reduced) {
      var rows = GC.qsa('.tr', GC.qs('#tree'));
      gsap.set(rows, { opacity: 0, x: -12 });
      ScrollTrigger.create({ trigger: '#tree', start: 'top 85%', once: true, onEnter: function () { gsap.to(rows, { opacity: 1, x: 0, duration: 0.8, stagger: 0.12, delay: 0.3, ease: 'expo.out' }); } });
    }

    // tests: ticks
    var chk = GC.qsa('.checks li');
    if (reduced) chk.forEach(function (l) { l.classList.add('ok'); });
    else ScrollTrigger.create({ trigger: '.checks', start: 'top 88%', once: true, onEnter: function () { chk.forEach(function (l, i) { setTimeout(function () { l.classList.add('ok'); }, 700 + i * 450); }); } });

    // data card
    var dl = P['data-structures'].dsl.split('\n').slice(0, 10);
    var dd = GC.qs('#cv-data');
    dl = dl.filter(function (l) { return !/^@at\(/.test(l); });
    dd.innerHTML = dl.map(function (l) { return '<span class="dl-m">' + GC.hl(l) + '</span>'; }).join('');
    if (!reduced) {
      var dls = GC.qsa('.dl-m', dd); gsap.set(dls, { opacity: 0, y: 8 });
      ScrollTrigger.create({ trigger: dd, start: 'top 88%', once: true, onEnter: function () { gsap.to(dls, { opacity: 1, y: 0, duration: 0.8, stagger: 0.18, delay: 0.3, ease: 'expo.out' }); } });
    }

    // compare sliders
    GC.qsa('[data-cmp]').forEach(function (el) {
      var h = GC.qs('.cmp-h', el), pos = 50, dragging = false;
      function set(p) { pos = Math.max(2, Math.min(98, p)); el.style.setProperty('--pos', pos + '%'); h.setAttribute('aria-valuenow', Math.round(pos)); }
      function fromEvent(e) { var r = el.getBoundingClientRect(); set(((e.clientX - r.left) / r.width) * 100); }
      el.addEventListener('pointerdown', function (e) { dragging = true; el.setPointerCapture(e.pointerId); fromEvent(e); gsap.killTweensOf(o); });
      el.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
      el.addEventListener('pointerup', function () { dragging = false; });
      h.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') { set(pos - 5); e.preventDefault(); } if (e.key === 'ArrowRight') { set(pos + 5); e.preventDefault(); } });
      var o = { v: 50 };
      var rest = Number(el.getAttribute("data-rest")) || 50; o.v = rest; set(rest);
      if (!reduced) ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: function () {
        gsap.timeline({ delay: 0.5 }).to(o, { v: 82, duration: 1, ease: 'power2.inOut', onUpdate: function () { set(o.v); } })
          .to(o, { v: 22, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { set(o.v); } })
          .to(o, { v: rest, duration: 1, ease: 'power2.inOut', onUpdate: function () { set(o.v); } });
      } });
    });

    /* ---------- 04 flow ---------- */
    var steps = GC.qsa('.step'), navA = GC.qsa('#flow-nav a');
    steps.forEach(function (s, i) {
      var lines = GC.qsa('.ln-t', s);
      if (!reduced) gsap.set(lines, { opacity: 0, y: 10 });
      ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 38%',
        onToggle: function (self) { s.classList.toggle('is-on', self.isActive); if (navA[i]) navA[i].classList.toggle('is-on', self.isActive); } });
      if (!reduced) {
        ScrollTrigger.create({ trigger: s, start: 'top 72%', once: true, onEnter: function () {
          gsap.from(GC.qs('h3', s), { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out' });
          gsap.to(lines, { opacity: 1, y: 0, duration: 0.5, stagger: 0.28, delay: 0.25, ease: 'power2.out' });
        } });
      }
    });
    if (reduced) { /* lines visible by default */ }
    gsap.to('#flow-line-i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.flow-steps', start: 'top 60%', end: 'bottom 70%', scrub: reduced ? false : 0.4 } });

    /* ---------- 05 gallery ---------- */
    var track = GC.qs('#gal-track');
    var picks = ['shooter', 'multi-scene', 'data-structures'];
    var galleryCopy = {
      shooter: {
        title: 'Trò chơi bắn súng: đạn nhân bản',
        blurb: 'Trò chơi bắn súng từ gandi guide examples: đạn là các bản sao, tự xóa khi bay khỏi màn hình hoặc chạm kẻ địch; tất cả được dọn khi trò chơi kết thúc.'
      },
      'multi-scene': {
        title: 'Nhiều bối cảnh: chuyển cảnh có tham số',
        blurb: 'Một bối cảnh chuyển sang “Màn 2” kèm tham số; khối mũ ở bối cảnh khác đọc tham số thành biến cục bộ.'
      },
      'data-structures': {
        title: 'Cấu trúc dữ liệu nâng cao: đối tượng và danh sách',
        blurb: 'Literal đối tượng, tăng thuộc tính, push vào danh sách và kiểm tra size(), tương ứng với các khối của tiện ích mở rộng “Cấu trúc dữ liệu nâng cao”.'
      }
    };
    var html = '<div class="g-lead"><span class="big">Khối,<br>dưới dạng văn bản.</span><p>Ba chương trình mẫu: bên trái là các khối được gandi-blocks kết xuất thực tế, bên phải là văn bản được in ra từ chính chương trình đó.</p></div>';
    picks.forEach(function (n) {
      var p = P[n];
      var code = GC.localizeSampleCode(p.dsl).split('\n').filter(function (l) { return !/^@at\(/.test(l); }).join('\n');
      var copy = galleryCopy[n];
      html += '<article class="g-card" data-g="' + n + '"><div class="g-vis"></div><div class="g-txt"><span class="tag">Chương trình mẫu</span><h3>' + GC.escape(copy.title) +
        '</h3><p>' + GC.escape(copy.blurb) + '</p><pre aria-hidden="true">' + code.split('\n').map(GC.hl).join('\n') + '</pre><div class="meta">' + p.meta.blockCount + ' khối · ' + p.meta.lineCount + ' dòng</div></div></article>';
    });
    track.innerHTML = html;
    picks.forEach(function (n) { GC.svgInto(GC.qs('[data-g="' + n + '"] .g-vis'), n); });
    // gallery svgs stay rendered at natural scale inside card
    var gmm = gsap.matchMedia();
    gmm.add('(min-width: 861px)', function () {
      var pin = GC.qs('#gal-pin');
      var dist = function () { return Math.max(0, track.scrollWidth - innerWidth); };
      var tw = gsap.to(track, { x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: reduced ? false : 0.6, anticipatePin: 1, invalidateOnRefresh: true } });
      GC.qsa('.g-card').forEach(function (c) {
        var bl = GC.qsa('[data-bid]', c); bl.forEach(function (b) { b.style.opacity = '0'; });
        ScrollTrigger.create({ trigger: c, containerAnimation: tw, start: 'left 88%', once: true, onEnter: function () { bl.forEach(function (b, i) { GC.dropIn(b, { from: -20, duration: 0.9, delay: i * 0.05 }); }); } });
      });
    });

    /* ---------- 06 records: count up ---------- */
    var cnt = GC.qs('[data-count]');
    if (cnt && !reduced) {
      var tgt = Number(cnt.getAttribute('data-count')), o2 = { v: 0 };
      cnt.textContent = '0';
      ScrollTrigger.create({ trigger: cnt, start: 'top 88%', once: true, onEnter: function () {
        gsap.to(o2, { v: tgt, duration: 2, ease: 'power3.out', onUpdate: function () { cnt.textContent = Math.round(o2.v); } }); } });
    }
    /* footer wordmark rises */
    if (!reduced) gsap.from('.foot-big', { yPercent: 35, opacity: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.foot', start: 'top 85%', once: true } });
  });
})();
