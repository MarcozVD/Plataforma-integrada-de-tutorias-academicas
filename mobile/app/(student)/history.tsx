import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { EnrolledSession } from '@/types';
import { Colors } from '@/theme/colors';

const STATUS_CONFIG = {
  upcoming: { label: 'Próxima', color: Colors.primary, bg: '#EFF8FF' },
  completed: { label: 'Completada', color: Colors.green, bg: '#F0FFF4' },
  cancelled: { label: 'Cancelada', color: Colors.error, bg: '#FFF5F5' },
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  const {
    data: sessions = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<EnrolledSession[]>({
    queryKey: ['enrolled-sessions'],
    queryFn: () => api.get('/auth/student/enrolled-sessions'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/sessions/${id}/enroll`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['enrolled-sessions'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function confirmCancel(id: number, subject: string) {
    Alert.alert(
      'Cancelar inscripción',
      `¿Deseas cancelar tu inscripción a "${subject}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(id),
        },
      ],
    );
  }

  const filtered = sessions.filter(s =>
    activeTab === 'upcoming'
      ? s.status === 'upcoming'
      : s.status !== 'upcoming',
  );

  const upcomingCount = sessions.filter(s => s.status === 'upcoming').length;
  const completedCount = sessions.filter(s => s.status !== 'upcoming').length;

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-5">
        <Text className="text-white text-xl font-bold">Mi Historial</Text>
        <View className="flex-row mt-3 gap-3">
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white text-2xl font-bold">{upcomingCount}</Text>
            <Text className="text-white/80 text-xs">Próximas</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white text-2xl font-bold">{completedCount}</Text>
            <Text className="text-white/80 text-xs">Completadas</Text>
          </View>
          <View className="flex-1 bg-white/20 rounded-xl p-3">
            <Text className="text-white text-2xl font-bold">{sessions.length}</Text>
            <Text className="text-white/80 text-xs">Total</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-1">
        {(['upcoming', 'completed'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-6 pb-3 border-b-2 ${
              activeTab === tab ? 'border-unab-blue' : 'border-transparent'
            }`}
          >
            <Text
              className={`font-medium text-sm ${
                activeTab === tab ? 'text-unab-blue' : 'text-gray-500'
              }`}
            >
              {tab === 'upcoming' ? 'Próximas' : 'Historial'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.upcoming;
            return (
              <View
                className="bg-white rounded-xl mx-4 mb-3 shadow-sm overflow-hidden"
                style={{ borderLeftWidth: 4, borderLeftColor: cfg.color }}
              >
                <View className="p-4">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800 text-base">
                        {item.subject}
                      </Text>
                      <Text className="text-gray-500 text-sm mt-0.5">
                        {item.tutor_name}
                      </Text>
                    </View>
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: cfg.bg }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row flex-wrap gap-3 mt-3">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text className="text-gray-500 text-xs ml-1">{item.date}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text className="text-gray-500 text-xs ml-1">{item.time}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name={item.is_virtual ? 'videocam-outline' : 'location-outline'}
                        size={14}
                        color={Colors.textSecondary}
                      />
                      <Text className="text-gray-500 text-xs ml-1">
                        {item.is_virtual ? 'Virtual' : (item.room ?? item.location)}
                      </Text>
                    </View>
                  </View>

                  {item.status === 'upcoming' && (
                    <TouchableOpacity
                      onPress={() => confirmCancel(item.id, item.subject)}
                      disabled={cancelMutation.isPending}
                      className="mt-3 border border-red-300 rounded-lg py-2 items-center"
                    >
                      <Text className="text-red-500 text-sm font-medium">
                        Cancelar inscripción
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          }}
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
              <Ionicons name="time-outline" size={52} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                No hay {activeTab === 'upcoming' ? 'tutorías próximas' : 'historial'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
