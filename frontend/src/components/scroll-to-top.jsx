// Centralized scroll restoration component.
// Ensures each route navigation resets viewport to top (0,0) per project rule.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // instant scroll per requirement; change behavior to 'smooth' only with explicit approval
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname]);
  return null;
};

export default ScrollToTop;
