/** Özel hüküm örnek kayıtları — mockup */
window.OZEL_HUKUMLAR = [
  {
    id: 1,
    yonetmelik_id: 4,
    yonetmelik: 'İçme-Kullanma Suyu Havzalarının Korunması Hakkında Yönetmelik',
    icme_suyu_havzasi: 'Ankara İçme Suyu Havzası',
    il: 'Ankara',
    ada_parsel: '142 / 8',
    koruma_alani: 'Kısa Mesafeli Koruma Alanı',
    sektor: 'Tarım',
    madde_no: 'Madde 3 (2)',
    madde_icerik: 'Bu alanda organik tarım dışında tarımsal faaliyet yapılamaz; mevcut parselde yalnızca mevcut kullanım korunur.',
    olusturulma: '18.06.2026 11:20'
  },
  {
    id: 2,
    yonetmelik_id: 4,
    yonetmelik: 'İçme-Kullanma Suyu Havzalarının Korunması Hakkında Yönetmelik',
    icme_suyu_havzasi: 'Kırıkkale İçme Suyu Havzası',
    il: 'Kırıkkale',
    ada_parsel: '87 / 12',
    koruma_alani: 'Mutlak Koruma Alanı',
    sektor: 'İmar',
    madde_no: 'Madde 1 (4)',
    madde_icerik: 'Parsel sınırları içinde yeni yapılaşmaya izin verilmez; mevcut yapılar aynen korunur.',
    olusturulma: '12.06.2026 09:45'
  }
];

/** cys — koruma alanı tipleri (örnek; canlıda DB'den gelir) */
window.KORUMA_ALANI_TIPLERI = [
  'Maksimum Su Kotu',
  'Mutlak Koruma Alanı',
  'Kısa Mesafeli Koruma Alanı',
  'Orta Mesafeli Koruma Alanı',
  'Uzun Mesafeli Koruma Alanı'
];
