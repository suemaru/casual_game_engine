'use client';

import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 820;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const coarseQuery = window.matchMedia('(pointer: coarse)');

    const update = () => {
      const coarse = coarseQuery.matches;
      const narrow = window.innerWidth <= MOBILE_BREAKPOINT;
      setIsMobile(coarse || narrow);
    };

    update();

    const addChangeListener = () => {
      if (typeof coarseQuery.addEventListener === 'function') {
        coarseQuery.addEventListener('change', update);
        return () => coarseQuery.removeEventListener('change', update);
      }

      if (typeof coarseQuery.addListener === 'function') {
        coarseQuery.addListener(update);
        return () => coarseQuery.removeListener(update);
      }

      return () => undefined;
    };

    const detach = addChangeListener();
    window.addEventListener('resize', update);

    return () => {
      detach();
      window.removeEventListener('resize', update);
    };
  }, []);

  return isMobile;
}
