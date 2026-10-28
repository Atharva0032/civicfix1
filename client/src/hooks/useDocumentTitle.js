import { useEffect } from 'react';

/** Keeps `document.title` in sync with the current page. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · CivicFix` : 'CivicFix — Report It. Track It. Fix It.';
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export default useDocumentTitle;
