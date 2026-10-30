import { useEffect, useState } from 'react';

function readRoute() {
  return window.location.hash.replace(/^#/, '') || '/';
}

export function useHashRoute() {
  const [route, setRoute] = useState(readRoute);

  useEffect(() => {
    const handleChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', handleChange);
    return () => window.removeEventListener('hashchange', handleChange);
  }, []);

  return route;
}
