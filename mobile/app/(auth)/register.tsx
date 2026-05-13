import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';

const baseFields = {
  full_name: z
    .string()
    .min(3, 'Nombre debe tener al menos 3 caracteres')
    .regex(/^[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s]+$/, 'El nombre solo puede contener letras y espacios'),
  email: z.string().email('Correo inválido'),
  university_id: z
    .string()
    .regex(/^\d{5,15}$/, 'El ID debe tener entre 5 y 15 dígitos numéricos'),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirm_password: z.string(),
  carrera: z.string().min(2, 'Ingresa tu carrera'),
  user_type: z.enum(['student', 'tutor']),
};

const STUDENT_DISABILITY_OPTIONS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditiva', label: 'Auditiva' },
  { value: 'motriz', label: 'Motriz' },
  { value: 'cognitiva', label: 'Cognitiva' },
] as const;

const TUTOR_SUPPORT_OPTIONS = [
  { value: 'ninguna', label: 'Ninguna en particular' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditiva', label: 'Auditiva' },
  { value: 'motriz', label: 'Motriz' },
  { value: 'cognitiva', label: 'Cognitiva' },
  { value: 'todas', label: 'Todas' },
] as const;

const schema = z
  .object({
    ...baseFields,
    disability_type: z
      .enum(['ninguna', 'visual', 'auditiva', 'motriz', 'cognitiva'])
      .optional(),
    disability_description: z.string().optional(),
    disability_support_type: z
      .enum(['ninguna', 'visual', 'auditiva', 'motriz', 'cognitiva', 'todas'])
      .optional(),
    disability_support_description: z.string().optional(),
  })
  .refine(d => d.password === d.confirm_password, {
    message: 'Las contraseñas no coinciden',
    path: ['confirm_password'],
  })
  .refine(d => d.user_type !== 'student' || d.disability_type !== undefined, {
    message: 'Selecciona un tipo de discapacidad',
    path: ['disability_type'],
  })
  .refine(d => d.user_type !== 'tutor' || d.disability_support_type !== undefined, {
    message: 'Selecciona qué discapacidad puedes atender',
    path: ['disability_support_type'],
  });

type RegisterForm = z.infer<typeof schema>;

const USER_TYPE_OPTIONS = [
  { value: 'student', label: 'Estudiante' },
  { value: 'tutor', label: 'Tutor' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      user_type: 'student',
      disability_type: 'ninguna',
      disability_support_type: 'ninguna',
    },
  });

  const userType = watch('user_type');
  const disabilityType = watch('disability_type');
  const disabilitySupportType = watch('disability_support_type');

  async function onSubmit(data: RegisterForm) {
    setLoading(true);
    try {
      if (data.user_type === 'student') {
        await api.post('/auth/register/student', {
          full_name: data.full_name,
          email: data.email,
          university_id: data.university_id,
          password: data.password,
          confirm_password: data.confirm_password,
          carrera: data.carrera,
          user_type: 'student',
          disability_type: data.disability_type ?? 'ninguna',
          disability_description: data.disability_description ?? null,
        });
      } else {
        await api.post('/auth/register/tutor', {
          full_name: data.full_name,
          email: data.email,
          university_id: data.university_id,
          password: data.password,
          confirm_password: data.confirm_password,
          carrera: data.carrera,
          user_type: 'tutor',
          disability_support_type: data.disability_support_type ?? 'ninguna',
          disability_support_description: data.disability_support_description ?? null,
        });
      }
      Alert.alert('¡Cuenta creada!', 'Ya puedes iniciar sesión.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo registrar');
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
        <View className="flex-1 px-6 pt-14 pb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center mb-6"
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
            <Text className="text-white ml-2 font-medium">Volver</Text>
          </TouchableOpacity>

          <Text className="text-white text-3xl font-bold mb-1">Registro</Text>
          <Text className="text-white/80 text-sm mb-6">
            Crea tu cuenta en la plataforma
          </Text>

          <View className="bg-white rounded-2xl p-6">
            {/* Tipo de usuario */}
            <Text className="text-gray-700 text-sm font-semibold mb-2">Soy...</Text>
            <Controller
              control={control}
              name="user_type"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-3 mb-4">
                  {USER_TYPE_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      onPress={() => {
                        onChange(opt.value);
                        setValue('disability_type', 'ninguna');
                        setValue('disability_support_type', 'ninguna');
                      }}
                      className={`flex-1 py-3 rounded-xl items-center border-2 ${
                        value === opt.value
                          ? 'bg-unab-blue border-unab-blue'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`font-medium text-sm ${
                          value === opt.value ? 'text-white' : 'text-gray-600'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />

            <Field
              label="Nombre completo"
              control={control}
              name="full_name"
              placeholder="Ej: Juan Pérez"
              error={errors.full_name?.message}
            />
            <Field
              label="Correo institucional"
              control={control}
              name="email"
              placeholder="usuario@unab.edu.co"
              keyboardType="email-address"
              error={errors.email?.message}
            />
            <Field
              label="ID Universitario"
              control={control}
              name="university_id"
              placeholder="Ej: 20200001"
              keyboardType="numeric"
              error={errors.university_id?.message}
            />
            <Field
              label="Carrera"
              control={control}
              name="carrera"
              placeholder="Ej: Ingeniería de Sistemas"
              error={errors.carrera?.message}
            />

            {/* Contraseña */}
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1">Contraseña</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View className="border border-gray-300 rounded-xl flex-row items-center bg-gray-50">
                    <TextInput
                      className="flex-1 px-4 py-3 text-gray-800"
                      placeholder="Mín. 8 caracteres, una mayúscula y un número"
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
                <Text className="text-red-500 text-xs mt-1">{errors.password.message}</Text>
              )}
            </View>

            <Field
              label="Confirmar contraseña"
              control={control}
              name="confirm_password"
              placeholder="Repite tu contraseña"
              secureTextEntry
              error={errors.confirm_password?.message}
            />

            {/* Discapacidad — diferente según tipo de usuario */}
            {userType === 'student' ? (
              <>
                <Text className="text-gray-700 text-sm font-semibold mb-2 mt-2">
                  ¿Tienes alguna discapacidad?
                </Text>
                <Controller
                  control={control}
                  name="disability_type"
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row flex-wrap gap-2 mb-1">
                      {STUDENT_DISABILITY_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          className={`px-4 py-2 rounded-full border ${
                            value === opt.value
                              ? 'bg-unab-blue border-unab-blue'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              value === opt.value ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
                {errors.disability_type && (
                  <Text className="text-red-500 text-xs mt-1 mb-3">
                    {errors.disability_type.message}
                  </Text>
                )}
                {disabilityType && disabilityType !== 'ninguna' && (
                  <Field
                    label="Descripción (opcional)"
                    control={control}
                    name="disability_description"
                    placeholder="Describe tu necesidad de apoyo..."
                    multiline
                    error={errors.disability_description?.message}
                  />
                )}
              </>
            ) : (
              <>
                <Text className="text-gray-700 text-sm font-semibold mb-2 mt-2">
                  ¿Qué discapacidad puedes atender?
                </Text>
                <Controller
                  control={control}
                  name="disability_support_type"
                  render={({ field: { onChange, value } }) => (
                    <View className="flex-row flex-wrap gap-2 mb-1">
                      {TUTOR_SUPPORT_OPTIONS.map(opt => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => onChange(opt.value)}
                          className={`px-4 py-2 rounded-full border ${
                            value === opt.value
                              ? 'bg-unab-blue border-unab-blue'
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              value === opt.value ? 'text-white' : 'text-gray-600'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
                {errors.disability_support_type && (
                  <Text className="text-red-500 text-xs mt-1 mb-3">
                    {errors.disability_support_type.message}
                  </Text>
                )}
                {disabilitySupportType && disabilitySupportType !== 'ninguna' && (
                  <Field
                    label="Descripción (opcional)"
                    control={control}
                    name="disability_support_description"
                    placeholder="Describe cómo apoyas esta necesidad..."
                    multiline
                    error={errors.disability_support_description?.message}
                  />
                )}
              </>
            )}

            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              className="bg-unab-blue rounded-xl py-4 items-center mt-4"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <View className="flex-row justify-center mt-4">
              <Text className="text-gray-500 text-sm">¿Ya tienes cuenta? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                <Text className="text-unab-blue font-semibold text-sm">Inicia sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  control,
  name,
  placeholder,
  error,
  keyboardType,
  secureTextEntry,
  multiline,
}: {
  label: string;
  control: any;
  name: string;
  placeholder?: string;
  error?: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm font-medium mb-1">{label}</Text>
      <Controller
        control={control}
        name={name}
        render={({ field: { onChange, value } }) => (
          <TextInput
            className={`border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 ${
              multiline ? 'h-20' : ''
            }`}
            placeholder={placeholder}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            secureTextEntry={secureTextEntry}
            multiline={multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
          />
        )}
      />
      {error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
    </View>
  );
}
