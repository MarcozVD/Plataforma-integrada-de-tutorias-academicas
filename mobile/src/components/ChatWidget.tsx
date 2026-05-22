import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TutoringSession, Room } from '@/types';
import { Colors } from '@/theme/colors';

type ChatStep = 'menu' | 'sessions' | 'my-sessions' | 'rooms';

const MENU_OPTIONS = [
  { id: 'sessions',    label: 'Ver tutorías disponibles', icon: 'school-outline' as const },
  { id: 'my-sessions', label: 'Mis tutorías inscritas',   icon: 'calendar-outline' as const },
  { id: 'rooms',       label: 'Ver salones disponibles',  icon: 'business-outline' as const },
];

const BOT_GREETINGS: Record<string, string> = {
  sessions:    'Aquí están las tutorías disponibles:',
  'my-sessions': 'Tus tutorías inscritas:',
  rooms:       'Salones disponibles ahora:',
};

export default function ChatWidget() {
  const [open, setOpen]   = useState(false);
  const [step, setStep]   = useState<ChatStep>('menu');
  const [botMsg, setBotMsg] = useState('¡Hola! 👋 ¿En qué te puedo ayudar?');
  const queryClient = useQueryClient();

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    error: sessionsError,
  } = useQuery<TutoringSession[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions'),
    enabled: step === 'sessions',
  });

  const {
    data: enrolled = [],
    isLoading: loadingEnrolled,
    error: enrolledError,
  } = useQuery<TutoringSession[]>({
    queryKey: ['enrolled-sessions'],
    queryFn: () => api.get('/auth/student/enrolled-sessions'),
    enabled: step === 'my-sessions',
  });

  const {
    data: rooms = [],
    isLoading: loadingRooms,
    error: roomsError,
  } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/auth/rooms'),
    enabled: step === 'rooms',
  });

  const enrollMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/sessions/${id}/enroll`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      setBotMsg('✅ ¡Te inscribiste correctamente!');
      setStep('menu');
    },
    onError: (e: any) => setBotMsg(`❌ Error: ${e.message}`),
  });

  function handleMenuSelect(id: string) {
    setStep(id as ChatStep);
    setBotMsg(BOT_GREETINGS[id] ?? '');
  }

  function handleClose() {
    setOpen(false);
    setStep('menu');
    setBotMsg('¡Hola! 👋 ¿En qué te puedo ayudar?');
  }

  const isLoading =
    (step === 'sessions'    && loadingSessions)  ||
    (step === 'my-sessions' && loadingEnrolled)  ||
    (step === 'rooms'       && loadingRooms);

  const currentError =
    step === 'sessions'    ? sessionsError  :
    step === 'my-sessions' ? enrolledError  :
    step === 'rooms'       ? roomsError     : null;

  const availableSessions = sessions.filter(s => !s.is_enrolled && s.enrolled < s.capacity);
  const availableRooms    = rooms.filter(r => r.available);

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: Colors.primary,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Chat modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={handleClose}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View className="bg-white rounded-t-3xl" style={{ height: '78%' }}>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-row items-center gap-3">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: Colors.primary }}
                >
                  <Ionicons name="school-outline" size={20} color="#fff" />
                </View>
                <View>
                  <Text className="font-bold text-gray-800 text-base">Asistente PITA</Text>
                  <View className="flex-row items-center gap-1">
                    <View className="w-2 h-2 rounded-full bg-green-500" />
                    <Text className="text-green-600 text-xs font-medium">En línea</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="close" size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Bot message bubble */}
            <View className="px-4 pt-4 pb-2">
              <View
                className="self-start px-4 py-3 rounded-2xl rounded-tl-sm max-w-xs"
                style={{ backgroundColor: '#F1F5F9' }}
              >
                <Text className="text-gray-700 text-sm">{botMsg}</Text>
              </View>
            </View>

            {/* Content area */}
            <View className="flex-1 px-4">

              {/* Menu */}
              {step === 'menu' && (
                <View className="gap-2 mt-2">
                  {MENU_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleMenuSelect(opt.id)}
                      className="flex-row items-center gap-3 px-4 py-3.5 rounded-2xl border"
                      style={{ borderColor: Colors.primary + '40', backgroundColor: Colors.primary + '08' }}
                    >
                      <View
                        className="w-8 h-8 rounded-full items-center justify-center"
                        style={{ backgroundColor: Colors.primary + '18' }}
                      >
                        <Ionicons name={opt.icon} size={16} color={Colors.primary} />
                      </View>
                      <Text className="font-semibold text-sm flex-1" style={{ color: Colors.primary }}>
                        {opt.label}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.primary + '80'} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Error state */}
              {currentError && !isLoading && (
                <View className="mt-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                  <Text className="text-red-600 text-xs font-semibold mb-0.5">No se pudo cargar</Text>
                  <Text className="text-red-500 text-xs">{(currentError as Error).message}</Text>
                </View>
              )}

              {/* Loading */}
              {isLoading && (
                <View className="items-center py-8 gap-2">
                  <ActivityIndicator color={Colors.primary} />
                  <Text className="text-gray-400 text-xs">Cargando...</Text>
                </View>
              )}

              {/* Available sessions */}
              {step === 'sessions' && !isLoading && !currentError && (
                <FlatList
                  data={availableSessions}
                  keyExtractor={item => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <View
                      className="rounded-xl mb-2 overflow-hidden"
                      style={{ borderLeftWidth: 3, borderLeftColor: Colors.primary, backgroundColor: '#F8FAFC' }}
                    >
                      <View className="px-3 py-2.5">
                        <Text className="font-bold text-gray-800 text-sm">{item.subject}</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {item.tutor_name}
                        </Text>
                        <View className="flex-row items-center gap-3 mt-1.5">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="calendar-outline" size={11} color={Colors.muted} />
                            <Text className="text-gray-400 text-xs">{item.date}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="time-outline" size={11} color={Colors.muted} />
                            <Text className="text-gray-400 text-xs">{item.time}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="people-outline" size={11} color={Colors.muted} />
                            <Text className="text-gray-400 text-xs">
                              {item.capacity - item.enrolled} cupos
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => enrollMutation.mutate(item.id)}
                          disabled={enrollMutation.isPending}
                          className="rounded-lg py-1.5 mt-2 items-center"
                          style={{ backgroundColor: Colors.primary }}
                        >
                          {enrollMutation.isPending
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Text className="text-white text-xs font-semibold">Inscribirse</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View className="items-center py-8 gap-2">
                      <Ionicons name="calendar-outline" size={32} color={Colors.muted} />
                      <Text className="text-gray-400 text-sm">No hay tutorías disponibles</Text>
                    </View>
                  }
                />
              )}

              {/* Enrolled sessions */}
              {step === 'my-sessions' && !isLoading && !currentError && (
                <FlatList
                  data={enrolled}
                  keyExtractor={item => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <View
                      className="rounded-xl mb-2"
                      style={{ borderLeftWidth: 3, borderLeftColor: Colors.green, backgroundColor: '#F0FFF4' }}
                    >
                      <View className="px-3 py-2.5">
                        <Text className="font-bold text-gray-800 text-sm">{item.subject}</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">{item.tutor_name}</Text>
                        <View className="flex-row items-center gap-3 mt-1.5">
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="calendar-outline" size={11} color={Colors.muted} />
                            <Text className="text-gray-400 text-xs">{item.date}</Text>
                          </View>
                          <View className="flex-row items-center gap-1">
                            <Ionicons name="time-outline" size={11} color={Colors.muted} />
                            <Text className="text-gray-400 text-xs">{item.time}</Text>
                          </View>
                          <Text className="text-gray-400 text-xs ml-auto">
                            {item.is_virtual ? 'Virtual' : item.room ?? ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View className="items-center py-8 gap-2">
                      <Ionicons name="school-outline" size={32} color={Colors.muted} />
                      <Text className="text-gray-400 text-sm">No tienes tutorías inscritas</Text>
                    </View>
                  }
                />
              )}

              {/* Available rooms */}
              {step === 'rooms' && !isLoading && !currentError && (
                <FlatList
                  data={availableRooms}
                  keyExtractor={item => String(item.id)}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  renderItem={({ item }) => (
                    <View
                      className="rounded-xl mb-2"
                      style={{ borderLeftWidth: 3, borderLeftColor: Colors.green, backgroundColor: '#F8FAFC' }}
                    >
                      <View className="px-3 py-2.5 flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text className="font-bold text-gray-800 text-sm">{item.name}</Text>
                          <Text className="text-gray-500 text-xs mt-0.5">
                            {item.building}{item.floor ? ` · Piso ${item.floor}` : ''}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-1 ml-3">
                          <Ionicons name="people-outline" size={12} color={Colors.muted} />
                          <Text className="text-gray-500 text-xs">{item.capacity}</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  ListEmptyComponent={
                    <View className="items-center py-8 gap-2">
                      <Ionicons name="business-outline" size={32} color={Colors.muted} />
                      <Text className="text-gray-400 text-sm">No hay salones disponibles</Text>
                    </View>
                  }
                />
              )}
            </View>

            {/* Back to menu */}
            {step !== 'menu' && (
              <View className="px-4 pb-5 pt-2 border-t border-gray-100">
                <TouchableOpacity
                  onPress={() => {
                    setStep('menu');
                    setBotMsg('¿En qué más te puedo ayudar?');
                  }}
                  className="flex-row items-center justify-center rounded-xl py-3 gap-1.5"
                  style={{ backgroundColor: '#F1F5F9' }}
                >
                  <Ionicons name="arrow-back-outline" size={15} color={Colors.muted} />
                  <Text className="text-gray-500 text-sm font-medium">Volver al menú</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
