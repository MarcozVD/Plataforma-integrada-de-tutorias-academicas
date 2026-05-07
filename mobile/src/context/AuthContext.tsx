import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  userType: string | null;
  fullName: string | null;
  studentId: string | null;
  carrera: string | null;
  isLoading: boolean;
}

interface LoginData {
  token: string;
  userType: string;
  fullName: string;
  studentId: string;
  carrera?: string;
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    userType: null,
    fullName: null,
    studentId: null,
    carrera: null,
    isLoading: true,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const results = await AsyncStorage.multiGet([
        'token',
        'userType',
        'fullName',
        'studentId',
        'carrera',
      ]);
      const [token, userType, fullName, studentId, carrera] = results.map(
        ([, v]) => v,
      );
      setState({ token, userType, fullName, studentId, carrera, isLoading: false });
    } catch {
      setState(s => ({ ...s, isLoading: false }));
    }
  }

  async function login(data: LoginData) {
    await AsyncStorage.multiSet([
      ['token', data.token],
      ['userType', data.userType],
      ['fullName', data.fullName],
      ['studentId', data.studentId],
      ['carrera', data.carrera ?? ''],
    ]);
    setState({
      token: data.token,
      userType: data.userType,
      fullName: data.fullName,
      studentId: data.studentId,
      carrera: data.carrera ?? null,
      isLoading: false,
    });
  }

  async function logout() {
    await AsyncStorage.multiRemove([
      'token',
      'userType',
      'fullName',
      'studentId',
      'carrera',
    ]);
    setState({
      token: null,
      userType: null,
      fullName: null,
      studentId: null,
      carrera: null,
      isLoading: false,
    });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
