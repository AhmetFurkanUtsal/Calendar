import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem} from '../../theme/designSystem';
import {useAuthStore} from '../../stores/authStore';
import ApiService from '../../services/api';

type LifestyleSelectionScreenProps = {
  navigation: StackNavigationProp<any>;
};

const LIFESTYLE_CATEGORIES = [
  {
    id: 'dini',
    name: 'Dini',
    icon: '🕌',
    color: '#8B5CF6',
    description: 'Namaz vakitleri, dini görevler ve spiritüel gelişim',
  },
  {
    id: 'hayvanseverlik',
    name: 'Hayvanseverlik',
    icon: '🐾',
    color: '#F59E0B',
    description: 'Evcil hayvan bakımı ve sokak hayvanları',
  },
  {
    id: 'cevre',
    name: 'Çevre',
    icon: '🌱',
    color: '#10B981',
    description: 'Sürdürülebilir yaşam ve çevre koruma',
  },
  {
    id: 'saglik',
    name: 'Sağlık',
    icon: '❤️',
    color: '#EF4444',
    description: 'Fiziksel ve mental sağlık takibi',
  },
  {
    id: 'kariyer',
    name: 'Kariyer',
    icon: '💼',
    color: '#3B82F6',
    description: 'Mesleki gelişim ve iş hedefleri',
  },
];

export const LifestyleSelectionScreen: React.FC<
  LifestyleSelectionScreenProps
> = ({navigation}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {updateUser, completeAuthentication} = useAuthStore();

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleContinue = async () => {
    if (selectedCategories.length === 0) {
      Alert.alert('Uyarı', 'En az bir yaşam tarzı kategorisi seçmelisiniz.');
      return;
    }

    setIsLoading(true);
    try {
      await ApiService.updateLifestyle(selectedCategories);

      // Update local user data
      updateUser({
        lifestyle: {
          categories: selectedCategories,
          preferences: {},
        },
      });

      // Complete authentication flow
      completeAuthentication();

      Alert.alert(
        'Hoş geldiniz!',
        'Yaşam tarzınız kaydedildi. Artık uygulamayı kullanabilirsiniz.',
        [
          {
            text: 'Tamam',
            onPress: () => {
              // isAuthenticated artık true olduğu için otomatik olarak MainApp'e gidecek
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        'Hata',
        error.message || 'Yaşam tarzı kaydedilirken bir hata oluştu.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    completeAuthentication();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon
            name="arrow-left"
            size={24}
            color={DesignSystem.colors.neutral[600]}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Yaşam Tarzınızı Seçin</Text>
        <Text style={styles.subtitle}>
          Size uygun görevler ve öneriler sunabilmemiz için yaşam tarzınızı
          belirtin
        </Text>
      </View>

      <ScrollView style={styles.categoriesContainer}>
        {LIFESTYLE_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              selectedCategories.includes(category.id) &&
                styles.categoryCardSelected,
              {borderColor: category.color},
            ]}
            onPress={() => toggleCategory(category.id)}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryIconContainer}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryDescription}>
                  {category.description}
                </Text>
              </View>
              {selectedCategories.includes(category.id) && (
                <Icon
                  name="check-circle"
                  size={24}
                  color={category.color}
                  style={styles.checkIcon}
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            selectedCategories.length === 0 && styles.continueButtonDisabled,
            isLoading && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={selectedCategories.length === 0 || isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>
              Devam Et ({selectedCategories.length})
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
    paddingBottom: DesignSystem.spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: DesignSystem.spacing.lg,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    lineHeight: 24,
  },
  categoriesContainer: {
    flex: 1,
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    padding: DesignSystem.spacing.lg,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neutral[200],
    borderRadius: DesignSystem.borderRadius.lg,
    marginBottom: DesignSystem.spacing.md,
  },
  categoryCardSelected: {
    borderColor: DesignSystem.colors.primary[500],
    backgroundColor: DesignSystem.colors.primary[50],
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 50,
    height: 50,
    borderRadius: DesignSystem.borderRadius.lg,
    backgroundColor: DesignSystem.colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignSystem.spacing.md,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    ...DesignSystem.typography.h3,
    color: DesignSystem.colors.neutral[900],
    fontWeight: '600',
    marginBottom: DesignSystem.spacing.xs,
  },
  categoryDescription: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
    lineHeight: 18,
  },
  checkIcon: {
    marginLeft: DesignSystem.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
    paddingTop: DesignSystem.spacing.lg,
  },
  skipButton: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  skipText: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
  },
  continueButton: {
    backgroundColor: DesignSystem.colors.primary[500],
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.lg,
    minWidth: 150,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: DesignSystem.colors.neutral[300],
  },
  continueText: {
    ...DesignSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
