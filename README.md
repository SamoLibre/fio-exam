# 🎓 OE Sınav Takip & Alarm PWA

Öğretmenlerin öğrencilerinin **IELTS, SAT, AP, TOEFL, Duolingo** ve diğer sınavlarını kolayca takip edebileceği, sınav tarihleri yaklaştıkça alarmlar ve bildirimler üreten, öğrencilerin ise kendi özel portallarından sınav takvimlerini ve geri sayımlarını görebileceği modern bir **Progressive Web App (PWA)**.

---

## ✨ Özellikler

- 👨‍🏫 **Öğretmen / Admin Paneli**:
  - Tüm öğrencileri ve sınavları görüntüleme / filtreleme
  - Yeni öğrenci ekleme (Mira, Bedirhan, Burak ve yenileri)
  - Yeni sınav, tarih, saat, lokasyon, hedef puan ve özel notlar tanımlama
  - Otomatik hatırlatıcı alarmlar kurma (60, 30, 14, 7, 3, 1 gün önce & sınav günü)
  - Deneme sınavı (Mock test) skorları ve ilerleme kaydetme
  - Alarm testi yapabilme

- 👩‍🎓 **Öğrenci Portalı**:
  - Öğrenciye özel giriş (örn: `mira`, `bedirhan`, `burak` / şifre: `123`)
  - En yakın sınava kalan gün, saat, dakika ve saniye canlı geri sayım sayacı
  - Öğretmenin eklediği sınav takvimi, hedef puanlar ve tavsiye notları
  - **1-Tıkla Google Takvim / Apple Takvim'e Alarm ile Ekleme** (.ics formatında telefonun kendi saat alarmına bağlanır)

- 📱 **PWA & Mobil Desteği**:
  - Android & iOS uyumlu "Ana Ekrana Ekle" (Add to Home Screen)
  - Web Push / Browser Notifications desteği
  - Tam ekran (standalone) uygulama deneyimi
  - Çevrimdışı (offline) önbellekleme desteği

---

## 🚀 Kurulum & Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev

# Canlı derleme (Production Build)
npm run build
```

---

## 🔑 Varsayılan Giriş Bilgileri

| Rol | Kullanıcı Adı | Şifre | Açıklama |
|---|---|---|---|
| **Öğretmen (Admin)** | `ogretmen` | `123456` | Tüm öğrencileri ve sınavları yönetir |
| **Öğrenci** | `mira` | `123` | IELTS & AP Calculus BC öğrencisi |
| **Öğrenci** | `bedirhan` | `123` | Digital SAT & AP Physics öğrencisi |
| **Öğrenci** | `burak` | `123` | TOEFL iBT öğrencisi |
