document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('klickMich');
  btn.addEventListener('click', () => {
    alert('Hallo vom Browser-JavaScript!');
  });

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

});

