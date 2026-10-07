/* Section 07: the one-sentence prompt box (copy), the illustrative agent panel with the REAL `gandi --help` output,
   the collapsible manual steps, and the hero entry that focuses the copy button. */
(function () {
  var GC = window.GC;

  // Real output of "gandi --help" (published 0.2.0), copied verbatim. Only a selection is shown:
  // lines 1, 2, 3, 9, 10 and 15 of the real output; the grey "…" row marks where lines were left out.
  var HELP = [
    'gandi: AI coding interface to the currently paired Gandi 3 editor',
    'Install: npm install -g @kukemc/gandi-cli',
    'Start: gandi start                # idempotent background service; gandi stop closes it (grants are kept)',
    'Discover: gandi overview | files [--kind blocks] [--exclude rig] [--include-rig] | outline | read REF [--offset LINE --limit N] [--full]',
    "          gandi find '**/*.js' --kind blocks | grep 'score' --glob '**/*.js' --context 2",
    null,
    'Edit:     gandi check REF --file draft.js | write REF --file draft.js --base-rev REV|null'
  ];

  function legacyCopy(txt) {
    try {
      var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(ta); ta.select(); var ok = document.execCommand('copy'); ta.remove(); return !!ok;
    } catch (e) { return false; }
  }
  function copyText(txt) {
    return new Promise(function (res) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { navigator.clipboard.writeText(txt).then(function () { res(true); }, function () { res(legacyCopy(txt)); }); return; } catch (e) {}
      }
      res(legacyCopy(txt));
    });
  }
  function selectNode(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }

  GC.register(function () {
    var reduced = GC.reduced;
    var btn = GC.qs('#say-copy'), say = GC.qs('#say-t'), live = GC.qs('#say-live'), label = GC.qs('.say-l', btn);
    var panel = GC.qs('#agent'), pre = GC.qs('#agent-pre');
    if (!btn || !pre) return;

    /* ---------- agent panel: all lines are in the DOM (no layout shift), revealed by a timeline ---------- */
    var rows = [
      '<span class="al ai"><b>›</b>执行 npm install -g @kukemc/gandi-cli</span>',
      '<span class="al ai"><b>›</b>执行 gandi --help</span>',
      '<span class="al gap"></span>'
    ].concat(HELP.map(function (l) { return l === null ? '<span class="al ell" aria-label="以下省略">…</span>' : '<span class="al">' + GC.escape(l) + '</span>'; }));
    rows.push('<span class="al"><i class="al-cur" aria-hidden="true"></i></span>');
    pre.innerHTML = rows.join('');
    var lines = GC.qsa('.al', pre), tl = null, played = false;
    function build() {
      if (tl) tl.kill();
      gsap.set(lines, { opacity: 0, y: 6 });
      tl = gsap.timeline({ paused: true });
      tl.to(lines[0], { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.2)
        .to(lines[1], { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 1.1)
        .to(lines.slice(3, lines.length - 1), { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', stagger: 0.11 }, 1.9)
        .to(lines[lines.length - 1], { opacity: 1, y: 0, duration: 0.5 }, '>-0.1');
      return tl;
    }
    function showFinal() { gsap.set(lines, { opacity: 1, y: 0 }); }
    if (reduced) showFinal();
    else {
      build();
      GC.visible(panel, function () { if (!played) { played = true; tl.play(0); } });
    }
    function replay() { if (reduced) return; build(); played = true; tl.play(0); }

    /* ---------- copy the sentence (text must equal data-say exactly) ---------- */
    var txt = btn.getAttribute('data-say'), t0 = null;
    function reset() { btn.classList.remove('is-copied', 'is-fallback'); swap('复制这句话'); live.textContent = ''; }
    function swap(s) {
      if (reduced) { label.textContent = s; return; }
      gsap.fromTo(label, { yPercent: 55, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out' });
      label.textContent = s;
    }
    btn.addEventListener('click', function () {
      copyText(txt).then(function (ok) {
        clearTimeout(t0);
        if (ok) { btn.classList.remove('is-fallback'); btn.classList.add('is-copied'); swap('已复制 · 粘贴给你的 AI'); live.textContent = '已复制'; }
        else { selectNode(say); btn.classList.add('is-fallback'); swap('按 Ctrl+C 复制'); live.textContent = '没能自动复制，文字已选中，请按 Ctrl+C'; }
        t0 = setTimeout(reset, 2400);
        replay();
      });
    });

    /* ---------- manual steps: disclosure with smooth height ---------- */
    var tg = GC.qs('#manual-toggle'), mb = GC.qs('#manual-body');
    tg.addEventListener('click', function () {
      var open = tg.getAttribute('aria-expanded') === 'true';
      if (!open) {
        mb.hidden = false; tg.setAttribute('aria-expanded', 'true');
        if (reduced) return;
        var h = mb.scrollHeight;
        gsap.fromTo(mb, { height: 0 }, { height: h, duration: 0.6, ease: 'power3.out', onComplete: function () { mb.style.height = 'auto'; } });
      } else {
        tg.setAttribute('aria-expanded', 'false');
        if (reduced) { mb.hidden = true; return; }
        gsap.to(mb, { height: 0, duration: 0.45, ease: 'power3.inOut', onComplete: function () { mb.hidden = true; mb.style.height = ''; } });
      }
    });
    // keyboard-scrollable preview region
    var sc = GC.qs('.agent-scroll'); sc.setAttribute('tabindex', '0'); sc.setAttribute('role', 'region'); sc.setAttribute('aria-label', '示意面板，可横向滚动');

    /* ---------- hero entry: scroll here and focus the copy button ---------- */
    GC.qsa('[data-focus-copy]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var done = function () { try { btn.focus({ preventScroll: true }); } catch (err) { btn.focus(); } };
        if (GC.lenis) GC.lenis.scrollTo('#say', { offset: -Math.round(innerHeight * 0.3), duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); }, onComplete: done });
        else { GC.qs('#say').scrollIntoView({ block: 'center' }); done(); }
      });
    });
  });
})();
