/** Anket soruları — Sistem Yönetimi › Hidromorfolojik Baskı Yönetimi › Anket Listesi (mockup verisi) */
window.HB_ANKET = {
  nehir: [
    {
      id: 'nehir-kanal',
      baslik: 'Kanallaştırma, Düzleştirme, Kıyı Güçlendirme, Taşkın Koruma Yapılarının Yüzdesi',
      secenekler: [
        'Nehir uzunluğunun <%15 kısmı etkilenmiştir',
        'Nehir uzunluğunun <%50–%15 arası kısmı etkilenmiştir',
        'Nehir uzunluğunun >%50 kısmı etkilenmiştir'
      ]
    },
    {
      id: 'nehir-substrat',
      baslik: 'Nehir Substrat Yapısı',
      secenekler: [
        'Nehir yatağında yapay substrat <%5',
        'Nehir yatağında yapay substrat %5–%50',
        'Nehir yatağında yapay substrat >%50'
      ]
    }
  ],
  gol: [
    {
      id: 'gol-kiyi',
      baslik: 'Kıyı Yapılaşması Ve Kıyı Şeridi Değişimi',
      secenekler: [
        'Kıyı şeridinde belirgin yapılaşma yok',
        'Kıyı şeridinin <%25 kısmında yapılaşma var',
        'Kıyı şeridinin >%25 kısmında yapılaşma var'
      ]
    },
    {
      id: 'gol-seviye',
      baslik: 'Su Seviyesi Ve Hacim Değişimi',
      secenekler: [
        'Doğal su seviyesi korunuyor',
        'Su seviyesinde orta düzeyde değişim',
        'Su seviyesinde belirgin ve kalıcı değişim'
      ]
    }
  ]
};

window.HB_KONUM_ORNEK = {
  nehir: {
    su_kutlesi_kodu: 'TR00000001',
    havza: 'Gediz',
    alt_havza: 'Akhisar',
    il: 'Manisa',
    tur: 'Nehir',
    lat: '38,62',
    lon: '27,43'
  },
  gol: {
    su_kutlesi_kodu: 'TR00000012',
    havza: 'Sakarya',
    alt_havza: 'Sapanca Gölü',
    il: 'Sakarya',
    tur: 'Göl',
    lat: '40,69',
    lon: '30,27'
  }
};

/** Mockup — polygon sonrası mekansal sorgu (canlıda BE) */
window.HB_KONUM_TESPIT = {
  fromGeometry: function (kaynak) {
    if (kaynak === 'yukle') return window.HB_KONUM_ORNEK.gol;
    return window.HB_KONUM_ORNEK.nehir;
  },
  turKey: function (tur) {
    var s = String(tur || '').toLowerCase();
    if (s.indexOf('göl') !== -1 || s === 'gol') return 'gol';
    return 'nehir';
  }
};
