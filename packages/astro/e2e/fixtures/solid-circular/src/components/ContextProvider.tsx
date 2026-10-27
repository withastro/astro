import { createContext } from 'solid-js';
import type {Component} from 'solid-js';
import { SimpleDiv } from './SimpleDiv';

export const ApplicationContext = createContext([{ lng: 'en' }, {}]);

export const ContextProvider: Component = () => {
  return (
    <ApplicationContext value={[{ lng: 'fr' }]}>
      <SimpleDiv />
    </ApplicationContext>
  );
};
