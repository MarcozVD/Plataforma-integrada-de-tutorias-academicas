import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Colors } from '@/theme/colors';

const SUBJECTS = [
  'Cálculo', 'Álgebra', 'Física', 'Química', 'Programación',
  'Redes', 'Bases de Datos', 'Estadística', 'Inglés', 'Biología',
];

const SCHEDULES = [
  { key: 'morning', label: 'Mañana (6am–12pm)' },
  { key: 'afternoon', label: 'Tarde (12pm–6pm)' },
  { key: 'evening', label: 'Noche (6pm–10pm)' },
];

const DISABILITY_OPTIONS = [
  { value: 'ninguna', label: 'Ninguna' },
  { value: 'visual', label: 'Visual' },
  { value: 'auditiva', label: 'Auditiva' },
  { value: 'motriz', label: 'Motriz' },
];

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fullName, studentId, carrera, logout } = useAuth();

  const [savingSubjects, setSavingSubjects] = useState(false);
  const [savingDisability, setSavingDisability] = useState(false);

  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [disabilityType, setDisabilityType] = useState('ninguna');
  const [disabilityDesc, setDisabilityDesc] = useState('');

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const [subjects, schedules, disInfo] = await Promise.all([
      storage.getJson<string[]>('interest_subjects'),
      storage.getJson<string[]>('tutoring_preferences'),
      storage.getJson<{ type: string; description: string }>('disability_info'),
    ]);
    if (subjects) setSelectedSubjects(subjects);
    if (schedules) setSelectedSchedules(schedules);
    if (disInfo) {
      setDisabilityType(disInfo.type ?? 'ninguna');
      setDisabilityDesc(disInfo.description ?? '');
    }
  }

  function toggleSubject(s: string) {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  }

  function toggleSchedule(k: string) {
    setSelectedSchedules(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k],
    );
  }

  async function saveSubjects() {
    setSavingSubjects(true);
    try {
      await api.put('/auth/preferences', {
        interest_subjects: selectedSubjects,
        tutoring_preferences: selectedSchedules,
      });
      await storage.setJson('interest_subjects', selectedSubjects);
      await storage.setJson('tutoring_preferences', selectedSchedules);
      Alert.alert('Guardado', 'Preferencias actualizadas');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingSubjects(false);
    }
  }

  async function saveDisability() {
    setSavingDisability(true);
    try {
      await api.put('/auth/disability', {
        disability_type: disabilityType !== 'ninguna' ? disabilityType : null,
        disability_description: disabilityDesc || null,
      });
      await storage.setJson('disability_info', {
        type: disabilityType,
        description: disabilityDesc,
      });
      Alert.alert('Guardado', 'Información de accesibilidad actualizada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingDisability(false);
    }
  }

  function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-6">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xl font-bold">Mi Perfil</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-xl"
          >
            <Ionicons name="log-out-outline" size={16} color="#fff" />
            <Text className="text-white text-sm ml-1">Salir</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row items-center mt-4">
          <View className="w-14 h-14 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-white text-2xl font-bold">
              {fullName?.charAt(0).toUpperCase() ?? 'U'}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="text-white font-bold text-base">{fullName}</Text>
            <Text className="text-white/80 text-sm">ID: {studentId}</Text>
            {carrera ? (
              <Text className="text-white/70 text-xs">{carrera}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Subjects */}
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="font-bold text-gray-800 text-base mb-1">
            Materias de interés
          </Text>
          <Text className="text-gray-500 text-xs mb-4">
            Selecciona las materias en las que quieres recibir tutorías
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {SUBJECTS.map(s => (
              <TouchableOpacity
                key={s}
                onPress={() => toggleSubject(s)}
                className={`px-3 py-1.5 rounded-full border ${
                  selectedSubjects.includes(s)
                    ? 'bg-unab-blue border-unab-blue'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm ${
                    selectedSubjects.includes(s) ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-semibold text-gray-700 text-sm mb-2">
            Horario preferido
          </Text>
          <View className="gap-2 mb-4">
            {SCHEDULES.map(sch => (
              <TouchableOpacity
                key={sch.key}
                onPress={() => toggleSchedule(sch.key)}
                className={`flex-row items-center p-3 rounded-xl border ${
                  selectedSchedules.includes(sch.key)
                    ? 'bg-unab-blue/10 border-unab-blue'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${
                    selectedSchedules.includes(sch.key)
                      ? 'border-unab-blue bg-unab-blue'
                      : 'border-gray-400 bg-white'
                  }`}
                >
                  {selectedSchedules.includes(sch.key) && (
                    <Ionicons name="checkmark" size={12} color="#fff" />
                  )}
                </View>
                <Text
                  className={`text-sm ${
                    selectedSchedules.includes(sch.key)
                      ? 'text-unab-blue font-medium'
                      : 'text-gray-700'
                  }`}
                >
                  {sch.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={saveSubjects}
            disabled={savingSubjects}
            className="bg-unab-blue py-3 rounded-xl items-center"
            style={{ opacity: savingSubjects ? 0.7 : 1 }}
          >
            {savingSubjects ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">Guardar preferencias</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Accessibility */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text className="font-bold text-gray-800 text-base mb-1">
            Accesibilidad
          </Text>
          <Text className="text-gray-500 text-xs mb-4">
            Esta información nos ayuda a recomendarte espacios adecuados
          </Text>

          <Text className="text-gray-600 text-sm font-medium mb-2">
            Tipo de discapacidad
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {DISABILITY_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setDisabilityType(opt.value)}
                className={`px-4 py-2 rounded-full border ${
                  disabilityType === opt.value
                    ? 'bg-unab-purple border-unab-purple'
                    : 'bg-white border-gray-300'
                }`}
              >
                <Text
                  className={`text-sm ${
                    disabilityType === opt.value ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {disabilityType !== 'ninguna' && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-medium mb-1">
                Descripción (opcional)
              </Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 h-20"
                placeholder="Describe tu necesidad de apoyo..."
                value={disabilityDesc}
                onChangeText={setDisabilityDesc}
                multiline
                textAlignVertical="top"
              />
            </View>
          )}

          <TouchableOpacity
            onPress={saveDisability}
            disabled={savingDisability}
            className="bg-unab-purple py-3 rounded-xl items-center"
            style={{ opacity: savingDisability ? 0.7 : 1 }}
          >
            {savingDisability ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">
                Guardar accesibilidad
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
