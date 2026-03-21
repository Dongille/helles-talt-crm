import { useLocalStorage } from './useLocalStorage';

// Document number counters stay in localStorage.
// Each device increments its own counter, but the actual quoteNumber /
// confirmationNumber is stored on the Order in Supabase, so there is one
// source-of-truth per order regardless of which device generated it.
export function useDocumentNumbers() {
  const [offertCount,  setOffertCount]  = useLocalStorage<number>('helles-offert-count',  0);
  const [bokningCount, setBokningCount] = useLocalStorage<number>('helles-bokning-count', 0);

  const getNextOffertNumber = (): number => {
    const next = offertCount + 1;
    setOffertCount(next);
    return next;
  };

  const getNextBokningNumber = (): number => {
    const next = bokningCount + 1;
    setBokningCount(next);
    return next;
  };

  const formatOffertNumber  = (n: number, year: number): string =>
    `OFF-${year}-${String(n).padStart(3, '0')}`;

  const formatBokningNumber = (n: number, year: number): string =>
    `BOK-${year}-${String(n).padStart(3, '0')}`;

  return { getNextOffertNumber, getNextBokningNumber, formatOffertNumber, formatBokningNumber };
}
