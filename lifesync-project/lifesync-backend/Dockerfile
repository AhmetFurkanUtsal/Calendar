# Node.js 18 LTS kullan
FROM node:18-alpine

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./

# Dependencies'leri yükle
RUN npm ci --only=production

# Uygulama kodunu kopyala
COPY . .

# Prisma generate
RUN npx prisma generate

# Port'u expose et
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Uygulamayı başlat
CMD ["npm", "start"] 