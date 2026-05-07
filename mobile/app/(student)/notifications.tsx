import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import { Notification } from '@/types';
import { Colors } from '@/theme/colors';

const TYPE_CONFIG: Record<
  Notification['type'],
  { label: string; icon: string; color: string; bg: string }
> = {
  reminder: {
    label: 'Recordatorio',
    icon: 'alarm-outline',
    color: Colors.primary,
    bg: '#EFF8FF',
  },
  change: {
    label: 'Cambio',
    icon: 'swap-horizontal-outline',
    color: Colors.orange,
    bg: '#FFF8EC',
  },
  cancellation: {
    label: 'Cancelación',
    icon: 'close-circle-outline',
    color: Colors.error,
    bg: '#FFF5F5',
  },
  recommendation: {
    label: 'Recomendación',
    icon: 'star-outline',
    color: Colors.green,
    bg: '#F0FFF4',
  },
};

const TYPE_FILTERS = [
  { key: 'all', label: 'Todas' },
  { key: 'reminder', label: 'Recordatorios' },
  { key: 'change', label: 'Cambios' },
  { key: 'cancellation', label: 'Cancelaciones' },
  { key: 'recommendation', label: 'Recomendaciones' },
];

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState('all');
  const [readIds, setReadIds] = useState<number[]>([]);

  const {
    data: notifications = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/auth/student/notifications'),
  });

  useEffect(() => {
    storage.getJson<number[]>('pita_read_notifs').then(ids => {
      if (ids) setReadIds(ids);
    });
  }, []);

  useEffect(() => {
    if (notifications.length === 0) return;
    const timer = setTimeout(async () => {
      const allIds = notifications.map(n => n.id);
      setReadIds(allIds);
      await storage.setJson('pita_read_notifs', allIds);
    }, 2000);
    return () => clearTimeout(timer);
  }, [notifications]);

  const filtered = useMemo(() => {
    return typeFilter === 'all'
      ? notifications
      : notifications.filter(n => n.type === typeFilter);
  }, [notifications, typeFilter]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-white text-xl font-bold">Notificaciones</Text>
          {unreadCount > 0 && (
            <View className="bg-white px-2.5 py-1 rounded-full">
              <Text className="text-unab-blue text-xs font-bold">
                {unreadCount} nuevas
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Type filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 max-h-14"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {TYPE_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setTypeFilter(f.key)}
            className={`px-4 py-1.5 rounded-full border ${
              typeFilter === f.key
                ? 'bg-unab-blue border-unab-blue'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                typeFilter === f.key ? 'text-white' : 'text-gray-600'
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type];
            const isRead = readIds.includes(item.id);
            return (
              <View
                className={`mx-4 mb-3 rounded-xl shadow-sm overflow-hidden ${
                  isRead ? 'bg-white' : 'bg-white'
                }`}
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: cfg.color,
                  opacity: isRead ? 0.85 : 1,
                }}
              >
                <View className="p-4 flex-row items-start gap-3">
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mt-0.5"
                    style={{ backgroundColor: cfg.bg }}
                  >
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold text-gray-800 flex-1 mr-2">
                        {item.title}
                      </Text>
                      {!isRead && (
                        <View className="w-2 h-2 rounded-full bg-unab-blue" />
                      )}
                    </View>
                    <Text className="text-gray-600 text-sm mt-1">{item.message}</Text>
                    <View className="flex-row items-center mt-2">
                      <View
                        className="px-2 py-0.5 rounded-full mr-2"
                        style={{ backgroundColor: cfg.bg }}
                      >
                        <Text className="text-xs font-medium" style={{ color: cfg.color }}>
                          {cfg.label}
                        </Text>
                      </View>
                      <Text className="text-gray-400 text-xs">
                        {formatDate(item.created_at)}
                      </Text>
                    </View>
                  </View>
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
              <Ionicons name="notifications-outline" size={52} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                Sin notificaciones
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
