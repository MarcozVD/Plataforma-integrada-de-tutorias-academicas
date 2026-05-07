import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  const { token, userType, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#00AEEF" />
      </View>
    );
  }

  if (!token) return <Redirect href="/(auth)/login" />;
  if (userType === 'tutor') return <Redirect href="/(tutor)/" />;
  if (userType === 'admin') return <Redirect href="/(admin)/" />;
  return <Redirect href="/(student)/" />;
}
