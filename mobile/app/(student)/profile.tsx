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
  { key: 'morning',   label: 'Mañana',  sub: '6am – 12pm', icon: 'sunny-outline' },
  { key: 'afternoon', label: 'Tarde',   sub: '12pm – 6pm', icon: 'partly-sunny-outline' },
  { key: 'evening',   label: 'Noche',   sub: '6pm – 10pm', icon: 'moon-outline' },
];

const DISABILITY_OPTIONS = [
  { value: 'ninguna',  label: 'Ninguna',  icon: 'person-outline' },
  { value: 'visual',   label: 'Visual',   icon: 'eye-outline' },
  { value: 'auditiva', label: 'Auditiva', icon: 'ear-outline' },
  { value: 'motriz',   label: 'Motriz',   icon: 'accessibility-outline' },
];

export default function StudentProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { fullName, studentId, carrera, logout } = useAuth();

  const [savingPrefs,   setSavingPrefs]   = useState(false);
  const [savingAccess,  setSavingAccess]  = useState(false);
  const [selectedSubjects,  setSelectedSubjects]  = useState<string[]>([]);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [disabilityType, setDisabilityType] = useState('ninguna');
  const [disabilityDesc, setDisabilityDesc] = useState('');

  useEffect(() => {
    Promise.all([
      storage.getJson<string[]>('interest_subjects'),
      storage.getJson<string[]>('tutoring_preferences'),
      storage.getJson<{ type: string; description: string }>('disability_info'),
    ]).then(([subjects, schedules, disInfo]) => {
      if (subjects)  setSelectedSubjects(subjects);
      if (schedules) setSelectedSchedules(schedules);
      if (disInfo) {
        setDisabilityType(disInfo.type ?? 'ninguna');
        setDisabilityDesc(disInfo.description ?? '');
      }
    });
  }, []);

  const toggleSubject  = (s: string) => setSelectedSubjects(p => p.includes(s)  ? p.filter(x => x !== s)  : [...p, s]);
  const toggleSchedule = (k: string) => setSelectedSchedules(p => p.includes(k) ? p.filter(x => x !== k) : [...p, k]);

  async function savePrefs() {
    setSavingPrefs(true);
    try {
      await api.put('/auth/preferences', {
        interest_subjects: selectedSubjects,
        tutoring_preferences: selectedSchedules,
      });
      await Promise.all([
        storage.setJson('interest_subjects', selectedSubjects),
        storage.setJson('tutoring_preferences', selectedSchedules),
      ]);
      Alert.alert('Guardado', 'Preferencias actualizadas correctamente');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingPrefs(false);
    }
  }

  async function saveAccess() {
    setSavingAccess(true);
    try {
      await api.put('/auth/disability', {
        disability_type: disabilityType !== 'ninguna' ? disabilityType : null,
        disability_description: disabilityDesc || null,
      });
      await storage.setJson('disability_info', { type: disabilityType, description: disabilityDesc });
      Alert.alert('Guardado', 'Información de accesibilidad actualizada');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSavingAccess(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      'Cerrar sesión',
      '¿Deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar sesión', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
      ],
    );
  }

  const initial = fullName?.charAt(0).toUpperCase() ?? 'U';

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* Header / Avatar */}
      <View className="px-5 pt-4 pb-6" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-white/70 text-xs font-medium tracking-wide uppercase">Plataforma de Tutorías</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">Mi Perfil</Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            <Ionicons name="log-out-outline" size={15} color="#fff" />
            <Text className="text-white text-xs font-semibold">Salir</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-4">
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' }}
          >
            <Text className="text-white text-2xl font-bold">{initial}</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{fullName}</Text>
            <View className="flex-row items-center gap-1.5 mt-0.5">
              <Ionicons name="id-card-outline" size={13} color="rgba(255,255,255,0.7)" />
              <Text className="text-white/70 text-sm">{studentId}</Text>
            </View>
            {carrera && (
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <Ionicons name="school-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text className="text-white/60 text-xs" numberOfLines={1}>{carrera}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>

        {/* Materias de interés */}
        <View className="bg-white rounded-2xl p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 }}>
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-7 h-7 rounded-xl items-center justify-center" style={{ backgroundColor: Colors.primary + '18' }}>
              <Ionicons name="book-outline" size={15} color={Colors.primary} />
            </View>
            <Text className="font-bold text-gray-800 text-base">Materias de interés</Text>
          </View>
          <Text className="text-gray-400 text-xs mb-4 ml-9">
            Selecciona las materias para recibir tutorías
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-5">
            {SUBJECTS.map(s => {
              const active = selectedSubjects.includes(s);
              return (
                <TouchableOpacity
                  key={s}
                  onPress={() => toggleSubject(s)}
                  className="px-3.5 py-2 rounded-xl border"
                  style={{
                    backgroundColor: active ? Colors.primary : '#F8FAFC',
                    borderColor: active ? Colors.primary : '#E2E8F0',
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : '#64748B' }}>
                    {s}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Horario preferido */}
          <View className="flex-row items-center gap-2 mb-3">
            <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
            <Text className="font-semibold text-gray-700 text-sm">Horario preferido</Text>
          </View>
          <View className="gap-2 mb-5">
            {SCHEDULES.map(sch => {
              const active = selectedSchedules.includes(sch.key);
              return (
                <TouchableOpacity
                  key={sch.key}
                  onPress={() => toggleSchedule(sch.key)}
                  className="flex-row items-center p-3.5 rounded-xl border"
                  style={{
                    backgroundColor: active ? Colors.primary + '0D' : '#F8FAFC',
                    borderColor: active ? Colors.primary : '#E2E8F0',
                  }}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center mr-3"
                    style={{ backgroundColor: active ? Colors.primary + '20' : '#F1F5F9' }}
                  >
                    <Ionicons name={sch.icon as any} size={18} color={active ? Colors.primary : Colors.muted} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold" style={{ color: active ? Colors.primary : '#374151' }}>
                      {sch.label}
                    </Text>
                    <Text className="text-xs text-gray-400">{sch.sub}</Text>
                  </View>
                  <View
                    className="w-5 h-5 rounded-full border-2 items-center justify-center"
                    style={{ borderColor: active ? Colors.primary : '#CBD5E1', backgroundColor: active ? Colors.primary : '#fff' }}
                  >
                    {active && <Ionicons name="checkmark" size={11} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={savePrefs}
            disabled={savingPrefs}
            className="rounded-xl py-3.5 items-center"
            style={{ backgroundColor: Colors.primary, opacity: savingPrefs ? 0.7 : 1 }}
          >
            {savingPrefs
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text className="text-white font-bold">Guardar preferencias</Text>}
          </TouchableOpacity>
        </View>

        {/* Accesibilidad */}
        <View className="bg-white rounded-2xl p-5" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3 }}>
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-7 h-7 rounded-xl items-center justify-center" style={{ backgroundColor: Colors.purple + '18' }}>
              <Ionicons name="accessibility-outline" size={15} color={Colors.purple} />
            </View>
            <Text className="font-bold text-gray-800 text-base">Accesibilidad</Text>
          </View>
          <Text className="text-gray-400 text-xs mb-4 ml-9">
            Nos ayuda a recomendarte espacios adecuados
          </Text>

          <Text className="text-gray-600 text-sm font-semibold mb-3">Tipo de discapacidad</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {DISABILITY_OPTIONS.map(opt => {
              const active = disabilityType === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setDisabilityType(opt.value)}
                  className="flex-row items-center gap-1.5 px-3.5 py-2 rounded-xl border"
                  style={{
                    backgroundColor: active ? Colors.purple : '#F8FAFC',
                    borderColor: active ? Colors.purple : '#E2E8F0',
                  }}
                >
                  <Ionicons name={opt.icon as any} size={13} color={active ? '#fff' : Colors.muted} />
                  <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : '#64748B' }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {disabilityType !== 'ninguna' && (
            <View className="mb-4">
              <Text className="text-gray-600 text-sm font-semibold mb-2">Descripción (opcional)</Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                style={{ height: 80, textAlignVertical: 'top' }}
                placeholder="Describe tu necesidad de apoyo..."
                value={disabilityDesc}
                onChangeText={setDisabilityDesc}
                multiline
              />
            </View>
          )}

          <TouchableOpacity
            onPress={saveAccess}
            disabled={savingAccess}
            className="rounded-xl py-3.5 items-center"
            style={{ backgroundColor: Colors.purple, opacity: savingAccess ? 0.7 : 1 }}
          >
            {savingAccess
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text className="text-white font-bold">Guardar accesibilidad</Text>}
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}
