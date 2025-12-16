/* ======= Background Paint Splats (scroll naturally with page) ======= */
/* No parallax needed - splats are part of the body background and scroll normally */

/* ======= Page Loader ======= */
(function() {
  const loader = document.getElementById('site-loader');
  if (!loader) return;
  
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
  if (!header) return;
  
  let ticking = false;

  function updateHeaderStyle() {
    const scrollY = window.scrollY;
    
    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderStyle);
      ticking = true;
    }
  }, { passive: true });
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
  if (!modal) return;
  
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
    // 1) Check URL params (used by album.html redirects)
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');

    if (errorParam) {
      formMessage.textContent = errorParam;
      formMessage.style.display = 'block';
    }

    // 2) If already has content (server-side set), show it as well
    if (formMessage.textContent.trim() && formMessage.style.display !== 'block') {
      formMessage.style.display = 'block';
    }

    // Auto-hide after 5 seconds
    if (formMessage.style.display === 'block') {
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

/* ======= Album page: prefill fields from URL params ======= */
(function() {
  const albumForm = document.querySelector('form[action="album.php"]');
  if (!albumForm) return;

  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const email = params.get('email');

  if (code) {
    const codeInput = albumForm.querySelector('input[name="code"]');
    if (codeInput) codeInput.value = code;
  }
  if (email) {
    const emailInput = albumForm.querySelector('input[name="email"]');
    if (emailInput) emailInput.value = email;
  }
})();

/* ======= Album Success Message on Submit ======= */
(function() {
    const albumForm = document.getElementById('albumForm');
    if (!albumForm) return;

    albumForm.addEventListener('submit', function() {
        // On ne montre le message que si les champs requis sont remplis
        const code = albumForm.querySelector('input[name="code"]').value;
        const password = albumForm.querySelector('input[name="password"]').value;

        if (code && password) {
            // On attend un tout petit peu pour que la soumission du formulaire soit initiée
            setTimeout(() => {
                const successMessage = document.getElementById('success-message');
                const formMessage = document.getElementById('form-message');
                
                if (successMessage) {
                    albumForm.style.display = 'none'; // Masque le formulaire
                    formMessage.style.display = 'none'; // Masque les erreurs potentielles
                    successMessage.style.display = 'block'; // Affiche le message de succès
                }
            }, 100); // 100ms de délai
        }
    });
})();