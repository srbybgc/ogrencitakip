# Öğrenci Takip

Firebase destekli, mobil/tablet uyumlu sınıf ve öğrenci takip uygulaması.

## Mevcut özellikler
- Firebase Authentication ile kullanıcı hesabı ve güvenli giriş
- Kullanıcıya özel Firestore veri saklama
- Kullanıcıya özel Firebase Storage belge/dosya saklama
- Ana sayfa ve haftalık gün seçimi
- Günün saatine göre aktif dersin ve ilgili sınıfın otomatik öne çıkarılması
- Sınıf oluşturma ve sınıf detayları
- Öğrenci ekleme / silme ve tekrar kayıt kontrolü
- Üst grup oluşturma ve sınıfları gruplara bağlama
- Haftalık ders programı ve çakışma kontrolü
- Belgeleri sınıf, öğrenci veya grupla ilişkilendirme
- Sınıf/öğrenci silme işlemlerinde ilişkili kayıtların temizlenmesi
- Öğrenci takip kayıtları için veri modeli ve bütünlük kontrolleri
- Yetim/bozuk ilişkileri temizleyen veri bütünlüğü katmanı
- Mobil ve tablet uyumlu arayüz
- Çevrimdışı/yerel veri geçişi ve Firebase senkronizasyonu
- Otomatik test ve üretim build kontrolü

## Geliştirme
```bash
npm install
npm run dev
```

Testler:
```bash
npm test
```

Üretim derlemesi:
```bash
npm run build
```

Firebase güvenlik kuralları `firestore.rules` ve `storage.rules` dosyalarında kullanıcı kimliğine göre sınırlandırılmıştır.
