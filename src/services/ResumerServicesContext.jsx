import { createContext, useContext, useMemo } from "react";
import * as realServices from "./resumerApi";

const ResumerServicesContext = createContext(realServices);

export function ResumerServicesProvider({ children, services = {} }) {
  const value = useMemo(
    () => ({ ...realServices, ...services }),
    [services],
  );

  return (
    <ResumerServicesContext.Provider value={value}>
      {children}
    </ResumerServicesContext.Provider>
  );
}

export function useResumerServices() {
  return useContext(ResumerServicesContext);
}
