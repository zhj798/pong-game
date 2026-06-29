// API Configuration
const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const suggestionsDiv = document.getElementById('suggestions');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const weatherContent = document.getElementById('weatherContent');
const welcomeMessage = document.getElementById('welcome');
const exampleBtns = document.querySelectorAll('.example-btn');

// State
let selectedCity = null;

// Event Listeners
searchBtn.addEventListener('click', searchWeather);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
searchInput.addEventListener('input', handleSearchInput);
exampleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        searchInput.value = btn.dataset.city;
        searchWeather();
    });
});

// Debounce function for search
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Handle search input with autocomplete
const handleSearchInput = debounce(async () => {
    const query = searchInput.value.trim();
    if (query.length < 2) {
        suggestionsDiv.innerHTML = '';
        return;
    }

    try {
        const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            suggestionsDiv.innerHTML = data.results
                .map(result => `
                    <div class="suggestion-item" onclick="selectCity('${result.name}', ${result.latitude}, ${result.longitude})">
                        <strong>${result.name}</strong>, ${result.admin1 || ''} ${result.country}
                    </div>
                `)
                .join('');
        } else {
            suggestionsDiv.innerHTML = '';
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}, 300);

// Select city from suggestions
function selectCity(cityName, latitude, longitude) {
    selectedCity = { name: cityName, latitude, longitude };
    searchInput.value = cityName;
    suggestionsDiv.innerHTML = '';
    fetchWeatherData(latitude, longitude);
}

// Search weather
async function searchWeather() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a city name');
        return;
    }

    try {
        showLoading(true);
        hideError();

        const response = await fetch(`${GEOCODING_API}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showError('City not found. Please try another name.');
            showLoading(false);
            return;
        }

        const result = data.results[0];
        selectedCity = {
            name: `${result.name}${result.admin1 ? ', ' + result.admin1 : ''}, ${result.country}`,
            latitude: result.latitude,
            longitude: result.longitude
        };

        await fetchWeatherData(result.latitude, result.longitude);
    } catch (error) {
        showError('Error searching for city. Please try again.');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Fetch weather data
async function fetchWeatherData(latitude, longitude) {
    try {
        showLoading(true);
        hideError();

        const params = new URLSearchParams({
            latitude: latitude,
            longitude: longitude,
            current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,visibility,pressure_msl',
            hourly: 'temperature_2m,precipitation_probability,weather_code,wind_speed_10m',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max',
            timezone: 'auto',
            forecast_days: 7
        });

        const response = await fetch(`${WEATHER_API}?${params}`);
        const data = await response.json();

        displayWeather(data);
        welcomeMessage.classList.add('hidden');
        weatherContent.classList.remove('hidden');
    } catch (error) {
        showError('Error fetching weather data. Please try again.');
        console.error('Error:', error);
    } finally {
        showLoading(false);
    }
}

// Display weather data
function displayWeather(data) {
    const current = data.current;
    const hourly = data.hourly;
    const daily = data.daily;

    // Location and time
    document.getElementById('locationName').textContent = selectedCity.name;
    const now = new Date(current.time);
    document.getElementById('lastUpdated').textContent = `Last updated: ${now.toLocaleString()}`;

    // Current weather
    document.getElementById('currentTemp').textContent = Math.round(current.temperature_2m);
    const weatherDescription = getWeatherDescription(current.weather_code);
    document.getElementById('weatherDescription').textContent = weatherDescription;
    document.getElementById('weatherIcon').src = getWeatherIcon(current.weather_code);

    // Weather details
    document.getElementById('windSpeed').textContent = `${Math.round(current.wind_speed_10m)} km/h`;
    document.getElementById('humidity').textContent = `${current.relative_humidity_2m}%`;
    document.getElementById('pressure').textContent = `${Math.round(current.pressure_msl)} hPa`;
    document.getElementById('visibility').textContent = `${(current.visibility / 1000).toFixed(1)} km`;
    document.getElementById('sunrise').textContent = new Date(daily.sunrise[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('sunset').textContent = new Date(daily.sunset[0]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Hourly forecast
    displayHourlyForecast(hourly);

    // Daily forecast
    displayDailyForecast(daily);
}

// Display hourly forecast
function displayHourlyForecast(hourly) {
    const hourlyForecastDiv = document.getElementById('hourlyForecast');
    hourlyForecastDiv.innerHTML = '';

    const now = new Date();
    const startIndex = new Date(hourly.time[0]).getHours();

    for (let i = 0; i < Math.min(24, hourly.time.length); i++) {
        const time = new Date(hourly.time[i]);
        const hour = time.getHours();
        const temp = hourly.temperature_2m[i];
        const weatherCode = hourly.weather_code[i];
        const precipitation = hourly.precipitation_probability[i];

        const card = document.createElement('div');
        card.className = 'hour-card';
        card.innerHTML = `
            <div class="hour-time">${time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
            <div class="hour-icon">${getWeatherEmoji(weatherCode)}</div>
            <div class="hour-temp">${Math.round(temp)}°C</div>
            <div class="hour-condition">${precipitation}% rain</div>
        `;
        hourlyForecastDiv.appendChild(card);
    }
}

// Display daily forecast
function displayDailyForecast(daily) {
    const dailyForecastDiv = document.getElementById('dailyForecast');
    dailyForecastDiv.innerHTML = '';

    for (let i = 0; i < daily.time.length; i++) {
        const date = new Date(daily.time[i]);
        const isToday = i === 0;
        const dayName = isToday ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const weatherCode = daily.weather_code[i];
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const precipitation = daily.precipitation_probability_max[i];
        const rainSum = daily.precipitation_sum[i];

        const card = document.createElement('div');
        card.className = 'day-card';
        card.innerHTML = `
            <div class="day-name">${dayName}</div>
            <div class="day-date">${dateStr}</div>
            <div class="day-icon">${getWeatherEmoji(weatherCode)}</div>
            <div class="day-temps">
                <span class="day-max">${Math.round(maxTemp)}°</span>
                <span class="day-min">${Math.round(minTemp)}°</span>
            </div>
            <div class="day-condition">${getWeatherDescription(weatherCode)}</div>
            <div class="day-rain">💧 ${precipitation}%</div>
        `;
        dailyForecastDiv.appendChild(card);
    }
}

// Get weather description from WMO code
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail'
    };
    return descriptions[code] || 'Unknown';
}

// Get weather emoji
function getWeatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code === 1 || code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if ((code >= 51 && code <= 55) || (code >= 80 && code <= 82)) return '🌧️';
    if (code >= 61 && code <= 65) return '🌧️';
    if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return '❄️';
    if (code >= 95 && code <= 99) return '⛈️';
    return '🌤️';
}

// Get weather icon URL
function getWeatherIcon(code) {
    const iconMap = {
        '0': '01d',
        '1': '02d',
        '2': '02d',
        '3': '04d',
        '45': '50d',
        '48': '50d',
        '51': '09d',
        '53': '09d',
        '55': '09d',
        '61': '10d',
        '63': '10d',
        '65': '10d',
        '71': '13d',
        '73': '13d',
        '75': '13d',
        '77': '13d',
        '80': '09d',
        '81': '10d',
        '82': '10d',
        '85': '13d',
        '86': '13d',
        '95': '11d',
        '96': '11d',
        '99': '11d'
    };
    const iconCode = iconMap[code.toString()] || '01d';
    return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
}

// UI Helpers
function showLoading(show) {
    if (show) {
        loadingDiv.classList.remove('hidden');
        weatherContent.classList.add('hidden');
        welcomeMessage.classList.add('hidden');
    } else {
        loadingDiv.classList.add('hidden');
    }
}

function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

function hideError() {
    errorDiv.classList.add('hidden');
}

// Get user's location on page load (optional)
window.addEventListener('load', () => {
    // Uncomment to enable geolocation
    /*
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                selectedCity = { name: 'Your Location', latitude, longitude };
                fetchWeatherData(latitude, longitude);
            },
            error => console.log('Geolocation not available')
        );
    }
    */
});