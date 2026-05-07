import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Switch,
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { TutoringSession, StudentEnrollment, Room } from '@/types';
import { Colors } from '@/theme/colors';

interface CreateSessionForm {
  subject: string;
  date: string;
  time: string;
  duration: string;
  capacity: string;
  is_virtual: boolean;
  room_id: string;
  accessibility_type: string;
}

const DEFAULT_FORM: CreateSessionForm = {
  subject: '',
  date: '',
  time: '',
  duration: '60',
  capacity: '10',
  is_virtual: false,
  room_id: '',
  accessibility_type: 'ninguna',
};

const ACCESS_OPTIONS = ['ninguna', 'visual', 'auditiva', 'motriz'];

export default function TutorPanelScreen() {
  const insets = useSafeAreaInsets();
  const { fullName } = useAuth();
  const queryClient = useQueryClient();

  const [createModal, setCreateModal] = useState(false);
  const [studentsModal, setStudentsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TutoringSession | null>(null);
  const [form, setForm] = useState<CreateSessionForm>(DEFAULT_FORM);

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<TutoringSession[]>({
    queryKey: ['tutor-sessions'],
    queryFn: () => api.get('/auth/tutor/sessions'),
  });

  const { data: rooms = [] } = useQuery<Room[]>({
    queryKey: ['rooms-available'],
    queryFn: () => api.get('/auth/rooms'),
    enabled: createModal,
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery<StudentEnrollment[]>({
    queryKey: ['session-students', selectedSession?.id],
    queryFn: () =>
      api.get(`/auth/tutor/sessions/${selectedSession!.id}/students`),
    enabled: !!selectedSession && studentsModal,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/auth/tutor/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      setCreateModal(false);
      setForm(DEFAULT_FORM);
      Alert.alert('Éxito', 'Sesión creada correctamente');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tutor-sessions'] });
      Alert.alert('Eliminada', 'La sesión fue eliminada');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function handleCreate() {
    if (!form.subject || !form.date || !form.time) {
      Alert.alert('Error', 'Completa los campos obligatorios');
      return;
    }
    createMutation.mutate({
      subject: form.subject,
      date: form.date,
      time: form.time,
      duration: parseInt(form.duration),
      capacity: parseInt(form.capacity),
      is_virtual: form.is_virtual,
      room_id: form.room_id ? parseInt(form.room_id) : null,
      accessibility_type:
        form.accessibility_type !== 'ninguna' ? form.accessibility_type : null,
    });
  }

  function confirmDelete(id: number, subject: string) {
    Alert.alert('Eliminar', `¿Eliminar la sesión "${subject}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  }

  const totalEnrolled = sessions.reduce((sum, s) => sum + s.enrolled, 0);

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-5">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/80 text-sm">Panel de Tutor</Text>
            <Text className="text-white text-xl font-bold">
              {fullName?.split(' ')[0]}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setCreateModal(true)}
            className="bg-white/20 px-3 py-2 rounded-xl flex-row items-center"
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text className="text-white text-sm ml-1">Nueva sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row mt-3 gap-3">
          <StatBox label="Sesiones" value={sessions.length} />
          <StatBox
            label="Próximas"
            value={sessions.filter(s => new Date(s.date) >= new Date()).length}
          />
          <StatBox label="Inscritos" value={totalEnrolled} />
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <View className="bg-white mx-4 mb-3 rounded-xl shadow-sm overflow-hidden"
              style={{ borderLeftWidth: 4, borderLeftColor: Colors.primary }}
            >
              <View className="p-4">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800">{item.subject}</Text>
                    <Text className="text-gray-500 text-sm">
                      {item.date} · {item.time}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {item.is_virtual ? '📹 Virtual' : `📍 ${item.room ?? item.location}`}
                      {' · '}
                      {item.duration} min · Cap: {item.enrolled}/{item.capacity}
                    </Text>
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedSession(item);
                        setStudentsModal(true);
                      }}
                      className="bg-unab-blue/10 p-2 rounded-lg"
                    >
                      <Ionicons name="people-outline" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(item.id, item.subject)}
                      className="bg-red-50 p-2 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Enrollment bar */}
                <View className="mt-3">
                  <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-unab-blue rounded-full"
                      style={{ width: `${(item.enrolled / item.capacity) * 100}%` }}
                    />
                  </View>
                  <Text className="text-gray-400 text-xs mt-1">
                    {item.enrolled} / {item.capacity} inscritos
                  </Text>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="calendar-outline" size={52} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                No tienes sesiones creadas
              </Text>
              <TouchableOpacity
                onPress={() => setCreateModal(true)}
                className="mt-3 bg-unab-blue px-5 py-2.5 rounded-xl"
              >
                <Text className="text-white text-sm font-medium">
                  Crear primera sesión
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Create Session Modal */}
      <Modal
        visible={createModal}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl" style={{ maxHeight: '90%' }}>
            <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">Nueva sesión</Text>
              <TouchableOpacity onPress={() => setCreateModal(false)}>
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <FormInput
                label="Materia *"
                placeholder="Ej: Cálculo II"
                value={form.subject}
                onChangeText={v => setForm(f => ({ ...f, subject: v }))}
              />
              <FormInput
                label="Fecha *"
                placeholder="YYYY-MM-DD"
                value={form.date}
                onChangeText={v => setForm(f => ({ ...f, date: v }))}
              />
              <FormInput
                label="Hora *"
                placeholder="HH:MM"
                value={form.time}
                onChangeText={v => setForm(f => ({ ...f, time: v }))}
              />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormInput
                    label="Duración (min)"
                    placeholder="60"
                    value={form.duration}
                    onChangeText={v => setForm(f => ({ ...f, duration: v }))}
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <FormInput
                    label="Capacidad"
                    placeholder="10"
                    value={form.capacity}
                    onChangeText={v => setForm(f => ({ ...f, capacity: v }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
                <Text className="text-gray-700 text-sm font-medium">
                  Sesión virtual
                </Text>
                <Switch
                  value={form.is_virtual}
                  onValueChange={v => setForm(f => ({ ...f, is_virtual: v }))}
                  trackColor={{ false: '#E5E7EB', true: Colors.primary }}
                  thumbColor="#fff"
                />
              </View>

              {!form.is_virtual && (
                <View className="mb-4">
                  <Text className="text-gray-600 text-sm font-medium mb-1">
                    Salón
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8 }}>
                    {rooms.map(r => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => setForm(f => ({ ...f, room_id: String(r.id) }))}
                        className={`px-3 py-2 rounded-xl border ${
                          form.room_id === String(r.id)
                            ? 'bg-unab-blue border-unab-blue'
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <Text className={`text-sm ${form.room_id === String(r.id) ? 'text-white' : 'text-gray-700'}`}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text className="text-gray-600 text-sm font-medium mb-2">
                Tipo de accesibilidad
              </Text>
              <View className="flex-row flex-wrap gap-2 mb-6">
                {ACCESS_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setForm(f => ({ ...f, accessibility_type: opt }))}
                    className={`px-3 py-1.5 rounded-full border ${
                      form.accessibility_type === opt
                        ? 'bg-unab-purple border-unab-purple'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm capitalize ${
                        form.accessibility_type === opt ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={createMutation.isPending}
                className="bg-unab-blue py-4 rounded-xl items-center"
                style={{ opacity: createMutation.isPending ? 0.7 : 1 }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Crear sesión</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Students Modal */}
      <Modal
        visible={studentsModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setStudentsModal(false);
          setSelectedSession(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl" style={{ maxHeight: '70%' }}>
            <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">
                Estudiantes inscritos
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setStudentsModal(false);
                  setSelectedSession(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            {loadingStudents ? (
              <View className="py-12 items-center">
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : (
              <FlatList
                data={students}
                keyExtractor={item => item.student_id}
                renderItem={({ item }) => (
                  <View className="px-5 py-3 border-b border-gray-100 flex-row items-center">
                    <View className="w-9 h-9 rounded-full bg-unab-blue/10 items-center justify-center mr-3">
                      <Text className="text-unab-blue font-bold">
                        {item.full_name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text className="font-medium text-gray-800">{item.full_name}</Text>
                      <Text className="text-gray-400 text-xs">
                        {item.student_id}
                        {item.carrera ? ` · ${item.carrera}` : ''}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <View className="py-12 items-center">
                    <Ionicons name="people-outline" size={40} color={Colors.muted} />
                    <Text className="text-gray-400 mt-2">Sin inscritos aún</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-white/20 rounded-xl p-3">
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-white/80 text-xs">{label}</Text>
    </View>
  );
}

function FormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm font-medium mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}
