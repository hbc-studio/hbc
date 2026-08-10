(function () {
  var EDIT_TYPES = [
    { id: 'ister', label: 'İster' },
    { id: 'kriter', label: 'Kabul kriterleri (ekle / değiştir)' },
    { id: 'meta', label: 'Method / Tablo / Menü' },
    { id: 'diger', label: 'Diğer' }
  ];

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function calismaId() {
    var c = window.TASK_HUB && window.TASK_HUB.calisma;
    return (c && c.id) || 'calisma';
  }

  function taskTitle(issue) {
    var h4 = issue.querySelector('h4');
    return h4 ? h4.textContent.trim() : 'Task';
  }

  function editTypeLabel(id) {
    for (var i = 0; i < EDIT_TYPES.length; i++) {
      if (EDIT_TYPES[i].id === id) return EDIT_TYPES[i].label;
    }
    return id;
  }

  function buildPrompt(issue, editType, editText) {
    var lines = [];
    lines.push(calismaId() + ' isler.html içinde «' + taskTitle(issue) + '» task kutusunu güncelle.');
    lines.push('');
    lines.push('Düzenleme türü: ' + editTypeLabel(editType));
    lines.push('İstenen değişiklik:');
    lines.push(editText);
    lines.push('');
    lines.push('Yalnızca bu task kutusunu güncelle; diğer task\'lara dokunma. Jira\'ya yapıştırmadan önce metni kontrol et.');
    return lines.join('\n');
  }

  function ensureModal() {
    var existing = document.getElementById('isler-edit-modal');
    if (existing && !existing.classList.contains('hbc-dialog-backdrop')) {
      existing.remove();
      existing = null;
    }
    if (existing) return;

    var opts = EDIT_TYPES.map(function (t) {
      return '<option value="' + t.id + '">' + t.label + '</option>';
    }).join('');

    document.body.insertAdjacentHTML(
      'beforeend',
      '<div class="hbc-dialog-backdrop" id="isler-edit-modal" hidden>' +
        '<div class="modal-card modal-card--cursor" role="dialog" aria-labelledby="isler-edit-title" aria-modal="true">' +
          '<h3 id="isler-edit-title">Task düzenleme — Cursor metni</h3>' +
          '<p class="modal-lead" id="isler-edit-task-name"></p>' +
          '<label class="modal-field"><span>Düzenleme türü</span>' +
            '<select id="isler-edit-type" class="modal-input">' + opts + '</select></label>' +
          '<label class="modal-field"><span>İstenen değişiklik</span>' +
            '<textarea id="isler-edit-text" class="modal-input" rows="4" placeholder="Örn. İster metnine filtre alanı ekle…"></textarea></label>' +
          '<label class="modal-field"><span>Cursor metni (önizleme)</span>' +
            '<textarea id="isler-edit-preview" class="modal-input modal-input--prompt" rows="8" readonly></textarea></label>' +
          '<div class="modal-actions">' +
            '<button type="button" class="modal-btn" id="isler-edit-close">Kapat</button>' +
            '<button type="button" class="modal-btn modal-btn-primary" id="isler-edit-copy">Panoya kopyala</button>' +
          '</div>' +
          '<p class="modal-hint" id="isler-edit-copied" hidden>Kopyalandı — Cursor sohbetine yapıştırın.</p>' +
        '</div>' +
      '</div>'
    );

    document.getElementById('isler-edit-close').addEventListener('click', closeModal);
    document.getElementById('isler-edit-copy').addEventListener('click', function () {
      var preview = document.getElementById('isler-edit-preview');
      if (!preview || !preview.value.trim()) return;
      copyText(preview.value).then(function () {
        var note = document.getElementById('isler-edit-copied');
        if (note) note.hidden = false;
      });
    });

    ['isler-edit-type', 'isler-edit-text'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', refreshPreview);
    });
  }

  var activeIssue = null;

  function refreshPreview() {
    if (!activeIssue) return;
    var type = document.getElementById('isler-edit-type').value;
    var text = document.getElementById('isler-edit-text').value.trim();
    document.getElementById('isler-edit-preview').value = text
      ? buildPrompt(activeIssue, type, text)
      : '';
  }

  function openModal(issue) {
    ensureModal();
    activeIssue = issue;
    document.getElementById('isler-edit-task-name').textContent = taskTitle(issue);
    document.getElementById('isler-edit-type').value = 'ister';
    document.getElementById('isler-edit-text').value = '';
    document.getElementById('isler-edit-preview').value = '';
    document.getElementById('isler-edit-copied').hidden = true;
    document.getElementById('isler-edit-modal').hidden = false;
    document.getElementById('isler-edit-text').focus();
  }

  function closeModal() {
    var modal = document.getElementById('isler-edit-modal');
    if (modal) modal.hidden = true;
    activeIssue = null;
  }

  function initEditButtons() {
    document.querySelectorAll('.issue-copy-toolbar').forEach(function (toolbar) {
      if (toolbar.querySelector('.issue-edit-btn')) return;
      var editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'issue-edit-btn';
      editBtn.textContent = 'Düzenle';
      toolbar.insertBefore(editBtn, toolbar.firstChild);
      editBtn.addEventListener('click', function () {
        var issue = toolbar.closest('.issue');
        if (issue) openModal(issue);
      });
    });
  }

  function init() {
    initEditButtons();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.TASK_ISLER_EDIT = { open: openModal, buildPrompt: buildPrompt };
})();
