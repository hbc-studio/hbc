/**
 * Yazı Oluştur mockup — Excel Seçenekler sayfasındaki listeleri forma doldurur.
 * Tekli alanlar: Bootstrap form-select (native).
 * Çoklu alan (koruma alanı): mock-tom-select.js — Tom Select (mdc kuralı).
 */
(function () {
  var S = window.YAZI_EXCEL_SECENEKLER;
  if (!S) return;

  var EXCEL_OPTION_KEYS = {
    talep_turu: true,
    koruma_plani_yili: true,
    suki: true,
    tahsis_satis: true,
    hitap: true,
    koruma_planlari: true,
    taskin_gorusu: true,
    koruma_alani_mesafe: true
  };

  /** Yeni yazıda Talep adımına standart gelen ilgi yazısı kısa özet şablonu (düzenlenebilir) */
  var ILGI_OZET_SABLON =
    '… İli, … İlçesi … sınırları içerisinde yer alan ilgi yazı ekinde gönderilen … adet parselde … uhdesinde bulunan … sayılı … faaliyet için Genel Müdürlüğümüz görüşü';

  var ILGI_OZET_SON =
    ' sınırları içerisinde yer alan ilgi yazı ekinde gönderilen 32 adet parselde Koza Altın İşletmeleri A.Ş. nin uhdesinde bulunan S.201001197 sayılı IV. Grup maden işletme ruhsatlı sahada yapılacak olan faaliyet için Genel Müdürlüğümüz görüşü';

  window.YAZI_ILGI_OZET = {
    sablon: ILGI_OZET_SABLON,
    buildFromKonum: function (il, ilce, koy) {
      return String(il || '…') + ' İli, ' + String(ilce || '…') + ' İlçesi ' + String(koy || '…') + ILGI_OZET_SON;
    }
  };

  function capitalizeOptionText(s) {
    return String(s).trim().split(/\s+/).map(function (w) {
      if (!w) return w;
      return w.charAt(0).toLocaleUpperCase('tr-TR') + w.slice(1);
    }).join(' ');
  }

  function fillSelect(el) {
    var key = el.getAttribute('data-yazi-options');
    if (!key || !S[key]) return;
    var keep = el.value;
    el.innerHTML = '';
    var seen = {};
    S[key].forEach(function (v) {
      var val = String(v);
      if (seen[val]) return;
      seen[val] = true;
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = capitalizeOptionText(val);
      el.appendChild(opt);
    });
    if (keep) el.value = keep;
  }

  function optionsWarningHtml(fromExcel) {
    var msg = fromExcel
      ? 'Excel\'den alınan seçeneklerdir. Canlı ekranda görünmelidir.'
      : 'Örnek seçeneklerdir.';
    return '<span class="mock-fe-warning__title">Frontend İçin Uyarı</span><p>' + msg + '</p>';
  }

  function createOptionsNote(fromExcel) {
    var note = document.createElement('div');
    note.className = 'mock-fe-warning mock-fe-warning--compact mock-options-note';
    note.setAttribute('role', 'note');
    note.innerHTML = optionsWarningHtml(fromExcel);
    return note;
  }

  function fieldAnchor(el) {
    if (el.tomselect && el.tomselect.wrapper) return el.tomselect.wrapper;
    return el;
  }

  function insertOptionsNote(anchor, note) {
    if (!anchor || !anchor.parentNode) return;
    if (anchor.nextElementSibling && anchor.nextElementSibling.classList.contains('mock-options-note')) return;
    anchor.parentNode.insertBefore(note, anchor.nextSibling);
  }

  function injectSelectWarnings() {
    document.querySelectorAll('select[data-yazi-options]').forEach(function (el) {
      var key = el.getAttribute('data-yazi-options');
      insertOptionsNote(fieldAnchor(el), createOptionsNote(!!EXCEL_OPTION_KEYS[key]));
    });
  }

  function injectOptionsWarnings() {
    injectSelectWarnings();
  }

  function scheduleOptionsWarnings() {
    window.setTimeout(injectOptionsWarnings, 120);
  }

  function isTalepTuruDiger(val) {
    return String(val || '').trim().toLocaleLowerCase('tr-TR') === 'diğer';
  }

  function faaliyetTedbirFor(talepTuru) {
    var map = S.faaliyet_tedbir;
    if (!map || !talepTuru) return '';
    var key = String(talepTuru).trim();
    if (Object.prototype.hasOwnProperty.call(map, key)) return map[key] || '';
    return '';
  }

  function syncFaaliyetTedbirField() {
    var talepEl = document.getElementById('f-talep-turu');
    var ta = document.getElementById('f-faaliyet-tedbir');
    var hint = document.getElementById('f-faaliyet-tedbir-hint');
    if (!talepEl || !ta) return;

    var talep = talepEl.value;
    var diger = isTalepTuruDiger(talep);
    var metin = faaliyetTedbirFor(talep);
    if (metin || !diger) ta.value = metin;

    ta.readOnly = !diger;
    ta.classList.toggle('mock-input--readonly', !diger);
    if (hint) {
      hint.textContent = diger
        ? 'Varsayılan metin getirildi — düzenleyebilirsiniz'
        : 'Faaliyet sayfasından otomatik doldurulur (salt okunur)';
    }
  }

  function bindFaaliyetTedbir() {
    var talepEl = document.getElementById('f-talep-turu');
    if (!talepEl) return;
    talepEl.addEventListener('change', function () {
      syncFaaliyetTedbirField();
      if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
        window.YAZI_WIZARD.updateStepperMeta();
      }
    });
    syncFaaliyetTedbirField();
  }

  function init() {
    document.querySelectorAll('[data-yazi-options]').forEach(fillSelect);
    var ilgiOzet = document.getElementById('f-ilgi-ozet');
    if (ilgiOzet && !(ilgiOzet.value || '').trim()) ilgiOzet.value = ILGI_OZET_SABLON;
    var defaults = {
      'f-talep-turu': 'Tavuk Kümesi',
      'f-tahsis': 'Hayır',
      'f-hitap': 'rica',
      'f-suki': 'Yok',
      'f-taskin': (S.taskin_gorusu && S.taskin_gorusu.length) ? S.taskin_gorusu[0] : ''
    };
    Object.keys(defaults).forEach(function (id) {
      var el = document.getElementById(id);
      if (el && defaults[id]) el.value = defaults[id];
    });
    scheduleOptionsWarnings();
    bindFaaliyetTedbir();
    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
