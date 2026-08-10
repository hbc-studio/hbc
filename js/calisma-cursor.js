(function () {
  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function inferDurum(item) {
    if ((item.taskBe || 0) + (item.taskFe || 0) > 0) return 'task-hazir';
    if (item.mockupSayisi > 0) return 'onay-bekliyor';
    return 'mockup-taslak';
  }

  function isOrnek(item) {
    return !!(item && (item.ornek || item.ornekRapor || item.ornekTumTurler));
  }

  function findItem(id) {
    var list = window.HBC_CALISMALAR || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function buildMockupIste(item, kim, eknot) {
    var s =
      item.id + ' için mockup istiyorum.\n\n' +
      'Görünen ad: ' + item.label + '\n';
    if (item.desc) s += 'Açıklama: ' + item.desc + '\n';
    s += '\n';
    if (eknot && eknot.trim()) {
      s += eknot.trim() + '\n\n';
    } else {
      s += 'Menü yolu: …\nEkranlar: …\nAlanlar / liste sütunları: …\n\n';
    }
    s += 'Önce mockup\'ları yap, Jira task yazma.';
    return s;
  }

  function buildMockupDuzelt(item, kim, eknot, mockup, raporWidgetlari) {
    var s = item.id + ' mockup';
    if (mockup && mockup.label) s += ' — ' + mockup.label;
    if (mockup && mockup.href) s += ' (' + mockup.href + ')';
    s += ' düzeltme:\n' +
      (eknot && eknot.trim() ? eknot.trim() : '… (ne değişeceğini yazın)');
    var rw = window.HBC_RAPOR_WIDGETS;
    if (rw && raporWidgetlari && raporWidgetlari.length) {
      var block = rw.widgetsToPromptBlock(raporWidgetlari, 'Sayfaya eklenecek widget\'lar:');
      if (block) s += '\n\n' + block;
    }
    s += '\n\nHenüz Jira task yazma.';
    return s;
  }

  function isRaporMockup(mockup, item) {
    var rw = window.HBC_RAPOR_WIDGETS;
    return rw && rw.isRaporMockup ? rw.isRaporMockup(mockup, item) : false;
  }

  function buildOnayTask(item, kim) {
    var k = (kim || '').trim();
    return (
      item.id + ' mockup\'larını onaylıyorum' + (k ? ' — ' + k : '') +
      '. Yazılımcılar için Jira task metinlerini isler.html sayfasına ekle.'
    );
  }

  function buildIptalPrompt(item, kim) {
    var k = (kim || '').trim() || '…';
    return (
      item.id + ' çalışmasını iptal et. Ana listeden kaldır, calismalarim/' + item.id + '/ klasörünü silme.\n' +
      "js/calismalar-meta.js içinde durum: 'iptal' ve iptal: { tarih: '" + todayISO() + "', kim: '" + k + "' } yaz."
    );
  }

  function buildGeriAlPrompt(item, kim) {
    var onceki = inferDurum(item);
    var k = (kim || '').trim();
    var s = item.id + ' çalışmasının iptalini kaldır.';
    if (k) s += ' Geri alan: ' + k + '.';
    s += "\njs/calismalar-meta.js içinde durum: '" + onceki + "' yap ve iptal alanını kaldır.";
    return s;
  }

  var ACTIONS = {
    'mockup-iste': {
      title: 'Mockup iste',
      hint: function (item) {
        return '<strong>' + item.label + '</strong> için ekran tarifini Cursor\'a iletin. İsterseniz aşağıdaki kutuya menü ve alanları yazın; metne eklenir. Cursor mockup üretir ve durumu <strong>Onay bekliyor</strong> yapar.';
      },
      kim: false,
      eknot: true,
      eknotLabel: 'Ekranlar, menü, alanlar (isteğe bağlı)',
      eknotHint: 'Yazarsanız placeholder yerine bu metin Cursor isteğine eklenir.',
      eknotPlaceholder: 'Örn. Liste + form; menü: Modül › Kayıtlar; sütunlar: ad, kod…',
      build: buildMockupIste
    },
    'mockup-duzelt': {
      title: 'Mockup düzelt',
      hint: function (item, mockup) {
        var t = mockup && mockup.label ? '<strong>' + mockup.label + '</strong> mockup' : 'Seçilen mockup';
        return t + ' için neyin değişmesi gerektiğini yazın. Cursor düzeltir; henüz Jira task istemeyin.';
      },
      kim: false,
      eknot: true,
      eknotLabel: 'Düzeltme notu',
      eknotHint: 'Yazdığınız not Cursor metninin ana gövdesi olur.',
      eknotPlaceholder: 'Örn. musluk formunda tesis seçimi çoklu dropdown olsun',
      build: buildMockupDuzelt
    },
    'onay-task': {
      title: 'Onayla ve task yaz',
      hint: function (item) {
        return '<strong>' + item.label + '</strong> mockup\'ları onaylandı. Bu metinle Cursor <strong>isler.html</strong> task kutularını yazar; durum <strong>Task hazır</strong> olur.';
      },
      kim: true,
      kimLabel: 'Onaylayan (isteğe bağlı)',
      kimHint: 'Yazarsanız metinde «onaylıyorum — İsim» görünür.',
      eknot: false,
      build: buildOnayTask
    },
    iptal: {
      title: 'Çalışmayı iptal et',
      hint: function (item) {
        return 'HBC tarayıcıdan meta dosyasını değiştiremez. <strong>' + item.label + '</strong> ana listeden kalkar; klasör silinmez. Yalnızca <strong>İptal</strong> filtresinde kalır.';
      },
      kim: true,
      kimLabel: 'İptal eden (isteğe bağlı)',
      kimHint: 'Yazarsanız meta kaydındaki iptal.kim alanına yazılacak şekilde metne eklenir.',
      eknot: false,
      build: buildIptalPrompt
    },
    'geri-al': {
      title: 'İptali geri al',
      hint: function (item) {
        return '<strong>' + item.label + '</strong> yeniden ana listeye alınır. Cursor <code>calismalar-meta.js</code> içinde iptali kaldırır. İsim alanı isteğe bağlıdır; yazarsanız metne eklenir.';
      },
      kim: true,
      kimLabel: 'Geri alan (isteğe bağlı)',
      kimHint: 'Yazarsanız Cursor metninde «Geri alan: …» satırı oluşur.',
      eknot: false,
      build: buildGeriAlPrompt
    }
  };

  var OZET_BUTTONS = {
    'mockup-taslak': [
      { href: 'ekranlar.html#yeni-ekran', label: 'Ekranlar — yeni ekran…', cls: 'primary' },
      { mode: 'iptal', label: 'İptal et…', cls: 'iptal' }
    ],
    'onay-bekliyor': [
      { href: 'ekranlar.html#yeni-ekran', label: '+ Yeni ekran…', cls: 'primary' },
      { mode: 'onay-task', label: 'Onayla, task yaz…', cls: '' },
      { mode: 'iptal', label: 'İptal et…', cls: 'iptal' }
    ],
    'task-hazir': [
      { mode: 'iptal', label: 'İptal et…', cls: 'iptal' }
    ],
    iptal: [
      { mode: 'geri-al', label: 'Listeye geri al…', cls: 'geri' }
    ]
  };

  var state = { mode: 'iptal', item: null, mockup: null, raporWidgetlari: [] };

  function ensureModal() {
    var existing = document.getElementById('calisma-cursor-modal');
    if (existing && !document.getElementById('calisma-cursor-restore-mini')) {
      existing.remove();
      existing = null;
    }
    if (existing) return;

    var html =
      '<div class="hbc-dialog-backdrop" id="calisma-cursor-modal" hidden>' +
      '  <div class="modal-card modal-card--cursor" role="dialog" aria-labelledby="calisma-cursor-title" aria-modal="true">' +
      '    <div class="modal-card__head">' +
      '      <h3 id="calisma-cursor-title"></h3>' +
      '      <div class="modal-card__head-actions">' +
      '        <button type="button" class="modal-icon-btn" id="calisma-cursor-minimize" title="Aşağı indir" aria-label="Dialogu aşağı indir">−</button>' +
      '      </div>' +
      '    </div>' +
      '    <div class="modal-card__body" id="calisma-cursor-body">' +
      '    <p class="modal-hint" id="calisma-cursor-hint"></p>' +
      '    <label class="modal-field modal-field--hidden" id="calisma-cursor-kim-wrap">' +
      '      <span id="calisma-cursor-kim-label">İsim</span>' +
      '      <input type="text" id="calisma-cursor-kim" placeholder="Örn. Hazal" autocomplete="off" />' +
      '      <small id="calisma-cursor-kim-hint"></small>' +
      '    </label>' +
      '    <label class="modal-field modal-field--hidden" id="calisma-cursor-eknot-wrap">' +
      '      <span id="calisma-cursor-eknot-label">Not</span>' +
      '      <textarea id="calisma-cursor-eknot" rows="3" placeholder=""></textarea>' +
      '      <small id="calisma-cursor-eknot-hint"></small>' +
      '    </label>' +
      '    <div class="modal-field modal-field--hidden" id="calisma-cursor-rapor-wrap">' +
      '      <span class="modal-field-label-block">Rapor widget\'ları</span>' +
      '      <p class="modal-hint modal-hint--tight">Mevcut rapora eklenecek bileşenleri tanımlayın. Cursor mockup\'a yeni widget ekler.</p>' +
      '      <div id="calisma-cursor-widget-list" class="wizard-alan-list"></div>' +
      '      <button type="button" class="wizard-alan-add" id="calisma-cursor-widget-add">+ Widget ekle</button>' +
      '    </div>' +
      '    <p class="modal-step-label">Cursor sohbetine yapıştırılacak metin</p>' +
      '    <pre class="prompt-box modal-prompt" id="calisma-cursor-prompt"></pre>' +
      '    <p class="modal-ok" id="calisma-cursor-copied" hidden>Panoya kopyalandı. Cursor sohbetine <strong>Ctrl+V</strong> ile yapıştırın.</p>' +
      '    <p class="modal-error" id="calisma-cursor-copy-err" hidden>Kopyalanamadı — metni elle seçip kopyalayın.</p>' +
      '    <div class="modal-actions">' +
      '      <button type="button" class="modal-btn" id="calisma-cursor-close">Kapat</button>' +
      '      <button type="button" class="modal-btn modal-btn-primary" id="calisma-cursor-copy">Panoya kopyala</button>' +
      '    </div>' +
      '    </div>' +
      '    <div class="modal-card__minibar" id="calisma-cursor-minibar">' +
      '      <button type="button" class="modal-btn modal-btn-restore" id="calisma-cursor-restore-mini">Yeniden aç</button>' +
      '      <div class="modal-minibar-actions">' +
      '        <button type="button" class="modal-btn" id="calisma-cursor-close-mini">Kapat</button>' +
      '        <button type="button" class="modal-btn modal-btn-primary" id="calisma-cursor-copy-mini">Panoya kopyala</button>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('calisma-cursor-close').addEventListener('click', closeModal);
    document.getElementById('calisma-cursor-copy').addEventListener('click', copyPrompt);
    document.getElementById('calisma-cursor-close-mini').addEventListener('click', closeModal);
    document.getElementById('calisma-cursor-copy-mini').addEventListener('click', copyPrompt);
    document.getElementById('calisma-cursor-minimize').addEventListener('click', minimizeModal);
    document.getElementById('calisma-cursor-restore-mini').addEventListener('click', restoreModal);
    document.getElementById('calisma-cursor-title').addEventListener('click', function () {
      if (document.querySelector('.modal-card--minimized')) restoreModal();
    });
    document.getElementById('calisma-cursor-kim').addEventListener('input', refreshPromptText);
    document.getElementById('calisma-cursor-eknot').addEventListener('input', refreshPromptText);
    document.getElementById('calisma-cursor-widget-add').addEventListener('click', addRaporWidgetRow);
  }

  function saveRaporWidgetsFromDom() {
    var rw = window.HBC_RAPOR_WIDGETS;
    if (!rw) return;
    var rows = document.querySelectorAll('#calisma-cursor-widget-list .wizard-widget-row');
    var list = [];
    rows.forEach(function (row, i) {
      var prev = state.raporWidgetlari[i] || rw.defaultWidget('ozet');
      var tur = row.querySelector('.wizard-widget-tur');
      var baslik = row.querySelector('.wizard-widget-baslik');
      var detay = row.querySelector('.wizard-widget-detay');
      var w = rw.defaultWidget(tur ? tur.value : prev.tur);
      w.baslik = baslik ? baslik.value.trim() : '';
      w.tur = tur ? tur.value : prev.tur;
      if (detay && detay.value.trim()) w.detayNot = detay.value.trim();
      if (rw.normalizeHaritaWidget) rw.normalizeHaritaWidget(w);
      list.push(w);
    });
    state.raporWidgetlari = list;
  }

  function renderRaporWidgetList() {
    var listEl = document.getElementById('calisma-cursor-widget-list');
    var rw = window.HBC_RAPOR_WIDGETS;
    if (!listEl || !rw) return;
    var rows = state.raporWidgetlari;
    if (rw.normalizeHaritaWidget) {
      for (var r = 0; r < rows.length; r++) rw.normalizeHaritaWidget(rows[r]);
    }
    var h = '';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="wizard-alan-row wizard-widget-row wizard-widget-row--cursor" data-idx="' + i + '">';
      h += '<select class="wizard-widget-tur">' + rw.widgetSelectOptions(rows[i].tur) + '</select>';
      h += '<input type="text" class="wizard-widget-baslik" placeholder="Widget başlığı" value="' + (rows[i].baslik || '').replace(/"/g, '&quot;') + '" />';
      h += '<button type="button" class="wizard-alan-remove calisma-widget-remove" title="Kaldır">×</button>';
      h += '<textarea class="wizard-widget-detay" rows="2" placeholder="Kısa detay (X/Y ekseni, sütunlar, KPI metinleri…)">' + (rows[i].detayNot || '').replace(/</g, '&lt;') + '</textarea>';
      h += '</div>';
    }
    listEl.innerHTML = h;
    listEl.querySelectorAll('.calisma-widget-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveRaporWidgetsFromDom();
        var row = btn.closest('.wizard-widget-row');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        state.raporWidgetlari.splice(idx, 1);
        renderRaporWidgetList();
        refreshPromptText();
      });
    });
    listEl.querySelectorAll('.wizard-widget-tur, .wizard-widget-baslik, .wizard-widget-detay').forEach(function (el) {
      el.addEventListener('input', function () { saveRaporWidgetsFromDom(); refreshPromptText(); });
      el.addEventListener('change', function () { saveRaporWidgetsFromDom(); refreshPromptText(); });
    });
  }

  function addRaporWidgetRow() {
    var rw = window.HBC_RAPOR_WIDGETS;
    if (!rw) return;
    saveRaporWidgetsFromDom();
    state.raporWidgetlari.push(rw.defaultWidget('bar'));
    renderRaporWidgetList();
    refreshPromptText();
  }

  function refreshPromptText() {
    if (!state.item || !state.mode) return;
    var action = ACTIONS[state.mode];
    if (!action) return;
    var kim = document.getElementById('calisma-cursor-kim');
    var eknot = document.getElementById('calisma-cursor-eknot');
    document.getElementById('calisma-cursor-prompt').textContent = action.build(
      state.item,
      kim ? kim.value : '',
      eknot ? eknot.value : '',
      state.mockup,
      state.raporWidgetlari
    );
    document.getElementById('calisma-cursor-copied').hidden = true;
    document.getElementById('calisma-cursor-copy-err').hidden = true;
  }

  function copyPrompt() {
    var text = document.getElementById('calisma-cursor-prompt').textContent;
    var ok = document.getElementById('calisma-cursor-copied');
    var err = document.getElementById('calisma-cursor-copy-err');
    ok.hidden = true;
    err.hidden = true;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { ok.hidden = false; }).catch(function () { err.hidden = false; });
    } else {
      err.hidden = false;
    }
  }

  function getModalNodes() {
    var modal = document.getElementById('calisma-cursor-modal');
    if (!modal) return {};
    return {
      modal: modal,
      card: modal.querySelector('.modal-card')
    };
  }

  function setModalLayout(mode) {
    var nodes = getModalNodes();
    if (!nodes.modal || !nodes.card) return;
    var dock = mode === 'mockup-duzelt';
    nodes.modal.classList.toggle('hbc-dialog-backdrop--dock', dock);
    nodes.card.classList.toggle('modal-card--dock', dock);
  }

  function minimizeModal() {
    var nodes = getModalNodes();
    if (!nodes.modal || !nodes.card) return;
    nodes.modal.classList.add('hbc-dialog-backdrop--minimized');
    nodes.card.classList.add('modal-card--minimized');
  }

  function restoreModal() {
    var nodes = getModalNodes();
    if (!nodes.modal || !nodes.card) return;
    nodes.modal.classList.remove('hbc-dialog-backdrop--minimized');
    nodes.card.classList.remove('modal-card--minimized');
  }

  function closeModal() {
    var nodes = getModalNodes();
    if (!nodes.modal) return;
    nodes.modal.hidden = true;
    restoreModal();
  }

  function setFieldWrap(wrap, visible, labelEl, labelText, hintEl, hintText, inputEl, placeholder) {
    if (!wrap) return;
    wrap.classList.toggle('modal-field--hidden', !visible);
    if (!visible) {
      if (inputEl) inputEl.value = '';
      return;
    }
    if (labelEl && labelText) labelEl.textContent = labelText;
    if (hintEl) {
      if (hintText) {
        hintEl.textContent = hintText;
        hintEl.hidden = false;
      } else {
        hintEl.textContent = '';
        hintEl.hidden = true;
      }
    }
    if (inputEl && placeholder !== undefined) inputEl.placeholder = placeholder || '';
    if (inputEl && inputEl.tagName === 'INPUT') inputEl.value = '';
    if (inputEl && inputEl.tagName === 'TEXTAREA') inputEl.value = '';
  }

  function openModal(item, mode, mockup) {
    var action = ACTIONS[mode];
    if (!item || !action) return;

    ensureModal();
    state.item = item;
    state.mode = mode;
    state.mockup = mockup || null;
    state.raporWidgetlari = [];

    var raporWrap = document.getElementById('calisma-cursor-rapor-wrap');
    var showRapor = mode === 'mockup-duzelt' && isRaporMockup(state.mockup, item);
    if (raporWrap) {
      raporWrap.classList.toggle('modal-field--hidden', !showRapor);
      if (showRapor) renderRaporWidgetList();
    }

    document.getElementById('calisma-cursor-title').textContent = action.title;
    document.getElementById('calisma-cursor-hint').innerHTML =
      typeof action.hint === 'function' ? action.hint(item, state.mockup) : action.hint;

    var kimWrap = document.getElementById('calisma-cursor-kim-wrap');
    var kim = document.getElementById('calisma-cursor-kim');
    setFieldWrap(
      kimWrap,
      !!action.kim,
      document.getElementById('calisma-cursor-kim-label'),
      action.kim ? (action.kimLabel || 'İsim (isteğe bağlı)') : '',
      document.getElementById('calisma-cursor-kim-hint'),
      action.kim ? (action.kimHint || 'Yazdığınız isim aşağıdaki metne eklenir.') : '',
      kim
    );

    var eknotWrap = document.getElementById('calisma-cursor-eknot-wrap');
    var eknot = document.getElementById('calisma-cursor-eknot');
    setFieldWrap(
      eknotWrap,
      !!action.eknot,
      document.getElementById('calisma-cursor-eknot-label'),
      action.eknot ? (action.eknotLabel || 'Not') : '',
      document.getElementById('calisma-cursor-eknot-hint'),
      action.eknot ? (action.eknotHint || 'Yazdığınız not aşağıdaki metne eklenir.') : '',
      eknot,
      action.eknotPlaceholder || ''
    );

    refreshPromptText();
    document.getElementById('calisma-cursor-copied').hidden = true;
    document.getElementById('calisma-cursor-copy-err').hidden = true;
    restoreModal();
    setModalLayout(mode);
    document.getElementById('calisma-cursor-modal').hidden = false;
  }

  function actionBtnHtml(item, spec) {
    var cls = 'calisma-action-btn';
    if (spec.cls === 'primary') cls += ' calisma-action-btn--primary';
    if (spec.cls === 'iptal') cls += ' calisma-action-btn--iptal';
    if (spec.cls === 'geri') cls += ' calisma-action-btn--geri';
    if (spec.href) {
      return '<a class="' + cls + '" href="' + spec.href + '">' + spec.label + '</a>';
    }
    return '<button type="button" class="' + cls + '" data-calisma-cursor="' + spec.mode + '" data-id="' + item.id + '">' + spec.label + '</button>';
  }

  function injectOzetActions(item) {
    if (!item || document.getElementById('calisma-actions')) return;
    var bar = document.getElementById('calisma-durum-bar');
    if (!bar) return;

    var html = '<div class="calisma-actions" id="calisma-actions">';
    if (isOrnek(item)) {
      html += '<p class="calisma-actions-note">Örnek çalışma — referans için kalır. Cursor cümle örnekleri: <a href="../../module-creator/is-analisti.html#cursor-promptlar">Başlangıç rehberi</a>.</p>';
    } else {
      var d = item.durum || 'mockup-taslak';
      var specs = OZET_BUTTONS[d] || OZET_BUTTONS['mockup-taslak'];
      if (d === 'iptal') {
        html += '<p class="calisma-actions-note">İptal edildi; dosyalar duruyor. Ana listede yalnızca <strong>İptal</strong> filtresinde görünür.</p>';
      } else if (d === 'mockup-taslak') {
        html += '<p class="calisma-actions-note">Yeni mockup için <strong>Ekranlar</strong> sayfasında <strong>+ Yeni ekran</strong> sihirbazını kullanın.</p>';
      } else if (d === 'onay-bekliyor') {
        html += '<p class="calisma-actions-note">Yeni ekran için <strong>+ Yeni ekran</strong>. Mockup düzeltmek için ilgili mockup sayfasında sağ üstteki turuncu <strong>Düzenle</strong> butonunu kullanın.</p>';
      } else if (d === 'task-hazir') {
        html += '<p class="calisma-actions-note">Task metinlerini <strong>Task metinleri</strong> sayfasında güncelleyin (her kutuda <strong>Düzenle</strong>). İptal için aşağıdaki butonu kullanın.</p>';
      } else {
        html += '<p class="calisma-actions-note">Cursor\'a yazmak için bir aksiyon seçin — metin dialogda hazırlanır, <strong>Panoya kopyala</strong> ile yapıştırın.</p>';
      }
      html += '<div class="calisma-actions-btns">';
      for (var i = 0; i < specs.length; i++) {
        html += actionBtnHtml(item, specs[i]);
      }
      html += '</div>';
    }
    html += '</div>';
    bar.insertAdjacentHTML('afterend', html);

    document.getElementById('calisma-actions').addEventListener('click', function (e) {
      var btn = e.target.closest('[data-calisma-cursor]');
      if (!btn) return;
      var it = findItem(btn.getAttribute('data-id'));
      if (it) openModal(it, btn.getAttribute('data-calisma-cursor'));
    });
  }

  function initOzetPage() {
    var cfg = window.TASK_HUB;
    if (!cfg || !cfg.calisma || !cfg.calisma.id) return;
    var item = findItem(cfg.calisma.id);
    if (item) injectOzetActions(item);
  }

  function open(opts) {
    var id = opts && opts.id;
    var mode = (opts && opts.mode) || 'iptal';
    var mockup = opts && opts.mockup;
    var item = (opts && opts.item) || (id ? findItem(id) : null);
    if (item) openModal(item, mode, mockup);
  }

  window.TASK_CURSOR = {
    open: open,
    ACTIONS: ACTIONS,
    buildMockupDuzelt: buildMockupDuzelt,
    buildMockupIste: buildMockupIste,
    buildOnayTask: buildOnayTask,
    buildIptalPrompt: buildIptalPrompt,
    buildGeriAlPrompt: buildGeriAlPrompt
  };
  window.TASK_IPTAL = window.TASK_CURSOR;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOzetPage);
  } else {
    initOzetPage();
  }
})();
