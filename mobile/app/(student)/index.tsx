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

const DATE_QUICK = [
  { label: 'Hoy',        value: new Date().toISOString().slice(0, 10) },
  { label: 'Mañana',     value: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
  { label: 'Esta semana',value: 'week' },
];

const ACCESS_FILTERS = [
  { key: 'wheelchair', label: 'Silla de ruedas', icon: 'accessibility-outline' as const },
  { key: 'visual',     label: 'Apoyo visual',    icon: 'eye-outline' as const },
  { key: 'hearing',    label: 'Apoyo auditivo',  icon: 'ear-outline' as const },
];

export default function DashboardScreen() {
  const { fullName, carrera } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab]       = useState<'tutorias' | 'salones'>('tutorias');
  const [search, setSearch]             = useState('');
  const [dateFilter, setDateFilter]     = useState('');
  const [accessFilter, setAccessFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters]   = useState(false);

  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions } =
    useQuery<TutoringSession[]>({ queryKey: ['sessions'], queryFn: () => api.get('/auth/sessions') });

  const { data: rooms = [], isLoading: loadingRooms, refetch: refetchRooms } =
    useQuery<Room[]>({ queryKey: ['rooms'], queryFn: () => api.get('/auth/rooms') });

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
    setAccessFilter(f => f.includes(key) ? f.filter(k => k !== key) : [...f, key]);

  const isWeekDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const weekEnd = new Date(now.getTime() + 7 * 86400000);
    return d >= now && d <= weekEnd;
  };

  const filteredSessions = useMemo(() => sessions.filter(s => {
    const matchSearch = !search ||
      s.subject.toLowerCase().includes(search.toLowerCase()) ||
      s.tutor_name.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter
      ? true
      : dateFilter === 'week'
        ? isWeekDate(s.date ?? '')
        : (s.date ?? '').startsWith(dateFilter);
    const matchAccess = accessFilter.length === 0 ||
      (accessFilter.includes('wheelchair') && s.accessibility_type === 'motriz') ||
      (accessFilter.includes('visual')     && s.accessibility_type === 'visual') ||
      (accessFilter.includes('hearing')    && s.accessibility_type === 'auditiva');
    return matchSearch && matchDate && matchAccess;
  }), [sessions, search, dateFilter, accessFilter]);

  const filteredRooms = useMemo(() => rooms.filter(r => {
    const matchSearch = !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase());
    const matchAccess = accessFilter.length === 0 ||
      (accessFilter.includes('wheelchair') && r.has_wheelchair_access) ||
      (accessFilter.includes('visual')     && r.has_visual_support) ||
      (accessFilter.includes('hearing')    && r.has_hearing_support);
    return matchSearch && matchAccess;
  }), [rooms, search, accessFilter]);

  const activeFilterCount = (dateFilter ? 1 : 0) + accessFilter.length;
  const clearFilters = () => { setDateFilter(''); setAccessFilter([]); };
  const isLoading = activeTab === 'tutorias' ? loadingSessions : loadingRooms;
  const firstName = fullName?.split(' ')[0] ?? 'Usuario';

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium tracking-wide uppercase">Plataforma de Tutorías</Text>
            <Text className="text-white text-xl font-bold mt-0.5">¡Hola, {firstName}! 👋</Text>
            {carrera ? <Text className="text-white/60 text-xs mt-0.5">{carrera}</Text> : null}
          </View>
          <View className="w-11 h-11 rounded-full bg-white/20 items-center justify-center border border-white/30">
            <Text className="text-white font-bold text-lg">{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Search + filter toggle */}
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3.5 py-2.5 border border-white/20">
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              className="flex-1 ml-2 text-white text-sm"
              placeholder={activeTab === 'tutorias' ? 'Buscar tutorías...' : 'Buscar salones...'}
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={search}
              onChangeText={setSearch}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter toggle button */}
          <TouchableOpacity
            onPress={() => setShowFilters(v => !v)}
            className="w-11 h-11 rounded-xl items-center justify-center border border-white/20"
            style={{ backgroundColor: showFilters ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' }}
          >
            <Ionicons name="options-outline" size={18} color="white" />
            {activeFilterCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <View className="flex-row bg-white border-b border-gray-100">
        {(['tutorias', 'salones'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => { setActiveTab(tab); setAccessFilter([]); setDateFilter(''); }}
            className="flex-1 items-center py-3"
            style={{ borderBottomWidth: 2, borderBottomColor: activeTab === tab ? Colors.primary : 'transparent' }}
          >
            <View className="flex-row items-center gap-1.5">
              <Ionicons
                name={tab === 'tutorias' ? 'school-outline' : 'business-outline'}
                size={15}
                color={activeTab === tab ? Colors.primary : Colors.muted}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: activeTab === tab ? Colors.primary : Colors.muted }}
              >
                {tab === 'tutorias' ? 'Tutorías' : 'Salones'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Filter panel ─────────────────────────────────────────── */}
      {showFilters && (
        <View className="bg-white border-b border-gray-100 px-4 pt-3 pb-4">

          {/* Date filter — tutorías only */}
          {activeTab === 'tutorias' && (
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Fecha
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {DATE_QUICK.map(d => {
                  const active = dateFilter === d.value;
                  return (
                    <TouchableOpacity
                      key={d.value}
                      onPress={() => setDateFilter(active ? '' : d.value)}
                      className="flex-row items-center px-3.5 py-2 rounded-xl border"
                      style={{
                        backgroundColor: active ? Colors.primary : '#F8FAFC',
                        borderColor: active ? Colors.primary : '#E2E8F0',
                      }}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={13}
                        color={active ? '#fff' : Colors.muted}
                      />
                      <Text
                        className="ml-1.5 text-xs font-semibold"
                        style={{ color: active ? '#fff' : '#64748B' }}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Accessibility filter */}
          <View>
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Accesibilidad
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCESS_FILTERS.map(f => {
                const active = accessFilter.includes(f.key);
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => toggleAccess(f.key)}
                    className="flex-row items-center px-3.5 py-2 rounded-xl border"
                    style={{
                      backgroundColor: active ? Colors.primary : '#F8FAFC',
                      borderColor: active ? Colors.primary : '#E2E8F0',
                    }}
                  >
                    <Ionicons name={f.icon} size={13} color={active ? '#fff' : Colors.muted} />
                    <Text
                      className="ml-1.5 text-xs font-semibold"
                      style={{ color: active ? '#fff' : '#64748B' }}
                    >
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Clear button */}
          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center mt-3 self-start"
            >
              <Ionicons name="close-circle-outline" size={14} color={Colors.error} />
              <Text className="text-xs font-medium ml-1" style={{ color: Colors.error }}>
                Limpiar {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Results count ────────────────────────────────────────── */}
      {!isLoading && (search || activeFilterCount > 0) && (
        <View className="px-4 py-2 bg-slate-50">
          <Text className="text-xs text-gray-400">
            {activeTab === 'tutorias'
              ? `${filteredSessions.length} tutoría${filteredSessions.length !== 1 ? 's' : ''} encontrada${filteredSessions.length !== 1 ? 's' : ''}`
              : `${filteredRooms.length} salón${filteredRooms.length !== 1 ? 'es' : ''} encontrado${filteredRooms.length !== 1 ? 's' : ''}`}
          </Text>
        </View>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-sm">Cargando...</Text>
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
            <RefreshControl refreshing={loadingSessions} onRefresh={refetchSessions} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="calendar-outline" size={32} color={Colors.muted} />
              </View>
              <Text className="text-gray-500 font-medium">No hay tutorías disponibles</Text>
              {(search || activeFilterCount > 0) && (
                <TouchableOpacity onPress={() => { setSearch(''); clearFilters(); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 mt-1">
                  <Text className="text-gray-500 text-sm">Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
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
            <RefreshControl refreshing={loadingRooms} onRefresh={refetchRooms} colors={[Colors.primary]} />
          }
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="business-outline" size={32} color={Colors.muted} />
              </View>
              <Text className="text-gray-500 font-medium">No hay salones disponibles</Text>
              {(search || activeFilterCount > 0) && (
                <TouchableOpacity onPress={() => { setSearch(''); clearFilters(); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 mt-1">
                  <Text className="text-gray-500 text-sm">Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <ChatWidget />
    </View>
  );
}
