/* Hero panel loop: real blocks SVG <-> real DSL text, ~6.5 s per round.
   Chips (one per block) are abstract rounded rectangles that fly from each block's box to its code line's box (FLIP via
   translate/scale + opacity only). All geometry is measured once (load, fonts, resize) and cached; no layout reads while animating. */
(function () {
  var GC = window.GC;
  GC.register(function () {
    var D = window.GC_DATA && window.GC_DATA.programs.hello;
    var host = GC.qs('#hero-blocks'), ws = GC.qs('#hero-ws'), cap = GC.qs('#hero-cap');
    var svg = host && GC.qs('svg', host);
    if (!D || !svg) return;
    var reduced = GC.reduced, mobile = GC.mobile();
    var K = mobile ? 0.85 : 1, STAG = mobile ? 0.05 : 0.07;

    var marks = D.marks.marks.filter(function (m) { return m.step != null; }).sort(function (a, b) { return a.step - b.step; });
    var atLines = (D.meta.atLines || []);
    var rawLines = D.dsl.split('\n');
    var shown = [];                                     // [{n: original 1-based line, text}]
    rawLines.forEach(function (t, i) { if (atLines.indexOf(i + 1) < 0) shown.push({ n: i + 1, text: t }); });

    /* code overlay */
    var code = document.createElement('div'); code.className = 'mcode'; code.setAttribute('aria-hidden', 'true');
    code.innerHTML = shown.map(function (l) { return '<span class="ml' + (l.text ? '' : ' ph') + '" data-n="' + l.n + '">' + (GC.hl(l.text) || ' ') + '</span>'; }).join('');
    host.appendChild(code);
    var chipsBox = document.createElement('div'); chipsBox.className = 'mchips'; chipsBox.setAttribute('aria-hidden', 'true'); host.appendChild(chipsBox);
    var lineEl = {}; GC.qsa('.ml', code).forEach(function (e) { lineEl[e.getAttribute('data-n')] = e; });

    /* own parts of each block (direct children that are not nested blocks) */
    var blockG = {}, own = {}, txt = {}, color = {};
    marks.forEach(function (m) {
      var g = svg.querySelector('[data-bid="' + m.id + '"]'); blockG[m.id] = g;
      own[m.id] = g ? Array.prototype.filter.call(g.children, function (c) { return !c.hasAttribute('data-bid'); }) : [];
      txt[m.id] = [];
      own[m.id].forEach(function (c) { if (/^(text|image)$/i.test(c.nodeName)) txt[m.id].push(c); Array.prototype.forEach.call(c.querySelectorAll('text,image'), function (t) { txt[m.id].push(t); }); });
      var p = g && g.querySelector('path'); color[m.id] = (p && p.getAttribute('fill')) || '#ffab19';
    });
    var chips = {}, cxs = {};
    marks.forEach(function (m) {
      var c = document.createElement('div'); c.className = 'mchip'; c.innerHTML = '<div class="cx"><i class="c1" style="background:' + color[m.id] + '"></i><i class="c2"></i></div>';
      chipsBox.appendChild(c); chips[m.id] = c; cxs[m.id] = c.firstChild;
    });
    var tokens = {}; GC.qsa('.ml', code).forEach(function (e) { tokens[e.getAttribute('data-n')] = GC.qsa('span', e); });

    /* ---------- measurement (cached) ---------- */
    var G = null;
    function measure() {
      var body = host.getBoundingClientRect(), sr = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal;
      var s = sr.width / vb.width, ox = sr.left - body.left, oy = sr.top - body.top;
      var maxCh = Math.max.apply(null, shown.map(function (l) { return l.text.length; }));
      var cs = getComputedStyle(host), padL = parseFloat(cs.paddingLeft) || 0, avail = host.clientWidth - padL - (parseFloat(cs.paddingRight) || 0) - 14;
      var fs = Math.max(9.5, Math.min(15, avail / (maxCh * 0.606))), lh = fs * 1.8, codeH = shown.length * lh;
      code.style.cssText = 'left:' + (padL + 6).toFixed(1) + 'px;top:' + Math.max(0, oy + (sr.height - codeH) / 2).toFixed(1) + 'px;font-size:' + fs.toFixed(2) + 'px;line-height:' + lh.toFixed(2) + 'px';
      var cr = code.getBoundingClientRect();
      var g = { blocks: {}, lines: {} };
      marks.forEach(function (m) {
        var b = m.svgBBox, hh = Math.min(b.h, m.opcode === 'event_whenflagclicked' ? 72 : 56);
        g.blocks[m.id] = { x: ox + b.x * s, y: oy + b.y * s, w: b.w * s, h: hh * s };
      });
      Object.keys(lineEl).forEach(function (n) {
        var r = lineEl[n].getBoundingClientRect();
        g.lines[n] = { x: r.left - body.left, y: r.top - body.top, w: Math.max(r.width, 12), h: r.height };
      });
      G = g;
      marks.forEach(function (m) {
        var c = chips[m.id], b = g.blocks[m.id];
        var cx = cxs[m.id]; cx.style.width = b.w + 'px'; cx.style.height = b.h + 'px';
        gsap.set(cx, { x: b.x, y: b.y, scaleX: 1, scaleY: 1 }); gsap.set(c, { opacity: 0 });
      });
    }
    var mt = 0; function remeasure() { clearTimeout(mt); mt = setTimeout(function () { if (M.dbg) return; if (!M.tl || !M.tl.isActive()) measure(); else M.dirty = true; }, 120); }

    /* ---------- state machine ---------- */
    var M = { state: 'blocks', tl: null, wait: null, auto: !reduced, paused: false, visible: true, hold: 0, dirty: false };
    var capSpans = { b: GC.qs('.s-b', cap), c: GC.qs('.s-c', cap) };
    function setUi(state, instant) {
      ws.classList.toggle('is-code', state === 'code');
      capSpans.b.classList.toggle('on', state === 'blocks'); capSpans.c.classList.toggle('on', state === 'code');
      cap.setAttribute('aria-pressed', String(state === 'code'));
      cap.setAttribute('aria-label', state === 'code' ? '切换显示：当前是文本，点击查看对应积木' : '切换显示：当前是积木，点击查看对应文本');
    }
    var allOwn = [].concat.apply([], marks.map(function (m) { return own[m.id].concat(txt[m.id]); }));
    var allLines = GC.qsa('.ml', code);
    function clear(el) { gsap.killTweensOf(el); }
    function endState(state) {
      marks.forEach(function (m) { var c = chips[m.id], b = G.blocks[m.id]; gsap.set(cxs[m.id], { x: b.x, y: b.y, scaleX: 1, scaleY: 1 }); gsap.set(c, { opacity: 0 }); gsap.set(c.querySelector('.c2'), { opacity: 0 }); gsap.set(c.querySelector('.c1'), { opacity: 1 }); });
      gsap.set(allOwn, { opacity: state === 'blocks' ? 1 : 0 });
      gsap.set(allLines, { opacity: state === 'code' ? 1 : 0, y: 0 });
      gsap.set(GC.qsa('.ml span', code), { opacity: 1 });
      host.classList.toggle('mx', true);
    }
    function lineFor(m) { return String(m.dslLines[0]); }
    var chipLines = {}; // lines that have a chip
    marks.forEach(function (m) { chipLines[lineFor(m)] = m; });

    function build(to, fast) {
      var tl = gsap.timeline({ paused: true });
      var k = fast ? 0.34 : K, stag = fast ? 0.02 : STAG;
      if (to === 'code') {
        marks.forEach(function (m, i) {
          var t0 = i * stag * 1.15 * k / K, c = chips[m.id], b = G.blocks[m.id], l = G.lines[lineFor(m)], el = lineEl[lineFor(m)];
          var fly = 0.78 * k, cx = cxs[m.id], s0 = t0 + 0.2 * k;
          tl.to(txt[m.id], { opacity: 0, duration: 0.14 * k, ease: 'power1.in' }, t0)                     // labels go first
            .to(c, { opacity: 1, duration: 0.14 * k, ease: 'none' }, t0 + 0.08 * k)                         // chip cross-fades in over the block...
            .to(own[m.id], { opacity: 0, duration: 0.14 * k, ease: 'none' }, t0 + 0.08 * k)                 // ...while the real shape fades out
            .to(cx, { scaleX: l.w / b.w, scaleY: l.h / b.h, duration: 0.5 * k, ease: 'power3.out' }, s0)  // narrows to a thin bar first
            .to(cx, { x: l.x, y: l.y, duration: fly, ease: 'power2.inOut' }, s0)                           // then travels along a smooth path
            .to(c.querySelector('.c1'), { opacity: 0, duration: fly * 0.45, ease: 'none' }, s0 + fly * 0.5)
            .to(c.querySelector('.c2'), { opacity: 1, duration: fly * 0.45, ease: 'none' }, s0 + fly * 0.5)
            .fromTo(el, { opacity: 0, y: 3 }, { opacity: 1, y: 0, duration: 0.3 * k, ease: 'power2.out' }, s0 + fly * 0.72)
            .fromTo(tokens[lineFor(m)], { opacity: 0 }, { opacity: 1, duration: 0.25 * k, stagger: 0.016 * k, ease: 'none' }, s0 + fly * 0.72)
            .to(c, { opacity: 0, duration: 0.16 * k }, s0 + fly - 0.06 * k);
        });
        // lines without a block (declaration and closing braces) slide in
        Object.keys(lineEl).forEach(function (n) {
          if (chipLines[n] || lineEl[n].classList.contains('ph')) return;
          var near = n === '1' ? 0 : marks.length * stag * k / K * 0.7;
          tl.fromTo(lineEl[n], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.45 * k, ease: 'power3.out' }, near + 0.3 * k);
          tl.fromTo(tokens[n], { opacity: 0 }, { opacity: 1, duration: 0.3 * k, stagger: 0.015 * k, ease: 'none' }, near + 0.3 * k);
        });
      } else {
        marks.forEach(function (m) { var c = chips[m.id], b = G.blocks[m.id], l = G.lines[lineFor(m)]; gsap.set(cxs[m.id], { x: l.x, y: l.y, scaleX: l.w / b.w, scaleY: l.h / b.h }); gsap.set(c, { opacity: 0 }); gsap.set(c.querySelector('.c1'), { opacity: 1 }); gsap.set(c.querySelector('.c2'), { opacity: 0 }); });
        marks.forEach(function (m, i) {
          var t0 = i * stag * k / K, c = chips[m.id], b = G.blocks[m.id], l = G.lines[lineFor(m)], el = lineEl[lineFor(m)];
          var fly = 0.64 * k;
          var c1 = c.querySelector('.c1'), c2 = c.querySelector('.c2'), FI = { immediateRender: false };
          tl.fromTo(c, { opacity: 0 }, { opacity: 1, duration: 0.18 * k, immediateRender: false }, t0)
            .fromTo(cxs[m.id], { x: l.x, y: l.y, scaleX: l.w / b.w, scaleY: l.h / b.h }, { x: b.x, y: b.y, scaleX: 1, scaleY: 1, duration: fly, ease: 'back.out(1.15)', immediateRender: false }, t0 + 0.16 * k)
            .to(el, { opacity: 0, duration: 0.2 * k, ease: 'power2.in' }, t0 + 0.02 * k)
            .fromTo(own[m.id].concat(txt[m.id]), { opacity: 0 }, { opacity: 1, duration: 0.3 * k, ease: 'power2.out', immediateRender: false }, t0 + 0.16 * k + fly * 0.6)
            .to(c, { opacity: 0, duration: 0.18 * k }, t0 + 0.16 * k + fly * 0.8);
        });
        Object.keys(lineEl).forEach(function (n) {
          if (chipLines[n]) return;
          tl.to(lineEl[n], { opacity: 0, y: 6, duration: 0.3 * k, ease: 'power2.in' }, 0);
        });
      }
      tl.call(function () { }, null, tl.duration());
      return tl;
    }

    function morph(to, fast, done) {
      if (!G) measure();
      if (M.tl) M.tl.kill();
      if (M.wait) { M.wait.kill(); M.wait = null; }
      if (reduced) { // simple cross-fade, no wave
        M.tl = gsap.timeline({ onComplete: fin });
        var showCode = to === 'code';
        M.tl.to(svg, { opacity: showCode ? 0 : 1, duration: 0.4 }, 0).to(code, { opacity: showCode ? 1 : 0, duration: 0.4 }, 0);
        gsap.set(allLines, { opacity: 1, y: 0 }); gsap.set(GC.qsa('.ml span', code), { opacity: 1 });
        setUi(to); return;
      }
      M.tl = build(to, fast); setUi(to);
      M.tl.eventCallback('onComplete', fin);
      if (!M.paused || fast) M.tl.play(0); else M.tl.pause(0);
      function fin() { M.state = to; M.tl = null; endState(to); if (M.dirty) { M.dirty = false; measure(); endState(to); } if (done) done(); schedule(2.2 * K); }
    }
    function schedule(delay) {
      if (M.wait) { M.wait.kill(); M.wait = null; }
      if (!M.auto) return;
      M.wait = gsap.delayedCall(delay, function () { M.wait = null; morph(M.state === 'blocks' ? 'code' : 'blocks'); });
      applyPause();
    }
    function applyPause() {
      var p = M.paused || !M.visible || document.hidden;
      if (M.tl) p ? M.tl.pause() : M.tl.play();
      if (M.wait) p ? M.wait.pause() : M.wait.resume();
    }

    /* ---------- public hooks for hero.js (sentence changes) ---------- */
    GC.morph = {
      // bring the panel back to blocks quickly (0.35s) then call cb; no overlap with the assemble animation
      interrupt: function (cb) {
        if (M.wait) { M.wait.kill(); M.wait = null; }
        if (!G) { cb(); return; }
        if (M.state === 'code' || M.tl) {
          var wasAuto = M.auto; M.auto = false;
          if (M.tl) M.tl.kill(); M.tl = null;
          // from wherever we are: snap chips off, fade code out, own parts in
          marks.forEach(function (m) { gsap.killTweensOf([chips[m.id], cxs[m.id], own[m.id], txt[m.id]]); gsap.set(chips[m.id], { opacity: 0 }); });
          gsap.killTweensOf(allLines); gsap.killTweensOf(GC.qsa('.ml span', code));
          setUi('blocks');
          gsap.to(allLines, { opacity: 0, duration: 0.25 });
          gsap.to(allOwn, { opacity: 1, duration: 0.3, overwrite: true, onComplete: function () { M.state = 'blocks'; endState('blocks'); M.auto = wasAuto; cb(); } });
        } else cb();
      },
      after: function (sec) { if (M.auto) schedule(sec); }
    };

    /* ---------- manual toggle, hover / visibility pauses ---------- */
    function manual() {
      if (M.wait) { M.wait.kill(); M.wait = null; }
      var to = M.state === 'blocks' ? 'code' : 'blocks';
      if (M.tl) { var cur = M.tl; M.tl = null; cur.progress(1); }  // finish the running one instantly, then flip
      M.state = M.state === 'blocks' ? 'blocks' : 'code'; endState(M.state);
      var was = M.paused; M.paused = false;
      M.auto = !reduced;
      morph(M.state === 'blocks' ? 'code' : 'blocks');
      M.paused = was;
    }
    cap.addEventListener('click', manual);
    host.addEventListener('click', manual);
    ws.addEventListener('pointerenter', function () { M.paused = true; applyPause(); });
    ws.addEventListener('pointerleave', function () { M.paused = false; applyPause(); });
    GC.visible(ws, function () { M.visible = true; applyPause(); }, function () { M.visible = false; applyPause(); });
    document.addEventListener('visibilitychange', applyPause);

    /* ---------- init ---------- */
    gsap.set(allLines, { opacity: 0 });
    var init = function () { measure(); endState('blocks'); if (M.auto) M.hold = 1; };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () { init(); });
    if (window.ResizeObserver) new ResizeObserver(remeasure).observe(host);
    window.addEventListener('resize', remeasure);
    GC.morphDebug = { scrub: function (to, p) { if (!G) measure(); if (!M.dbg || M.dbgTo !== to) { M.auto = false; if (M.wait) M.wait.kill(); if (M.tl) M.tl.kill(); M.tl = null; endState(M.state); M.dbg = build(to); M.dbgTo = to; setUi(to); } M.dbg.pause(); M.dbg.progress(p); if (p >= 1) { M.state = to; endState(to); M.dbg = null; } }, morph: morph, state: function () { return M.state; }, M: M };
  });
})();
