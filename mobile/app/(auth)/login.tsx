// =============================================================================
// mobile/app/(auth)/login.tsx — Pantalla de Inicio de Sesión
// =============================================================================
// Permite a estudiantes, tutores y administradores autenticarse en PITA.
//
// Flujo principal:
//   1. Al montar: revisa AsyncStorage por un ID universitario guardado
//      (funcionalidad "Recordarme") y pre-rellena el campo si existe
//   2. El usuario ingresa su ID universitario y contraseña
//   3. Al enviar: llama a POST /auth/login con las credenciales
//   4. Si es exitoso:
//      a. Guarda/elimina el ID en AsyncStorage según "Recordarme"
//      b. Llama a login() del AuthContext para persistir el token y datos
//      c. Navega a "/" que ejecuta la lógica de redirección según rol
//   5. Si falla: muestra un Alert con el mensaje de error del servidor
//
// Librerías usadas:
//   - react-hook-form + zod: validación de formulario tipada
//   - expo-router: navegación
//   - @react-native-async-storage: persistencia local de "Recordarme"
// =============================================================================

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

// ─── Esquema de validación Zod ────────────────────────────────────────────────
// Define las reglas de validación para los campos del formulario.
// zodResolver conecta este esquema con react-hook-form.
const schema = z.object({
  university_id: z.string().min(1, 'Ingresa tu ID universitario'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
  remember_me: z.boolean(),
});

// Tipo TypeScript inferido automáticamente del esquema Zod
type LoginForm = z.infer<typeof schema>;

// ─── Tipo de la respuesta del servidor al hacer login ─────────────────────────
interface LoginResponse {
  access_token: string;   // Token JWT para autenticar peticiones posteriores
  user_type: string;      // 'student' | 'tutor' | 'admin'
  full_name: string;      // Nombre completo del usuario
  university_id: string;  // ID universitario confirmado por el servidor
  carrera?: string;       // Carrera del estudiante (opcional, solo para students)
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();

  // Estado de carga para deshabilitar el botón mientras se procesa el login
  const [loading, setLoading] = useState(false);

  // Controla si la contraseña se muestra en texto plano o como puntos
  const [showPassword, setShowPassword] = useState(false);

  // ── Configuración del formulario con react-hook-form ──────────────────────
  // control: objeto para conectar inputs al formulario
  // handleSubmit: wrapper que valida antes de llamar onSubmit
  // setValue: permite escribir valores programáticamente (para "Recordarme")
  // formState.errors: errores de validación por campo
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { university_id: '', password: '', remember_me: false },
  });

  // ── Efecto: restaurar ID guardado por "Recordarme" ────────────────────────
  // Se ejecuta una sola vez al montar el componente.
  // Busca en AsyncStorage si el usuario marcó "Recordarme" en una sesión anterior
  // y, si existe el ID guardado, lo pre-rellena en el campo de ID.
  useEffect(() => {
    AsyncStorage.getItem('rememberedStudentId').then(id => {
      if (id) {
        setValue('university_id', id);    // Pre-rellena el campo de ID
        setValue('remember_me', true);    // Marca el switch de "Recordarme"
      }
    });
  }, []);

  // ── Handler de envío del formulario ──────────────────────────────────────
  // Solo se ejecuta si la validación de Zod pasa sin errores.
  // Flujo:
  //   1. Activa el estado de carga
  //   2. Llama al endpoint POST /auth/login con ID y contraseña
  //   3. Guarda o elimina el ID en AsyncStorage según el toggle "Recordarme"
  //   4. Llama a login() del AuthContext para persistir token y datos del usuario
  //   5. Redirige a "/" para que la lógica de roles decida la pantalla correcta
  //   6. Si hay error: muestra un Alert con el mensaje
  async function onSubmit(data: LoginForm) {
    setLoading(true);
    try {
      // Petición al backend: retorna token JWT y datos del usuario
      const res = await api.post<LoginResponse>('/auth/login', {
        university_id: data.university_id,
        password: data.password,
      });

      // Gestión de "Recordarme": persiste o elimina el ID según la preferencia
      if (data.remember_me) {
        await AsyncStorage.setItem('rememberedStudentId', data.university_id);
      } else {
        await AsyncStorage.removeItem('rememberedStudentId');
      }

      // Persiste la sesión en el AuthContext (guarda token en AsyncStorage global)
      await login({
        token: res.access_token,
        userType: res.user_type,
        fullName: res.full_name,
        studentId: res.university_id,
        carrera: res.carrera,
      });

      // Navega a la pantalla índice que redirige según el rol del usuario
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Credenciales incorrectas');
    } finally {
      // Siempre desactiva el loading, haya éxito o error
      setLoading(false);
    }
  }

  // ── Renderizado ───────────────────────────────────────────────────────────
  return (
    // KeyboardAvoidingView: eleva el contenido cuando el teclado aparece
    // En iOS usa 'padding', en Android usa 'height' para mejor compatibilidad
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      {/* ScrollView: permite hacer scroll si el contenido supera la pantalla */}
      <ScrollView
        className="flex-1 bg-unab-blue"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"  // Permite tocar botones con el teclado abierto
      >
        <View className="flex-1 px-6 pt-20 pb-10">

          {/* ── Sección Header / Logo ─────────────────────────────────────── */}
          <View className="items-center mb-10">
            {/* Ícono/logo con inicial "P" sobre fondo semitransparente */}
            <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-4">
              <Text className="text-white text-3xl font-bold">P</Text>
            </View>
            <Text className="text-white text-3xl font-bold tracking-wide">PITA</Text>
            <Text className="text-white/80 text-sm mt-1 text-center">
              Plataforma Integrada de Tutorías Académicas
            </Text>
          </View>

          {/* ── Tarjeta del formulario ────────────────────────────────────── */}
          <View className="bg-white rounded-2xl p-6 shadow-lg">
            <Text className="text-2xl font-bold text-gray-800 mb-6">
              Iniciar Sesión
            </Text>

            {/* Campo: ID Universitario */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1">
                ID Universitario
              </Text>
              {/* Controller conecta el TextInput al estado de react-hook-form */}
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
              {/* Muestra el error de validación si existe */}
              {errors.university_id && (
                <Text className="text-red-500 text-xs mt-1">
                  {errors.university_id.message}
                </Text>
              )}
            </View>

            {/* Campo: Contraseña con botón para mostrar/ocultar */}
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
                      secureTextEntry={!showPassword}  // Oculta el texto según el estado
                    />
                    {/* Botón ojo: alterna visibilidad de la contraseña */}
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

            {/* Toggle: Recordarme — persiste el ID en AsyncStorage */}
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

            {/* Botón de envío — deshabilitado durante la carga */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}  // Valida y llama onSubmit
              disabled={loading}
              className="bg-unab-blue rounded-xl py-4 items-center"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {/* Muestra spinner durante la petición, texto en estado normal */}
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Ingresar
                </Text>
              )}
            </TouchableOpacity>

            {/* Enlace a la pantalla de registro */}
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
