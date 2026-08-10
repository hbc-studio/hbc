/**
 * Liste mockup — satır seçimi + Haritada Göster paneli (wireframe).
 */
(function () {
  var IL_POS = {
    'Adana': { left: 58, top: 72 },
    'Ankara': { left: 44, top: 40 },
    'Çanakkale': { left: 12, top: 38 },
    'Elazığ': { left: 72, top: 48 },
    'Kırıkkale': { left: 50, top: 38 },
    'Konya': { left: 48, top: 58 }
  };

  function el(id) {
    return document.getElementById(id);
  }

  function pinSvg() {
    return '<svg class="mock-list-map-pin" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';
  }

  function getCheckedRows(table) {
    return Array.prototype.slice.call(table.querySelectorAll('.mock-row-check:checked'));
  }

  function updateShowBtn(showBtn, table) {
    if (!showBtn) return;
    var n = getCheckedRows(table).length;
    showBtn.disabled = n === 0;
    showBtn.setAttribute('aria-disabled', n === 0 ? 'true' : 'false');
  }

  function syncSelectAll(table, selectAll) {
    if (!selectAll) return;
    var boxes = table.querySelectorAll('.mock-row-check');
    var checked = table.querySelectorAll('.mock-row-check:checked');
    selectAll.indeterminate = checked.length > 0 && checked.length < boxes.length;
    selectAll.checked = boxes.length > 0 && checked.length === boxes.length;
  }

  function renderMarkers(canvas, items) {
    var old = canvas.querySelector('.mock-list-map-markers');
    if (old) old.remove();
    var layer = document.createElement('div');
    layer.className = 'mock-list-map-markers';
    items.forEach(function (item, i) {
      if (!item.il || !IL_POS[item.il]) return;
      var pos = IL_POS[item.il];
      var m = document.createElement('div');
      m.className = 'mock-list-map-marker';
      m.style.left = pos.left + '%';
      m.style.top = pos.top + '%';
      m.title = item.label;
      m.innerHTML = pinSvg();
      layer.appendChild(m);
    });
    canvas.appendChild(layer);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderAside(aside, listTitle, items) {
    aside.innerHTML =
      '<div class="mock-list-map-aside__title">' + escapeHtml(listTitle) + '</div>' +
      '<ul class="mock-list-map-aside__list">' +
      items.map(function (item) {
        var sub = item.sub ? '<span>' + escapeHtml(item.sub) + '</span>' : '';
        return '<li>' + (item.il ? pinSvg() : '') + '<div><strong>' + escapeHtml(item.label) + '</strong>' + sub + '</div></li>';
      }).join('') +
      '</ul>';
  }

  function openPanel(panel, aside, canvas, listTitle, items) {
    renderAside(aside, listTitle, items);
    renderMarkers(canvas, items);
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
  }

  function closePanel(panel) {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
  }

  function bindTable(table, showBtn, selectAll, onSelectionChange) {
    table.addEventListener('change', function (e) {
      if (e.target.classList.contains('mock-row-check') || e.target.classList.contains('mock-row-check-all')) {
        if (e.target.classList.contains('mock-row-check-all')) {
          var on = e.target.checked;
          table.querySelectorAll('.mock-row-check').forEach(function (cb) {
            cb.checked = on;
          });
        }
        syncSelectAll(table, selectAll);
        updateShowBtn(showBtn, table);
        if (onSelectionChange) onSelectionChange();
      }
    });
  }

  function collectItems(checkboxes) {
    return checkboxes.map(function (cb) {
      return {
        label: cb.getAttribute('data-map-label') || 'Kayıt',
        sub: cb.getAttribute('data-map-sub') || '',
        il: cb.getAttribute('data-map-il') || ''
      };
    });
  }

  function init(opts) {
    opts = opts || {};
    var panel = el(opts.panelId || 'mock-list-map-panel');
    var showBtn = el(opts.showBtnId || 'mock-list-map-show');
    var closeBtn = el(opts.closeBtnId || 'mock-list-map-close');
    var aside = el(opts.asideId || 'mock-list-map-aside');
    var canvas = el(opts.canvasId || 'mock-list-map-canvas');
    var selectAll = el(opts.selectAllId || 'mock-select-all');
    var table = document.querySelector(opts.tableSelector || '.mock-list-map-table');
    var listTitle = opts.listTitle || 'Seçilen kayıtlar';

    if (!panel || !showBtn || !table) return;

    bindTable(table, showBtn, selectAll);

    showBtn.addEventListener('click', function () {
      var items = collectItems(getCheckedRows(table));
      if (!items.length) return;
      openPanel(panel, aside, canvas, listTitle, items);
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closePanel(panel);
      });
    }

    function sync() {
      updateShowBtn(showBtn, table);
      syncSelectAll(table, selectAll);
    }

    sync();

    window.MOCK_LIST_MAP = window.MOCK_LIST_MAP || {};
    window.MOCK_LIST_MAP.sync = sync;
    window.MOCK_LIST_MAP.init = init;
  }

  if (!window.MOCK_LIST_MAP) {
    window.MOCK_LIST_MAP = { init: init };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('[data-mock-list-map]').forEach(function (node) {
        init({
          listTitle: node.getAttribute('data-mock-list-map') || 'Seçilen kayıtlar',
          tableSelector: '#' + (node.getAttribute('data-map-table') || 'mock-list-map-table')
        });
      });
    });
  }
})();
