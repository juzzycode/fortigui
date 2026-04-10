const lastPassSelector = [
  'iframe[id*="lastpass" i]',
  'iframe[name*="lastpass" i]',
  'iframe[src*="lastpass" i]',
  'iframe[id*="lpiframe" i]',
  'iframe[name*="lpiframe" i]',
  '[id*="lastpass" i]',
  '[class*="lastpass" i]',
  '[data-lastpass-root]',
  '[data-lastpass-icon-root]',
].join(',');

const isBlockingOverlay = (element: Element) => {
  if (!(element instanceof HTMLElement)) return false;

  const style = window.getComputedStyle(element);
  if (style.position !== 'fixed' && style.position !== 'absolute') return false;

  const rect = element.getBoundingClientRect();
  const coversViewport = rect.width >= window.innerWidth * 0.75 && rect.height >= window.innerHeight * 0.75;
  const highZIndex = Number(style.zIndex);
  const looksModal = Number.isFinite(highZIndex) && highZIndex >= 1000;

  return coversViewport || looksModal;
};

export const cleanupLastPassArtifacts = () => {
  if (typeof window === 'undefined') return;

  for (const element of document.querySelectorAll(lastPassSelector)) {
    if (isBlockingOverlay(element)) {
      element.remove();
    }
  }

  document.documentElement.style.removeProperty('overflow');
  document.body.style.removeProperty('overflow');
  document.body.style.removeProperty('pointer-events');
};
