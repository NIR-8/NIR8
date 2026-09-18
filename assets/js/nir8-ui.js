document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  body.classList.add('nir8-ui-ready');

  const menuItems = document.querySelectorAll('.menu-item');
  const calculators = {
    formula: document.getElementById('formulaCalculator'),
    acb: document.getElementById('acbCalculator')
  };

  function syncCalculatorTabs(activeName) {
    menuItems.forEach(item => {
      const isActive = item.dataset.calculator === activeName;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
      item.setAttribute('aria-selected', String(isActive));
    });

    Object.entries(calculators).forEach(([name, el]) => {
      if (!el) return;
      const shouldShow = name === activeName;
      el.classList.toggle('active', shouldShow);
      el.setAttribute('aria-hidden', String(!shouldShow));
    });
  }

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.calculator;
      if (target && calculators[target]) {
        syncCalculatorTabs(target);
      }
    });

    item.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        item.click();
      }
    });
  });

  const writeUsPanel = document.getElementById('writeusPanel');
  const sidenav = document.getElementById('sidenav');
  const overlay = document.getElementById('sidenavOverlay');

  const toggleOpenState = (el, isOpen) => {
    if (!el) return;
    el.classList.toggle('open', isOpen);
    el.setAttribute('aria-hidden', String(!isOpen));
  };

  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      const nextState = !sidenav?.classList.contains('open');
      toggleOpenState(sidenav, nextState);
      toggleOpenState(writeUsPanel, false);
      if (overlay) {
        overlay.classList.toggle('open', nextState);
      }
      hamburger.setAttribute('aria-expanded', String(nextState));
    });
  }

  const sidenavClose = document.getElementById('sidenavClose');
  if (sidenavClose) {
    sidenavClose.addEventListener('click', () => {
      toggleOpenState(sidenav, false);
      if (overlay) overlay.classList.remove('open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      toggleOpenState(sidenav, false);
      overlay.classList.remove('open');
      if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
    });
  }

  const form = document.getElementById('writeusForm');
  const msg = document.getElementById('wpMsg');
  const charCounter = document.getElementById('wpChar');
  if (msg && charCounter) {
    const updateCounter = () => {
      const length = msg.value.length;
      charCounter.textContent = `${length} / 1000`;
      charCounter.classList.toggle('warn', length > 900);
    };
    msg.addEventListener('input', updateCounter);
    updateCounter();
  }

  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const textarea = form.querySelector('textarea');
      if (!textarea || !textarea.value.trim()) {
        const err = document.getElementById('wpErr');
        if (err) {
          err.textContent = 'Please enter a message before sending.';
          err.classList.add('show');
        }
        return;
      }
      const success = document.getElementById('wpSuccess');
      const formArea = document.getElementById('wpFormArea');
      if (success) success.style.display = 'block';
      if (formArea) formArea.style.display = 'none';
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (sidenav && sidenav.classList.contains('open')) {
        toggleOpenState(sidenav, false);
        if (overlay) overlay.classList.remove('open');
        if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
      }
      if (writeUsPanel && writeUsPanel.classList.contains('open')) {
        toggleOpenState(writeUsPanel, false);
      }
    }
  });

  const defaultActive = document.querySelector('.menu-item.active')?.dataset.calculator || 'formula';
  syncCalculatorTabs(defaultActive);
});
