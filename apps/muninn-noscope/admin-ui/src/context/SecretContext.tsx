import React, { createContext, ReactNode, useContext } from 'react';

interface SecretContextProps {
  jwt: string;
  secretKey: string;
  setJwt: (jwt: string) => void;
  setSecretKey: (secretKey: string) => void;
}

const SecretContext = createContext<SecretContextProps | undefined>(undefined);

export const SecretProvider: React.FC<{
  value: SecretContextProps;
  children: ReactNode;
}> = ({ value, children }) => {
  return (
    <SecretContext.Provider value={value}>{children}</SecretContext.Provider>
  );
};

export const useSecret = () => {
  const context = useContext(SecretContext);
  if (!context) {
    throw new Error('useSecret must be used within a SecretProvider');
  }
  return context;
};
