(function () {
  var ozel = window.OZEL_HUKUMLAR || [];
  var tbody = document.getElementById('hukumler-tbody');
  var countEl = document.getElementById('hukumler-count');

  if (!tbody) return;

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  function cell(v) {
    return v ? escapeHtml(v) : '<span class="mock-td-empty">—</span>';
  }

  function mapAttrs(r) {
    var label = r.madde_no || r.sektor || 'Özel hüküm';
    var sub = [r.il, r.ada_parsel].filter(Boolean).join(' — ');
    return ' data-map-label="' + escapeHtml(label) + '"' +
      (sub ? ' data-map-sub="' + escapeHtml(sub) + '"' : '') +
      (r.il ? ' data-map-il="' + escapeHtml(r.il) + '"' : '');
  }

  function render() {
    tbody.innerHTML = ozel.map(function (r) {
      var href = 'hukumler-form.html?ornek=' + encodeURIComponent(r.id);
      return '<tr>' +
        '<td class="mock-td-check"><input type="checkbox" class="form-check-input mock-row-check"' + mapAttrs(r) + ' aria-label="Satırı seç" /></td>' +
        '<td class="mock-td-yonetmelik" title="' + escapeHtml(r.yonetmelik || '') + '">' + cell(r.yonetmelik) + '</td>' +
        '<td>' + cell(r.icme_suyu_havzasi) + '</td>' +
        '<td>' + cell(r.il) + '</td>' +
        '<td>' + cell(r.ada_parsel) + '</td>' +
        '<td>' + escapeHtml(r.koruma_alani) + '</td>' +
        '<td>' + escapeHtml(r.sektor) + '</td>' +
        '<td>' + escapeHtml(r.madde_no) + '</td>' +
        '<td class="mock-td-madde" title="' + escapeHtml(r.madde_icerik) + '">' + escapeHtml(truncate(r.madde_icerik, 80)) + '</td>' +
        '<td><a href="' + href + '" class="mock-icon-btn" title="Düzenle" aria-label="Düzenle">' +
        '<svg class="mock-icon-svg" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></a></td>' +
        '</tr>';
    }).join('');
    if (countEl) countEl.textContent = 'Toplam ' + ozel.length + ' kayıt';
    if (window.MOCK_LIST_MAP && window.MOCK_LIST_MAP.sync) {
      window.MOCK_LIST_MAP.sync();
    }
  }

  render();
})();
