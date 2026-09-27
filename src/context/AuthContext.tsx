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
        dataService.setDemoMode(false);
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setProfile(null);
        setIsDemoMode(false);
        dataService.setDemoMode(false);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsDemoMode(false);
        dataService.setDemoMode(false);
        await fetchProfile(session.user.id, session.user.email || '');
      } else if (!isDemoMode) {
        setUser(null);
        setProfile(null);
        dataService.setDemoMode(false);
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
    const emailNorm = email.trim().toLowerCase();

    // 1. Verificar si el usuario existe y su estado de activación
    const status = await dataService.checkUserStatus(emailNorm);

    // Caso A: El usuario no existe en la base de datos ni en el sistema
    if (!status.exists) {
      return {
        error: new Error(`No existe ningún usuario registrado con el correo "${email.trim()}". Por favor verifica que esté bien escrito o regístrate en la plataforma.`)
      };
    }

    // Caso B: El usuario existe pero su cuenta aún no está activada o fue suspendida
    if (status.isActive === false) {
      if (status.isPending) {
        return {
          error: new Error('Tu cuenta aún no ha sido activada por un administrador. Debes esperar a que sea aprobada antes de poder ingresar.')
        };
      } else {
        const reasonDetail = status.reason ? ` Motivo: "${status.reason}".` : '';
        return {
          error: new Error(`Tu cuenta ha sido desactivada por un administrador.${reasonDetail}`)
        };
      }
    }

    // 2. Si las credenciales fueron generadas para el cliente o coinciden en el almacén seguro
    if (dataService.verifyCredentials(emailNorm, pass)) {
      const allUsers = await dataService.getAllUsers();
      const matchedProfile = allUsers.find(u => u.email.toLowerCase() === emailNorm);
      if (matchedProfile) {
        if (matchedProfile.is_active === false) {
          const isPending = matchedProfile.deactivation_reason?.toLowerCase().includes('pendiente');
          return {
            error: new Error(
              isPending
                ? 'Tu cuenta aún no ha sido activada por un administrador. Debes esperar a que sea aprobada antes de poder ingresar.'
                : `Tu cuenta ha sido desactivada por un administrador.${matchedProfile.deactivation_reason ? ` Motivo: "${matchedProfile.deactivation_reason}".` : ''}`
            )
          };
        }
        setIsDemoMode(true);
        dataService.setDemoMode(true);
        setUser({ id: matchedProfile.id, email: matchedProfile.email });
        setProfile(matchedProfile);
        await dataService.recordLogin(matchedProfile.id, matchedProfile.email, matchedProfile.role);
        return { error: null };
      }
    }

    // 3. Cuenta de prueba admin
    if (emailNorm === 'admin@fitsync.com') {
      if (pass !== 'admin123') {
        return {
          error: new Error('La contraseña ingresada es incorrecta. Por favor verifica tu clave e inténtalo nuevamente.')
        };
      }
      setIsDemoMode(true);
      dataService.setDemoMode(true);
      setUser({ id: 'admin-1', email: 'admin@fitsync.com' });
      setProfile(DEMO_ADMIN_PROFILE);
      await dataService.recordLogin('admin-1', 'admin@fitsync.com', 'admin');
      return { error: null };
    }

    // 4. Supabase Auth estándar
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password: pass,
    });

    if (error) {
      const msg = error.message?.toLowerCase() || '';
      const code = (error as any).code || '';

      if (code === 'email_not_confirmed' || msg.includes('email not confirmed') || msg.includes('not confirmed')) {
        return {
          error: new Error('Debes confirmar tu correo electrónico antes de ingresar. Por favor revisa tu bandeja de entrada o spam para activar tu cuenta.')
        };
      }

      const isCredsError = msg.includes('invalid login credentials') ||
                           msg.includes('invalid credentials') ||
                           code === 'invalid_credentials';
      
      // Al haber confirmado previamente que el usuario SÍ existe y SÍ está activo, la falla es por contraseña errónea
      if (isCredsError) {
        return {
          error: new Error('La contraseña ingresada es incorrecta. Por favor verifica tu clave e inténtalo nuevamente.')
        };
      }
      return {
        error: new Error(error.message || 'Error al iniciar sesión.')
      };
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
        const isPending = userProfile.deactivation_reason && userProfile.deactivation_reason.toLowerCase().includes('pendiente');
        const reasonMsg = isPending
          ? 'Tu cuenta aún no ha sido activada por un administrador. Debes esperar a que sea aprobada antes de poder ingresar.'
          : `Tu cuenta ha sido desactivada por un administrador.${userProfile.deactivation_reason ? ` Motivo: "${userProfile.deactivation_reason}".` : ''}`;
        return {
          error: new Error(reasonMsg)
        };
      }

      setIsDemoMode(false);
      dataService.setDemoMode(false);
      setUser(authData.user);
      if (userProfile) {
        setProfile(userProfile);
        await dataService.recordLogin(userProfile.id, userProfile.email, userProfile.role);
      }
    }

    return { error: null };
  };

  const signup = async (email: string, pass: string, fullName: string, role: UserRole) => {
    const emailNorm = email.trim().toLowerCase();

    const isClientRole = role === 'client';

    const { data, error } = await supabase.auth.signUp({
      email: emailNorm,
      password: pass,
      options: {
        data: {
          full_name: fullName,
          role,
          is_active: isClientRole,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Las cuentas de cliente se crean activas de manera predeterminada; otros roles quedan pendientes de admin
    const newProfile: Profile = {
      id: data?.user?.id || `user-${Date.now()}`,
      email: emailNorm,
      full_name: fullName.trim(),
      role,
      is_active: isClientRole ? true : false,
      deactivation_reason: isClientRole ? null : 'Cuenta pendiente de activación por un administrador',
      created_at: new Date().toISOString(),
      last_login_at: isClientRole ? new Date().toISOString() : null,
    };

    try {
      await supabase.from('profiles').upsert([newProfile], { onConflict: 'id' });
    } catch {
      // Ignorar si el trigger ya lo insertó
    }

    if (!isClientRole) {
      // Registrar en almacén de datos como pendiente
      dataService.registerPendingUser(newProfile, pass);

      // Cerrar sesión inmediata para impedir ingreso sin aprobación del admin
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setIsDemoMode(false);
      dataService.setDemoMode(false);
      setLoading(false);
    } else {
      // Cliente queda activo e inicia sesión de inmediato
      setUser(data?.user || { id: newProfile.id, email: newProfile.email });
      setProfile(newProfile);
      setIsDemoMode(false);
      dataService.setDemoMode(false);
      setLoading(false);
      await dataService.recordLogin(newProfile.id, newProfile.email, 'client');
    }

    return {
      error: null,
    };
  };

  const logout = async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
    dataService.setDemoMode(false);
  };

  const switchDemoRole = (role: UserRole) => {
    setIsDemoMode(true);
    dataService.setDemoMode(true);
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
