import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { AdminUser, TutoringSession, Room } from '@/types';
import { Colors } from '@/theme/colors';

type AdminTab = 'users' | 'sessions' | 'rooms';

interface NewRoom {
  name: string;
  building: string;
  capacity: string;
  floor: string;
  has_wheelchair_access: boolean;
  has_visual_support: boolean;
  has_hearing_support: boolean;
}

const DEFAULT_ROOM: NewRoom = {
  name: '',
  building: '',
  capacity: '30',
  floor: '1',
  has_wheelchair_access: false,
  has_visual_support: false,
  has_hearing_support: false,
};

export default function AdminPanelScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [sessionSearch, setSessionSearch] = useState('');
  const [roomSearch, setRoomSearch] = useState('');
  const [addRoomModal, setAddRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState<NewRoom>(DEFAULT_ROOM);
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Queries
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers, isRefetching: refetchingUsers } =
    useQuery<AdminUser[]>({
      queryKey: ['admin-users'],
      queryFn: () => api.get('/auth/admin/users'),
    });

  const { data: sessions = [], isLoading: loadingSessions, refetch: refetchSessions, isRefetching: refetchingSessions } =
    useQuery<TutoringSession[]>({
      queryKey: ['admin-sessions'],
      queryFn: () => api.get('/auth/admin/sessions'),
    });

  const { data: rooms = [], isLoading: loadingRooms, refetch: refetchRooms, isRefetching: refetchingRooms } =
    useQuery<Room[]>({
      queryKey: ['admin-rooms'],
      queryFn: () => api.get('/auth/admin/rooms'),
    });

  const { data: userDetail, isLoading: loadingDetail } = useQuery<AdminUser>({
    queryKey: ['admin-user-detail', selectedUserId],
    queryFn: () => api.get(`/auth/admin/users/${selectedUserId}/detail`),
    enabled: !!selectedUserId && userDetailModal,
  });

  // Mutations
  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/sessions/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-sessions'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/auth/admin/rooms/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-rooms'] }),
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  const createRoomMutation = useMutation({
    mutationFn: (data: object) => api.post('/auth/admin/rooms', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rooms'] });
      setAddRoomModal(false);
      setNewRoom(DEFAULT_ROOM);
      Alert.alert('Éxito', 'Salón creado correctamente');
    },
    onError: (e: any) => Alert.alert('Error', e.message),
  });

  function confirmDeleteUser(id: string, name: string) {
    Alert.alert('Eliminar usuario', `¿Eliminar a "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteUserMutation.mutate(id) },
    ]);
  }

  function confirmDeleteSession(id: number, subject: string) {
    Alert.alert('Eliminar sesión', `¿Eliminar "${subject}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteSessionMutation.mutate(id) },
    ]);
  }

  function confirmDeleteRoom(id: number, name: string) {
    Alert.alert('Eliminar salón', `¿Eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoomMutation.mutate(id) },
    ]);
  }

  function handleCreateRoom() {
    if (!newRoom.name || !newRoom.building) {
      Alert.alert('Error', 'Nombre y bloque son obligatorios');
      return;
    }
    createRoomMutation.mutate({
      name: newRoom.name,
      building: newRoom.building,
      capacity: parseInt(newRoom.capacity),
      floor: parseInt(newRoom.floor),
      has_wheelchair_access: newRoom.has_wheelchair_access,
      has_visual_support: newRoom.has_visual_support,
      has_hearing_support: newRoom.has_hearing_support,
    });
  }

  const filteredUsers = users.filter(u =>
    !userSearch ||
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.university_id.includes(userSearch),
  );

  const filteredSessions = sessions.filter(s =>
    !sessionSearch ||
    s.subject.toLowerCase().includes(sessionSearch.toLowerCase()) ||
    s.tutor_name.toLowerCase().includes(sessionSearch.toLowerCase()),
  );

  const filteredRooms = rooms.filter(r =>
    !roomSearch ||
    r.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
    r.building.toLowerCase().includes(roomSearch.toLowerCase()),
  );

  const TABS: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'users', label: 'Usuarios', icon: 'people-outline' },
    { key: 'sessions', label: 'Tutorías', icon: 'calendar-outline' },
    { key: 'rooms', label: 'Salones', icon: 'business-outline' },
  ];

  return (
    <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="bg-unab-purple px-5 pt-4 pb-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white/80 text-xs">Panel de Administración</Text>
            <Text className="text-white text-xl font-bold">PITA Admin</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Cerrar sesión', '¿Salir?', [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Salir',
                  style: 'destructive',
                  onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                  },
                },
              ])
            }
            className="bg-white/20 p-2 rounded-xl"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View className="flex-row gap-3 mt-3">
          <StatBox label="Usuarios" value={users.length} />
          <StatBox label="Tutorías" value={sessions.length} />
          <StatBox label="Salones" value={rooms.length} />
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-gray-200 px-2">
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            className={`flex-1 flex-row items-center justify-center py-3 border-b-2 gap-1 ${
              activeTab === tab.key ? 'border-unab-purple' : 'border-transparent'
            }`}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? Colors.purple : Colors.muted}
            />
            <Text
              className={`text-sm font-medium ${
                activeTab === tab.key ? 'text-unab-purple' : 'text-gray-400'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <View className="flex-1">
          <View className="px-4 py-3 bg-white border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search-outline" size={16} color={Colors.muted} />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-sm"
                placeholder="Buscar usuario..."
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>
          </View>
          {loadingUsers ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.purple} />
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <View className="bg-white mx-4 mb-2 rounded-xl shadow-sm p-4 flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-unab-purple/10 items-center justify-center mr-3">
                    <Text className="text-unab-purple font-bold">
                      {item.full_name.charAt(0)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{item.full_name}</Text>
                    <Text className="text-gray-500 text-xs">
                      {item.university_id} · {item.user_type}
                    </Text>
                    {item.disability_type && (
                      <Text className="text-orange-500 text-xs">
                        ♿ {item.disability_type}
                      </Text>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedUserId(item.id);
                        setUserDetailModal(true);
                      }}
                      className="bg-gray-100 p-2 rounded-lg"
                    >
                      <Ionicons name="eye-outline" size={16} color={Colors.muted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteUser(item.id, item.full_name)}
                      className="bg-red-50 p-2 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
              refreshControl={
                <RefreshControl refreshing={refetchingUsers} onRefresh={refetchUsers} colors={[Colors.purple]} />
              }
              ListEmptyComponent={<EmptyState icon="people-outline" text="Sin usuarios" />}
            />
          )}
        </View>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <View className="flex-1">
          <View className="px-4 py-3 bg-white border-b border-gray-100">
            <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search-outline" size={16} color={Colors.muted} />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-sm"
                placeholder="Buscar tutoría..."
                value={sessionSearch}
                onChangeText={setSessionSearch}
              />
            </View>
          </View>
          {loadingSessions ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.purple} />
            </View>
          ) : (
            <FlatList
              data={filteredSessions}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <View className="bg-white mx-4 mb-2 rounded-xl shadow-sm p-4 flex-row items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{item.subject}</Text>
                    <Text className="text-gray-500 text-xs">{item.tutor_name}</Text>
                    <Text className="text-gray-400 text-xs mt-1">
                      {item.date} · {item.time} · {item.enrolled}/{item.capacity}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDeleteSession(item.id, item.subject)}
                    className="bg-red-50 p-2 rounded-lg"
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
              refreshControl={
                <RefreshControl refreshing={refetchingSessions} onRefresh={refetchSessions} colors={[Colors.purple]} />
              }
              ListEmptyComponent={<EmptyState icon="calendar-outline" text="Sin tutorías" />}
            />
          )}
        </View>
      )}

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <View className="flex-1">
          <View className="px-4 py-3 bg-white border-b border-gray-100 flex-row gap-2">
            <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
              <Ionicons name="search-outline" size={16} color={Colors.muted} />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-sm"
                placeholder="Buscar salón..."
                value={roomSearch}
                onChangeText={setRoomSearch}
              />
            </View>
            <TouchableOpacity
              onPress={() => setAddRoomModal(true)}
              className="bg-unab-purple px-3 rounded-xl items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          {loadingRooms ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={Colors.purple} />
            </View>
          ) : (
            <FlatList
              data={filteredRooms}
              keyExtractor={item => String(item.id)}
              renderItem={({ item }) => (
                <View className="bg-white mx-4 mb-2 rounded-xl shadow-sm p-4 flex-row items-start">
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{item.name}</Text>
                    <Text className="text-gray-500 text-xs">
                      {item.building}
                      {item.floor ? ` · Piso ${item.floor}` : ''}
                      {' · Cap: '}
                      {item.capacity}
                    </Text>
                    <View className="flex-row gap-1 mt-1">
                      {item.has_wheelchair_access && (
                        <View className="bg-blue-100 px-2 py-0.5 rounded-full">
                          <Text className="text-blue-600 text-xs">♿</Text>
                        </View>
                      )}
                      {item.has_visual_support && (
                        <View className="bg-green-100 px-2 py-0.5 rounded-full">
                          <Text className="text-green-600 text-xs">👁</Text>
                        </View>
                      )}
                      {item.has_hearing_support && (
                        <View className="bg-orange-100 px-2 py-0.5 rounded-full">
                          <Text className="text-orange-600 text-xs">👂</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: item.available ? '#F0FFF4' : '#FFF5F5',
                      }}
                    >
                      <Text
                        className="text-xs font-medium"
                        style={{ color: item.available ? Colors.green : Colors.error }}
                      >
                        {item.available ? 'Disponible' : 'Ocupado'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => confirmDeleteRoom(item.id, item.name)}
                      className="bg-red-50 p-2 rounded-lg"
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
              refreshControl={
                <RefreshControl refreshing={refetchingRooms} onRefresh={refetchRooms} colors={[Colors.purple]} />
              }
              ListEmptyComponent={<EmptyState icon="business-outline" text="Sin salones" />}
            />
          )}
        </View>
      )}

      {/* Add Room Modal */}
      <Modal
        visible={addRoomModal}
        animationType="slide"
        transparent
        onRequestClose={() => setAddRoomModal(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-800">Nuevo salón</Text>
              <TouchableOpacity onPress={() => setAddRoomModal(false)}>
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <RoomFormInput label="Nombre *" placeholder="Ej: Sala 301"
                value={newRoom.name}
                onChangeText={v => setNewRoom(r => ({ ...r, name: v }))} />
              <RoomFormInput label="Bloque *" placeholder="Ej: Bloque A"
                value={newRoom.building}
                onChangeText={v => setNewRoom(r => ({ ...r, building: v }))} />
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <RoomFormInput label="Capacidad" placeholder="30" keyboardType="numeric"
                    value={newRoom.capacity}
                    onChangeText={v => setNewRoom(r => ({ ...r, capacity: v }))} />
                </View>
                <View className="flex-1">
                  <RoomFormInput label="Piso" placeholder="1" keyboardType="numeric"
                    value={newRoom.floor}
                    onChangeText={v => setNewRoom(r => ({ ...r, floor: v }))} />
                </View>
              </View>

              {[
                { key: 'has_wheelchair_access', label: 'Acceso silla de ruedas' },
                { key: 'has_visual_support', label: 'Soporte visual' },
                { key: 'has_hearing_support', label: 'Soporte auditivo' },
              ].map(item => (
                <View key={item.key} className="flex-row items-center justify-between mb-3 p-3 bg-gray-50 rounded-xl">
                  <Text className="text-gray-700 text-sm">{item.label}</Text>
                  <Switch
                    value={newRoom[item.key as keyof NewRoom] as boolean}
                    onValueChange={v =>
                      setNewRoom(r => ({ ...r, [item.key]: v }))
                    }
                    trackColor={{ false: '#E5E7EB', true: Colors.purple }}
                    thumbColor="#fff"
                  />
                </View>
              ))}

              <TouchableOpacity
                onPress={handleCreateRoom}
                disabled={createRoomMutation.isPending}
                className="bg-unab-purple py-4 rounded-xl items-center mt-2 mb-4"
                style={{ opacity: createRoomMutation.isPending ? 0.7 : 1 }}
              >
                {createRoomMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Crear salón</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* User Detail Modal */}
      <Modal
        visible={userDetailModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setUserDetailModal(false);
          setSelectedUserId(null);
        }}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-2xl" style={{ maxHeight: '75%' }}>
            <View className="flex-row justify-between items-center p-5 border-b border-gray-100">
              <Text className="text-lg font-bold text-gray-800">Detalle de usuario</Text>
              <TouchableOpacity
                onPress={() => {
                  setUserDetailModal(false);
                  setSelectedUserId(null);
                }}
              >
                <Ionicons name="close" size={24} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            {loadingDetail ? (
              <View className="py-12 items-center">
                <ActivityIndicator color={Colors.purple} />
              </View>
            ) : userDetail ? (
              <ScrollView contentContainerStyle={{ padding: 20 }}>
                <View className="flex-row items-center mb-4">
                  <View className="w-14 h-14 rounded-full bg-unab-purple/10 items-center justify-center mr-3">
                    <Text className="text-unab-purple text-2xl font-bold">
                      {userDetail.full_name.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-800 text-base">
                      {userDetail.full_name}
                    </Text>
                    <Text className="text-gray-500 text-sm">{userDetail.email}</Text>
                    <Text className="text-gray-400 text-xs">
                      {userDetail.university_id} · {userDetail.user_type}
                    </Text>
                  </View>
                </View>
                {userDetail.carrera && (
                  <InfoRow label="Carrera" value={userDetail.carrera} />
                )}
                {userDetail.disability_type && (
                  <InfoRow label="Discapacidad" value={userDetail.disability_type} />
                )}
                {userDetail.enrolled_sessions && userDetail.enrolled_sessions.length > 0 && (
                  <View className="mt-3">
                    <Text className="font-semibold text-gray-700 mb-2">
                      Tutorías inscritas ({userDetail.enrolled_sessions.length})
                    </Text>
                    {userDetail.enrolled_sessions.map(s => (
                      <View key={s.id} className="bg-gray-50 rounded-xl p-3 mb-2">
                        <Text className="font-medium text-gray-800">{s.subject}</Text>
                        <Text className="text-gray-500 text-xs">{s.date} · {s.time}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-white/20 rounded-xl p-3">
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-white/80 text-xs">{label}</Text>
    </View>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="items-center py-16">
      <Ionicons name={icon as any} size={48} color={Colors.muted} />
      <Text className="text-gray-400 mt-3">{text}</Text>
    </View>
  );
}

function RoomFormInput({
  label,
  placeholder,
  value,
  onChangeText,
  keyboardType,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View className="mb-4">
      <Text className="text-gray-600 text-sm font-medium mb-1">{label}</Text>
      <TextInput
        className="border border-gray-300 rounded-xl px-4 py-3 text-gray-800 bg-gray-50"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row mb-2">
      <Text className="text-gray-500 text-sm w-28">{label}:</Text>
      <Text className="text-gray-800 text-sm flex-1 capitalize">{value}</Text>
    </View>
  );
}
