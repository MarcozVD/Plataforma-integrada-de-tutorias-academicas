import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { ScheduleEntry, EnrolledSession } from '@/types';
import { Colors } from '@/theme/colors';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const FULL_DAYS: Record<string, string> = {
  Lun: 'Lunes', Mar: 'Martes', Mié: 'Miércoles',
  Jue: 'Jueves', Vie: 'Viernes', Sáb: 'Sábado',
};
const PALETTE = [
  Colors.primary, Colors.green, Colors.purple, Colors.orange, Colors.error,
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [activeDay, setActiveDay]     = useState('Lun');
  const [entries, setEntries]         = useState<ScheduleEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ name: '', start: '08:00', end: '10:00', color: PALETTE[0] });

  const { data: enrolledSessions = [] } = useQuery<EnrolledSession[]>({
    queryKey: ['enrolled-sessions'],
    queryFn: () => api.get('/auth/student/enrolled-sessions'),
  });

  useEffect(() => {
    storage.getJson<ScheduleEntry[]>('userHorario').then(saved => {
      if (saved) setEntries(saved);
    });
  }, []);

  async function saveEntries(updated: ScheduleEntry[]) {
    setEntries(updated);
    await storage.setJson('userHorario', updated);
  }

  function addEntry() {
    if (!form.name.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la actividad');
      return;
    }
    saveEntries([...entries, {
      id: Date.now().toString(),
      name: form.name,
      day: activeDay,
      start: form.start,
      end: form.end,
      type: 'class',
      color: form.color,
    }]);
    setModalVisible(false);
    setForm({ name: '', start: '08:00', end: '10:00', color: PALETTE[0] });
  }

  function removeEntry(id: string) {
    Alert.alert('Eliminar', '¿Eliminar esta entrada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => saveEntries(entries.filter(e => e.id !== id)) },
    ]);
  }

  const dayEntries = entries.filter(e => e.day === activeDay);
  const dayEnrolled = enrolledSessions.filter(s => {
    const sessionDay = new Date(s.date).toLocaleDateString('es-CO', { weekday: 'short' });
    return sessionDay.startsWith(FULL_DAYS[activeDay]?.substring(0, 3) ?? '');
  });

  const hasActivity = (day: string) =>
    entries.some(e => e.day === day) ||
    enrolledSessions.some(s =>
      new Date(s.date).toLocaleDateString('es-CO', { weekday: 'short' })
        .startsWith(FULL_DAYS[day]?.substring(0, 3) ?? ''),
    );

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/70 text-xs font-medium tracking-wide uppercase">Plataforma de Tutorías</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">Mi Horario</Text>
          </View>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex-row items-center gap-1.5 px-4 py-2.5 rounded-xl"
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' }}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white text-sm font-semibold">Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day selector */}
      <View className="bg-white border-b border-gray-100 px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {DAYS.map(day => {
            const active = activeDay === day;
            const hasDot = hasActivity(day);
            return (
              <TouchableOpacity
                key={day}
                onPress={() => setActiveDay(day)}
                className="items-center px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: active ? Colors.primary : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: active ? Colors.primary : '#E2E8F0',
                  minWidth: 56,
                }}
              >
                <Text className="text-xs font-medium" style={{ color: active ? 'rgba(255,255,255,0.8)' : Colors.muted }}>
                  {day}
                </Text>
                {hasDot && (
                  <View
                    className="w-1.5 h-1.5 rounded-full mt-1"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.8)' : Colors.primary }}
                  />
                )}
                {!hasDot && <View className="w-1.5 h-1.5 mt-1" />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}>

        {/* Day title */}
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-bold text-gray-800">{FULL_DAYS[activeDay]}</Text>
          <Text className="text-gray-400 text-xs">
            {dayEntries.length + dayEnrolled.length} actividade{dayEntries.length + dayEnrolled.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Tutorías inscritas */}
        {dayEnrolled.length > 0 && (
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="school-outline" size={13} color={Colors.primary} />
              <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: Colors.primary }}>
                Tutorías inscritas
              </Text>
            </View>
            {dayEnrolled.map(s => (
              <View
                key={s.id}
                className="bg-white rounded-2xl overflow-hidden mb-2"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: Colors.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="p-4">
                  <Text className="font-bold text-gray-800">{s.subject}</Text>
                  <View className="flex-row flex-wrap gap-x-3 gap-y-1 mt-1.5">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{s.time} · {s.duration} min</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name={s.is_virtual ? 'videocam-outline' : 'location-outline'} size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{s.is_virtual ? 'Virtual' : s.room}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="person-outline" size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{s.tutor_name}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Clases del usuario */}
        {dayEntries.length > 0 && (
          <View>
            <View className="flex-row items-center gap-2 mb-2">
              <Ionicons name="book-outline" size={13} color={Colors.textSecondary} />
              <Text className="text-xs font-bold uppercase tracking-wide text-gray-400">
                Mis clases y actividades
              </Text>
            </View>
            {dayEntries.map(entry => (
              <View
                key={entry.id}
                className="bg-white rounded-2xl overflow-hidden mb-2 flex-row items-center"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: entry.color ?? Colors.primary,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View className="flex-1 p-4">
                  <Text className="font-bold text-gray-800">{entry.name}</Text>
                  <View className="flex-row items-center gap-1 mt-1">
                    <Ionicons name="time-outline" size={12} color={Colors.muted} />
                    <Text className="text-gray-500 text-xs">{entry.start} – {entry.end}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeEntry(entry.id)} className="px-4 py-4">
                  <Ionicons name="trash-outline" size={18} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {dayEntries.length === 0 && dayEnrolled.length === 0 && (
          <View className="items-center py-16 gap-3">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
              <Ionicons name="calendar-outline" size={32} color={Colors.muted} />
            </View>
            <Text className="text-gray-500 font-medium">Sin actividades el {FULL_DAYS[activeDay]}</Text>
            <Text className="text-gray-400 text-xs text-center px-8">
              Agrega tus clases o inscríbete en una tutoría
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="flex-row items-center gap-1.5 px-5 py-2.5 rounded-xl mt-1"
              style={{ backgroundColor: Colors.primary }}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text className="text-white text-sm font-semibold">Agregar clase</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text className="text-lg font-bold text-gray-800">Nueva actividad</Text>
                <Text className="text-gray-500 text-sm">{FULL_DAYS[activeDay]}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="close" size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-sm font-medium mb-1.5">Nombre</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800 bg-gray-50"
              placeholder="Ej: Cálculo II"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm font-medium mb-1.5">Inicio</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="08:00"
                  value={form.start}
                  onChangeText={v => setForm(f => ({ ...f, start: v }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm font-medium mb-1.5">Fin</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="10:00"
                  value={form.end}
                  onChangeText={v => setForm(f => ({ ...f, end: v }))}
                />
              </View>
            </View>

            <Text className="text-gray-600 text-sm font-medium mb-3">Color</Text>
            <View className="flex-row gap-3 mb-6">
              {PALETTE.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm(f => ({ ...f, color: c }))}
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: c, borderWidth: form.color === c ? 3 : 0, borderColor: 'rgba(0,0,0,0.15)' }}
                >
                  {form.color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={addEntry}
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: Colors.primary }}
            >
              <Text className="text-white font-bold text-base">Agregar actividad</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
