import React, {useState} from 'react';
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
  StatusBar,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem} from '../../theme/designSystem';
import {useAuthStore} from '../../stores/authStore';

type LoginScreenProps = {
  navigation: StackNavigationProp<any>;
};

export const LoginScreen: React.FC<LoginScreenProps> = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string}>({});

  const {login, isLoading} = useAuthStore();

  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    const result = await login(email, password);

    if (result.success) {
      // Başarılı girişten sonra AppNavigator yönlendirmeyi yapacak
    } else {
      Alert.alert('Giriş Hatası', result.error || 'Bir hata oluştu');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DesignSystem.colors.neutral[50]}
      />
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Tekrar Hoş Geldiniz!</Text>
        <Text style={styles.subtitle}>Hesabınıza giriş yapın</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>E-posta</Text>
          <View
            style={[styles.inputWrapper, errors.email && styles.inputError]}>
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
              placeholderTextColor={DesignSystem.colors.neutral[400]}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Şifre</Text>
          <View
            style={[styles.inputWrapper, errors.password && styles.inputError]}>
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
              placeholderTextColor={DesignSystem.colors.neutral[400]}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.errorText}>{errors.password}</Text>
          )}
        </View>

        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Hesabınız yok mu? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
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
    alignItems: 'center',
  },
  welcomeText: {
    ...DesignSystem.typography.h1,
    color: DesignSystem.colors.neutral[900],
    marginBottom: DesignSystem.spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[600],
    textAlign: 'center',
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
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: DesignSystem.borderRadius.md,
    paddingHorizontal: DesignSystem.spacing.md,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neutral[300],
    height: 54,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: DesignSystem.colors.semantic.error,
  },
  input: {
    flex: 1,
    marginLeft: DesignSystem.spacing.sm,
    ...DesignSystem.typography.body,
    color: DesignSystem.colors.neutral[900],
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.semantic.error,
    marginTop: DesignSystem.spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: DesignSystem.spacing.xl,
  },
  forgotPasswordText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: DesignSystem.colors.primary[500],
    paddingVertical: DesignSystem.spacing.md,
    borderRadius: DesignSystem.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignSystem.spacing.xl,
    height: 54,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    ...DesignSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  registerText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  registerLink: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: '600',
  },
});
