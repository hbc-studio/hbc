(function () {
  var STEPS = [
    { id: 'genel-bilgiler', label: 'Genel Bilgiler', icon: '✎', panel: 0, countable: true },
    { id: 'talep', label: 'Talep', icon: '📋', panel: 1, countable: true },
    { id: 'havza', label: 'Havza Ve Koruma', icon: '📍', panel: 2, countable: true },
    { id: 'hukum', label: 'Hükümler', icon: '§', panel: 3, countable: true },
    { id: 'taskin', label: 'Taşkın, Tarım Ve Ek Görüş', icon: '💧', panel: 4, countable: true },
    { id: 'suki', label: 'SUKİ', icon: '🏛', panel: 5, countable: true },
    { id: 'ozet', label: 'Özet', icon: '☑', panel: 6, countable: false },
    { id: 'yazi', label: 'Yazı', icon: '📄', panel: 7, countable: false }
  ];

  var OZET_INDEX = 6;
  var YAZI_INDEX = 7;

  var current = 0;
  var root = document.getElementById('yazi-wizard');
  if (!root) return;

  function panelEl(i) {
    return root.querySelector('[data-step-panel="' + i + '"]');
  }

  function isFieldVisible(el) {
    if (!el || el.type === 'hidden') return false;
    if (el.closest('[hidden]')) return false;
    return true;
  }

  function fieldFilled(el) {
    if (el.tagName === 'SELECT' && el.multiple) {
      if (el.tomselect) {
        var tv = el.tomselect.getValue();
        return Array.isArray(tv) ? tv.length > 0 : !!tv;
      }
      return el.selectedOptions && el.selectedOptions.length > 0;
    }
    if (el.tagName === 'SELECT') {
      return el.value !== '' && el.value != null;
    }
    return (el.value || '').trim().length > 0;
  }

  function countableGroupsInPanel(i) {
    var p = panelEl(i);
    if (!p) return [];
    var fields = Array.prototype.slice.call(p.querySelectorAll('[data-yazi-field]'));
    var groups = [];
    var seenRadio = {};

    fields.forEach(function (f) {
      if (!isFieldVisible(f)) return;
      if (f.type === 'radio') {
        if (seenRadio[f.name]) return;
        seenRadio[f.name] = true;
        groups.push({ kind: 'radio', name: f.name });
        return;
      }
      groups.push({ kind: 'field', el: f });
    });
    return groups;
  }

  function isGroupFilled(g) {
    if (g.kind === 'radio') {
      return !!root.querySelector('input[name="' + g.name + '"]:checked');
    }
    return fieldFilled(g.el);
  }

  function countPanel(i) {
    var groups = countableGroupsInPanel(i);
    var filled = 0;
    groups.forEach(function (g) {
      if (isGroupFilled(g)) filled++;
    });
    return { filled: filled, total: groups.length };
  }

  function updateStepperMeta() {
    STEPS.forEach(function (step, idx) {
      var btn = root.querySelector('.yazi-step[data-step-index="' + idx + '"]');
      if (!btn) return;
      var meta = btn.querySelector('.yazi-step-meta');
      if (!step.countable) {
        if (idx === OZET_INDEX) meta.textContent = idx <= current ? 'Gözden Geçir' : '—';
        else if (idx === YAZI_INDEX) meta.textContent = idx <= current ? 'Önizleme' : '—';
        return;
      }
      var c = countPanel(step.panel);
      meta.textContent = c.filled + ' / ' + c.total + ' dolduruldu';
      btn.classList.toggle('is-done', c.filled >= c.total && c.total > 0);
    });
  }

  function goToStep(idx) {
    if (idx < 0 || idx >= STEPS.length) return;
    current = idx;
    root.querySelectorAll('.yazi-step-panel').forEach(function (p) {
      p.classList.toggle('is-active', parseInt(p.getAttribute('data-step-panel'), 10) === STEPS[current].panel);
    });
    root.querySelectorAll('.yazi-step').forEach(function (btn) {
      var i = parseInt(btn.getAttribute('data-step-index'), 10);
      btn.classList.toggle('is-active', i === current);
      btn.disabled = i > current && i !== OZET_INDEX && i !== YAZI_INDEX;
    });
    var back = document.getElementById('yazi-btn-back');
    var next = document.getElementById('yazi-btn-next');
    var create = document.getElementById('yazi-btn-create');
    var save = document.getElementById('yazi-btn-save');
    var dlWord = document.getElementById('yazi-btn-download-word');
    var dlPdf = document.getElementById('yazi-btn-download-pdf');
    if (back) back.hidden = current === 0;
    if (next) next.hidden = current >= OZET_INDEX;
    if (create) create.hidden = current !== OZET_INDEX;
    if (save) save.hidden = current !== YAZI_INDEX;
    if (dlWord) dlWord.hidden = current !== YAZI_INDEX;
    if (dlPdf) dlPdf.hidden = current !== YAZI_INDEX;
    updateStepperMeta();
    if (current === OZET_INDEX) buildSummary();
    if (current === YAZI_INDEX) buildDocumentPreview();
    location.hash = 'step-' + STEPS[current].id;
  }

  function val(id) {
    var el = document.getElementById(id);
    if (!el) return '—';
    if (el.tagName === 'SELECT' && el.multiple) {
      if (el.tomselect) {
        var tv = el.tomselect.getValue();
        if (!tv || (Array.isArray(tv) && !tv.length)) return '—';
        return el.tomselect.items.map(function (v) {
          var o = el.tomselect.options[v];
          return o ? o.text : v;
        }).join(', ') || '—';
      }
      return Array.prototype.map.call(el.selectedOptions, function (o) { return o.text; }).join(', ') || '—';
    }
    return (el.value || '').trim() || '—';
  }

  function radioVal(name) {
    var c = root.querySelector('input[name="' + name + '"]:checked');
    return c ? c.value : '—';
  }

  function buildSummary() {
    var box = document.getElementById('yazi-summary');
    if (!box) return;
    var sections = [
      { title: 'Genel Bilgiler', rows: [['Başlık', val('f-baslik')], ['Açıklama', val('f-aciklama')]] },
      { title: 'Talep', rows: [['Talep Türü', val('f-talep-turu')], ['Tahsis / Satış Yazısı', val('f-tahsis')]] },
      { title: 'Havza Ve Koruma', rows: [['İlgi Yazı Özeti', val('f-ilgi-ozet')], ['Havzada Mı', val('f-havza')], ['Yeraltı Suyu Koruma', radioVal('f-yeralti')], ['İl', val('f-il')], ['İlçe', val('f-ilce')], ['Köy', val('f-koy')], ['Ada / Parsel', val('f-ada-parsel')], ['İlgide SUKİ', radioVal('f-ilgide-suki')], ['Baraj / Göl', val('f-baraj')], ['Koruma Alanı', val('f-koruma-alani')], ['Koruma Açıklaması', val('f-koruma-acik')]] },
      { title: 'Hükümler', rows: [['Hüküm Yazıyoruz', radioVal('f-hukum-yaz')], ['Hükümler', val('f-hukumler')], ['Değerlendirme', val('f-degerlendirme')]] },
      { title: 'Taşkın, Tarım Ve Ek Görüş', rows: [['Taşkın Görüşü', val('f-taskin')], ['Koordinasyon İhtiyacı', radioVal('f-tarim')], ['Ek Kurum', val('f-ek-kurum')], ['İlgide Kurum', radioVal('f-ilgide-kurum')], ['Ek Kanun', val('f-ek-kanun')], ['Hitap', val('f-hitap')]] },
      { title: 'SUKİ', rows: [['SUKİ', val('f-suki')], ['Faaliyet Tedbiri', val('f-faaliyet-tedbir')]] }
    ];
    box.innerHTML = sections.map(function (sec) {
      var rows = sec.rows.map(function (r) {
        return '<dt>' + r[0] + '</dt><dd>' + escapeHtml(r[1]) + '</dd>';
      }).join('');
      return '<div class="yazi-summary-section"><h4>' + sec.title + '</h4><dl>' + rows + '</dl></div>';
    }).join('');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildDocumentPreview() {
    var baslik = val('f-baslik');
    var doc = document.getElementById('yazi-doc-preview');
    if (!doc) return;
    var talep = val('f-talep-turu');
    var ozet = val('f-ilgi-ozet');
    doc.innerHTML =
      '<p><strong>' + escapeHtml(baslik) + '</strong></p>' +
      '<p>İlgi: ' + escapeHtml(ozet) + ' talep edilmektedir.</p>' +
      '<p>Bilindiği üzere söz konusu alan içme-kullanma suyu havzası dışında kalmaktadır (' + escapeHtml(val('f-havza')) + ').</p>' +
      '<p>Bu çerçevede, talep konusu <strong>' + escapeHtml(talep) + '</strong> faaliyeti ile ilgili olarak; ' + escapeHtml(val('f-faaliyet-tedbir')) + '</p>' +
      '<p>' + escapeHtml(val('f-taskin').substring(0, 120)) + (val('f-taskin').length > 120 ? '…' : '') + '</p>' +
      '<p>Gereğini ' + escapeHtml(val('f-hitap')) + ' ederim.</p>';
  }

  function listHref() {
    var href = 'yazi-liste.html';
    var sunum = window.HBC_SUNUM;
    if (sunum && sunum.appendToHref) return sunum.appendToHref(href);
    return href;
  }

  function saveYazi() {
    window.location.href = listHref();
  }

  function initNav() {
    root.querySelectorAll('.yazi-step').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-step-index'), 10);
        if (i <= current || i === OZET_INDEX) goToStep(i);
      });
    });
    var back = document.getElementById('yazi-btn-back');
    var next = document.getElementById('yazi-btn-next');
    var create = document.getElementById('yazi-btn-create');
    if (back) back.addEventListener('click', function () { goToStep(current - 1); });
    if (next) next.addEventListener('click', function () { goToStep(current + 1); });
    if (create) create.addEventListener('click', function () {
      buildDocumentPreview();
      goToStep(YAZI_INDEX);
    });
    var dlWord = document.getElementById('yazi-btn-download-word');
    var dlPdf = document.getElementById('yazi-btn-download-pdf');
    if (dlWord) dlWord.addEventListener('click', function () {
      alert('Mockup: .docx indirilecek.');
    });
    if (dlPdf) dlPdf.addEventListener('click', function () {
      alert('Mockup: .pdf indirilecek.');
    });
    var save = document.getElementById('yazi-btn-save');
    if (save) save.addEventListener('click', saveYazi);
  }

  function bindTomSelectListeners() {
    root.querySelectorAll('select.mock-tom-select').forEach(function (sel) {
      function attach() {
        if (!sel.tomselect) return;
        sel.tomselect.on('change', updateStepperMeta);
        sel.tomselect.on('item_add', updateStepperMeta);
        sel.tomselect.on('item_remove', updateStepperMeta);
      }
      if (sel.tomselect) attach();
      else window.setTimeout(attach, 0);
    });
  }

  function bindFieldListeners() {
    root.addEventListener('input', updateStepperMeta);
    root.addEventListener('change', updateStepperMeta);
    bindTomSelectListeners();
  }

  function init() {
    initNav();
    bindFieldListeners();
    var hash = (location.hash || '').replace('#', '');
    if (hash === 'step-yazi' || hash === 'yazi') {
      buildDocumentPreview();
      goToStep(YAZI_INDEX);
      return;
    }
    if (hash.indexOf('step-') === 0) {
      var id = hash.replace('step-', '');
      for (var i = 0; i < STEPS.length; i++) {
        if (STEPS[i].id === id) { goToStep(i); return; }
      }
    }
    goToStep(0);
    window.setTimeout(updateStepperMeta, 0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.YAZI_WIZARD = { goToStep: goToStep, buildSummary: buildSummary, updateStepperMeta: updateStepperMeta };
})();
