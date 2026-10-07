/* Chuyển động nền: mọi thứ là hàm liên tục của tiến độ cuộn p (0..1), được nội suy mượt mà, không nhảy theo từng phần.
   Chỉ opacity (tông màu nền) và transform (các mảng màu, lưới chấm, hình bóng) thay đổi. Khi giảm chuyển động: dùng một trạng thái tĩnh cố định. */
(function () {
  var GC = window.GC;
  var GHOSTS = [
    { host: '#top', prog: 'multi-scene', css: 'left:-14%;bottom:-18%;width:min(40vw,560px);rotate:-5deg', y: [40, -90] },
    { host: '#top', prog: 'shooter', css: 'right:-9%;top:-4%;width:min(42vw,600px);rotate:4deg', y: [10, -120] },
    { host: '#writing', prog: 'data-structures', css: 'right:-6%;bottom:4%;width:min(38vw,560px);rotate:-3deg', y: [80, -80] }
  ];
  var TAU = Math.PI * 2;
  function bump(p, c, w) { var d = Math.abs(p - c) / w; return d >= 1 ? 0 : 0.5 * (1 + Math.cos(Math.PI * d)); }

  GC.register(function () {
    var D = window.GC_DATA, reduced = GC.reduced, mobile = GC.mobile();

    if (D && !mobile) {
      GHOSTS.forEach(function (g) {
        var host = GC.qs(g.host); if (!host || !D.programs[g.prog]) return;
        var el = document.createElement('div'); el.className = 'ghost'; el.setAttribute('aria-hidden', 'true'); el.style.cssText = g.css;
        var s = GC.svgInto(el, g.prog); if (!s) return;
        s.removeAttribute('role'); s.removeAttribute('aria-label');
        host.insertBefore(el, host.firstChild);
        if (!reduced) gsap.fromTo(el, { y: g.y[0] }, { y: g.y[1], ease: 'none', scrollTrigger: { trigger: host, start: 'top bottom', end: 'bottom top', scrub: 1.6 } });
      });
    }

    var brown = GC.qs('.b-brown'), cool = GC.qs('.b-cool');
    var w1 = GC.qs('.bg-w1'), w2 = GC.qs('.bg-w2'), w3 = GC.qs('.bg-w3'), grid = GC.qs('.bg-grid');
    var st = { p: 0, br: 0, co: 0, a: [0, 0], b: [0, 0], c: [0, 0] };

    function targets(p) {
      var W = window.innerWidth, H = window.innerHeight;
      return {
        br: bump(p, 0.34, 0.3), co: bump(p, 0.68, 0.3),
        a: [Math.cos(TAU * (p * 1.15 + 0.05)) * 0.38 * W, Math.sin(TAU * (p * 0.9)) * 0.34 * H],
        b: [Math.cos(TAU * (p * 1.3 + 0.5)) * 0.42 * W, Math.sin(TAU * (p * 1.1 + 0.3)) * 0.38 * H],
        c: [Math.cos(TAU * (p * 0.7 + 0.2)) * 0.3 * W, Math.sin(TAU * (p * 1.5)) * 0.3 * H]
      };
    }
    function apply(t) {
      brown.style.opacity = t.br.toFixed(3); cool.style.opacity = t.co.toFixed(3);
      w1.style.transform = 'translate3d(' + t.a[0].toFixed(1) + 'px,' + t.a[1].toFixed(1) + 'px,0)';
      w2.style.transform = 'translate3d(' + t.b[0].toFixed(1) + 'px,' + t.b[1].toFixed(1) + 'px,0)';
      w3.style.transform = 'translate3d(' + t.c[0].toFixed(1) + 'px,' + t.c[1].toFixed(1) + 'px,0)';
    }
    if (reduced) { apply(targets(0.16)); return; }   // một trạng thái tĩnh cố định, đẹp mắt

    var lastS = -1, settled = false;
    gsap.ticker.add(function () {
      var s = window.scrollY, max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var p = Math.min(1, Math.max(0, s / max));
      var t = targets(p);
      var k = 0.07;
      st.br += (t.br - st.br) * k; st.co += (t.co - st.co) * k;
      for (var i = 0; i < 2; i++) { st.a[i] += (t.a[i] - st.a[i]) * k; st.b[i] += (t.b[i] - st.b[i]) * k; st.c[i] += (t.c[i] - st.c[i]) * k; }
      var done = s === lastS && Math.abs(t.br - st.br) < 0.002 && Math.abs(t.co - st.co) < 0.002 && Math.abs(t.a[0] - st.a[0]) < 0.3 && Math.abs(t.b[0] - st.b[0]) < 0.3;
      if (done && settled) return;
      settled = done; lastS = s;
      apply(st);
      if (!mobile) grid.style.transform = 'translate3d(0,' + (-((s * 0.035) % 28)).toFixed(2) + 'px,0)';
    });
  });
})();
