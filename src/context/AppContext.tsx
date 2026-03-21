import { createContext, useContext, useState } from 'react';
import type { Region } from '../types';

interface AppContextType {
  region: Region;
  setRegion: (r: Region) => void;
}

const AppContext = createContext<AppContextType>({
  region: 'Alla',
  setRegion: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [region, setRegion] = useState<Region>('Alla');
  return (
    <AppContext.Provider value={{ region, setRegion }}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);
