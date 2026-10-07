/* Phần 06: Các ca điển hình / dự án thực tế (cases), được render từ records.json (nhúng nội tuyến vào data.generated.js).
   Bản ghi đầu tiên = showcase chính (sân khấu lớn với slide + video click-để-tải); các bản ghi còn lại = lưới "Dự án khác" (ẩn đi nếu trống). */
(function () {
  var GC = window.GC;
  var E = GC.escape;
  var caseCopy = {
    '雾·钟': {
      title: 'Sương mù · Chuông',
      text: 'Trò chơi khám phá, kể chuyện góc nhìn từ trên xuống theo phong cách pixel: bạn vào vai một linh mục đến ngôi làng vắng bóng người, vừa di chuyển vừa điều tra, ghép nối sự thật qua ánh sáng và ký ức.',
      tag: 'Dự án cộng đồng',
      credit: 'Tác giả trong cộng đồng đã tạo nên trò chơi độc lập hoàn chỉnh này chỉ bằng một câu lệnh với Gandi CLI.',
      fine: 'Số liệu lấy từ tệp của dự án; không tính các khối bóng.',
      coverCap: 'Nhà thờ lúc hoàng hôn; góc trên bên trái là thanh mục tiêu và tiến độ ký ức.',
      stats: [
        { n: '22', l: 'nhân vật' },
        { n: '1562', l: 'khối' },
        { n: '80', l: 'kịch bản cấp cao nhất' },
        { n: '144', l: 'trang phục' },
        { n: '13', l: 'âm thanh' },
        { n: '5', l: 'tiện ích mở rộng' }
      ]
    }
  };

  function stats(r) {
    return (r.stats || []).length ? '<div class="case-stats">' + r.stats.map(function (s) {
      return '<div class="b"><strong>' + E(s.n) + '</strong><span>' + E(s.l) + '</span></div>';
    }).join('') + '</div>' : '';
  }
  function slidesOf(r) {
    var out = [], seen = {};
    function add(s) { if (s && s.src && !seen[s.src]) { seen[s.src] = 1; out.push(s); } }
    if (r.cover) add({ src: r.cover, thumb: r.coverThumb || r.cover, alt: r.coverCap || r.imageAlt || r.title, cap: r.coverCap || '' });
    (r.shots || []).forEach(add);
    if (!out.length && r.image) add({ src: r.image, thumb: r.image, alt: r.imageAlt || r.title });
    return out;
  }
  function html(r, first) {
    var slides = slidesOf(r), v = r.video;
    var stage = '';
    if (slides.length) {
      stage = '<div class="show-main"><div class="show-stage"' + (r.aspect ? ' style="--ar:' + E(r.aspect) + '"' : '') + '><div class="show-slides">' +
        slides.map(function (s, i) { return '<img src="' + E(s.src) + '" alt="' + E(s.alt || r.title) + '"' + (i ? ' loading="lazy"' : '') + ' class="' + (i === 0 ? 'on' : '') + (s.ui ? ' ui' : '') + '" data-cap="' + E(s.cap || '') + '" decoding="async">'; }).join('') +
        '</div><div class="show-cap" aria-live="polite">' + E(slides[0].cap || '') + '</div>' +
        (v && v.embedUrl ? '<button type="button" class="show-play" aria-label="Tải và phát video demo"><i></i>Xem video demo' + (v.duration ? '<small>' + E(v.duration) + '</small>' : '') + '</button>' : '') +
        '<div class="show-fallback" role="status"><p>Không thể tải trình phát video tại đây.<br><a class="ulink" href="' + E((v && v.pageUrl) || '#') + '" target="_blank" rel="noopener noreferrer">Xem trên Bilibili ↗</a></p></div></div>' +
        (slides.length > 1 ? '<div class="show-thumbs" role="group" aria-label="Ảnh chụp màn hình">' + slides.map(function (s, i) {
          return '<button type="button" aria-label="Ảnh chụp màn hình thứ ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : '') + '><img src="' + E(s.thumb || s.src) + '" alt="" loading="lazy"></button>';
        }).join('') + '</div>' : '') + '</div>';
    }
    var body = '<div class="show-body"><p class="case-label">' + (first ? '<b>Dự án thực tế</b>' : '') + (r.tag ? '<span>' + E(r.tag) + '</span>' : '') + '</p><h3>' + E(r.title) + '</h3>' +
      (r.text ? '<p class="t">' + E(r.text) + '</p>' : '') +
      (r.credit ? '<p class="credit">' + E(r.credit) + '</p>' : '') +
      (r.prompt ? '<blockquote class="show-prompt"><span>Một câu tóm tắt</span>' + E(r.prompt) + '</blockquote>' : '') +
      (r.author ? '<p class="by">Tác giả: ' + E(r.author) + '</p>' : '') +
      stats(r) + (r.fine ? '<p class="fine case-fine">' + E(r.fine) + '</p>' : '') +
      (v && v.pageUrl ? '<a class="ulink case-link" href="' + E(v.pageUrl) + '" target="_blank" rel="noopener noreferrer">Xem trên Bilibili ↗</a>' :
        (r.link && r.link.href ? '<a class="ulink case-link" href="' + E(r.link.href) + '" target="_blank" rel="noopener noreferrer">' + E(r.link.label || 'Xem chi tiết') + ' ↗</a>' : '')) +
      '</div>';
    return '<article class="show" data-reveal>' + stage + body + '</article>';
  }

  function wire(root, r) {
    var stage = GC.qs('.show-stage', root); if (!stage) return;
    var imgs = GC.qsa('.show-slides img', stage), thumbs = GC.qsa('.show-thumbs button', root);
    var cur = 0, timer = null, hover = false, playing = false, visible = false;
    function go(i) {
      if (i === cur) return;
      imgs[cur].classList.remove('on'); imgs[i].classList.add('on');
      if (thumbs[cur]) thumbs[cur].removeAttribute('aria-current'); if (thumbs[i]) thumbs[i].setAttribute('aria-current', 'true');
      cur = i;
      var cap = GC.qs('.show-cap', stage); if (cap) cap.textContent = imgs[i].getAttribute('data-cap') || '';
    }
    function schedule() {
      if (timer) timer.kill(); timer = null;
      if (GC.reduced || imgs.length < 2 || playing || hover || !visible) return;
      timer = gsap.delayedCall(4.6, function () { go((cur + 1) % imgs.length); schedule(); });
    }
    thumbs.forEach(function (b, i) { b.addEventListener('click', function () { go(i); schedule(); }); });
    root.addEventListener('pointerenter', function () { hover = true; schedule(); });
    root.addEventListener('pointerleave', function () { hover = false; schedule(); });
    GC.visible(stage, function () { visible = true; schedule(); }, function () { visible = false; schedule(); });

    var btn = GC.qs('.show-play', stage), fb = GC.qs('.show-fallback', stage);
    if (btn && r.video) btn.addEventListener('click', function () {
      playing = true; schedule();
      try {
        var f = document.createElement('iframe');
        f.title = r.video.title || r.title; f.loading = 'lazy'; f.allowFullscreen = true; f.setAttribute('allowfullscreen', '');
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation allow-popups');
        var loaded = false;
        f.addEventListener('load', function () { loaded = true; });
        f.src = r.video.embedUrl;
        stage.appendChild(f); btn.style.display = 'none';
        setTimeout(function () { if (!loaded && fb) fb.classList.add('on'); }, 9000);
      } catch (e) { if (fb) fb.classList.add('on'); }
    });
  }

  GC.register(function () {
    var D = window.GC_DATA, recs = (D && D.records) || [], host = GC.qs('#cases');
    if (!host || !recs.length) return;
    var localized = recs.map(function (r) {
      var copy = caseCopy[r.title];
      return copy ? Object.assign({}, r, copy) : r;
    });
    var out = html(localized[0], true);
    if (localized.length > 1) out += '<div class="more-cases"><p class="case-label"><b>Dự án khác</b></p><div class="more-grid">' + localized.slice(1).map(function (r) { return html(r, false); }).join('') + '</div></div>';
    host.innerHTML = out;
    GC.qsa('.show', host).forEach(function (el, i) { wire(el, localized[i]); });
  });
})();