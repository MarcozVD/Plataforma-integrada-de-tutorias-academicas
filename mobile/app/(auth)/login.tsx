import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

const schema = z.object({
  university_id: z.string().min(1, 'Ingresa tu ID universitario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
  remember_me: z.boolean(),
});

type LoginForm = z.infer<typeof schema>;

interface LoginResponse {
  access_token: string;
  user_type: string;
  full_name: string;
  university_id: string;
  carrera?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { university_id: '', password: '', remember_me: false },
  });

  useEffect(() => {
    AsyncStorage.getItem('rememberedStudentId').then(id => {
      if (id) {
        setValue('university_id', id);
        setValue('remember_me', true);
      }
    });
  }, []);

  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        university_id: data.university_id,
        password: data.password,
      });
      if (data.remember_me) {
        await AsyncStorage.setItem('rememberedStudentId', data.university_id);
      } else {
        await AsyncStorage.removeItem('rememberedStudentId');
      }
      await login({
        token: res.access_token,
        userType: res.user_type,
        fullName: res.full_name,
        studentId: res.university_id,
        carrera: res.carrera,
      });
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-unab-blue"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-20 pb-10">
          {/* Header */}
          <View className="items-center mb-10">
            <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">P</Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-wide">PITA</Text>
            <Text className="text-white/80 text-sm mt-1 text-center">
              Plataforma Integrada de Tutorías Académicas
            </Text>
          </View>

          {/* Card */}
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <Text className="text-2xl font-bold text-gray-800 mb-6">
              Iniciar Sesión
            </Text>

            {/* ID Universitario */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1">
                ID Universitario
              </Text>
              <Controller
                control={control}
                name="university_id"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                    placeholder="Ej: 20200001"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.university_id && (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.university_id.message}
                </Text>
              )}
            </View>

            {/* Contraseña */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1">
                Contraseña
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View className="border border-gray-300 rounded-xl flex-row items-center bg-gray-50">
                    <TextInput
                      className="flex-1 px-4 py-3 text-gray-800"
                      placeholder="Tu contraseña"
                      value={value}
                      onChangeText={onChange}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(v => !v)}
                      className="pr-4"
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Recordarme */}
            <Controller
              control={control}
              name="remember_me"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row items-center mb-6">
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    trackColor={{ false: '#E5E7EB', true: '#00AEEF' }}
                    thumbColor="#fff"
                  />
                  <Text className="ml-2 text-gray-600 text-sm">Recordarme</Text>
                </View>
              )}
            />

            {/* Botón */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-unab-blue rounded-xl py-4 items-center"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Ingresar
                </Text>
              )}
            </TouchableOpacity>

            {/* Registro */}
            <View className="flex-row justify-center mt-5">
              <Text className="text-gray-500 text-sm">¿No tienes cuenta? </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/register')}
              >
                <Text className="text-unab-blue font-semibold text-sm">
                  Regístrate
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
