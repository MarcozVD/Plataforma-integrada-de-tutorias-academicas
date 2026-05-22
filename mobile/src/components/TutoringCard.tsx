import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TutoringSession } from '@/types';
import { Colors } from '@/theme/colors';

interface Props {
  session: TutoringSession;
  onEnroll?: () => void;
  onUnenroll?: () => void;
  onWaitlist?: () => void;
  onUnwaitlist?: () => void;
  isWaitlisted?: boolean;
  loading?: boolean;
}

const ACCESSIBILITY_ICONS: Record<string, string> = {
  visual: 'eye-outline',
  auditiva: 'ear-outline',
  motriz: 'accessibility-outline',
};

export default function TutoringCard({
  session, onEnroll, onUnenroll, onWaitlist, onUnwaitlist, isWaitlisted, loading,
}: Props) {
  const isFull = session.enrolled >= session.capacity;
  const fillPercent = Math.min((session.enrolled / session.capacity) * 100, 100);
  const spotsLeft = session.capacity - session.enrolled;

  const borderColor = session.is_enrolled
    ? Colors.green
    : isWaitlisted
      ? Colors.orange
      : isFull
        ? Colors.muted
        : Colors.primary;

  const capacityColor =
    fillPercent >= 90 ? Colors.error : fillPercent >= 60 ? Colors.warning : Colors.green;

  return (
    <View
      className="bg-white rounded-2xl overflow-hidden"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: borderColor,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      <View className="p-4">
        {/* Subject + status badges */}
        <View className="flex-row justify-between items-start mb-2">
          <Text className="font-bold text-gray-800 text-base flex-1 mr-2" numberOfLines={2}>
            {session.subject}
          </Text>
          <View className="flex-row gap-1 flex-shrink-0 flex-wrap justify-end">
            {session.is_enrolled && (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5' }}>
                <Text className="text-xs font-bold" style={{ color: Colors.green }}>✓ Inscrito</Text>
              </View>
            )}
            {isWaitlisted && !session.is_enrolled && (
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FFF7ED' }}>
                <Text className="text-xs font-bold" style={{ color: Colors.orange }}>En espera</Text>
              </View>
            )}
            {session.is_virtual && (
              <View className="bg-purple-100 px-2 py-0.5 rounded-full">
                <Text className="text-purple-600 text-xs font-medium">Virtual</Text>
              </View>
            )}
            {session.accessibility_type && session.accessibility_type !== 'ninguna' && (
              <View className="px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#ECFDF5' }}>
                <Ionicons
                  name={(ACCESSIBILITY_ICONS[session.accessibility_type] ?? 'accessibility-outline') as any}
                  size={11}
                  color={Colors.green}
                />
              </View>
            )}
          </View>
        </View>

        {/* Tutor */}
        <View className="flex-row items-center mb-3">
          <View
            className="w-7 h-7 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: Colors.primary + '18' }}
          >
            <Text className="text-xs font-bold" style={{ color: Colors.primary }}>
              {session.tutor_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-gray-600 text-sm flex-1">{session.tutor_name}</Text>
        </View>

        {/* Info chips — gray card background */}
        <View
          className="flex-row flex-wrap gap-x-4 gap-y-1.5 rounded-xl px-3 py-2.5 mb-3"
          style={{ backgroundColor: '#F8FAFC' }}
        >
          <InfoChip icon="calendar-outline" text={session.date} />
          <InfoChip icon="time-outline" text={session.time} />
          <InfoChip icon="hourglass-outline" text={`${session.duration} min`} />
          <InfoChip
            icon={session.is_virtual ? 'videocam-outline' : 'location-outline'}
            text={session.is_virtual ? 'Virtual' : (session.room ?? session.location ?? '—')}
          />
        </View>

        {/* Capacity bar */}
        <View className="mb-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-gray-400 text-xs">Cupos</Text>
            <Text className="text-xs font-semibold" style={{ color: capacityColor }}>
              {spotsLeft > 0 ? `${spotsLeft} disponible${spotsLeft !== 1 ? 's' : ''}` : 'Sin cupos'}
              {' '}· {session.enrolled}/{session.capacity}
            </Text>
          </View>
          <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${fillPercent}%`, backgroundColor: capacityColor }}
            />
          </View>
        </View>

        {/* Action button */}
        {session.is_enrolled ? (
          <TouchableOpacity
            onPress={onUnenroll}
            disabled={loading}
            className="rounded-xl py-2.5 items-center border"
            style={{ borderColor: '#FCA5A5', backgroundColor: '#FFF5F5' }}
          >
            {loading
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text className="text-sm font-semibold" style={{ color: Colors.error }}>Cancelar inscripción</Text>}
          </TouchableOpacity>
        ) : isWaitlisted ? (
          <TouchableOpacity
            onPress={onUnwaitlist}
            disabled={loading}
            className="rounded-xl py-2.5 items-center flex-row justify-center gap-1.5 border"
            style={{ borderColor: '#FCD34D', backgroundColor: '#FFFBEB' }}
          >
            {loading
              ? <ActivityIndicator size="small" color={Colors.orange} />
              : <>
                  <Ionicons name="time-outline" size={14} color={Colors.orange} />
                  <Text className="text-sm font-semibold" style={{ color: Colors.orange }}>En lista · Salir</Text>
                </>}
          </TouchableOpacity>
        ) : isFull ? (
          onWaitlist ? (
            <TouchableOpacity
              onPress={onWaitlist}
              disabled={loading}
              className="rounded-xl py-2.5 items-center flex-row justify-center gap-1.5"
              style={{ backgroundColor: Colors.orange }}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <>
                    <Ionicons name="time-outline" size={14} color="#fff" />
                    <Text className="text-white text-sm font-semibold">Lista de espera</Text>
                  </>}
            </TouchableOpacity>
          ) : (
            <View className="rounded-xl py-2.5 items-center bg-gray-100">
              <Text className="text-gray-400 text-sm font-medium">Sin cupos disponibles</Text>
            </View>
          )
        ) : onEnroll ? (
          <TouchableOpacity
            onPress={onEnroll}
            disabled={loading}
            className="rounded-xl py-2.5 items-center"
            style={{ backgroundColor: Colors.primary }}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text className="text-white text-sm font-semibold">Inscribirse</Text>}
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function InfoChip({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center">
      <Ionicons name={icon as any} size={12} color={Colors.muted} />
      <Text className="text-gray-500 text-xs ml-1">{text}</Text>
    </View>
  );
}
