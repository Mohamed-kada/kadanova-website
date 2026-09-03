// ---------- helpers ----------
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

document.addEventListener('DOMContentLoaded', function () {

  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Logo click -> scroll to home
  const homeLogo = document.getElementById('homeLogo');
  if (homeLogo) {
    homeLogo.addEventListener('click', function (e) {
      e.preventDefault();
      document.getElementById('home').scrollIntoView({ behavior: 'smooth' });
    });
  }

  // EmailJS init
  if (typeof emailjs !== 'undefined') {
    emailjs.init('GP30HdEOvgCCOnneR');
  }

  /* ------------ Ambient circuit / constellation canvas ------------ */
  (function ambientGrid() {
    const canvas = document.getElementById('grid');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w, h, nodes;
    const LINK_DIST = 150;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function reset() {
      w = canvas.width = innerWidth * DPR;
      h = canvas.height = innerHeight * DPR;
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      const count = Math.min(70, Math.round((innerWidth * innerHeight) / 24000));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: rand(1, 2.2) * DPR,
          dx: rand(-0.08, 0.08) * DPR,
          dy: rand(-0.08, 0.08) * DPR,
        });
      }
    }
    reset();

    function frame() {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.dx;
        n.y += n.dy;
        if (n.x < 0) n.x = w; if (n.x > w) n.x = 0;
        if (n.y < 0) n.y = h; if (n.y > h) n.y = 0;
      }

      const linkDist = LINK_DIST * DPR;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < linkDist) {
            ctx.globalAlpha = (1 - dist / linkDist) * 0.18;
            ctx.strokeStyle = '#3ea0ff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 0.55;
      for (const n of nodes) {
        ctx.beginPath();
        ctx.fillStyle = '#8fd4ff';
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion) requestAnimationFrame(frame);
    }

    frame();
    if (!reduceMotion) {
      let resizeTimer;
      addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(reset, 150);
      });
    }
  })();

  /* ------------ Reveal on scroll ------------ */
  (function revealOnScroll() {
    const items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    items.forEach(item => observer.observe(item));
  })();

  /* ------------ FAQ accordion ------------ */
  (function initFAQ() {
    const questions = document.querySelectorAll('.faq-question');
    questions.forEach(btn => {
      btn.addEventListener('click', () => {
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        questions.forEach(other => other.setAttribute('aria-expanded', 'false'));
        btn.setAttribute('aria-expanded', String(!expanded));
      });
    });
  })();

  /* ------------ Side nav — sliding highlight ------------ */
  (function initSideNav() {
    const track = document.getElementById('sideNavTrack');
    const highlight = document.getElementById('sideNavHighlight');
    if (!track || !highlight) return;

    const links = track.querySelectorAll('.side-nav-link');

    function moveHighlightTo(link) {
      highlight.style.width = link.offsetWidth + 'px';
      highlight.style.height = link.offsetHeight + 'px';
      highlight.style.transform = `translate(${link.offsetLeft}px, ${link.offsetTop}px)`;
      highlight.classList.add('visible');
    }

    links.forEach(link => {
      link.addEventListener('mouseenter', () => moveHighlightTo(link));
      link.addEventListener('focus', () => moveHighlightTo(link));
    });

    track.addEventListener('mouseleave', () => {
      highlight.classList.remove('visible');
    });
  })();

  /* ------------ Scroll progress rail + back-to-top ------------ */
  (function initScrollRail() {
    const rail = document.getElementById('scrollRail');
    const fill = document.getElementById('scrollRailFill');
    const topBtn = document.getElementById('scrollTopBtn');
    if (!rail || !fill || !topBtn) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
      fill.style.height = (progress * 100) + '%';
      rail.classList.toggle('visible', scrollTop > 400);
    }

    update();
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => { update(); ticking = false; });
        ticking = true;
      }
    });
    window.addEventListener('resize', update);

    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  })();

  /* ------------ What We Do — full-bleed slider ------------ */
  (function initWhatSlider() {
    const track = document.getElementById('whatTrack');
    const slider = document.getElementById('whatSlider');
    const prevBtn = document.getElementById('whatPrev');
    const nextBtn = document.getElementById('whatNext');
    const dots = document.querySelectorAll('#whatDots .slider-dot');
    if (!track || !slider) return;

    const slideCount = track.children.length;
    let index = 0;
    let autoplayTimer;
    const AUTOPLAY_MS = 6000;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function goTo(i) {
      index = (i + slideCount) % slideCount;
      track.style.transform = `translateX(-${index * 100}%)`;
      dots.forEach((dot, di) => dot.classList.toggle('active', di === index));
    }

    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function startAutoplay() {
      if (reduceMotion) return;
      stopAutoplay();
      autoplayTimer = setInterval(next, AUTOPLAY_MS);
    }
    function stopAutoplay() {
      if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
    }

    prevBtn && prevBtn.addEventListener('click', () => { prev(); stopAutoplay(); startAutoplay(); });
    nextBtn && nextBtn.addEventListener('click', () => { next(); stopAutoplay(); startAutoplay(); });
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        goTo(parseInt(dot.dataset.index, 10));
        stopAutoplay();
        startAutoplay();
      });
    });

    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);

    // basic touch swipe
    let touchStartX = null;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      if (touchStartX === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); stopAutoplay(); startAutoplay(); }
      touchStartX = null;
    });

    goTo(0);
    startAutoplay();
  })();

  /* ------------ Smooth-scroll for in-page anchors ------------ */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href && href.length > 1) {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  /* ------------ Contact form (EmailJS) ------------ */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      const formMessage = document.getElementById('formMessage');
      const submitBtn = this.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;

      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;
      formMessage.style.display = 'none';
      formMessage.className = 'form-message';

      if (typeof emailjs === 'undefined') {
        formMessage.textContent = 'Messaging service unavailable right now — please email us directly.';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }

      Promise.all([
        emailjs.send('service_wbm88oc', 'template_zad8hyq', {
          from_name: name,
          from_email: email,
          subject: 'New Contact Form: ' + subject,
          message: message,
          to_email: 'kadanova.ste@gmail.com'
        }),
        emailjs.send('service_wbm88oc', 'template_zad8hyq', {
          from_name: 'Kadanova Team',
          from_email: 'kadanova.ste@gmail.com',
          subject: 'Thank you for contacting Kadanova',
          message: `Hi ${name},\n\nThank you for your message! We have received your inquiry and our team will get back to you within 24 hours.\n\nBest regards,\nKadanova Team`,
          to_email: email
        })
      ])
        .then(function () {
          formMessage.textContent = 'Thank you for your message — a confirmation email is on its way to your inbox.';
          formMessage.className = 'form-message success';
          formMessage.style.display = 'block';
          contactForm.reset();
          formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, function (error) {
          console.log('EmailJS error:', error);
          formMessage.textContent = 'Sorry, something went wrong. Please try again or email us directly at kadanova.ste@gmail.com';
          formMessage.className = 'form-message error';
          formMessage.style.display = 'block';
          formMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        })
        .finally(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        });
    });
  }
});
