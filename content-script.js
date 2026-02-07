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
  const WARNING_THRESHOLD = 2900;
  const COLOR_NORMAL = '#0a66c2';
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

    const handleUpdate = () => {
      setTimeout(() => {
        
        let text = currentEditor.innerText || "";

        text = text.replace(/\u00A0/g, ' '); 
        text = text.replace(/[ ]+\n/g, '\n');

        text = text.replace(/\n\n+/g, '\n');

        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

        if (text.endsWith('\n')) {
          text = text.slice(0, -1);
        }

        const charCount = [...text].length;

        popup.textContent = `Characters: ${charCount} / ${LIMIT}`;
        popup.style.display = charCount > 0 ? 'block' : 'none';
        popup.style.background = charCount >= WARNING_THRESHOLD ? COLOR_WARNING : COLOR_NORMAL;

        console.log("Normalized Count:", charCount);
      }, 10);
    };

    ['input', 'paste', 'keyup', 'mouseup'].forEach(ev => currentEditor.addEventListener(ev, handleUpdate));
    handleUpdate();
    attached = true;
  };

  setInterval(startTracking, 1000);
})();