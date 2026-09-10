# Öğrenci Takip — Proje Durumu ve Kararlar

> Bu dosya proje hafızasıdır. Yeni geliştirmelerde önce bu dosya ve mevcut kod birlikte kontrol edilir.

## Ürün amacı
Öğretmenin sınıflarını, öğrencilerini, ders programını, öğrenci takip kayıtlarını ve belgelerini tek yerden yönetebileceği; telefon/tablet/masaüstünde çalışan Firebase destekli öğrenci takip uygulaması.

## Veri modeli
Firestore kullanıcı altında: `classes`, `groups`, `schedule`, `documents`, `studentRecords`, `trash`.
- Firebase Authentication email/password.
- Firestore ve Storage kullanıcı UID'si ile izole.
- Yeni hesap başka kullanıcının localStorage verisini devralmaz.

## Sınıflar ve gruplar
- Sınıflar doğrudan oluşturulur; zorunlu yaş kategorisi yoktur.
- Gruplar isteğe bağlı üst organizasyondur.
- Sınıflar Türkçe alfabetik sırada, doğal/numeric karşılaştırmayla gösterilir (`4A`, `4B`, `4C`, `4D`).
- Öğrenciler ad, sonra soyada göre Türkçe alfabetik sıralanır.
- Yinelenen sınıf/öğrenci engellenir.

## Ana sayfa ve ders programı
- Gün seçimi, haftalık ders programı, sınıflar ve belgeler bulunur.
- O anda işlenen dersin sınıfı öne çıkar.
- Pazartesi-Cuma ve aynı sınıfta çakışan ders kontrolü vardır.

## Öğrenci işlemleri
- Manuel ve toplu öğrenci ekleme.
- Öğrenci detayında not, olay/görüşme ve yoklama (`Geldi`, `Gelmedi`, `İzinli`) geçmişi.
- Öğrenci belgeleri ve tarihli kayıtlar.
- Öğrenci silinince ilişkili kayıtların yetim kalmaması hedeflenir.

## Toplu aktarım
`.xls`, `.xlsx`, `.csv`, `.txt` desteklenir. Excel/CSV'de Ad-Soyad ayrı sütun veya tek tam ad sütunu; TXT'de satır başına öğrenci. Önizleme, boş/tekrar satır atlama ve sonuç sayacı vardır.

## Belgeler
- Öğrenci, sınıf veya grup ile ilişkilendirilebilir.
- Firebase Storage'da kullanıcıya özel tutulur.
- Dosya metadata'sı ve Storage yolu korunur.

## Arşiv ve çöp kutusu
- Aktif sınıflar arşivlenebilir; arşivlenen sınıflar aktif listelerden gizlenir.
- Arşivden geri alma vardır.
- Alt solda **Arşiv** ve **Çöp Kutusu** erişimi vardır.
- Çöp kutusu silinen sınıf, öğrenci, grup, ders ve belge değişikliklerini çalışma oturumu içinde yakalar; sınıf/öğrenci silinmelerinde ilişkili grup/ders/belge/kayıt snapshot'ı da saklanır.
- Geri yükleme ve çöp kutusunu boşaltma vardır.
- Çöp kutusu Firestore'da `trash` koleksiyonuyla kullanıcıya özel senkronize edilir.
- Arşivlenen sınıflara eğitim yılı etiketi atanır (`YYYY-YYYY`).

## Veri bütünlüğü ve senkronizasyon
- Yetim ders/belge/studentRecord kontrolleri yapılır.
- Grup sınıf ID'leri temizlenir.
- Firestore senkronizasyonu serialized queue ile yapılır.
- Bozuk localStorage verisi uygulamayı düşürmez.

## UI ve kalite
- Türkçe, mobil/tablet/masaüstü.
- Boş ekran yerine anlaşılır hata/boş durumları.
- `npm test` ve `npm run build` her önemli değişiklikte çalıştırılır; GitHub Actions Build ve Pages doğrulanır.

## Son geliştirme notu — 2026-09-10
- Öğrenci çoklu aktarımı gerçek kaynak koda işlendi; XLS/XLSX/CSV/TXT çalışır.
- Sınıf ve öğrenci alfabetik sıralaması eklendi.
- Yinelenen Toplu Aktar butonları temizlendi.
- Arşiv/geri alma ve Çöp Kutusu/geri yükleme arayüzü eklendi.
- Arşivlenen sınıflar aktif ekranlardan gizlenir.
- `trash` Firestore senkronizasyon koleksiyonuna eklendi.
- Sonraki kalite odağı: silme/geri yükleme gerçek Storage nesneleri ve öğrenci kayıtlarıyla uçtan uca manuel doğrulama; uygulamanın canlı ortamda kontrolü.


## UI / academic year decisions (2026-09-10)
- Arşiv ve Çöp Kutusu üst menünün en sağında yer alır; ekranın altına sabit buton konulmaz.
- Ana sayfadaki Belge/Dosya Ekle ve Ders Programını Yönet alt kartları kaldırıldı; ilgili modüller üst menüden açılır.
- Arşiv ekranı aktif sınıfları tek tek arşivleme listesi değildir; arşivlenen sınıflar eğitim öğretim yılına göre gruplanır.
- Sınıf arşivleme işlemi Sınıf Ayarları üzerinden yapılır.
- Sınıf oluştururken Eğitim Öğretim Yılı seçilir; geçmiş eğitim öğretim yılları değişmeden korunur ve arşiv mantığı yıl bazlıdır.
- Gelecek yıl eski sınıfların yeni eğitim öğretim yılına aktarılabilmesi ürün gereksinimidir; eski yıl kaydı değişmemelidir.
