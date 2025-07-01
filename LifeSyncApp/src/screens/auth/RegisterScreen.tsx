import React, {useState} from 'react';
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
  StatusBar,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Feather';
import {DesignSystem} from '../../theme/designSystem';
import {useAuthStore} from '../../stores/authStore';

type RegisterScreenProps = {
  navigation: StackNavigationProp<any>;
};

interface FormData {
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({navigation}) => {
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const {register, isLoading} = useAuthStore();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: undefined}));
    }
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Ad Soyad gereklidir';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }

    if (!agreedToTerms) {
      Alert.alert(
        'Uyarı',
        'Kayıt olmak için kullanım şartlarını ve gizlilik politikasını kabul etmelisiniz.',
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && agreedToTerms;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    const result = await register({
      displayName: formData.displayName,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      Alert.alert('Başarılı', 'Hesabınız oluşturuldu!', [
        {
          text: 'Tamam',
          onPress: () => navigation.navigate('LifestyleSelection'),
        },
      ]);
    } else {
      Alert.alert('Kayıt Hatası', result.error || 'Bir hata oluştu');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={DesignSystem.colors.neutral[50]}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContainer}>
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
                errors.displayName && styles.inputError,
              ]}>
              <Icon
                name="user"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.displayName}
                onChangeText={value => updateFormData('displayName', value)}
                placeholder="Adınız ve soyadınız"
                placeholderTextColor={DesignSystem.colors.neutral[400]}
                autoComplete="name"
              />
            </View>
            {errors.displayName && (
              <Text style={styles.errorText}>{errors.displayName}</Text>
            )}
          </View>

          {/* Email Input */}
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
                value={formData.email}
                onChangeText={value => updateFormData('email', value)}
                placeholder="ornek@email.com"
                placeholderTextColor={DesignSystem.colors.neutral[400]}
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
              ]}>
              <Icon
                name="lock"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={value => updateFormData('password', value)}
                placeholder="En az 6 karakter"
                placeholderTextColor={DesignSystem.colors.neutral[400]}
                secureTextEntry={!showPassword}
                autoComplete="password-new"
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

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Şifre Tekrarı</Text>
            <View
              style={[
                styles.inputWrapper,
                errors.confirmPassword && styles.inputError,
              ]}>
              <Icon
                name="lock"
                size={20}
                color={DesignSystem.colors.neutral[400]}
              />
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={value => updateFormData('confirmPassword', value)}
                placeholder="Şifrenizi tekrar girin"
                placeholderTextColor={DesignSystem.colors.neutral[400]}
                secureTextEntry={!showConfirmPassword}
                autoComplete="password-new"
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Icon
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={DesignSystem.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            )}
          </View>

          <TouchableOpacity
            style={styles.termsContainer}
            onPress={() => setAgreedToTerms(!agreedToTerms)}>
            <View
              style={[
                styles.checkbox,
                agreedToTerms && styles.checkboxChecked,
              ]}>
              {agreedToTerms && <Icon name="check" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText}>
              <Text style={styles.termsLink}>Kullanım Şartları</Text> ve{' '}
              <Text style={styles.termsLink}>Gizlilik Politikası</Text>'nı kabul
              ediyorum.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.registerButton, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Hesap Oluştur</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Zaten hesabınız var mı? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
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
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: DesignSystem.spacing.xl,
    paddingBottom: DesignSystem.spacing.xl,
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
  },
  form: {
    flex: 1,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.spacing.xl,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: DesignSystem.colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
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
    fontWeight: '500',
  },
  registerButton: {
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
  registerButtonText: {
    ...DesignSystem.typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  loginText: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.neutral[600],
  },
  loginLink: {
    ...DesignSystem.typography.caption,
    color: DesignSystem.colors.primary[500],
    fontWeight: '600',
  },
});
