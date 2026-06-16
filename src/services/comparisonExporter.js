import domtoimage from 'dom-to-image-more';

export const exportComparisonAsPng = async (node, filename = 'rankerhub-comparison.png') => {
  if (!node) {
    throw new Error("No element to export");
  }

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const original = node;
    const clone = original.cloneNode(true);

    clone.querySelectorAll('.pointer-events-none').forEach(n => n.remove());

    const copyComputedStyles = (sourceEl, targetEl) => {
      const computed = window.getComputedStyle(sourceEl);
      let cssText = '';
      for (let i = 0; i < computed.length; i++) {
        const prop = computed[i];
        try {
          cssText += `${prop}: ${computed.getPropertyValue(prop)}; `;
        } catch {
          // ignore
        }
      }
      targetEl.style.cssText = cssText;
    };

    const inlineAllStyles = (srcRoot, tgtRoot) => {
      copyComputedStyles(srcRoot, tgtRoot);
      const srcChildren = Array.from(srcRoot.children || []);
      const tgtChildren = Array.from(tgtRoot.children || []);
      for (let i = 0; i < srcChildren.length; i++) {
        if (tgtChildren[i]) inlineAllStyles(srcChildren[i], tgtChildren[i]);
      }
    };

    try {
      inlineAllStyles(original, clone);
    } catch (e) {
      console.warn('Inline styles fallback:', e);
    }

    const rect = original.getBoundingClientRect();
    clone.style.position = 'fixed';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.width = `${Math.round(rect.width)}px`;
    clone.style.height = 'auto';
    clone.style.boxSizing = 'border-box';

    document.body.appendChild(clone);

    const dataUrl = await domtoimage.toPng(clone, { cacheBust: true, bgcolor: '#0f172a' });

    document.body.removeChild(clone);

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (err) {
    console.error('Comparison export error:', err);
    throw new Error("Failed to export comparison image");
  }
};