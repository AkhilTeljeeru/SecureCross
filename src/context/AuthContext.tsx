import React, { createContext, useContext, useState, useEffect } from 'react';
import { Operator, Branch } from '../api/types';
import { api } from '../api/client';

interface AuthContextType {
  operator: Operator | null;
  branch: Branch | null;
  loading: boolean;
  login: (username: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (role: 'OPERATOR' | 'MANAGER' | 'AUDITOR') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        const storedOpId = localStorage.getItem('sc_operator_id');
        if (storedOpId) {
          const res = await api.getCurrentOperator();
          setOperator(res.operator);
          setBranch(res.branch);
          localStorage.setItem('sc_operator_id', res.operator.id);
          return;
        }
        const res = await api.login('delhi_teller_1', 'OPERATOR');
        setOperator(res.operator);
        setBranch(res.branch);
        localStorage.setItem('sc_operator_id', res.operator.id);
      } catch (err) {
        try {
          localStorage.removeItem('sc_operator_id');
          const res = await api.login('delhi_teller_1', 'OPERATOR');
          setOperator(res.operator);
          setBranch(res.branch);
          localStorage.setItem('sc_operator_id', res.operator.id);
        } catch (e) {
          console.error('Failed to initialize operator session', e);
        }
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = async (username: string, role?: string) => {
    setLoading(true);
    try {
      const res = await api.login(username, role);
      setOperator(res.operator);
      setBranch(res.branch);
      localStorage.setItem('sc_operator_id', res.operator.id);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      setOperator(null);
      setBranch(null);
      localStorage.removeItem('sc_operator_id');
    }
  };

  const switchRole = async (role: 'OPERATOR' | 'MANAGER' | 'AUDITOR') => {
    const roleUsernames: Record<string, string> = {
      OPERATOR: 'delhi_teller_1',
      MANAGER: 'delhi_manager',
      AUDITOR: 'security_auditor',
    };
    await login(roleUsernames[role] || 'delhi_teller_1', role);
  };

  return (
    <AuthContext.Provider value={{ operator, branch, loading, login, logout, switchRole }}>
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
