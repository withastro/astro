/**
 * 
 * @param {String} word  
 * @returns Capitalised Word
 */
export default function capitalise(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }