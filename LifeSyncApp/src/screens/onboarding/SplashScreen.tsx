import React, {useEffect, useState, useRef} from 'react';
import {View, Text, StyleSheet, Animated, StatusBar} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {DesignSystem} from '../../theme/designSystem';
import {useAuthStore} from '../../stores/authStore';

type SplashScreenProps = {
  navigation: StackNavigationProp<any>;
};

export const SplashScreen: React.FC<SplashScreenProps> = ({navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const {isAuthenticated, initializeAuth, isLoading} = useAuthStore();

  useEffect(() => {
    startAnimations();
    initializeAuth();

    // Minimum 3 saniye loading süresi
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, 3000);

    return () => clearTimeout(minTimer);
  }, []);

  useEffect(() => {
    // Hem auth kontrolü bitti hem de minimum süre geçti mi?
    if (!isLoading && minTimeElapsed) {
      setTimeout(() => {
        if (isAuthenticated) {
          navigation.replace('MainApp');
        } else {
          navigation.replace('Onboarding');
        }
      }, 500); // Animasyonun bitmesi için ek süre
    }
  }, [isLoading, isAuthenticated, minTimeElapsed, navigation]);

  const startAnimations = () => {
    // Logo animasyonları
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

    // Dönen loading animasyonu
    const spinAnimation = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}],
          },
        ]}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>🌟</Text>
        </View>
        <Text style={styles.appName}>LifeSync</Text>
        <Text style={styles.tagline}>Yaşamınızı Senkronize Edin</Text>
      </Animated.View>

      {/* Native Loading Animasyonu */}
      <Animated.View style={[styles.loadingContainer, {opacity: fadeAnim}]}>
        <Animated.View
          style={[
            styles.loadingSpinner,
            {
              transform: [{rotate: spin}],
            },
          ]}>
          <View style={styles.spinnerRing} />
        </Animated.View>
        <Text style={styles.loadingText}>
          {!minTimeElapsed
            ? 'Uygulama hazırlanıyor...'
            : isLoading
            ? 'Giriş kontrol ediliyor...'
            : 'Hazır!'}
        </Text>
      </Animated.View>

      {/* Backend Bağlantı Durumu */}
      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusDot,
            {backgroundColor: !isLoading ? '#10B981' : '#F59E0B'},
          ]}
        />
        <Text style={styles.statusText}>
          {!isLoading ? 'Bağlantı başarılı' : 'Bağlantı kuruluyor...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0EA5E9', // Mavi arka plan rengi
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xxl,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.lg,
  },
  logoText: {
    fontSize: 48,
  },
  appName: {
    ...DesignSystem.typography.h1,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: DesignSystem.spacing.sm,
  },
  tagline: {
    ...DesignSystem.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: DesignSystem.spacing.xl,
  },
  loadingSpinner: {
    width: 50,
    height: 50,
    marginBottom: DesignSystem.spacing.md,
  },
  spinnerRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
  },
  loadingText: {
    ...DesignSystem.typography.body,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusContainer: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: DesignSystem.spacing.sm,
  },
  statusText: {
    ...DesignSystem.typography.caption,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
