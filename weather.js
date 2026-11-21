const API_BASE = 'https://api.open-meteo.com/v1/forecast';
const GEOCODING_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
const $ = (selector) => document.querySelector(selector);
const searchForm = $('#searchForm');
const citySearch = $('#citySearch');
const statusMessage = $('#statusMessage');
const unitButtons = document.querySelectorAll('.unit-button');
let temperatureUnit = 'celsius';
let currentPlace = { name: 'Nairobi', latitude: -1.2864, longitude: 36.8172, country: 'Kenya' };
let weatherData = null;

const weatherDescriptions = {
  0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'], 3: ['Overcast', '☁️'],
  45: ['Foggy', '🌫️'], 48: ['Rime fog', '🌫️'], 51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
  56: ['Freezing drizzle', '🌧️'], 57: ['Heavy freezing drizzle', '🌧️'], 61: ['Light rain', '🌦️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '🌧️'],
  66: ['Freezing rain', '🌧️'], 67: ['Heavy freezing rain', '🌧️'], 71: ['Light snow', '🌨️'], 73: ['Snow', '🌨️'], 75: ['Heavy snow', '❄️'],
  77: ['Snow grains', '🌨️'], 80: ['Rain showers', '🌦️'], 81: ['Showers', '🌧️'], 82: ['Heavy showers', '⛈️'], 85: ['Snow showers', '🌨️'],
  86: ['Heavy snow showers', '❄️'],  sleet: ['Wintry mix', '🌨️'], 95: ['Thunderstorm', '⛈️'], 96: ['Thunderstorm with hail', '⛈️'], 99: ['Heavy thunderstorm', '⛈️'],
};

function describeWeather(code) {
  return weatherDescriptions[code] || ['Variable conditions', '🌥️'];
}
function temperature(value) {
  if (value == null || Number.isNaN(Number(value))) return '--°';
  const converted = temperatureUnit === 'fahrenheit' ? Number(value) * 9 / 5 + 32 : Number(value);
  return `${Math.round(converted)}°`;
}
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
  statusMessage.hidden = !message;
}
function displayTime(time) {
  if (!time) return '--';
  const [hourText, minute] = time.slice(11, 16).split(':');
  const hour = Number(hourText);
  return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
}
function displayDay(date, index) {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}
function renderWeather() {
  if (!weatherData) return;
  const { current, hourly, daily, current_units: units, timezone } = weatherData;
  $('#cityName').textContent = [currentPlace.name, currentPlace.admin1].filter(Boolean).join(', ');
  $('#currentDate').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  const [description, icon] = describeWeather(current.weather_code);
  $('#currentIcon').textContent = icon;
  $('#currentTemperature').textContent = temperature(current.temperature_2m);
  $('#currentCondition').textContent = description;
  $('#feelsLike').textContent = `Feels like ${temperature(current.apparent_temperature)}`;
  $('#humidity').textContent = `${Math.round(current.relative_humidity_2m)}%`;
  const wind = temperatureUnit === 'fahrenheit' ? `${Math.round(current.wind_speed_10m * 0.621371)} mph` : `${Math.round(current.wind_speed_10m)} km/h`;
  $('#windSpeed').textContent = wind;
  $('#precipitation').textContent = `${Number(current.precipitation).toFixed(1)} mm`;
  $('#uvIndex').textContent = Number(current.uv_index ?? 0).toFixed(1);
  $('#timezoneLabel').textContent = timezone?.replaceAll('_', ' ') || 'Local time';

  const nowIndex = Math.max(0, hourly.time.findIndex((time) => time >= current.time));
  const hourlyMarkup = hourly.time.slice(nowIndex, nowIndex + 8).map((time, offset) => {
    const index = nowIndex + offset;
    const [, hourlyIcon] = describeWeather(hourly.weather_code[index]);
    return `<article class="hour-card"><span class="hour-time">${offset === 0 ? 'Now' : displayTime(time)}</span><span class="hour-icon" aria-hidden="true">${hourlyIcon}</span><strong class="hour-temp">${temperature(hourly.temperature_2m[index])}</strong><span class="hour-rain">${Math.round(hourly.precipitation_probability[index] || 0)}% rain</span></article>`;
  }).join('');
  $('#hourlyForecast').innerHTML = hourlyMarkup || '<p class="skeleton">Hourly forecast unavailable.</p>';

  const lows = daily.temperature_2m_min.slice(0, 5);
  const highs = daily.temperature_2m_max.slice(0, 5);
  const minRange = Math.min(...lows);
  const maxRange = Math.max(...highs);
  $('#dailyForecast').innerHTML = daily.time.slice(0, 5).map((date, index) => {
    const [dayDescription, dayIcon] = describeWeather(daily.weather_code[index]);
    const range = Math.max(1, maxRange - minRange);
    const left = ((lows[index] - minRange) / range) * 100;
    const width = Math.max(8, ((highs[index] - lows[index]) / range) * 100);
    return `<div class="day-row"><span class="day-name">${displayDay(date, index)}</span><span class="day-icon" role="img" aria-label="${dayDescription}">${dayIcon}</span><span class="day-temperatures"><strong>${temperature(highs[index])}</strong><span class="day-low">${temperature(lows[index])}</span></span><span class="temp-bar" aria-hidden="true"><span style="left:${left}%;width:${width}%"></span></span><span class="day-rain">${Math.round(daily.precipitation_probability_max[index] || 0)}% rain</span></div>`;
  }).join('');
  $('#updatedAt').textContent = `Updated ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
}

async function getWeather(place) {
  currentPlace = place;
  showStatus('Fetching the latest forecast…');
  $('#cityName').textContent = place.name;
  $('#hourlyForecast').innerHTML = '<div class="skeleton">Loading hourly forecast…</div>';
  $('#dailyForecast').innerHTML = '<div class="skeleton">Loading daily forecast…</div>';
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,uv_index',
    hourly: 'temperature_2m,precipitation_probability,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    temperature_unit: temperatureUnit,
    wind_speed_unit: temperatureUnit === 'fahrenheit' ? 'mph' : 'kmh',
    forecast_days: '5',
    timezone: 'auto',
  });
  try {
    const response = await fetch(`${API_BASE}?${params}`);
    if (!response.ok) throw new Error('Weather service returned an error. Please try again.');
    weatherData = await response.json();
    renderWeather();
    showStatus('');
  } catch (error) {
    showStatus(error.message || 'Could not load weather. Check your internet connection and try again.', true);
    $('#hourlyForecast').innerHTML = '<div class="skeleton">Forecast unavailable. Try searching again.</div>';
    $('#dailyForecast').innerHTML = '<div class="skeleton">Forecast unavailable. Try searching again.</div>';
  }
}

async function searchCity(city) {
  if (!city.trim()) return;
  showStatus('Looking up your city…');
  try {
    const params = new URLSearchParams({ name: city.trim(), count: '1', language: 'en', format: 'json' });
    const response = await fetch(`${GEOCODING_BASE}?${params}`);
    if (!response.ok) throw new Error('Could not search for that city. Try again.');
    const result = await response.json();
    if (!result.results?.length) throw new Error(`No results found for “${city.trim()}”. Try another city name.`);
    const place = result.results[0];
    await getWeather({ name: place.name, admin1: place.admin1, country: place.country, latitude: place.latitude, longitude: place.longitude });
  } catch (error) {
    showStatus(error.message || 'City search failed. Check your connection and try again.', true);
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchCity(citySearch.value);
});
unitButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const nextUnit = button.dataset.unit;
    if (nextUnit === temperatureUnit) return;
    temperatureUnit = nextUnit;
    unitButtons.forEach((item) => {
      const selected = item === button;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    getWeather(currentPlace);
  });
});
$('#locationButton').addEventListener('click', () => {
  if (!navigator.geolocation) {
    showStatus('Location access is not available in this browser. Search for a city instead.', true);
    return;
  }
  showStatus('Finding your location…');
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => getWeather({ name: 'Your location', latitude: coords.latitude, longitude: coords.longitude }),
    () => showStatus('Could not access your location. Allow location access or search for a city.', true),
    { enableHighAccuracy: false, timeout: 10000 }
  );
});

getWeather(currentPlace);
