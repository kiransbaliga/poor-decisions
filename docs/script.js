document.addEventListener('DOMContentLoaded', () => {
  // ---- iOS / Desktop detection ----
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const desktopWarning = document.getElementById('desktopWarning');
  const mobileOnlyText = document.querySelector('.mobile-only-text');
  const addShortcutBtn = document.getElementById('addShortcutBtn');

  if (!isIOS && !isMac) {
    desktopWarning.style.display = 'block';
    mobileOnlyText.style.display = 'none';
    addShortcutBtn.style.opacity = '0.5';
    addShortcutBtn.style.pointerEvents = 'none';
  }

  // ---- Nav scroll effect ----
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
  });

  // ---- Scroll-triggered fade-in animations ----
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.15 });

  document.querySelectorAll('.fade-in, .fade-in-left, .fade-in-right').forEach(el => {
    observer.observe(el);
  });

  // ---- Animate SVG connector paths on scroll ----
  const pathObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const path = entry.target.querySelector('path');
        if (path) {
          path.style.strokeDashoffset = '0';
          path.style.transition = 'stroke-dashoffset 1.2s ease-in-out';
        }
        pathObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.step-connector').forEach(connector => {
    const path = connector.querySelector('path');
    if (path) {
      const length = path.getTotalLength();
      path.style.strokeDasharray = '6, 6';
      path.style.strokeDashoffset = length;
    }
    pathObserver.observe(connector);
  });

  // ---- Smooth scroll for nav links + scroll hint ----
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  const scrollHint = document.getElementById('scrollHint');
  if (scrollHint) {
    scrollHint.addEventListener('click', () => {
      document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ==============================================
  // REAL-TIME SVG PATH PENCIL HANDWRITING & SMOKE POOF TRANSITION
  // ==============================================
  const svgEl = document.getElementById('handwritingSvg');
  const wrapEl = document.getElementById('heroTitleWrap');
  const pencil = document.getElementById('pencilEl');
  const finalTitle = document.getElementById('finalTitle');
  const smokeCanvas = document.getElementById('smokeCanvas');

  const pathConfigs = [
    { id: 'pathPoor', duration: 1100 },
    { id: 'pathDecisions', duration: 1600 },
    { id: 'pathDot1', duration: 120 },
    { id: 'pathDot2', duration: 120 },
    { id: 'pathTM', duration: 400 }
  ];

  if (svgEl && wrapEl && pencil && finalTitle) {
    // Setup paths
    const pathDataList = pathConfigs.map(cfg => {
      const el = document.getElementById(cfg.id);
      if (!el) return null;
      const len = el.getTotalLength();
      el.style.strokeDasharray = len;
      el.style.strokeDashoffset = len;
      return { el, len, duration: cfg.duration };
    }).filter(Boolean);

    // Function to update pencil position on SVG path
    function setPencilToPoint(pathEl, lengthAtPoint) {
      const pt = pathEl.getPointAtLength(lengthAtPoint);
      const svgBox = svgEl.getBoundingClientRect();
      const wrapBox = wrapEl.getBoundingClientRect();

      const scaleX = svgBox.width / 640;
      const scaleY = svgBox.height / 100;

      const px = (pt.x * scaleX) + (svgBox.left - wrapBox.left);
      const py = (pt.y * scaleY) + (svgBox.top - wrapBox.top);

      // Graphite tip is at bottom-left of pencil container
      pencil.style.left = `${px}px`;
      pencil.style.top = `${py - 90}px`;
      pencil.style.opacity = '1';
    }

    // Smoke poof: Darkest at origin (text line), fading smoothly to 100% transparent before outer bounds
    function triggerSmokePoof() {
      if (!smokeCanvas) return;
      const ctx = smokeCanvas.getContext('2d');
      const box = wrapEl.getBoundingClientRect();

      // Large unconstrained canvas padding (300px horizontal, 200px vertical)
      const dpr = window.devicePixelRatio || 1;
      const offsetX = 300;
      const offsetY = 200;
      const w = box.width + (offsetX * 2);
      const h = box.height + (offsetY * 2);

      smokeCanvas.width = w * dpr;
      smokeCanvas.height = h * dpr;
      ctx.scale(dpr, dpr);

      // Generate 85 particles originating directly along the text line
      const particles = [];
      const particleCount = 90;
      const centerX = offsetX + (box.width / 2);
      const centerY = offsetY + (box.height / 2);

      for (let i = 0; i < particleCount; i++) {
        // Distribute along text span
        const textPosRatio = (Math.random() - 0.5) * 0.85;
        const originX = centerX + (textPosRatio * box.width);
        const originY = centerY + (Math.random() - 0.5) * 20;

        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8; // Upward cone
        const speed = 0.8 + Math.random() * 1.8;
        const maxLife = 70 + Math.floor(Math.random() * 40); // 1.2s to 1.8s life

        particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.8 - 0.4, // Rising upward
          wobbleFreq: 0.04 + Math.random() * 0.04,
          wobbleAmp: 0.4 + Math.random() * 0.6,
          startRadius: 12 + Math.random() * 14,
          maxRadiusAdd: 35 + Math.random() * 25,
          life: 0,
          maxLife: maxLife,
          r: Math.floor(30 + Math.random() * 20), // Dark charcoal black
          g: Math.floor(27 + Math.random() * 20),
          b: Math.floor(25 + Math.random() * 20)
        });
      }

      // Smooth reveal timing: poof SVG out and pop clean H1 in at peak initial dark smoke density
      setTimeout(() => {
        svgEl.classList.add('poofed');
        finalTitle.classList.add('visible');
      }, 200);

      // Render loop
      function renderSmoke() {
        ctx.clearRect(0, 0, w, h);
        let alive = false;

        particles.forEach(p => {
          if (p.life >= p.maxLife) return;
          alive = true;
          p.life++;

          const progress = p.life / p.maxLife; // 0.0 at text -> 1.0 at outer distance

          // Darkest at start (t=0, alpha=0.95), decaying smoothly to 0.0 transparent at maxLife
          const alpha = 0.95 * Math.pow(1 - progress, 1.6);
          const currentRadius = p.startRadius + (progress * p.maxRadiusAdd);

          // Position movement with gentle sine wave turbulence
          p.x += p.vx + Math.sin(p.life * p.wobbleFreq) * p.wobbleAmp;
          p.y += p.vy;

          if (alpha > 0.001) {
            ctx.save();
            ctx.beginPath();
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius);
            grad.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`);
            grad.addColorStop(0.45, `rgba(${p.r + 20}, ${p.g + 18}, ${p.b + 16}, ${alpha * 0.55})`);
            grad.addColorStop(0.8, `rgba(${p.r + 35}, ${p.g + 32}, ${p.b + 30}, ${alpha * 0.2})`);
            grad.addColorStop(1, `rgba(${p.r + 40}, ${p.g + 36}, ${p.b + 34}, 0)`);

            ctx.fillStyle = grad;
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });

        if (alive) {
          requestAnimationFrame(renderSmoke);
        } else {
          ctx.clearRect(0, 0, w, h);
        }
      }

      requestAnimationFrame(renderSmoke);
    }

    // Sequence animation player
    let currentPathIdx = 0;

    function animateSequence() {
      if (currentPathIdx >= pathDataList.length) {
        // Animation finished -> roll off pencil & poof smoke into clean font
        pencil.classList.add('roll-off');
        setTimeout(() => {
          triggerSmokePoof();
        }, 150);
        return;
      }

      const item = pathDataList[currentPathIdx];
      item.el.classList.add('visible');

      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / item.duration, 1);
        
        const currentLen = progress * item.len;
        item.el.style.strokeDashoffset = item.len - currentLen;

        setPencilToPoint(item.el, currentLen);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          currentPathIdx++;
          setTimeout(animateSequence, currentPathIdx === 1 ? 140 : 70);
        }
      }

      requestAnimationFrame(step);
    }

    // Start handwriting animation after short initial delay
    setTimeout(() => {
      animateSequence();
    }, 400);

    // Update pencil position on window resize if animating
    window.addEventListener('resize', () => {
      if (currentPathIdx < pathDataList.length && pathDataList[currentPathIdx]) {
        const item = pathDataList[currentPathIdx];
        const offset = parseFloat(item.el.style.strokeDashoffset) || 0;
        setPencilToPoint(item.el, item.len - offset);
      }
    });
  }

  // ==============================================
  // TYPING ANIMATION in phone mockup
  // ==============================================
  const typingTarget = document.getElementById('typingTarget');
  if (typingTarget) {
    const words = [
      'Chai',
      'Groceries',
      'Flight to Vietnam',
      'Uber to Office',
      'Netflix',
      'Midnight Biryani',
      'New Headphones',
      'Gym Membership',
      'Concert Tickets'
    ];

    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 80;
    const deleteSpeed = 40;
    const pauseAfterType = 1800;
    const pauseAfterDelete = 400;

    function typeWord() {
      const currentWord = words[wordIndex];

      if (!isDeleting) {
        charIndex++;
        typingTarget.textContent = currentWord.substring(0, charIndex);

        if (charIndex === currentWord.length) {
          setTimeout(() => { isDeleting = true; typeWord(); }, pauseAfterType);
          return;
        }
        setTimeout(typeWord, typeSpeed + Math.random() * 40);
      } else {
        charIndex--;
        typingTarget.textContent = currentWord.substring(0, charIndex);

        if (charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          setTimeout(typeWord, pauseAfterDelete);
          return;
        }
        setTimeout(typeWord, deleteSpeed);
      }
    }

    setTimeout(typeWord, 1200);
  }
});
