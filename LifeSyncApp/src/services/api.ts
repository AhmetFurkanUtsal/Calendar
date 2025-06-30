import AsyncStorage from '@react-native-async-storage/async-storage';

// Docker üzerinde çalışan backend'in IP adresi.
// Android emülatörü için genellikle '10.0.2.2' kullanılır.
// Fiziksel cihaz kullanılıyorsa, bilgisayarınızın yerel IP adresini yazmalısınız.
const API_BASE_URL = 'http://10.0.2.2:3000/api';

class ApiService {
  private authToken: string | null = null;

  constructor() {
    this.initializeAuthToken();
  }

  private async initializeAuthToken() {
    try {
      const token = await AsyncStorage.getItem('@auth_token');
      this.authToken = token;
      console.log('Auth token initialized:', !!token);
    } catch (error) {
      console.error('Failed to load auth token from storage', error);
    }
  }

  async setAuthToken(token: string) {
    this.authToken = token;
    await AsyncStorage.setItem('@auth_token', token);
  }

  async clearAuthToken() {
    this.authToken = null;
    await AsyncStorage.removeItem('@auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    try {
      console.log(`🚀 Sending API request to: ${url}`, {
        method: options.method || 'GET',
        body: options.body ? '...' : undefined,
      });

      const response = await fetch(url, {...options, headers});

      const responseData = await response.json();

      if (!response.ok) {
        console.error(
          `❌ API Error: ${response.status} ${response.statusText}`,
          responseData,
        );
        throw new Error(
          responseData.error || `HTTP error! status: ${response.status}`,
        );
      }

      console.log(`✅ API Response from: ${url}`, responseData);
      return responseData;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // --- Auth Endpoints ---
  login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({email, password}),
    });
  }

  register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // --- Task Endpoints ---
  getTasks(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/tasks?${queryParams}`);
  }

  createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  updateTask(taskId: string, updates: any) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // --- Event Endpoints ---
  getEvents(filters: any = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/events?${queryParams}`);
  }

  // --- Weather Endpoint ---
  getWeather(city: string) {
    return this.request(`/weather?city=${city}`);
  }

  // Diğer endpoint'ler (notes, ai, vb.) buraya eklenebilir.
}

const apiService = new ApiService();
export default apiService;
