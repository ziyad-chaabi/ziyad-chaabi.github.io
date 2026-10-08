(() => {
// Parcours : chronologie en chapitres. Un rail se remplit au scroll, le chapitre en cours s'allume,
// les images se dévoilent, et la devise s'écrit mot par mot.
window.ZC_PAGE = function ({ $, $$, calm }) {
  const chapters = $$('.chapter');
  if (chapters.length) {
    if (!calm) gsap.to('.ch-rail span', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.chapters', start: 'top 60%', end: 'bottom 60%', scrub: .4 } });
    chapters.forEach(ch => {
      ScrollTrigger.create({ trigger: ch, start: 'top 62%', end: 'bottom 62%', toggleClass: 'is-on' });
      if (calm) return;
      gsap.from($$('.ch-year, .ch-place, .ch-body > *', ch), { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .06, scrollTrigger: { trigger: ch, start: 'top 78%', once: true } });
      const img = $('.ch-img', ch);
      if (img) {
        gsap.fromTo(img, { clipPath: 'inset(18% 18% 18% 18%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: ch, start: 'top 75%', once: true } });
        gsap.fromTo($('img', img), { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: ch, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });
  }
  ScrollTrigger.refresh();
};
})();
