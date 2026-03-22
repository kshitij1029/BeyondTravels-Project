
// --- 1. ELEMENT SELECTIONS ---
const modal = document.getElementById('reviewModal');
const addressInput = document.getElementById("askplace");
const searchBtn = document.getElementById("submitplace");

// Modal Content Elements
const modalTitle = modal.querySelector('h3');
const addressResults = document.getElementById("locationinfo");
const weatherResults = document.getElementById("weatherinfo");
const imageResults = document.getElementById("apiImage");
const descResults = document.getElementById("text1");

// --- 2. MAP INITIALIZATION ---
// Initialize map once on page load
const map = L.map('map').setView([28.6139, 77.2090], 10); // Default to Delhi
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

let currentMarker = null;

// --- 3. MODAL CONTROL FUNCTIONS ---
function showThis() {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Fix: Leaflet maps need a resize trigger when shown inside a hidden container
    setTimeout(() => {
        map.invalidateSize();
    }, 400);
}

function closeThis() {
    modal.classList.add('hidden');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// --- 4. MAIN SEARCH LOGIC ---
searchBtn.addEventListener("click", () => {
    const address = addressInput.value.trim();
    if (address) {
        // Update Modal Title Immediately
        modalTitle.innerText = address.toUpperCase();
        getCoordinates(address);
    } else {
        alert("Please enter a place name.");
    }
});

// Allow "Enter" key to trigger search
addressInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") searchBtn.click();
});

// --- 5. DATA FETCHING FUNCTIONS ---

async function getCoordinates(address) {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.length > 0) {
            const place = data[0];
            const lat = parseFloat(place.lat);
            const lon = parseFloat(place.lon);
            const actualAddress = place.display_name;

            // Trigger all updates
            updateMap(lat, lon, actualAddress);
            getWeather(lat, lon);
            getImage(address); // Use raw input for better image search
            getDescription(address, lat, lon);
            
            // Show the modal
            showThis();
        } else {
            alert("Location not found. Try a different name.");
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
}

function updateMap(lat, lon, actualAddress) {
    addressResults.innerHTML = `
        <p class="text-sm"><strong>Full Address:</strong> ${actualAddress}</p>
        <p class="text-xs text-gray-400 mt-1">Coords: ${lat.toFixed(4)}, ${lon.toFixed(4)}</p>
    `;

    map.setView([lat, lon], 12);
    if (currentMarker) map.removeLayer(currentMarker);
    currentMarker = L.marker([lat, lon]).addTo(map);
}

async function getWeather(lat, lon) {
    const apiKey = '1d8c9adaa8467953df3e18ab04fa1f0d';
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
        function getBestTimeSummary(data) {
            const month = new Date().getMonth(); // 0-11
            const temp = data.main.temp;
            
            if (temp > 20 && temp < 28) {
                return "Now is actually one of the best times to visit! The temperatures are ideal for sightseeing and outdoor exploration without the peak summer heat.";
            } else {
                return `While today is ${data.weather[0].description}, the peak visiting window is usually between April and June for the most stable and pleasant conditions.`;
            }
        }
        
        weatherResults.innerHTML = `
            <div class="flex items-center gap-8 bg-gray-800/50  rounded-xl">
                <div class="flex items-center">
                    <img src="${iconUrl}" class="w-12 h-12" alt="icon">
                    <div>
                        <span class="text-2xl font-bold text-white">${data.main.temp.toFixed(1)}°C</span>
                        <p class="text-gray-400 text-sm capitalize">${data.weather[0].description}</p>
                    </div>
                </div>
                <div class="ml-auto text-right text-xs text-gray-400">
                    <p class="text-[16px]"><b>Humidity:</b> ${data.main.humidity}%</p>
                    <p class="text-[16px]"><b>Wind:</b> ${data.wind.speed} m/s</p>
                </div>
            </div>
            <div class=" p-4 rounded-xl">
                <h4 class="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Travel Insight</h4>
                <p class="text-gray-200 text-sm leading-relaxed">
                    ${getBestTimeSummary(data)}
                </p>
            </div>
        `;
    } catch (error) {
        weatherResults.innerHTML = "Weather data unavailable.";
    }
}

async function getImage(query) {
    const unsplashKey = "U0uXSt68ZS8fjwxqYOEwFkpHy98lCnOkas_1pPlSpfg";
    
    // 1. Get references to the new DOM elements
    const mainImage = document.getElementById('main-image-display');
    const loader = document.getElementById('image-loader');
    const thumbContainer = document.getElementById('thumb-container');
    
    // 2. Clear existing gallery content and show loader
    thumbContainer.innerHTML = ''; 
    mainImage.classList.add('opacity-0');
    if(loader) loader.classList.remove('hidden');

    // 3. Request 8 images for the gallery
    const apiUrl = `https://api.unsplash.com/search/photos?per_page=8&query=${encodeURIComponent(query)}&client_id=${unsplashKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            
            // --- A. Handle Main Image (Show the first result) ---
            const firstPhoto = data.results[0];
            mainImage.src = firstPhoto.urls.regular;
            
            // Fade in main image once loaded
            mainImage.onload = () => {
                mainImage.classList.remove('opacity-0');
                if(loader) loader.classList.add('hidden');
            };

            // --- B. Handle Thumbnails (Loop through all results) ---
            data.results.forEach((photo, index) => {
                
                // Create thumbnail element using Tailwind for styling
                const thumb = document.createElement('img');
                thumb.src = photo.urls.small; // Use smaller image for fast loading
                thumb.alt = `Thumbnail ${index + 1}`;
                
                // Tailwind classes for thumbnails: fixed size, object-cover, rounded, interactivity
                thumb.className = "w-20 h-20 object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-indigo-500 transition-all flex-shrink-0";
                
                // Highlight the first thumbnail as active initially
                if (index === 0) {
                    thumb.classList.add('border-indigo-500');
                }

                // --- C. THUMBNAIL CLICK INTERACTION ---
                thumb.addEventListener('click', function() {
                    // 1. Swap main image with fade effect
                    mainImage.classList.add('opacity-0');
                    
                    // Show loader during swap (optional)
                    if(loader) loader.classList.remove('hidden');

                    // Set timeout to match transition duration (300ms)
                    setTimeout(() => {
                        mainImage.src = photo.urls.regular;
                        // mainImage.onload handler (above) will handle fading it back in
                    }, 300);

                    // 2. Update active thumbnail styling
                    // Remove border from all thumbs in this container
                    thumbContainer.querySelectorAll('img').forEach(img => {
                        img.classList.remove('border-indigo-500');
                    });
                    // Add border to clicked thumb
                    this.classList.add('border-indigo-500');
                });

                // Add the configured thumbnail to the container
                thumbContainer.appendChild(thumb);
            });

        } else {
            // No images found
            if(loader) loader.classList.add('hidden');
            mainImage.classList.add('hidden');
            thumbContainer.innerHTML = `<div class="text-gray-500 text-sm p-2">No gallery images found.</div>`;
        }
    } catch (error) {
        console.error("Unsplash error:", error);
        if(loader) loader.classList.add('hidden');
        thumbContainer.innerHTML = `<div class="text-red-400 text-sm p-2">Error loading gallery.</div>`;
    }
}

async function getDescription(query, lat, lon) {
    descResults.innerHTML = "Finding nearby gems...";
    
    // Wikipedia API: Search for pages near coordinates and return their extracts (descriptions)
    // gscoord: lat|lon, gsradius: 10km, prop: extracts (one line only)
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro&explaintext&exsentences=1&generator=geosearch&ggscoord=${lat}|${lon}&ggsradius=10000&ggslimit=5&origin=*`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        let htmlContent = `<div class="space-y-4">`;

        if (data.query && data.query.pages) {
            const pages = Object.values(data.query.pages);
            
            pages.forEach(place => {
                // Skip the main destination if it appears in nearby results
                if (place.title.toLowerCase() !== query.toLowerCase()) {
                    htmlContent += `
                        <div class="group border-l-2 border-indigo-500/30 pl-4 py-1 hover:border-indigo-500 transition-all">
                            <h5 class="text-white font-bold text-sm group-hover:text-indigo-400 transition-colors">
                                <i class="fas fa-map-pin mr-2 text-[10px]"></i>${place.title}
                            </h5>
                            <p class="text-gray-400 text-[12px] leading-relaxed mt-1">
                                ${place.extract}
                            </p>
                        </div>`;
                }
            });
        } else {
            htmlContent += `<p class="text-gray-500 text-xs italic">No specific tourist attractions found within 10km.</p>`;
        }

        htmlContent += `</div>`;
        descResults.innerHTML = htmlContent;

    } catch (error) {
        console.error("Wikipedia Attractions Error:", error);
        descResults.innerHTML = "<p class='text-red-400 text-xs'>Unable to load local attractions.</p>";
    }
}