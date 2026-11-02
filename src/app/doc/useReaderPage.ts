import { useEffect, useRef, useState } from 'react';
import { readingPageToKeep } from '../../lib/stateMerge';
import { safePageIndex } from '../../lib/textGuard';

export type ReaderPageInput = {
  docId: string | undefined;
  /** Paramètre d'URL (`?page=`), par exemple un résultat de recherche. */
  pageParam: unknown;
  savedPage: number | undefined;
  pageCount: number;
  storageReady: boolean;
  onCommit: (page: number) => void;
};

function clampPage(page: number, pageCount: number) {
  if (pageCount <= 0) return 0;
  return Math.max(0, Math.min(page, pageCount - 1));
}

/**
 * Page affichée par la liseuse.
 * Un lien (?page=5) est toujours respecté, même si la page enregistrée est 120
 * et même si le stockage est déjà prêt.
 * La règle max ne s'applique qu'à une navigation faite avant la fin de la lecture.
 */
export function useReaderPage({ docId, pageParam, savedPage, pageCount, storageReady, onCommit }: ReaderPageInput) {
  const linkedPage = safePageIndex(pageParam);
  const [page, setPage] = useState(() => clampPage(linkedPage !== null ? linkedPage : (savedPage ?? 0), pageCount));
  const userMovedBeforeReady = useRef(false);
  const committedDoc = useRef<string | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const go = (next: number) => {
    if (!storageReady) userMovedBeforeReady.current = true;
    setPage(clampPage(next, pageCount));
  };

  useEffect(() => {
    if (!docId || !storageReady) return;
    if (committedDoc.current === docId) {
      onCommitRef.current(page);
      return;
    }
    const target =
      linkedPage !== null
        ? clampPage(linkedPage, pageCount)
        : clampPage(readingPageToKeep(savedPage, page, userMovedBeforeReady.current), pageCount);
    if (target !== page) {
      setPage(target);
      return;
    }
    committedDoc.current = docId;
    onCommitRef.current(target);
  }, [docId, linkedPage, page, pageCount, savedPage, storageReady]);

  return { page, go };
}
