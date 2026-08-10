(function () {
  var sunum = window.HBC_SUNUM || {};
  var isActive = sunum.isActive || function () {
    return new URLSearchParams(window.location.search).get('sunum') === '1';
  };
  var appendToHref = sunum.appendToHref || function (href) {
    if (!href || href.charAt(0) === '#' || /^https?:\/\//i.test(href)) return href;
    if (/[?&]sunum=1(?:&|$)/.test(href)) return href;
    return href + (href.indexOf('?') >= 0 ? '&' : '?') + 'sunum=1';
  };
  var patchLinks = sunum.patchLinks || function (root) {
    if (!root || !isActive()) return;
    root.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      var next = appendToHref(href);
      if (next !== href) a.setAttribute('href', next);
    });
  };

  var shell = document.querySelector('.mock-app-shell');
  if (!shell) return;

  function findCalismaItem(id) {
    var list = window.HBC_CALISMALAR || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function isOrnek(item) {
    return !!(item && (item.ornek || item.ornekRapor || item.ornekTumTurler));
  }

  function findCurrentMockup() {
    var cfg = window.TASK_HUB;
    if (!cfg || !cfg.calisma || !cfg.page) return null;
    var mockups = cfg.calisma.mockups || [];
    for (var i = 0; i < mockups.length; i++) {
      if (mockups[i].id === cfg.page) return mockups[i];
    }
    return null;
  }

  function wireDuzeltBtn(btn) {
    if (!btn) return;
    var cfg = window.TASK_HUB;
    if (!cfg || !cfg.calisma || !cfg.calisma.id) {
      btn.hidden = true;
      return;
    }
    var item = findCalismaItem(cfg.calisma.id);
    var mockup = findCurrentMockup();
    if (!item || !mockup || isOrnek(item) || !window.TASK_CURSOR) {
      btn.hidden = true;
      return;
    }
    btn.addEventListener('click', function () {
      window.TASK_CURSOR.open({ item: item, mode: 'mockup-duzelt', mockup: mockup });
    });
  }

  function markDevOnly() {
    var parent = shell.parentNode;
    var el = parent.firstElementChild;
    while (el && el !== shell) {
      if (!el.classList.contains('mock-dev-bar')) {
        el.classList.add('mock-dev-only');
      }
      el = el.nextElementSibling;
    }
    var prompt = document.querySelector('.mock-prompt');
    if (prompt) prompt.classList.add('mock-dev-only');
  }

  function ensureBar() {
    if (document.querySelector('.mock-dev-bar')) return;
    var bar = document.createElement('div');
    bar.className = 'mock-dev-bar mock-dev-only';
    bar.innerHTML =
      '<div class="mock-dev-bar-left">' +
      '<a class="mock-sunum-link" href="' + appendToHref('?sunum=1') + '">Sunum</a>' +
      '<span class="mock-dev-bar-hint">Müşteriye gösterirken tıklayın — HBC menüsü ve prompt kutuları gizlenir.</span>' +
      '</div>' +
      '<button type="button" class="mock-duzelt-btn">Düzenle</button>';
    shell.parentNode.insertBefore(bar, shell);
    wireDuzeltBtn(bar.querySelector('.mock-duzelt-btn'));
  }

  function ensureSunumControls() {
    if (document.querySelector('.mock-sunum-controls')) return;
    var wrap = document.createElement('div');
    wrap.className = 'mock-sunum-controls';
    wrap.innerHTML =
      '<button type="button" class="mock-sunum-fe-toggle" id="mock-sunum-fe-toggle">FE uyarılarını göster</button>' +
      '<a class="mock-sunum-exit" href="' + window.location.pathname + '">Sunumdan çık</a>';
    document.body.appendChild(wrap);
    var toggle = document.getElementById('mock-sunum-fe-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var on = document.body.classList.toggle('mock-fe-warnings-on');
        toggle.textContent = on ? 'FE uyarılarını gizle' : 'FE uyarılarını göster';
        toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
    }
  }

  function apply() {
    var on = isActive();
    document.body.classList.toggle('mock-sunum', on);
    if (!on) {
      document.body.classList.remove('mock-fe-warnings-on');
      var toggle = document.getElementById('mock-sunum-fe-toggle');
      if (toggle) {
        toggle.textContent = 'FE uyarılarını göster';
        toggle.setAttribute('aria-pressed', 'false');
      }
    }
    document.title = document.title.replace(/^Sunum: /, '');
    if (on) {
      document.title = 'Sunum: ' + document.title;
      patchLinks(shell);
    }
  }

  markDevOnly();
  ensureBar();
  ensureSunumControls();
  apply();
})();
