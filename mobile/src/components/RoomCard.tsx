import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '@/types';
import { Colors } from '@/theme/colors';

interface Props {
  room: Room;
}

export default function RoomCard({ room }: Props) {
  return (
    <View
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: room.available ? Colors.green : Colors.muted,
      }}
    >
      <View className="p-4">
        {/* Header */}
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1">
            <Text className="font-bold text-gray-800 text-base">{room.name}</Text>
            <Text className="text-gray-500 text-sm">
              {room.building}
              {room.floor ? ` · Piso ${room.floor}` : ''}
            </Text>
          </View>
          <View
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: room.available ? '#F0FFF4' : '#F5F5F5',
            }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: room.available ? Colors.green : Colors.muted }}
            >
              {room.available ? 'Disponible' : 'Ocupado'}
            </Text>
          </View>
        </View>

        {/* Capacity */}
        <View className="flex-row items-center mb-3">
          <Ionicons name="people-outline" size={14} color={Colors.muted} />
          <Text className="text-gray-500 text-sm ml-1">
            Capacidad: {room.capacity} personas
          </Text>
        </View>

        {/* Accessibility badges */}
        {(room.has_wheelchair_access ||
          room.has_visual_support ||
          room.has_hearing_support) && (
          <View>
            <Text className="text-gray-400 text-xs mb-1.5">Accesibilidad:</Text>
            <View className="flex-row flex-wrap gap-2">
              {room.has_wheelchair_access && (
                <AccessBadge
                  icon="accessibility-outline"
                  label="Silla de ruedas"
                  color={Colors.primary}
                  bg="#EFF8FF"
                />
              )}
              {room.has_visual_support && (
                <AccessBadge
                  icon="eye-outline"
                  label="Visual"
                  color={Colors.green}
                  bg="#F0FFF4"
                />
              )}
              {room.has_hearing_support && (
                <AccessBadge
                  icon="ear-outline"
                  label="Auditiva"
                  color={Colors.orange}
                  bg="#FFF8EC"
                />
              )}
            </View>
          </View>
        )}

        {/* Equipment */}
        {room.equipment && room.equipment.length > 0 && (
          <View className="mt-2">
            <Text className="text-gray-400 text-xs mb-1">Equipamiento:</Text>
            <View className="flex-row flex-wrap gap-1">
              {room.equipment.map((eq, i) => (
                <View key={i} className="bg-gray-100 px-2 py-0.5 rounded-full">
                  <Text className="text-gray-600 text-xs">{eq}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function AccessBadge({
  icon,
  label,
  color,
  bg,
}: {
  icon: string;
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View
      className="flex-row items-center px-2.5 py-1 rounded-full"
      style={{ backgroundColor: bg }}
    >
      <Ionicons name={icon as any} size={12} color={color} />
      <Text className="text-xs font-medium ml-1" style={{ color }}>
        {label}
      </Text>
    </View>
  );
}
