(() => {
  const popup = document.createElement('div');

  Object.assign(popup.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: '999999',
    background: '#0a66c2',
    color: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    pointerEvents: 'auto',
    cursor: 'grab',
    userSelect: 'none',
    transition: 'background-color 0.3s ease',
    touchAction: 'none'
  });

  let isDragging = false;
  let startX, startY;
  let currentX = 0;
  let currentY = 0;

  const stopDragging = () => {
    isDragging = false;
    popup.style.cursor = 'grab';
  };

  popup.addEventListener('mousedown', (e) => {
    isDragging = true;
    popup.style.cursor = 'grabbing';

    startX = e.clientX - currentX;
    startY = e.clientY - currentY;

    e.stopPropagation();
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;

    currentX = e.clientX - startX;
    currentY = e.clientY - startY;

    popup.style.transform = `translate(${currentX}px, ${currentY}px)`;
  });

  window.addEventListener('mouseup', stopDragging, { capture: true });

  window.addEventListener('blur', stopDragging);

  ['click', 'mousedown', 'mouseup', 'dblclick'].forEach(type => {
    popup.addEventListener(type, (e) => e.stopPropagation());
  });

  document.body.appendChild(popup);

  const LIMIT = 3000;
  const WARNING_MIDDLE_THRESHOLD = 2800;
  const WARNING_THRESHOLD = 2900;
  const COLOR_NORMAL = '#0072b1';
  const COLOR_MIDDLE_WARNING = '#bdbd0b';
  const COLOR_WARNING = '#d11124';

  function findElementInShadow(root, selector) {
    if (!root) return null;
    const found = root.querySelector(selector);
    if (found) return found;
    const children = root.querySelectorAll('*');
    for (const child of children) {
      if (child.shadowRoot) {
        const result = findElementInShadow(child.shadowRoot, selector);
        if (result) return result;
      }
    }
    return null;
  }

  let attached = false;

  const startTracking = () => {
    const currentEditor = findElementInShadow(document, '.ql-editor[role="textbox"]');

    if (!currentEditor) {
      attached = false;
      popup.style.display = 'none';
      return;
    }

    if (attached) return;

    const getLinkedInText = (editor) => {
      let html = editor.innerHTML;

      html = html.replace(/<\/p>/gi, '\n');

      html = html.replace(/<br\s*\/?>/gi, '');

      html = html.replace(/<[^>]+>/g, '');

      html = html.replace(/&nbsp;/g, ' ');

      html = html.replace(/&amp;/g, '&');
      html = html.replace(/&lt;/g, '<');
      html = html.replace(/&gt;/g, '>');
      html = html.replace(/&quot;/g, '"');
      html = html.replace(/&#39;/g, "'");

      html = html.replace(/\u200B/g, '');
      html = html.replace(/\u2060/g, '');
      html = html.replace(/\uFEFF/g, '');

      html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      if (html.endsWith('\n')) {
        html = html.slice(0, -1);
      }

      return html;
    };

    const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });

    const handleUpdate = () => {
      setTimeout(() => {
        const text = getLinkedInText(currentEditor);

        let charCount = 0;
        const segments = [...segmenter.segment(text)];

        for (const { segment } of segments) {
          const isEmoji = /\p{Extended_Pictographic}/u.test(segment);
          charCount += isEmoji ? 3 : segment.length;
        }

        popup.textContent = `Characters: ${charCount} / ${LIMIT}`;
        popup.style.display = charCount > 0 ? 'block' : 'none';

        if (charCount >= WARNING_THRESHOLD) {
          popup.style.background = COLOR_WARNING;
        } else if (charCount >= WARNING_MIDDLE_THRESHOLD) {
          popup.style.background = COLOR_MIDDLE_WARNING;
        } else {
          popup.style.background = COLOR_NORMAL;
        }
      }, 50);
    };

    [
      'input',
      'keyup',
      'paste',
      'drop',
      'click',
      'mouseup'
    ].forEach(eventType => {
      currentEditor.addEventListener(eventType, handleUpdate);
    });


    handleUpdate();
    attached = true;
  };

  setInterval(startTracking, 1000);
})();