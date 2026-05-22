import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '@/types';
import { Colors } from '@/theme/colors';

interface Props {
  room: Room;
}

export default function RoomCard({ room }: Props) {
  const hasAccess = room.has_wheelchair_access || room.has_visual_support || room.has_hearing_support;

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: room.available ? Colors.green : Colors.muted,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-3">
            <Text className="font-bold text-gray-800 text-base">{room.name}</Text>
            <View className="flex-row items-center mt-0.5">
              <Ionicons name="location-outline" size={12} color={Colors.muted} />
              <Text className="text-gray-500 text-sm ml-1">
                {room.building}{room.floor ? ` · Piso ${room.floor}` : ''}
              </Text>
            </View>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: room.available ? '#ECFDF5' : '#F1F5F9' }}
          >
            <Text
              className="text-xs font-bold"
              style={{ color: room.available ? Colors.green : Colors.muted }}
            >
              {room.available ? '● Disponible' : '○ Ocupado'}
            </Text>
          </View>
        </View>

        {/* Capacity + equipment row */}
        <View
          className="flex-row items-center gap-4 rounded-xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: '#F8FAFC' }}
        >
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={14} color={Colors.muted} />
            <Text className="text-gray-600 text-sm ml-1.5">
              {room.capacity} personas
            </Text>
          </View>
          {room.equipment && room.equipment.length > 0 && (
            <View className="flex-row items-center">
              <Ionicons name="hardware-chip-outline" size={13} color={Colors.muted} />
              <Text className="text-gray-500 text-xs ml-1">
                {room.equipment.slice(0, 2).join(', ')}
                {room.equipment.length > 2 ? ` +${room.equipment.length - 2}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Accessibility badges */}
        {hasAccess && (
          <View className="flex-row flex-wrap gap-2">
            {room.has_wheelchair_access && (
              <AccessBadge icon="accessibility-outline" label="Silla de ruedas" color={Colors.primary} bg="#EFF8FF" />
            )}
            {room.has_visual_support && (
              <AccessBadge icon="eye-outline" label="Visual" color={Colors.green} bg="#ECFDF5" />
            )}
            {room.has_hearing_support && (
              <AccessBadge icon="ear-outline" label="Auditiva" color={Colors.orange} bg="#FFF7ED" />
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function AccessBadge({ icon, label, color, bg }: { icon: string; label: string; color: string; bg: string }) {
  return (
    <View className="flex-row items-center px-2.5 py-1 rounded-full" style={{ backgroundColor: bg }}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text className="text-xs font-semibold ml-1" style={{ color }}>{label}</Text>
    </View>
  );
}
