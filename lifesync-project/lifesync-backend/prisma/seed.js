const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Preset Tasks Data
const presetTasks = [
  // DİNİ KATEGORİ
  {
    title: "Sabah Namazı",
    description: "Güne namaz ile başlayın",
    category: "DINI",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 10,
    icon: "🕌",
    color: "#8B5CF6",
    isPromoted: true,
  },
  {
    title: "Kuran Okuma",
    description: "10 dakika Kuran okuyun",
    category: "DINI",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 10,
    icon: "📖",
    color: "#8B5CF6",
  },
  {
    title: "Tesbih Çekme",
    description: "100 kez tesbih çekin",
    category: "DINI",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "📿",
    color: "#8B5CF6",
  },
  {
    title: "Dua Etme",
    description: "Kişisel dualarınızı yapın",
    category: "DINI",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "🤲",
    color: "#8B5CF6",
  },

  // HAYVANSEVERLIK KATEGORİSİ
  {
    title: "Sokak Hayvanlarını Besle",
    description: "Sokak kedilerine ve köpeklerine mama verin",
    category: "HAYVANSEVERLIK",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 15,
    icon: "🐱",
    color: "#F59E0B",
    isPromoted: true,
  },
  {
    title: "Evcil Hayvan Bakımı",
    description: "Sevimli dostunuzla vakit geçirin",
    category: "HAYVANSEVERLIK",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 30,
    icon: "🐕",
    color: "#F59E0B",
  },
  {
    title: "Hayvan Barınağına Bağış",
    description: "Aylık bağış yapın",
    category: "HAYVANSEVERLIK",
    suggestedFrequency: "monthly",
    priority: "MEDIUM",
    estimatedDuration: 10,
    icon: "❤️",
    color: "#F59E0B",
  },
  {
    title: "Su Kabı Koyma",
    description: "Sokak hayvanları için su kabı koyun",
    category: "HAYVANSEVERLIK",
    suggestedFrequency: "weekly",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "💧",
    color: "#F59E0B",
  },

  // ÇEVRE KATEGORİSİ
  {
    title: "Plastik Kullanmama",
    description: "Tek kullanımlık plastik kullanmayın",
    category: "CEVRE",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 5,
    icon: "🌱",
    color: "#10B981",
    isPromoted: true,
  },
  {
    title: "Su Tasarrufu",
    description: "Duş süresini kısaltın",
    category: "CEVRE",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "💧",
    color: "#10B981",
  },
  {
    title: "Geri Dönüşüm",
    description: "Atıkları ayırın",
    category: "CEVRE",
    suggestedFrequency: "weekly",
    priority: "MEDIUM",
    estimatedDuration: 10,
    icon: "♻️",
    color: "#10B981",
  },
  {
    title: "Toplu Taşıma Kullanma",
    description: "Araç yerine toplu taşıma tercih edin",
    category: "CEVRE",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 30,
    icon: "🚌",
    color: "#10B981",
  },
  {
    title: "Enerji Tasarrufu",
    description: "Gereksiz elektrik tüketimini azaltın",
    category: "CEVRE",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "💡",
    color: "#10B981",
  },

  // SAĞLIK KATEGORİSİ
  {
    title: "Günlük Yürüyüş",
    description: "30 dakika yürüyüş yapın",
    category: "SAGLIK",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 30,
    icon: "🚶",
    color: "#EF4444",
    isPromoted: true,
  },
  {
    title: "Su İçme",
    description: "Günde 8 bardak su için",
    category: "SAGLIK",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 5,
    icon: "💧",
    color: "#EF4444",
  },
  {
    title: "Sağlıklı Beslenme",
    description: "Günde 5 porsiyon meyve-sebze tüketin",
    category: "SAGLIK",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 15,
    icon: "🥗",
    color: "#EF4444",
  },
  {
    title: "Meditasyon",
    description: "10 dakika meditasyon yapın",
    category: "SAGLIK",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 10,
    icon: "🧘",
    color: "#EF4444",
  },
  {
    title: "Uyku Düzeni",
    description: "Düzenli uyku saatlerine uyun",
    category: "SAGLIK",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 5,
    icon: "😴",
    color: "#EF4444",
  },

  // KARİYER KATEGORİSİ
  {
    title: "Günlük Hedef Belirleme",
    description: "Günün hedeflerini belirleyin",
    category: "KARIYER",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 10,
    icon: "🎯",
    color: "#3B82F6",
    isPromoted: true,
  },
  {
    title: "Beceri Geliştirme",
    description: "30 dakika yeni beceri öğrenin",
    category: "KARIYER",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 30,
    icon: "📚",
    color: "#3B82F6",
  },
  {
    title: "Network Kurma",
    description: "Yeni profesyonel bağlantılar kurun",
    category: "KARIYER",
    suggestedFrequency: "weekly",
    priority: "MEDIUM",
    estimatedDuration: 20,
    icon: "🤝",
    color: "#3B82F6",
  },
  {
    title: "Portfolio Güncelleme",
    description: "CV ve portfolyonuzu güncelleyin",
    category: "KARIYER",
    suggestedFrequency: "monthly",
    priority: "MEDIUM",
    estimatedDuration: 60,
    icon: "📄",
    color: "#3B82F6",
  },
  {
    title: "İngilizce Çalışma",
    description: "20 dakika İngilizce pratik yapın",
    category: "KARIYER",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 20,
    icon: "🇬🇧",
    color: "#3B82F6",
  },

  // KİŞİSEL KATEGORİ
  {
    title: "Günlük Değerlendirme",
    description: "Günün nasıl geçtiğini değerlendirin",
    category: "KISISEL",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 10,
    icon: "📝",
    color: "#6B7280",
  },
  {
    title: "Hobiye Vakit Ayırma",
    description: "Sevdiğiniz hobiniz için vakit ayırın",
    category: "KISISEL",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 30,
    icon: "🎨",
    color: "#6B7280",
  },
  {
    title: "Aile/Arkadaş Görüşmesi",
    description: "Sevdiklerinizle iletişim kurun",
    category: "KISISEL",
    suggestedFrequency: "daily",
    priority: "HIGH",
    estimatedDuration: 30,
    icon: "👥",
    color: "#6B7280",
  },
  {
    title: "Minnettarlık Pratiği",
    description: "3 şey için minnettarlık ifade edin",
    category: "KISISEL",
    suggestedFrequency: "daily",
    priority: "MEDIUM",
    estimatedDuration: 5,
    icon: "🙏",
    color: "#6B7280",
  },
];

async function main() {
  console.log("🌱 Seed verilerini ekleniyor...");

  // Preset tasks ekle
  console.log("📋 Preset tasks ekleniyor...");
  for (const task of presetTasks) {
    await prisma.presetTask.upsert({
      where: { title: task.title },
      update: task,
      create: task,
    });
  }

  console.log("✅ Seed verileri başarıyla eklendi!");
  console.log(`📊 ${presetTasks.length} preset task eklendi`);
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
