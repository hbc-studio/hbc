(function () {
  var COLORS = ['#1a5fb4', '#66bb6a', '#ffa726', '#ab47bc', '#78909c', '#ef5350', '#26a69a', '#8d6e63'];

  function initPie(canvasId, labels, data) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    return new Chart(el, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: COLORS.slice(0, labels.length),
          borderWidth: 1,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } }
      }
    });
  }

  function initBarH(canvasId, labels, data) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    return new Chart(el, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Ortalama Not',
          data: data,
          backgroundColor: '#42a5f5',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { min: 0, max: 100, grid: { color: '#eef2f7' } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function initBarV(canvasId, labels, data, datasetLabel) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    return new Chart(el, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: datasetLabel || 'Değer',
          data: data,
          backgroundColor: '#42a5f5',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { color: '#eef2f7' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  function initLine(canvasId, labels, data, opts) {
    var el = document.getElementById(canvasId);
    if (!el || typeof Chart === 'undefined') return;
    var yScale = (opts && opts.openY)
      ? { beginAtZero: true, grid: { color: '#eef2f7' } }
      : { min: 0, max: 100, grid: { color: '#eef2f7' } };
    return new Chart(el, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: (opts && opts.label) || 'Not Ortalaması',
          data: data,
          borderColor: '#1a5fb4',
          backgroundColor: 'rgba(26, 95, 180, 0.08)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#1a5fb4',
          fill: true,
          tension: 0.35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: yScale,
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 0, font: { size: 10 } } }
        }
      }
    });
  }

  function initOgrenciRaporlari() {
    initPie('chart-sinif-pie', ['9-A', '9-B', '10-A', '10-B', 'Diğer'], [78, 74, 81, 76, 72]);
    initBarH('chart-ogretmen-bar', ['Ayşe Yılmaz', 'Mehmet Kaya', 'Berna Yıldız', 'Ahmet Kaya', 'Can Öztürk'], [88, 82, 79, 75, 71]);
    initLine(
      'chart-ogrenci-line',
      ['Ali V.', 'Elif D.', 'Can T.', 'Zeynep A.', 'Burak K.', 'Deniz Y.', 'Ece M.', 'Mert S.', 'Selin A.', 'Kaan Ö.', 'İrem K.', 'Oğuz H.', 'Yasin T.', 'Defne L.', 'Arda C.'],
      [72, 85, 78, 91, 68, 80, 74, 88, 83, 76, 90, 70, 86, 79, 84]
    );
  }

  function initIklimDashboard() {
    initPie('chart-iklim-pie', ['Sakarya', 'Kızılırmak', 'Yeşilırmak', 'Gediz', 'Fırat-Dicle'], [20, 9, 6, 7, 6]);
    initBarV('chart-iklim-bar', ['Ankara', 'Bursa', 'Konya', 'İzmir', 'Adana', 'Antalya'], [13.2, 14.8, 15.1, 16.4, 17.8, 18.2], 'Ort. Sıcaklık (‘C)');
    initLine(
      'chart-iklim-line',
      ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
      [98, 86, 112, 145, 168, 92, 48, 36, 74, 128, 156, 134],
      { openY: true, label: 'Yağış (m3 ×1000)' }
    );
  }

  function initKuraklikDashboard() {
    initBarV(
      'chart-kuraklik-bar',
      ['Sakarya', 'Kızılırmak', 'Yeşilırmak', 'Gediz', 'B. Menderes', 'Fırat-Dicle'],
      [548, 412, 720, 635, 598, 465],
      'Yıllık yağış (mm)'
    );
    initPie('chart-kuraklik-pie', ['Düşük', 'Orta', 'Yüksek', 'Çok yüksek'], [18, 42, 28, 12]);
    initLine(
      'chart-kuraklik-line',
      ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
      [62, 54, 71, 88, 96, 48, 22, 18, 41, 78, 90, 74],
      { openY: true, label: 'Yağış (mm)' }
    );
  }

  window.MOCK_REPORT_CHARTS = {
    initPie: initPie,
    initBarH: initBarH,
    initBarV: initBarV,
    initLine: initLine,
    initOgrenciRaporlari: initOgrenciRaporlari,
    initIklimDashboard: initIklimDashboard,
    initKuraklikDashboard: initKuraklikDashboard
  };

  function boot() {
    if (document.getElementById('chart-sinif-pie')) initOgrenciRaporlari();
    if (document.getElementById('chart-iklim-pie')) initIklimDashboard();
    if (document.getElementById('chart-kuraklik-bar')) initKuraklikDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
