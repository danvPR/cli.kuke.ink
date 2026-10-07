(function () {
  var GC = window.GC, NS = 'http://www.w3.org/2000/svg';

  function build(name, ctx) {
    var D = window.GC_DATA.programs[name];
    var marks = D.marks.marks.filter(function (m) { return m.step != null; }).sort(function (a, b) { return a.step - b.step; });
    var N = marks.length;
    var stage = GC.qs('.bridge-stage'), blocksIn = GC.qs('#b-blocks-in'), panel = GC.qs('#b-blocks');
    var pre = GC.qs('#b-code-pre'), linksSvg = GC.qs('#b-links'), badgesEl = GC.qs('#b-badges');
    var foldBtn = GC.qs('#fold-btn'), progI = GC.qs('#b-prog-i');
    var mobile = GC.mobile();

    // name + '.dsl · 示例程序' -> Chương trình mẫu
    GC.qs('#b-code-name').textContent = name + '.dsl · Chương trình mẫu';
    var svg = GC.svgInto(blocksIn, name);
    var vb = svg.viewBox.baseVal;
    
    // Điều chỉnh kích thước: vừa với khung panel
    function fit() {
      var pw = panel.clientWidth - 44, ph = panel.clientHeight - 36;
      var s = Math.min(pw / vb.width, ph / vb.height, 1.9);
      svg.style.width = (vb.width * s) + 'px'; svg.style.height = (vb.height * s) + 'px';
    }
    fit();

    GC.renderCode(pre, D.dsl);
    var lineEls = {}; GC.qsa('.dl', pre).forEach(function (d) { lineEls[d.getAttribute('data-n')] = d; });
    
    // Các dòng riêng + liên kết dòng -> bước (line -> step)
    var lineStep = {};
    marks.forEach(function (m) { m.own = GC.ownLines(marks, m); m.own.forEach(function (l) { lineStep[l] = m.step; }); });
    var blockEl = {};
    marks.forEach(function (m) { blockEl[m.id] = svg.querySelector('[data-bid="' + m.id + '"]'); });

    // Lớp phủ nổi bật (overlay highlight) + vùng tương tác (hit regions)
    var hl = document.createElementNS(NS, 'rect'); hl.setAttribute('class', 'b-hl'); svg.appendChild(hl);
    var hits = marks.slice().sort(function (a, b) { return b.svgBBox.w * b.svgBBox.h - a.svgBBox.w * a.svgBBox.h; }).map(function (m) {
      var r = document.createElementNS(NS, 'rect'); r.setAttribute('class', 'b-hit');
      r.setAttribute('x', m.svgBBox.x); r.setAttribute('y', m.svgBBox.y); r.setAttribute('width', m.svgBBox.w); r.setAttribute('height', m.svgBBox.h);
      r.__m = m; svg.appendChild(r); return r;
    });
    function placeHl(m, animate) {
      var b = m.svgBBox;
      gsap.to(hl, { attr: { x: b.x - 3, y: b.y - 3, width: b.w + 6, height: b.h + 6 }, opacity: 1, duration: animate ? 0.55 : 0, ease: 'power3.out', overwrite: true });
    }

    // Huy hiệu / Thẻ thông tin (badges)
    var v = D.verify;
    var items = [
      'Biên dịch không lỗi/cảnh báo',
      'Chuyển đổi 2 chiều ' + v.roundTrips + ' lần · Bảng khối lệnh khớp từng trường',
      v.printedTextIdenticalCount + ' lần văn bản in ra giống hệt',
      'Biên dịch lại từ gốc khôi phục chính xác từng byte'
    ];
    if (!v.blockTableIdenticalEveryRound) items.splice(1, 1);
    if (!v.basedRebuildByteIdentical) items.pop();
    if (v.compileDiagnostics !== 0) items.shift();
    items.push('286 mục tiêu thử nghiệm · 0 sai lệch');
    badgesEl.innerHTML = items.map(function (t) {
      return '<li><svg viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7"/></svg>' + GC.escape(t) + '</li>';
    }).join('');
    GC.qs('#b-fine').textContent = 'Chương trình mẫu, các con số đến từ việc xác minh chuyển đổi hai chiều thực tế của đoạn mã này. 286 là số lượng nhân vật và sân khấu trong bộ ngữ liệu kiểm thử scratch-vm (Khối lệnh → Văn bản → Khối lệnh), không phải số lượng dự án. Cú pháp trông giống JavaScript nhưng chỉ dùng để mô tả các khối lệnh và không bao giờ được thực thi trực tiếp.';
    var badgeLis = GC.qsa('li', badgesEl), badgesOn = false;

    // Đường nối liên kết (links)
    var linkPath = null, linkDot = null, linkGhost = null, curLink = null;
    var linkTw = null;
    function clearLinks() { if (linkTw) { linkTw.kill(); linkTw = null; } while (linksSvg.firstChild) linksSvg.removeChild(linksSvg.firstChild); linkPath = linkDot = linkGhost = null; }
    function drawLink(m, animate) {
      if (mobile) return;
      var sr = stage.getBoundingClientRect();
      linksSvg.setAttribute('viewBox', '0 0 ' + sr.width + ' ' + sr.height);
      var hlr = hl.getBoundingClientRect ? null : null;
      var scale = svg.getBoundingClientRect().width / vb.width;
      var sb = svg.getBoundingClientRect();
      var b = m.svgBBox;
      var x0 = sb.left - sr.left + (b.x + Math.min(b.w, 300)) * scale;
      if (m.own.length && m.own[0] === m.dslLines[0]) x0 = sb.left - sr.left + (b.x + b.w) * scale;
      var y0 = sb.top - sr.top + (b.y + 22) * scale;
      var pr = panel.getBoundingClientRect();
      var lineEl = lineEls[m.own[0]] || lineEls[m.dslLines[0]];
      var lr = lineEl.querySelector('.gt').getBoundingClientRect();
      var x2 = lr.left - sr.left - 6, y2 = lr.top - sr.top + lr.height / 2;
      var xp = pr.right - sr.left;
      x0 = Math.min(x0, xp - 4);
      var dx = Math.max(40, (x2 - xp) * 0.6);
      var d = 'M' + x0 + ',' + y0 + ' H' + xp + ' C' + (xp + dx) + ',' + y0 + ' ' + (x2 - dx) + ',' + y2 + ' ' + x2 + ',' + y2;
      clearLinks();
      linkGhost = document.createElementNS(NS, 'path'); linkGhost.setAttribute('d', d); linkGhost.setAttribute('class', 'ghost');
      linkPath = document.createElementNS(NS, 'path'); linkPath.setAttribute('d', d);
      linkDot = document.createElementNS(NS, 'circle'); linkDot.setAttribute('r', 3.2);
      linksSvg.appendChild(linkGhost); linksSvg.appendChild(linkPath); linksSvg.appendChild(linkDot);
      var len = linkPath.getTotalLength();
      linkPath.style.strokeDasharray = len;
      var o = { p: 0 }, lp = linkPath, ld = linkDot;
      function place(p) { var pt = lp.getPointAtLength(len * p); ld.setAttribute('cx', pt.x); ld.setAttribute('cy', pt.y); lp.style.strokeDashoffset = len * (1 - p); }
      if (animate) { linkTw = gsap.to(o, { p: 1, duration: 0.8, ease: 'power3.inOut', onUpdate: function () { place(o.p); } }); place(0); }
      else place(1);
      curLink = m;
    }

    var cur = -1; // Bước từ 0..N (N = đã hiển thị tất cả, không tô sáng khối nào); -1 = chưa thiết lập
    function setStep(k, animate) {
      if (k === cur) return;
      var prev = cur; cur = k;
      marks.forEach(function (m) {
        var el = blockEl[m.id]; if (!el) return;
        var vis = m.step <= Math.min(k, N);
        var was = el.__vis;
        if (was === vis) return; el.__vis = vis;
        if (!animate) { gsap.killTweensOf(el); gsap.set(el, { opacity: vis ? 1 : 0 }); return; }
        if (vis) GC.dropIn(el, { from: -26, duration: 0.9 });
        else { gsap.killTweensOf(el); gsap.to(el, { opacity: 0, duration: 0.3, ease: 'power2.in' }); }
      });
      var active = k >= 1 && k <= N ? marks[k - 1] : null;
      Object.keys(lineEls).forEach(function (n) {
        var el = lineEls[n], st = lineStep[n] || 0;
        el.classList.toggle('is-future', st > Math.min(k, N));
        el.classList.toggle('is-on', !!(active && active.own.indexOf(Number(n)) >= 0));
        el.classList.remove('is-pair');
      });
      if (active) { placeHl(active, animate); drawLink(active, animate); }
      else { gsap.to(hl, { opacity: 0, duration: 0.4, overwrite: true }); clearLinks(); curLink = null; }
      
      // Huy hiệu (badges)
      var showB = k > N;
      if (showB !== badgesOn) {
        badgesOn = showB;
        if (showB) gsap.fromTo(badgeLis, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: 'expo.out', overwrite: true });
        else gsap.to(badgeLis, { opacity: 0, y: 6, duration: 0.25, overwrite: true });
      }
      // Tự động cuộn khung mã nguồn để giữ cho dòng đang kích hoạt luôn hiển thị
      if (active) { var le = lineEls[active.own[0]]; if (le && pre.scrollHeight > pre.clientHeight) pre.scrollTo({ top: Math.max(0, le.offsetTop - pre.clientHeight / 2), behavior: 'smooth' }); }
    }

    // Ghép cặp khi di chuột (hover pairing)
    function pairFor(m) {
      if (!m || m.step > cur) return;
      hoverM = m;
      placeHl(m, true); drawLink(m, true);
      Object.keys(lineEls).forEach(function (n) {
        var on = m.own.indexOf(Number(n)) >= 0;
        lineEls[n].classList.toggle('is-pair', on && !lineEls[n].classList.contains('is-on'));
      });
    }
    var hoverM = null;
    function unpair() {
      if (!hoverM) return; hoverM = null;
      Object.keys(lineEls).forEach(function (n) { lineEls[n].classList.remove('is-pair'); });
      var active = cur >= 1 && cur <= N ? marks[cur - 1] : null;
      if (active) { placeHl(active, true); drawLink(active, true); } else { gsap.to(hl, { opacity: 0, duration: 0.3, overwrite: true }); clearLinks(); }
    }
    hits.forEach(function (r) { r.addEventListener('pointerenter', function () { pairFor(r.__m); }); r.addEventListener('pointerleave', unpair); });
    Object.keys(lineEls).forEach(function (n) {
      var el = lineEls[n];
      el.addEventListener('pointerenter', function () {
        var cands = marks.filter(function (m) { return m.own.indexOf(Number(n)) >= 0; });
        if (cands[0]) pairFor(cands[0]);
      });
      el.addEventListener('pointerleave', unpair);
    });

    foldBtn.setAttribute('aria-pressed', 'false');
    var folded = true;
    function applyFold() {
      GC.qsa('.is-at', pre).forEach(function (d) { d.classList.toggle('is-folded', folded); });
      GC.renumber(pre); foldBtn.setAttribute('aria-pressed', String(!folded));
      foldBtn.textContent = folded ? 'Hiện các dòng vị trí @at' : 'Thu gọn các dòng vị trí @at';
      if (cur >= 1 && cur <= N) drawLink(marks[cur - 1], false);
    }
    foldBtn.onclick = function () { folded = !folded; applyFold(); };
    applyFold();

    // Khởi tạo ban đầu: chưa hiển thị gì cả
    marks.forEach(function (m) { if (blockEl[m.id]) { blockEl[m.id].__vis = false; gsap.set(blockEl[m.id], { opacity: 0 }); } });
    Object.keys(lineEls).forEach(function (n) { lineEls[n].classList.toggle('is-future', (lineStep[n] || 0) > 0); });
    gsap.set(badgeLis, { opacity: 0 });
    cur = 0;

    // Trình điều khiển cuộn trang (scroll driver)
    var steps = N + 1;
    var st = ScrollTrigger.create({
      trigger: '#bridge-pin', start: 'top top', end: function () { return '+=' + Math.round(innerHeight * (GC.reduced ? 0.6 : 0.62) * steps); },
      pin: true, anticipatePin: 1, scrub: false,
      onUpdate: function (self) {
        var p = self.progress;
        var k = Math.min(steps, Math.floor(p * steps + 0.0001) + 1); // 1..N+1
        setStep(k, true);
        progI.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      }
    });
    var onResize = function () { fit(); if (curLink && cur >= 1 && cur <= N) { placeHl(marks[cur - 1], false); drawLink(marks[cur - 1], false); } };
    var ro = new ResizeObserver(onResize); ro.observe(panel); ro.observe(stage);
    
    // Xuất ra ngoài để phục vụ kiểm tra/debug
    GC.bridge = { setStep: setStep, N: N, steps: steps, trigger: st };

    return function () { ro.disconnect(); st.kill(); clearLinks(); };
  }

  GC.register(function () {
    if (!window.GC_DATA) return;
    var mm = gsap.matchMedia();
    mm.add('(min-width: 861px)', function () { return build('loop-branch'); });
    mm.add('(max-width: 860px)', function () { return build('hello'); });
  });
})();