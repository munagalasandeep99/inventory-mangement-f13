
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, IAuthenticationCallback } from 'amazon-cognito-identity-js';
import { userPool } from '../cognito-config';

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  confirmSignUp: (email: string, code: string) => Promise<any>;
  forgotPassword: (email: string) => Promise<any>;
  confirmPassword: (email: string, code: string, newPass: string) => Promise<any>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setupSession = (cognitoUser: CognitoUser): Promise<void> => {
    return new Promise((resolve, reject) => {
        cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
                reject(err);
                return;
            }
            const userData = attributes?.reduce((acc, attr) => {
                acc[attr.getName()] = attr.getValue();
                return acc;
            }, {} as { [key: string]: string }) || {};

            const email = userData.email;
            const userProfile: User = {
                name: userData.name || email.split('@')[0],
                email: email,
                avatar: `https://api.dicebear.com/8.x/initials/svg?seed=${email}`,
            };

            setUser(userProfile);
            setIsAuthenticated(true);
            resolve();
        });
    });
  }

  useEffect(() => {
    let isMounted = true;
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
        cognitoUser.getSession(async (err: Error | null, session: any) => {
            if (!isMounted) return;
            if (err) {
                console.error("Get session error:", err);
                setIsLoading(false);
                return;
            }
            if (session.isValid()) {
                try {
                    await setupSession(cognitoUser);
                } catch (setupErr) {
                    console.error("Setup session error:", setupErr);
                }
            }
            setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
    return () => { isMounted = false; };
  }, []);

  const signup = (email: string, pass: string) => {
    return new Promise((resolve, reject) => {
      const attributeList = [new CognitoUserAttribute({ Name: 'email', Value: email }), new CognitoUserAttribute({ Name: 'name', Value: email.split('@')[0]})];
      userPool.signUp(email, pass, attributeList, [], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };

  const confirmSignUp = (email: string, code: string) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
  };
  
  const login = (email: string, pass: string) => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: pass });
      
      const callbacks: IAuthenticationCallback = {
        onSuccess: async (session) => {
          setIsLoading(true);
          await setupSession(cognitoUser);
          setIsLoading(false);
          resolve(session);
        },
        onFailure: (err) => {
          reject(err);
        }
      };
      
      cognitoUser.authenticateUser(authDetails, callbacks);
    });
  };

  const forgotPassword = (email: string) => {
    return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.forgotPassword({
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  };

  const confirmPassword = (email: string, code: string, newPass: string) => {
     return new Promise<void>((resolve, reject) => {
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.confirmPassword(code, newPass, {
        onSuccess: () => resolve(),
        onFailure: (err) => reject(err),
      });
    });
  }

  const logout = () => {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) {
      cognitoUser.signOut();
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isLoading, login, signup, confirmSignUp, forgotPassword, confirmPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
