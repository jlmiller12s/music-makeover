// Minimal GSAP core (imported snippet) placeholder to keep local; for full features use official build.
window.gsap = (function(){
  const t=[],e={to(o,p){t.push({o,p})},set(o,p){Object.assign(o.style||o,p)}},r=()=>{};e.registerPlugin=r;return e})();
window.ScrollTrigger={create:({start, onEnter, onLeaveBack})=>{
  const s=()=>{if(window.scrollY>10){onEnter&&onEnter()} else {onLeaveBack&&onLeaveBack()}};window.addEventListener('scroll',s,{passive:true});s();}};
