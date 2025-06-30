# LifeSync App - Yaşam Tarzı Tabanlı Verimlilik Uygulaması

## 🎯 Proje Özeti

LifeSync, kullanıcıların yaşam tarzlarına göre özelleştirilmiş bir verimlilik uygulamasıdır. Dini, hayvanseverlik, çevre, sağlık ve kariyer kategorilerinde kişiselleştirilmiş özellikler sunar.

### 🌟 Temel Özellikler

- **📅 Takvim Yönetimi** - Google Calendar benzeri sidebar ile gelişmiş takvim
- **✅ Görev Yönetimi** - Eisenhower Matrix, preset görevler
- **📝 Notion-like Notlar** - Blok tabanlı zengin içerik editörü
- **🤖 AI Asistan** - Akıllı öneri ve yardım sistemi
- **🎤 Ses Notları** - Otomatik transkripsiyon
- **📊 Aktivite Takibi** - Detaylı kullanıcı aktivite loglama
- **🌍 Sosyal Özellikler** - Community stats ve motivasyon
- **🕌 Namaz Vakitleri** - Dini kategori için özel widget

### 🎨 Tasarım Prensipleri

- **Minimalist UI** - 8px grid sistem, temiz arayüz
- **Yaşam Tarzı Odaklı** - 5 ana kategori etrafında özelleştirilmiş deneyim
- **Responsive** - Tüm cihazlarda mükemmel görünüm

## 🚀 Kurulum

### Backend Kurulumu

```bash
cd lifesync-backend
npm install
cp .env.example .env
# .env dosyasını düzenleyin

# Database migration
npx prisma migrate dev
npx prisma generate

# Sunucuyu başlat
npm run dev
```

### Frontend Kurulumu (React Native)

```bash
cd lifesync-app
npm install

# iOS için
cd ios && pod install
cd ..
npm run ios

# Android için
npm run android
```

## 🏗️ Proje Yapısı

```
lifesync-project/
├── lifesync-backend/         # Node.js + Express + Prisma Backend
│   ├── prisma/              # Database schema
│   ├── routes/              # API endpoints
│   ├── middleware/          # Auth, validation
│   ├── services/            # Business logic
│   └── utils/               # Helper functions
│
└── lifesync-app/            # React Native Frontend
    ├── src/
    │   ├── screens/         # Uygulama ekranları
    │   ├── components/      # Yeniden kullanılabilir bileşenler
    │   ├── stores/          # Zustand state management
    │   ├── services/        # API servisleri
    │   └── theme/           # Design system
    └── ...
```

## 📋 API Endpoints

### Authentication

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `POST /api/auth/logout` - Çıkış
- `GET /api/auth/me` - Mevcut kullanıcı bilgileri

### Tasks

- `GET /api/tasks` - Görevleri listele
- `POST /api/tasks` - Yeni görev oluştur
- `PATCH /api/tasks/:id` - Görev güncelle
- `DELETE /api/tasks/:id` - Görev sil
- `GET /api/tasks/preset` - Hazır görevler
- `GET /api/tasks/eisenhower/matrix` - Eisenhower Matrix

### Events

- `GET /api/events` - Etkinlikleri listele
- `POST /api/events` - Yeni etkinlik oluştur
- `PATCH /api/events/:id` - Etkinlik güncelle

### Notes

- `GET /api/notes` - Notları listele
- `POST /api/notes` - Yeni not oluştur
- `POST /api/notes/:id/voice` - Ses notu ekle

### AI & Analytics

- `POST /api/ai/chat` - AI ile sohbet
- `GET /api/analytics/activity` - Aktivite özeti
- `GET /api/community/stats` - Topluluk istatistikleri

## 🔐 Güvenlik

- JWT tabanlı authentication
- Bcrypt ile şifre hashleme
- Rate limiting
- Input validation (Joi)
- SQL injection koruması (Prisma)

## 🧪 Test

```bash
# Backend testleri
cd lifesync-backend
npm test

# Frontend testleri
cd lifesync-app
npm test
```

## 📱 Ekran Görüntüleri

(Ekran görüntüleri eklenecek)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'e push yapın (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 👥 Ekip

- **Proje Yöneticisi**: [İsim]
- **Backend Developer**: [İsim]
- **Frontend Developer**: [İsim]
- **UI/UX Designer**: [İsim]

## 📞 İletişim

Sorularınız için: support@lifesync.app

---

**LifeSync** - Yaşam tarzınıza uygun verimlilik 🚀
