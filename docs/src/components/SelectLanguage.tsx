import type { FunctionalComponent } from 'preact';
import { h } from 'preact';

const SelectLanguage: FunctionalComponent<{}> = ({}) => {

  let defaultValue = undefined;
  if (!import.meta.env.SSR) {
    const oldPathname = window.location.pathname;
    const oldPathnameParts = oldPathname.split('/');
    if (/[a-z]{2}/.test(oldPathnameParts[1])) {
      defaultValue = oldPathnameParts[1];
    }
  }
  console.log(defaultValue)

  return (
    <select class="select-language" value={defaultValue} onChange={(e) => {
      const newLang = e.target.value;
      const oldPathname = window.location.pathname;
      const oldPathnameParts = oldPathname.split('/');
      oldPathnameParts.shift();
      console.log(oldPathnameParts);
      if (/^[a-z]{2}$/.test(oldPathnameParts[0])) {
        oldPathnameParts.shift();
      }
      if (newLang !== 'en') {
        oldPathnameParts.unshift(newLang);
      }
      console.log('/' + oldPathnameParts.join('/'));
      window.location.pathname = '/' + oldPathnameParts.join('/');
    }}>
      <option value="en"><span>English</span></option>
      <option value="nl"><span>Dutch</span></option>
    </select> 
  );
};

export default SelectLanguage;
