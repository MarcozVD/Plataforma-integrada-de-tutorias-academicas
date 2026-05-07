import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TutoringSession } from '@/types';
import { Colors } from '@/theme/colors';

interface Props {
  session: TutoringSession;
  onEnroll?: () => void;
  onUnenroll?: () => void;
  loading?: boolean;
}

const ACCESSIBILITY_ICONS: Record<string, string> = {
  visual: 'eye-outline',
  auditiva: 'ear-outline',
  motriz: 'accessibility-outline',
};

export default function TutoringCard({ session, onEnroll, onUnenroll, loading }: Props) {
  const isFull = session.enrolled >= session.capacity;
  const fillPercent = Math.min((session.enrolled / session.capacity) * 100, 100);

  return (
    <View
      className="bg-white rounded-2xl shadow-sm overflow-hidden"
      style={{ borderLeftWidth: 4, borderLeftColor: Colors.primary }}
    >
      <View className="p-4">
        {/* Subject + badges */}
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-bold text-gray-800 text-base flex-1 mr-2">
            {session.subject}
          </Text>
          <View className="flex-row gap-1">
            {session.is_virtual && (
              <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                <Text className="text-purple-600 text-xs font-medium">Virtual</Text>
              </View>
            )}
            {session.accessibility_type && session.accessibility_type !== 'ninguna' && (
              <View className="bg-green-100 px-2 py-0.5 rounded-full flex-row items-center">
                <Ionicons
                  name={ACCESSIBILITY_ICONS[session.accessibility_type] as any ?? 'accessibility-outline'}
                  size={12}
                  color={Colors.green}
                />
              </View>
            )}
          </View>
        </View>

        {/* Tutor */}
        <View className="flex-row items-center mb-3">
          <View className="w-7 h-7 rounded-full bg-unab-blue/10 items-center justify-center mr-2">
            <Text className="text-unab-blue text-xs font-bold">
              {session.tutor_name.charAt(0)}
            </Text>
          </View>
          <Text className="text-gray-600 text-sm">{session.tutor_name}</Text>
        </View>

        {/* Info row */}
        <View className="flex-row flex-wrap gap-x-4 gap-y-1 mb-3">
          <InfoChip icon="calendar-outline" text={session.date} />
          <InfoChip icon="time-outline" text={session.time} />
          <InfoChip icon="hourglass-outline" text={`${session.duration} min`} />
          <InfoChip
            icon={session.is_virtual ? 'videocam-outline' : 'location-outline'}
            text={session.is_virtual ? 'Virtual' : (session.room ?? session.location ?? '—')}
          />
        </View>

        {/* Capacity bar */}
        <View className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-400 text-xs">Cupos</Text>
            <Text
              className="text-xs font-medium"
              style={{ color: isFull ? Colors.error : Colors.textSecondary }}
            >
              {session.enrolled} / {session.capacity}
            </Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${fillPercent}%`,
                backgroundColor: isFull ? Colors.error : Colors.primary,
              }}
            />
          </View>
        </View>

        {/* Action button */}
        {(onEnroll || onUnenroll) && (
          session.is_enrolled ? (
            <TouchableOpacity
              onPress={onUnenroll}
              disabled={loading}
              className="border border-red-300 rounded-xl py-2.5 items-center"
            >
              {loading ? (
                <ActivityIndicator size="small" color={Colors.error} />
              ) : (
                <Text className="text-red-500 text-sm font-medium">
                  Cancelar inscripción
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={onEnroll}
              disabled={loading || isFull}
              className="bg-unab-blue rounded-xl py-2.5 items-center"
              style={{ opacity: isFull ? 0.5 : 1 }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white text-sm font-semibold">
                  {isFull ? 'Sin cupos' : 'Inscribirse'}
                </Text>
              )}
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon as any} size={13} color={Colors.muted} />
      <Text className="text-gray-500 text-xs ml-1">{text}</Text>
    </View>
  );
}
