import { useEffect } from 'react';
export function useTitle(title) {
  useEffect(() => { document.title = title ? `${title} | It SMASH` : 'It SMASH - Shop smart, live easy'; }, [title]);
}
