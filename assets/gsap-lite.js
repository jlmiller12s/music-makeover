// Lightweight local GSAP-style helper for this static site.
window.gsap = (function () {
  const defaultEase = 'cubic-bezier(.22, 1, .36, 1)';

  function toArray(targets) {
    if (!targets) return [];
    if (typeof targets === 'string') return Array.from(document.querySelectorAll(targets));
    if (targets instanceof Element) return [targets];
    return Array.from(targets).filter((item) => item instanceof Element);
  }

  function stateFor(element) {
    if (!element.__gsapLite) element.__gsapLite = { y: 0, scale: 1 };
    return element.__gsapLite;
  }

  function applyTransform(element) {
    const state = stateFor(element);
    element.style.transform = `translate3d(0, ${state.y}px, 0) scale(${state.scale})`;
  }

  function applyProps(element, props) {
    const state = stateFor(element);
    if (props.opacity !== undefined) element.style.opacity = props.opacity;
    if (props.y !== undefined) state.y = Number(props.y) || 0;
    if (props.scale !== undefined) state.scale = Number(props.scale) || 1;
    if (props.y !== undefined || props.scale !== undefined) applyTransform(element);
  }

  function clearProps(element, clearProps) {
    if (!clearProps) return;
    const props = String(clearProps).split(',').map((item) => item.trim());
    if (props.includes('transform')) element.style.transform = '';
    if (props.includes('opacity')) element.style.opacity = '';
    if (props.includes('willChange')) element.style.willChange = '';
  }

  function animate(targets, props) {
    const elements = toArray(targets);
    const duration = Number(props.duration ?? 0.6);
    const delay = Number(props.delay ?? 0);
    const stagger = Number(props.stagger ?? 0);
    const ease = props.ease ? defaultEase : defaultEase;

    elements.forEach((element, index) => {
      const itemDelay = delay + (stagger * index);
      window.setTimeout(() => {
        element.style.willChange = 'opacity, transform';
        element.style.transition = `opacity ${duration}s ${ease}, transform ${duration}s ${ease}`;
        applyProps(element, props);

        window.setTimeout(() => {
          clearProps(element, props.clearProps);
          element.style.transition = '';
          element.style.willChange = '';
        }, (duration * 1000) + 80);
      }, itemDelay * 1000);
    });
  }

  return {
    registerPlugin() {},
    set(targets, props) {
      toArray(targets).forEach((element) => applyProps(element, props));
    },
    to(targets, props) {
      animate(targets, props || {});
    },
    fromTo(targets, fromProps, toProps) {
      const elements = toArray(targets);
      elements.forEach((element) => {
        element.style.transition = 'none';
        applyProps(element, fromProps || {});
      });
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => animate(elements, toProps || {}));
      });
    },
  };
}());

window.ScrollTrigger = {
  create: ({ onEnter, onLeaveBack }) => {
    const update = () => {
      if (window.scrollY > 10) {
        if (onEnter) onEnter();
      } else if (onLeaveBack) {
        onLeaveBack();
      }
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  },
};
