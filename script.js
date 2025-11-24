document.addEventListener('DOMContentLoaded', () => {
  // Page loader: show on first visit in this session
  (function(){
    var loader = document.getElementById('site-loader');
    if(!loader) return;
    try{
      var shown = sessionStorage.getItem('jinnov_loader_shown');
      if(!shown){
        // keep loader visible briefly then fade
        setTimeout(function(){
          loader.classList.add('hide');
          loader.addEventListener('transitionend', function(){ loader.style.display = 'none'; }, {once:true});
        }, 900);
        sessionStorage.setItem('jinnov_loader_shown','1');
      } else {
        // already shown during this session: hide immediately
        loader.style.display = 'none';
      }
    }catch(e){ loader.style.display = 'none'; }
  })();

  
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

  // Modal product details (only initialise if modal exists on the page)
  const modal = document.getElementById('product-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalDesc = document.getElementById('modal-desc');

  if (modal && modalTitle && modalDesc) {
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
  }

  // --- Custom select widget: move initialization inside DOMContentLoaded ---
  (function(){
    var custom = document.getElementById('custom-service');
    if(!custom) return;
    var toggle = custom.querySelector('.custom-select-toggle');
    var list = custom.querySelector('.custom-select-list');
    var hidden = custom.querySelector('input[type="hidden"]');
    var valueEl = custom.querySelector('.custom-select-value');
    var options = Array.from(list.querySelectorAll('li'));
    var open = false;
    var idx = 0;

    function openList(){
      list.classList.add('show');
      custom.setAttribute('aria-expanded','true');
      open = true;
      options.forEach(function(o){ o.classList.remove('highlight'); });
      options[idx].classList.add('highlight');
      list.focus && list.focus();
    }
    function closeList(){
      list.classList.remove('show');
      custom.setAttribute('aria-expanded','false');
      open = false;
    }

    toggle.addEventListener('click', function(e){
      e.preventDefault();
      open ? closeList() : openList();
    });

    options.forEach(function(opt,i){
      opt.addEventListener('click', function(){
        hidden.value = this.dataset.value;
        valueEl.textContent = this.textContent;
        idx = i;
        closeList();
      });
    });

    // keyboard
    custom.addEventListener('keydown', function(e){
      if(e.key === 'ArrowDown'){
        e.preventDefault(); idx = Math.min(options.length-1, idx+1); openList();
        options[idx].scrollIntoView({block:'nearest'});
      } else if(e.key === 'ArrowUp'){
        e.preventDefault(); idx = Math.max(0, idx-1); openList();
        options[idx].scrollIntoView({block:'nearest'});
      } else if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault(); if(open){ options[idx].click(); } else { openList(); }
      } else if(e.key === 'Escape'){
        if(open){ closeList(); }
      }
    });

    // click outside
    document.addEventListener('click', function(ev){
      if(!custom.contains(ev.target)) closeList();
    });
  })();

  // Show error/success message from ?error= or ?success= in URL for forms
  (function(){
    try{
      var params = new URLSearchParams(window.location.search);
      var err = params.get('error');
      var ok = params.get('success');
      var box = document.getElementById('form-message');
      if(!box) return;
      if(err){
        try{ err = decodeURIComponent(err); }catch(e){}
        box.textContent = err;
        box.style.display = 'block';
        box.style.background = 'linear-gradient(90deg, rgba(213,21,12,0.06), rgba(217,169,79,0.03))';
        box.style.border = '1px solid rgba(213,21,12,0.12)';
        box.style.color = '#fff';
      } else if(ok){
        try{ ok = decodeURIComponent(ok); }catch(e){}
        box.textContent = ok;
        box.style.display = 'block';
        box.style.background = 'linear-gradient(90deg, rgba(33,162,88,0.06), rgba(20,120,70,0.03))';
        box.style.border = '1px solid rgba(33,162,88,0.12)';
        box.style.color = '#fff';
      }
    }catch(e){
      // ignore quietly
    }
  })();

});