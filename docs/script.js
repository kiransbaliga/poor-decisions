document.addEventListener('DOMContentLoaded', () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const desktopWarning = document.getElementById('desktopWarning');
  const mobileOnlyText = document.querySelector('.mobile-only-text');
  const addShortcutBtn = document.getElementById('addShortcutBtn');

  // If not iOS and not Mac (since Mac has Shortcuts app now), show warning
  if (!isIOS && !isMac) {
    desktopWarning.style.display = 'block';
    mobileOnlyText.style.display = 'none';
    addShortcutBtn.style.opacity = '0.5';
    addShortcutBtn.style.pointerEvents = 'none'; // Optional: disable clicking
  }
});
