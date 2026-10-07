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
    var lines = text.split('\n');
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

  /* inline SVG; rename ids so several copies can live on one page */
  GC.svgInto = function (host, name, opts) {
    var d = window.GC_DATA && window.GC_DATA.programs[name];
    if (!d) return null;
    var svg = d.svg.replace(/\sid="(blk-\d+)"/g, ' data-bid="$1"');
    host.innerHTML = svg;
    var el = host.firstElementChild;
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', (d.meta && d.meta.title || name) + '：积木');
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
