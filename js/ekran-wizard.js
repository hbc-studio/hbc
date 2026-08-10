(function () {
  var ALAN_TURLERI = [
    { id: 'metin', label: 'Metin' },
    { id: 'uzun-metin', label: 'Uzun metin' },
    { id: 'sayi', label: 'Sayı' },
    { id: 'tarih', label: 'Tarih' },
    { id: 'dropdown', label: 'Dropdown (tekli seçim)' },
    { id: 'coklu-secim', label: 'Dropdown (çoklu seçim)' },
    { id: 'checkbox', label: 'Checkbox' },
    { id: 'evet-hayir', label: 'Evet / Hayır' }
  ];

  var CHECKBOX_ALAN_HINT = 'Checkbox seçenekleri birden fazla olacaksa virgülle ayırarak yazabilirsiniz.';

  var TURLER = [
    { id: 'liste', label: 'Liste', desc: 'Tablo + isteğe bağlı kayıt formu' },
    { id: 'form', label: 'Form', desc: 'Tekil form — liste yok' },
    { id: 'rapor', label: 'Dashboard / Rapor', desc: 'Filtre, KPI, grafik, harita, tablo — liste/form yok' },
    { id: 'serbest', label: 'Emin değilim', desc: 'Serbest yazmak istiyorum' }
  ];

  var LISTE_STEPS = ['tur', 'menu', 'baslik', 'sutunlar', 'ozellikler', 'form-baglantisi', 'sonuc'];
  var FORM_STEPS = ['tur', 'menu', 'form-bilgi', 'form-alanlari', 'gonder-buton', 'sonuc'];
  var RAPOR_STEPS = ['tur', 'rapor-menu-bilgi', 'veri-kaynak', 'rapor-filtreler', 'rapor-aksiyonlar', 'rapor-widgetlar', 'rapor-widget-detay', 'sonuc'];
  var SERBEST_STEPS = ['tur', 'serbest-metin', 'sonuc'];

  var STEP_LABELS = {
    tur: 'Ekran türü',
    menu: 'Menü yolu',
    baslik: 'Sayfa bilgisi',
    sutunlar: 'Liste sütunları',
    ozellikler: 'Liste özellikleri',
    'form-baglantisi': 'Form bağlantısı',
    'form-bilgi': 'Form bilgisi',
    'form-alanlari': 'Form alanları',
    'gonder-buton': 'Gönder butonu',
    'rapor-menu-bilgi': 'Menü ve rapor adı',
    'veri-kaynak': 'Veri kaynağı',
    'rapor-filtreler': 'Filtreler',
    'rapor-aksiyonlar': 'Üst aksiyonlar',
    'rapor-widgetlar': 'Widget listesi',
    'rapor-widget-detay': 'Widget detayları',
    'serbest-metin': 'Serbest tarif',
    sonuc: 'Cursor metni'
  };

  var state = {
    calisma: null,
    tur: null,
    stepIdx: 0,
    maxReachedIdx: 0,
    steps: [],
    data: {
      menu: '',
      baslik: '',
      model: '',
      sutunlar: '',
      sayfalama: 'hayir',
      filtre: 'hayir',
      siralama: 'hayir',
      ekleButonu: 'evet',
      formBaglantisi: false,
      formAlanlari: [],
      formAdi: '',
      gonderButonu: 'Gönder',
      raporAdi: '',
      veriKaynagi: '',
      raporFiltreleri: [],
      excelAktar: 'evet',
      raporWidgetlari: [],
      serbest: ''
    }
  };

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function menuYerOf(c) {
    return (c && c.menuYer === 'ust') ? 'ust' : 'sol';
  }

  function menuYerAciklama(c) {
    return menuYerOf(c) === 'ust' ? 'üst' : 'sol';
  }

  function ilkMockupKabukLines(c) {
    var lines = [];
    if (menuYerOf(c) === 'ust') {
      lines.push('Uygulama menüsü: üst — .mock-app-shell.mock-app-shell--menu-ust');
      lines.push('Üst menüde grup/alt menü: Bootstrap 5 dropdown (.dropdown.mock-menu-dropdown + data-bs-toggle="dropdown" + ul.dropdown-menu.mock-menu-dropdown-menu); collapse kullanma.');
    } else {
      lines.push('Uygulama menüsü: sol — .mock-app-shell + .mock-app-menu');
      lines.push('Sol menüde grup/alt menü: Bootstrap 5 collapse (button.mock-menu-toggle + data-bs-toggle="collapse" + div.collapse.mock-menu-collapse).');
    }
    lines.push('<details> veya statik .menu-group yasak.');
    lines.push('bootstrap.bundle.min.js zorunlu: ../../../assets/bootstrap-5.0.2-dist/js/bootstrap.bundle.min.js (mockup/ içinden; repo kökü assets — çalışma klasörüne kopyalanmaz)');
    lines.push('Bu çalışmadaki ilk mockup — mock-shell, menü ve Sunum iskeletini kur.');
    return lines;
  }

  function alanTurLabel(id) {
    for (var i = 0; i < ALAN_TURLERI.length; i++) {
      if (ALAN_TURLERI[i].id === id) return ALAN_TURLERI[i].label;
    }
    return id;
  }

  function alanTurPromptLabel(tur) {
    if (tur === 'evet-hayir') return 'Evet / Hayır — radio buton';
    return alanTurLabel(tur);
  }

  function buildListePrompt() {
    var c = state.calisma;
    var d = state.data;
    var ilk = !c.mockups || !c.mockups.length;
    var lines = [];
    lines.push(c.id + ' için yeni liste ekranı mockup istiyorum.');
    lines.push('');
    lines.push('Menü yolu: ' + d.menu);
    lines.push('Sayfa başlığı: ' + d.baslik);
    lines.push('Model: ' + d.model);
    lines.push('Liste sütunları: ' + d.sutunlar);
    lines.push('Sayfalandırma örneği: ' + (d.sayfalama === 'evet' ? 'evet' : 'hayır'));
    lines.push('Kolonlarda filtreleme: ' + (d.filtre === 'evet' ? 'evet' : 'hayır'));
    lines.push('Kolonlarda sıralama: ' + (d.siralama === 'evet' ? 'evet' : 'hayır'));
    lines.push('Liste üzerinde + Yeni / ekleme butonu: ' + (d.ekleButonu === 'evet' ? 'evet' : 'hayır'));
    if (d.formBaglantisi && d.formAlanlari.length) {
      lines.push('');
      lines.push('Aynı istekte ilişkili form mockup da oluştur:');
      for (var i = 0; i < d.formAlanlari.length; i++) {
        var a = d.formAlanlari[i];
        if (a.ad) lines.push('- ' + a.ad + ' (' + alanTurPromptLabel(a.tur) + ')');
      }
      lines.push('Liste ile form arasında Yeni / Düzenle / Listeye dön linkleri olsun.');
    } else if (d.formBaglantisi) {
      lines.push('');
      lines.push('Form mockup da oluştur; liste ile Yeni / Düzenle / Listeye dön linkleri olsun.');
    }
    if (ilk) {
      lines.push('');
      lines.push.apply(lines, ilkMockupKabukLines(c));
    } else {
      lines.push('');
      lines.push('Mevcut mockup menüsüne bu ekranı ekle (menü yapısı Bootstrap collapse kalsın; <details> veya .menu-group ekleme).');
    }
    lines.push('');
    lines.push('Önce mockup yap, Jira task yazma.');
    return lines.join('\n');
  }

  function buildFormPrompt() {
    var c = state.calisma;
    var d = state.data;
    var ilk = !c.mockups || !c.mockups.length;
    var lines = [];
    lines.push(c.id + ' için tekil form ekranı mockup istiyorum (liste yok — iletişim/başvuru formu gibi).');
    lines.push('');
    lines.push('Menü yolu: ' + d.menu);
    lines.push('Form adı: ' + d.formAdi);
    lines.push('Alanlar:');
    for (var i = 0; i < d.formAlanlari.length; i++) {
      var a = d.formAlanlari[i];
      if (a.ad) lines.push('- ' + a.ad + ' (' + alanTurPromptLabel(a.tur) + ')');
    }
    lines.push('Gönder butonu metni: ' + d.gonderButonu);
    lines.push('');
    lines.push('Liste bağlantısı veya «Listeye dön» olmasın; yalnızca form kartı ve gönder butonu.');
    lines.push('Menüden bu forma doğrudan girilsin.');
    if (ilk) {
      lines.push('');
      lines.push.apply(lines, ilkMockupKabukLines(c));
    } else {
      lines.push('');
      lines.push('Mevcut mockup menüsüne bu ekranı ekle (menü yapısı Bootstrap collapse kalsın; <details> veya .menu-group ekleme).');
    }
    lines.push('');
    lines.push('Önce mockup yap, Jira task yazma.');
    return lines.join('\n');
  }

  function rw() {
    return window.HBC_RAPOR_WIDGETS || {};
  }

  function buildRaporPrompt() {
    var c = state.calisma;
    var d = state.data;
    var ilk = !c.mockups || !c.mockups.length;
    var lines = [];
    lines.push(c.id + ' için dashboard/rapor mockup istiyorum (salt okunur — form, liste ve + Yeni yok).');
    lines.push('');
    lines.push('Menü yolu: ' + d.menu);
    lines.push('Rapor adı: ' + d.raporAdi);
    lines.push('Veri kaynağı: ' + d.veriKaynagi);
    if (d.raporFiltreleri.length) {
      lines.push('Filtreler:');
      for (var f = 0; f < d.raporFiltreleri.length; f++) {
        var fl = d.raporFiltreleri[f];
        if (fl.ad) lines.push('- ' + fl.ad + ' (' + rw().filtreTurPromptLabel(fl.tur) + ')');
      }
    } else {
      lines.push('Filtreler: yok');
    }
    lines.push('Üst butonlar: Raporla' + (d.excelAktar === 'evet' ? ", Excel'e aktar" : ''));
    lines.push('');
    var wBlock = rw().widgetsToPromptBlock(d.raporWidgetlari);
    if (wBlock) lines.push(wBlock);
    lines.push('');
    lines.push('Grafikler (Bar, Pie, Line): Chart.js (CDN) + canvas; örnek veri js/mock-report-charts.js ile.');
    lines.push('Grafik sarmalayıcı .mock-report-chart varsayılan genişlik %50; tam genişlik için .mock-report-chart--full.');
    lines.push('Rapor içerik: .mock-content--report arka planı; KPI, harita, grafik ve tablo her biri .mock-report-widget kartı içinde (KPI satırı: .mock-report-widget--kpis).');
    if (rw().hasHaritaWidget(d.raporWidgetlari)) {
      lines.push('');
      lines.push(rw().haritaAssetsSetupPrompt(c.id, d.raporWidgetlari));
      lines.push('Harita widget: js/mock-geo-map.js + MOCK_GEO_MAP.init({ templateId, legendScale }). Türkiye → kapsam turkiye. İl (ör. Ankara) → kapsam ankara. İl / ilçe adları görünür. Sol alt lejant zorunlu. Sarmalayıcı .mock-report-chart--map (her zaman tam genişlik).');
    }
    lines.push('İl filtresi: tür «İl (çoklu seçim)» — toolbar\'da <select multiple class="form-select mock-tom-select">; Bootstrap 5 (repo kökü assets/bootstrap-5.0.2-dist) + Tom Select. mock-bootstrap.css + mock-tom-select.js.');
    lines.push('İlişki/akış özeti (kaynak→tesis gibi, coğrafi değil) ayrı ekran kalabilir — kaynaktan_musluga dashboard mockup referans.');
    lines.push('KPI kartları ve özet tablo HTML; sunum modunda .mock-content kaydırılabilir (mock-shell.css).');
    if (ilk) {
      lines.push('');
      lines.push.apply(lines, ilkMockupKabukLines(c));
    } else {
      lines.push('');
      lines.push('Mevcut mockup menüsüne bu ekranı ekle (menü yapısı Bootstrap collapse kalsın; <details> veya .menu-group ekleme).');
    }
    lines.push('');
    lines.push('Önce mockup yap, Jira task yazma.');
    return lines.join('\n');
  }

  function buildSerbestPrompt() {
    var c = state.calisma;
    var ilk = !c.mockups || !c.mockups.length;
    var s = c.id + ' için yeni ekran mockup istiyorum.\n\n' + state.data.serbest.trim();
    if (ilk) s += '\n\n' + ilkMockupKabukLines(c).join('\n');
    s += '\n\nÖnce mockup yap, Jira task yazma.';
    return s;
  }

  function getPrompt() {
    if (state.tur === 'liste') return buildListePrompt();
    if (state.tur === 'form') return buildFormPrompt();
    if (state.tur === 'rapor') return buildRaporPrompt();
    if (state.tur === 'serbest') return buildSerbestPrompt();
    return '';
  }

  function ensureModal() {
    var existing = document.getElementById('ekran-wizard-modal');
    if (existing) {
      if (existing.classList.contains('hbc-dialog-backdrop') &&
          document.getElementById('ekran-wizard-nav') &&
          document.getElementById('ekran-wizard-close')) {
        return;
      }
      existing.remove();
    }
    var html =
      '<div class="hbc-dialog-backdrop" id="ekran-wizard-modal" hidden>' +
      '  <div class="modal-card modal-card--wizard" role="dialog" aria-labelledby="ekran-wizard-title">' +
      '    <div class="wizard-shell">' +
      '      <nav class="wizard-nav" id="ekran-wizard-nav" aria-label="Sihirbaz adımları"></nav>' +
      '      <div class="wizard-main">' +
      '        <div class="wizard-head">' +
      '          <div class="wizard-head-text">' +
      '            <h3 id="ekran-wizard-title">Yeni ekran</h3>' +
      '            <p class="wizard-step-label" id="ekran-wizard-step-label"></p>' +
      '          </div>' +
      '          <button type="button" class="wizard-close" id="ekran-wizard-close" title="Kapat" aria-label="Kapat">×</button>' +
      '        </div>' +
      '        <div class="wizard-body" id="ekran-wizard-body"></div>' +
      '        <p class="modal-error" id="ekran-wizard-error" hidden></p>' +
      '        <p class="modal-ok" id="ekran-wizard-copied" hidden>Panoya kopyalandı. Cursor sohbetine <strong>Ctrl+V</strong> ile yapıştırın.</p>' +
      '        <div class="wizard-footer modal-actions">' +
      '          <button type="button" class="modal-btn" id="ekran-wizard-back">Geri</button>' +
      '          <button type="button" class="modal-btn modal-btn-primary" id="ekran-wizard-next">İleri</button>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('ekran-wizard-back').addEventListener('click', goBack);
    document.getElementById('ekran-wizard-next').addEventListener('click', goNext);
    document.getElementById('ekran-wizard-close').addEventListener('click', close);
  }

  function showError(msg) {
    var el = document.getElementById('ekran-wizard-error');
    el.textContent = msg;
    el.hidden = !msg;
  }

  function turCardsHtml() {
    var h = '<div class="wizard-tur-grid">';
    for (var i = 0; i < TURLER.length; i++) {
      var t = TURLER[i];
      h += '<button type="button" class="wizard-tur-card" data-tur="' + t.id + '">';
      h += '<strong>' + esc(t.label) + '</strong></button>';
    }
    h += '</div>';
    h += '<ul class="wizard-tur-desc-list">';
    for (var j = 0; j < TURLER.length; j++) {
      var item = TURLER[j];
      h += '<li><strong>' + esc(item.label) + '</strong> — ' + esc(item.desc) + '</li>';
    }
    h += '</ul>';
    return h;
  }

  function radioGroup(name, label, value) {
    var h = '<fieldset class="wizard-fieldset"><legend>' + esc(label) + '</legend>';
    h += '<label class="wizard-radio"><input type="radio" name="' + name + '" value="evet"' + (value === 'evet' ? ' checked' : '') + ' /> Evet</label>';
    h += '<label class="wizard-radio"><input type="radio" name="' + name + '" value="hayir"' + (value !== 'evet' ? ' checked' : '') + ' /> Hayır</label>';
    h += '</fieldset>';
    return h;
  }

  function alanSelectOptions(selected) {
    var h = '';
    for (var i = 0; i < ALAN_TURLERI.length; i++) {
      var a = ALAN_TURLERI[i];
      h += '<option value="' + a.id + '"' + (selected === a.id ? ' selected' : '') + '>' + esc(a.label) + '</option>';
    }
    return h;
  }

  function formAlanlariHtml() {
    var rows = state.data.formAlanlari;
    if (!rows.length) rows = [{ ad: '', tur: 'metin' }];
    var h = '<div class="wizard-alan-list" id="wizard-alan-list">';
    for (var i = 0; i < rows.length; i++) {
      var isCheckbox = rows[i].tur === 'checkbox';
      h += '<div class="wizard-alan-row" data-idx="' + i + '">';
      h += '<div class="wizard-alan-ad-wrap">';
      h += '<input type="text" class="wizard-alan-ad" placeholder="Alan adı" value="' + esc(rows[i].ad) + '" />';
      h += '<small class="wizard-alan-checkbox-hint"' + (isCheckbox ? '' : ' hidden') + '>' + esc(CHECKBOX_ALAN_HINT) + '</small>';
      h += '</div>';
      h += '<select class="wizard-alan-tur">' + alanSelectOptions(rows[i].tur) + '</select>';
      h += '<button type="button" class="wizard-alan-remove" title="Kaldır">×</button></div>';
    }
    h += '</div>';
    h += '<button type="button" class="wizard-alan-add" id="wizard-alan-add">+ Alan ekle</button>';
    return h;
  }

  function updateCheckboxHints(root) {
    var el = root || document.getElementById('w-form-alan-wrap');
    if (!el) return;
    el.querySelectorAll('.wizard-alan-row').forEach(function (row) {
      var sel = row.querySelector('.wizard-alan-tur');
      var hint = row.querySelector('.wizard-alan-checkbox-hint');
      if (hint && sel) hint.hidden = sel.value !== 'checkbox';
    });
  }

  function filtreSelectOptions(selected) {
    var list = rw().RAPOR_FILTRE_TURLERI || [];
    var h = '';
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      h += '<option value="' + a.id + '"' + (selected === a.id ? ' selected' : '') + '>' + esc(a.label) + '</option>';
    }
    return h;
  }

  function raporFiltreleriHtml() {
    var rows = state.data.raporFiltreleri;
    var h = '<div class="wizard-alan-list" id="wizard-filtre-list">';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="wizard-alan-row" data-idx="' + i + '">';
      h += '<input type="text" class="wizard-alan-ad" placeholder="Filtre adı" value="' + esc(rows[i].ad) + '" />';
      h += '<select class="wizard-alan-tur">' + filtreSelectOptions(rows[i].tur) + '</select>';
      h += '<button type="button" class="wizard-alan-remove" title="Kaldır">×</button></div>';
    }
    h += '</div>';
    h += '<button type="button" class="wizard-alan-add" id="wizard-filtre-add">+ Filtre ekle</button>';
    return h;
  }

  function raporWidgetListHtml() {
    var rows = state.data.raporWidgetlari;
    if (!rows.length) rows = [rw().defaultWidget('ozet')];
    var h = '<div class="wizard-alan-list" id="wizard-widget-list">';
    for (var i = 0; i < rows.length; i++) {
      h += '<div class="wizard-alan-row wizard-widget-row" data-idx="' + i + '">';
      h += '<select class="wizard-widget-tur">' + rw().widgetSelectOptions(rows[i].tur) + '</select>';
      h += '<input type="text" class="wizard-widget-baslik" placeholder="Widget başlığı" value="' + esc(rows[i].baslik) + '" />';
      h += '<button type="button" class="wizard-alan-remove" title="Kaldır">×</button></div>';
    }
    h += '</div>';
    h += '<button type="button" class="wizard-alan-add" id="wizard-widget-add">+ Widget ekle</button>';
    return h;
  }

  function ozetKartFieldsHtml(w, idx) {
    var n = parseInt(w.kartSayisi, 10) || 3;
    if (n < 1) n = 1;
    if (n > 4) n = 4;
    var h = '<label class="modal-field"><span>Kaç KPI kartı?</span>';
    h += '<select class="wizard-ozet-kart-say" data-widx="' + idx + '">';
    for (var k = 1; k <= 4; k++) {
      h += '<option value="' + k + '"' + (n === k ? ' selected' : '') + '>' + k + '</option>';
    }
    h += '</select></label>';
    for (var j = 1; j <= n; j++) {
      h += '<div class="wizard-widget-kart-row"><input type="text" class="wizard-kart-etiket" data-widx="' + idx + '" data-kart="' + j + '" placeholder="Kart ' + j + ' etiket" value="' + esc(w['kart' + j + 'Etiket'] || '') + '" />';
      h += '<input type="text" class="wizard-kart-deger" data-widx="' + idx + '" data-kart="' + j + '" placeholder="Örnek değer" value="' + esc(w['kart' + j + 'Deger'] || '') + '" /></div>';
    }
    return h;
  }

  function haritaDetayFieldsHtml(w, i) {
    var h = '';
    h += '<label class="modal-field"><span>Ne gösterilecek? (metrik)</span><input type="text" class="wizard-w-harita-metrik" data-widx="' + i + '" value="' + esc(w.haritaMetrik) + '" placeholder="Örn. ortalama not, kayıt sayısı" /></label>';
    if (w.tur === 'harita-il') {
      h += '<p class="wizard-hint">Örnek: Ankara ilçe haritası (<code>&lt;template id="geo-map-ankara"&gt;</code> — il seçimi yok). Harita widget her zaman tam genişlik (%100).</p>';
    } else {
      h += '<p class="wizard-hint">Harita widget: <code>.mock-report-widget</code> kartı içinde; harita alanı <code>.mock-report-chart--map</code> (tam genişlik). Sol alt renk lejantı zorunlu (<code>legendScale</code>). İl haritasında ilçe adları görünür.</p>';
    }
    var ornekPh = w.tur === 'harita-il'
      ? '0:#1a5fb4, 3:#66bb6a (ilçe sıra no)'
      : '34:#1a5fb4, 06:#66bb6a, 35:#ffa726';
    h += '<label class="modal-field"><span>Örnek renkler (isteğe bağlı)</span><input type="text" class="wizard-w-harita-ornek" data-widx="' + i + '" value="' + esc(w.ornekIller) + '" placeholder="' + esc(ornekPh) + '" /></label>';
    return h;
  }

  function raporWidgetDetayHtml() {
    var rows = state.data.raporWidgetlari;
    var h = '';
    for (var i = 0; i < rows.length; i++) {
      var w = rows[i];
      if (!w.tur) continue;
      rw().normalizeHaritaWidget(w);
      h += '<div class="wizard-widget-panel" data-idx="' + i + '">';
      h += '<h4 class="wizard-widget-panel-title">' + esc(rw().widgetTurLabel(w.tur)) + (w.baslik ? ' — ' + esc(w.baslik) : '') + '</h4>';
      if (w.tur === 'ozet') {
        h += ozetKartFieldsHtml(w, i);
      } else if (w.tur === 'bar') {
        h += '<label class="modal-field"><span>X ekseni (kategori)</span><input type="text" class="wizard-w-x" data-widx="' + i + '" value="' + esc(w.xEkseni) + '" placeholder="Örn. bölge" /></label>';
        h += '<label class="modal-field"><span>Y ekseni (metrik)</span><input type="text" class="wizard-w-y" data-widx="' + i + '" value="' + esc(w.yEkseni) + '" placeholder="Örn. ortalama kalite" /></label>';
        h += '<label class="modal-field"><span>Örnek kategoriler (isteğe bağlı)</span><input type="text" class="wizard-w-ornek" data-widx="' + i + '" value="' + esc(w.ornekKategoriler) + '" placeholder="Marmara, Ege, Akdeniz" /></label>';
      } else if (w.tur === 'pie') {
        h += '<label class="modal-field"><span>Ne dağılımı?</span><input type="text" class="wizard-w-dagilim" data-widx="' + i + '" value="' + esc(w.dagilim) + '" placeholder="Örn. kaynak payı" /></label>';
        h += '<label class="modal-field"><span>Gruplama</span><input type="text" class="wizard-w-grup" data-widx="' + i + '" value="' + esc(w.gruplama) + '" placeholder="Örn. bölge" /></label>';
        h += '<label class="modal-field"><span>Örnek dilimler (isteğe bağlı)</span><input type="text" class="wizard-w-ornek" data-widx="' + i + '" value="' + esc(w.ornekDilimler) + '" /></label>';
      } else if (w.tur === 'line') {
        h += '<label class="modal-field"><span>Zaman ekseni</span><input type="text" class="wizard-w-zaman" data-widx="' + i + '" value="' + esc(w.zamanEkseni) + '" placeholder="Örn. ay" /></label>';
        h += '<label class="modal-field"><span>Metrik</span><input type="text" class="wizard-w-metrik" data-widx="' + i + '" value="' + esc(w.metrik) + '" placeholder="Örn. kayıt sayısı" /></label>';
        h += '<label class="modal-field"><span>Örnek dönemler (isteğe bağlı)</span><input type="text" class="wizard-w-ornek" data-widx="' + i + '" value="' + esc(w.ornekDonemler) + '" /></label>';
      } else if (w.tur === 'tablo') {
        h += '<label class="modal-field"><span>Sütunlar *</span><input type="text" class="wizard-w-sutun" data-widx="' + i + '" value="' + esc(w.sutunlar) + '" placeholder="bölge, adet, ortalama" /></label>';
        h += '<fieldset class="wizard-fieldset"><legend>Sayfalama örneği?</legend>';
        h += '<label class="wizard-radio"><input type="radio" name="w-sayf-' + i + '" value="evet"' + (w.sayfalama === 'evet' ? ' checked' : '') + ' /> Evet</label>';
        h += '<label class="wizard-radio"><input type="radio" name="w-sayf-' + i + '" value="hayir"' + (w.sayfalama !== 'evet' ? ' checked' : '') + ' /> Hayır</label></fieldset>';
      } else if (w.tur === 'harita-turkiye' || w.tur === 'harita-il') {
        h += haritaDetayFieldsHtml(w, i);
      }
      h += '</div>';
    }
    return h || '<p class="wizard-hint">Önce widget listesinde en az bir widget tanımlayın.</p>';
  }

  function stepLabel(stepId) {
    return STEP_LABELS[stepId] || stepId;
  }

  function renderStepNav() {
    var nav = document.getElementById('ekran-wizard-nav');
    if (!nav) return;
    if (state.steps.length <= 1) {
      nav.hidden = true;
      return;
    }
    nav.hidden = false;
    var h = '<div class="wizard-nav-title">Adımlar</div><ol class="wizard-nav-list">';
    for (var i = 0; i < state.steps.length; i++) {
      var id = state.steps[i];
      var cls = 'wizard-nav-item';
      if (i === state.stepIdx) cls += ' wizard-nav-item--active';
      else if (i <= state.maxReachedIdx) cls += ' wizard-nav-item--done';
      else cls += ' wizard-nav-item--locked';
      var canGo = i <= state.maxReachedIdx;
      h += '<li>';
      if (canGo) {
        h += '<button type="button" class="' + cls + '" data-step-idx="' + i + '">';
      } else {
        h += '<span class="' + cls + '">';
      }
      h += '<span class="wizard-nav-num">' + (i + 1) + '</span>';
      h += '<span class="wizard-nav-label">' + esc(stepLabel(id)) + '</span>';
      h += canGo ? '</button>' : '</span>';
      h += '</li>';
    }
    h += '</ol>';
    nav.innerHTML = h;
    nav.querySelectorAll('[data-step-idx]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        goToStep(parseInt(btn.getAttribute('data-step-idx'), 10));
      });
    });
  }

  function goToStep(idx) {
    if (idx === state.stepIdx || idx > state.maxReachedIdx) return;
    saveCurrentStep();
    state.stepIdx = idx;
    renderStep();
  }

  function renderStep() {
    var step = state.steps[state.stepIdx];
    var body = document.getElementById('ekran-wizard-body');
    var label = document.getElementById('ekran-wizard-step-label');
    var title = document.getElementById('ekran-wizard-title');
    var back = document.getElementById('ekran-wizard-back');
    var next = document.getElementById('ekran-wizard-next');
    var copied = document.getElementById('ekran-wizard-copied');
    copied.hidden = true;
    showError('');

    var total = state.steps.length;
    var human = state.stepIdx + 1;
    label.textContent = 'Adım ' + human + ' / ' + total;

    back.hidden = state.stepIdx === 0;
    if (step === 'sonuc') {
      title.textContent = 'Cursor metni';
      next.textContent = 'Panoya kopyala';
      next.className = 'modal-btn modal-btn-primary';
      body.innerHTML =
        '<p class="wizard-hint">Aşağıdaki metni Cursor sohbetine yapıştırın. Cursor mockup dosyasını oluşturur.</p>' +
        '<pre class="prompt-box modal-prompt" id="ekran-wizard-prompt"></pre>';
      document.getElementById('ekran-wizard-prompt').textContent = getPrompt();
      bindTurCards();
      renderStepNav();
      return;
    }

    next.textContent = 'İleri';
    next.className = 'modal-btn modal-btn-primary';

    if (step === 'tur') {
      title.textContent = 'Ekran türü';
      body.innerHTML = '<p class="wizard-hint">Oluşturmak istediğiniz ekranın türünü seçin.</p>' + turCardsHtml();
      bindTurCards();
      renderStepNav();
      return;
    }

    if (step === 'menu') {
      title.textContent = 'Menü yolu';
      body.innerHTML =
        '<label class="modal-field"><span>Menü yolu *</span>' +
        '<input type="text" id="w-menu" placeholder="Örn. Okul › Öğrenciler" value="' + esc(state.data.menu) + '" />' +
        '<small>Uygulama ' + esc(menuYerAciklama(state.calisma)) + ' menüsünde ve breadcrumb\'ta görünecek yol</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'baslik') {
      title.textContent = 'Sayfa bilgisi';
      body.innerHTML =
        '<label class="modal-field"><span>Sayfa başlığı *</span>' +
        '<input type="text" id="w-baslik" placeholder="Örn. Öğrenciler" value="' + esc(state.data.baslik) + '" /></label>' +
        '<label class="modal-field"><span>Model adı *</span>' +
        '<input type="text" id="w-model" placeholder="Örn. Öğrenci" value="' + esc(state.data.model) + '" />' +
        '<small>Veri modeli / varlık adı (tekil)</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'sutunlar') {
      title.textContent = 'Liste sütunları';
      body.innerHTML =
        '<label class="modal-field"><span>Hangi sütunlar? *</span>' +
        '<input type="text" id="w-sutunlar" placeholder="ad, soyad, not" value="' + esc(state.data.sutunlar) + '" />' +
        '<small>Virgülle ayırın</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'ozellikler') {
      title.textContent = 'Liste özellikleri';
      body.innerHTML =
        radioGroup('w-sayfalama', 'Sayfalandırma örneği olsun mu?', state.data.sayfalama) +
        radioGroup('w-filtre', 'Kolonlarda filtreleme olsun mu?', state.data.filtre) +
        radioGroup('w-siralama', 'Kolonlarda sıralama olsun mu?', state.data.siralama) +
        radioGroup('w-ekle', 'Liste üzerinde ekleme (+ Yeni) butonu olsun mu?', state.data.ekleButonu);
      renderStepNav();
      return;
    }

    if (step === 'form-baglantisi') {
      title.textContent = 'Form bağlantısı';
      var chk = state.data.formBaglantisi ? ' checked' : '';
      body.innerHTML =
        '<label class="wizard-check"><input type="checkbox" id="w-form-bag"' + chk + ' /> Ekleme / düzenleme formu da bu istekte oluşturulsun</label>' +
        '<p class="wizard-hint">CRUD kayıt formu için işaretleyin (Yeni / Düzenle / Listeye dön). İletişim veya başvuru gibi <strong>tek başına</strong> formlar için <strong>Form</strong> türünü seçin.</p>' +
        '<div id="w-form-alan-wrap"' + (state.data.formBaglantisi ? '' : ' hidden') + '>' + formAlanlariHtml() + '</div>';
      bindFormAlanlari();
      var cb = document.getElementById('w-form-bag');
      if (cb) {
        cb.addEventListener('change', function () {
          state.data.formBaglantisi = cb.checked;
          var wrap = document.getElementById('w-form-alan-wrap');
          if (wrap) wrap.hidden = !cb.checked;
        });
      }
      renderStepNav();
      return;
    }

    if (step === 'form-bilgi') {
      title.textContent = 'Form bilgisi';
      body.innerHTML =
        '<p class="wizard-hint">Bu şablon <strong>yalnızca bir form</strong> ekranı üretir; liste veya tablo oluşturulmaz.</p>' +
        '<label class="modal-field"><span>Form adı *</span>' +
        '<input type="text" id="w-form-adi" placeholder="Örn. İletişim Formu" value="' + esc(state.data.formAdi) + '" />' +
        '<small>Sayfa başlığı ve breadcrumb\'ta görünür</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'form-alanlari') {
      title.textContent = 'Form alanları';
      body.innerHTML =
        '<p class="wizard-hint">Formda görünecek alanları tanımlayın.</p>' +
        '<div id="w-form-alan-wrap">' + formAlanlariHtml() + '</div>';
      bindFormAlanlari();
      renderStepNav();
      return;
    }

    if (step === 'gonder-buton') {
      title.textContent = 'Gönder butonu';
      body.innerHTML =
        '<label class="modal-field"><span>Gönder butonu metni *</span>' +
        '<input type="text" id="w-gonder" placeholder="Örn. Gönder" value="' + esc(state.data.gonderButonu) + '" />' +
        '<small>Formun altındaki birincil buton — örn. Gönder, Kaydet, Başvur</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'rapor-menu-bilgi') {
      title.textContent = 'Menü ve rapor adı';
      body.innerHTML =
        '<p class="wizard-hint">Salt okunur rapor — liste, form veya + Yeni butonu oluşturulmaz.</p>' +
        '<label class="modal-field"><span>Menü yolu *</span>' +
        '<input type="text" id="w-menu" placeholder="Örn. Raporlar › Bölgesel özet" value="' + esc(state.data.menu) + '" /></label>' +
        '<label class="modal-field"><span>Rapor adı *</span>' +
        '<input type="text" id="w-rapor-adi" placeholder="Örn. Bölgesel özet" value="' + esc(state.data.raporAdi) + '" />' +
        '<small>Sayfa başlığı ve breadcrumb\'ta görünür</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'veri-kaynak') {
      title.textContent = 'Veri kaynağı';
      body.innerHTML =
        '<label class="modal-field"><span>Veri kaynağı *</span>' +
        '<input type="text" id="w-veri-kaynak" placeholder="Örn. kaynak tablosu" value="' + esc(state.data.veriKaynagi) + '" />' +
        '<small>Hangi tablo veya entity\'den özetlenecek?</small></label>';
      renderStepNav();
      return;
    }

    if (step === 'rapor-filtreler') {
      title.textContent = 'Filtreler';
      body.innerHTML =
        '<p class="wizard-hint">Üst toolbar\'da Raporla öncesi filtre alanları. İstemezseniz boş bırakın.</p>' +
        '<div id="w-filtre-wrap">' + raporFiltreleriHtml() + '</div>';
      bindRaporFiltreleri();
      renderStepNav();
      return;
    }

    if (step === 'rapor-aksiyonlar') {
      title.textContent = 'Üst aksiyonlar';
      body.innerHTML =
        '<p class="wizard-hint"><strong>Raporla</strong> butonu her raporda vardır.</p>' +
        radioGroup('w-excel', 'Excel\'e aktar butonu olsun mu?', state.data.excelAktar);
      renderStepNav();
      return;
    }

    if (step === 'rapor-widgetlar') {
      state.data.raporWidgetlari = rw().filterWizardWidgets(state.data.raporWidgetlari);
      title.textContent = 'Widget listesi';
      body.innerHTML =
        '<p class="wizard-hint">Rapor gövdesine eklenecek bileşenler. Sıra ekrandaki görünüm sırasıdır.</p>' +
        '<div id="w-widget-wrap">' + raporWidgetListHtml() + '</div>';
      bindRaporWidgetList();
      renderStepNav();
      return;
    }

    if (step === 'rapor-widget-detay') {
      title.textContent = 'Widget detayları';
      saveRaporWidgetListFromDom();
      state.data.raporWidgetlari = rw().filterWizardWidgets(state.data.raporWidgetlari);
      body.innerHTML =
        '<p class="wizard-hint">Her widget için mockup\'ta gösterilecek örnek veriyi tanımlayın.</p>' +
        '<div id="w-widget-detay-wrap">' + raporWidgetDetayHtml() + '</div>';
      bindRaporWidgetDetay();
      renderStepNav();
      return;
    }

    if (step === 'serbest-metin') {
      title.textContent = 'Serbest tarif';
      body.innerHTML =
        '<label class="modal-field"><span>Ne istiyorsunuz? *</span>' +
        '<textarea id="w-serbest" rows="8" placeholder="Menü, ekran, alanlar…">' + esc(state.data.serbest) + '</textarea></label>';
      renderStepNav();
      return;
    }

    renderStepNav();
  }

  function bindTurCards() {
    document.querySelectorAll('.wizard-tur-card').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tur = btn.getAttribute('data-tur');
        state.tur = tur;
        if (tur === 'liste') state.steps = LISTE_STEPS.slice();
        else if (tur === 'form') {
          state.steps = FORM_STEPS.slice();
          if (!state.data.formAlanlari.length) state.data.formAlanlari = [{ ad: '', tur: 'metin' }];
        } else if (tur === 'rapor') {
          state.steps = RAPOR_STEPS.slice();
          if (!state.data.raporWidgetlari.length) state.data.raporWidgetlari = [rw().defaultWidget('ozet')];
        } else state.steps = SERBEST_STEPS.slice();
        state.stepIdx = 1;
        state.maxReachedIdx = Math.max(state.maxReachedIdx, 1);
        renderStep();
      });
    });
  }

  function bindFormAlanlari() {
    var wrap = document.getElementById('w-form-alan-wrap');
    var add = document.getElementById('wizard-alan-add');
    if (add) {
      add.addEventListener('click', function () {
        saveFormAlanlariFromDom();
        state.data.formAlanlari.push({ ad: '', tur: 'metin' });
        if (wrap) wrap.innerHTML = formAlanlariHtml();
        bindFormAlanlari();
      });
    }
    document.querySelectorAll('.wizard-alan-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveFormAlanlariFromDom();
        var row = btn.closest('.wizard-alan-row');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        state.data.formAlanlari.splice(idx, 1);
        if (wrap) wrap.innerHTML = formAlanlariHtml();
        bindFormAlanlari();
      });
    });
    document.querySelectorAll('.wizard-alan-tur').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var row = sel.closest('.wizard-alan-row');
        var hint = row ? row.querySelector('.wizard-alan-checkbox-hint') : null;
        if (hint) hint.hidden = sel.value !== 'checkbox';
      });
    });
    updateCheckboxHints(wrap);
  }

  function saveRaporFiltreleriFromDom() {
    var rows = document.querySelectorAll('#wizard-filtre-list .wizard-alan-row');
    var list = [];
    rows.forEach(function (row) {
      var ad = row.querySelector('.wizard-alan-ad');
      var tur = row.querySelector('.wizard-alan-tur');
      list.push({ ad: ad ? ad.value.trim() : '', tur: tur ? tur.value : 'dropdown' });
    });
    state.data.raporFiltreleri = list;
  }

  function bindRaporFiltreleri() {
    var wrap = document.getElementById('w-filtre-wrap');
    var add = document.getElementById('wizard-filtre-add');
    if (add) {
      add.addEventListener('click', function () {
        saveRaporFiltreleriFromDom();
        state.data.raporFiltreleri.push({ ad: '', tur: 'dropdown' });
        if (wrap) wrap.innerHTML = raporFiltreleriHtml();
        bindRaporFiltreleri();
      });
    }
    document.querySelectorAll('#wizard-filtre-list .wizard-alan-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveRaporFiltreleriFromDom();
        var row = btn.closest('.wizard-alan-row');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        state.data.raporFiltreleri.splice(idx, 1);
        if (wrap) wrap.innerHTML = raporFiltreleriHtml();
        bindRaporFiltreleri();
      });
    });
  }

  function saveRaporWidgetListFromDom() {
    var rows = document.querySelectorAll('#wizard-widget-list .wizard-widget-row');
    var list = [];
    rows.forEach(function (row, i) {
      var prev = state.data.raporWidgetlari[i] || rw().defaultWidget('ozet');
      var tur = row.querySelector('.wizard-widget-tur');
      var baslik = row.querySelector('.wizard-widget-baslik');
      var w = rw().defaultWidget(tur ? tur.value : prev.tur);
      w.baslik = baslik ? baslik.value.trim() : '';
      w.tur = tur ? tur.value : prev.tur;
      for (var k = 1; k <= 4; k++) {
        w['kart' + k + 'Etiket'] = prev['kart' + k + 'Etiket'] || '';
        w['kart' + k + 'Deger'] = prev['kart' + k + 'Deger'] || '';
      }
      w.kartSayisi = prev.kartSayisi || '3';
      w.xEkseni = prev.xEkseni || '';
      w.yEkseni = prev.yEkseni || '';
      w.ornekKategoriler = prev.ornekKategoriler || '';
      w.dagilim = prev.dagilim || '';
      w.gruplama = prev.gruplama || '';
      w.ornekDilimler = prev.ornekDilimler || '';
      w.zamanEkseni = prev.zamanEkseni || '';
      w.metrik = prev.metrik || '';
      w.ornekDonemler = prev.ornekDonemler || '';
      w.sutunlar = prev.sutunlar || '';
      w.sayfalama = prev.sayfalama || 'hayir';
      w.haritaKapsam = prev.haritaKapsam || 'turkiye';
      w.haritaMetrik = prev.haritaMetrik || '';
      w.seciliIller = prev.seciliIller || '';
      w.ornekIller = prev.ornekIller || '';
      rw().normalizeHaritaWidget(w);
      list.push(w);
    });
    state.data.raporWidgetlari = list;
  }

  function bindRaporWidgetList() {
    var wrap = document.getElementById('w-widget-wrap');
    var add = document.getElementById('wizard-widget-add');
    if (add) {
      add.addEventListener('click', function () {
        saveRaporWidgetListFromDom();
        state.data.raporWidgetlari.push(rw().defaultWidget('bar'));
        if (wrap) wrap.innerHTML = raporWidgetListHtml();
        bindRaporWidgetList();
      });
    }
    document.querySelectorAll('#wizard-widget-list .wizard-alan-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        saveRaporWidgetListFromDom();
        var row = btn.closest('.wizard-widget-row');
        var idx = parseInt(row.getAttribute('data-idx'), 10);
        state.data.raporWidgetlari.splice(idx, 1);
        if (!state.data.raporWidgetlari.length) state.data.raporWidgetlari.push(rw().defaultWidget('ozet'));
        if (wrap) wrap.innerHTML = raporWidgetListHtml();
        bindRaporWidgetList();
      });
    });
  }

  function saveRaporWidgetDetayFromDom() {
    var panels = document.querySelectorAll('.wizard-widget-panel');
    panels.forEach(function (panel) {
      var idx = parseInt(panel.getAttribute('data-idx'), 10);
      var w = state.data.raporWidgetlari[idx];
      if (!w) return;
      var kartSay = panel.querySelector('.wizard-ozet-kart-say');
      if (kartSay) w.kartSayisi = kartSay.value;
      for (var k = 1; k <= 4; k++) {
        var et = panel.querySelector('.wizard-kart-etiket[data-kart="' + k + '"]');
        var dg = panel.querySelector('.wizard-kart-deger[data-kart="' + k + '"]');
        if (et) w['kart' + k + 'Etiket'] = et.value.trim();
        if (dg) w['kart' + k + 'Deger'] = dg.value.trim();
      }
      var x = panel.querySelector('.wizard-w-x');
      var y = panel.querySelector('.wizard-w-y');
      var ornek = panel.querySelector('.wizard-w-ornek');
      var dag = panel.querySelector('.wizard-w-dagilim');
      var grup = panel.querySelector('.wizard-w-grup');
      var zaman = panel.querySelector('.wizard-w-zaman');
      var metrik = panel.querySelector('.wizard-w-metrik');
      var sutun = panel.querySelector('.wizard-w-sutun');
      if (x) w.xEkseni = x.value.trim();
      if (y) w.yEkseni = y.value.trim();
      if (ornek && w.tur === 'bar') w.ornekKategoriler = ornek.value.trim();
      if (ornek && w.tur === 'pie') w.ornekDilimler = ornek.value.trim();
      if (ornek && w.tur === 'line') w.ornekDonemler = ornek.value.trim();
      if (dag) w.dagilim = dag.value.trim();
      if (grup) w.gruplama = grup.value.trim();
      if (zaman) w.zamanEkseni = zaman.value.trim();
      if (metrik) w.metrik = metrik.value.trim();
      if (sutun) w.sutunlar = sutun.value.trim();
      var sayfEl = panel.querySelector('input[name="w-sayf-' + idx + '"]:checked');
      if (sayfEl) w.sayfalama = sayfEl.value;
      var haritaMetrik = panel.querySelector('.wizard-w-harita-metrik');
      var haritaOrnek = panel.querySelector('.wizard-w-harita-ornek');
      if (haritaMetrik) w.haritaMetrik = haritaMetrik.value.trim();
      if (haritaOrnek) w.ornekIller = haritaOrnek.value.trim();
      w.seciliIller = '';
      rw().normalizeHaritaWidget(w);
    });
  }

  function bindRaporWidgetDetay() {
    document.querySelectorAll('.wizard-ozet-kart-say').forEach(function (sel) {
      sel.addEventListener('change', function () {
        saveRaporWidgetDetayFromDom();
        var idx = parseInt(sel.getAttribute('data-widx'), 10);
        if (state.data.raporWidgetlari[idx]) state.data.raporWidgetlari[idx].kartSayisi = sel.value;
        var wrap = document.getElementById('w-widget-detay-wrap');
        if (wrap) wrap.innerHTML = raporWidgetDetayHtml();
        bindRaporWidgetDetay();
      });
    });
  }

  function saveFormAlanlariFromDom() {
    var rows = document.querySelectorAll('.wizard-alan-row');
    var list = [];
    rows.forEach(function (row) {
      var ad = row.querySelector('.wizard-alan-ad');
      var tur = row.querySelector('.wizard-alan-tur');
      list.push({ ad: ad ? ad.value.trim() : '', tur: tur ? tur.value : 'metin' });
    });
    state.data.formAlanlari = list;
  }

  function readRadio(name) {
    var el = document.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : 'hayir';
  }

  function saveCurrentStep() {
    var step = state.steps[state.stepIdx];
    if (step === 'menu') {
      state.data.menu = (document.getElementById('w-menu') || {}).value || '';
    }
    if (step === 'rapor-menu-bilgi') {
      state.data.menu = (document.getElementById('w-menu') || {}).value || '';
      state.data.raporAdi = (document.getElementById('w-rapor-adi') || {}).value || '';
    }
    if (step === 'veri-kaynak') {
      state.data.veriKaynagi = (document.getElementById('w-veri-kaynak') || {}).value || '';
    }
    if (step === 'rapor-filtreler') {
      saveRaporFiltreleriFromDom();
    }
    if (step === 'rapor-aksiyonlar') {
      state.data.excelAktar = readRadio('w-excel');
    }
    if (step === 'rapor-widgetlar') {
      saveRaporWidgetListFromDom();
    }
    if (step === 'rapor-widget-detay') {
      saveRaporWidgetDetayFromDom();
    }
    if (step === 'baslik') {
      state.data.baslik = (document.getElementById('w-baslik') || {}).value || '';
      state.data.model = (document.getElementById('w-model') || {}).value || '';
    }
    if (step === 'sutunlar') {
      state.data.sutunlar = (document.getElementById('w-sutunlar') || {}).value || '';
    }
    if (step === 'ozellikler') {
      state.data.sayfalama = readRadio('w-sayfalama');
      state.data.filtre = readRadio('w-filtre');
      state.data.siralama = readRadio('w-siralama');
      state.data.ekleButonu = readRadio('w-ekle');
    }
    if (step === 'form-baglantisi') {
      var cb = document.getElementById('w-form-bag');
      state.data.formBaglantisi = cb ? cb.checked : false;
      if (state.data.formBaglantisi) saveFormAlanlariFromDom();
    }
    if (step === 'form-bilgi') {
      state.data.formAdi = (document.getElementById('w-form-adi') || {}).value || '';
    }
    if (step === 'form-alanlari') {
      saveFormAlanlariFromDom();
    }
    if (step === 'gonder-buton') {
      state.data.gonderButonu = (document.getElementById('w-gonder') || {}).value || '';
    }
    if (step === 'serbest-metin') {
      state.data.serbest = (document.getElementById('w-serbest') || {}).value || '';
    }
  }

  function validateStep() {
    var step = state.steps[state.stepIdx];
    if (step === 'tur') {
      showError('Lütfen bir ekran türü seçin.');
      return false;
    }
    if (step === 'menu' && !state.data.menu.trim()) {
      showError('Menü yolu zorunlu.');
      return false;
    }
    if (step === 'rapor-menu-bilgi') {
      if (!state.data.menu.trim()) { showError('Menü yolu zorunlu.'); return false; }
      if (!state.data.raporAdi.trim()) { showError('Rapor adı zorunlu.'); return false; }
    }
    if (step === 'veri-kaynak' && !state.data.veriKaynagi.trim()) {
      showError('Veri kaynağı zorunlu.');
      return false;
    }
    if (step === 'rapor-widgetlar') {
      var okW = false;
      for (var w = 0; w < state.data.raporWidgetlari.length; w++) {
        if (state.data.raporWidgetlari[w].baslik) okW = true;
      }
      if (!okW) { showError('En az bir widget için başlık girin.'); return false; }
    }
    if (step === 'rapor-widget-detay') {
      for (var t = 0; t < state.data.raporWidgetlari.length; t++) {
        var wg = state.data.raporWidgetlari[t];
        if (wg.tur === 'tablo' && wg.baslik && !wg.sutunlar.trim()) {
          showError('Özet liste widget\'ı için sütunları girin: «' + wg.baslik + '»');
          return false;
        }
      }
    }
    if (step === 'baslik') {
      if (!state.data.baslik.trim()) { showError('Sayfa başlığı zorunlu.'); return false; }
      if (!state.data.model.trim()) { showError('Model adı zorunlu.'); return false; }
    }
    if (step === 'sutunlar' && !state.data.sutunlar.trim()) {
      showError('En az bir sütun yazın.');
      return false;
    }
    if (step === 'form-baglantisi' && state.data.formBaglantisi) {
      var ok = false;
      for (var i = 0; i < state.data.formAlanlari.length; i++) {
        if (state.data.formAlanlari[i].ad) ok = true;
      }
      if (!ok) { showError('Form için en az bir alan adı girin.'); return false; }
    }
    if (step === 'form-bilgi' && !state.data.formAdi.trim()) {
      showError('Form adı zorunlu.');
      return false;
    }
    if (step === 'form-alanlari') {
      var okAlan = false;
      for (var k = 0; k < state.data.formAlanlari.length; k++) {
        if (state.data.formAlanlari[k].ad) okAlan = true;
      }
      if (!okAlan) { showError('En az bir alan adı girin.'); return false; }
    }
    if (step === 'gonder-buton' && !state.data.gonderButonu.trim()) {
      showError('Gönder butonu metni zorunlu.');
      return false;
    }
    if (step === 'serbest-metin' && !state.data.serbest.trim()) {
      showError('Kısa bir tarif yazın.');
      return false;
    }
    showError('');
    return true;
  }

  function goBack() {
    if (state.stepIdx > 0) {
      saveCurrentStep();
      state.stepIdx--;
      renderStep();
    }
  }

  function goNext() {
    var step = state.steps[state.stepIdx];
    if (step === 'sonuc') {
      var text = getPrompt();
      var copied = document.getElementById('ekran-wizard-copied');
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { copied.hidden = false; showError(''); })
          .catch(function () { showError('Kopyalanamadı — metni elle seçin.'); });
      } else {
        showError('Kopyalanamadı — metni elle seçin.');
      }
      return;
    }
    if (step === 'tur') {
      showError('Önce bir tür seçin.');
      return;
    }
    saveCurrentStep();
    if (!validateStep()) return;
    state.stepIdx++;
    state.maxReachedIdx = Math.max(state.maxReachedIdx, state.stepIdx);
    renderStep();
  }

  function reset(calisma) {
    state.calisma = calisma;
    state.tur = null;
    state.stepIdx = 0;
    state.maxReachedIdx = 0;
    state.steps = ['tur'];
    state.data = {
      menu: '',
      baslik: '',
      model: '',
      sutunlar: '',
      sayfalama: 'hayir',
      filtre: 'hayir',
      siralama: 'hayir',
      ekleButonu: 'evet',
      formBaglantisi: false,
      formAlanlari: [],
      formAdi: '',
      gonderButonu: 'Gönder',
      raporAdi: '',
      veriKaynagi: '',
      raporFiltreleri: [],
      excelAktar: 'evet',
      raporWidgetlari: [],
      serbest: ''
    };
  }

  function open(calisma) {
    if (!calisma) return;
    ensureModal();
    reset(calisma);
    document.getElementById('ekran-wizard-modal').hidden = false;
    renderStep();
  }

  function close() {
    var m = document.getElementById('ekran-wizard-modal');
    if (m) m.hidden = true;
  }

  window.EKRAN_WIZARD = {
    open: open,
    close: close,
    buildListePrompt: buildListePrompt,
    buildFormPrompt: buildFormPrompt,
    buildRaporPrompt: buildRaporPrompt
  };
})();
