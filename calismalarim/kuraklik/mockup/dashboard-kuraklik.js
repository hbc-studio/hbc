/**
 * Kuraklık Yönetimi Dashboard — harita↔liste↔grafik senkron
 * SPI 6 ay · 11 sınıf lejant · MGM girdi · KPI → filtre → harita → listeler → grafikler
 */
(function () {
  var charts = {};
  var activeFeature = 'havza-burdur';

  function destroyChart(id) {
    if (charts[id]) {
      charts[id].destroy();
      delete charts[id];
    }
  }

  function yearSeries(from, to, step, fn) {
    var labels = [];
    var data = [];
    for (var y = from; y <= to; y += step) {
      labels.push(String(y));
      data.push(fn(y));
    }
    return { labels: labels, data: data };
  }

  function barLineChart(canvasId, labels, data, yTitle, color, lineVal) {
    destroyChart(canvasId);
    var el = document.getElementById(canvasId);
    if (!el) return;
    charts[canvasId] = new Chart(el, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: yTitle, data: data, backgroundColor: color, borderRadius: 2, order: 2 },
          {
            type: 'line',
            label: 'Ortalama',
            data: labels.map(function () { return lineVal; }),
            borderColor: '#e53935',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            order: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { title: { display: true, text: yTitle, font: { size: 10 } }, beginAtZero: true, grid: { color: '#eef2f7' } },
          x: { title: { display: true, text: 'Yıllar', font: { size: 10 } }, grid: { display: false }, ticks: { font: { size: 9 } } }
        }
      }
    });
  }

  function featureMeta(feature) {
    if (feature === 'althavza-akgol') {
      return { label: 'Akgöl Alt Havza', scope: 'althavza', yagis: 14, sicaklik: 16, factor: 0.92 };
    }
    return { label: 'Burdur Havzası', scope: 'havza', yagis: 15, sicaklik: 15, factor: 1 };
  }

  function syncChartsToFeature(feature) {
    var meta = featureMeta(feature);
    var tip = document.getElementById('id-sync-tip');
    if (tip) {
      tip.hidden = false;
      tip.textContent = 'Seçim: ' + meta.label + ' — harita, liste ve grafikler senkron (mock).';
    }
    var kpiY = document.getElementById('kpi-yagis');
    var kpiS = document.getElementById('kpi-sicaklik');
    if (kpiY) kpiY.textContent = String(meta.yagis);
    if (kpiS) kpiS.textContent = String(meta.sicaklik);

    function scaleDataset(id, base) {
      if (!charts[id] || !charts[id].data || !charts[id].data.datasets[0]) return;
      charts[id].data.datasets[0].data = base.map(function (v) {
        return Math.round(v * meta.factor * 10) / 10;
      });
      charts[id].update('none');
    }

    var y80 = yearSeries(1980, 2025, 5, function (y) {
      return 55 + Math.round(20 * Math.sin((y - 1980) / 8) + (y % 5) * 2);
    }).data;
    var t90 = yearSeries(1990, 2025, 5, function (y) {
      return 12 + Math.round((y - 1990) * 0.08 + (y % 7) * 0.3);
    }).data;
    var y90 = yearSeries(1990, 2025, 5, function (y) {
      return 50 + Math.round(18 * Math.sin((y - 1990) / 7) + (y % 4) * 2);
    }).data;

    scaleDataset('chart-kd-ulke-yagis', y80);
    scaleDataset('chart-kd-ulke-sicaklik', t90);
    scaleDataset('chart-kd-havza-sicaklik', t90);
    scaleDataset('chart-kd-havza-yagis', y90);
    scaleDataset('chart-kd-althavza-sicaklik', t90);
    scaleDataset('chart-kd-althavza-yagis', y90);
    scaleDataset('chart-kd-il-sicaklik', t90);
    scaleDataset('chart-kd-il-yagis', y90);

    if (charts['chart-kd-aylik-yagis']) {
      var aylikBase = [42, 118, 245, 360, 510];
      charts['chart-kd-aylik-yagis'].data.datasets[0].data = aylikBase.map(function (v) {
        return Math.round(v * meta.factor);
      });
      charts['chart-kd-aylik-yagis'].update('none');
    }

    if (charts['chart-kd-kyp']) {
      charts['chart-kd-kyp'].data.datasets[0].data = meta.scope === 'althavza'
        ? [40, 55, 60, 30, 48]
        : [50, 70, 70, 35, 55];
      charts['chart-kd-kyp'].data.datasets[1].data = meta.scope === 'althavza'
        ? [25, 30, 15, 12, 18]
        : [30, 40, 10, 10, 20];
      charts['chart-kd-kyp'].update('none');
    }

    document.querySelectorAll('.td-chart-card[data-chart]').forEach(function (card) {
      var key = card.getAttribute('data-chart') || '';
      var highlight =
        (meta.scope === 'havza' && (key.indexOf('havza') === 0 || key === 'baraj' || key === 'kyp' || key === 'tedbir-25')) ||
        (meta.scope === 'althavza' && key.indexOf('althavza') === 0);
      card.classList.toggle('is-sync-focus', highlight);
    });
  }

  function showCard(feature, opts) {
    opts = opts || {};
    activeFeature = feature;
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
        var panel = tr.closest('.td-list-panel');
        if (panel && !panel.hidden) {
          tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    });
    syncChartsToFeature(feature);
  }

  function initMap() {
    var MAP = window.MOCK_GEO_MAP;
    if (!MAP || !MAP.init) return;
    /* SPI 11 sınıf örnek renkleri (MGM girdi — mock) */
    var spiColors = {
      '06': '#ffeb3b',
      '34': '#aed581',
      '35': '#ff9800',
      '15': '#e53935',
      '07': '#66bb6a',
      '42': '#ff9800',
      '01': '#ffeb3b',
      '16': '#aed581',
      '55': '#2e7d32',
      '25': '#6d4c41',
      '31': '#1e88e5'
    };
    MAP.init('#harita-kuraklik', {
      templateId: 'geo-map-turkiye',
      kapsam: 'turkiye',
      hideLabels: false,
      defaultFill: '#f5f5f5',
      colors: spiColors,
      legend: false,
      legendLabel: 'SPI (11 sınıf) · 6 ay',
      onClick: function () {
        showCard('havza-burdur');
      }
    });
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;

    destroyChart('chart-kd-baraj');
    var baraj = document.getElementById('chart-kd-baraj');
    if (baraj) {
      charts['chart-kd-baraj'] = new Chart(baraj, {
        type: 'bar',
        data: {
          labels: ['Selevir Barajı', 'Çay Barajı', 'Kırca Barajı', 'Seyitler Barajı'],
          datasets: [
            { label: 'Baraj Doluluk Oranı', data: [72, 58, 81, 45], backgroundColor: '#fbc02d', borderRadius: 3 },
            { label: 'Güncel Seviye', data: [64, 50, 70, 38], backgroundColor: '#1e88e5', borderRadius: 3 },
            { label: 'Aktif Hacim', data: [40, 35, 55, 28], backgroundColor: '#e53935', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: { color: '#eef2f7' } },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          }
        }
      });
    }

    destroyChart('chart-kd-aylik-yagis');
    var aylik = document.getElementById('chart-kd-aylik-yagis');
    if (aylik) {
      charts['chart-kd-aylik-yagis'] = new Chart(aylik, {
        type: 'bar',
        data: {
          labels: ['1 Ay', '3 Ay', '6 Ay', '9 Ay', '12 Ay'],
          datasets: [{ label: 'Ortalama Yağış (mm)', data: [42, 118, 245, 360, 510], backgroundColor: '#26c6da', borderRadius: 3 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#eef2f7' }, title: { display: true, text: 'Yağış (mm)', font: { size: 10 } } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    var y80 = yearSeries(1980, 2025, 5, function (y) {
      return 55 + Math.round(20 * Math.sin((y - 1980) / 8) + (y % 5) * 2);
    });
    var t90 = yearSeries(1990, 2025, 5, function (y) {
      return 12 + Math.round((y - 1990) * 0.08 + (y % 7) * 0.3);
    });
    var y90 = yearSeries(1990, 2025, 5, function (y) {
      return 50 + Math.round(18 * Math.sin((y - 1990) / 7) + (y % 4) * 2);
    });

    barLineChart('chart-kd-ulke-yagis', y80.labels, y80.data, 'Yağış', '#26c6da', 72);
    barLineChart('chart-kd-ulke-sicaklik', t90.labels, t90.data, 'Sıcaklık', '#90caf9', 18);
    barLineChart('chart-kd-havza-sicaklik', t90.labels, t90.data.map(function (v) { return v - 0.4; }), 'Sıcaklık', '#64b5f6', 17.5);
    barLineChart('chart-kd-havza-yagis', y90.labels, y90.data, 'Yağış', '#4dd0e1', 68);
    barLineChart('chart-kd-althavza-sicaklik', t90.labels, t90.data.map(function (v) { return v + 0.3; }), 'Sıcaklık', '#81d4fa', 18.2);
    barLineChart('chart-kd-althavza-yagis', y90.labels, y90.data.map(function (v) { return v - 5; }), 'Yağış', '#00acc1', 64);
    barLineChart('chart-kd-il-sicaklik', t90.labels, t90.data.map(function (v) { return v + 0.6; }), 'Sıcaklık', '#42a5f5', 18.5);
    barLineChart('chart-kd-il-yagis', y90.labels, y90.data.map(function (v) { return v + 3; }), 'Yağış', '#0097a7', 70);

    destroyChart('chart-kd-havza-alan');
    var alan = document.getElementById('chart-kd-havza-alan');
    if (alan) {
      charts['chart-kd-havza-alan'] = new Chart(alan, {
        type: 'bar',
        data: {
          labels: ['Marmara', 'Antalya', 'Burdur', 'Konya Kapalı'],
          datasets: [
            { label: 'Yüzölçümü', data: [85, 62, 48, 90], backgroundColor: '#43a047', borderRadius: 3 },
            { label: 'Orman Alanı', data: [40, 55, 28, 35], backgroundColor: '#fbc02d', borderRadius: 3 },
            { label: 'Nüfus', data: [95, 50, 30, 45], backgroundColor: '#ec407a', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: { color: '#eef2f7' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    destroyChart('chart-kd-tedbir-25');
    var t25 = document.getElementById('chart-kd-tedbir-25');
    if (t25) {
      var havzalar = ['Marmara', 'Susurluk', 'Kuzey Ege', 'Gediz', 'Küçük Menderes', 'Büyük Menderes', 'Batı Akdeniz', 'Antalya', 'Doğu Akdeniz', 'Seyhan', 'Ceyhan', 'Asi', 'Fırat-Dicle', 'Doğu Karadeniz', 'Batı Karadeniz', 'Yeşilırmak', 'Kızılırmak', 'Sakarya', 'Akarçay', 'Konya Kapalı', 'Van Kapalı', 'Aras', 'Çoruh', 'Meriç-Ergene', 'Burdur'];
      charts['chart-kd-tedbir-25'] = new Chart(t25, {
        type: 'bar',
        data: {
          labels: havzalar,
          datasets: [
            { label: 'Tedbir Sayısı', data: havzalar.map(function (_, i) { return 40 + (i * 3) % 55; }), backgroundColor: '#1e88e5', borderRadius: 2 },
            { label: 'Veri Girişi Yapılmış', data: havzalar.map(function (_, i) { return 15 + (i * 5) % 40; }), backgroundColor: '#43a047', borderRadius: 2 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#eef2f7' } },
            x: { grid: { display: false }, ticks: { font: { size: 8 }, maxRotation: 60, minRotation: 45 } }
          }
        }
      });
    }

    destroyChart('chart-kd-kyp');
    var kyp = document.getElementById('chart-kd-kyp');
    if (kyp) {
      charts['chart-kd-kyp'] = new Chart(kyp, {
        type: 'bar',
        data: {
          labels: ['Akarçay', 'Seyhan', 'Aras', 'Marmara', 'Burdur'],
          datasets: [
            { label: 'Veri Girişi Yapılmış', data: [50, 70, 70, 35, 55], backgroundColor: '#1e88e5', borderRadius: 3 },
            { label: 'Veri Girişi Yapılmamış', data: [30, 40, 10, 10, 20], backgroundColor: '#e53935', borderRadius: 3 }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 10 } } } },
          scales: {
            y: { beginAtZero: true, max: 100, grid: { color: '#eef2f7' } },
            x: { grid: { display: false }, ticks: { font: { size: 9 } } }
          }
        }
      });
    }

    syncChartsToFeature(activeFeature);
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
        showCard(activeFeature, { skipScroll: false });
      });
    });
  }

  function wireCombos() {
    function bindSelect(id, titleId, viewAttr) {
      var sel = document.getElementById(id);
      var title = document.getElementById(titleId);
      if (!sel) return;
      sel.addEventListener('change', function () {
        var v = sel.value;
        if (title) title.textContent = sel.options[sel.selectedIndex].text;
        document.querySelectorAll('[' + viewAttr + ']').forEach(function (w) {
          w.hidden = w.getAttribute(viewAttr) !== v;
        });
        showCard(activeFeature, { skipScroll: true });
      });
    }
    bindSelect('sw-kuraklik-sayi', 'kd-sayi-title', 'data-sayi-view');
    bindSelect('sw-alan-nufus', 'kd-alan-title', 'data-alan-view');
    bindSelect('sw-tedbir-sayi', 'kd-tedbir-title', 'data-tedbir-view');
    bindSelect('sw-tedbir-durum', 'kd-durum-title', 'data-durum-view');
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

  function wireFilter() {
    function refresh() {
      initCharts();
      showCard(activeFeature, { skipScroll: true });
      var tip = document.getElementById('id-sync-tip');
      if (tip) {
        tip.hidden = false;
        tip.textContent = 'Harita, liste ve grafikler sorgu sonucuna göre senkron güncellendi (mock).';
      }
    }
    var yenile = document.getElementById('btn-yenile');
    if (yenile) yenile.addEventListener('click', refresh);

    var tabloGrafik = document.getElementById('btn-tablo-grafik');
    if (tabloGrafik) {
      tabloGrafik.addEventListener('click', function () {
        refresh();
        var card = document.getElementById('chart-card-aylik-yagis');
        if (card) {
          card.classList.add('is-highlight');
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function () { card.classList.remove('is-highlight'); }, 1600);
        }
      });
    }

    var temizle = document.getElementById('btn-temizle');
    if (temizle) {
      temizle.addEventListener('click', function () {
        ['f-havza', 'f-alt-havza', 'f-il', 'f-ilce'].forEach(function (id) {
          var el = document.getElementById(id);
          if (!el) return;
          if (el.tomselect) el.tomselect.clear();
        });
        var t = document.getElementById('f-tarih');
        var b = document.getElementById('f-baslangic');
        var e = document.getElementById('f-bitis');
        if (t) t.value = '';
        if (b) b.value = '';
        if (e) e.value = '';
        activeFeature = 'havza-burdur';
        refresh();
      });
    }
  }

  function wireMapTimeSlider() {
    var range = document.getElementById('id-map-time-range');
    var label = document.getElementById('id-time-label');
    var btn = document.getElementById('btn-zaman-gezgini');
    var slider = document.getElementById('id-map-time-slider');
    if (range && label) {
      range.addEventListener('input', function () {
        label.textContent = range.value;
        showCard(activeFeature, { skipScroll: true });
      });
    }
    if (btn && slider) {
      btn.addEventListener('click', function () {
        slider.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (range) range.focus();
      });
    }
  }

  function wireLegendLayers() {
    document.querySelectorAll('#id-legend input[data-layer]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var layer = cb.getAttribute('data-layer');
        var on = cb.checked;
        if (layer === 'havza') {
          document.querySelectorAll('.td-map-pin[data-feature^="havza-"]').forEach(function (p) {
            p.hidden = !on;
          });
        }
        if (layer === 'althavza') {
          document.querySelectorAll('.td-map-pin[data-feature^="althavza-"]').forEach(function (p) {
            p.hidden = !on;
          });
        }
        var tip = document.getElementById('id-sync-tip');
        if (tip) {
          tip.hidden = false;
          tip.textContent = 'Lejant katmanı güncellendi: ' + layer + (on ? ' açık' : ' kapalı') + ' (mock).';
        }
      });
    });
  }

  function wireSutun() {
    var btn = document.getElementById('btn-sutun');
    if (!btn) return;
    btn.addEventListener('click', function () {
      document.querySelectorAll('.kd-col-extra').forEach(function (el) {
        el.hidden = !el.hidden;
      });
    });
  }

  function wireFreq() {
    document.querySelectorAll('.kd-freq-btns').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var b = e.target.closest('.mock-btn');
        if (!b) return;
        group.querySelectorAll('.mock-btn').forEach(function (x) {
          x.classList.toggle('is-active', x === b);
        });
        showCard(activeFeature, { skipScroll: true });
      });
    });
  }

  function wireChartsLayout() {
    function wireDrag(card) {
      card.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', card.getAttribute('data-chart'));
        card.classList.add('is-dragging');
      });
      card.addEventListener('dragend', function () {
        card.classList.remove('is-dragging');
      });
    }

    document.querySelectorAll('.td-chart-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var card = btn.closest('.td-chart-card');
        if (card) card.remove();
      });
    });

    var addBtn = document.getElementById('btn-chart-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var grid = document.getElementById('id-charts-grid');
        if (!grid) return;
        var note = document.createElement('div');
        note.className = 'td-chart-card';
        note.setAttribute('draggable', 'true');
        note.setAttribute('data-chart', 'ek-' + Date.now());
        note.innerHTML =
          '<div class="td-chart-card-head"><strong>Yeni grafik (mock)</strong>' +
          '<button type="button" class="mock-btn mock-btn-sm td-chart-remove">Kaldır</button></div>' +
          '<p class="mock-report-hint" style="padding:0.75rem">Filtreye göre eklenecek grafik alanı.</p>';
        note.querySelector('.td-chart-remove').addEventListener('click', function () {
          note.remove();
        });
        wireDrag(note);
        grid.appendChild(note);
      });
    }

    document.querySelectorAll('.td-chart-card[draggable]').forEach(wireDrag);

    var grid = document.getElementById('id-charts-grid');
    if (grid) {
      grid.addEventListener('dragover', function (e) {
        e.preventDefault();
        var dragging = document.querySelector('.td-chart-card.is-dragging');
        var over = e.target.closest('.td-chart-card');
        if (!dragging || !over || over === dragging) return;
        var rect = over.getBoundingClientRect();
        var before = e.clientY < rect.top + rect.height / 2;
        grid.insertBefore(dragging, before ? over : over.nextSibling);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMap();
    initCharts();
    wireTabs();
    wireCombos();
    wireMapList();
    wireFilter();
    wireMapTimeSlider();
    wireLegendLayers();
    wireSutun();
    wireFreq();
    wireChartsLayout();
    showCard('havza-burdur', { skipScroll: true });
  });
})();
