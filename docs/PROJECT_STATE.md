# Öğrenci Takip — Proje Durumu ve Kararlar

> Bu dosya, proje üzerinde yapılan konuşmalardaki kararların kalıcı çalışma özeti olarak tutulur. Yeni geliştirmelerde önce bu dosya ve mevcut kod birlikte kontrol edilmelidir. Amaç, sohbet geçmişi görünmese bile projenin gereksinimlerinin kaybolmamasıdır.

## 1. Ürün amacı

Öğretmenin sınıflarını, öğrencilerini, ders programını, öğrenci takip kayıtlarını ve belgelerini tek yerden yönetebileceği; telefon/tablet/masaüstünde kullanılabilen Firebase destekli bir öğrenci takip uygulaması.

Canlı hedef: GitHub Pages üzerinde `srbybgc/ogrencitakip`.

## 2. Temel kullanıcı ve veri modeli

- Kullanıcı Firebase Authentication ile kendi hesabına giriş yapar.
- Her kullanıcının verileri Firestore'da yalnızca kendi UID alanı altında tutulur.
- Firebase Storage dosyaları da kullanıcı UID'si altında tutulur.
- Bir kullanıcı başka kullanıcının verisini okuyamaz veya değiştiremez.
- Yeni hesapta demo/örnek öğrenci verisi gösterilmez.

Ana veri kümeleri:
- classes
- groups
- schedule
- documents
- studentRecords

## 3. Sınıf ve grup mantığı

- Kullanıcı sınıfları doğrudan oluşturur.
- Başlangıçta 4 yaş, 5 yaş gibi zorunlu üst kategoriler olmayacak.
- Kullanıcı isterse sonradan üst gruplar oluşturabilir.
- Grup amacı ana ekrandaki görüntü kalabalığını azaltmaktır.
- Ana sayfada aynı anda bütün sınıfları ve bütün grupları gereksiz biçimde tekrar göstermemek gerekir.
- Aynı sınıf adı ikinci kez eklenmeye çalışıldığında uygulama çökmemeli; kullanıcıya anlaşılır hata mesajı göstermelidir.

## 4. Ana sayfa

Ana sayfada:
- arama,
- sınıflar/gruplar,
- gün seçimi,
- haftalık ders programı,
- belgeler/dosyalar
bulunur.

Bugünün dersleri gösterilirken mevcut gün ve saate denk gelen ders öncelikli olmalıdır. Özellikle o anda ders işlenen sınıf öne çıkarılmalıdır.

## 5. Öğrenci işlemleri

Sınıf detayında:
- öğrenci ekleme,
- öğrenci silme,
- öğrenci adına göre tekrar kayıt kontrolü,
- öğrenci detayına girme,
- öğrenci takip kayıtları,
- öğrenciye bağlı belgeler
olmalıdır.

Öğrenci takip kayıtları:
- not,
- yoklama: Geldi / Gelmedi / İzinli,
- etkinlik/görüşme kaydı,
- tarih,
- geçmiş kayıtların görüntülenmesi ve silinmesi.

## 6. Öğrenci toplu veri aktarımı — ÖNEMLİ

Öğrenci ekleme yalnızca Excel ile sınırlı olmamalıdır.

Desteklenecek/veri aktarım katmanının hedefi:
- `.xls`
- `.xlsx`
- `.csv`
- `.txt` / düz metin

Format ayrıntıları mümkün olduğunca kullanıcı dostu olmalıdır. Excel/CSV için Ad ve Soyad ayrı sütunları desteklenmeli; tek sütunda tam ad-soyad da desteklenmelidir. Düz metinde satır bazlı öğrenci isimleri okunabilmelidir.

İçe aktarma sırasında:
- boş satırlar atlanmalı,
- hatalı satırlar uygulamayı düşürmemeli,
- aynı sınıfta zaten bulunan öğrenciler tekrar eklenmemeli,
- mümkünse kullanıcıya kaç öğrencinin eklendiği ve kaç satırın atlandığı gösterilmelidir,
- aktarım öncesinde önizleme yapılması tercih edilir.

Bu özellik için kullanılan kütüphane yalnızca Excel'e özel kalacak şekilde tasarlanmamalı; parser katmanı yeni formatların eklenmesine uygun olmalıdır.

## 7. Belge/dosya yönetimi

Belge/dosya alanı ana sayfada bulunmalıdır.

Dosya yüklendikten sonra kullanıcı dosyanın neyle ilişkilendirileceğini seçer:
- öğrenci,
- sınıf,
- grup.

Dosya türü gereksiz yere kısıtlanmamalıdır; Storage'a yüklenebilen yaygın belge/dosya formatları desteklenmelidir. Dosyanın adı, türü, ilişkisi, oluşturulma bilgisi ve Storage yolu/metaverisi korunmalıdır.

Bir öğrenci veya sınıf silindiğinde ilişkili belge metadata kayıtları da temizlenmelidir. Mümkün olduğunda gerçek Storage nesnelerinin de yetim kalmaması sağlanmalıdır.

## 8. Ders programı

- Pazartesi–Cuma dersleri.
- Sınıf, ders adı, başlangıç ve bitiş saati.
- Aynı sınıf için aynı gün çakışan derslere izin verilmez.
- Güncel saat aralığındaki ders ana sayfada öncelik kazanır.

## 9. Veri bütünlüğü

Aşağıdaki kontroller korunmalıdır:
- olmayan sınıfa bağlı ders bulunmaması,
- olmayan öğrenciye bağlı takip kaydı bulunmaması,
- olmayan sınıf/öğrenci/gruba bağlı belge bulunmaması,
- gruplarda olmayan sınıf ID'lerinin temizlenmesi,
- bozuk yerel verinin uygulamayı çökertmemesi.

Silme işlemleri ilişkili kayıtları temizlemelidir.

## 10. Firebase

Firestore kuralları kullanıcı UID'sine göre sınırlandırılmıştır.
Storage kuralları da kullanıcı UID'sine göre sınırlandırılmıştır.

Veri senkronizasyonu:
- yerel veri geçişi/çevrimdışı kullanım korunur,
- Firebase'e kullanıcıya özel senkronizasyon yapılır,
- senkronizasyon hatalarında uygulama anlaşılır şekilde hata/retry sunar,
- kullanıcılar arasında localStorage verisi karışmamalıdır.

## 11. Kimlik doğrulama

Firebase Email/Password Authentication kullanılacak.

Kullanıcı uygulamada kendi hesabını oluşturup giriş yapar. Proje geliştirme aşamasında sabit/genel bir kullanıcı adı ve şifre tanımlanmış kabul edilmemelidir.

## 12. Arayüz

- Türkçe.
- Mobil ve tablet öncelikli, masaüstünde de kullanılabilir.
- Ana navigasyon: Ana Sayfa, Öğrenciler, Ders Programı, Dersler/Raporlar gibi bölümler ürün geliştikçe korunmalı.
- Arayüz gereksiz kalabalık oluşturmamalı.
- Hata durumları boş ekran/React crash şeklinde görünmemeli.

## 13. Kalite kontrol

Her önemli değişiklikten sonra:
1. `npm test`
2. `npm run build`
3. mümkünse GitHub Actions sonuçları
kontrol edilmelidir.

Canlıya çıkmadan önce özellikle:
- sınıf ekleme/tekrar sınıf ekleme,
- öğrenci ekleme/tekrar öğrenci ekleme,
- toplu öğrenci aktarımı tüm hedef formatları,
- öğrenci silme ve ilişkili kayıt temizliği,
- belge yükleme/ilişkilendirme/silme,
- grup oluşturma/silme,
- ders ekleme/çakışma kontrolü,
- Firebase login/senkronizasyon,
- mobil/tablet görünümü
kontrol edilmelidir.

## 14. Geliştirme ilkesi

Bu dosya sohbet geçmişinin yerine geçecek proje hafızasıdır. Yeni bir karar alındığında bu dosya güncellenmelidir. Bir özellik konuşmada kararlaştırıldıysa, yalnızca son kullanıcı mesajına bakarak kapsam daraltılmamalıdır.

Özellikle "sadece Excel" yaklaşımı yanlıştır: öğrenci toplu veri aktarımı XLS/XLSX yanında CSV ve düz metin desteğine sahip olmalıdır.
