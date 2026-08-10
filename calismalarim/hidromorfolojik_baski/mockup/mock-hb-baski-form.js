(function () {
  var anket = window.HB_ANKET;
  var tespit = window.HB_KONUM_TESPIT;
  if (!anket || !tespit) return;

  var suKutlesi = document.getElementById('f-hb-su-kutlesi');
  var havza = document.getElementById('f-hb-havza');
  var altHavza = document.getElementById('f-hb-alt-havza');
  var il = document.getElementById('f-hb-il');
  var tur = document.getElementById('f-hb-tur');
  var polygon = document.getElementById('hb-map-polygon');
  var polygonShape = document.getElementById('hb-map-polygon-shape');
  var polygonPin = document.getElementById('hb-map-polygon-pin');
  var latEl = document.getElementById('hb-map-lat');
  var lonEl = document.getElementById('hb-map-lon');
  var olcumSection = document.getElementById('hb-olcum-section');
  var olcumLegend = document.getElementById('hb-olcum-legend');
  var olcumTurHint = document.getElementById('hb-olcum-tur-hint');
  var panelNehir = document.getElementById('hb-anket-nehir');
  var panelGol = document.getElementById('hb-anket-gol');
  var nehirHost = document.getElementById('hb-anket-nehir-list');
  var golHost = document.getElementById('hb-anket-gol-list');
  var konumEmpty = document.getElementById('hb-map-konum-empty');
  var konumBody = document.getElementById('hb-map-konum-body');

  var POLYGON_STYLES = {
    nehir: {
      points: '155,95 235,88 248,145 198,168 142,132',
      fill: 'rgba(220,53,69,0.45)',
      stroke: '#dc3545',
      pin: { cx: 198, cy: 128 }
    },
    gol: {
      points: '120,110 210,95 260,150 200,185 130,160',
      fill: 'rgba(33,150,243,0.42)',
      stroke: '#1565c0',
      pin: { cx: 195, cy: 138 }
    }
  };

  function setKonumPanelVisible(visible) {
    if (konumEmpty) konumEmpty.hidden = visible;
    if (konumBody) konumBody.hidden = !visible;
  }

  function setMapLabels(turKey) {
    document.querySelectorAll('[data-hb-label]').forEach(function (el) {
      el.hidden = el.getAttribute('data-hb-label') !== turKey;
    });
  }

  function setPolygonStyle(turKey) {
    var style = POLYGON_STYLES[turKey] || POLYGON_STYLES.nehir;
    if (polygonShape) {
      polygonShape.setAttribute('points', style.points);
      polygonShape.setAttribute('fill', style.fill);
      polygonShape.setAttribute('stroke', style.stroke);
    }
    if (polygonPin) {
      polygonPin.setAttribute('cx', String(style.pin.cx));
      polygonPin.setAttribute('cy', String(style.pin.cy));
      polygonPin.setAttribute('stroke', style.stroke);
    }
    setMapLabels(turKey);
  }

  function clearKonum() {
    [suKutlesi, havza, altHavza, il, tur].forEach(function (el) {
      if (el) el.value = '';
    });
    if (polygon) polygon.hidden = true;
    if (latEl) latEl.textContent = '—';
    if (lonEl) lonEl.textContent = '—';
    setKonumPanelVisible(false);
    if (olcumSection) olcumSection.hidden = true;
    if (olcumTurHint) olcumTurHint.hidden = true;
    if (panelNehir) panelNehir.hidden = true;
    if (panelGol) panelGol.hidden = true;
  }

  function renderAnketBlock(host, soru, prefix) {
    var block = document.createElement('div');
    block.className = 'hb-anket-block';
    var title = document.createElement('h3');
    title.className = 'hb-anket-block__title';
    title.textContent = soru.baslik;
    block.appendChild(title);
    var list = document.createElement('div');
    list.className = 'hb-choice-list';
    list.setAttribute('role', 'radiogroup');
    list.setAttribute('aria-label', soru.baslik);
    soru.secenekler.forEach(function (secenek, idx) {
      var label = document.createElement('label');
      label.className = 'hb-choice';
      var input = document.createElement('input');
      input.type = 'radio';
      input.name = prefix + '-' + soru.id;
      input.value = String(idx);
      if (idx === 0) input.checked = true;
      var span = document.createElement('span');
      span.textContent = secenek;
      label.appendChild(input);
      label.appendChild(span);
      list.appendChild(label);
    });
    block.appendChild(list);
    host.appendChild(block);
  }

  function buildAnketPanels() {
    if (nehirHost) {
      anket.nehir.forEach(function (s) { renderAnketBlock(nehirHost, s, 'nehir'); });
    }
    if (golHost) {
      anket.gol.forEach(function (s) { renderAnketBlock(golHost, s, 'gol'); });
    }
  }

  function showAnketByTur(turLabel) {
    var turKey = tespit.turKey(turLabel);
    if (!olcumSection) return;
    olcumSection.hidden = false;
    if (olcumLegend) {
      olcumLegend.textContent = 'Ölçüm Bilgisi Ekleme Ekranı — ' + turLabel;
    }
    if (olcumTurHint) {
      olcumTurHint.hidden = false;
      olcumTurHint.textContent =
        'Tespit edilen su kütlesi türü: ' + turLabel + '. Anket soruları Anket Listesi\'nden bu türe göre yüklenir.';
    }
    if (panelNehir) panelNehir.hidden = turKey !== 'nehir';
    if (panelGol) panelGol.hidden = turKey !== 'gol';
    return turKey;
  }

  function applyKonumTespiti(data) {
    var turKey = showAnketByTur(data.tur || 'Nehir');
    if (suKutlesi) suKutlesi.value = data.su_kutlesi_kodu || '';
    if (havza) havza.value = data.havza || '';
    if (altHavza) altHavza.value = data.alt_havza || '';
    if (il) il.value = data.il || '';
    if (tur) tur.value = data.tur || '';
    setPolygonStyle(turKey);
    if (polygon) polygon.hidden = false;
    if (latEl) latEl.textContent = data.lat || '—';
    if (lonEl) lonEl.textContent = data.lon || '—';
    setKonumPanelVisible(true);
  }

  function polygonSonrasiTespit(kaynak) {
    applyKonumTespiti(tespit.fromGeometry(kaynak));
  }

  function initMapDemo() {
    var drawBtn = document.getElementById('hb-map-draw');
    var uploadBtn = document.getElementById('hb-map-upload');
    var clearBtn = document.getElementById('hb-map-clear');
    var fileInput = document.getElementById('hb-map-file');

    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'hb-map-file';
      fileInput.accept = '.kml,.kmz,.geojson,.json,.shp,.zip';
      fileInput.hidden = true;
      fileInput.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fileInput);
    }

    if (drawBtn) {
      drawBtn.addEventListener('click', function () {
        polygonSonrasiTespit('cizim');
      });
    }
    if (uploadBtn) uploadBtn.addEventListener('click', function () { fileInput.click(); });
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) polygonSonrasiTespit('yukle');
        fileInput.value = '';
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', clearKonum);
  }

  function injectAnketNote() {
    var host = document.getElementById('hb-anket-note');
    if (!host || host.children.length) return;
    host.innerHTML =
      '<div class="mock-fe-warning mock-fe-warning--compact" role="note">' +
      '<span class="mock-fe-warning__title">Frontend İçin Uyarı</span>' +
      '<p>Sorular <strong>Sistem Yönetimi › Hidromorfolojik Baskı Yönetimi › Anket Listesi</strong>nden gelir. Hangi soru setinin açılacağı <strong>konumdan tespit edilen su kütlesi türüne</strong> (nehir / göl) bağlıdır; kullanıcı tür seçmez.</p>' +
      '</div>';
  }

  function init() {
    buildAnketPanels();
    initMapDemo();
    injectAnketNote();
    clearKonum();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
