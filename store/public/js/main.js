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


(() => {
  // ====== Konfiguration ======
  const MIN_LEN = 3;          // minimale Länge, damit es wie ein Scan gilt
  const IDLE_MS = 80;         // Fallback: wenn kein Enter kommt, nach x ms auswerten
  const ALLOW_IN_INPUTS = false; // true = auch scannen, wenn ein Eingabefeld fokussiert ist

  // Wie der Barcode zu einem Pfad wird:
  // - enthält der Code "/" -> wir behandeln ihn als "fertigen Pfad" (z.B. "item/123")
  // - sonst verwenden wir "/item/<code>"
  function mapCodeToPath(code) {
    if (code.includes("/")) return code;               // z.B. "item/123", "orders/ABC-42"
    return `item/${code}`;                             // Standardpräfix
  }

  // Rolle aus Cookie lesen (Default: user)
  function getRole() {
    const m = document.cookie.match(/(?:^|;\s*)role=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "user";
  }

  // ==== Scanner-Puffer ====
  let buf = "";
  let timer = null;

  function reset() {
    buf = "";
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function isPrintable(e) {
    // alles Ein-Zeichen ohne Ctrl/Alt/Meta – Scanner tippt genau das
    return e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey;
  }

  function isTypingContext() {
    const el = document.activeElement;
    if (!el) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return true;
    return false;
  }

  function navigateForCode(code) {
    const role = getRole();                 // 'admin' | 'user'
    const base = role === "admin" ? "/admin" : "";
    const rawPath = mapCodeToPath(code.trim());
    // Sichere URL-Zusammenstellung, wobei "/" und ":" im Pfad erlaubt bleiben
    const enc = rawPath.split("/").map(seg => encodeURIComponent(seg)).join("/");
    const target = `${base}/${enc}`.replace(/\/+/g, "/"); // doppelte Slashes vermeiden
    window.location.href = target;
  }

  function finalizeScan() {
    const code = buf.trim();
    reset();
    if (code.length < MIN_LEN) return;

    // Optional: volle URLs nur innerhalb derselben Origin erlauben
    if (/^https?:\/\//i.test(code)) {
      try {
        const u = new URL(code);
        if (u.origin === location.origin) {
          window.location.href = u.href;
          return;
        }
      } catch { /* ignore */ }
      // Fällt zurück auf Pfad-Mapping
    }

    navigateForCode(code);
  }

  window.addEventListener("keydown", (e) => {
    // Wenn du nicht in Inputs scannen willst:
    if (!ALLOW_IN_INPUTS && isTypingContext()) return;

    if (e.key === "Enter") {
      e.preventDefault(); // Enter vom Scanner nicht "abschicken" lassen
      finalizeScan();
      return;
    }

    if (e.key === "Escape") {
      reset();
      return;
    }

    if (isPrintable(e)) {
      // Scanner tippt sehr schnell: wir sammeln, und falls kein Enter kommt, werten wir nach IDLE_MS aus.
      buf += e.key;
      if (timer) clearTimeout(timer);
      timer = setTimeout(finalizeScan, IDLE_MS);
    }
  }, { capture: true });
})();




 (function() {
    const role = document.body.dataset.role;
    const code = <%- JSON.stringify(code) %>; // kann null sein

    function renderItem(item) {
      $('#item-name').text(item.name);
      $('#item-desc').text(item.description || '—');
      $('#item-price').text(item.price != null ? item.price.toFixed(2) + ' €' : '—');
      $('#item-stock').text(item.stock ?? '—');
      $('#item-updated').text(item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—');
    }

    async function fetchAndRender(c) {
      if (!c) return;
      const res = await fetch(`/api/item/${encodeURIComponent(c)}`);
      if (!res.ok) { $('#item-name').text('Nicht gefunden'); return; }
      const data = await res.json();
      renderItem(data);
    }

    // Initialer Load (wenn Route /item/:code)
    if (code) fetchAndRender(code);

    // Barcode-Keyboard-Wedge: globaler Listener
    (function barcodeListener() {
      const MIN = 3, IDLE = 80, ALLOW_IN_INPUTS = false;
      let buf = '', timer = null;

      function reset(){ buf=''; if (timer){clearTimeout(timer); timer=null;} }
      function inInput(){
        const el=document.activeElement;
        return el && (el.isContentEditable || el.tagName==='INPUT' || el.tagName==='TEXTAREA');
      }

      function navigateFor(codeStr){
        const base = role === 'admin' ? '/admin' : '';
        const path = codeStr.includes('/') ? codeStr : `item/${codeStr}`;
        location.href = `${base}/${path}`.replace(/\/+/g,'/'); // neue Seite (Hard-Navigation)
      }

      function softLoad(codeStr){
        // Soft Update: auf derselben Seite nur Daten neu ziehen
        history.replaceState({}, '', `/${role==='admin'?'admin/':''}${codeStr.includes('/')?codeStr:`item/${codeStr}`}`);
        fetchAndRender(codeStr.includes('/') ? codeStr.split('/').pop() : codeStr);
      }

      function finalize(){
        const c=buf.trim(); reset();
        if (c.length<MIN) return;
        // Wähle hier Hard- oder Soft-Navigation:
        // navigateFor(c); // komplette Seite wechseln
        softLoad(c);       // nur Daten aktualisieren (bleibt auf selbem Template)
      }

      window.addEventListener('keydown', (e)=>{
        if (!ALLOW_IN_INPUTS && inInput()) return;
        if (e.key==='Enter'){ e.preventDefault(); finalize(); return; }
        if (e.key==='Escape'){ reset(); return; }
        if (e.key.length===1 && !e.ctrlKey && !e.altKey && !e.metaKey){
          buf+=e.key;
          if (timer) clearTimeout(timer);
          timer=setTimeout(finalize, IDLE);
        }
      }, {capture:true});
    })();

    // Beispiel: Admin-Buttons (nur UI, Backend-Action über /api/*)
    if (role === 'admin') {
      $('#btn-edit').on('click', ()=> alert('Bearbeiten – hier Formular öffnen…'));
      $('#btn-reprice').on('click', ()=> alert('Preis ändern – Dialog…'));
    }



(function () {
      const input = document.getElementById('manual');
      const goBtn = document.getElementById('goBtn');

      function toAdminPath(code) {
        const c = code.trim();
        if (!c) return null;
        return c.includes('/') ? `/admin/${c}` : `/admin/item/${encodeURIComponent(c)}`;
      }
      function openCode() {
        const p = toAdminPath(input.value);
        if (p) location.href = p.replace(/\/+/g,'/');
      }
      input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); openCode(); } });
      goBtn.addEventListener('click', openCode);
    })();

    // Barcode-Keyboard-Wedge (global)
    (function () {
      let buf = '', t = null;
      const MIN = 3, IDLE = 80;
      const input = document.getElementById('manual');

      function reset(){ buf=''; if (t){ clearTimeout(t); t=null; } }
      function finalize(){
        const code = (buf || input.value).trim(); reset();
        if (code.length < MIN) return;
        const path = code.includes('/') ? `/admin/${code}` : `/admin/item/${encodeURIComponent(code)}`;
        location.href = path.replace(/\/+/g,'/');
      }
      window.addEventListener('keydown', (e) => {
        // Wenn das Eingabefeld fokussiert ist, hat es Vorrang (aber Enter fängt finalize ab)
        if (e.key === 'Enter') { e.preventDefault(); finalize(); return; }
        if (e.key === 'Escape') { reset(); return; }
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          // Scanner „tippt“ sehr schnell nacheinander
          buf += e.key;
          if (t) clearTimeout(t);
          t = setTimeout(finalize, IDLE);
        }
      }, { capture: true });
    })();



});

