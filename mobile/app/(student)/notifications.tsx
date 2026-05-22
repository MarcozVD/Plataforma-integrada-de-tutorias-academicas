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

const TYPE_CONFIG: Record<Notification['type'], { label: string; icon: string; color: string; bg: string }> = {
  reminder:       { label: 'Recordatorio', icon: 'alarm-outline',            color: Colors.primary, bg: '#EFF8FF' },
  change:         { label: 'Cambio',        icon: 'swap-horizontal-outline',  color: Colors.orange,  bg: '#FFF7ED' },
  cancellation:   { label: 'Cancelación',   icon: 'close-circle-outline',     color: Colors.error,   bg: '#FFF5F5' },
  recommendation: { label: 'Recomendación', icon: 'star-outline',             color: Colors.green,   bg: '#ECFDF5' },
};

const TYPE_FILTERS = [
  { key: 'all',            label: 'Todas',          icon: 'apps-outline' },
  { key: 'reminder',       label: 'Recordatorios',  icon: 'alarm-outline' },
  { key: 'change',         label: 'Cambios',         icon: 'swap-horizontal-outline' },
  { key: 'cancellation',   label: 'Cancelaciones',   icon: 'close-circle-outline' },
  { key: 'recommendation', label: 'Recomendaciones', icon: 'star-outline' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState('all');
  const [readIds, setReadIds]       = useState<number[]>([]);

  const { data: notifications = [], isLoading, refetch, isRefetching } =
    useQuery<Notification[]>({
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

  const filtered = useMemo(() =>
    typeFilter === 'all' ? notifications : notifications.filter(n => n.type === typeFilter),
    [notifications, typeFilter],
  );

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row items-end justify-between">
          <View>
            <Text className="text-white/70 text-xs font-medium tracking-wide uppercase">Plataforma de Tutorías</Text>
            <Text className="text-white text-2xl font-bold mt-0.5">Notificaciones</Text>
          </View>
          {unreadCount > 0 && (
            <View className="px-3 py-1.5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <Text className="text-white text-xs font-bold">{unreadCount} nueva{unreadCount !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Type filter chips */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {TYPE_FILTERS.map(f => {
            const active = typeFilter === f.key;
            const count = f.key === 'all'
              ? notifications.length
              : notifications.filter(n => n.type === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setTypeFilter(f.key)}
                className="flex-row items-center px-3.5 py-2 rounded-xl border gap-1.5"
                style={{
                  backgroundColor: active ? Colors.primary : '#F8FAFC',
                  borderColor: active ? Colors.primary : '#E2E8F0',
                }}
              >
                <Ionicons name={f.icon as any} size={13} color={active ? '#fff' : Colors.muted} />
                <Text className="text-xs font-semibold" style={{ color: active ? '#fff' : '#64748B' }}>
                  {f.label}
                </Text>
                {count > 0 && (
                  <View
                    className="px-1.5 rounded-full"
                    style={{ backgroundColor: active ? 'rgba(255,255,255,0.25)' : '#E2E8F0' }}
                  >
                    <Text className="text-[10px] font-bold" style={{ color: active ? '#fff' : Colors.muted }}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />}
          renderItem={({ item }) => {
            const cfg = TYPE_CONFIG[item.type];
            const isRead = readIds.includes(item.id);
            return (
              <View
                className="bg-white rounded-2xl overflow-hidden"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: cfg.color,
                  opacity: isRead ? 0.88 : 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: isRead ? 1 : 2,
                }}
              >
                <View className="p-4 flex-row items-start gap-3">
                  {/* Icon */}
                  <View className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                    <Ionicons name={cfg.icon as any} size={20} color={cfg.color} />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between gap-2">
                      <Text className="font-bold text-gray-800 flex-1 text-sm" numberOfLines={2}>
                        {item.title}
                      </Text>
                      {!isRead && (
                        <View className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: Colors.primary }} />
                      )}
                    </View>
                    <Text className="text-gray-500 text-xs mt-1 leading-relaxed">{item.message}</Text>
                    <View className="flex-row items-center mt-2 gap-2">
                      <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg }}>
                        <Text className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
                      </View>
                      <Text className="text-gray-400 text-[10px]">{timeAgo(item.created_at)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="notifications-outline" size={32} color={Colors.muted} />
              </View>
              <Text className="text-gray-500 font-medium">Sin notificaciones</Text>
              <Text className="text-gray-400 text-xs text-center px-8">
                Aquí aparecerán tus recordatorios, cambios y recomendaciones
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
