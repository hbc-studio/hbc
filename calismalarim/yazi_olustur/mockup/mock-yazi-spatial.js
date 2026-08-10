/**
 * Yazı formu — polygon sonrası mekansal otomatik doldurma (mockup).
 */
(function () {
  var polygonDrawn = false;

  /** Mock senaryo: polygon sonrası büyükşehir belediyesi (belediyetipi = 1) — SUKİ alanı sorulur */
  var SPATIAL_MOCK = {
    havzada_mi: 'Hayır',
    il_id: '06',
    il: 'Ankara',
    ilce: 'Çankaya',
    koy: 'Öveçler Mahallesi',
    belediye_tipi: 1,
    ada_parsel: 'Çankaya — 142 / 8 parsel',
    baraj_gol: 'Yok',
    lat: '39,93',
    lon: '32,85'
  };

  /** cys.koruma_bantlari + ortak.sistem_tanim — örnek kesişim sonucu */
  var KORUMA_KESISIM_MOCK = [
    { koruma_bolge_tipi_id: 1, tanim_adi: 'Mutlak Koruma Alanı', yuzde: 42, secenek: 'Mutlak' },
    { koruma_bolge_tipi_id: 2, tanim_adi: 'Kısa Mesafeli Koruma Alanı', yuzde: 58, secenek: 'Kısa Mesafeli' }
  ];

  function el(id) {
    return document.getElementById(id);
  }

  function isBuyuksehirBelediyesi() {
    return Number(SPATIAL_MOCK.belediye_tipi) === 1;
  }

  function syncSukiRule() {
    var sukiField = el('f-suki-field');
    var sukiSelect = el('f-suki');
    var sukiInfo = el('f-suki-buyuksehir-info');
    if (!sukiSelect) return;

    var shouldAskSuki = polygonDrawn && isBuyuksehirBelediyesi();
    if (sukiField) sukiField.hidden = !shouldAskSuki;
    if (sukiInfo) sukiInfo.hidden = shouldAskSuki;
    sukiSelect.disabled = !shouldAskSuki;
    if (!shouldAskSuki) sukiSelect.value = '';

    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function syncKorumaKesisim() {
    var wrap = el('f-koruma-kesisim-preview-wrap');
    var tbody = el('f-koruma-kesisim-tbody');
    var korumaSelect = el('f-koruma-alani');
    if (!wrap || !tbody) return;

    if (!polygonDrawn) {
      wrap.hidden = true;
      tbody.innerHTML = '';
      if (korumaSelect && korumaSelect.tomselect) korumaSelect.tomselect.clear(true);
      return;
    }

    wrap.hidden = false;
    tbody.innerHTML = KORUMA_KESISIM_MOCK.map(function (row) {
      return (
        '<tr><td>' +
        row.tanim_adi +
        '</td><td class="num">%' +
        row.yuzde +
        '</td></tr>'
      );
    }).join('');

    if (korumaSelect) {
      var secenekler = KORUMA_KESISIM_MOCK.map(function (row) {
        return row.secenek;
      });
      if (korumaSelect.tomselect) {
        korumaSelect.tomselect.setValue(secenekler, true);
      } else {
        Array.prototype.forEach.call(korumaSelect.options, function (opt) {
          opt.selected = secenekler.indexOf(opt.value) >= 0;
        });
      }
    }

    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function syncIlgiOzetFromSpatial() {
    var ta = el('f-ilgi-ozet');
    if (!ta) return;
    if (!polygonDrawn) {
      ta.value = (window.YAZI_ILGI_OZET && window.YAZI_ILGI_OZET.sablon) || '';
      return;
    }
    if (window.YAZI_ILGI_OZET && window.YAZI_ILGI_OZET.buildFromKonum) {
      ta.value = window.YAZI_ILGI_OZET.buildFromKonum(SPATIAL_MOCK.il, SPATIAL_MOCK.ilce, SPATIAL_MOCK.koy);
    }
    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function hukumYaziyor() {
    var checked = document.querySelector('input[name="f-hukum-yaz"]:checked');
    return checked && checked.value === 'Evet';
  }

  function findOzelHukumFromPolygon() {
    if (!polygonDrawn) return null;
    return (window.OZEL_HUKUMLAR || [])[0] || null;
  }

  function buildOzelHukumMetni() {
    var ozel = findOzelHukumFromPolygon();
    if (!ozel) return '';
    return ozel.madde_no + ': ' + ozel.madde_icerik;
  }

  function setHukumYaz(value) {
    var radio = document.querySelector('input[name="f-hukum-yaz"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  function resetHukumYaz() {
    document.querySelectorAll('input[name="f-hukum-yaz"]').forEach(function (radio) {
      radio.checked = false;
    });
  }

  function syncHukumYazInfo() {
    var info = el('f-hukum-yaz-hayir-info');
    var ozel = findOzelHukumFromPolygon();
    if (!info) return;
    info.hidden = !(ozel && !hukumYaziyor());
  }

  function syncHukumlerField() {
    var ta = el('f-hukumler');
    if (!ta) return;
    var ozel = findOzelHukumFromPolygon();

    syncHukumYazInfo();

    if (!polygonDrawn || !ozel) {
      ta.value = '';
      ta.readOnly = true;
      ta.classList.add('mock-input--readonly');
      ta.placeholder = 'Polygon çizin; özel hüküm bulunursa alan otomatik dolar.';
    } else if (hukumYaziyor()) {
      ta.value = buildOzelHukumMetni();
      ta.readOnly = true;
      ta.classList.add('mock-input--readonly');
      ta.placeholder = '';
    } else {
      ta.value = '';
      ta.readOnly = true;
      ta.classList.add('mock-input--readonly');
      ta.placeholder = 'Hayır seçildi — özel hüküm maddeleri geçersiz sayıldı.';
    }
    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function applySpatial() {
    var havza = el('f-havza');
    var il = el('f-il');
    var ilce = el('f-ilce');
    var koy = el('f-koy');
    var parsel = el('f-ada-parsel');
    var baraj = el('f-baraj');
    var lat = el('yazi-map-lat');
    var lon = el('yazi-map-lon');
    var polygon = el('yazi-map-polygon');

    if (havza) havza.value = SPATIAL_MOCK.havzada_mi;
    if (il) il.value = SPATIAL_MOCK.il;
    if (ilce) ilce.value = SPATIAL_MOCK.ilce;
    if (koy) koy.value = SPATIAL_MOCK.koy;
    if (parsel) parsel.value = SPATIAL_MOCK.ada_parsel;
    if (baraj) baraj.value = SPATIAL_MOCK.baraj_gol;
    if (lat) lat.textContent = SPATIAL_MOCK.lat;
    if (lon) lon.textContent = SPATIAL_MOCK.lon;
    if (polygon) polygon.hidden = false;

    polygonDrawn = true;
    syncIlgiOzetFromSpatial();
    syncSukiRule();
    syncKorumaKesisim();
    if (findOzelHukumFromPolygon()) {
      setHukumYaz('Evet');
    }
    syncHukumlerField();
    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function clearSpatial() {
    ['f-havza', 'f-il', 'f-ilce', 'f-koy', 'f-ada-parsel', 'f-baraj'].forEach(function (id) {
      var node = el(id);
      if (node) node.value = '';
    });
    var lat = el('yazi-map-lat');
    var lon = el('yazi-map-lon');
    var polygon = el('yazi-map-polygon');
    if (lat) lat.textContent = '—';
    if (lon) lon.textContent = '—';
    if (polygon) polygon.hidden = true;
    polygonDrawn = false;
    syncIlgiOzetFromSpatial();
    syncSukiRule();
    syncKorumaKesisim();
    resetHukumYaz();
    syncHukumlerField();
    if (window.YAZI_WIZARD && window.YAZI_WIZARD.updateStepperMeta) {
      window.YAZI_WIZARD.updateStepperMeta();
    }
  }

  function bindMap() {
    var drawBtn = el('yazi-map-draw');
    var uploadBtn = el('yazi-map-upload');
    var clearBtn = el('yazi-map-clear');
    var fileInput = el('yazi-map-file');

    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'yazi-map-file';
      fileInput.accept = '.kml,.kmz,.geojson,.json,.shp,.zip';
      fileInput.hidden = true;
      fileInput.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fileInput);
    }

    if (drawBtn) drawBtn.addEventListener('click', applySpatial);
    if (uploadBtn) {
      uploadBtn.addEventListener('click', function () {
        fileInput.click();
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (fileInput.files && fileInput.files.length) applySpatial();
        fileInput.value = '';
      });
    }
    if (clearBtn) clearBtn.addEventListener('click', clearSpatial);
  }

  function bindHukumYaz() {
    document.querySelectorAll('input[name="f-hukum-yaz"]').forEach(function (radio) {
      radio.addEventListener('change', syncHukumlerField);
    });
  }

  function init() {
    bindMap();
    bindHukumYaz();
    syncSukiRule();
    syncKorumaKesisim();
    syncHukumlerField();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.YAZI_SPATIAL = { applySpatial: applySpatial, clearSpatial: clearSpatial, syncHukumlerField: syncHukumlerField };
})();
