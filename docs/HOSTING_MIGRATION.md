# Öğrenci Takip — Hosting Geçiş Planı

## Karar
- GitHub deposu `srbybgc/ogrencitakip` KALACAK.
- GitHub kaynak kodu, sürüm geçmişi ve mümkünse otomatik deployment merkezi olarak kullanılacak.
- GitHub Pages nihai yayın adresi olarak kullanılmayacak; geçiş tamamlandıktan sonra kapatılabilir.
- Firebase projesi mevcut proje olarak korunacak: `ogrenci-b647e`.
- Firebase Authentication, Firestore ve Storage mevcut projede kalacak; veri taşınmayacak.

## Hedef adres
Kullanıcının istediği yayın adresi:

`https://ogrencitakip.web.app`

Mevcut adres:

`https://ogrenci-b647e.web.app`

Önemli: Firebase Project ID `ogrenci-b647e` ile aynı şey değildir. Hedef için aynı Firebase projesi altında `ogrencitakip` Hosting Site ID oluşturulması hedefleniyor. Site ID kullanılabilir olursa `ogrencitakip.web.app` adresi elde edilir.

## Şu anki Firebase ekranı
- Firebase Console'da proje adı üstte `ogrencitakip` olarak görünüyor.
- Hosting ekranında henüz Hosting kurulumu tamamlanmış bir site görünmüyor.
- `Get started` ekranında Firebase CLI kurulumu isteniyor.
- Kullanıcıya şu aşamada CLI kurdurmak yerine GitHub üzerinden deployment düzeni kurulması tercih ediliyor.
- `Get started` sihirbazında `Next` adımına geçmeden önce ekran görüntüsüyle ilerleniyor.

## İzlenecek sıra
1. Firebase Hosting kurulumunda gerekli ilk adımları tamamla.
2. Aynı Firebase projesinde `ogrencitakip` Hosting site ID'sinin oluşturulabilirliğini kontrol et.
3. GitHub reposuna `firebase.json` ekle:
   - public: `dist`
   - SPA rewrite: `**` -> `/index.html`
4. `.firebaserc` ile mevcut Firebase projesini `ogrenci-b647e` olarak tanımla.
5. GitHub Actions üzerinden Firebase Hosting deployment kur.
6. Gerekli Firebase service account / GitHub secret adımını kullanıcıya yalnızca manuel yapılması gerekiyorsa yaptır.
7. Deployment sonrası `https://ogrencitakip.web.app` adresini kontrol et.
8. Auth, Firestore, Storage ve SPA route'larının yeni adreste çalıştığını doğrula.
9. Yeni adres sorunsuz çalıştıktan sonra GitHub Pages deployment'ını kapat; repo silinmeyecek.

## Kullanıcı tercihi
Kullanıcı "devam et" dediğinde bu dosyadaki hosting geçiş planından ve son kalınan Firebase ekranından devam edilecek; baştan tüm süreci anlatmak yerine yalnızca sıradaki manuel adım söylenecek.

## Son kullanıcı talimatı / kaldığı yer
Kullanıcı Firebase Hosting ekranında `Set up Firebase Hosting` penceresini açtı. İlk adım `Install Firebase CLI`, altında `npm install -g firebase-tools` komutu ve `Next` düğmesi bulunuyor. Henüz `Next` ile ilerlenmedi. Kullanıcıdan sonraki ekran görüntüsü bekleniyor.
