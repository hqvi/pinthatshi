const screens = ['home', 'games', 'areas', 'play', 'results'];
const descriptions = {
  home: 'Home: a map-first welcome and one clear way to start.',
  games: 'Games: find the collection and interaction you want to practice.',
  areas: 'Areas: small regions, whole continents, or the world. All remain freely accessible.',
  play: 'Play: the map takes the main stage; the prompt and progress sit beside it.',
  results: 'Results: understand the session, then replay or revisit missed places.',
};
let selectedArea = 'The World';
// Illustrative entries keep the walkthrough consistent with the selected area.
// These are not the application's geographic dataset or final coverage list.
const samplePlaces = {
  'Western Asia': ['Jordan', 'Oman', 'Yemen', 'Lebanon', 'Qatar', 'Bahrain'],
  'Central Asia': ['Kazakhstan', 'Kyrgyzstan', 'Uzbekistan', 'Tajikistan', 'Turkmenistan'],
  'Southern Asia': ['India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Maldives'],
  'Eastern Asia': ['Japan', 'Mongolia', 'China', 'South Korea', 'North Korea', 'Taiwan'],
  'South-Eastern Asia': ['Thailand', 'Vietnam', 'Philippines', 'Malaysia', 'Singapore', 'Indonesia'],
  Asia: ['Japan', 'Nepal', 'Philippines', 'Malaysia', 'Mongolia', 'India'],
  Africa: ['Kenya', 'Ghana', 'Nigeria', 'Egypt', 'Senegal', 'Namibia'],
  Europe: ['France', 'Germany', 'Italy', 'Spain', 'Norway', 'Portugal'],
  'North America': ['Canada', 'Mexico', 'United States', 'Belize', 'Cuba', 'Jamaica'],
  'South America': ['Peru', 'Chile', 'Brazil', 'Argentina', 'Colombia', 'Uruguay'],
  Oceania: ['Fiji', 'Samoa', 'New Zealand', 'Australia', 'Tonga', 'Vanuatu'],
  'The World': ['Japan', 'Kenya', 'Brazil', 'Canada', 'France', 'Philippines'],
};

function updateSampleSession() {
  const places = samplePlaces[selectedArea];
  document.querySelectorAll('[data-selected-area]').forEach((label) => {
    label.textContent = selectedArea;
  });
  document.querySelector('[data-map-scope]').textContent = selectedArea.toUpperCase();
  document.getElementById('play-title').textContent = `Find ${places[2]}`;
  const found = document.querySelector('.found-list');
  const remaining = document.querySelector('.remaining-list');
  found.replaceChildren();
  remaining.replaceChildren();
  places.forEach((place, index) => {
    const item = document.createElement('li');
    if (index < 2) {
      const dot = document.createElement('i');
      dot.className = `place-dot ${index === 0 ? 'dot-one' : 'dot-two'}`;
      dot.setAttribute('aria-hidden', 'true');
      item.append(dot, document.createTextNode(place));
      found.append(item);
    } else {
      item.textContent = place;
      remaining.append(item);
    }
  });
  const stats = document.querySelectorAll('.stat-grid strong');
  stats[0].textContent = `${places.length} / ${places.length}`;
  stats[2].textContent = `${places.length - 2} / ${places.length}`;
  const review = document.querySelector('.review-summary p');
  review.replaceChildren(
    document.createTextNode(`${places[2]} · needed a hint`),
    document.createElement('br'),
    document.createTextNode(`${places[3]} · missed on the first try`),
  );
}

function showScreen(screen, moveFocus = true) {
  const current = screens.includes(screen) ? screen : 'home';
  document.querySelectorAll('[data-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.panel !== current;
  });
  document.querySelectorAll('[data-screen]').forEach((button) => {
    if (button.dataset.screen === current) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.getElementById('screen-description').textContent = descriptions[current];
  document.getElementById('sample-results').hidden = current !== 'play';
  document.title = `pinthatshi · ${current[0].toUpperCase()}${current.slice(1)} wireframe`;
  if (moveFocus) {
    window.scrollTo({ top: 0, left: 0 });
    document.querySelector(`[data-panel="${current}"] h1`).focus({ preventScroll: true });
  }
}

function navigate(screen) {
  if (location.hash === `#${screen}`) showScreen(screen);
  else location.hash = screen;
}

document.querySelectorAll('[data-screen], [data-go]').forEach((button) => {
  button.addEventListener('click', () => navigate(button.dataset.screen || button.dataset.go));
});

document.querySelectorAll('[data-area]').forEach((button) => {
  button.addEventListener('click', () => {
    selectedArea = button.dataset.area;
    updateSampleSession();
    navigate('play');
  });
});

document.getElementById('include-areas').addEventListener('change', (event) => {
  document.querySelector('[data-coverage-label]').textContent = event.target.checked
    ? 'Countries & Areas'
    : 'Countries';
});

window.addEventListener('hashchange', () => {
  // Let the native skip link reach the current screen without switching to Home.
  if (location.hash !== '#screens') showScreen(location.hash.slice(1));
});
updateSampleSession();
showScreen(location.hash.slice(1), false);
