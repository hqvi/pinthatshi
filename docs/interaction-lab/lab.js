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

document.getElementById('completion-depth').addEventListener('change', (event) => {
  document.querySelectorAll('[data-completion-map]').forEach((image, index) => {
    image.src = event.target.checked ? 'assets/south-america.svg' : 'assets/south-america-flat.svg';
    image.alt = `${index ? 'Postcard snapshot of the' : 'Illustrative'} completed South America map${event.target.checked ? ' with a hard red offset edge' : ' without the raised edge'}`;
  });
});

const flagNames = { br: 'Brazil', mx: 'Mexico', es: 'Spain', ph: 'Philippines' };
let flagCountry = 'br';
const flagMapImage = document.getElementById('country-flag-map');
const flagMapScene = flagMapImage.parentElement;

function flagMapReady() {
  if (!flagMapImage.complete || !flagMapImage.naturalWidth) return;
  flagMapImage.dataset.loaded = 'true';
  flagMapScene.setAttribute('aria-busy', 'false');
  delete flagMapScene.dataset.failed;
  const name = flagNames[flagCountry];
  const possessive = name.endsWith('s') ? `${name}'` : `${name}'s`;
  document.getElementById('flag-map-status').textContent = document.getElementById('flag-on-map').checked
    ? `${possessive} flag is displayed inside its country shape.`
    : `${name} is highlighted. Turn on the fill to preview its flag inside the shape.`;
}

flagMapImage.addEventListener('load', flagMapReady);
flagMapImage.addEventListener('error', () => {
  flagMapImage.dataset.loaded = 'false';
  flagMapScene.setAttribute('aria-busy', 'false');
  flagMapScene.dataset.failed = 'true';
  document.getElementById('flag-map-status').textContent = 'Map preview did not load. The complete flag is still available beside it.';
});
flagMapReady();

function updateFlagMap() {
  const name = flagNames[flagCountry];
  const possessive = name.endsWith('s') ? `${name}'` : `${name}'s`;
  const filled = document.getElementById('flag-on-map').checked;
  const image = document.getElementById('country-flag-map');
  flagMapScene.setAttribute('aria-busy', 'true');
  delete flagMapScene.dataset.failed;
  image.dataset.loaded = 'false';
  image.src = `assets/flag-maps/${flagCountry}-${filled ? 'flag' : 'outline'}.svg`;
  image.alt = filled ? `${possessive} clean flag clipped inside its country outline, with neighboring countries visible`
    : `${name} highlighted on the map, with neighboring countries visible`;
  document.getElementById('flag-map-name').textContent = name;
  const reference = document.getElementById('map-reference-flag');
  reference.src = `assets/flags/${flagCountry}.svg`;
  reference.alt = `Complete ${name} flag`;
  document.getElementById('flag-map-status').textContent = `Loading ${name} map preview…`;
  document.querySelectorAll('[data-map-country]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mapCountry === flagCountry));
  });
}

document.querySelectorAll('[data-map-country]').forEach((button) => {
  button.addEventListener('click', () => {
    flagCountry = button.dataset.mapCountry;
    updateFlagMap();
  });
});
document.getElementById('flag-on-map').addEventListener('change', updateFlagMap);
