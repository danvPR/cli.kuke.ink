/* DSL helpers: syntax highlight, inline SVG, mark utilities */
(function () {
  var GC = (window.GC = window.GC || {});
  var KW = /^(const|let|if|else|for|while|repeat|repeatUntil|wait|waitUntil|return|true|false|break|continue|define|stop|size)$/;
  var NS = /^(when|looks|motion|sensing|control|gandiScene|stage|sprite|operator|data|event|sound|pen|broadcast)$/;

  GC.hl = function (line) {
    var out = '', i = 0, s = line, m;
    while (i < s.length) {
      var rest = s.slice(i);
      if ((m = /^\/\/.*/.exec(rest)) || (m = /^\/\*.*?\*\//.exec(rest))) { out += '<span class="t-c">' + GC.escape(m[0]) + '</span>'; }
      else if ((m = /^@\w+/.exec(rest))) { out += '<span class="t-d">' + m[0] + '</span>'; }
      else if ((m = /^"(?:[^"\\]|\\.)*"/.exec(rest))) { out += '<span class="t-s">' + GC.escape(m[0]) + '</span>'; }
      else if ((m = /^`(?:[^`\\]|\\.)*`/.exec(rest))) { out += '<span class="t-s">' + GC.escape(m[0]).replace(/\$\{[^}]*\}/g, function (x) { return '<span class="t-i">' + x + '</span>'; }) + '</span>'; }
      else if ((m = /^\d+(\.\d+)?/.exec(rest))) { out += '<span class="t-n">' + m[0] + '</span>'; }
      else if ((m = /^[A-Za-z_一-鿿][\w一-鿿]*/.exec(rest))) {
        var w = m[0];
        if (KW.test(w)) out += '<span class="t-k">' + w + '</span>';
        else if (NS.test(w) && s[i + w.length] === '.') out += '<span class="t-ns">' + w + '</span>';
        else out += GC.escape(w);
      }
      else if ((m = /^[{}()\[\];,]/.exec(rest))) { out += '<span class="t-p">' + m[0] + '</span>'; }
      else { m = [rest[0]]; out += GC.escape(m[0]); }
      i += m[0].length;
    }
    return out;
  };

  /* render DSL text into <pre>: one <span class="dl"> per line, original line numbers in data-n */
  GC.renderCode = function (pre, text, opts) {
    opts = opts || {};
    var lines = GC.localizeSampleCode(text).split('\n');
    pre.innerHTML = lines.map(function (l, i) {
      var isAt = /^@at\(/.test(l);
      return '<span class="dl' + (isAt ? ' is-at' : '') + '" data-n="' + (i + 1) + '"><span class="gn"></span><span class="gt">' + (GC.hl(l) || ' ') + '</span></span>';
    }).join('');
    GC.renumber(pre);
  };
  GC.renumber = function (pre) {
    var n = 0;
    GC.qsa('.dl', pre).forEach(function (d) {
      if (d.classList.contains('is-folded')) return;
      n++; d.firstChild.textContent = n;
    });
  };

  GC.localizeSampleCode = function (text) {
    return text
      .replace(/"小明"/g, '"An"')
      .replace(/"新手"/g, '"áo_dài"')
      .replace(/"勇士"/g, '"võ_sĩ"')
      .replace(/敌人\/\/Enemy/g, 'ke_dich//DoiThu')
      .replace(/第二关/g, 'Màn 2')
      .replace(/关卡/g, 'man')
      .replace(/你好，Gandi！/g, 'Chào bạn, Gandi!')
      .replace(/第 \$\{i\} 个/g, 'Lượt ${i}')
      .replace(/第 \$\{man\} 关，开始！/g, 'Màn ${man} bắt đầu!')
      .replace(/升级了/g, 'đã lên cấp');
  };

  var BLOCK_TEXT = [
    ['删除此克隆体', 'Xóa bản sao'],
    ['当作为克隆体启动时', 'Khi tạo bản sao'],
    ['重复执行直到', 'Lặp đến khi'],
    ['将y坐标增加', 'Đổi y thêm'],
    ['当接收到', 'Khi nhận'],
    ['当场景开始', 'Khi vào cảnh'],
    ['切换到场景', 'Sang cảnh'],
    ['按下鼠标?', 'Chuột nhấn?'],
    ['的内容数', 'số mục'],
    ['解析为对象', 'Đọc JSON'],
    ['中的每个', 'lần với'],
    ['的余数', 'phần dư'],
    ['你好，Gandi！', 'Chào bạn, Gandi!'],
    ['敌人//Enemy', 'Địch//Enemy'],
    ['{"name":"小明"', '{"name":"An"'],
    ['，参数', ', tham số'],
    ['第\u00a0', 'Lượt\u00a0'],
    ['\u00a0个', ''],
    ['当按下', 'Khi nhấn'],
    ['第二关', 'Màn 2'],
    ['，开始！', ', bắt đầu!'],
    ['空格', 'phím cách'],
    ['关卡', 'màn'],
    ['参数', 'tham số'],
    ['y\u00a0坐标', 'y'],
    ['勇士', 'võ_sĩ'],
    ['升级了', 'lên cấp'],
    ['被点击', 'nhấp'],
    ['不成立', 'sai'],
    ['重复执行', 'Lặp'],
    ['除以', 'chia'],
    ['移动', 'Đi'],
    ['显示', 'Hiện'],
    ['等待', 'Đợi'],
    ['秒', 'giây'],
    ['步', 'bước'],
    ['次', 'lần'],
    ['增加', 'thêm'],
    ['个', 'mục'],
    ['说', 'nói'],
    ['设为', 'thành'],
    ['按下', 'nhấn'],
    ['碰到', 'chạm'],
    ['或者', 'hoặc'],
    ['或', 'hoặc'],
    ['与', 'và'],
    ['和', 'và'],
    ['加入', 'thêm'],
    ['连接', 'nối'],
    ['否则', 'không thì'],
    ['那么', 'thì'],
    ['如果', 'nếu'],
    ['对于', 'Lặp'],
    ['当', 'Khi'],
    ['的', 'của'],
    ['向', 'hướng'],
    ['键', 'phím'],
    ['关', 'màn']
  ];

  function translateBlockText(svg) {
    GC.qsa('text', svg).forEach(function (text) {
      var opcodeEl = text.closest('g[data-opcode]');
      var opcode = opcodeEl && opcodeEl.getAttribute('data-opcode');
      var walker = document.createTreeWalker(text, NodeFilter.SHOW_TEXT), node;
      while ((node = walker.nextNode())) {
        var value = GC.localizeSampleCode(node.nodeValue);
        BLOCK_TEXT.forEach(function (entry) { value = value.split(entry[0]).join(entry[1]); });
        if (value.indexOf('将') >= 0) value = value.split('将').join(opcode === 'data_setvariableto' ? 'Đặt' : 'Đổi');
        node.nodeValue = value;
      }
    });
  }

  /* inline SVG; rename ids so several copies can live on one page */
  GC.svgInto = function (host, name, opts) {
    var d = window.GC_DATA && window.GC_DATA.programs[name];
    if (!d) return null;
    var svg = d.svg.replace(/\sid="(blk-\d+)"/g, ' data-bid="$1"');
    host.innerHTML = svg;
    var el = host.firstElementChild;
    translateBlockText(el);
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', 'Các khối lệnh Scratch trong chương trình mẫu ' + name);
    el.removeAttribute('width'); el.removeAttribute('height');
    el.style.width = '100%'; el.style.height = 'auto';
    return el;
  };

  /* own lines of a statement mark = its range minus ranges of marks nested inside */
  GC.ownLines = function (marks, m) {
    var a = m.dslLines[0], b = m.dslLines[1], set = {};
    for (var l = a; l <= b; l++) set[l] = true;
    marks.forEach(function (o) {
      if (o === m || o.step == null || o.step <= m.step) return;
      if (o.dslLines[0] >= a && o.dslLines[1] <= b) for (var l2 = o.dslLines[0]; l2 <= o.dslLines[1]; l2++) delete set[l2];
    });
    return Object.keys(set).map(Number);
  };
})();
