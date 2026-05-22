import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { EnrolledSession } from '@/types';
import { Colors } from '@/theme/colors';

const STATUS_CONFIG = {
  upcoming:  { label: 'Próxima',    color: Colors.primary, bg: '#EFF8FF', icon: 'time-outline' },
  completed: { label: 'Completada', color: Colors.green,   bg: '#ECFDF5', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Cancelada',  color: Colors.error,   bg: '#FFF5F5', icon: 'close-circle-outline' },
};

interface RatingModalState {
  sessionId: number;
  subject: string;
  stars: number;
  comment: string;
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [ratingModal, setRatingModal] = useState<RatingModalState | null>(null);

  const { data: sessions = [], isLoading, refetch, isRefetching } =
    useQuery<EnrolledSession[]>({
      queryKey: ['enrolled-sessions'],
      queryFn: () => api.get('/auth/student/enrolled-sessions'),
    });

  const { data: ratedIds = [] } =
    useQuery<{ session_id: number }[]>({
      queryKey: ['my-ratings'],
      queryFn: () => api.get('/auth/student/my-ratings'),
    });

  const ratedSet = new Set(ratedIds.map(r => r.session_id));

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/sessions/${id}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrolled-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const rateMutation = useMutation({
    mutationFn: ({ id, stars, comment }: { id: number; stars: number; comment: string }) =>
      api.post(`/auth/sessions/${id}/rate`, { stars, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-ratings'] });
      setRatingModal(null);
      Alert.alert('¡Gracias!', 'Tu valoración fue enviada.');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function confirmCancel(id: number, subject: string) {
    Alert.alert(
      'Cancelar inscripción',
      `¿Deseas cancelar tu inscripción a "${subject}"?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate(id) },
      ],
    );
  }

  const upcoming  = sessions.filter(s => s.status === 'upcoming');
  const completed = sessions.filter(s => s.status !== 'upcoming');
  const filtered  = activeTab === 'upcoming' ? upcoming : completed;

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: Colors.primary }}>
        <Text className="text-white/70 text-xs font-medium tracking-wide uppercase mb-1">
          Mis Tutorías
        </Text>
        <Text className="text-white text-2xl font-bold mb-4">Historial</Text>
        <View className="flex-row gap-3">
          {[
            { label: 'Próximas',   value: upcoming.length,       icon: 'time-outline' },
            { label: 'Completadas',value: completed.length,      icon: 'checkmark-circle-outline' },
            { label: 'Total',      value: sessions.length,       icon: 'school-outline' },
          ].map(stat => (
            <View key={stat.label} className="flex-1 rounded-2xl px-3 py-3" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
              <Ionicons name={stat.icon as any} size={16} color="rgba(255,255,255,0.8)" />
              <Text className="text-white text-2xl font-bold mt-1">{stat.value}</Text>
              <Text className="text-white/70 text-xs">{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-100">
        {(['upcoming', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 items-center py-3"
            style={{ borderBottomWidth: 2, borderBottomColor: activeTab === tab ? Colors.primary : 'transparent' }}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={tab === 'upcoming' ? 'time-outline' : 'checkmark-circle-outline'}
                size={15}
                color={activeTab === tab ? Colors.primary : Colors.muted}
              />
              <Text className="text-sm font-semibold" style={{ color: activeTab === tab ? Colors.primary : Colors.muted }}>
                {tab === 'upcoming' ? 'Próximas' : 'Historial'}
              </Text>
              {tab === 'upcoming' && upcoming.length > 0 && (
                <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: Colors.primary }}>
                  <Text className="text-white text-[10px] font-bold">{upcoming.length}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-sm">Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.upcoming;
            const isRated = ratedSet.has(item.id);
            return (
              <View
                className="bg-white rounded-2xl overflow-hidden"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: cfg.color,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.07,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View className="p-4">
                  {/* Title + status */}
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="font-bold text-gray-800 text-base" numberOfLines={2}>
                        {item.subject}
                      </Text>
                      <View className="flex-row items-center mt-0.5">
                        <View className="w-5 h-5 rounded-full items-center justify-center mr-1.5" style={{ backgroundColor: Colors.primary + '18' }}>
                          <Text className="text-[10px] font-bold" style={{ color: Colors.primary }}>
                            {item.tutor_name.charAt(0)}
                          </Text>
                        </View>
                        <Text className="text-gray-500 text-sm">{item.tutor_name}</Text>
                      </View>
                    </View>
                    <View className="px-2.5 py-1 rounded-xl flex-row items-center gap-1" style={{ backgroundColor: cfg.bg }}>
                      <Ionicons name={cfg.icon as any} size={11} color={cfg.color} />
                      <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
                    </View>
                  </View>

                  {/* Info chips */}
                  <View className="flex-row flex-wrap gap-x-4 gap-y-1 rounded-xl px-3 py-2.5 mb-3" style={{ backgroundColor: '#F8FAFC' }}>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="calendar-outline" size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{item.date}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="time-outline" size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{item.time}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="hourglass-outline" size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{item.duration} min</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Ionicons name={item.is_virtual ? 'videocam-outline' : 'location-outline'} size={12} color={Colors.muted} />
                      <Text className="text-gray-500 text-xs">{item.is_virtual ? 'Virtual' : (item.room ?? item.location ?? '—')}</Text>
                    </View>
                  </View>

                  {/* Actions */}
                  {item.status === 'upcoming' && (
                    <TouchableOpacity
                      onPress={() => confirmCancel(item.id, item.subject)}
                      disabled={cancelMutation.isPending}
                      className="rounded-xl py-2.5 items-center border"
                      style={{ borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }}
                    >
                      {cancelMutation.isPending
                        ? <ActivityIndicator size="small" color={Colors.error} />
                        : <Text className="text-sm font-semibold" style={{ color: Colors.error }}>Cancelar inscripción</Text>}
                    </TouchableOpacity>
                  )}

                  {item.status === 'completed' && (
                    isRated ? (
                      <View className="rounded-xl py-2.5 items-center flex-row justify-center gap-1.5" style={{ backgroundColor: '#ECFDF5' }}>
                        <Ionicons name="star" size={14} color={Colors.green} />
                        <Text className="text-sm font-semibold" style={{ color: Colors.green }}>Valorada</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => setRatingModal({ sessionId: item.id, subject: item.subject, stars: 0, comment: '' })}
                        className="rounded-xl py-2.5 items-center flex-row justify-center gap-1.5"
                        style={{ backgroundColor: Colors.orange + '18', borderWidth: 1, borderColor: Colors.orange + '40' }}
                      >
                        <Ionicons name="star-outline" size={14} color={Colors.orange} />
                        <Text className="text-sm font-semibold" style={{ color: Colors.orange }}>Valorar tutoría</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name={activeTab === 'upcoming' ? 'time-outline' : 'checkmark-circle-outline'} size={32} color={Colors.muted} />
              </View>
              <Text className="text-gray-500 font-medium">
                {activeTab === 'upcoming' ? 'No tienes tutorías próximas' : 'Sin historial aún'}
              </Text>
              <Text className="text-gray-400 text-xs text-center px-8">
                {activeTab === 'upcoming'
                  ? 'Ve al inicio para inscribirte en una tutoría'
                  : 'Aquí aparecerán tus tutorías completadas'}
              </Text>
            </View>
          }
        />
      )}

      {/* Rating modal */}
      <Modal visible={!!ratingModal} animationType="slide" transparent onRequestClose={() => setRatingModal(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-bold text-gray-800">Valorar tutoría</Text>
                <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>{ratingModal?.subject}</Text>
              </View>
              <TouchableOpacity onPress={() => setRatingModal(null)} className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="close" size={18} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            {/* Stars */}
            <Text className="text-gray-600 text-sm font-medium mb-3 text-center">¿Cómo calificarías esta tutoría?</Text>
            <View className="flex-row justify-center gap-3 mb-5">
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRatingModal(m => m ? { ...m, stars: star } : m)}
                >
                  <Ionicons
                    name={(ratingModal?.stars ?? 0) >= star ? 'star' : 'star-outline'}
                    size={36}
                    color={(ratingModal?.stars ?? 0) >= star ? Colors.orange : Colors.muted}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {ratingModal?.stars ? (
              <Text className="text-center text-gray-500 text-xs mb-4">
                {['', 'Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'][ratingModal.stars]}
              </Text>
            ) : null}

            {/* Comment */}
            <Text className="text-gray-600 text-sm font-medium mb-2">Comentario (opcional)</Text>
            <TextInput
              className="border border-gray-200 rounded-xl px-4 py-3 text-gray-800 bg-gray-50 mb-5"
              style={{ height: 80, textAlignVertical: 'top' }}
              placeholder="¿Qué te pareció la tutoría?"
              value={ratingModal?.comment ?? ''}
              onChangeText={v => setRatingModal(m => m ? { ...m, comment: v } : m)}
              multiline
            />

            <TouchableOpacity
              onPress={() => ratingModal && rateMutation.mutate({ id: ratingModal.sessionId, stars: ratingModal.stars, comment: ratingModal.comment })}
              disabled={!ratingModal?.stars || rateMutation.isPending}
              className="rounded-xl py-4 items-center"
              style={{ backgroundColor: ratingModal?.stars ? Colors.primary : Colors.muted }}
            >
              {rateMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text className="text-white font-bold text-base">Enviar valoración</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
