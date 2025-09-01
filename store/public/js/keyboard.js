(function () {
  // Simple Virtual Keyboard (QWERTZ) – vanilla JS, optional jQuery hook
  const KEY_LAYOUTS = {
    normal: [
      ['^','1','2','3','4','5','6','7','8','9','0','ß','´','←'],
      ['q','w','e','r','t','z','u','i','o','p','ü','+'],
      ['⇧','a','s','d','f','g','h','j','k','l','ö','ä','#','⏎'],
      ['⎋','<','y','x','c','v','b','n','m',',','.','-','⎵']
    ],
    shift: [
      ['°','!','"','§','$','%','&','/','(',')','=','?','`','←'],
      ['Q','W','E','R','T','Z','U','I','O','P','Ü','*'],
      ['⇧','A','S','D','F','G','H','J','K','L','Ö','Ä','\'','⏎'],
      ['⎋','>','Y','X','C','V','B','N','M',';',';', '_','⎵']
    ]
  };

  let state = {
    target: null,
    shift: false
  };

  // Create DOM
  const vk = document.createElement('div');
  vk.className = 'vk hidden';
  vk.innerHTML = `
    <div class="vk-top">
      <span class="vk-title">Bildschirmtastatur</span>
      <div>
        <button class="vk-btn" data-action="toggleShift">⇧ Shift</button>
        <button class="vk-btn" data-action="close">Schließen</button>
      </div>
    </div>
    <div class="vk-rows"></div>
  `;
  const rowsBox = vk.querySelector('.vk-rows');
  document.body.appendChild(vk);

  function render() {
    rowsBox.innerHTML = '';
    const layout = state.shift ? KEY_LAYOUTS.shift : KEY_LAYOUTS.normal;
    layout.forEach(row => {
      const r = document.createElement('div');
      r.className = 'vk-row';
      row.forEach(k => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'vk-key';
        b.textContent = k;
        if (k === '⎵') b.classList.add('space');
        if (['←','⏎','⇧','⎋'].includes(k)) b.classList.add('wide');
        b.dataset.key = k;
        r.appendChild(b);
      });
      rowsBox.appendChild(r);
    });
  }

  function setCaretText(el, insert) {
    // Insert at caret for input/textarea/contenteditable
    el.focus();
    const isInput = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    if (isInput) {
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const before = el.value.slice(0, start);
      const after  = el.value.slice(end);
      el.value = before + insert + after;
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    } else if (el.isContentEditable) {
      document.execCommand('insertText', false, insert);
    }
  }

  function handleSpecial(key) {
    const el = state.target;
    if (!el) return;
    if (key === '←') { // Backspace
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      if (start === end && start > 0) {
        el.value = el.value.slice(0, start - 1) + el.value.slice(end);
        const pos = start - 1;
        el.setSelectionRange(pos, pos);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        // delete selection
        el.value = el.value.slice(0, start) + el.value.slice(end);
        el.setSelectionRange(start, start);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return true;
    }
    if (key === '⏎') { setCaretText(el, '\n'); return true; }
    if (key === '⎵') { setCaretText(el, ' '); return true; }
    if (key === '⇧') { state.shift = !state.shift; render(); return true; }
    if (key === '⎋') { hide(); return true; }
    return false;
  }

  function showFor(target) {
    state.target = target;
    vk.classList.remove('hidden');
    render();
  }

  function hide() {
    vk.classList.add('hidden');
    state.target = null;
  }

  // Global events
  vk.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-action="close"]')) { hide(); return; }
    if (t.closest('[data-action="toggleShift"]')) { state.shift = !state.shift; render(); return; }

    const key = t.dataset && t.dataset.key;
    if (!key || !state.target) return;
    if (!handleSpecial(key)) {
      setCaretText(state.target, key);
      // Auto-Reset Shift (wie echte Tastatur)
      if (state.shift && key.length === 1) { state.shift = false; render(); }
    }
  });

  // Auto-attach: inputs & textareas bekommen bei Fokus die Tastatur
  function attachAuto(selector = 'input[type="text"], input[type="search"], input[type="password"], textarea, [contenteditable="true"]') {
    document.addEventListener('focusin', (e) => {
      const el = e.target.closest(selector);
      if (el) showFor(el);
    });
    document.addEventListener('focusout', (e) => {
      const el = e.target;
      // Tastatur offen lassen, wenn Fokus auf die Tastatur geht
      if (vk.contains(e.relatedTarget)) return;
      // Optional aus: dann bleibt Keyboard immer sichtbar
      // hide();
    });
  }

  // Public API
  window.VirtualKeyboard = {
    showFor, hide, attachAuto
  };

  // Optional jQuery-Plugin
  if (window.jQuery) {
    jQuery.fn.virtualKeyboard = function () {
      this.each(function () {
        this.addEventListener('focus', () => showFor(this));
      });
      return this;
    };
  }

  // Auto-attach standardmäßig aktivieren
  document.addEventListener('DOMContentLoaded', () => {
    attachAuto();
  });
})();

