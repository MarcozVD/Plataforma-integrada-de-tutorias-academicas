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

const BUILDINGS = ['Todos', 'Bloque A', 'Bloque B', 'Bloque C', 'Biblioteca'];
const ACCESS_FILTERS = [
  { key: 'wheelchair', label: 'Silla de ruedas' },
  { key: 'visual', label: 'Visual' },
  { key: 'hearing', label: 'Auditiva' },
];

export default function RoomsScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [building, setBuilding] = useState('Todos');
  const [accessFilter, setAccessFilter] = useState<string[]>([]);

  const { data: rooms = [], isLoading, refetch, isRefetching } = useQuery<Room[]>({
    queryKey: ['rooms-full'],
    queryFn: () => api.get('/auth/rooms'),
  });

  const toggleAccess = (key: string) =>
    setAccessFilter(f =>
      f.includes(key) ? f.filter(k => k !== key) : [...f, key],
    );

  const filtered = useMemo(() => {
    return rooms.filter(r => {
      const matchSearch =
        !search ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.building.toLowerCase().includes(search.toLowerCase());
      const matchBuilding =
        building === 'Todos' || r.building === building;
      const matchAccess =
        accessFilter.length === 0 ||
        (accessFilter.includes('wheelchair') && r.has_wheelchair_access) ||
        (accessFilter.includes('visual') && r.has_visual_support) ||
        (accessFilter.includes('hearing') && r.has_hearing_support);
      return matchSearch && matchBuilding && matchAccess;
    });
  }, [rooms, search, building, accessFilter]);

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-blue px-5 pt-4 pb-5">
        <Text className="text-white text-xl font-bold mb-3">Salones</Text>
        <View className="flex-row items-center bg-white/20 rounded-xl px-4 py-2">
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.8)" />
          <TextInput
            className="flex-1 ml-2 text-white"
            placeholder="Buscar salón o bloque..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Building filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 max-h-14"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
      >
        {BUILDINGS.map(b => (
          <TouchableOpacity
            key={b}
            onPress={() => setBuilding(b)}
            className={`px-4 py-1.5 rounded-full border ${
              building === b
                ? 'bg-unab-blue border-unab-blue'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                building === b ? 'text-white' : 'text-gray-600'
              }`}
            >
              {b}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Accessibility filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="bg-white border-b border-gray-100 max-h-12"
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {ACCESS_FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            onPress={() => toggleAccess(f.key)}
            className={`px-3 py-1 rounded-full border ${
              accessFilter.includes(f.key)
                ? 'bg-unab-green border-unab-green'
                : 'bg-white border-gray-300'
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                accessFilter.includes(f.key) ? 'text-white' : 'text-gray-600'
              }`}
            >
              ♿ {f.label}
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
          renderItem={({ item }) => <RoomCard room={item} />}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 30 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[Colors.primary]}
            />
          }
          ListHeaderComponent={
            <Text className="text-gray-500 text-xs mb-2">
              {filtered.length} salón{filtered.length !== 1 ? 'es' : ''} encontrado
              {filtered.length !== 1 ? 's' : ''}
            </Text>
          }
          ListEmptyComponent={
            <View className="items-center py-16">
              <Ionicons name="business-outline" size={52} color={Colors.muted} />
              <Text className="text-gray-400 mt-3 text-center">
                No hay salones que coincidan
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearch('');
                  setBuilding('Todos');
                  setAccessFilter([]);
                }}
                className="mt-3 px-4 py-2 bg-unab-blue rounded-xl"
              >
                <Text className="text-white text-sm">Limpiar filtros</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}
