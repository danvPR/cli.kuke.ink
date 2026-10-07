(function () {
  var GC = window.GC;
  // demo sentences typed into the hero prompt (game names are plain text)
  var PHRASES = ['一比一还原《星露谷物语》', '还原 Undertale，美术音乐全包', '做一个完整的《泰拉瑞亚》', '还原 Minecraft'];

  GC.register(function () {
    var hero = GC.qs('#top'), title = GC.qs('#hero-title');
    var D = window.GC_DATA, reduced = GC.reduced;
    var host = GC.qs('#hero-blocks');
    var svg = D ? GC.svgInto(host, 'hello') : null;
    var blocks = svg ? GC.qsa('[data-bid]', svg) : [];
    var lines = GC.splitLines(title);
    var reveal = GC.qsa('#top [data-reveal]');
    var cap = GC.qs('#hero-cap'), ws = GC.qs('#hero-ws'), txt = GC.qs('#prompt-txt'), prompt = GC.qs('#prompt');

    /* ---------- blocks: fade old out, spring new in; one timeline, killed on every restart ---------- */
    var asm = null, capShown = false;
    function assemble() {
      if (!svg) return;
      if (GC.morph) { GC.morph.interrupt(doAssemble); } else doAssemble();
    }
    function doAssemble() {
      if (asm) { asm.kill(); asm = null; }
      blocks.forEach(GC.killDrop);
      gsap.killTweensOf(svg);
      var firstTime = !capShown;
      var drop = function () {
        svg.style.opacity = '1';
        blocks.forEach(function (b) { b.style.opacity = '0'; });
        blocks.forEach(function (b, i) { GC.dropIn(b, { duration: 1, delay: i * 0.13 }); });
        if (GC.morph) GC.morph.after(blocks.length * 0.13 + 0.9 + 0.8);
        if (!capShown) { capShown = true; gsap.to(cap, { opacity: 1, duration: 0.8, delay: blocks.length * 0.13 + 0.3 }); }
      };
      if (firstTime) { drop(); return; }
      asm = gsap.to(svg, { opacity: 0, duration: 0.32, ease: 'power2.in', onComplete: function () { asm = null; drop(); } });
    }

    if (reduced) {
      gsap.set(reveal, { opacity: 1 }); txt.textContent = PHRASES[0]; gsap.set(cap, { opacity: 1 });
      GC.qs('.cursor').style.display = 'none';
      return setupScroll();
    }

    gsap.set(lines, { yPercent: 112 });
    gsap.set(reveal, { y: 18 });
    gsap.set(ws, { opacity: 0, y: 24 });
    if (svg) blocks.forEach(function (b) { b.style.opacity = '0'; });

    /* ---------- typewriter loop (rAF, dt-based: no drift, pauses off-screen / hidden tab) ---------- */
    var S = { i: 0, phase: 'idle', n: 0, t: 0, shown: -1, last: 0, raf: 0, on: false, visible: true, hover: false };
    var TYPE_MS = 56, ERASE_MS = 22, HOLD_MS = 7600, GAP_MS = 380;
    function render() {
      var k = Math.floor(S.n);
      if (k !== S.shown) { S.shown = k; txt.textContent = PHRASES[S.i].slice(0, k); }
    }
    function frame(ts) {
      S.raf = 0;
      if (!S.on) return;
      var dt = Math.min(100, ts - (S.last || ts)); S.last = ts;
      var len = PHRASES[S.i].length;
      if (S.phase === 'type') {
        S.n += dt / TYPE_MS;
        if (S.n >= len) { S.n = len; S.phase = 'hold'; S.t = 0; prompt.classList.remove('is-typing'); assemble(); }
      } else if (S.phase === 'hold') {
        S.t += dt; if (S.t >= HOLD_MS) { S.phase = 'erase'; prompt.classList.add('is-typing'); }
      } else if (S.phase === 'erase') {
        S.n -= dt / ERASE_MS;
        if (S.n <= 0) { S.n = 0; S.phase = 'gap'; S.t = 0; }
      } else if (S.phase === 'gap') {
        S.t += dt; if (S.t >= GAP_MS) { S.i = (S.i + 1) % PHRASES.length; S.phase = 'type'; prompt.classList.add('is-typing'); }
      }
      render();
      S.raf = requestAnimationFrame(frame);
    }
    function sync() {
      var want = S.phase !== 'idle' && S.visible && !S.hover && !document.hidden;
      if (want && !S.on) { S.on = true; S.last = 0; if (!S.raf) S.raf = requestAnimationFrame(frame); }
      else if (!want && S.on) { S.on = false; if (S.raf) { cancelAnimationFrame(S.raf); S.raf = 0; } }
    }
    function start() { S.phase = 'type'; prompt.classList.add('is-typing'); sync(); }
    GC.visible(hero, function () { S.visible = true; sync(); }, function () { S.visible = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    ws.addEventListener('pointerenter', function () { S.hover = true; sync(); });
    ws.addEventListener('pointerleave', function () { S.hover = false; sync(); });

    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to(lines, { yPercent: 0, duration: 1.35, stagger: 0.11 }, 0)
      .to(reveal, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08 }, 0.25)
      .to(ws, { opacity: 1, y: 0, duration: 1.1 }, 0.5)
      .call(start, null, 1.0);

    /* ---------- cursor spotlight, lerped ---------- */
    if (matchMedia('(hover: hover)').matches) {
      var tx = 0.7, ty = 0.35, cx = 0.7, cy = 0.35, on = false, raf = 0;
      var spot = GC.qs('.spot');
      var loop = function () {
        cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06;
        spot.style.setProperty('--mx', (cx * 100).toFixed(2) + '%');
        spot.style.setProperty('--my', (cy * 100).toFixed(2) + '%');
        if (on) raf = requestAnimationFrame(loop);
      };
      GC.visible(hero, function () { if (!on) { on = true; raf = requestAnimationFrame(loop); } }, function () { on = false; });
      window.addEventListener('pointermove', function (e) {
        var r = hero.getBoundingClientRect();
        tx = (e.clientX - r.left) / r.width; ty = (e.clientY - r.top) / r.height;
      }, { passive: true });
    }
    setupScroll();

    function setupScroll() {
      if (reduced) return;
      gsap.to('.hero-l', { yPercent: -9, opacity: 0.15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 15%', scrub: true } });
      gsap.to('.hero-r', { yPercent: -14, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    }
  });
})();
