/**
 * FOX KITCHENS — MAIN INTERACTIVE SCRIPT (By Órbita Agency)
 * Handles:
 * 1. Zone Filtering (All, 01 Caliente, 02 Fría, 03 Trabajo)
 * 2. Interactive Equipment Selection & Option Radiobuttons
 * 3. Quote Drawer & Direct WhatsApp Message Builder
 * 4. Sticky Header & Mobile Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  const WHATSAPP_NUMBER = '573185778389';

  // State: Map of cardId -> formatted item label
  const selectedEquipment = new Map();

  // DOM Elements
  const header = document.getElementById('header');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navMenu = document.getElementById('nav-menu');
  const zoneTabs = document.querySelectorAll('.zone-tab');
  const equipCards = document.querySelectorAll('.equip-card');
  const quoteCounter = document.getElementById('quote-counter');
  const catalogStatus = document.getElementById('catalog-selection-status');
  const leadItemsTextarea = document.getElementById('lead-items');
  const leadModalitySelect = document.getElementById('lead-modality');
  const leadForm = document.getElementById('whatsapp-lead-form');
  const sendWhatsappQuoteBtn = document.getElementById('send-whatsapp-quote');

  // Drawer elements
  const quoteDrawer = document.getElementById('quote-drawer');
  const openDrawerBtn = document.getElementById('open-quote-drawer');
  const closeDrawerBtn = document.getElementById('close-quote-drawer');
  const closeBackdrop = document.getElementById('close-quote-backdrop');
  const drawerList = document.getElementById('quote-drawer-list');
  const drawerProceedBtn = document.getElementById('drawer-proceed-btn');

  // 1. Sticky Header & Mobile Menu
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // 2. Zone Filtering Tabs
  function filterByZone(zone) {
    zoneTabs.forEach((tab) => {
      const isMatch = tab.dataset.zoneFilter === zone;
      tab.classList.toggle('active', isMatch);
      tab.setAttribute('aria-selected', String(isMatch));
    });

    equipCards.forEach((card) => {
      if (zone === 'all' || card.dataset.zone === zone) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  zoneTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      filterByZone(tab.dataset.zoneFilter);
    });
  });

  // Footer zone deep links
  document.querySelectorAll('[data-footer-zone]').forEach((link) => {
    link.addEventListener('click', () => {
      const targetZone = link.dataset.footerZone;
      filterByZone(targetZone);
    });
  });

  // Modality preset buttons
  document.querySelectorAll('[data-select-modality]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modalityText = btn.dataset.selectModality;
      if (leadModalitySelect) {
        if (modalityText.includes('Evento')) {
          leadModalitySelect.value = 'Evento por pocos días (Festival / Concierto / Feria)';
        } else {
          leadModalitySelect.value = 'Restaurante con servicio al público';
        }
      }
    });
  });

  // 3. Equipment Selection Logic
  function getFormattedCardLabel(card) {
    const baseBtn = card.querySelector('.btn-add-equip');
    const baseName = baseBtn ? baseBtn.dataset.toggleEquip : card.dataset.name;
    const optionGroup = baseBtn ? baseBtn.dataset.optionGroup : null;

    if (optionGroup) {
      const checkedRadio = card.querySelector(`input[name="${optionGroup}"]:checked`);
      if (checkedRadio) {
        return `${baseName} (${checkedRadio.value})`;
      }
    }
    return baseName;
  }

  function syncSelectionUI() {
    const count = selectedEquipment.size;
    if (quoteCounter) {
      quoteCounter.textContent = String(count);
    }

    const itemsArray = Array.from(selectedEquipment.values());

    if (catalogStatus) {
      if (count === 0) {
        catalogStatus.textContent = 'No has seleccionado equipos aún, pero puedes pedir asesoría directa.';
      } else {
        catalogStatus.textContent = `Seleccionaste ${count} equipo(s): ${itemsArray.join(', ')}.`;
      }
    }

    if (leadItemsTextarea) {
      leadItemsTextarea.value = itemsArray.join(', ');
    }

    // Update Drawer List
    if (drawerList) {
      drawerList.innerHTML = '';
      if (count === 0) {
        const emptyLi = document.createElement('li');
        emptyLi.className = 'quote-drawer__item';
        emptyLi.textContent = 'Aún no has agregado equipos.';
        drawerList.appendChild(emptyLi);
      } else {
        selectedEquipment.forEach((label, cardId) => {
          const li = document.createElement('li');
          li.className = 'quote-drawer__item';
          li.innerHTML = `
            <span>${label}</span>
            <button type="button" class="quote-drawer__remove" data-remove-id="${cardId}">Quitar</button>
          `;
          drawerList.appendChild(li);
        });
      }
    }
  }

  equipCards.forEach((card) => {
    const cardId = card.dataset.id;
    const btn = card.querySelector('.btn-add-equip');
    const btnText = card.querySelector('.btn-add-equip__text');
    const radios = card.querySelectorAll('input[type="radio"]');

    if (btn) {
      btn.addEventListener('click', () => {
        if (selectedEquipment.has(cardId)) {
          selectedEquipment.delete(cardId);
          card.classList.remove('selected');
          if (btnText) btnText.textContent = '+ Agregar a mi cotización';
        } else {
          selectedEquipment.set(cardId, getFormattedCardLabel(card));
          card.classList.add('selected');
          if (btnText) btnText.textContent = '✓ Agregado a tu cotización';
        }
        syncSelectionUI();
      });
    }

    // Update label live if radio option changes while card is already selected
    radios.forEach((radio) => {
      radio.addEventListener('change', () => {
        if (selectedEquipment.has(cardId)) {
          selectedEquipment.set(cardId, getFormattedCardLabel(card));
          syncSelectionUI();
        }
      });
    });
  });

  // Remove item from Drawer
  if (drawerList) {
    drawerList.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-remove-id]');
      if (!removeBtn) return;
      const cardId = removeBtn.dataset.removeId;
      selectedEquipment.delete(cardId);

      const card = document.querySelector(`.equip-card[data-id="${cardId}"]`);
      if (card) {
        card.classList.remove('selected');
        const btnText = card.querySelector('.btn-add-equip__text');
        if (btnText) btnText.textContent = '+ Agregar a mi cotización';
      }
      syncSelectionUI();
    });
  }

  // 4. Drawer Open/Close
  function toggleDrawer(open) {
    if (!quoteDrawer) return;
    quoteDrawer.classList.toggle('open', open);
    quoteDrawer.setAttribute('aria-hidden', String(!open));
  }

  if (openDrawerBtn) openDrawerBtn.addEventListener('click', () => toggleDrawer(true));
  if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => toggleDrawer(false));
  if (closeBackdrop) closeBackdrop.addEventListener('click', () => toggleDrawer(false));
  function scrollToLeadFormAndFocus() {
    const formBox = document.querySelector('.contact-form-box');
    const nameInput = document.getElementById('lead-name');
    if (formBox) {
      formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      formBox.classList.add('form-highlight');
      setTimeout(() => {
        if (nameInput && !nameInput.value.trim()) {
          nameInput.focus({ preventScroll: true });
        }
      }, 650);
      setTimeout(() => {
        formBox.classList.remove('form-highlight');
      }, 2400);
    }
  }

  if (drawerProceedBtn) {
    drawerProceedBtn.addEventListener('click', () => {
      toggleDrawer(false);
      scrollToLeadFormAndFocus();
    });
  }

  // 5. Catalog Quote Bar -> Scroll to Lead Form first so user completes Name, City & Project Type
  if (sendWhatsappQuoteBtn) {
    sendWhatsappQuoteBtn.addEventListener('click', () => {
      scrollToLeadFormAndFocus();
    });
  }

  if (leadForm) {
    leadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('lead-name').value.trim();
      const city = document.getElementById('lead-city').value.trim();
      const modality = document.getElementById('lead-modality').value;
      const items = document.getElementById('lead-items').value.trim() || 'Por definir en la asesoría';

      const message = [
        'Hola *Fox Kitchens*, quiero solicitar una cotización / asesoría gratuita:',
        '',
        `👤 *Nombre / Marca:* ${name}`,
        `📍 *Ciudad:* ${city}`,
        `🏪 *Tipo de Proyecto:* ${modality}`,
        `🔥 *Equipos requeridos:* ${items}`,
      ].join('\n');

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank', 'noopener');
    });
  }

  // 6. 3D Interactive Kitchen Assembly Stage (Hero Right)
  const kitchenViewport = document.getElementById('kitchen-viewport');
  const equippedLayer = document.getElementById('kitchen-equipped-layer');
  const stageSteps = document.querySelectorAll('.stage-step');
  const stageModeBtns = document.querySelectorAll('.stage-mode-btn');
  const stagePlayToggle = document.getElementById('stage-play-toggle');
  const stagePlayLabel = document.getElementById('stage-play-label');
  const stageCaptionBadge = document.getElementById('stage-caption-badge');
  const stageCaptionText = document.getElementById('stage-caption-text');
  const hotspots = document.querySelectorAll('.hotspot');
  const compareRangeInput = document.getElementById('compare-range-input');
  const compareDividerLine = document.getElementById('compare-divider-line');

  const STEP_DATA = {
    0: {
      badge: 'Fase 00 · Local Vacío',
      text: 'Recibimos tu espacio de hasta 25 m² sin equipos y planificamos la distribución.',
      zoneTarget: null,
    },
    1: {
      badge: 'Fase 01 · Zona de Trabajo',
      text: 'Instalamos hasta 3 mesones en acero inoxidable, 4 repisas aéreas y 1 lavaplatos.',
      zoneTarget: 'trabajo',
    },
    2: {
      badge: 'Fase 02 · Zona Fría',
      text: 'Sumamos refrigeración industrial: Nevera vertical y Congelador horizontal paletero.',
      zoneTarget: 'fria',
    },
    3: {
      badge: 'Fase 03 · Zona Caliente',
      text: 'Montamos Zona Caliente (Estufa, Plancha, Parrilla, Freidor y Horno). ¡Cocina 100% equipada!',
      zoneTarget: 'caliente',
    },
  };

  let currentStep = 3;
  let currentMode = 'assembly'; // 'assembly' | 'compare' | 'event'
  let isAutoPlaying = true;
  let autoPlayTimer = null;

  function setAssemblyStep(stepNum) {
    currentStep = Number(stepNum);
    if (!kitchenViewport) return;

    kitchenViewport.setAttribute('data-active-step', String(currentStep));
    if (equippedLayer) {
      equippedLayer.style.clipPath = '';
    }

    stageSteps.forEach((btn) => {
      btn.classList.toggle('active', Number(btn.dataset.step) === currentStep);
    });

    hotspots.forEach((hs) => {
      hs.classList.toggle('active', Number(hs.dataset.hotspotStep) === currentStep);
    });

    const info = STEP_DATA[currentStep];
    if (info && stageCaptionBadge && stageCaptionText) {
      stageCaptionBadge.textContent = info.badge;
      stageCaptionText.textContent = info.text;
    }
  }

  function setStageMode(mode) {
    currentMode = mode;
    if (!kitchenViewport) return;

    stageModeBtns.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.stageView === mode);
    });

    kitchenViewport.classList.toggle('mode-compare', mode === 'compare');
    kitchenViewport.classList.toggle('mode-event', mode === 'event');

    const stepperEl = document.getElementById('stage-stepper');

    if (mode === 'compare') {
      stopAutoPlay();
      if (stepperEl) stepperEl.style.opacity = '0.45';
      const val = compareRangeInput ? Number(compareRangeInput.value) : 65;
      updateCompareSlider(val);
      if (stageCaptionBadge && stageCaptionText) {
        stageCaptionBadge.textContent = 'Comparador Antes / Después';
        stageCaptionText.textContent = 'Desliza la barra naranja para transformar el local vacío en una cocina equipada.';
      }
    } else if (mode === 'event') {
      stopAutoPlay();
      if (stepperEl) stepperEl.style.opacity = '0.45';
      if (equippedLayer) equippedLayer.style.clipPath = '';
      if (stageCaptionBadge && stageCaptionText) {
        stageCaptionBadge.textContent = '🎪 Modalidad Eventos por Días';
        stageCaptionText.textContent = 'Alquila freidores, planchas, parrillas y neveras solo por los días de tu festival o feria.';
      }
    } else {
      if (stepperEl) stepperEl.style.opacity = '1';
      setAssemblyStep(currentStep);
    }
  }

  function updateCompareSlider(percent) {
    if (!equippedLayer || !compareDividerLine) return;
    equippedLayer.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
    compareDividerLine.style.left = `${percent}%`;
  }

  function startAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    isAutoPlaying = true;
    if (stagePlayToggle) stagePlayToggle.classList.remove('paused');
    if (stagePlayLabel) stagePlayLabel.textContent = 'Auto 3D';

    autoPlayTimer = setInterval(() => {
      if (currentMode !== 'assembly') return;
      const nextStep = (currentStep + 1) % 4;
      setAssemblyStep(nextStep);
    }, 3200);
  }

  function stopAutoPlay() {
    if (autoPlayTimer) clearInterval(autoPlayTimer);
    autoPlayTimer = null;
    isAutoPlaying = false;
    if (stagePlayToggle) stagePlayToggle.classList.add('paused');
    if (stagePlayLabel) stagePlayLabel.textContent = 'Pausado';
  }

  stageSteps.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentMode !== 'assembly') {
        setStageMode('assembly');
      }
      stopAutoPlay();
      setAssemblyStep(Number(btn.dataset.step));
    });
  });

  stageModeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      setStageMode(btn.dataset.stageView);
    });
  });

  if (stagePlayToggle) {
    stagePlayToggle.addEventListener('click', () => {
      if (currentMode !== 'assembly') {
        setStageMode('assembly');
      }
      if (isAutoPlaying) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });
  }

  if (compareRangeInput) {
    compareRangeInput.addEventListener('input', (e) => {
      updateCompareSlider(Number(e.target.value));
    });
  }

  hotspots.forEach((hs) => {
    hs.addEventListener('click', () => {
      stopAutoPlay();
      const step = Number(hs.dataset.hotspotStep);
      setAssemblyStep(step);
      const info = STEP_DATA[step];
      if (info && info.zoneTarget) {
        filterByZone(info.zoneTarget);
      }
    });
  });

  // Start automatic step-by-step assembly loop
  setAssemblyStep(3);
  startAutoPlay();

  // 7. Vertical Promo Video: Scroll-Triggered Playback + Auto-Audio + Persistent Mute Control
  const promoVideo = document.getElementById('promo-video');
  const promoReelCard = document.getElementById('promo-reel-card');
  const toggleSoundBtn = document.getElementById('toggle-video-sound');
  const togglePlayBtn = document.getElementById('toggle-video-play');
  const playIcon = document.getElementById('play-icon');

  // Persistent floating sound pill (visible when scrolling past the video while it plays)
  const floatingSoundPill = document.getElementById('floating-sound-pill');

  let hasStartedOnScroll = false;
  let userManuallyMuted = false;
  let isReelInView = false;
  let audioUnlockedInView = false;

  if (promoVideo) {
    promoVideo.pause();
    promoVideo.currentTime = 0;
    promoVideo.muted = true;
  }

  function syncAudioUI() {
    if (!promoVideo) return;
    const isActuallyPlayingWithSound = !promoVideo.muted && !promoVideo.paused && promoVideo.volume > 0;
    const statusText = isActuallyPlayingWithSound ? 'Desactivar audio' : 'Activar audio';

    if (toggleSoundBtn) {
      toggleSoundBtn.classList.toggle('unmuted', isActuallyPlayingWithSound);
      toggleSoundBtn.setAttribute('title', statusText);
      toggleSoundBtn.setAttribute('aria-label', statusText);
    }

    if (floatingSoundPill) {
      floatingSoundPill.classList.toggle('muted', !isActuallyPlayingWithSound);
      floatingSoundPill.setAttribute('title', statusText);
      floatingSoundPill.setAttribute('aria-label', statusText);
    }
  }

  function updateFloatingPillVisibility() {
    if (!floatingSoundPill || !promoVideo) return;
    const shouldShow = hasStartedOnScroll && !promoVideo.paused && !isReelInView;
    floatingSoundPill.classList.toggle('visible', shouldShow);
    floatingSoundPill.setAttribute('aria-hidden', String(!shouldShow));
  }

  // Only start & unmute the promo video on touch/click when the user has actually reached the video section (isReelInView === true).
  // Never play or unmute while the user is reading the top of the page.
  function activateVideoInViewOnGesture() {
    if (!promoVideo || !isReelInView || audioUnlockedInView || userManuallyMuted) return;

    if (!hasStartedOnScroll) {
      hasStartedOnScroll = true;
      promoVideo.currentTime = 0;
    }

    promoVideo.muted = false;
    promoVideo.volume = 1;
    const playPromise = promoVideo.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          audioUnlockedInView = true;
          if (playIcon) playIcon.textContent = '⏸';
          syncAudioUI();
          updateFloatingPillVisibility();
        })
        .catch(() => {
          promoVideo.muted = true;
          syncAudioUI();
        });
    }
  }

  ['pointerdown', 'touchstart', 'touchend', 'click'].forEach((evt) => {
    window.addEventListener(evt, activateVideoInViewOnGesture, { passive: true });
  });

  async function startVideoWithAudio() {
    if (!promoVideo || hasStartedOnScroll) return;
    hasStartedOnScroll = true;
    promoVideo.currentTime = 0;
    promoVideo.volume = 1;

    try {
      promoVideo.muted = false;
      await promoVideo.play();
      audioUnlockedInView = true;
      if (playIcon) playIcon.textContent = '⏸';
    } catch {
      // Browser blocked unmuted autoplay until user touches inside this section; play muted until touch in view
      promoVideo.muted = true;
      try {
        await promoVideo.play();
        if (playIcon) playIcon.textContent = '⏸';
      } catch {
        // Wait for touch gesture while in view
      }
    }
    syncAudioUI();
    updateFloatingPillVisibility();
  }

  function toggleVideoSound(e) {
    if (e) e.stopPropagation();
    if (!promoVideo) return;

    if (promoVideo.muted || promoVideo.paused) {
      hasStartedOnScroll = true;
      audioUnlockedInView = true;
      promoVideo.muted = false;
      promoVideo.volume = 1;
      userManuallyMuted = false;
      promoVideo.play().catch(() => {});
      if (playIcon) playIcon.textContent = '⏸';
    } else {
      promoVideo.muted = true;
      userManuallyMuted = true;
    }
    syncAudioUI();
    updateFloatingPillVisibility();
  }

  function toggleVideoPlay(e) {
    if (e) e.stopPropagation();
    if (!promoVideo) return;
    if (promoVideo.paused) {
      promoVideo.play().catch(() => {});
      if (playIcon) playIcon.textContent = '⏸';
    } else {
      promoVideo.pause();
      if (playIcon) playIcon.textContent = '▶';
    }
    syncAudioUI();
    updateFloatingPillVisibility();
  }

  const videoScrubber = document.getElementById('promo-video-scrubber');
  const videoTimeLabel = document.getElementById('promo-video-time');
  let isScrubbing = false;

  function formatVideoTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function syncVideoTimeline() {
    if (!promoVideo) return;
    const duration = Number.isFinite(promoVideo.duration) && promoVideo.duration > 0 ? promoVideo.duration : 30;
    const current = promoVideo.currentTime || 0;
    const pct = Math.min(100, Math.max(0, (current / duration) * 100));

    if (videoScrubber && !isScrubbing) {
      videoScrubber.value = String(pct);
      videoScrubber.style.setProperty('--seek-pct', `${pct}%`);
    }
    if (videoTimeLabel) {
      videoTimeLabel.textContent = `${formatVideoTime(current)} / ${formatVideoTime(duration)}`;
    }
  }

  if (videoScrubber && promoVideo) {
    const startScrub = (e) => {
      e.stopPropagation();
      isScrubbing = true;
    };
    const endScrub = (e) => {
      e.stopPropagation();
      isScrubbing = false;
    };
    videoScrubber.addEventListener('pointerdown', startScrub);
    videoScrubber.addEventListener('touchstart', startScrub, { passive: true });
    videoScrubber.addEventListener('pointerup', endScrub);
    videoScrubber.addEventListener('touchend', endScrub);
    videoScrubber.addEventListener('click', (e) => e.stopPropagation());

    videoScrubber.addEventListener('input', (e) => {
      e.stopPropagation();
      const duration = Number.isFinite(promoVideo.duration) && promoVideo.duration > 0 ? promoVideo.duration : 30;
      const pct = parseFloat(videoScrubber.value) || 0;
      const targetTime = (pct / 100) * duration;
      promoVideo.currentTime = targetTime;
      videoScrubber.style.setProperty('--seek-pct', `${pct}%`);
      if (videoTimeLabel) {
        videoTimeLabel.textContent = `${formatVideoTime(targetTime)} / ${formatVideoTime(duration)}`;
      }
    });

    videoScrubber.addEventListener('change', (e) => {
      e.stopPropagation();
      isScrubbing = false;
    });
  }

  if (promoVideo) {
    promoVideo.addEventListener('volumechange', syncAudioUI);
    promoVideo.addEventListener('play', syncAudioUI);
    promoVideo.addEventListener('pause', syncAudioUI);
    promoVideo.addEventListener('timeupdate', syncVideoTimeline);
    promoVideo.addEventListener('loadedmetadata', syncVideoTimeline);
  }

  if (promoReelCard && promoVideo && 'IntersectionObserver' in window) {
    const reelObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isReelInView = entry.isIntersecting;
          if (entry.isIntersecting && !hasStartedOnScroll) {
            startVideoWithAudio();
          }
          updateFloatingPillVisibility();
        });
      },
      { threshold: 0.35 }
    );
    reelObserver.observe(promoReelCard);
  }

  if (toggleSoundBtn) toggleSoundBtn.addEventListener('click', toggleVideoSound);
  if (floatingSoundPill) floatingSoundPill.addEventListener('click', toggleVideoSound);
  if (togglePlayBtn) togglePlayBtn.addEventListener('click', toggleVideoPlay);
  if (promoVideo) promoVideo.addEventListener('click', toggleVideoSound);

  // 8. Interactive Client Logos <-> Testimonials Spotlight (Idea 1 + Idea 3)
  const clientPills = document.querySelectorAll('.client-pill');
  const testimonialCards = document.querySelectorAll('.testimonial-card[data-testimonial-brand]');

  function highlightBrand(brandSlug) {
    testimonialCards.forEach((card) => {
      card.classList.toggle('spotlight', card.dataset.testimonialBrand === brandSlug);
    });
    clientPills.forEach((pill) => {
      pill.classList.toggle('active', pill.dataset.clientBrand === brandSlug);
    });
  }

  function clearBrandHighlight() {
    testimonialCards.forEach((card) => card.classList.remove('spotlight'));
    clientPills.forEach((pill) => pill.classList.remove('active'));
  }

  clientPills.forEach((pill) => {
    const brand = pill.dataset.clientBrand;
    pill.addEventListener('mouseenter', () => highlightBrand(brand));
    pill.addEventListener('mouseleave', clearBrandHighlight);
    pill.addEventListener('click', () => {
      highlightBrand(brand);
      const matchingCard = document.querySelector(`.testimonial-card[data-testimonial-brand="${brand}"]`);
      if (matchingCard) {
        matchingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  testimonialCards.forEach((card) => {
    const brand = card.dataset.testimonialBrand;
    card.addEventListener('mouseenter', () => highlightBrand(brand));
    card.addEventListener('mouseleave', clearBrandHighlight);
  });

  // 9. Mobile Scroll Animation for Benefits Section (Slide Left->Right + Subtle Bounce on CTA)
  const benefitScrollItems = document.querySelectorAll('#beneficios .benefit-card, #beneficios .benefits-cta-banner');
  if (benefitScrollItems.length > 0 && 'IntersectionObserver' in window) {
    benefitScrollItems.forEach((el) => el.classList.add('mobile-scroll-card'));

    const benefitObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
          } else if (entry.boundingClientRect.top > 0) {
            // Reset only when element is below the viewport so scrolling down replays the entrance smoothly
            entry.target.classList.remove('is-visible');
          }
        });
      },
      {
        threshold: 0.16,
        rootMargin: '0px 0px -24px 0px',
      }
    );

    benefitScrollItems.forEach((el) => benefitObserver.observe(el));
  }

  // Initial sync
  syncSelectionUI();
});
