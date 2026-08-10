/**
 * İklim Yönetimi Dashboard — harita↔liste↔grafik senkron
 * Varsayılan: Türkiye Ölçeği · MPI-ESM-MR · RCP8.5 · 2071–2100
 * Grafik tarih aralıkları 2026+ (geçmiş dönem değil)
 */
(function () {
  var charts = {};
  var state = {
    model: 'MPI-ESM-MR',
    senaryo: 'RCP8.5',
    donem: '2071–2100',
    olcek: 'Türkiye Ölçeği'
  };

  function setAktifSorgu() {
    var el = document.getElementById('id-aktif-sorgu');
    if (!el) return;
    el.innerHTML =
      'Aktif sorgu: <strong>' + state.olcek + '</strong> · Model <code>' + state.model +
      '</code> · Senaryo <code>' + state.senaryo + '</code> · Dönem <strong>' + state.donem + '</strong>';
  }

  function showCard(feature, opts) {
    opts = opts || {};
    document.querySelectorAll('#id-info-cards .td-info-card').forEach(function (c) {
      c.hidden = c.getAttribute('data-feature') !== feature;
    });
    document.querySelectorAll('.td-map-pin').forEach(function (p) {
      p.classList.toggle('is-active', p.getAttribute('data-feature') === feature);
    });
    document.querySelectorAll('.mock-table tbody tr[data-feature]').forEach(function (tr) {
      var on = tr.getAttribute('data-feature') === feature;
      tr.classList.toggle('is-selected', on);
      tr.classList.toggle('is-map-linked', on);
      if (on && !opts.skipScroll) {
        tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
    syncChartsToFeature(feature);
  }

  function syncChartsToFeature(feature) {
    if (!charts['chart-sicaklik']) return;
    var focused = feature === 'havza-sakarya';
    charts['chart-sicaklik'].data.datasets[0].data = focused
      ? [16.2, 16.5, 16.8, 17.0, 17.2, 17.4, 17.6, 17.8, 18.0, 18.2, 18.4]
      : [15.8, 16.0, 16.3, 16.6, 16.9, 17.1, 17.3, 17.5, 17.7, 17.9, 18.1];
    charts['chart-sicaklik'].update();
    if (charts['chart-yagis']) {
      charts['chart-yagis'].data.datasets[0].data = focused
        ? [72, 68, 75, 70, 65, 58, 52, 48, 55, 60, 62]
        : [70, 66, 72, 68, 62, 55, 50, 46, 52, 58, 60];
      charts['chart-yagis'].update();
    }
  }

  function destroyChart(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function initMap() {
    var MAP = window.MOCK_GEO_MAP;
    if (!MAP) return;
    MAP.init('#harita-iklim', {
      mapUrl: '../../../assets/map.svg',
      kapsam: 'turkiye',
      defaultFill: '#fff3e0',
      colors: {
        '06': '#e65100',
        '34': '#ffcc80',
        '35': '#ffb74d',
        '16': '#ffa726',
        '42': '#fb8c00',
        '07': '#f57c00',
        '01': '#ef6c00'
      },
      legendScale: {
        min: 10,
        max: 20,
        steps: 5,
        colors: ['#fff3e0', '#ffcc80', '#ff9800', '#f57c00', '#e65100']
      },
      legendLabel: 'Ort. sıcaklık (°C) · RCP8.5 · 2071–2100',
      onClick: function () {
        showCard('havza-sakarya');
      }
    });
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;

    var years2056 = ['2026', '2029', '2032', '2035', '2038', '2041', '2044', '2047', '2050', '2053', '2056'];
    var yearsShort = ['2026', '2027', '2028'];
    var decades = ['2026–2035', '2036–2045', '2046–2055', '2056–2065', '2066–2075', '2076–2085', '2086–2095', '2096–2100'];
    var periods30 = ['2026–2055', '2056–2085', '2086–2100'];
    var lineYears = ['2026', '2035', '2045', '2055', '2065', '2075', '2085', '2095', '2100'];

    function barWithRef(id, labels, data, color, opts) {
      var el = document.getElementById(id);
      if (!el) return;
      destroyChart(id);
      opts = opts || {};
      var datasets = [{
        label: opts.label || '',
        data: data,
        backgroundColor: color || '#42a5f5',
        borderRadius: 3,
        order: 2
      }];
      if (opts.refLine != null) {
        datasets.push({
          type: 'line',
          label: 'Referans',
          data: labels.map(function () { return opts.refLine; }),
          borderColor: '#e53935',
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
          order: 1
        });
      }
      charts[id] = new Chart(el, {
        type: 'bar',
        data: { labels: labels, datasets: datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: opts.beginAtZero === true,
              min: opts.min,
              max: opts.max,
              grid: { color: '#eef2f7' },
              title: opts.yTitle ? { display: true, text: opts.yTitle, font: { size: 10 } } : undefined
            },
            x: {
              grid: { display: false },
              ticks: { font: { size: 9 }, maxRotation: 45 },
              title: opts.xTitle ? { display: true, text: opts.xTitle, font: { size: 10 } } : undefined
            }
          }
        }
      });
    }

    barWithRef('chart-sicaklik', years2056, [16.2, 16.5, 16.8, 17.0, 17.2, 17.4, 17.6, 17.8, 18.0, 18.2, 18.4], '#81d4fa', {
      yTitle: 'Sıcaklık (°C)',
      xTitle: 'Yıllar',
      min: 10,
      max: 55,
      refLine: 41
    });
    barWithRef('chart-yagis', years2056, [72, 68, 75, 70, 65, 58, 52, 48, 55, 60, 62], '#00bcd4', {
      yTitle: 'Yağış',
      xTitle: 'Yıllar',
      min: 10,
      max: 100,
      refLine: 72
    });

    var suEl = document.getElementById('chart-su-pot');
    if (suEl) {
      destroyChart('chart-su-pot');
      charts['chart-su-pot'] = new Chart(suEl, {
        type: 'bar',
        data: {
          labels: yearsShort,
          datasets: [
            { label: 'RCP4.5', data: [72, 70, 68], backgroundColor: '#1565c0', borderRadius: 3 },
            { label: 'RCP8.5', data: [68, 64, 56], backgroundColor: '#43a047', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Hidrometeorolojik Rezerv', font: { size: 10 } }, grid: { color: '#eef2f7' } },
            x: { grid: { display: false }, title: { display: true, text: 'Yıllar', font: { size: 10 } } }
          }
        }
      });
    }

    function doughnut(id, value, color) {
      var el = document.getElementById(id);
      if (!el) return;
      destroyChart(id);
      charts[id] = new Chart(el, {
        type: 'doughnut',
        data: {
          labels: ['Değer', 'Kalan'],
          datasets: [{ data: [value, 100 - value], backgroundColor: [color, '#e8eef5'], borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
      });
    }
    doughnut('chart-gauge-45', 77, '#5c6bc0');
    doughnut('chart-gauge-85', 56, '#29b6f6');

    var degEl = document.getElementById('chart-degisim');
    if (degEl) {
      destroyChart('chart-degisim');
      charts['chart-degisim'] = new Chart(degEl, {
        type: 'bar',
        data: {
          labels: yearsShort,
          datasets: [
            { label: 'HadGEM2-ES', data: [70, 68, 65], backgroundColor: '#1565c0', borderRadius: 3 },
            { label: 'CNRM-CM5', data: [66, 62, 58], backgroundColor: '#43a047', borderRadius: 3 },
            { label: 'MPI-ESM-MR', data: [64, 60, 52], backgroundColor: '#c62828', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, max: 100, title: { display: true, text: 'Hidrometeorolojik Rezerv', font: { size: 10 } }, grid: { color: '#eef2f7' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    var meteoYears = [2026, 2030, 2035, 2040, 2045, 2050, 2055];
    var meteoAnk = [13.8, 14.0, 14.2, 14.5, 14.8, 15.1, 15.4];
    var meteoKon = [13.2, 13.4, 13.6, 13.9, 14.1, 14.4, 14.7];

    function nearestMeteoIndex(year) {
      var best = 0;
      var bestDiff = Infinity;
      for (var i = 0; i < meteoYears.length; i++) {
        var d = Math.abs(meteoYears[i] - year);
        if (d < bestDiff) {
          bestDiff = d;
          best = i;
        }
      }
      return best;
    }

    function updateMeteoZamansal(year) {
      year = Number(year) || 2040;
      var label = document.getElementById('m-time-year');
      if (label) label.textContent = String(year);
      var chart = charts['chart-meteo-zamansal'];
      if (!chart) return;
      var idx = nearestMeteoIndex(year);
      var radii = meteoYears.map(function (_, i) { return i === idx ? 6 : 3; });
      chart.data.datasets.forEach(function (ds) {
        ds.pointRadius = radii;
        ds.pointHoverRadius = radii.map(function (r) { return r + 1; });
      });
      chart.update('none');
    }

    var meteoEl = document.getElementById('chart-meteo-zamansal');
    if (meteoEl) {
      destroyChart('chart-meteo-zamansal');
      charts['chart-meteo-zamansal'] = new Chart(meteoEl, {
        type: 'line',
        data: {
          labels: meteoYears.map(String),
          datasets: [
            {
              label: 'ANK-01 Ort. Sıcaklık (°C)',
              data: meteoAnk.slice(),
              borderColor: '#e65100',
              backgroundColor: 'rgba(230,81,0,0.12)',
              tension: 0.25,
              fill: true,
              pointRadius: 3
            },
            {
              label: 'KON-04 Ort. Sıcaklık (°C)',
              data: meteoKon.slice(),
              borderColor: '#1565c0',
              backgroundColor: 'transparent',
              tension: 0.25,
              pointRadius: 3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { title: { display: true, text: '°C', font: { size: 10 } }, grid: { color: '#eef2f7' } },
            x: { grid: { display: false } }
          }
        }
      });
      var range = document.getElementById('m-time-range');
      if (range) {
        updateMeteoZamansal(range.value);
        range.addEventListener('input', function () {
          updateMeteoZamansal(range.value);
        });
      }
    }

    function comboRcp(id, barColor, lightColor) {
      var el = document.getElementById(id);
      if (!el) return;
      destroyChart(id);
      charts[id] = new Chart(el, {
        type: 'bar',
        data: {
          labels: decades,
          datasets: [
            { label: 'Toplam Kullanılabilir Su Rezervi · MPI-ESM-MR', data: [95, 88, 82, 78, 72, 68, 62, 58], backgroundColor: barColor, borderRadius: 2 },
            { label: 'Su Fazlası / Açığı · MPI-ESM-MR', data: [18, 12, 5, -2, -8, -12, -15, -18], backgroundColor: lightColor, borderRadius: 2 },
            { type: 'line', label: 'Toplam Su İhtiyacı', data: [42, 48, 55, 58, 60, 60, 61, 61], borderColor: '#212121', borderWidth: 2, pointRadius: 2, fill: false },
            { type: 'line', label: 'Sulama Suyu İhtiyacı', data: [28, 32, 38, 40, 42, 42, 43, 43], borderColor: '#2e7d32', borderWidth: 1.5, borderDash: [4, 3], pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            y: { grid: { color: '#eef2f7' }, title: { display: true, text: 'Su Miktarı (milyon m³/yıl ×1000)', font: { size: 10 } } },
            x: { grid: { display: false }, ticks: { font: { size: 8 }, maxRotation: 45 } }
          }
        }
      });
    }
    comboRcp('chart-rcp45', '#1565c0', '#90caf9');
    comboRcp('chart-rcp85', '#c62828', '#ef9a9a');

    var brutEl = document.getElementById('chart-brut-net');
    if (brutEl) {
      destroyChart('chart-brut-net');
      charts['chart-brut-net'] = new Chart(brutEl, {
        type: 'bar',
        data: {
          labels: periods30,
          datasets: [
            { label: 'RCP4.5 Brüt · MPI-ESM-MR', data: [118, 105, 92], backgroundColor: '#1565c0', borderRadius: 2 },
            { label: 'RCP4.5 Net · MPI-ESM-MR', data: [98, 88, 76], backgroundColor: '#90caf9', borderRadius: 2 },
            { label: 'RCP8.5 Brüt · MPI-ESM-MR', data: [110, 95, 78], backgroundColor: '#c62828', borderRadius: 2 },
            { label: 'RCP8.5 Net · MPI-ESM-MR', data: [90, 78, 62], backgroundColor: '#ef9a9a', borderRadius: 2 },
            { type: 'line', label: 'Toplam Su İhtiyacı', data: [60, 61, 62], borderColor: '#212121', borderWidth: 2, pointRadius: 3, fill: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Su Miktarı (milyon m³/yıl ×1000)', font: { size: 10 } }, grid: { color: '#eef2f7' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    var topEl = document.getElementById('chart-toplam');
    if (topEl) {
      destroyChart('chart-toplam');
      charts['chart-toplam'] = new Chart(topEl, {
        type: 'line',
        data: {
          labels: lineYears,
          datasets: [
            { label: 'MPI-ESM-MR · RCP4.5', data: [210, 205, 198, 192, 185, 180, 175, 170, 168], borderColor: '#1565c0', borderDash: [4, 3], borderWidth: 2, pointRadius: 2, fill: false },
            { label: 'MPI-ESM-MR · RCP8.5', data: [210, 200, 188, 175, 162, 150, 140, 128, 120], borderColor: '#c62828', borderDash: [2, 2], borderWidth: 2, pointRadius: 2, fill: false },
            { label: 'HadGEM2-ES · RCP8.5', data: [208, 198, 185, 172, 158, 145, 132, 122, 115], borderColor: '#ef6c00', borderWidth: 1.5, pointRadius: 0, fill: false },
            { label: 'DSİ Brüt Toplam Su Potansiyeli', data: lineYears.map(function () { return 210; }), borderColor: '#ff8f00', borderWidth: 3, pointRadius: 0, fill: false }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Su Miktarı (milyon m³/yıl ×1000)', font: { size: 10 } }, grid: { color: '#eef2f7' } },
            x: { grid: { display: false }, title: { display: true, text: 'Yıllar', font: { size: 10 } } }
          }
        }
      });
    }
  }

  function syncFrekansBitis() {
    var bas = document.getElementById('q-baslangic');
    var frekans = document.getElementById('q-frekans');
    var bitis = document.getElementById('q-bitis');
    if (!bas || !frekans || !bitis) return;
    var start = parseInt(bas.value, 10);
    var freq = parseInt(frekans.value, 10);
    if (isNaN(start) || isNaN(freq)) return;
    var end = start + freq;
    var found = false;
    for (var i = 0; i < bitis.options.length; i++) {
      if (parseInt(bitis.options[i].value, 10) === end) {
        bitis.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      var opt = document.createElement('option');
      opt.value = String(end);
      opt.textContent = String(end);
      opt.selected = true;
      bitis.appendChild(opt);
    }
    var label = document.getElementById('id-time-label');
    if (label) label.textContent = start + '–' + end;
    state.donem = start + '–' + end;
    var mapRange = document.getElementById('id-map-time-range');
    if (mapRange) {
      mapRange.min = String(start);
      mapRange.max = String(end);
      mapRange.value = String(end);
    }
    var cardDonem = document.getElementById('id-card-donem');
    if (cardDonem) cardDonem.textContent = start + '–' + end;
  }

  function wireMapTimeSlider() {
    var range = document.getElementById('id-map-time-range');
    var label = document.getElementById('id-time-label');
    var btn = document.getElementById('btn-zaman-gezgini');
    var slider = document.getElementById('id-map-time-slider');
    if (range && label) {
      range.addEventListener('input', function () {
        var start = range.min;
        var end = range.value;
        label.textContent = start + '–' + end;
        state.donem = start + '–' + end;
        setAktifSorgu();
        var tip = document.getElementById('id-sync-tip');
        if (tip) {
          tip.hidden = false;
          tip.textContent = 'Harita Zaman Gezgini: dönem ' + start + '–' + end + ' (mock).';
        }
      });
    }
    if (btn && slider) {
      btn.addEventListener('click', function () {
        slider.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        range && range.focus();
      });
    }
  }

  function applySorgula() {
    var model = document.getElementById('q-model');
    var senaryo = document.getElementById('q-senaryo');
    var alan = document.getElementById('q-alan');
    if (model) state.model = model.value;
    if (senaryo) state.senaryo = senaryo.value;
    if (alan) state.olcek = alan.value;
    syncFrekansBitis();
    setAktifSorgu();

    var filtered = state.olcek.indexOf('Türkiye') >= 0;
    document.getElementById('kpi-sicaklik').textContent = filtered ? '17,1' : '16,4';
    document.getElementById('kpi-yagis').textContent = filtered ? '860K' : '720K';
    document.getElementById('kpi-kurak').textContent = filtered ? '31' : '27';
    document.getElementById('kpi-tesis').textContent = filtered ? '48' : '12';
    initCharts();

    var tip = document.getElementById('id-sync-tip');
    if (tip) {
      tip.hidden = false;
      tip.textContent = 'Harita, liste ve grafikler sorgu sonucuna göre dinamik güncellendi (mock).';
    }
    showCard('havza-sakarya', { skipScroll: true });
  }

  function wireTabs() {
    document.querySelectorAll('.td-list-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tab = btn.getAttribute('data-tab');
        document.querySelectorAll('.td-list-tab').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        document.querySelectorAll('.td-list-panel').forEach(function (p) {
          p.hidden = p.getAttribute('data-panel') !== tab;
        });
      });
    });
  }

  function wireMapList() {
    document.querySelectorAll('.td-map-pin').forEach(function (pin) {
      pin.addEventListener('click', function () {
        showCard(pin.getAttribute('data-feature'));
      });
    });
    document.querySelectorAll('.td-card-close').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.closest('.td-info-card').hidden = true;
      });
    });
    document.querySelectorAll('.mock-table[data-link="map"] tbody').forEach(function (tbody) {
      tbody.addEventListener('click', function (e) {
        var tr = e.target.closest('tr[data-feature]');
        if (!tr) return;
        showCard(tr.getAttribute('data-feature'));
      });
    });
  }

  function wireChartsUi() {
    document.querySelectorAll('.td-chart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.td-chart-card');
        if (card) card.remove();
      });
    });
    var addBtn = document.getElementById('btn-add-chart');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var grid = document.getElementById('id-charts-grid');
        var note = document.createElement('div');
        note.className = 'td-chart-card';
        note.setAttribute('draggable', 'true');
        note.innerHTML =
          '<div class="td-chart-card-head"><strong>Yeni grafik (2026+)</strong>' +
          '<select class="form-select form-select-sm id-chart-var"><option>Değişken seç</option></select>' +
          '<button type="button" class="mock-btn mock-btn-sm td-chart-print">Yazdır</button>' +
          '<button type="button" class="mock-btn mock-btn-sm td-chart-remove">Kaldır</button></div>' +
          '<p class="mock-report-hint">İklim Başlıkları / Tablo-Grafik Oluştur ile eklendi (mock)</p>';
        grid.appendChild(note);
        note.querySelector('.td-chart-remove').addEventListener('click', function () {
          note.remove();
        });
        wireDrag(note);
      });
    }
    document.querySelectorAll('[data-add-chart]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tip = document.getElementById('id-sync-tip');
        if (tip) {
          tip.hidden = false;
          tip.textContent = '«' + btn.textContent.trim() + '» grafiği eklendi / odaklandı (mock · 2026+).';
        }
        var key = btn.getAttribute('data-add-chart');
        var card = document.querySelector('.td-chart-card[data-chart="' + key + '"]');
        if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
    document.querySelectorAll('.td-chart-card[draggable]').forEach(wireDrag);
  }

  function wireDrag(card) {
    var grid = document.getElementById('id-charts-grid');
    if (!grid || !card) return;
    card.addEventListener('dragstart', function (e) {
      card.classList.add('is-dragging');
      e.dataTransfer.setData('text/plain', 'chart');
    });
    card.addEventListener('dragend', function () {
      card.classList.remove('is-dragging');
    });
    grid.addEventListener('dragover', function (e) {
      e.preventDefault();
      var dragging = grid.querySelector('.is-dragging');
      var after = e.target.closest('.td-chart-card');
      if (!dragging || !after || dragging === after) return;
      var rect = after.getBoundingClientRect();
      var next = (e.clientY - rect.top) / rect.height > 0.5;
      grid.insertBefore(dragging, next ? after.nextSibling : after);
    });
  }

  function wireFilter() {
    var yenile = document.getElementById('btn-yenile');
    if (yenile) yenile.addEventListener('click', applySorgula);
    var temizle = document.getElementById('btn-temizle');
    if (temizle) {
      temizle.addEventListener('click', function () {
        ['f-havza', 'f-alt-havza', 'f-il', 'f-ilce', 'f-istasyon'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el && el.tomselect) el.tomselect.clear();
        });
        state.olcek = 'Türkiye Ölçeği';
        state.model = 'MPI-ESM-MR';
        state.senaryo = 'RCP8.5';
        state.donem = '2071–2100';
        var m = document.getElementById('q-model');
        var s = document.getElementById('q-senaryo');
        var a = document.getElementById('q-alan');
        if (m) m.value = 'MPI-ESM-MR';
        if (s) s.value = 'RCP8.5';
        if (a) a.value = 'Türkiye Geneli';
        applySorgula();
      });
    }
    var sorgula = document.getElementById('btn-sorgula');
    if (sorgula) sorgula.addEventListener('click', applySorgula);

    var bas = document.getElementById('q-baslangic');
    var frekans = document.getElementById('q-frekans');
    if (bas) bas.addEventListener('change', syncFrekansBitis);
    if (frekans) frekans.addEventListener('change', syncFrekansBitis);
  }

  function wireShortcuts() {
    document.querySelectorAll('.id-shortcut').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-shortcut');
        var ortalama = document.getElementById('q-ortalama');
        var alan = document.getElementById('q-alan');
        var senaryo = document.getElementById('q-senaryo');
        if (key === 'turkiye' && alan) alan.value = 'Türkiye Geneli';
        if (key === 'rcp85' && senaryo) senaryo.value = 'RCP8.5';
        if (key === 'ay' && ortalama) ortalama.value = 'Aylık';
        if (key === 'mevsim' && ortalama) ortalama.value = 'Mevsimlik';
        if (key === 'sicaklik') {
          var p = document.getElementById('q-param');
          if (p) p.value = 'Ortalama Sıcaklık';
        }
        if (key === 'yagis') {
          var p2 = document.getElementById('q-param');
          if (p2) p2.value = 'Toplam Yağış';
        }
        applySorgula();
      });
    });
  }

  function wireGrid() {
    var range = document.getElementById('f-grid');
    var val = document.getElementById('id-grid-val');
    var wrap = document.querySelector('.td-map-canvas-wrap');
    if (!range) return;
    function apply() {
      if (val) val.textContent = range.value;
      if (wrap) wrap.style.setProperty('--id-grid-w', range.value + 'px');
    }
    range.addEventListener('input', apply);
    apply();
  }

  function wireIstasyonSelectAll() {
    var el = document.getElementById('f-istasyon');
    if (!el) return;

    function stationValues() {
      var vals = [];
      for (var i = 0; i < el.options.length; i++) {
        var v = el.options[i].value;
        if (v && v !== 'tum') vals.push(v);
      }
      return vals;
    }

    function onChange() {
      var ts = el.tomselect;
      if (!ts) return;
      var vals = ts.getValue();
      if (!vals || vals.indexOf('tum') < 0) return;
      var all = stationValues();
      /* «Tüm İstasyonlar» → kapsam (havza/il/ilçe) altındaki tüm istasyonlar seçilir */
      ts.setValue(all, true);
      var tip = document.getElementById('id-sync-tip');
      if (tip) {
        tip.hidden = false;
        tip.textContent = 'Tüm İstasyonlar: seçili Havza / İl / İlçe kapsamındaki istasyonlar işaretlendi (mock).';
      }
    }

    function bind() {
      if (el.tomselect) {
        el.tomselect.on('item_add', function (value) {
          if (value === 'tum') onChange();
        });
        return;
      }
      el.addEventListener('change', onChange);
    }

    if (el.tomselect) {
      bind();
    } else {
      setTimeout(bind, 100);
      setTimeout(bind, 400);
    }
  }

  function wireLayers() {
    document.querySelectorAll('.td-legend input[data-layer]').forEach(function (cb) {
      cb.addEventListener('change', function () {});
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setAktifSorgu();
    initMap();
    initCharts();
    wireTabs();
    wireMapList();
    wireChartsUi();
    wireFilter();
    wireShortcuts();
    wireGrid();
    wireLayers();
    wireIstasyonSelectAll();
    wireMapTimeSlider();
    syncFrekansBitis();
    showCard('havza-sakarya', { skipScroll: true });
    var appBody = document.querySelector('.mock-app-body');
    if (appBody) appBody.scrollTop = 0;
    window.scrollTo(0, 0);
  });
})();
