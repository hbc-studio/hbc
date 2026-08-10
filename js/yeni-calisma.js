(function () {
  var API = 'http://localhost:3177';

  function trSlug(text) {
    var map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', Ç: 'c', Ğ: 'g', İ: 'i', Ö: 'o', Ş: 's', Ü: 'u' };
    return String(text || '')
      .trim()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, function (c) { return map[c] || c; })
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');
  }

  function buildCursorPrompt(slug, label, desc, menuYer) {
    var yer = menuYer === 'ust' ? 'üst' : 'sol';
    return (
      'calismalarim altında "' + slug + '" adında yeni çalışma oluştur.\n' +
      'Görünen ad: ' + label + '\n' +
      'Amaç: ' + desc + '\n' +
      'Mockup uygulama menüsü: ' + yer + (yer === 'üst' ? ' (yatay üst çubuk, mock-app-shell--menu-ust)' : ' (sol dikey çubuk)') + '\n' +
      'Boş şablon (index.html, isler.html, mockup klasörü, mock-shell.css; Bootstrap repo kökü assets\'ten) ve Çalışmalarım listesine ekle. Mockup henüz yok.'
    );
  }

  function getMenuYer() {
    var checked = document.querySelector('input[name="yc-menu-yer"]:checked');
    return checked && checked.value === 'ust' ? 'ust' : 'sol';
  }

  function ensureModal() {
    var existing = document.getElementById('yeni-calisma-modal');
    if (existing && !existing.classList.contains('hbc-dialog-backdrop')) {
      existing.remove();
      existing = null;
    }
    if (existing) return;

    var html =
      '<div class="hbc-dialog-backdrop" id="yeni-calisma-modal" hidden>' +
      '  <div class="modal-card" role="dialog" aria-labelledby="yeni-calisma-title">' +
      '    <h3 id="yeni-calisma-title">Yeni çalışma</h3>' +
      '    <p class="modal-hint">Çalışma adı ve amacını girin. Klasör sizin için oluşturulur; amaç özet sayfasında görünür.</p>' +
      '    <form id="yeni-calisma-form">' +
      '      <label class="modal-field"><span>Görünen ad *</span><input type="text" id="yc-label" required placeholder="Örn. Kullanıcılar" autocomplete="off" /></label>' +
      '      <label class="modal-field"><span>Klasör adı *</span><input type="text" id="yc-slug" required placeholder="kullanicilar" pattern="[a-z][a-z0-9_]*" autocomplete="off" /><small>Küçük harf, rakam, alt çizgi</small></label>' +
      '      <label class="modal-field"><span>Çalışmanın amacı *</span><textarea id="yc-desc" required rows="3" placeholder="Bu çalışma neyi hedefliyor? Örn. Okul yönetiminde sınıf kayıtlarını dijitalleştirmek."></textarea></label>' +
      '      <div class="modal-field--choice">' +
      '        <span>Mockup menüsü nerede olsun? *</span>' +
      '        <div class="modal-choice-group">' +
      '          <label class="modal-radio"><input type="radio" name="yc-menu-yer" value="sol" checked /> Sol (dikey)</label>' +
      '          <label class="modal-radio"><input type="radio" name="yc-menu-yer" value="ust" /> Üst (yatay)</label>' +
      '        </div>' +
      '        <small>Müşteriye gösterilecek uygulama menüsünün mockup içindeki konumu.</small>' +
      '      </div>' +
      '      <p class="modal-error" id="yc-error" hidden></p>' +
      '      <div class="modal-actions">' +
      '        <button type="button" class="modal-btn" id="yc-cancel">İptal</button>' +
      '        <button type="submit" class="modal-btn modal-btn-primary" id="yc-submit">Oluştur</button>' +
      '      </div>' +
      '    </form>' +
      '    <div id="yc-fallback" hidden>' +
      '      <p class="modal-ok">Metin panoya kopyalandı. Cursor sohbetine <strong>Ctrl+V</strong> ile yapıştırın.</p>' +
      '      <pre class="prompt-box" id="yc-prompt-text"></pre>' +
      '      <button type="button" class="modal-btn modal-btn-primary" id="yc-close">Tamam</button>' +
      '    </div>' +
      '  </div>' +
      '</div>';

    document.body.insertAdjacentHTML('beforeend', html);

    var form = document.getElementById('yeni-calisma-form');
    var labelInput = document.getElementById('yc-label');
    var slugInput = document.getElementById('yc-slug');
    var slugTouched = false;

    labelInput.addEventListener('input', function () {
      if (!slugTouched) slugInput.value = trSlug(labelInput.value);
    });
    slugInput.addEventListener('input', function () { slugTouched = true; });

    document.getElementById('yc-cancel').addEventListener('click', closeModal);
    document.getElementById('yc-close').addEventListener('click', closeModal);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submitForm();
    });
  }

  function openModal() {
    ensureModal();
    var modal = document.getElementById('yeni-calisma-modal');
    document.getElementById('yeni-calisma-form').hidden = false;
    document.getElementById('yc-fallback').hidden = true;
    document.getElementById('yc-error').hidden = true;
    document.getElementById('yc-label').value = '';
    document.getElementById('yc-slug').value = '';
    document.getElementById('yc-desc').value = '';
    var solRadio = document.querySelector('input[name="yc-menu-yer"][value="sol"]');
    if (solRadio) solRadio.checked = true;
    modal.hidden = false;
    document.getElementById('yc-label').focus();
  }

  function closeModal() {
    var modal = document.getElementById('yeni-calisma-modal');
    if (modal) modal.hidden = true;
  }

  function showError(msg) {
    var el = document.getElementById('yc-error');
    el.textContent = msg;
    el.hidden = false;
  }

  function submitForm() {
    var slug = document.getElementById('yc-slug').value.trim();
    var label = document.getElementById('yc-label').value.trim();
    var desc = document.getElementById('yc-desc').value.trim();
    var menuYer = getMenuYer();
    var err = document.getElementById('yc-error');
    err.hidden = true;

    if (!label || !slug || !desc) {
      showError('Tüm alanları doldurun.');
      return;
    }
    if (!/^[a-z][a-z0-9_]*$/.test(slug)) {
      showError('Klasör adı küçük harfle başlamalı; yalnızca harf, rakam ve alt çizgi kullanın.');
      return;
    }

    var submitBtn = document.getElementById('yc-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Oluşturuluyor…';

    fetch(API + '/yeni-calisma', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug, label: label, desc: desc, menuYer: menuYer })
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (r) {
        if (r.ok && r.data.ok) {
          window.location.href = 'calismalarim/' + slug + '/index.html';
          return;
        }
        throw new Error((r.data && r.data.error) || 'Oluşturulamadı');
      })
      .catch(function () {
        var prompt = buildCursorPrompt(slug, label, desc, menuYer);
        return navigator.clipboard.writeText(prompt).then(function () {
          document.getElementById('yeni-calisma-form').hidden = true;
          document.getElementById('yc-prompt-text').textContent = prompt;
          document.getElementById('yc-fallback').hidden = false;
        });
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Oluştur';
      });
  }

  function bindPlusButton() {
    var btn = document.getElementById('btn-yeni-calisma');
    if (btn) btn.addEventListener('click', openModal);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindPlusButton);
  } else {
    bindPlusButton();
  }

  window.TASK_YENI_CALISMA = { open: openModal };
})();
