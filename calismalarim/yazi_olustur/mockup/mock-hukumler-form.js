(function () {
  var hukumlerTablosu = window.HUKUMLER_TABLOSU || [];
  var mevzuatList = window.MEVZUAT_LIST || [];
  var ozelKayitlar = window.OZEL_HUKUMLAR || [];
  var tipler = window.KORUMA_ALANI_TIPLERI || [];
  var yonetmelikSel = document.getElementById('f-hukum-yonetmelik');
  var korumaSel = document.getElementById('f-hukum-koruma');
  var sektorSel = document.getElementById('f-hukum-sektor');
  var maddeNo = document.getElementById('f-hukum-madde-no');
  var maddeIcerik = document.getElementById('f-hukum-madde-icerik');
  var havza = document.getElementById('f-hukum-havza');
  var il = document.getElementById('f-hukum-il');
  var parsel = document.getElementById('f-hukum-parsel');
  var polygon = document.getElementById('mock-map-polygon');
  var latEl = document.getElementById('mock-map-lat');
  var lonEl = document.getElementById('mock-map-lon');

  if (!korumaSel || !sektorSel || !yonetmelikSel) return;

  function uniqSorted(list) {
    var seen = {};
    var out = [];
    list.forEach(function (v) {
      if (!v || seen[v]) return;
      seen[v] = true;
      out.push(v);
    });
    return out.sort(function (a, b) { return a.localeCompare(b, 'tr'); });
  }

  function korumaOptions() {
    if (tipler.length) return tipler.slice();
    return uniqSorted(hukumlerTablosu.map(function (r) { return r.koruma_alani; }));
  }

  function sektorOptions() {
    return uniqSorted(hukumlerTablosu.map(function (r) { return r.sektor; }));
  }

  function injectMevzuatNote() {
    if (!yonetmelikSel || yonetmelikSel.nextElementSibling && yonetmelikSel.nextElementSibling.classList.contains('mock-options-note')) return;
    var note = document.createElement('div');
    note.className = 'mock-fe-warning mock-fe-warning--compact mock-options-note';
    note.setAttribute('role', 'note');
    note.innerHTML =
      '<span class="mock-fe-warning__title">Frontend İçin Uyarı</span>' +
      '<p>Sistemdeki <strong>Mevzuat Listesi</strong>nden seçilir; ayrı yönetmelik listesi ekranı yoktur.</p>';
    yonetmelikSel.parentNode.insertBefore(note, yonetmelikSel.nextSibling);
  }

  function injectExcelOptionWarnings() {
    document.querySelectorAll('[data-hukum-excel-options]').forEach(function (el) {
      if (el.nextElementSibling && el.nextElementSibling.classList.contains('mock-options-note')) return;
      var note = document.createElement('div');
      note.className = 'mock-fe-warning mock-fe-warning--compact mock-options-note';
      note.setAttribute('role', 'note');
      note.innerHTML =
        '<span class="mock-fe-warning__title">Frontend İçin Uyarı</span>' +
        '<p>Excel\'den alınan seçeneklerdir. Canlı ekranda görünmelidir.</p>';
      el.parentNode.insertBefore(note, el.nextSibling);
    });
  }

  function splitMadde(madde) {
    madde = String(madde || '');
    var m = madde.match(/^((?:Madde\s+)?[\d]+(?:\s*\([^)]+\))?)\s*:?\s*/i);
    if (!m) return { no: '', icerik: madde };
    return { no: m[1].trim(), icerik: madde.slice(m[0].length).trim() };
  }

  function fillSelect(sel, items, selected) {
    sel.innerHTML = '';
    items.forEach(function (val) {
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      if (val === selected) opt.selected = true;
      sel.appendChild(opt);
    });
    if (selected && sel.value !== selected && items.indexOf(selected) === -1) {
      var extra = document.createElement('option');
      extra.value = selected;
      extra.textContent = selected;
      extra.selected = true;
      sel.insertBefore(extra, sel.firstChild);
    }
  }

  function fillMevzuatSelect(selectedId) {
    yonetmelikSel.innerHTML = '';
    mevzuatList.filter(function (m) { return m.aktif !== false; }).forEach(function (m) {
      var opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = m.ad;
      if (selectedId && String(m.id) === String(selectedId)) opt.selected = true;
      yonetmelikSel.appendChild(opt);
    });
  }

  function clearKonum() {
    if (havza) havza.value = '';
    if (il) il.value = '';
    if (parsel) parsel.value = '';
    if (polygon) polygon.hidden = true;
    if (latEl) latEl.textContent = '—';
    if (lonEl) lonEl.textContent = '—';
  }

  function fillKonum(kayit) {
    if (!kayit) return;
    if (havza) havza.value = kayit.icme_suyu_havzasi || '';
    if (il) il.value = kayit.il || '';
    if (parsel) parsel.value = kayit.ada_parsel || '';
    if (polygon) polygon.hidden = false;
    if (latEl) latEl.textContent = '39,92';
    if (lonEl) lonEl.textContent = '32,85';
  }

  function fillMaddeFromRow() {
    if (!maddeNo || !maddeIcerik) return;
    var koruma = korumaSel.value;
    var sektor = sektorSel.value;
    var row = hukumlerTablosu.find(function (r) {
      return r.koruma_alani === koruma && r.sektor === sektor;
    });
    if (!row) return;
    var parts = splitMadde(row.madde);
    maddeNo.value = parts.no;
    maddeIcerik.value = parts.icerik;
  }

  function fillFromOzel(kayit) {
    if (!kayit) return;
    fillMevzuatSelect(kayit.yonetmelik_id);
    fillSelect(korumaSel, korumaOptions(), kayit.koruma_alani);
    fillSelect(sektorSel, sektorOptions(), kayit.sektor);
    if (maddeNo) maddeNo.value = kayit.madde_no || '';
    if (maddeIcerik) maddeIcerik.value = kayit.madde_icerik || '';
    fillKonum(kayit);
  }

  function fillYeniKayit() {
    var varsayilanMevzuat = mevzuatList.find(function (m) { return m.id === 4; }) || mevzuatList[0];
    fillMevzuatSelect(varsayilanMevzuat ? varsayilanMevzuat.id : null);
    var initKoruma = korumaSel.getAttribute('data-value') || korumaOptions()[0];
    var initSektor = sektorSel.getAttribute('data-value') || sektorOptions()[0];
    fillSelect(korumaSel, korumaOptions(), initKoruma);
    fillSelect(sektorSel, sektorOptions(), initSektor);
    fillMaddeFromRow();
    clearKonum();
  }

  function initMapDemo() {
    var drawBtn = document.getElementById('mock-map-draw');
    var uploadBtn = document.getElementById('mock-map-upload');
    var clearBtn = document.getElementById('mock-map-clear');
    var fileInput = document.getElementById('mock-map-file');

    function applyDemoKonum() {
      if (havza) havza.value = 'Ankara İçme Suyu Havzası';
      if (il) il.value = 'Ankara';
      if (parsel) parsel.value = '142 / 8';
      if (polygon) polygon.hidden = false;
      if (latEl) latEl.textContent = '39,92';
      if (lonEl) lonEl.textContent = '32,85';
    }

    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'mock-map-file';
      fileInput.accept = '.kml,.kmz,.geojson,.json,.shp,.zip';
      fileInput.hidden = true;
      fileInput.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fileInput);
    }

    if (drawBtn) drawBtn.addEventListener('click', applyDemoKonum);
    if (uploadBtn) uploadBtn.addEventListener('click', function () { fileInput.click(); });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) applyDemoKonum();
        fileInput.value = '';
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', clearKonum);
  }

  function init() {
    var params = new URLSearchParams(location.search);
    var ornekId = params.get('ornek');
    var kayit = ozelKayitlar.find(function (r) { return String(r.id) === String(ornekId); });
    if (kayit) {
      fillFromOzel(kayit);
    } else {
      fillYeniKayit();
    }
    korumaSel.addEventListener('change', fillMaddeFromRow);
    sektorSel.addEventListener('change', fillMaddeFromRow);
    initMapDemo();
    injectMevzuatNote();
    injectExcelOptionWarnings();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
