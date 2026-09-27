import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';
import { dataService } from '../services/dataService';

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

const DEMO_ADMIN_PROFILE: Profile = {
  id: 'admin-1',
  email: 'admin@fitsync.com',
  full_name: 'Super Administrador FitSync',
  role: 'admin',
  is_active: true,
  created_at: new Date(Date.now() - 150 * 86400000).toISOString(),
  last_login_at: new Date().toISOString(),
};

const DEMO_TRAINER_PROFILE: Profile = {
  id: 'trainer-1',
  email: 'entrenador@fitsync.com',
  full_name: 'Coach Rodrigo Paz',
  role: 'trainer',
  is_active: true,
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString(),
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
  is_active: true,
  created_at: new Date().toISOString(),
  last_login_at: new Date().toISOString(),
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
        const defaultProfile: Profile = {
          id: userId,
          email,
          full_name: email.split('@')[0],
          role: 'trainer',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        };
        setProfile(defaultProfile);
        dataService.recordLogin(userId, email, 'trainer');
      } else {
        if (data.is_active === false) {
          await supabase.auth.signOut();
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }
        setProfile(data);
        dataService.recordLogin(data.id, data.email, data.role);
      }
    } catch {
      setProfile({
        id: userId,
        email,
        full_name: email.split('@')[0],
        role: 'trainer',
        is_active: true,
        created_at: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setLoading(true);

    // 1. Verificar si la cuenta está desactivada
    const status = await dataService.checkUserStatus(email);
    if (status && status.allowed === false) {
      setLoading(false);
      const reasonMsg = status.reason ? ` Motivo: "${status.reason}".` : '';
      return {
        error: new Error(`Tu cuenta ha sido desactivada por un administrador.${reasonMsg} Por favor ponte en contacto con soporte.`)
      };
    }

    // 2. Si es cuenta demo de admin
    if (email.toLowerCase() === 'admin@fitsync.com') {
      setIsDemoMode(true);
      setUser({ id: 'admin-1', email: 'admin@fitsync.com' });
      setProfile(DEMO_ADMIN_PROFILE);
      await dataService.recordLogin('admin-1', 'admin@fitsync.com', 'admin');
      setLoading(false);
      return { error: null };
    }

    // 3. Supabase Auth
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      setLoading(false);
      return { error };
    }

    if (authData?.user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (userProfile && userProfile.is_active === false) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setLoading(false);
        const reasonMsg = userProfile.deactivation_reason ? ` Motivo: "${userProfile.deactivation_reason}".` : '';
        return {
          error: new Error(`Tu cuenta ha sido desactivada por un administrador.${reasonMsg}`)
        };
      }

      setIsDemoMode(false);
      if (userProfile) {
        setProfile(userProfile);
        await dataService.recordLogin(userProfile.id, userProfile.email, userProfile.role);
      }
    }

    setLoading(false);
    return { error: null };
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
      try {
        await supabase.from('profiles').insert([{
          id: data.user.id,
          email,
          full_name: fullName,
          role,
          is_active: true,
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
    if (role === 'admin') {
      setUser({ id: 'admin-1', email: 'admin@fitsync.com' });
      setProfile(DEMO_ADMIN_PROFILE);
      dataService.recordLogin('admin-1', 'admin@fitsync.com', 'admin');
    } else if (role === 'trainer') {
      setUser({ id: 'trainer-1', email: 'entrenador@fitsync.com' });
      setProfile(DEMO_TRAINER_PROFILE);
      dataService.recordLogin('trainer-1', 'entrenador@fitsync.com', 'trainer');
    } else {
      setUser({ id: 'client-1', email: 'carlos.m@example.com' });
      setProfile(DEMO_CLIENT_PROFILE);
      dataService.recordLogin('client-1', 'carlos.m@example.com', 'client');
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
