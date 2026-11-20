const stage = document.querySelector('.atlas-demo');
const postcard = document.querySelector('.postcard');
const map = document.querySelector('.completed-map');
const stamp = document.querySelector('.completion-stamp');
const skip = document.getElementById('skip-completion');
const status = document.getElementById('motion-status');
const reduceToggle = document.getElementById('reduce-motion');
const slowToggle = document.getElementById('slow-motion');
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const rootStyle = getComputedStyle(document.documentElement);
let generation = 0;
let activeAnimations = [];

function reduced() {
  return motionPreference.matches || reduceToggle.checked;
}

function cancelAnimations() {
  generation += 1;
  activeAnimations.forEach((animation) => animation.cancel());
  activeAnimations = [];
}

function showComplete() {
  stage.dataset.phase = 'complete';
  postcard.hidden = false;
  map.hidden = true;
  map.setAttribute('aria-hidden', 'true');
  skip.disabled = true;
  status.textContent = 'Sample postcard complete. Replay the reveal or return to the map.';
}

function finishNow() {
  cancelAnimations();
  showComplete();
}

function reset() {
  const focusWasInsideCard = postcard.contains(document.activeElement);
  cancelAnimations();
  stage.dataset.phase = 'map';
  postcard.hidden = true;
  map.hidden = false;
  map.removeAttribute('aria-hidden');
  skip.disabled = true;
  status.textContent = 'Map view. Preview the end-of-session reveal.';
  if (focusWasInsideCard) document.getElementById('play-completion').focus({ preventScroll: true });
}

function animate(element, keyframes, token, options = {}) {
  const duration = parseFloat(rootStyle.getPropertyValue(token)) * (slowToggle.checked ? 3 : 1);
  const animation = element.animate(keyframes, {
    duration,
    easing: rootStyle.getPropertyValue('--ease-out').trim(),
    fill: 'both',
    ...options,
  });
  activeAnimations.push(animation);
  return animation.finished.catch(() => undefined);
}

async function play(event) {
  // A second request during playback settles the current sequence immediately.
  if (stage.dataset.phase === 'entering') {
    finishNow();
    return;
  }
  cancelAnimations();
  stage.classList.toggle('reduced-motion', reduced());
  const currentGeneration = generation;
  const keyboardTriggered = event?.detail === 0;
  if (keyboardTriggered) {
    showComplete();
    document.getElementById('postcard-title').focus({ preventScroll: true });
    return;
  }

  postcard.hidden = false;
  map.hidden = false;
  map.setAttribute('aria-hidden', 'true');
  stage.dataset.phase = 'entering';
  skip.disabled = false;
  status.textContent = reduced() ? 'Showing the postcard with a gentle fade.' : 'Opening the postcard. You can skip the animation.';

  if (reduced()) {
    await animate(postcard, [{ opacity: 0 }, { opacity: 1 }], '--motion-fade');
  } else {
    const restTransform = getComputedStyle(postcard).transform;
    // Keep the stamp absent while the postcard enters, without layout changes.
    const hiddenStamp = stamp.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: 'both' });
    activeAnimations.push(hiddenStamp);
    const fadeMap = animate(map, [{ opacity: 1 }, { opacity: 0 }], '--motion-fade');
    await Promise.all([
      fadeMap,
      animate(postcard, [
        { transform: 'translateY(6%) rotate(-5deg) scale(.96)', opacity: 0 },
        { transform: restTransform, opacity: 1 },
      ], '--motion-completion'),
    ]);
    if (currentGeneration !== generation) return;
    hiddenStamp.cancel();
    const restStamp = getComputedStyle(stamp).transform;
    await animate(stamp, [
      { transform: 'rotate(-18deg) scale(1.6)', opacity: 0 },
      { transform: restStamp, opacity: 1 },
    ], '--motion-stamp');
  }

  if (currentGeneration !== generation) return;
  cancelAnimations();
  showComplete();
}

document.getElementById('play-completion').addEventListener('click', play);
document.getElementById('replay-postcard').addEventListener('click', play);
document.getElementById('reset-completion').addEventListener('click', reset);
document.getElementById('return-to-map').addEventListener('click', reset);
skip.addEventListener('click', finishNow);

function updateMotionPreference() {
  stage.classList.toggle('reduced-motion', reduced());
  if (reduced() && stage.dataset.phase === 'entering') finishNow();
}
reduceToggle.addEventListener('change', updateMotionPreference);
motionPreference.addEventListener('change', updateMotionPreference);
updateMotionPreference();

const flagCards = [...document.querySelectorAll('[data-flag]')];

function renderFlag(card) {
  const source = card.querySelector('.source-flag');
  if (!source.complete || !source.naturalWidth) return;
  const targetHeight = Number(document.querySelector('[name="flag-detail"]:checked').value);
  const numerator = Number(card.dataset.numerator);
  const denominator = Number(card.dataset.denominator);
  // Multiples of the ratio's denominator retain the original flag proportions.
  const units = Math.max(1, Math.round(targetHeight / denominator));
  const canvas = card.querySelector('canvas');
  canvas.width = numerator * units;
  canvas.height = denominator * units;
  const context = canvas.getContext('2d');
  if (!context) {
    card.querySelector('.grid-description').textContent = 'Canvas unavailable. Use the full-detail reference.';
    return;
  }
  context.imageSmoothingEnabled = false;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const available = Math.max(1, canvas.parentElement.clientWidth - 26);
  const scale = Math.max(1, Math.min(Math.floor(available / canvas.width), Math.floor(160 / canvas.height)));
  canvas.style.width = `${canvas.width * scale}px`;
  canvas.style.height = `${canvas.height * scale}px`;
  // Compare source and pixel treatment at the same physical display size.
  source.style.width = canvas.style.width;
  source.style.height = canvas.style.height;
  card.querySelector('.grid-description').textContent = `${canvas.width} × ${canvas.height} source pixels · ${scale}× display`;
  canvas.setAttribute('aria-label', `${card.querySelector('h3').textContent} flag, ${canvas.width} by ${canvas.height} pixel comparison`);
  card.dataset.gridWidth = canvas.width;
  card.dataset.gridHeight = canvas.height;
  card.dataset.displayScale = scale;
}

flagCards.forEach((card) => {
  const image = card.querySelector('.source-flag');
  image.addEventListener('load', () => renderFlag(card));
  image.addEventListener('error', () => {
    card.querySelector('.grid-description').textContent = 'Flag source did not load. Check the local asset.';
  });
  renderFlag(card);
});
document.querySelectorAll('[name="flag-detail"]').forEach((input) => {
  input.addEventListener('change', () => flagCards.forEach(renderFlag));
});
const flagResizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => renderFlag(entry.target.closest('[data-flag]')));
});
flagCards.forEach((card) => flagResizeObserver.observe(card.querySelector('.pixel-stage')));
