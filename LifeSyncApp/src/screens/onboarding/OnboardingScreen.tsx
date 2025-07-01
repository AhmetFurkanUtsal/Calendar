import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {DesignSystem} from '../../theme/designSystem';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

type OnboardingScreenProps = {
  navigation: StackNavigationProp<any>;
};

const ONBOARDING_DATA = [
  {
    id: 1,
    icon: '🎯',
    title: 'Hedeflerinize Odaklanın',
    description:
      'Yaşam tarzınıza göre özelleştirilmiş görevler ve planlama ile hedeflerinize ulaşın.',
    backgroundColor: '#0EA5E9',
  },
  {
    id: 2,
    icon: '🕌',
    title: 'Dini Değerlerinizi Yaşayın',
    description:
      'Namaz vakitleri, dini görevler ve spiritüel gelişim araçları ile imanınızı güçlendirin.',
    backgroundColor: '#8B5CF6',
  },
  {
    id: 3,
    icon: '🌱',
    title: 'Çevreye Duyarlı Yaşayın',
    description:
      'Sürdürülebilir yaşam alışkanlıkları geliştirin ve gezegeni koruyun.',
    backgroundColor: '#10B981',
  },
  {
    id: 4,
    icon: '🐾',
    title: 'Hayvan Sevginizi Gösterin',
    description:
      'Evcil dostlarınız ve sokak hayvanları için özel görevler ve hatırlatıcılar.',
    backgroundColor: '#F59E0B',
  },
  {
    id: 5,
    icon: '🤖',
    title: 'AI Asistanınız Hazır',
    description:
      'Akıllı öneriler, ses komutları ve kişiselleştirilmiş rehberlik ile verimli olun.',
    backgroundColor: '#0EA5E9',
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {ONBOARDING_DATA.map(item => (
          <View
            key={item.id}
            style={[styles.slide, {backgroundColor: item.backgroundColor}]}>
            <View style={styles.slideContent}>
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, {opacity: index === currentIndex ? 1 : 0.3}]}
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
            {currentIndex === ONBOARDING_DATA.length - 1 ? 'Başla' : 'Devam'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
  },
  slideContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: DesignSystem.spacing.xl,
  },
  title: {
    ...DesignSystem.typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: DesignSystem.spacing.lg,
    fontWeight: '700',
  },
  description: {
    ...DesignSystem.typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 5,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: 20,
  },
  skipButton: {
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.lg,
  },
  skipText: {
    ...DesignSystem.typography.body,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: DesignSystem.spacing.md,
    paddingHorizontal: DesignSystem.spacing.xl,
    borderRadius: DesignSystem.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nextText: {
    ...DesignSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
