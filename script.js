// ============================================
// 0. Dark mode toggle
// ============================================
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute('content', theme === 'dark' ? '#0E1013' : '#FAFAF8');
  }
}

themeToggle.addEventListener('click', () => {
  const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
});

// Keep in sync with OS theme changes if user hasn't chosen manually
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// ============================================
// 1. Mobile menu toggle
// ============================================
const mobileToggle = document.getElementById('mobileToggle');
const tabList = document.getElementById('tabList');

mobileToggle.addEventListener('click', () => {
  const isOpen = tabList.classList.toggle('open');
  mobileToggle.setAttribute('aria-expanded', isOpen);
});

// Close mobile menu after clicking a tab
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    tabList.classList.remove('open');
    mobileToggle.setAttribute('aria-expanded', 'false');
  });
});

// ============================================
// 2. Highlight active tab based on scroll position
// ============================================
const sections = document.querySelectorAll('section[id]');
const tabs = document.querySelectorAll('.tab');

const tabIndicator = document.getElementById('tabIndicator');
const tabBar = document.querySelector('.tab-bar');

function moveIndicatorTo(tabEl) {
  if (!tabIndicator || !tabEl || !tabBar) return;
  const barRect = tabBar.getBoundingClientRect();
  const tabRect = tabEl.getBoundingClientRect();
  tabIndicator.style.left = (tabRect.left - barRect.left + tabBar.scrollLeft) + 'px';
  tabIndicator.style.width = tabRect.width + 'px';
  tabIndicator.style.opacity = '1';
}

function setActiveTab() {
  let current = sections[0].id;

  sections.forEach((section) => {
    const sectionTop = section.offsetTop - 120; // offset for sticky topbar
    if (window.scrollY >= sectionTop) {
      current = section.id;
    }
  });

  let activeTab = null;
  tabs.forEach((tab) => {
    const isActive = tab.dataset.tab === current;
    tab.classList.toggle('active', isActive);
    if (isActive) activeTab = tab;
  });

  moveIndicatorTo(activeTab);
}

window.addEventListener('scroll', setActiveTab);
window.addEventListener('load', setActiveTab);
window.addEventListener('resize', () => {
  const activeTab = document.querySelector('.tab.active');
  moveIndicatorTo(activeTab);
});
if (tabBar) {
  tabBar.addEventListener('scroll', () => {
    const activeTab = document.querySelector('.tab.active');
    moveIndicatorTo(activeTab);
  });
}

// ============================================
// 3. Contact form (front-end only demo)
// ============================================
const contactForm = document.getElementById('contactForm');
const formNote = document.getElementById('formNote');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Di sini nantinya bisa dihubungkan ke backend / email service.
  // Untuk sekarang, hanya menampilkan pesan konfirmasi.
  formNote.textContent = 'Pesan terkirim! Terima kasih sudah menghubungi saya.';
  contactForm.reset();

  setTimeout(() => {
    formNote.textContent = '';
  }, 4000);
});

// ============================================
// 4. Scroll-reveal animations (fade + slide up)
// ============================================
const revealTargets = document.querySelectorAll(
  '.section-title, .about-text, .about-facts, .skill-card, .project-card, .contact-list, .contact-form'
);

revealTargets.forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger cards within the same grid a little, without delaying single items
  const staggerGroup = el.closest('.skills-grid, .projects-grid');
  if (staggerGroup) {
    const siblingIndex = Array.from(staggerGroup.children).indexOf(el);
    el.style.setProperty('--reveal-delay', `${Math.min(siblingIndex, 5) * 0.08}s`);
  }
});

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if ('IntersectionObserver' in window && !prefersReducedMotion) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  revealTargets.forEach((el) => revealObserver.observe(el));
} else {
  // No IO support or user prefers reduced motion: just show everything
  revealTargets.forEach((el) => el.classList.add('in-view'));
}

// ============================================
// 5. Subtle 3D tilt on project cards (mouse-follow)
// ============================================
// ============================================
// 6. Hacker-style typing animation for hero code block
// ============================================
(function initHeroTyping() {
  const codeWindow = document.querySelector('.hero-code .code-window');
  const codeBlock = document.querySelector('.hero-code .code-block');
  const codeEl = codeBlock ? codeBlock.querySelector('code') : null;
  if (!codeWindow || !codeBlock || !codeEl) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return; // keep the static, fully-rendered code as-is
  }

  // Lock the box's height before we clear its content, so nothing jumps around
  const naturalHeight = codeBlock.getBoundingClientRect().height;
  codeBlock.style.minHeight = naturalHeight + 'px';

  // Snapshot the syntax-highlighted markup (minus the static resting cursor)
  // as a template we rebuild character-by-character.
  const templateNodes = Array.from(codeEl.childNodes)
    .filter((n) => !(n.nodeType === 1 && n.classList.contains('type-cursor')))
    .map((n) => n.cloneNode(true));

  const totalChars = templateNodes.reduce((sum, n) => sum + n.textContent.length, 0);

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Rebuilds the HTML for the first `remaining` visible characters, keeping
  // syntax-highlight spans intact (and partially open) as typing progresses.
  function buildPartial(nodes, remaining) {
    let html = '';
    let rem = remaining;
    for (const node of nodes) {
      if (rem <= 0) break;
      if (node.nodeType === 3) { // text node
        const text = node.textContent;
        if (text.length <= rem) {
          html += escapeHTML(text);
          rem -= text.length;
        } else {
          html += escapeHTML(text.slice(0, rem));
          rem = 0;
        }
      } else if (node.nodeType === 1) { // element node
        const result = buildPartial(Array.from(node.childNodes), rem);
        html += `<span class="${node.className}">${result.html}</span>`;
        rem = result.remaining;
      }
    }
    return { html, remaining: rem };
  }

  codeEl.innerHTML = '';
  let shown = 0;

  function typeNext() {
    shown++;
    const { html } = buildPartial(templateNodes, shown);
    codeEl.innerHTML = html + '<span class="type-cursor" aria-hidden="true"></span>';

    if (shown < totalChars) {
      const justTyped = codeEl.textContent.charAt(shown - 1);
      let delay = 12 + Math.random() * 26; // natural, slightly uneven typing speed
      if (justTyped === '\n') delay += 160;   // brief pause after each line
      else if (justTyped === ',') delay += 60; // tiny pause after commas
      setTimeout(typeNext, delay);
    } else {
      codeWindow.classList.remove('is-typing');
    }
  }

  // Start once the code window's own entrance animation has settled
  setTimeout(() => {
    codeWindow.classList.add('is-typing');
    typeNext();
  }, 550);
})();

// ============================================
// 7. Subtle 3D tilt on project cards (mouse-follow)
// ============================================
if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.project-card').forEach((card) => {
    const maxTilt = 6; // degrees

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;  // 0 → 1
      const py = (e.clientY - rect.top) / rect.height;  // 0 → 1
      const ry = (px - 0.5) * maxTilt * 2;
      const rx = (0.5 - py) * maxTilt * 2;
      card.style.setProperty('--rx', `${rx}deg`);
      card.style.setProperty('--ry', `${ry}deg`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}
