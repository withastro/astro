import { Component, createContext } from 'solid-js';
import { SimpleDiv } from './SimpleDiv';

export const ApplicationContext = createContext([{ lng: 'en' }, {}]);

export const ContextProvider: Component = () => {
  return (
    <ApplicationContext.Provider value={[{ lng: 'fr' }]}>
      <SimpleDiv />
    </ApplicationContext.Provider>
  );
};
