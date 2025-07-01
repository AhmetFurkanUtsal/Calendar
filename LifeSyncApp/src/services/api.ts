import AsyncStorage from '@react-native-async-storage/async-storage';

// Docker üzerinde çalışan backend'in IP adresi.
// Android emülatörü için genellikle '10.0.2.2' kullanılır.
// Fiziksel cihaz kullanılıyorsa, bilgisayarınızın yerel IP adresini yazmalısınız.
const API_BASE_URL = 'http://localhost:3000/api'; // Geliştirme için backend adresi

class ApiService {
  private baseURL = 'http://10.0.2.2:3000/api'; // Android emülatörü için
  private authToken: string | null = null;

  constructor() {
    this.initializeAuth();
  }

  async initializeAuth() {
    this.authToken = await AsyncStorage.getItem('@auth_token');
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('@auth_token', token);
  }

  async getAuthToken() {
    if (!this.authToken) {
      this.authToken = await AsyncStorage.getItem('@auth_token');
    }
    return this.authToken;
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('@auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...(this.authToken && {Authorization: `Bearer ${this.authToken}`}),
      ...options.headers,
    };

    try {
      console.log('API Request:', {
        url,
        method: options.method || 'GET',
        body: options.body,
      });

      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      console.log('API Response:', {
        status: response.status,
        data,
      });

      if (!response.ok) {
        // Detaylı hata mesajı oluştur
        let errorMessage = data.error || `HTTP ${response.status}`;

        if (data.errors && Array.isArray(data.errors)) {
          const errorDetails = data.errors
            .map((err: any) => `${err.field}: ${err.message}`)
            .join(', ');
          errorMessage += ` - ${errorDetails}`;
        }

        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      console.error('API Request failed:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
        await this.clearAuthToken();
      }
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint: string, params: Record<string, any> = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const url = queryParams ? `${endpoint}?${queryParams}` : endpoint;
    return this.request(url);
  }

  async post(endpoint: string, data: any = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint: string, data: any = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint: string, data: any = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    });
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // User endpoints
  async updateLifestyle(categories: string[], preferences: any = {}) {
    return this.request('/users/lifestyle', {
      method: 'PATCH',
      body: JSON.stringify({categories, preferences}),
    });
  }

  // Health check
  async healthCheck() {
    const response = await fetch('http://10.0.2.2:3000/health');
    return response.json();
  }

  // --- Task Endpoints ---
  getTasks(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/tasks?${queryParams}`);
  }

  createTask(taskData: any) {
    return this.post('/tasks', taskData);
  }

  updateTask(taskId: string, updates: any) {
    return this.put(`/tasks/${taskId}`, updates);
  }

  deleteTask(taskId: string) {
    return this.delete(`/tasks/${taskId}`);
  }

  // --- Event Endpoints ---
  getEvents(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.get(`/events?${queryParams}`);
  }

  // --- Weather Endpoint ---
  getWeather(city: string) {
    return this.get(`/weather?city=${city}`);
  }

  // Prayer times endpoints
  async getPrayerTimes(city?: string, date?: string) {
    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (date) params.append('date', date);

    return this.request(`/prayer-times?${params.toString()}`);
  }

  async markPrayerCompleted(prayerName: string, prayerTime: string) {
    return this.request('/prayer-times/complete', {
      method: 'POST',
      body: JSON.stringify({
        prayerName,
        prayerTime,
        completedAt: new Date().toISOString(),
      }),
    });
  }

  // Diğer endpoint'ler (notes, ai, vb.) buraya eklenebilir.
}

export default new ApiService();
