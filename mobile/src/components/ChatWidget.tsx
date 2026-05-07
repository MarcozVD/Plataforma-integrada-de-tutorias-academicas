import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TutoringSession, Room } from '@/types';
import { Colors } from '@/theme/colors';

type ChatStep = 'menu' | 'sessions' | 'my-sessions' | 'rooms';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    sender: 'bot',
    text: '¡Hola! 👋 Soy tu asistente de PITA. ¿En qué te puedo ayudar?',
  },
];

const MENU_OPTIONS = [
  { id: 'sessions', label: '📚 Ver tutorías disponibles' },
  { id: 'my-sessions', label: '📅 Mis tutorías inscritas' },
  { id: 'rooms', label: '🏢 Ver salones disponibles' },
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ChatStep>('menu');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery<TutoringSession[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions'),
    enabled: step === 'sessions',
  });

  const { data: enrolled = [], isLoading: loadingEnrolled } = useQuery<TutoringSession[]>({
    queryKey: ['enrolled-sessions'],
    queryFn: () => api.get('/auth/student/enrolled-sessions'),
    enabled: step === 'my-sessions',
  });

  const { data: rooms = [], isLoading: loadingRooms } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/auth/rooms'),
    enabled: step === 'rooms',
  });

  const enrollMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/sessions/${id}/enroll`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      addBotMessage('✅ ¡Te inscribiste correctamente!');
    },
    onError: (e: any) => addBotMessage(`❌ Error: ${e.message}`),
  });

  function addBotMessage(text: string) {
    setMessages(m => [...m, { id: Date.now().toString(), sender: 'bot', text }]);
  }

  function addUserMessage(text: string) {
    setMessages(m => [...m, { id: Date.now().toString(), sender: 'user', text }]);
  }

  function handleMenuSelect(id: string, label: string) {
    addUserMessage(label);
    setStep(id as ChatStep);
    if (id === 'sessions') addBotMessage('Aquí están las tutorías disponibles:');
    if (id === 'my-sessions') addBotMessage('Tus tutorías inscritas:');
    if (id === 'rooms') addBotMessage('Salones disponibles:');
  }

  function handleClose() {
    setOpen(false);
    setStep('menu');
    setMessages(INITIAL_MESSAGES);
  }

  const isLoading =
    (step === 'sessions' && loadingSessions) ||
    (step === 'my-sessions' && loadingEnrolled) ||
    (step === 'rooms' && loadingRooms);

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        className="absolute bottom-4 right-4 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        style={{ backgroundColor: Colors.primary }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Chat modal */}
      <Modal
        visible={open}
        animationType="slide"
        transparent
        onRequestClose={handleClose}
      >
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl" style={{ height: '75%' }}>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-full bg-unab-blue items-center justify-center mr-2">
                  <Ionicons name="chatbubble-outline" size={18} color="#fff" />
                </View>
                <View>
                  <Text className="font-bold text-gray-800">Asistente PITA</Text>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                    <Text className="text-green-500 text-xs">En línea</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Messages + content */}
            <View className="flex-1 px-4 py-3">
              {/* Last bot message */}
              <View className="mb-3">
                <View className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 self-start max-w-xs">
                  <Text className="text-gray-800 text-sm">
                    {messages[messages.length - 1]?.text}
                  </Text>
                </View>
              </View>

              {/* Menu options */}
              {step === 'menu' && (
                <View className="gap-2">
                  {MENU_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => handleMenuSelect(opt.id, opt.label)}
                      className="border border-unab-blue rounded-2xl px-4 py-3"
                    >
                      <Text className="text-unab-blue font-medium text-sm">
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Sessions list */}
              {step === 'sessions' && (
                isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <FlatList
                    data={sessions.filter(s => !s.is_enrolled && s.enrolled < s.capacity)}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                      <View className="bg-gray-50 rounded-xl p-3 mb-2">
                        <Text className="font-semibold text-gray-800 text-sm">
                          {item.subject}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {item.tutor_name} · {item.date} {item.time}
                        </Text>
                        <TouchableOpacity
                          onPress={() => enrollMutation.mutate(item.id)}
                          disabled={enrollMutation.isPending}
                          className="bg-unab-blue rounded-lg py-1.5 mt-2 items-center"
                        >
                          <Text className="text-white text-xs font-medium">
                            Inscribirse
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text className="text-gray-400 text-sm text-center py-4">
                        No hay tutorías disponibles
                      </Text>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                )
              )}

              {/* My enrolled sessions */}
              {step === 'my-sessions' && (
                isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <FlatList
                    data={enrolled}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                      <View className="bg-gray-50 rounded-xl p-3 mb-2">
                        <Text className="font-semibold text-gray-800 text-sm">
                          {item.subject}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {item.date} {item.time} ·{' '}
                          {item.is_virtual ? 'Virtual' : item.room}
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text className="text-gray-400 text-sm text-center py-4">
                        No tienes tutorías inscritas
                      </Text>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                )
              )}

              {/* Rooms */}
              {step === 'rooms' && (
                isLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <FlatList
                    data={rooms.filter(r => r.available)}
                    keyExtractor={item => String(item.id)}
                    renderItem={({ item }) => (
                      <View className="bg-gray-50 rounded-xl p-3 mb-2">
                        <Text className="font-semibold text-gray-800 text-sm">
                          {item.name}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {item.building} · Cap: {item.capacity}
                        </Text>
                      </View>
                    )}
                    ListEmptyComponent={
                      <Text className="text-gray-400 text-sm text-center py-4">
                        No hay salones disponibles
                      </Text>
                    }
                    showsVerticalScrollIndicator={false}
                  />
                )
              )}
            </View>

            {/* Back to menu */}
            {step !== 'menu' && (
              <View className="px-4 pb-4 border-t border-gray-100 pt-3">
                <TouchableOpacity
                  onPress={() => {
                    setStep('menu');
                    addBotMessage('¿En qué más te puedo ayudar?');
                  }}
                  className="flex-row items-center justify-center bg-gray-100 rounded-xl py-3"
                >
                  <Ionicons name="arrow-back-outline" size={16} color={Colors.muted} />
                  <Text className="text-gray-500 text-sm ml-1">Volver al menú</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
