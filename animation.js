/* ======= Optimized Parallax Scroll with Transform (GPU-accelerated) ======= */
(function() {
  let ticking = false;
  const parallaxElements = [
    document.body,
    document.documentElement
  ];

  function updateParallax() {
    const scrollY = window.scrollY;
    // Parallax offset: reduce scroll movement to create depth effect
    // Using transform is GPU-accelerated and doesn't trigger layout/paint
    const offset = scrollY * 0.6; // 60% of scroll movement for more dynamic effect
    
    parallaxElements.forEach(el => {
      if (el) {
        el.style.setProperty('--parallax-offset', offset + 'px');
      }
    });
    
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }

  // Use passive event listener for better scroll performance
  window.addEventListener('scroll', onScroll, { passive: true });

  // Trigger initial update
  updateParallax();
})();

/* ======= Page Loader ======= */
(function() {
  const loader = document.getElementById('site-loader');
  const sessionKey = 'jinnov-loader-shown';

  // Show loader only on first visit of the session
  if (!sessionStorage.getItem(sessionKey)) {
    sessionStorage.setItem(sessionKey, 'true');
    // Loader is already visible by default
    setTimeout(() => {
      loader.classList.add('hide');
    }, 1800); // Show for 1.8 seconds
  } else {
    // Hide immediately on subsequent visits
    loader.classList.add('hide');
  }

  // Mark loader as fully hidden after transition
  loader.addEventListener('transitionend', () => {
    loader.setAttribute('aria-hidden', 'true');
  }, { once: true });
})();

/* ======= Header Scroll Behavior ======= */
(function() {
  const header = document.querySelector('.main-header');
  let lastScrollY = 0;

  function updateHeaderStyle() {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = scrollY;
  }

  window.addEventListener('scroll', updateHeaderStyle, { passive: true });
})();

/* ======= Smooth Anchor Links ======= */
(function() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  
  anchorLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#' && href !== '#!') {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
})();

/* ======= Product Modal ======= */
(function() {
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');
  const closeBtn = modal.querySelector('.modal-close');

  // Product details database
  const products = {
    photobooth: {
      title: 'Photobooth',
      desc: 'Cabine photo professionnelle avec impression instantanée, fonds personnalisés et une large sélection d\'accessoires fun. Parfait pour mariage, anniversaire ou événement corporate.'
    },
    tables: {
      title: 'Tables mange-debout',
      desc: 'Tables hautes élégantes pour cocktails et réceptions. Disponibles en différents styles et finitions pour s\'adapter à votre thème d\'événement.'
    },
    projector: {
      title: 'Rétroprojecteur',
      desc: 'Projecteur HD haute luminosité + écran de projection de qualité. Idéal pour présentations d\'entreprise et projections vidéo lors d\'événements.'
    },
    'giant-numbers': {
      title: 'Chiffres géants',
      desc: 'Chiffres lumineux personnalisables pour anniversaires, mariages et événements commémoratifs. Disponibles en plusieurs tailles et finitions.'
    },
    'cotton-popcorn': {
      title: 'Machines à popcorn & barbe à papa',
      desc: 'Machines rétro professionnelles pour une touche récréative et gourmande lors de vos événements. Accessoires fournis.'
    }
  };

  // Open modal on button click
  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', function() {
      const productKey = this.getAttribute('data-open');
      const product = products[productKey];
      
      if (product) {
        modalTitle.textContent = product.title;
        modalDesc.textContent = product.desc;
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  // Close modal
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', function(e) {
    if (e.target === this) {
      closeModal();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      closeModal();
    }
  });
})();

/* ======= Custom Select Widget ======= */
(function() {
  const selects = document.querySelectorAll('.custom-select');

  selects.forEach(selectContainer => {
    const toggle = selectContainer.querySelector('.custom-select-toggle');
    const list = selectContainer.querySelector('.custom-select-list');
    const items = list.querySelectorAll('li');
    const valueDisplay = toggle.querySelector('.custom-select-value');

    // Toggle list visibility
    toggle.addEventListener('click', () => {
      list.classList.toggle('show');
      toggle.setAttribute('aria-expanded', list.classList.contains('show'));
    });

    // Handle item selection
    items.forEach((item, index) => {
      item.addEventListener('click', () => {
        valueDisplay.textContent = item.textContent;
        item.setAttribute('aria-selected', 'true');
        
        // Remove selection from other items
        items.forEach((other, otherIndex) => {
          if (otherIndex !== index) {
            other.setAttribute('aria-selected', 'false');
            other.classList.remove('highlight');
          }
        });
        
        list.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
      });

      // Highlight on hover
      item.addEventListener('mouseenter', () => {
        item.classList.add('highlight');
      });
      item.addEventListener('mouseleave', () => {
        item.classList.remove('highlight');
      });
    });

    // Keyboard navigation
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        list.classList.add('show');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!selectContainer.contains(e.target)) {
        list.classList.remove('show');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
})();

/* ======= Form Message Display ======= */
(function() {
  const formMessage = document.getElementById('form-message');
  
  if (formMessage) {
    // Check if message is visible (set by server-side PHP)
    if (formMessage.textContent.trim()) {
      formMessage.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        formMessage.style.transition = 'opacity 0.3s ease';
        formMessage.style.opacity = '0';
        setTimeout(() => {
          formMessage.style.display = 'none';
        }, 300);
      }, 5000);
    }
  }
})();
