import { useEffect } from 'react';
import type { ProctoringEventType } from '../types';

export function useEventDetector(
  onViolation: (type: ProctoringEventType) => void,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') onViolation('TAB_SWITCH');
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) onViolation('FULLSCREEN_EXIT');
    };
    const onBlur    = () => onViolation('WINDOW_BLUR');
    const onCopy    = () => onViolation('COPY_PASTE');
    const onPaste   = () => onViolation('COPY_PASTE');
    const onOffline = () => onViolation('NETWORK_LOST');

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('blur', onBlur);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    window.addEventListener('offline', onOffline);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      window.removeEventListener('offline', onOffline);
    };
  }, [enabled, onViolation]);
}
