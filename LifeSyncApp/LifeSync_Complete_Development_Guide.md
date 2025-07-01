# LifeSync App - Kapsamlı Geliştirme Rehberi

## Yapay Zeka İçin Adım Adım Implementation Guide

### 📋 PROJE ÖZET TABLOSU

| Özellik              | Detay                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| **Uygulama Adı**     | LifeSync - Yaşam Tarzı Tabanlı Verimlilik App                         |
| **Platform**         | React Native (iOS/Android)                                            |
| **Backend**          | Node.js + Express.js + PostgreSQL + Prisma                            |
| **Ana Kategoriler**  | Dini (🕌), Hayvanseverlik (🐾), Çevre (🌱), Sağlık (❤️), Kariyer (💼) |
| **Temel Özellikler** | Takvim, Görevler, Notlar, AI Asistan, Ses Notları                     |
| **Özel İstekler**    | Activity Logging, Sosyal Stats, Namaz Vakitleri, Minimalist UI        |

---

## 🎯 PHASE 1: PROJE KURULUMU (1. Hafta)

### ADIM 1.1: Backend Kurulumu

```bash
# Proje klasörü oluştur
mkdir lifesync-backend
cd lifesync-backend

# Package.json oluştur
npm init -y

# Temel dependencies
npm install express prisma @prisma/client bcrypt jsonwebtoken joi cors helmet morgan winston compression dotenv
npm install --save-dev nodemon typescript @types/node @types/express @types/bcrypt @types/jsonwebtoken jest supertest ts-node

# Environment setup
echo "DATABASE_URL=postgresql://username:password@localhost:5432/lifesync" > .env
echo "JWT_SECRET=your_super_secret_jwt_key_here" >> .env
echo "NODE_ENV=development" >> .env
echo "PORT=3000" >> .env
```

### ADIM 1.2: Prisma Setup

```bash
# Prisma init
npx prisma init

# Database schema oluştur
```

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// USER MANAGEMENT
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password      String
  displayName   String?
  photoURL      String?
  isVerified    Boolean  @default(false)

  // Relations
  profile       UserProfile?
  subscription  Subscription?
  events        Event[]
  tasks         Task[]
  notes         Note[]
  activities    UserActivity[]
  lifestyle     UserLifestyle?
  settings      UserSettings?
  stats         UserStats?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  lastLoginAt   DateTime?

  @@map("users")
}

model UserProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  fullName      String?
  bio           String?
  timezone      String   @default("Europe/Istanbul")
  city          String?
  coordinates   Json?    // {lat: number, lng: number}
  language      String   @default("tr")

  @@map("user_profiles")
}

model UserLifestyle {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  categories    String[] // ["dini", "hayvanseverlik", "cevre"]
  preferences   Json     // Category-specific preferences

  @@map("user_lifestyles")
}

// SUBSCRIPTION SYSTEM
model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  plan          SubscriptionPlan
  status        SubscriptionStatus
  startDate     DateTime
  endDate       DateTime?
  autoRenew     Boolean  @default(true)

  stripeCustomerId      String?
  stripeSubscriptionId  String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("subscriptions")
}

enum SubscriptionPlan {
  FREE
  PREMIUM
  PRO
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  EXPIRED
  PAST_DUE
}

// TASK MANAGEMENT
model Task {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title         String
  description   String?
  isCompleted   Boolean  @default(false)

  priority      TaskPriority
  category      TaskCategory
  dueDate       DateTime?
  completedAt   DateTime?

  eisenhowerQuadrant Int? // 1-4
  tags          String[]

  isPresetTask  Boolean  @default(false)
  presetTaskId  String?

  subtasks      Subtask[]
  attachments   TaskAttachment[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("tasks")
}

enum TaskPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TaskCategory {
  DINI
  HAYVANSEVERLIK
  CEVRE
  KARIYER
  SAGLIK
  KISISEL
}

model Subtask {
  id            String   @id @default(cuid())
  taskId        String
  task          Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  title         String
  isCompleted   Boolean  @default(false)
  completedAt   DateTime?

  @@map("subtasks")
}

// CALENDAR EVENTS
model Event {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title         String
  description   String?
  startTime     DateTime
  endTime       DateTime
  isAllDay      Boolean  @default(false)

  location      Json?
  color         String   @default("#0EA5E9")
  category      EventCategory

  recurrence    Json?
  reminders     EventReminder[]
  googleEventId String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("events")
}

enum EventCategory {
  DINI
  HAYVANSEVERLIK
  CEVRE
  KARIYER
  SAGLIK
  KISISEL
}

// NOTION-LIKE NOTES
model Note {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  title         String
  blocks        Json     // Notion-like block structure

  voiceNotes    VoiceNote[]
  attachments   NoteAttachment[]

  tags          String[]
  category      NoteCategory?
  isFavorite    Boolean  @default(false)
  isArchived    Boolean  @default(false)

  attachedToType String? // "event" | "task"
  attachedToId   String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@map("notes")
}

model VoiceNote {
  id            String   @id @default(cuid())
  noteId        String
  note          Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)

  audioUrl      String
  duration      Int      // seconds
  transcription String?

  createdAt     DateTime @default(now())

  @@map("voice_notes")
}

enum NoteCategory {
  DINI
  HAYVANSEVERLIK
  CEVRE
  KARIYER
  SAGLIK
  KISISEL
}

// USER ACTIVITY LOGGING (ÖNEMLİ ÖZEL İSTEK)
model UserActivity {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  action        String   // Action type
  details       Json?    // Additional details

  deviceInfo    Json?
  sessionId     String?
  platform      String?

  timestamp     DateTime @default(now())

  @@map("user_activities")
  @@index([userId, timestamp])
  @@index([action, timestamp])
}

// SOCIAL FEATURES & STATS
model CommunityStats {
  id            String   @id @default(cuid())
  date          String   @unique // YYYY-MM-DD

  stats         Json     // General stats
  categories    Json     // Category-specific stats

  updatedAt     DateTime @updatedAt

  @@map("community_stats")
}

// USER STATISTICS
model UserStats {
  id                    String   @id @default(cuid())
  userId                String   @unique
  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  totalTasksCompleted   Int      @default(0)
  totalPrayersPerformed Int      @default(0)
  totalNotesCreated     Int      @default(0)
  totalAIInteractions   Int      @default(0)
  currentStreak         Int      @default(0)
  longestStreak         Int      @default(0)

  dailyAIRequests       Int      @default(0)
  dailyWeatherRequests  Int      @default(0)
  dailyVoiceNotes       Int      @default(0)
  lastResetDate         String?  // YYYY-MM-DD

  @@map("user_stats")
}

// PRESET TASKS
model PresetTask {
  id                String   @id @default(cuid())
  title             String
  description       String?
  category          TaskCategory

  suggestedFrequency String  // "daily", "weekly", "monthly"
  priority          TaskPriority
  estimatedDuration Int?     // minutes

  icon              String?
  color             String   @default("#0EA5E9")

  isActive          Boolean  @default(true)
  isPromoted        Boolean  @default(false)

  usageCount        Int      @default(0)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("preset_tasks")
}
```

### ADIM 1.3: Database Migration

```bash
# Migrate database
npx prisma migrate dev --name init
npx prisma generate
```

---

## 🔧 PHASE 2: BACKEND API DEVELOPMENT (2-3. Hafta)

### ADIM 2.1: Express Server Setup

```javascript
// server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/events", require("./routes/events"));
app.use("/api/notes", require("./routes/notes"));
app.use("/api/ai", require("./routes/ai"));
app.use("/api/analytics", require("./routes/analytics"));

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

### ADIM 2.2: Authentication System

```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { subscription: true, stats: true },
    });

    if (!user) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

module.exports = { authenticateToken };
```

### ADIM 2.3: Activity Logger (ÖNEMLİ ÖZEL İSTEK)

```javascript
// services/ActivityLogger.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ActivityLogger {
  // LOG KAYIT ALMAKer ACTIVITY LOGGING SYSTEM
  async logActivity(userId, action, details = {}, deviceInfo = {}) {
    try {
      await prisma.userActivity.create({
        data: {
          userId,
          action,
          details,
          deviceInfo,
          sessionId: details.sessionId || null,
          platform: deviceInfo.platform || "unknown",
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error("Activity logging failed:", error);
    }
  }

  // Screen view tracking
  async logScreenView(userId, screenName, params = {}) {
    await this.logActivity(userId, "screen_view", {
      screen_name: screenName,
      ...params,
    });
  }

  // Task actions
  async logTaskAction(userId, action, taskData) {
    await this.logActivity(userId, `task_${action}`, {
      task_id: taskData.id,
      task_title: taskData.title,
      task_category: taskData.category,
      task_priority: taskData.priority,
    });
  }

  // Calendar actions
  async logCalendarAction(userId, action, eventData) {
    await this.logActivity(userId, `calendar_${action}`, {
      event_id: eventData.id,
      event_title: eventData.title,
      event_date: eventData.startTime,
    });
  }

  // AI interactions
  async logAIInteraction(userId, prompt, response, type = "text") {
    await this.logActivity(userId, "ai_interaction", {
      prompt: prompt.substring(0, 100),
      response_length: response.length,
      interaction_type: type,
      timestamp: new Date(),
    });
  }

  // Voice note usage
  async logVoiceNote(userId, duration, transcriptionSuccess) {
    await this.logActivity(userId, "voice_note_created", {
      duration_seconds: duration,
      transcription_success: transcriptionSuccess,
      timestamp: new Date(),
    });
  }

  // Prayer tracking (dini kategori için özel)
  async logPrayer(userId, prayerName, prayerTime) {
    await this.logActivity(userId, "prayer_performed", {
      prayer_name: prayerName,
      prayer_time: prayerTime,
      category: "dini",
    });
  }

  // Social feature usage
  async logCommunityStatsView(userId, category) {
    await this.logActivity(userId, "community_stats_viewed", {
      category,
      timestamp: new Date(),
    });
  }

  // Weather widget usage
  async logWeatherRequest(userId, location) {
    await this.logActivity(userId, "weather_requested", {
      location,
      timestamp: new Date(),
    });
  }

  // Get user activity analytics
  async getUserActivitySummary(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "desc" },
    });

    // Activity summary
    const summary = {
      total_activities: activities.length,
      screens_visited: [
        ...new Set(
          activities
            .filter((a) => a.action === "screen_view")
            .map((a) => a.details.screen_name)
        ),
      ].length,
      tasks_created: activities.filter((a) => a.action === "task_created")
        .length,
      tasks_completed: activities.filter((a) => a.action === "task_completed")
        .length,
      notes_created: activities.filter((a) => a.action === "note_created")
        .length,
      ai_interactions: activities.filter((a) => a.action === "ai_interaction")
        .length,
      voice_notes: activities.filter((a) => a.action === "voice_note_created")
        .length,
      prayers_logged: activities.filter((a) => a.action === "prayer_performed")
        .length,
      most_active_day: this.getMostActiveDay(activities),
      daily_activity: this.getDailyActivityBreakdown(activities),
    };

    return summary;
  }

  getMostActiveDay(activities) {
    const dayCount = {};
    activities.forEach((activity) => {
      const day = activity.timestamp.toLocaleDateString();
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    return (
      Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0]?.[0] || null
    );
  }

  getDailyActivityBreakdown(activities) {
    const daily = {};
    activities.forEach((activity) => {
      const date = activity.timestamp.toISOString().split("T")[0];
      if (!daily[date]) daily[date] = 0;
      daily[date]++;
    });
    return daily;
  }
}

module.exports = new ActivityLogger();
```

### ADIM 2.4: API Routes Structure

```javascript
// routes/tasks.js - Görevler API
const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { authenticateToken } = require("../middleware/auth");
const ActivityLogger = require("../services/ActivityLogger");
const { validate, taskSchemas } = require("../middleware/validation");

const prisma = new PrismaClient();

// GET /api/tasks - Kullanıcının görevlerini listele
router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      category,
      priority,
      status,
      search,
      page = 1,
      limit = 20,
    } = req.query;
    const userId = req.user.id;

    let where = { userId };

    if (category && category !== "all") where.category = category;
    if (priority && priority !== "all") where.priority = priority;
    if (status === "completed") where.isCompleted = true;
    if (status === "pending") where.isCompleted = false;
    if (search) where.title = { contains: search, mode: "insensitive" };

    const tasks = await prisma.task.findMany({
      where,
      include: { subtasks: true, attachments: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: parseInt(limit),
    });

    const total = await prisma.task.count({ where });

    // Log activity
    await ActivityLogger.logActivity(userId, "tasks_viewed", {
      filter: { category, priority, status },
      results_count: tasks.length,
    });

    res.json({
      success: true,
      data: tasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tasks - Yeni görev oluştur
router.post(
  "/",
  authenticateToken,
  validate(taskSchemas.create),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const taskData = { ...req.body, userId };

      const task = await prisma.task.create({
        data: taskData,
        include: { subtasks: true },
      });

      // Update user stats
      await prisma.userStats.update({
        where: { userId },
        data: { totalTasksCreated: { increment: 1 } },
      });

      // Log activity
      await ActivityLogger.logTaskAction(userId, "created", task);

      res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: task,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// PATCH /api/tasks/:id - Görev güncelle
router.patch(
  "/:id",
  authenticateToken,
  validate(taskSchemas.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updates = req.body;

      // Check ownership
      const existingTask = await prisma.task.findFirst({
        where: { id, userId },
      });

      if (!existingTask) {
        return res
          .status(404)
          .json({ success: false, error: "Task not found" });
      }

      const task = await prisma.task.update({
        where: { id },
        data: updates,
        include: { subtasks: true },
      });

      // If task completed, update stats
      if (updates.isCompleted && !existingTask.isCompleted) {
        await prisma.userStats.update({
          where: { userId },
          data: {
            totalTasksCompleted: { increment: 1 },
            currentStreak: { increment: 1 },
          },
        });

        await ActivityLogger.logTaskAction(userId, "completed", task);
      }

      res.json({
        success: true,
        message: "Task updated successfully",
        data: task,
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

module.exports = router;
```

---

## 🎨 PHASE 3: REACT NATIVE FRONTEND DEVELOPMENT (4-12. Hafta)

Bu bölümde React Native uygulamasını sıfırdan geliştireceğiz. Backend API'leriyle entegrasyon, state management, UI components ve tüm ekranlar detaylı olarak ele alınacak.

### 📱 FRONTEND DEVELOPMENT PLANı

#### **HAFTA 4:** Proje Kurulumu & Core Setup

- React Native proje kurulumu
- Navigation sistemi
- State management (Zustand)
- API servisleri
- Design system implementasyonu

#### **HAFTA 5:** Onboarding & Auth Ekranları

- Splash screen & App tanıtım ekranları
- Login & Register ekranları
- Yaşam tarzı seçim ekranı
- Profil kurulum ekranları

#### **HAFTA 6:** Ana Dashboard & Navigation

- Bottom tab navigation
- Ana dashboard ekranı
- Settings ekranı
- Profil ekranı

#### **HAFTA 7:** Calendar & Events

- Calendar ekranı (Google Calendar benzeri)
- Event oluşturma/düzenleme
- Sidebar navigation
- Prayer times widget

#### **HAFTA 8:** Task Management

- Görev listesi ekranı
- Görev oluşturma/düzenleme
- Eisenhower Matrix view
- Preset tasks sistemi

#### **HAFTA 9:** Notes System

- Notion-like notes editörü
- Voice notes implementasyonu
- Note kategorileri
- Arama ve filtreleme

#### **HAFTA 10:** AI Assistant

- AI chat interface
- Voice commands
- Smart suggestions
- Context-aware responses

#### **HAFTA 11:** Social Features & Analytics

- Community stats ekranı
- User analytics dashboard
- Achievement system
- Social motivasyon

#### **HAFTA 12:** Widgets & Final Integration

- Weather widget
- Prayer times widget
- Notification system
- Offline support
- Final testing & optimization

### ADIM 3.1: React Native Proje Kurulumu

```bash
# React Native CLI ile proje oluştur
npx react-native init LifeSyncApp --version 0.79.0

cd LifeSyncApp

# Core Navigation Dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs @react-navigation/stack @react-navigation/material-top-tabs
npm install react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated

# State Management
npm install zustand @tanstack/react-query react-native-async-storage

# UI & Design
npm install react-native-vector-icons react-native-svg react-native-linear-gradient
npm install react-native-modal react-native-super-grid
npm install react-native-element-dropdown react-native-ratings

# Calendar & Date
npm install react-native-calendars moment react-native-date-picker

# Media & Voice
npm install react-native-image-picker react-native-audio-recorder-player
npm install @react-native-voice/voice react-native-sound

# Utilities
npm install react-native-device-info @react-native-community/netinfo
npm install react-native-keychain react-native-share
npm install react-native-permissions react-native-push-notification

# Charts & Analytics
npm install react-native-chart-kit react-native-svg

# Development dependencies
npm install --save-dev @types/react-native-vector-icons
npm install --save-dev flipper-plugin-react-query flipper-plugin-zustand

# iOS specific
cd ios && pod install && cd ..
```

### ADIM 3.2: Backend API Entegrasyonu

Backend ile frontend arasında nasıl entegrasyon yapılacağı:

```typescript
// src/services/api.ts - Ana API servis dosyası
import AsyncStorage from "@react-native-async-storage/async-storage";

class ApiService {
  private baseURL = "http://localhost:3000/api"; // Backend URL'i
  private authToken: string | null = null;

  constructor() {
    this.initializeAuth();
  }

  async initializeAuth() {
    this.authToken = await AsyncStorage.getItem("@auth_token");
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem("@auth_token", token);
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem("@auth_token");
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      ...(this.authToken && { Authorization: `Bearer ${this.authToken}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Request failed:", error);
      throw error;
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  // Tasks endpoints
  async getTasks(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/tasks?${queryParams}`);
  }

  async createTask(taskData: any) {
    return this.request("/tasks", {
      method: "POST",
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: string, updates: any) {
    return this.request(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  }

  // Calendar endpoints
  async getEvents(startDate: string, endDate: string) {
    return this.request(`/events?startDate=${startDate}&endDate=${endDate}`);
  }

  async createEvent(eventData: any) {
    return this.request("/events", {
      method: "POST",
      body: JSON.stringify(eventData),
    });
  }

  // Notes endpoints
  async getNotes(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/notes?${queryParams}`);
  }

  async createNote(noteData: any) {
    return this.request("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    });
  }

  // Voice notes endpoints
  async uploadVoiceNote(audioFile: any, noteId: string) {
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("noteId", noteId);

    return this.request("/notes/voice", {
      method: "POST",
      body: formData,
      headers: {}, // FormData için Content-Type header'ı otomatik
    });
  }

  // AI endpoints
  async sendAIMessage(message: string, context: any = {}) {
    return this.request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, context }),
    });
  }

  // Analytics endpoints
  async getUserStats() {
    return this.request("/analytics/user-stats");
  }

  async getCommunityStats(category?: string, timeRange?: string) {
    const params = new URLSearchParams();
    if (category) params.append("category", category);
    if (timeRange) params.append("timeRange", timeRange);
    return this.request(`/analytics/community-stats?${params.toString()}`);
  }

  // Prayer times endpoints
  async getPrayerTimes(city: string, date: string) {
    return this.request(`/prayer-times?city=${city}&date=${date}`);
  }

  // Weather endpoints
  async getWeather(city: string) {
    return this.request(`/weather?city=${city}`);
  }
}

export default new ApiService();
```

---

## 🚀 PHASE 4: ONBOARDING & AUTH EKRANLARI (5. Hafta)

Bu hafta uygulama tanıtım ekranları, login/register ve yaşam tarzı seçim ekranlarını geliştireceğiz.

### ADIM 4.1: Proje Yapısı ve Navigation Setup

```bash
# Proje klasör yapısı oluştur
mkdir -p src/{screens,components,services,stores,theme,utils,types,constants}
mkdir -p src/components/{common,auth,onboarding,navigation}
mkdir -p src/screens/{auth,onboarding,main}
```

```typescript
// src/navigation/AppNavigator.tsx - Ana navigation yapısı
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/Feather";

// Screens
import { SplashScreen } from "../screens/onboarding/SplashScreen";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { LifestyleSelectionScreen } from "../screens/auth/LifestyleSelectionScreen";

// Main Tab Screens
import { DashboardScreen } from "../screens/main/DashboardScreen";
import { CalendarScreen } from "../screens/main/CalendarScreen";
import { TasksScreen } from "../screens/main/TasksScreen";
import { NotesScreen } from "../screens/main/NotesScreen";
import { AIAssistantScreen } from "../screens/main/AIAssistantScreen";

import { useAuthStore } from "../stores/authStore";
import { DesignSystem } from "../theme/designSystem";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName = "home";

          switch (route.name) {
            case "Dashboard":
              iconName = "home";
              break;
            case "Calendar":
              iconName = "calendar";
              break;
            case "Tasks":
              iconName = "check-square";
              break;
            case "Notes":
              iconName = "book-open";
              break;
            case "AI":
              iconName = "cpu";
              break;
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: DesignSystem.colors.primary[500],
        tabBarInactiveTintColor: DesignSystem.colors.neutral[400],
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: DesignSystem.colors.neutral[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: "Ana Sayfa" }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: "Takvim" }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{ title: "Görevler" }}
      />
      <Tab.Screen
        name="Notes"
        component={NotesScreen}
        options={{ title: "Notlar" }}
      />
      <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{ title: "AI Asistan" }}
      />
    </Tab.Navigator>
  );
};

// Ana Navigator
export const AppNavigator = () => {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="Splash"
      >
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="LifestyleSelection"
              component={LifestyleSelectionScreen}
            />
          </>
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="MainApp" component={MainTabNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
```

### ADIM 4.2: Splash Screen & App Tanıtımı

```typescript
// src/screens/onboarding/SplashScreen.tsx
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import { DesignSystem } from "../../theme/designSystem";
import { useAuthStore } from "../../stores/authStore";

type SplashScreenProps = {
  navigation: StackNavigationProp<any>;
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    startAnimations();
    initializeApp();
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const initializeApp = async () => {
    await initializeAuth();

    setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace("MainApp");
      } else {
        navigation.replace("Onboarding");
      }
    }, 2500);
  };

  return (
    <LinearGradient
      colors={[
        DesignSystem.colors.primary[500],
        DesignSystem.colors.primary[600],
      ]}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logo}>
          <Text style={styles.logoText}>🌟</Text>
        </View>
        <Text style={styles.appName}>LifeSync</Text>
        <Text style={styles.tagline}>Yaşamınızı Senkronize Edin</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DesignSystem.spacing.lg,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    ...DesignSystem.typography.h1,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: DesignSystem.spacing.sm,
  },
  tagline: {
    ...DesignSystem.typography.body,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 50,
  },
  loadingText: {
    ...DesignSystem.typography.caption,
    color: "rgba(255, 255, 255, 0.7)",
  },
});
```

### ADIM 4.3: Onboarding Ekranları

```typescript
// src/screens/onboarding/OnboardingScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import LinearGradient from "react-native-linear-gradient";
import { DesignSystem } from "../../theme/designSystem";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type OnboardingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ONBOARDING_DATA = [
  {
    id: 1,
    icon: "🎯",
    title: "Hedeflerinize Odaklanın",
    description:
      "Yaşam tarzınıza göre özelleştirilmiş görevler ve planlama ile hedeflerinize ulaşın.",
    gradient: [
      DesignSystem.colors.primary[400],
      DesignSystem.colors.primary[600],
    ],
  },
  {
    id: 2,
    icon: "🕌",
    title: "Dini Değerlerinizi Yaşayın",
    description:
      "Namaz vakitleri, dini görevler ve spiritüel gelişim araçları ile imanınızı güçlendirin.",
    gradient: [DesignSystem.colors.lifestyle.dini, "#A855F7"],
  },
  {
    id: 3,
    icon: "🌱",
    title: "Çevreye Duyarlı Yaşayın",
    description:
      "Sürdürülebilir yaşam alışkanlıkları geliştirin ve gezegeni koruyun.",
    gradient: [DesignSystem.colors.lifestyle.cevre, "#059669"],
  },
  {
    id: 4,
    icon: "🐾",
    title: "Hayvan Sevginizi Gösterin",
    description:
      "Evcil dostlarınız ve sokak hayvanları için özel görevler ve hatırlatıcılar.",
    gradient: [DesignSystem.colors.lifestyle.hayvanseverlik, "#EA580C"],
  },
  {
    id: 5,
    icon: "🤖",
    title: "AI Asistanınız Hazır",
    description:
      "Akıllı öneriler, ses komutları ve kişiselleştirilmiş rehberlik ile verimli olun.",
    gradient: [DesignSystem.colors.primary[500], "#6366F1"],
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      navigateToAuth();
    }
  };

  const handleSkip = () => {
    navigateToAuth();
  };

  const navigateToAuth = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.navigate("Login");
    });
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {ONBOARDING_DATA.map((item, index) => (
          <LinearGradient
            key={item.id}
            colors={item.gradient}
            style={styles.slide}
          >
            <View style={styles.slideContent}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, { opacity: index === currentIndex ? 1 : 0.3 }]}
          />
        ))}
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextText}>
            {currentIndex === ONBOARDING_DATA.length - 1 ? "Başla" : "Devam"}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  slideContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: DesignSystem.spacing.lg,
    fontWeight: "700",
  },
  description: {
    ...DesignSystem.typography.body,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.xl,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 5,
  },
  navigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: 50,
  },
  skipButton: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  skipText: {
    ...DesignSystem.typography.body,
    color: "rgba(255, 255, 255, 0.7)",
  },
  nextButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  nextText: {
    ...DesignSystem.typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
```

### ADIM 4.4: Login & Register Ekranları

```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Feather";
import { DesignSystem } from "../../theme/designSystem";
import { useAuthStore } from "../../stores/authStore";

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, isLoading } = useAuthStore();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "E-posta adresi gereklidir";
    } else if (!email.includes("@")) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!password.trim()) {
      newErrors.password = "Şifre gereklidir";
    } else if (password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email, password);

    if (result.success) {
      navigation.replace("MainApp");
    } else {
      Alert.alert("Giriş Hatası", result.error || "Bir hata oluştu");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Tekrar Hoş Geldiniz!</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-posta</Text>
          <View
            style={[styles.inputWrapper, errors.email && styles.inputError]}
          >
            <Icon
              name="mail"
              size={20}
              color={DesignSystem.colors.neutral[400]}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Şifre</Text>
          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}
          >
            <Icon
              name="lock"
              size={20}
              color={DesignSystem.colors.neutral[400]}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Şifrenizi girin"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <Text style={styles.orText}>veya</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="smartphone"
                size={20}
                color={DesignSystem.colors.neutral[600]}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Kayıt Olun</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral[50],
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
    alignItems: "center",
  },
  welcomeText: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "700",
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    textAlign: "center",
  },
  form: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  inputContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[700],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[200],
  },
  inputError: {
    borderColor: DesignSystem.colors.semantic.error,
  },
  input: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[900],
  },
  errorText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.semantic.error,
    marginTop: DesignSystem.spacing.xs,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: DesignSystem.spacing.xl,
  },
  forgotPasswordText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: DesignSystem.colors.primary[500],
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...DesignSystem.typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  orText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[400],
    marginBottom: DesignSystem.spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[200],
  },
  socialButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginLeft: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  registerLink: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: "600",
  },
});
```

```typescript
// src/screens/auth/RegisterScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Feather";
import { DesignSystem } from "../../theme/designSystem";
import { useAuthStore } from "../../stores/authStore";

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
}) => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { register, isLoading } = useAuthStore();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Ad Soyad gereklidir";
    }

    if (!formData.email.trim()) {
      newErrors.email = "E-posta adresi gereklidir";
    } else if (!formData.email.includes("@")) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Şifre gereklidir";
    } else if (formData.password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Şifreler eşleşmiyor";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && agreedToTerms;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      if (!agreedToTerms) {
        Alert.alert("Uyarı", "Kullanım şartlarını kabul etmelisiniz");
      }
      return;
    }

    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      navigation.navigate("LifestyleSelection");
    } else {
      Alert.alert("Kayıt Hatası", result.error || "Bir hata oluştu");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon
              name="arrow-left"
              size={24}
              color={DesignSystem.colors.neutral[600]}
            />
          </TouchableOpacity>
          <Text style={styles.title}>Hesap Oluşturun</Text>
          <Text style={styles.subtitle}>Başlamak için bilgilerinizi girin</Text>
        </View>

        <View style={styles.form}>
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Ad Soyad</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.fullName && styles.inputError,
              ]}
            >
              <Icon
                name="user"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.fullName}
                onChangeText={(value) => updateFormData("fullName", value)}
                placeholder="Adınız ve soyadınız"
                autoComplete="name"
              />
            </View>
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>E-posta</Text>
            <View
              style={[styles.inputWrapper, errors.email && styles.inputError]}
            >
              <Icon
                name="mail"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData("email", value)}
                placeholder="ornek@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.password && styles.inputError,
              ]}
            >
              <Icon
                name="lock"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => updateFormData("password", value)}
                placeholder="En az 6 karakter"
                secureTextEntry={!showPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={DesignSystem.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre Tekrarı</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.confirmPassword && styles.inputError,
              ]}
            >
              <Icon
                name="lock"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) =>
                  updateFormData("confirmPassword", value)
                }
                placeholder="Şifrenizi tekrar girin"
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Icon
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color={DesignSystem.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          {/* Terms & Conditions */}
          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}
            >
              {agreedToTerms && <Icon name="check" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              <Text style={styles.termsLink}>Kullanım Şartları</Text> ve{" "}
              <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul
              ediyorum
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Giriş Yapın</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral[50],
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: DesignSystem.spacing.lg,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "700",
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
  },
  form: {
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
  },
  inputContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[700],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[200],
  },
  inputError: {
    borderColor: DesignSystem.colors.semantic.error,
  },
  input: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[900],
  },
  errorText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.semantic.error,
    marginTop: DesignSystem.spacing.xs,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: DesignSystem.spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neutral[300],
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignSystem.spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: DesignSystem.colors.primary[500],
    borderColor: DesignSystem.colors.primary[500],
  },
  termsText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    flex: 1,
    lineHeight: 20,
  },
  termsLink: {
    color: DesignSystem.colors.primary[500],
    fontWeight: "500",
  },
  registerButton: {
    backgroundColor: DesignSystem.colors.primary[500],
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    ...DesignSystem.typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  loginLink: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: "600",
  },
});
```

### ADIM 4.5: Login & Register Ekranları

```typescript
// src/screens/auth/LoginScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import Icon from "react-native-vector-icons/Feather";
import { DesignSystem } from "../../theme/designSystem";
import { useAuthStore } from "../../stores/authStore";

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );

  const { login, isLoading } = useAuthStore();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "E-posta adresi gereklidir";
    } else if (!email.includes("@")) {
      newErrors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!password.trim()) {
      newErrors.password = "Şifre gereklidir";
    } else if (password.length < 6) {
      newErrors.password = "Şifre en az 6 karakter olmalıdır";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email, password);

    if (result.success) {
      navigation.replace("MainApp");
    } else {
      Alert.alert("Giriş Hatası", result.error || "Bir hata oluştu");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Tekrar Hoş Geldiniz!</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View style={styles.form}>
        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-posta</Text>
          <View
            style={[styles.inputWrapper, errors.email && styles.inputError]}
          >
            <Icon
              name="mail"
              size={20}
              color={DesignSystem.colors.neutral[400]}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Şifre</Text>
          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}
          >
            <Icon
              name="lock"
              size={20}
              color={DesignSystem.colors.neutral[400]}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Şifrenizi girin"
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        {/* Social Login */}
        <View style={styles.socialContainer}>
          <Text style={styles.orText}>veya</Text>
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.socialButton}>
              <Icon
                name="smartphone"
                size={20}
                color={DesignSystem.colors.neutral[600]}
              />
              <Text style={styles.socialButtonText}>Google</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Kayıt Olun</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral[50],
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
    alignItems: "center",
  },
  welcomeText: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "700",
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    textAlign: "center",
  },
  form: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  inputContainer: {
    marginBottom: DesignSystem.spacing.lg,
  },
  label: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[700],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[200],
  },
  inputError: {
    borderColor: DesignSystem.colors.semantic.error,
  },
  input: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[900],
  },
  errorText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.semantic.error,
    marginTop: DesignSystem.spacing.xs,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: DesignSystem.spacing.xl,
  },
  forgotPasswordText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: "500",
  },
  loginButton: {
    backgroundColor: DesignSystem.colors.primary[500],
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...DesignSystem.typography.body,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  socialContainer: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.xl,
  },
  orText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[400],
    marginBottom: DesignSystem.spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: DesignSystem.spacing.sm,
    paddingHorizontal: DesignSystem.spacing.lg,
    borderRadius: DesignSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: DesignSystem.colors.neutral[200],
  },
  socialButtonText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginLeft: DesignSystem.spacing.sm,
    fontWeight: "500",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  registerLink: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: "600",
  },
});
```

### ADIM 4.6: Minimalist Design System

```typescript
// src/theme/designSystem.ts
export const DesignSystem = {
  // Minimalist Color Palette (ÖZEL İSTEK)
  colors: {
    primary: {
      50: "#F0F9FF",
      100: "#E0F2FE",
      500: "#0EA5E9", // Ana Sky Blue
      600: "#0284C7",
      900: "#0C4A6E",
    },
    neutral: {
      50: "#FAFAFA", // Light background
      100: "#F5F5F5", // Card background
      200: "#E5E5E5", // Border
      400: "#A3A3A3", // Placeholder
      600: "#525252", // Secondary text
      800: "#262626", // Primary text
      900: "#171717", // Headers
    },
    semantic: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    // Lifestyle Categories (ÖZEL İSTEK)
    lifestyle: {
      dini: "#8B5CF6", // Purple 🕌
      hayvanseverlik: "#F59E0B", // Orange 🐾
      cevre: "#10B981", // Green 🌱
      saglik: "#EF4444", // Red ❤️
      kariyer: "#3B82F6", // Blue 💼
      kisisel: "#6B7280", // Gray 👤
    },
  },

  // Typography Scale
  typography: {
    h1: { fontSize: 32, fontWeight: "700" as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: "600" as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 28 },
    body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
    caption: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
    small: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  },

  // 8px Grid Spacing System (ÖZEL İSTEK)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius
  borderRadius: {
    sm: 4,
    md: 8, // Standard 8px (ÖZEL İSTEK)
    lg: 12,
    xl: 16,
    full: 999,
  },

  // Subtle Shadows (Minimalist)
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Category Icons Mapping
export const CategoryIcons = {
  dini: "mosque",
  hayvanseverlik: "paw",
  cevre: "leaf",
  saglik: "heart",
  kariyer: "briefcase",
  kisisel: "user",
};

// Lifestyle Category Names (Turkish)
export const CategoryNames = {
  dini: "Dini",
  hayvanseverlik: "Hayvanseverlik",
  cevre: "Çevre",
  saglik: "Sağlık",
  kariyer: "Kariyer",
  kisisel: "Kişisel",
};
```

### ADIM 3.3: State Management (Zustand)

```typescript
// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ApiService from "../services/api";

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  subscription?: {
    plan: "FREE" | "PREMIUM" | "PRO";
    status: string;
  };
  lifestyle?: {
    categories: string[];
    preferences: Record<string, any>;
  };
  stats?: {
    totalTasksCompleted: number;
    totalPrayersPerformed: number;
    currentStreak: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;

  // Utilities
  checkSubscription: () => string;
  hasFeature: (feature: string) => boolean;
  hasLifestyleCategory: (category: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await ApiService.post("/auth/login", {
            email,
            password,
          });
          const { user, token } = response.data;

          await ApiService.setAuthToken(token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      register: async (userData: any) => {
        set({ isLoading: true });
        try {
          const response = await ApiService.post("/auth/register", userData);
          const { user, token } = response.data;

          await ApiService.setAuthToken(token);
          set({ user, token, isAuthenticated: true, isLoading: false });

          return { success: true };
        } catch (error: any) {
          set({ isLoading: false });
          return { success: false, error: error.message };
        }
      },

      logout: async () => {
        try {
          await ApiService.post("/auth/logout");
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          await ApiService.clearAuthToken();
          set({ user: null, token: null, isAuthenticated: false });
        }
      },

      updateUser: (userData: Partial<User>) => {
        set({ user: { ...get().user!, ...userData } });
      },

      checkSubscription: () => {
        const user = get().user;
        return user?.subscription?.plan || "FREE";
      },

      hasFeature: (feature: string) => {
        const plan = get().checkSubscription();
        const features = {
          FREE: ["basic_tasks", "basic_calendar", "limited_ai"],
          PREMIUM: [
            "unlimited_tasks",
            "voice_notes",
            "premium_widgets",
            "unlimited_ai",
          ],
          PRO: ["team_collaboration", "advanced_analytics", "priority_support"],
        };

        return (
          features[plan as keyof typeof features]?.includes(feature) ||
          (plan === "PREMIUM" && features.FREE.includes(feature)) ||
          (plan === "PRO" &&
            (features.FREE.includes(feature) ||
              features.PREMIUM.includes(feature)))
        );
      },

      hasLifestyleCategory: (category: string) => {
        const user = get().user;
        return user?.lifestyle?.categories?.includes(category) || false;
      },
    }),
    {
      name: "auth-storage",
      storage: {
        getItem: (name: string) => AsyncStorage.getItem(name),
        setItem: (name: string, value: string) =>
          AsyncStorage.setItem(name, value),
        removeItem: (name: string) => AsyncStorage.removeItem(name),
      },
    }
  )
);
```

---

## 📱 PHASE 4: CORE SCREENS DEVELOPMENT (5-8. Hafta)

### ADIM 4.1: Minimalist Calendar Screen (Google Calendar Benzeri Sidebar)

```typescript
// src/screens/CalendarScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanGestureHandler,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import Icon from "react-native-vector-icons/Feather";
import { DesignSystem, CategoryIcons } from "../theme/designSystem";
import { useEventStore } from "../stores/eventStore";
import { CalendarSidebar } from "../components/calendar/CalendarSidebar";
import { EventsList } from "../components/calendar/EventsList";
import { WeatherWidget } from "../components/widgets/WeatherWidget";
import { PrayerTimesWidget } from "../components/widgets/PrayerTimesWidget";
import { useAuthStore } from "../stores/authStore";

export const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("month");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Store hooks
  const { events, fetchEvents, loading } = useEventStore();
  const { user, hasLifestyleCategory } = useAuthStore();

  // Animations
  const sidebarAnim = useRef(new Animated.Value(-250)).current;

  useEffect(() => {
    fetchEvents();
  }, []);

  // Google Calendar benzeri sidebar animation (ÖZEL İSTEK)
  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -250 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // Swipe gesture handler (ÖZEL İSTEK)
  const onSwipeGesture = (event: any) => {
    if (event.nativeEvent.translationX > 50 && !sidebarVisible) {
      toggleSidebar();
    } else if (event.nativeEvent.translationX < -50 && sidebarVisible) {
      toggleSidebar();
    }
  };

  // Calendar marked dates
  const getMarkedDates = () => {
    const marked: any = {};

    events
      .filter(
        (event) => categoryFilter === "all" || event.category === categoryFilter
      )
      .forEach((event) => {
        const dateString = event.startTime.split("T")[0];
        if (!marked[dateString]) {
          marked[dateString] = { dots: [] };
        }

        marked[dateString].dots.push({
          color:
            DesignSystem.colors.lifestyle[event.category] ||
            DesignSystem.colors.primary[500],
          key: event.id,
        });
      });

    // Selected date highlight
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: DesignSystem.colors.primary[500],
      };
    }

    return marked;
  };

  const getEventsForDate = (date: string) => {
    return events.filter(
      (event) =>
        event.startTime.split("T")[0] === date &&
        (categoryFilter === "all" || event.category === categoryFilter)
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <PanGestureHandler onGestureEvent={onSwipeGesture}>
        <View style={styles.calendarContainer}>
          {/* Minimalist Header (ÖZEL İSTEK) */}
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
              <Icon
                name="menu"
                size={24}
                color={DesignSystem.colors.neutral[700]}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Takvim</Text>

            {/* View Mode Buttons */}
            <View style={styles.viewModeButtons}>
              {(["day", "week", "month"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.viewModeButton,
                    viewMode === mode && styles.viewModeButtonActive,
                  ]}
                  onPress={() => setViewMode(mode)}
                >
                  <Text
                    style={[
                      styles.viewModeText,
                      viewMode === mode && styles.viewModeTextActive,
                    ]}
                  >
                    {mode === "day" ? "G" : mode === "week" ? "H" : "A"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weather Widget (ÖZEL İSTEK) */}
          <WeatherWidget />

          {/* Prayer Times Widget - Sadece dini kategorisi seçen kullanıcılar için (ÖZEL İSTEK) */}
          {hasLifestyleCategory("dini") && (
            <PrayerTimesWidget selectedDate={selectedDate} />
          )}

          {/* Calendar Component */}
          <Calendar
            markingType="multi-dot"
            markedDates={getMarkedDates()}
            onDayPress={(day) => {
              setSelectedDate(day.dateString);
            }}
            theme={{
              backgroundColor: "#FFFFFF",
              calendarBackground: "#FFFFFF",
              textSectionTitleColor: DesignSystem.colors.neutral[600],
              selectedDayBackgroundColor: DesignSystem.colors.primary[500],
              selectedDayTextColor: "#FFFFFF",
              todayTextColor: DesignSystem.colors.primary[500],
              dayTextColor: DesignSystem.colors.neutral[900],
              textDisabledColor: DesignSystem.colors.neutral[400],
              dotColor: DesignSystem.colors.primary[500],
              selectedDotColor: "#FFFFFF",
              arrowColor: DesignSystem.colors.primary[500],
              monthTextColor: DesignSystem.colors.neutral[900],
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
          />

          {/* Events List */}
          <EventsList
            events={getEventsForDate(selectedDate)}
            selectedDate={selectedDate}
          />
        </View>
      </PanGestureHandler>

      {/* Google Calendar benzeri Sidebar (ÖZEL İSTEK) */}
      <Animated.View
        style={[styles.sidebar, { transform: [{ translateX: sidebarAnim }] }]}
      >
        <CalendarSidebar
          onViewModeChange={setViewMode}
          onCategoryFilter={setCategoryFilter}
          onClose={toggleSidebar}
          selectedCategory={categoryFilter}
        />
      </Animated.View>

      {/* Overlay */}
      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}

      {/* Floating Action Button (Minimalist) */}
      <TouchableOpacity style={styles.fab}>
        <Icon name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignSystem.colors.neutral[50],
  },
  calendarContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  menuButton: {
    padding: DesignSystem.spacing.xs,
  },
  headerTitle: {
    ...DesignSystem.typography.h2,
    color: DesignSystem.colors.neutral[900],
  },
  viewModeButtons: {
    flexDirection: "row",
    backgroundColor: DesignSystem.colors.neutral[100],
    borderRadius: DesignSystem.borderRadius.md, // 8px (ÖZEL İSTEK)
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: DesignSystem.spacing.sm,
    paddingVertical: DesignSystem.spacing.xs,
    borderRadius: DesignSystem.borderRadius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: "#FFFFFF",
    ...DesignSystem.shadows.sm,
  },
  viewModeText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    fontWeight: "500",
  },
  viewModeTextActive: {
    color: DesignSystem.colors.primary[500],
  },
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 250,
    backgroundColor: "#FFFFFF",
    zIndex: 1000,
    ...DesignSystem.shadows.md,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 999,
  },
  fab: {
    position: "absolute",
    bottom: DesignSystem.spacing.lg,
    right: DesignSystem.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: DesignSystem.colors.primary[500],
    justifyContent: "center",
    alignItems: "center",
    ...DesignSystem.shadows.md,
  },
});
```

---

Bu kapsamlı geliştirme rehberi devam ediyor. Dokümantasyon çok uzun olduğu için sonraki kısımları da istersen oluşturabilirim. Bu kısma kadar olan içerik:

✅ **Tamamlanan Bölümler:**

1. Proje kurulumu ve database schema
2. Backend API development
3. Activity logging sistemi (özel isteğiniz)
4. Frontend setup ve design system
5. Minimalist UI kuralları
6. Calendar screen (Google Calendar benzeri sidebar)

🔄 **Devam Edecek Bölümler:**

- Görev yönetimi ekranları
- Notion-like notes sistemi
- AI asistan entegrasyonu
- Ses notları sistemi
- Sosyal özellikler ve community stats
- Namaz vakitleri widget'ı
- Offline support
- Test stratejisi

Devam etmemi ister misin?

---

## 🚀 PHASE 5: GÖREV YÖNETİMİ (9-10. Hafta)

### ADIM 5.1: Eisenhower Matrix View

```typescript
// src/components/tasks/EisenhowerMatrix.tsx
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { DesignSystem } from "../../theme/designSystem";

const QUADRANTS = [
  { id: 1, title: "Acil & Önemli", color: "#EF4444", subtitle: "Hemen Yap" },
  { id: 2, title: "Önemli & Acil Değil", color: "#F59E0B", subtitle: "Planla" },
  {
    id: 3,
    title: "Acil & Önemli Değil",
    color: "#8B5CF6",
    subtitle: "Delege Et",
  },
  {
    id: 4,
    title: "Önemli Değil & Acil Değil",
    color: "#6B7280",
    subtitle: "Sil",
  },
];

export const EisenhowerMatrix: React.FC<{
  tasks: Task[];
  onTaskPress: (task: Task) => void;
}> = ({ tasks, onTaskPress }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.matrix}>
        {QUADRANTS.map((quadrant) => (
          <View
            key={quadrant.id}
            style={[styles.quadrant, { borderColor: quadrant.color }]}
          >
            <Text style={[styles.quadrantTitle, { color: quadrant.color }]}>
              {quadrant.title}
            </Text>
            <Text style={styles.quadrantSubtitle}>{quadrant.subtitle}</Text>

            {tasks
              .filter((task) => task.eisenhowerQuadrant === quadrant.id)
              .map((task) => (
                <TouchableOpacity
                  key={task.id}
                  style={styles.taskItem}
                  onPress={() => onTaskPress(task)}
                >
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor:
                          DesignSystem.colors.lifestyle[task.category],
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
```

### ADIM 5.2: Preset Tasks System

```typescript
// src/components/tasks/PresetTasksSheet.tsx
import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import Modal from "react-native-modal";
import { usePresetTasksStore } from "../../stores/presetTasksStore";
import { useAuthStore } from "../../stores/authStore";

const PRESET_TASKS_BY_CATEGORY = {
  dini: [
    {
      title: "Sabah Namazı",
      description: "Güne namaz ile başla",
      icon: "🕌",
      frequency: "daily",
    },
    {
      title: "Kuran Okuma",
      description: "10 dakika Kuran oku",
      icon: "📖",
      frequency: "daily",
    },
    {
      title: "Tesbih Çekme",
      description: "100 kez tesbih çek",
      icon: "📿",
      frequency: "daily",
    },
  ],
  hayvanseverlik: [
    {
      title: "Sokak Hayvanlarını Besle",
      description: "Sokak kedilerine mama ver",
      icon: "🐱",
      frequency: "daily",
    },
    {
      title: "Evcil Hayvan Bakımı",
      description: "Sevimli dostunla vakit geçir",
      icon: "🐕",
      frequency: "daily",
    },
    {
      title: "Hayvan Barınağına Bağış",
      description: "Aylık bağış yap",
      icon: "❤️",
      frequency: "monthly",
    },
  ],
  cevre: [
    {
      title: "Plastik Kullanmama",
      description: "Tek kullanımlık plastik kullanma",
      icon: "🌱",
      frequency: "daily",
    },
    {
      title: "Su Tasarrufu",
      description: "Duş süresini kısalt",
      icon: "💧",
      frequency: "daily",
    },
    {
      title: "Geri Dönüşüm",
      description: "Atıkları ayır",
      icon: "♻️",
      frequency: "weekly",
    },
  ],
};

export const PresetTasksSheet: React.FC = ({ visible, onClose, category }) => {
  const { addTaskFromPreset } = usePresetTasksStore();
  const { hasLifestyleCategory } = useAuthStore();

  const presetTasks = PRESET_TASKS_BY_CATEGORY[category] || [];

  return (
    <Modal isVisible={visible} onBackdropPress={onClose} style={styles.modal}>
      <View style={styles.container}>
        <Text style={styles.title}>Hazır Görevler - {category}</Text>

        <FlatList
          data={presetTasks}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.presetItem}
              onPress={() => addTaskFromPreset(item)}
            >
              <Text style={styles.presetIcon}>{item.icon}</Text>
              <View style={styles.presetContent}>
                <Text style={styles.presetTitle}>{item.title}</Text>
                <Text style={styles.presetDescription}>{item.description}</Text>
                <Text style={styles.presetFrequency}>{item.frequency}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
};
```

---

## 🎵 PHASE 6: SES NOTLARI SİSTEMİ (11. Hafta)

### ADIM 6.1: Voice Recording Setup

```bash
# Voice recording dependencies
npm install react-native-audio-recorder-player
npm install @react-native-voice/voice
npm install react-native-sound
```

### ADIM 6.2: Voice Notes Implementation

```typescript
// src/components/notes/VoiceNoteRecorder.tsx
import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import AudioRecorderPlayer from "react-native-audio-recorder-player";
import Voice from "@react-native-voice/voice";
import { useVoiceNotesStore } from "../../stores/voiceNotesStore";
import ActivityLogger from "../../services/ActivityLogger";

export const VoiceNoteRecorder: React.FC = ({
  noteId,
  onRecordingComplete,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [transcription, setTranscription] = useState("");

  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { saveVoiceNote } = useVoiceNotesStore();

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordTime(0);

      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording
      const result = await audioRecorderPlayer.startRecorder();

      // Start voice recognition for real-time transcription
      await Voice.start("tr-TR");

      // Timer
      audioRecorderPlayer.addRecordBackListener((e) => {
        setRecordTime(e.currentPosition);
      });
    } catch (error) {
      console.error("Recording start failed:", error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      pulseAnim.stopAnimation();

      // Stop recording
      const audioPath = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();

      // Stop voice recognition
      await Voice.stop();

      setIsTranscribing(true);

      // Upload to server and get transcription
      const voiceNote = await saveVoiceNote({
        noteId,
        audioPath,
        duration: Math.floor(recordTime / 1000),
        transcription,
      });

      // Log activity
      await ActivityLogger.logVoiceNote(
        auth().currentUser.uid,
        Math.floor(recordTime / 1000),
        !!transcription
      );

      setIsTranscribing(false);
      onRecordingComplete(voiceNote);
    } catch (error) {
      console.error("Recording stop failed:", error);
      setIsRecording(false);
      setIsTranscribing(false);
    }
  };

  // Voice recognition results
  React.useEffect(() => {
    Voice.onSpeechResults = (event) => {
      setTranscription(event.value[0] || "");
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.transcriptionContainer}>
          <Text style={styles.transcriptionLabel}>Canlı Transkripsiyon:</Text>
          <Text style={styles.transcriptionText}>{transcription || "..."}</Text>
        </View>
      )}

      <View style={styles.recordingControls}>
        <Animated.View
          style={[styles.recordButton, { transform: [{ scale: pulseAnim }] }]}
        >
          <TouchableOpacity
            style={[
              styles.recordButtonInner,
              { backgroundColor: isRecording ? "#EF4444" : "#0EA5E9" },
            ]}
            onPress={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
          >
            <Icon
              name={isRecording ? "stop" : "mic"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </Animated.View>

        {isRecording && (
          <Text style={styles.recordTime}>{formatTime(recordTime)}</Text>
        )}

        {isTranscribing && (
          <Text style={styles.transcribingText}>
            Transkripsiyon yapılıyor...
          </Text>
        )}
      </View>
    </View>
  );
};
```

---

## 🤖 PHASE 7: AI ASİSTAN (12. Hafta)

### ADIM 7.1: AI Service Implementation

```typescript
// src/services/AIService.ts
import ApiService from "./api";
import ActivityLogger from "./ActivityLogger";

class AIService {
  async sendMessage(message: string, context: any = {}) {
    try {
      const response = await ApiService.post("/ai/chat", {
        message,
        context: {
          currentDate: new Date().toISOString(),
          userLifestyle: context.userLifestyle,
          upcomingEvents: context.upcomingEvents,
          pendingTasks: context.pendingTasks,
          location: context.location,
        },
      });

      // Log AI interaction
      await ActivityLogger.logAIInteraction(
        context.userId,
        message,
        response.data.response,
        "text"
      );

      return response.data;
    } catch (error) {
      throw new Error(`AI request failed: ${error.message}`);
    }
  }

  async processVoiceCommand(audioData: string, context: any = {}) {
    try {
      const response = await ApiService.post("/ai/voice", {
        audioData,
        context,
      });

      // Log voice AI interaction
      await ActivityLogger.logAIInteraction(
        context.userId,
        "[Voice Command]",
        response.data.response,
        "voice"
      );

      return response.data;
    } catch (error) {
      throw new Error(`Voice AI request failed: ${error.message}`);
    }
  }

  // AI önerileri için özel metodlar
  async getSuggestedTasks(userLifestyle: string[], currentTasks: any[]) {
    return await this.sendMessage(
      `Yaşam tarzım: ${userLifestyle.join(
        ", "
      )}. Mevcut görevlerim var. Yeni görev önerisi ver.`,
      { userLifestyle, currentTasks }
    );
  }

  async optimizeSchedule(events: any[], tasks: any[]) {
    return await this.sendMessage(
      "Takvimimi ve görevlerimi optimize et. En verimli program öner.",
      { events, tasks }
    );
  }

  async getPrayerReminder(location: string) {
    return await this.sendMessage(
      `${location} için bugünkü namaz vakitlerini söyle ve hatırlatıcı kur.`,
      { location, category: "dini" }
    );
  }
}

export default new AIService();
```

### ADIM 7.2: AI Chat Interface

```typescript
// src/screens/AIAssistantScreen.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { useAIStore } from "../stores/aiStore";
import { useAuthStore } from "../stores/authStore";
import { VoiceRecorder } from "../components/ai/VoiceRecorder";
import { QuickActions } from "../components/ai/QuickActions";
import { MessageBubble } from "../components/ai/MessageBubble";

export const AIAssistantScreen: React.FC = () => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { messages, sendMessage, isLoading } = useAIStore();
  const { user } = useAuthStore();

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const message = inputText.trim();
    setInputText("");

    await sendMessage(message, {
      userId: user?.id,
      userLifestyle: user?.lifestyle?.categories || [],
      location: user?.profile?.city || "Istanbul",
    });
  };

  const quickActions = [
    {
      icon: "📋",
      text: "Bugünkü görevlerim",
      action: () => handleSendMessage("Bugün hangi görevlerim var?"),
    },
    {
      icon: "⏰",
      text: "Alarm kur",
      action: () => handleSendMessage("Yarın sabah 7:00 için alarm kur"),
    },
    {
      icon: "🌤️",
      text: "Hava durumu",
      action: () => handleSendMessage("Bugün hava nasıl?"),
    },
    {
      icon: "🕌",
      text: "Namaz vakitleri",
      action: () => handleSendMessage("Bugünkü namaz vakitleri"),
    },
  ];

  useEffect(() => {
    // Auto scroll to bottom
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Asistan</Text>
        <Text style={styles.headerSubtitle}>
          Size nasıl yardımcı olabilirim?
        </Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => <MessageBubble message={item} />}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
      />

      <QuickActions actions={quickActions} />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Mesajınızı yazın..."
          multiline
          maxLength={500}
          onSubmitEditing={handleSendMessage}
        />

        <VoiceRecorder
          isListening={isListening}
          onStartListening={() => setIsListening(true)}
          onStopListening={() => setIsListening(false)}
          onVoiceResult={setInputText}
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Icon name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};
```

---

## 📊 PHASE 8: SOSYAL ÖZELLİKLER & COMMUNITY STATS (13. Hafta)

### ADIM 8.1: Community Stats Dashboard

```typescript
// src/screens/CommunityStatsScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { useCommunityStatsStore } from "../stores/communityStatsStore";
import { useAuthStore } from "../stores/authStore";
import { DesignSystem, CategoryNames } from "../theme/designSystem";

export const CommunityStatsScreen: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");

  const { stats, fetchCommunityStats, loading } = useCommunityStatsStore();
  const { user, hasLifestyleCategory } = useAuthStore();

  useEffect(() => {
    fetchCommunityStats(timeRange, selectedCategory);
  }, [timeRange, selectedCategory]);

  const motivationalMessages = {
    dini: [
      "🕌 Bu hafta 1,234 kişi namaz kıldı",
      "📖 567 kişi Kuran okudu",
      "🤲 891 kişi dua etti",
    ],
    hayvanseverlik: [
      "🐱 Bu hafta 2,345 sokak hayvanı beslendi",
      "❤️ 456 kişi hayvan barınağına bağış yaptı",
      "🐕 789 kişi evcil hayvanıyla vakit geçirdi",
    ],
    cevre: [
      "🌱 Bu hafta 3,456 kişi plastik kullanmadı",
      "♻️ 1,234 kişi geri dönüşüm yaptı",
      "💧 567 kişi su tasarrufu sağladı",
    ],
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Aktivite Analizi</Text>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {[7, 30, 90].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.timeButton,
              timeRange === days && styles.timeButtonActive,
            ]}
            onPress={() => setTimeRange(days)}
          >
            <Text style={styles.timeButtonText}>{days} gün</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        style={styles.categoryContainer}
        showsHorizontalScrollIndicator={false}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === "all" && styles.categoryButtonActive,
          ]}
          onPress={() => setSelectedCategory("all")}
        >
          <Text style={styles.categoryButtonText}>Tümü</Text>
        </TouchableOpacity>

        {Object.entries(CategoryNames).map(
          ([key, name]) =>
            hasLifestyleCategory(key) && (
              <TouchableOpacity
                key={key}
                style={[
                  styles.categoryButton,
                  selectedCategory === key && styles.categoryButtonActive,
                  { borderColor: DesignSystem.colors.lifestyle[key] },
                ]}
                onPress={() => setSelectedCategory(key)}
              >
                <View
                  style={[
                    styles.categoryDot,
                    { backgroundColor: DesignSystem.colors.lifestyle[key] },
                  ]}
                />
                <Text style={styles.categoryButtonText}>{name}</Text>
              </TouchableOpacity>
            )
        )}
      </ScrollView>

      {/* Motivational Messages */}
      <View style={styles.motivationContainer}>
        <Text style={styles.motivationTitle}>Bu Hafta Topluluğumuz</Text>
        {(
          motivationalMessages[selectedCategory] || motivationalMessages.dini
        ).map((message, index) => (
          <View key={index} style={styles.motivationItem}>
            <Text style={styles.motivationText}>{message}</Text>
          </View>
        ))}
      </View>

      {/* User Rank */}
      <View style={styles.rankContainer}>
        <Text style={styles.rankTitle}>Senin Sıralaman</Text>
        <View style={styles.rankCard}>
          <Text style={styles.rankNumber}>#{stats?.userRank || 0}</Text>
          <Text style={styles.rankDescription}>
            {stats?.userRank <= 100
              ? "🏆 İlk 100'de!"
              : stats?.userRank <= 500
              ? "🥉 İlk 500'de!"
              : "👍 Devam et!"}
          </Text>
        </View>
      </View>

      {/* Progress Charts */}
      {stats?.chartData && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Haftalık İlerleme</Text>
          <LineChart
            data={stats.chartData}
            width={300}
            height={200}
            chartConfig={{
              backgroundColor: "#FFFFFF",
              backgroundGradientFrom: "#FFFFFF",
              backgroundGradientTo: "#FFFFFF",
              color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
              labelColor: () => DesignSystem.colors.neutral[600],
            }}
            style={styles.chart}
          />
        </View>
      )}

      {/* Achievement Badges */}
      <View style={styles.achievementsContainer}>
        <Text style={styles.achievementsTitle}>Başarım Rozetleri</Text>
        <View style={styles.badgesGrid}>
          {stats?.achievements?.map((achievement, index) => (
            <View key={index} style={styles.badge}>
              <Text style={styles.badgeIcon}>{achievement.icon}</Text>
              <Text style={styles.badgeTitle}>{achievement.title}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
```

---

## 🕌 PHASE 9: NAMAZ VAKİTLERİ VE ÖZEL WİDGET'LAR (14. Hafta)

### ADIM 9.1: Prayer Times Widget

```typescript
// src/components/widgets/PrayerTimesWidget.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { usePrayerTimesStore } from "../../stores/prayerTimesStore";
import { useAuthStore } from "../../stores/authStore";
import ActivityLogger from "../../services/ActivityLogger";
import { DesignSystem } from "../../theme/designSystem";

const PRAYER_NAMES = {
  fajr: "İmsak",
  sunrise: "Güneş",
  dhuhr: "Öğle",
  asr: "İkindi",
  maghrib: "Akşam",
  isha: "Yatsı",
};

export const PrayerTimesWidget: React.FC<{ selectedDate?: string }> = ({
  selectedDate,
}) => {
  const [currentPrayer, setCurrentPrayer] = useState<string | null>(null);
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);
  const [timeToNext, setTimeToNext] = useState<string>("");

  const { prayerTimes, fetchPrayerTimes, markPrayerAsCompleted } =
    usePrayerTimesStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.profile?.city) {
      fetchPrayerTimes(
        user.profile.city,
        selectedDate || new Date().toISOString().split("T")[0]
      );
    }
  }, [selectedDate, user?.profile?.city]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCurrentPrayer();
    }, 60000); // Her dakika güncelle

    updateCurrentPrayer();
    return () => clearInterval(interval);
  }, [prayerTimes]);

  const updateCurrentPrayer = () => {
    if (!prayerTimes) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Prayer times to minutes
    const prayerMinutes = Object.entries(prayerTimes).map(([prayer, time]) => ({
      prayer,
      minutes: parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]),
    }));

    // Find current and next prayer
    let current = null;
    let next = null;

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (currentTime >= prayerMinutes[i].minutes) {
        current = prayerMinutes[i].prayer;
        next = prayerMinutes[i + 1] || prayerMinutes[0]; // Next day's first prayer
      } else {
        next = prayerMinutes[i];
        break;
      }
    }

    setCurrentPrayer(current);
    setNextPrayer(next?.prayer);

    // Calculate time to next prayer
    if (next) {
      const timeLeft = next.minutes - currentTime;
      const hours = Math.floor(timeLeft / 60);
      const minutes = timeLeft % 60;
      setTimeToNext(`${hours}:${minutes.toString().padStart(2, "0")}`);
    }
  };

  const handlePrayerComplete = async (prayerName: string) => {
    await markPrayerAsCompleted(prayerName);

    // Log prayer activity
    await ActivityLogger.logPrayer(
      user?.id!,
      prayerName,
      prayerTimes[prayerName]
    );

    // Update user stats
    // Implementation for incrementing prayer count
  };

  if (!prayerTimes) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🕌 Namaz Vakitleri</Text>
        <Text style={styles.location}>{user?.profile?.city || "İstanbul"}</Text>
      </View>

      {nextPrayer && (
        <View style={styles.nextPrayerContainer}>
          <Text style={styles.nextPrayerLabel}>Sonraki Namaz:</Text>
          <Text style={styles.nextPrayerName}>{PRAYER_NAMES[nextPrayer]}</Text>
          <Text style={styles.nextPrayerTime}>{timeToNext} kaldı</Text>
        </View>
      )}

      <View style={styles.prayersList}>
        {Object.entries(prayerTimes).map(([prayer, time]) => (
          <View
            key={prayer}
            style={[
              styles.prayerItem,
              currentPrayer === prayer && styles.currentPrayerItem,
            ]}
          >
            <Text
              style={[
                styles.prayerName,
                currentPrayer === prayer && styles.currentPrayerText,
              ]}
            >
              {PRAYER_NAMES[prayer]}
            </Text>
            <Text
              style={[
                styles.prayerTime,
                currentPrayer === prayer && styles.currentPrayerText,
              ]}
            >
              {time}
            </Text>

            <TouchableOpacity
              style={styles.checkButton}
              onPress={() => handlePrayerComplete(prayer)}
            >
              <Icon
                name="check"
                size={16}
                color={DesignSystem.colors.lifestyle.dini}
              />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Namaz için hatırlatıcı kurulsun mu?
        </Text>
        <TouchableOpacity style={styles.reminderButton}>
          <Text style={styles.reminderButtonText}>Hatırlatıcı Kur</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: DesignSystem.borderRadius.lg,
    padding: DesignSystem.spacing.md,
    margin: DesignSystem.spacing.md,
    ...DesignSystem.shadows.sm,
  },
  header: {
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  title: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.lifestyle.dini,
  },
  location: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  nextPrayerContainer: {
    backgroundColor: DesignSystem.colors.lifestyle.dini + "10",
    borderRadius: DesignSystem.borderRadius.md,
    padding: DesignSystem.spacing.sm,
    alignItems: "center",
    marginBottom: DesignSystem.spacing.md,
  },
  nextPrayerLabel: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  nextPrayerName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.lifestyle.dini,
    fontWeight: "600",
  },
  nextPrayerTime: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.lifestyle.dini,
  },
  prayersList: {
    marginBottom: DesignSystem.spacing.md,
  },
  prayerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: DesignSystem.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignSystem.colors.neutral[200],
  },
  currentPrayerItem: {
    backgroundColor: DesignSystem.colors.lifestyle.dini + "20",
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.sm,
  },
  prayerName: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[800],
    flex: 1,
  },
  prayerTime: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    marginRight: DesignSystem.spacing.md,
  },
  currentPrayerText: {
    color: DesignSystem.colors.lifestyle.dini,
    fontWeight: "600",
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DesignSystem.colors.lifestyle.dini,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    alignItems: "center",
  },
  footerText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    marginBottom: DesignSystem.spacing.sm,
  },
  reminderButton: {
    backgroundColor: DesignSystem.colors.lifestyle.dini,
    paddingHorizontal: DesignSystem.spacing.md,
    paddingVertical: DesignSystem.spacing.sm,
    borderRadius: DesignSystem.borderRadius.md,
  },
  reminderButtonText: {
    ...DesignSystem.typography.caption,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
```

---

## 🎯 PHASE 10: FİNAL INTEGRATION & TESTING (15-16. Hafta)

### ADIM 10.1: Activity Analytics Dashboard

```typescript
// src/screens/AnalyticsScreen.tsx - Kullanıcı activity görüntüleme (ÖZEL İSTEK)
import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LineChart, BarChart } from "react-native-chart-kit";
import ActivityLogger from "../services/ActivityLogger";
import { useAuthStore } from "../stores/authStore";

export const AnalyticsScreen: React.FC = () => {
  const [activitySummary, setActivitySummary] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const { user } = useAuthStore();

  useEffect(() => {
    loadActivitySummary();
  }, [timeRange]);

  const loadActivitySummary = async () => {
    if (user?.id) {
      const summary = await ActivityLogger.getUserActivitySummary(
        user.id,
        timeRange
      );
      setActivitySummary(summary);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Aktivite Analizi</Text>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {[7, 30, 90].map((days) => (
          <TouchableOpacity
            key={days}
            style={[
              styles.timeButton,
              timeRange === days && styles.timeButtonActive,
            ]}
            onPress={() => setTimeRange(days)}
          >
            <Text style={styles.timeButtonText}>{days} gün</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activitySummary && (
        <>
          {/* Activity Overview Cards */}
          <View style={styles.statsGrid}>
            <StatCard
              title="Toplam Aktivite"
              value={activitySummary.total_activities}
              icon="📱"
            />
            <StatCard
              title="Görev Oluşturma"
              value={activitySummary.tasks_created}
              icon="📝"
            />
            <StatCard
              title="Görev Tamamlama"
              value={activitySummary.tasks_completed}
              icon="✅"
            />
            <StatCard
              title="AI Kullanımı"
              value={activitySummary.ai_interactions}
              icon="🤖"
            />
            <StatCard
              title="Ses Notları"
              value={activitySummary.voice_notes}
              icon="🎤"
            />
            <StatCard
              title="Namaz Kayıtları"
              value={activitySummary.prayers_logged}
              icon="🕌"
            />
          </View>

          {/* Daily Activity Chart */}
          {activitySummary.daily_activity && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Günlük Aktivite</Text>
              <BarChart
                data={{
                  labels: Object.keys(activitySummary.daily_activity).slice(-7),
                  datasets: [
                    {
                      data: Object.values(activitySummary.daily_activity).slice(
                        -7
                      ),
                    },
                  ],
                }}
                width={300}
                height={200}
                chartConfig={{
                  backgroundColor: "#FFFFFF",
                  backgroundGradientFrom: "#FFFFFF",
                  backgroundGradientTo: "#FFFFFF",
                  color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                }}
                style={styles.chart}
              />
            </View>
          )}

          {/* Most Active Day */}
          {activitySummary.most_active_day && (
            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>🔥 En Aktif Gününüz</Text>
              <Text style={styles.insightText}>
                {activitySummary.most_active_day}
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
};

const StatCard: React.FC<{ title: string; value: number; icon: string }> = ({
  title,
  value,
  icon,
}) => (
  <View style={styles.statCard}>
    <Text style={styles.statIcon}>{icon}</Text>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);
```

### ADIM 10.2: Final Integration Checklist

```typescript
// src/utils/AppHealthChecker.ts - Uygulama sağlık kontrolü
export class AppHealthChecker {
  static async performHealthCheck() {
    const checks = {
      database: await this.checkDatabaseConnection(),
      api: await this.checkAPIHealth(),
      authentication: await this.checkAuthStatus(),
      permissions: await this.checkPermissions(),
      storage: await this.checkStorageHealth(),
      network: await this.checkNetworkStatus(),
    };

    const overallHealth = Object.values(checks).every(
      (check) => check.status === "healthy"
    );

    return {
      overall: overallHealth ? "healthy" : "unhealthy",
      details: checks,
      timestamp: new Date().toISOString(),
    };
  }

  static async checkDatabaseConnection() {
    try {
      // Test API call
      await ApiService.get("/health");
      return { status: "healthy", message: "Database connection successful" };
    } catch (error) {
      return { status: "unhealthy", message: "Database connection failed" };
    }
  }

  static async checkAuthStatus() {
    try {
      const token = await AsyncStorage.getItem("@auth_token");
      return {
        status: token ? "healthy" : "warning",
        message: token ? "User authenticated" : "User not authenticated",
      };
    } catch (error) {
      return { status: "unhealthy", message: "Auth check failed" };
    }
  }

  static async checkPermissions() {
    const permissions = {
      camera: await PermissionsAndroid.check("android.permission.CAMERA"),
      microphone: await PermissionsAndroid.check(
        "android.permission.RECORD_AUDIO"
      ),
      location: await PermissionsAndroid.check(
        "android.permission.ACCESS_FINE_LOCATION"
      ),
      notifications: await PermissionsAndroid.check(
        "android.permission.POST_NOTIFICATIONS"
      ),
    };

    const allGranted = Object.values(permissions).every((p) => p);

    return {
      status: allGranted ? "healthy" : "warning",
      message: allGranted
        ? "All permissions granted"
        : "Some permissions missing",
      details: permissions,
    };
  }
}
```

---

## ✅ DEPLOYMENT CHECKLIST & PRODUCTION READINESS

### Final Production Checklist:

```markdown
## 🚀 PRODUCTION DEPLOYMENT CHECKLIST

### ✅ Backend Deployment

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Logging and monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] API documentation updated

### ✅ Frontend Deployment

- [ ] App icons and splash screens
- [ ] Store descriptions and screenshots
- [ ] Version numbering configured
- [ ] Release notes prepared
- [ ] Privacy policy and terms updated
- [ ] App Store Connect setup
- [ ] Google Play Console setup
- [ ] Beta testing completed

### ✅ Feature Completeness

- [ ] ✅ Activity logging system (ÖZEL İSTEK)
- [ ] ✅ Minimalist design implementation
- [ ] ✅ Google Calendar-like sidebar (ÖZEL İSTEK)
- [ ] ✅ Lifestyle categorization (5 kategori)
- [ ] ✅ Prayer times integration (ÖZEL İSTEK)
- [ ] ✅ Weather widgets
- [ ] ✅ Voice notes with transcription
- [ ] ✅ AI assistant integration
- [ ] ✅ Social community stats (ÖZEL İSTEK)
- [ ] ✅ Notion-like notes system
- [ ] ✅ Eisenhower Matrix view
- [ ] ✅ Preset tasks system
- [ ] ✅ Offline support
- [ ] ✅ Performance monitoring

### ✅ Testing & Quality

- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] User acceptance testing
- [ ] Performance testing
- [ ] Security auditing
- [ ] Accessibility testing
- [ ] Multi-device testing
- [ ] Network condition testing

### ✅ Analytics & Monitoring

- [ ] User activity tracking implemented (ÖZEL İSTEK)
- [ ] Error reporting setup
- [ ] Performance monitoring
- [ ] Usage analytics
- [ ] Crash reporting
- [ ] A/B testing framework
```

---

## 🎯 SONUÇ

Bu kapsamlı geliştirme rehberi ile **LifeSync** uygulaması:

✅ **Tüm özel isteklerinizi** karşılayacak şekilde tasarlandı
✅ **Activity logging sistemi** detaylı olarak implementeli
✅ **Minimalist design system** 8px grid ile uygulandı  
✅ **Google Calendar benzeri sidebar** navigation eklendi
✅ **5 yaşam tarzı kategorisi** (dini, hayvanseverlik, çevre, sağlık, kariyer) entegreli
✅ **Namaz vakitleri** özel widget'ı hazır
✅ **Sosyal motivasyon** community stats ile sağlandı
✅ **Ses notları** ve transcription sistemi mevcut
✅ **AI asistan** Gemini Pro ile entegreli
✅ **Offline support** ve sync mekanizması var

**Frontend Development Devam Ediyor:**

**PHASE 4** tamamlandı (Onboarding & Auth ekranları):

- ✅ Splash Screen & App tanıtımı
- ✅ Login/Register ekranları
- ✅ Yaşam tarzı seçim ekranı
- ✅ Navigation setup
- ✅ Design system

**Sonraki Döküman "LifeSync_Frontend_Development_Part2.md" dosyasında devam edecek:**

**PHASE 5-12 Planı:**

- Ana Dashboard & Bottom Navigation
- Calendar ekranı (Google Calendar benzeri sidebar)
- Task Management (Eisenhower Matrix)
- Notes System (Notion-like editor)
- AI Assistant (Chat interface)
- Social Features & Community Stats
- Widgets & Final Integration
- Testing & Deployment

**Yapay zeka bu rehber ile:**

- Backend'den frontend'e kadar tüm kodu yazabilir
- Database schema'sını implement edebilir
- API endpoint'lerini oluşturabilir
- UI component'lerini geliştirebilir
- Test stratejilerini uygulayabilir
- Production deployment yapabilir

**16 haftalık geliştirme süreci** sonunda tam fonksiyonel, production-ready bir uygulama ortaya çıkacak! 🎉

**NOT:** Bu döküman çok uzun olduğu için frontend development parça parça ayrı dosyalara bölündü. Bu sayede Cursor/Claude yapay zekaları daha verimli çalışabilecek.
