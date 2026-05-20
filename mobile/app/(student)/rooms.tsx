import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '@/lib/api';
import RoomCard from '@/components/RoomCard';
import { Room } from '@/types';
import { Colors } from '@/theme/colors';

const ACCESS_FILTERS = [
  { key: 'wheelchair', label: 'Silla de ruedas', icon: 'accessibility-outline' as const },
  { key: 'visual',     label: 'Apoyo visual',    icon: 'eye-outline' as const },
  { key: 'hearing',    label: 'Apoyo auditivo',  icon: 'ear-outline' as const },
];

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch]             = useState('');
  const [building, setBuilding]         = useState('');
  const [accessFilter, setAccessFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters]   = useState(false);

  const { data: rooms = [], isLoading, refetch, isRefetching } = useQuery<Room[]>({
    queryKey: ['rooms-full'],
    queryFn: () => api.get('/auth/rooms'),
  });

  const buildings = useMemo(() => {
    const unique = [...new Set(rooms.map(r => r.building))].sort();
    return unique;
  }, [rooms]);

  const toggleAccess = (key: string) =>
    setAccessFilter(f => f.includes(key) ? f.filter(k => k !== key) : [...f, key]);

  const filtered = useMemo(() => rooms.filter(r => {
    const matchSearch =
      !search ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.building.toLowerCase().includes(search.toLowerCase());
    const matchBuilding = !building || r.building === building;
    const matchAccess =
      accessFilter.length === 0 ||
      (accessFilter.includes('wheelchair') && r.has_wheelchair_access) ||
      (accessFilter.includes('visual')     && r.has_visual_support)    ||
      (accessFilter.includes('hearing')    && r.has_hearing_support);
    return matchSearch && matchBuilding && matchAccess;
  }), [rooms, search, building, accessFilter]);

  const activeFilterCount = (building ? 1 : 0) + accessFilter.length;
  const clearFilters = () => { setBuilding(''); setAccessFilter([]); };

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View className="px-5 pt-4 pb-5" style={{ backgroundColor: Colors.primary }}>
        <View className="flex-row justify-between items-center mb-4">
          <View>
            <Text className="text-white/70 text-xs font-medium tracking-wide uppercase">Plataforma de Tutorías</Text>
            <Text className="text-white text-xl font-bold mt-0.5">Salones</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center border border-white/30">
            <Ionicons name="business-outline" size={18} color="white" />
          </View>
        </View>

        {/* Search + filter toggle */}
        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center bg-white/15 rounded-xl px-3.5 py-2.5 border border-white/20">
            <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.7)" />
            <TextInput
              className="flex-1 ml-2 text-white text-sm"
              placeholder="Buscar salón o bloque..."
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

      {/* ── Filter panel ─────────────────────────────────────────── */}
      {showFilters && (
        <View className="bg-white border-b border-gray-100 px-4 pt-3 pb-4">

          {/* Building filter */}
          {buildings.length > 0 && (
            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Bloque / Edificio
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {buildings.map(b => {
                  const active = building === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      onPress={() => setBuilding(active ? '' : b)}
                      className="flex-row items-center px-3.5 py-2 rounded-xl border"
                      style={{
                        backgroundColor: active ? Colors.primary : '#F8FAFC',
                        borderColor: active ? Colors.primary : '#E2E8F0',
                      }}
                    >
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={active ? '#fff' : Colors.muted}
                      />
                      <Text
                        className="ml-1.5 text-xs font-semibold"
                        style={{ color: active ? '#fff' : '#64748B' }}
                      >
                        {b}
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
            {filtered.length} salón{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* ── Content ──────────────────────────────────────────────── */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text className="text-gray-400 text-sm">Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={({ item }) => <RoomCard room={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="items-center py-16 gap-3">
              <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center">
                <Ionicons name="business-outline" size={32} color={Colors.muted} />
              </View>
              <Text className="text-gray-500 font-medium">No hay salones disponibles</Text>
              {(search || activeFilterCount > 0) && (
                <TouchableOpacity
                  onPress={() => { setSearch(''); clearFilters(); }}
                  className="px-4 py-2 rounded-xl border border-gray-200 mt-1"
                >
                  <Text className="text-gray-500 text-sm">Limpiar búsqueda</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
