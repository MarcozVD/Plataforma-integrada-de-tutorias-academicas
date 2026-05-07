import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
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
  Lun: 'Lunes',
  Mar: 'Martes',
  Mié: 'Miércoles',
  Jue: 'Jueves',
  Vie: 'Viernes',
  Sáb: 'Sábado',
};
const HOURS = Array.from({ length: 15 }, (_, i) => `${i + 6}:00`);
const COLORS = ['#00AEEF', '#8DC63F', '#6B2D8B', '#FF9900', '#EF4444'];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [activeDay, setActiveDay] = useState('Lun');
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    name: '',
    start: '08:00',
    end: '10:00',
    color: COLORS[0],
  });

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
    const newEntry: ScheduleEntry = {
      id: Date.now().toString(),
      name: form.name,
      day: activeDay,
      start: form.start,
      end: form.end,
      type: 'class',
      color: form.color,
    };
    saveEntries([...entries, newEntry]);
    setModalVisible(false);
    setForm({ name: '', start: '08:00', end: '10:00', color: COLORS[0] });
  }

  function removeEntry(id: string) {
    Alert.alert('Eliminar', '¿Eliminar esta entrada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => saveEntries(entries.filter(e => e.id !== id)),
      },
    ]);
  }

  const dayEntries = entries.filter(e => e.day === activeDay);

  const dayEnrolled = enrolledSessions.filter(s => {
    const sessionDay = new Date(s.date).toLocaleDateString('es-CO', {
      weekday: 'short',
    });
    return sessionDay.startsWith(FULL_DAYS[activeDay]?.substring(0, 3) ?? '');
  });

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-xl font-bold">Mi Horario</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-xl"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white text-sm ml-1">Agregar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Day tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 max-h-14"
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 10, gap: 6 }}
      >
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            onPress={() => setActiveDay(day)}
            className={`px-4 py-1.5 rounded-full ${
              activeDay === day ? 'bg-unab-blue' : 'bg-gray-100'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeDay === day ? 'text-white' : 'text-gray-600'
              }`}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 30 }}>
        <Text className="text-gray-700 font-semibold mb-3">
          {FULL_DAYS[activeDay]}
        </Text>

        {/* Enrolled tutorías on this day */}
        {dayEnrolled.length > 0 && (
          <View className="mb-4">
            <Text className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
              Tutorías inscritas
            </Text>
            {dayEnrolled.map(s => (
              <View
                key={s.id}
                className="bg-unab-blue/10 border-l-4 border-unab-blue rounded-xl p-3 mb-2"
              >
                <Text className="text-unab-blue font-semibold">{s.subject}</Text>
                <Text className="text-gray-600 text-sm">
                  {s.time} · {s.duration} min · {s.is_virtual ? 'Virtual' : s.room}
                </Text>
                <Text className="text-gray-500 text-xs">{s.tutor_name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* User classes */}
        {dayEntries.length > 0 ? (
          <View>
            <Text className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
              Mis clases y actividades
            </Text>
            {dayEntries.map(entry => (
              <View
                key={entry.id}
                className="bg-white rounded-xl p-4 mb-2 shadow-sm flex-row items-center"
                style={{ borderLeftWidth: 4, borderLeftColor: entry.color ?? Colors.primary }}
              >
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">{entry.name}</Text>
                  <Text className="text-gray-500 text-sm">
                    {entry.start} – {entry.end}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => removeEntry(entry.id)}>
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : dayEnrolled.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="calendar-outline" size={48} color={Colors.muted} />
            <Text className="text-gray-400 mt-3 text-center">
              No hay actividades para {FULL_DAYS[activeDay]}
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              className="mt-3 bg-unab-blue px-5 py-2.5 rounded-xl"
            >
              <Text className="text-white text-sm font-medium">Agregar clase</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Add modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl p-6">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-800">
                Agregar a {FULL_DAYS[activeDay]}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 text-sm mb-1">Nombre</Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-800 bg-gray-50"
              placeholder="Ej: Cálculo II"
              value={form.name}
              onChangeText={v => setForm(f => ({ ...f, name: v }))}
            />

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1">Inicio</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="08:00"
                  value={form.start}
                  onChangeText={v => setForm(f => ({ ...f, start: v }))}
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-600 text-sm mb-1">Fin</Text>
                <TextInput
                  className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
                  placeholder="10:00"
                  value={form.end}
                  onChangeText={v => setForm(f => ({ ...f, end: v }))}
                />
              </View>
            </View>

            <Text className="text-gray-600 text-sm mb-2">Color</Text>
            <View className="flex-row gap-3 mb-6">
              {COLORS.map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: c }}
                >
                  {form.color === c && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={addEntry}
              className="bg-unab-blue py-4 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Agregar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
