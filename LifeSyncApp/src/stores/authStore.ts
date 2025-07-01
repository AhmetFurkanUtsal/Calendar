import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';

interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isVerified: boolean;
  subscription?: {
    plan: 'FREE' | 'PREMIUM' | 'PRO';
    status: string;
  };
  lifestyle?: {
    categories: string[];
    preferences: Record<string, any>;
  };
  profile?: {
    city?: string;
    timezone?: string;
    language?: string;
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
    password: string,
  ) => Promise<{success: boolean; error?: string}>;
  register: (userData: {
    email: string;
    password: string;
    displayName: string;
    categories?: string[];
    city?: string;
  }) => Promise<{success: boolean; error?: string}>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  updateLifestyle: (
    categories: string[],
  ) => Promise<{success: boolean; error?: string}>;
  completeAuthentication: () => void;
  initializeAuth: () => Promise<void>;

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

      initializeAuth: async () => {
        set({isLoading: true});
        try {
          const token = await ApiService.getAuthToken();
          if (token) {
            const response = await ApiService.get('/auth/me');
            const user = response.data;
            set({user, token, isAuthenticated: true, isLoading: false});
          } else {
            set({isLoading: false});
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          await ApiService.clearAuthToken();
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      login: async (email: string, password: string) => {
        set({isLoading: true});
        try {
          const response = await ApiService.login(email, password);
          const {user, token} = response.data;

          await ApiService.setAuthToken(token);
          // Login başarılı olduğunda hemen authenticated yap
          set({user, token, isAuthenticated: true, isLoading: false});

          return {success: true};
        } catch (error: any) {
          set({isLoading: false});
          return {success: false, error: error.message};
        }
      },

      register: async (userData: {
        email: string;
        password: string;
        displayName: string;
        categories?: string[];
        city?: string;
      }) => {
        set({isLoading: true});
        try {
          const response = await ApiService.register(userData);
          const {user, token} = response.data;

          await ApiService.setAuthToken(token);
          // NOT: isAuthenticated false kalır, LifestyleSelection'dan sonra true olacak
          set({user, token, isAuthenticated: false, isLoading: false});

          return {success: true};
        } catch (error: any) {
          set({isLoading: false});
          return {success: false, error: error.message};
        }
      },

      logout: async () => {
        try {
          await ApiService.post('/auth/logout');
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          await ApiService.clearAuthToken();
          set({user: null, token: null, isAuthenticated: false});
        }
      },

      updateUser: (userData: Partial<User>) => {
        set({user: {...get().user!, ...userData}});
      },

      updateLifestyle: async (categories: string[]) => {
        try {
          const response = await ApiService.patch('/users/lifestyle', {
            categories,
            preferences: {},
          });

          // Update local user data
          const currentUser = get().user;
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                lifestyle: {
                  categories,
                  preferences: {},
                },
              },
            });
          }

          return {success: true};
        } catch (error: any) {
          return {success: false, error: error.message};
        }
      },

      completeAuthentication: () => {
        // Authentication flow tamamlandı, ana uygulamaya geç
        set({isAuthenticated: true});
      },

      checkSubscription: () => {
        const user = get().user;
        return user?.subscription?.plan || 'FREE';
      },

      hasFeature: (feature: string) => {
        const plan = get().checkSubscription();
        const features = {
          FREE: ['basic_tasks', 'basic_calendar', 'limited_ai'],
          PREMIUM: [
            'unlimited_tasks',
            'voice_notes',
            'premium_widgets',
            'unlimited_ai',
          ],
          PRO: ['team_collaboration', 'advanced_analytics', 'priority_support'],
        };

        return (
          features[plan as keyof typeof features]?.includes(feature) ||
          (plan === 'PREMIUM' && features.FREE.includes(feature)) ||
          (plan === 'PRO' &&
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
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
