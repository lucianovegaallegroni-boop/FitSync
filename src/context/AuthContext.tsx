import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ error: any }>;
  signup: (email: string, pass: string, fullName: string, role: UserRole) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_TRAINER_PROFILE: Profile = {
  id: 'trainer-1',
  email: 'entrenador@fitsync.com',
  full_name: 'Coach Rodrigo Paz',
  role: 'trainer',
  created_at: new Date().toISOString(),
};

const DEMO_CLIENT_PROFILE: Profile = {
  id: 'client-1',
  email: 'carlos.m@example.com',
  full_name: 'Carlos Mendoza',
  role: 'client',
  trainer_id: 'trainer-1',
  phone: '+34 612 345 678',
  goals: 'Pérdida de grasa (-5kg) y aumento de masa magra',
  medical_history: 'Molestia leve en rodilla izquierda',
  created_at: new Date().toISOString(),
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    // Verificar sesión existente en Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoMode(false);
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setProfile(null);
        setIsDemoMode(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoMode(false);
        await fetchProfile(session.user.id, session.user.email || '');
      } else if (!isDemoMode) {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !data) {
        // Perfil por defecto
        setProfile({
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'trainer',
          created_at: new Date().toISOString(),
        });
      } else {
        setProfile(data);
      }
    } catch {
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'trainer',
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    setLoading(false);
    if (!error) setIsDemoMode(false);
    return { error };
  };

  const signup = async (email: string, pass: string, fullName: string, role: UserRole) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (!error && data.user) {
      setIsDemoMode(false);
      // Insertar en tabla profiles si no se disparó el trigger
      try {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          email,
          full_name: fullName,
          role,
        }]);
      } catch {
        // Ignorar si el trigger ya lo insertó
      }
    }

    setLoading(false);
    return { error };
  };

  const logout = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
  };

  const switchDemoRole = (role: UserRole) => {
    setIsDemoMode(true);
    if (role === 'trainer') {
      setUser({ id: 'trainer-1', email: 'entrenador@fitsync.com' });
      setProfile(DEMO_TRAINER_PROFILE);
    } else {
      setUser({ id: 'client-1', email: 'carlos.m@example.com' });
      setProfile(DEMO_CLIENT_PROFILE);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        switchDemoRole,
        isDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
