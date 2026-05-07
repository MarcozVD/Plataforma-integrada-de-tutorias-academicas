import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import TutoringCard from '@/components/TutoringCard';
import RoomCard from '@/components/RoomCard';
import ChatWidget from '@/components/ChatWidget';
import { TutoringSession, Room } from '@/types';
import { Colors } from '@/theme/colors';

const ACCESSIBILITY_FILTERS = [
  { key: 'wheelchair', label: 'Silla de ruedas', icon: 'accessibility-outline' },
  { key: 'visual', label: 'Visual', icon: 'eye-outline' },
  { key: 'hearing', label: 'Auditiva', icon: 'ear-outline' },
];

export default function DashboardScreen() {
  const { fullName, carrera } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'tutorias' | 'salones'>('tutorias');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [accessFilter, setAccessFilter] = useState<string[]>([]);

  const {
    data: sessions = [],
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = useQuery<TutoringSession[]>({
    queryKey: ['sessions'],
    queryFn: () => api.get('/auth/sessions'),
  });

  const {
    data: rooms = [],
    isLoading: loadingRooms,
    refetch: refetchRooms,
  } = useQuery<Room[]>({
    queryKey: ['rooms'],
    queryFn: () => api.get('/auth/rooms'),
  });

  const enrollMutation = useMutation({
    mutationFn: (id: number) => api.post(`/auth/sessions/${id}/enroll`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const unenrollMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/sessions/${id}/enroll`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const toggleAccess = (key: string) =>
    setAccessFilter(f =>
      f.includes(key) ? f.filter(k => k !== key) : [...f, key],
    );

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const matchSearch =
        !search ||
        s.subject.toLowerCase().includes(search.toLowerCase()) ||
        s.tutor_name.toLowerCase().includes(search.toLowerCase());
      const matchDate = !dateFilter || s.date === dateFilter;
      return matchSearch && matchDate;
    });
  }, [sessions, search, dateFilter]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());
      const matchAccess =
        accessFilter.length === 0 ||
        (accessFilter.includes('wheelchair') && r.has_wheelchair_access) ||
        (accessFilter.includes('visual') && r.has_visual_support) ||
        (accessFilter.includes('hearing') && r.has_hearing_support);
      return matchSearch && matchAccess;
    });
  }, [rooms, search, accessFilter]);

  const isLoading = activeTab === 'tutorias' ? loadingSessions : loadingRooms;

  const firstName = fullName?.split(' ')[0] ?? 'Usuario';

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View
        className="px-5 pt-4 pb-5"
        style={{
          background: 'transparent',
          backgroundColor: Colors.primary,
        }}
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/80 text-sm">¡Hola,</Text>
            <Text className="text-white text-xl font-bold">{firstName}! 👋</Text>
            {carrera ? (
              <Text className="text-white/70 text-xs mt-0.5">{carrera}</Text>
            ) : null}
          </View>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center">
            <Text className="text-white font-bold text-base">
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-2 mt-4">
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.8)" />
          <TextInput
            className="flex-1 ml-2 text-white"
            placeholder="Buscar tutorías o salones..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-4 pt-1">
        {(['tutorias', 'salones'] as const).map(tab => (
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
              {tab === 'tutorias' ? 'Tutorías' : 'Salones'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Accessibility filters (salones only) */}
      {activeTab === 'salones' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="bg-white border-b border-gray-100"
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
        >
          {ACCESSIBILITY_FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              onPress={() => toggleAccess(f.key)}
              className={`flex-row items-center px-3 py-1.5 rounded-full border ${
                accessFilter.includes(f.key)
                  ? 'bg-unab-blue border-unab-blue'
                  : 'bg-white border-gray-300'
              }`}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={accessFilter.includes(f.key) ? '#fff' : Colors.textSecondary}
              />
              <Text
                className={`ml-1 text-xs font-medium ${
                  accessFilter.includes(f.key) ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : activeTab === 'tutorias' ? (
        <FlatList
          data={filteredSessions}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => (
            <TutoringCard
              session={item}
              onEnroll={() => enrollMutation.mutate(item.id)}
              onUnenroll={() => unenrollMutation.mutate(item.id)}
              loading={enrollMutation.isPending || unenrollMutation.isPending}
            />
          )}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingSessions}
              onRefresh={refetchSessions}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="calendar-outline" size={48} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                No hay tutorías disponibles
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredRooms}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <RoomCard room={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingRooms}
              onRefresh={refetchRooms}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="business-outline" size={48} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                No hay salones disponibles
              </Text>
            </View>
          }
        />
      )}

      <ChatWidget />
    </View>
  );
}
