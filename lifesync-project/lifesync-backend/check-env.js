require("dotenv").config();

function checkEnv(variable) {
  if (!process.env[variable]) {
    console.error(
      `❌ FATAL ERROR: Missing required environment variable: ${variable}`
    );
    process.exit(1);
  }
}

module.exports = checkEnv;

console.log("--- .env Teşhis Aracı ---");
console.log("DATABASE_URL değeri:", process.env.DATABASE_URL);
console.log("-------------------------");

if (process.env.DATABASE_URL) {
  console.log("✅ .env dosyası başarıyla okundu ve DATABASE_URL bulundu.");
} else {
  console.error(
    "❌ HATA: .env dosyası okunamadı veya içinde DATABASE_URL bulunmuyor!"
  );
}
