document.addEventListener('DOMContentLoaded', () => {
  // header change on scroll: toggle a class for smooth CSS transitions
  const header = document.querySelector('.main-header');
  const SCROLL_THRESHOLD = 120; // px before header becomes highlighted
  let ticking = false;

  function updateHeader() {
    const should = window.scrollY > SCROLL_THRESHOLD;
    header.classList.toggle('scrolled', should);
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeader);
      ticking = true;
    }
  });

  // initial state on load
  if (window.scrollY > SCROLL_THRESHOLD) header.classList.add('scrolled');

  // Smooth anchor scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // Modal product details
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  const productData = {
    'photobooth': {
      title: 'Photobooth',
      desc: 'Cabine photo professionnelle, impression instantanée, fonds personnalisés, accessoires et attendant. Idéal pour créer des souvenirs immédiats.'
    },
    'tables': {
      title: 'Tables mange-debout',
      desc: 'Tables hautes élégantes, disponibles en bois, métal ou habillage tissu. Parfaites pour cocktails et zones de réseautage.'
    },
    'projector': {
      title: 'Rétroprojecteur',
      desc: 'Projecteur HD + écran et câblage. Nos kits assurent une projection nette pour présentations et soirées cinéma.'
    },
    'giant-numbers': {
      title: 'Chiffres géants',
      desc: 'Chiffres lumineux (LED) pour anniversaires et mariages. Plusieurs tailles et finitions disponibles.'
    },
    'cotton-popcorn': {
      title: 'Machines Popcorn & Barbe à papa',
      desc: 'Machines rétro pour une animation gourmande. Fournitures consommables en option (sucre, maïs soufflé).'
    }
  };

  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-open');
      const data = productData[key];
      if (!data) return;
      modalTitle.textContent = data.title;
      modalDesc.textContent = data.desc;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
    });
  });

  // close modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('modal-close')) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
    }
  });

  // close with ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
    }
  });

});
