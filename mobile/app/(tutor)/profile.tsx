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
  'Termodinámica', 'Circuitos', 'Mecánica',
];

const SCHEDULES = [
  { key: 'morning', label: 'Mañana (6am–12pm)' },
  { key: 'afternoon', label: 'Tarde (12pm–6pm)' },
  { key: 'evening', label: 'Noche (6pm–10pm)' },
];

export default function TutorProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fullName, studentId, carrera, logout } = useAuth();

  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');

  useEffect(() => {
    storage.getJson<string[]>('tutor_subjects').then(s => {
      if (s) setSelectedSubjects(s);
    });
    storage.getJson<string[]>('tutor_schedules').then(s => {
      if (s) setSelectedSchedules(s);
    });
  }, []);

  function toggleSubject(s: string) {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s],
    );
  }

  function addCustom() {
    if (!customSubject.trim()) return;
    if (!selectedSubjects.includes(customSubject.trim())) {
      setSelectedSubjects(prev => [...prev, customSubject.trim()]);
    }
    setCustomSubject('');
  }

  function toggleSchedule(k: string) {
    setSelectedSchedules(prev =>
      prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k],
    );
  }

  async function savePreferences() {
    setSaving(true);
    try {
      await api.put('/auth/preferences', {
        tutor_subjects: selectedSubjects,
        tutoring_preferences: selectedSchedules,
      });
      await storage.setJson('tutor_subjects', selectedSubjects);
      await storage.setJson('tutor_schedules', selectedSchedules);
      Alert.alert('Guardado', 'Perfil de tutor actualizado');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
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
              {fullName?.charAt(0).toUpperCase() ?? 'T'}
            </Text>
          </View>
          <View className="ml-3">
            <Text className="text-white font-bold text-base">{fullName}</Text>
            <View className="bg-white/20 px-2 py-0.5 rounded-full mt-1 self-start">
              <Text className="text-white text-xs">Tutor</Text>
            </View>
            {carrera ? (
              <Text className="text-white/70 text-xs mt-0.5">{carrera}</Text>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <Text className="font-bold text-gray-800 text-base mb-1">
            Materias que imparto
          </Text>
          <Text className="text-gray-500 text-xs mb-4">
            Selecciona o agrega las materias en las que das tutoría
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
            {selectedSubjects
              .filter(s => !SUBJECTS.includes(s))
              .map(s => (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleSubject(s)}
                  className="px-3 py-1.5 rounded-full border bg-unab-green border-unab-green"
                >
                  <Text className="text-white text-sm">{s}</Text>
                </TouchableOpacity>
              ))}
          </View>

          {/* Custom subject */}
          <View className="flex-row gap-2 mb-5">
            <TextInput
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800 bg-gray-50 text-sm"
              placeholder="Agregar otra materia..."
              value={customSubject}
              onChangeText={setCustomSubject}
              onSubmitEditing={addCustom}
            />
            <TouchableOpacity
              onPress={addCustom}
              className="bg-unab-blue px-4 rounded-xl items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text className="font-semibold text-gray-700 text-sm mb-2">
            Disponibilidad horaria
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
            onPress={savePreferences}
            disabled={saving}
            className="bg-unab-blue py-3 rounded-xl items-center"
            style={{ opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">Guardar perfil</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
