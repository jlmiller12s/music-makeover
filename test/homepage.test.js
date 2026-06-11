const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const originalHomepage = fs.readFileSync(path.join(root, 'index.homepage-original.html'), 'utf8');
const siteScript = fs.readFileSync(path.join(root, 'assets', 'site.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets', 'styles.css'), 'utf8');

test('preserves the previous homepage for rollback', () => {
  assert.match(originalHomepage, /Music Coaching for:/);
  assert.doesNotMatch(originalHomepage, /Revive the Sound\. Restore the Purpose\./);
});

test('homepage presents the new journey layout and CTAs', () => {
  [
    'Revive the Sound. Restore the Purpose.',
    'Find My Music Makeover',
    'View Services',
    'Choose Your Path',
    'Private Coaching',
    'Worship Team Support',
    'Choir & Ensemble Coaching',
    'Program Intensives',
    'What Kind of Music Makeover Do You Need?',
    'Start the Quiz',
    'Share Your Need',
    'Get Clarity',
    'Start the Makeover',
    'Grow With Purpose',
    'This Is For You If',
    'Sound + Strategy',
    'Purposeful Growth',
    'Meet Ashley',
    'More Than Technique',
    'Your next level does not have to feel unclear.',
    'Find My Next Step',
  ].forEach((copy) => assert.match(homepage, new RegExp(escapeRegExp(copy))));
});

test('homepage has tasteful GSAP reveal hooks and card hover motion', () => {
  [
    'data-gsap="hero"',
    'data-gsap-stagger',
    'data-gsap-section',
  ].forEach((hook) => assert.match(homepage, new RegExp(escapeRegExp(hook))));

  assert.match(siteScript, /wireGsapAnimations/);
  assert.match(siteScript, /gsap\.fromTo/);
  assert.match(siteScript, /prefers-reduced-motion:\s*reduce/);
  assert.match(styles, /\.path-card:hover/);
  assert.match(styles, /\.path-card:hover\s+\.service-icon/);
  assert.match(styles, /box-shadow:\s*0 18px 42px rgba\(17, 17, 17, \.12\)/);
  assert.match(styles, /transform:\s*translateY\(-4px\)/);
  assert.match(styles, /transform:\s*scale\(1\.08\)/);
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
