document.addEventListener('DOMContentLoaded', () => {

  document.addEventListener('keydown', (e) => {
  // Ctrl+R oder F5
   if ((e.ctrlKey && e.key.toLowerCase() === 'r') || e.key === 'F5') {
     e.preventDefault();
       if (window.pywebview && window.pywebview.api && window.pywebview.api.reload) {
           window.pywebview.api.reload();
       } else {
       location.reload();
     }
   }
});

  $(function(){
    $('input, textarea, [contenteditable=true]').virtualKeyboard();
  });




(() => {
  let buf = '';
  let timer;

  function reset() { buf = ''; }

  window.addEventListener('keydown', (e) => {
    // Viele Scanner schicken sehr schnell und enden mit Enter
    clearTimeout(timer);

    if (e.key === 'Enter') {
      const code = buf.trim();
      if (/^\d{6,20}$/.test(code)) {
        window.location.href = `/item/${code}`;
      }
      reset();
      return;
    }

    // Nur druckbare Zeichen berücksichtigen (hier Ziffern)
    if (e.key.length === 1 && /\d/.test(e.key)) {
      buf += e.key;
      // Fallback: wenn kein Enter kommt, nach 80ms auswerten
      timer = setTimeout(() => {
        if (buf.length >= 6) {
          window.location.href = `/item/${buf}`;
        }
        reset();
      }, 80);
    }
  }, { capture: true });
})();




});

