import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getDatabase, ref, onValue, query, limitToLast } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-database.js";
import { getAuth,onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCq4lH4tj4AS9-cqvM29um--Nu4v2UdvZw",
  authDomain: "agriknows-data.firebaseapp.com",
  databaseURL: "https://agriknows-data-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agriknows-data",
  storageBucket: "agriknows-data.firebasestorage.app",
  messagingSenderId: "922008629713",
  appId: "1:922008629713:web:5cf15ca9d47036b9a8f0f0"
};

//-------------------------------------Firebase Initialization--------------------

// Initialize Firebase
const app =initializeApp (firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);


function preventBack() {
    window.history.forward();
}
setTimeout(preventBack, 0); 
window.onunload = function () {
};
//-------------------------------------Global Variables let---------------------------
let devices = [];
let currentPumpStatus = 'off';
let deviceIdCounter = 1;
// **NEW**: Global object to hold all crop data (predefined + custom)
let allCropData = {};
// **NEW**: Variable to track the currently selected crop key
let currentCropKey = null;
let latestHistoryData = []; // Store data for graphs
let chartInstances = {};    // Store Chart.js instances to manage updates

// Crop data with optimal environmental conditions (Predefined part)
const PREDEFINED_CROP_DATA = {
    corn: {
        name: "Corn",
        temperature: { min: 18, max: 30 },
        moisture: { min: 50, max: 70 },
        ph: { min: 5.8, max: 7.0 },
        humidity: { min: 50, max: 70 },
    },
    rice: {
        name: "Rice",
        temperature: { min: 20, max: 35 },
        moisture: { min: 70, max: 90 },
        ph: { min: 5.0, max: 6.5 },
        humidity: { min: 70, max: 85 },
    },
    eggplant: {
        name: "Eggplant",
        temperature: { min: 20, max: 30 },
        moisture: { min: 60, max: 80 },
        ph: { min: 5.5, max: 6.8 },
        humidity: { min: 50, max: 70 },
    },
    tomato: {
        name: "Tomato",
        temperature: { min: 18, max: 27 },
        moisture: { min: 60, max: 80 },
        ph: { min: 5.5, max: 6.8 },
        humidity: { min: 65, max: 85 },
    },
    onion: {
        name: "Onion",
        temperature: { min: 15, max: 30 },
        moisture: { min: 60, max: 80 },
        ph: { min: 6.0, max: 7.0 },
        humidity: { min: 50, max: 70 },
    }
};

document.addEventListener('DOMContentLoaded', function () {
   initDashboard();
});


onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, so we can now safely call the function
        console.log("User is signed in. Fetching data...");
        listenToFirebaseData();
    } else {
        // User is signed out. Redirect to login page or display a message.
        console.log("User is signed out. Redirecting...");
        // Example: window.location.replace('/pages/login.html');
        // You can leave this out if your login page handles the unauthenticated state.
    }
});

// ---- CHECK SENSOR VALUES AGAINST CROP THRESHOLD ----
function checkThresholdAndNotify(sensorData) {
    if (!currentCropKey || !allCropData[currentCropKey]) return;

    const crop = allCropData[currentCropKey];

    const temp = sensorData.temperature || 0;
    const moisture = sensorData.moisture || sensorData.soilMoisture || 0;
    const humidity = sensorData.humidity || 0;
    const ph = sensorData.ph || sensorData.ph_level || sensorData.pH || 0;

    // Temperature Alert
    if (temp < crop.temperature.min) {
        showPopup(`Ang temperatura ay mababa para sa ${crop.name}: <b>${temp}°C</b>`);
    } 
    else if (temp > crop.temperature.max) {
        showPopup(`Ang temperatura ay mataas para sa ${crop.name}: <b>${temp}°C</b>`);
    }

    // Moisture Alert
    if (moisture < crop.moisture.min) {
        showPopup(`Ang moisture ay mababa para sa ${crop.name}: <b>${moisture}%</b>`);
    } 
    else if (moisture > crop.moisture.max) {
        showPopup(`Ang moisture ay mataas para sa ${crop.name}: <b>${moisture}%</b>`);
    }

    // Humidity Alert
    if (humidity < crop.humidity.min) {
        showPopup(`Ang humidity ay mababa para sa ${crop.name}: <b>${humidity}%</b>`);
    } 
    else if (humidity > crop.humidity.max) {
        showPopup(`Ang humidity ay mataas para sa ${crop.name}: <b>${humidity}%</b>`);
    }

    // pH Alert
    if (ph < crop.ph.min) {
        showPopup(`Ang pH level ay mababa para sa ${crop.name}: <b>${ph}</b>`);
    } 
    else if (ph > crop.ph.max) {
        showPopup(`Ang pH level ay mataas para sa ${crop.name}: <b>${ph}</b>`);
    }
}

//--------------------------------------------------------------------------------------------

//----------------------------------------KASALUKUYANG STATUS------------------------------- 



/**
 * Updates the current reading cards on the dashboard with the latest data.
 * @param {Object} sensorData - The full object of sensor readings from Firebase.
 */
function updateCurrentReadings(sensorData) {
    if (!sensorData) {
        console.log("No data available to update current readings.");
        return;
    }

    // --- 1. Get Data Values ---
    // Handle cases where keys might be lowercase or capitalized based on your previous file usage
    const temp = sensorData.temperature || 0;
    const moisture = sensorData.moisture || sensorData.soilMoisture || 0;
    const humidity = sensorData.humidity || 0;
    const ph = sensorData.ph || sensorData.ph_level || sensorData.pH || 0;
    const light = sensorData.light || sensorData.light_status || 0;

    // --- 2. Update Numeric Values in HTML ---
    document.getElementById('current-temperature').textContent = `${temp} °C`;
    document.getElementById('current-soil-moisture').textContent = `${moisture}%`;
    document.getElementById('current-humidity').textContent = `${humidity}%`;
    document.getElementById('current-ph-level').textContent = `${ph} pH`;

    // --- 3. Update Text Status (The Logic) ---
    // We get the settings for the currently selected crop
    const currentCrop = allCropData[currentCropKey];

    if (currentCrop) {
        // Temperature Status
        updateStatusElement('status-temp-text', temp, currentCrop.temperature.min, currentCrop.temperature.max, "Celsius");
        // Humidity Status
        updateStatusElement('status-humidity-text', humidity, currentCrop.humidity.min, currentCrop.humidity.max, "%");
        // pH Status
        updateStatusElement('status-ph-text', ph, currentCrop.ph.min, currentCrop.ph.max, "pH");
        // Moisture Status (Reusing your specific logic or generic logic)
        updateStatusElement('status-moisture-text', moisture, currentCrop.moisture.min, currentCrop.moisture.max, "%");
    } else {
        // If no crop selected, just show "No Crop Selected"
        document.querySelectorAll('.status-message').forEach(el => {
            el.textContent = "Pumili ng Pananim";
            el.className = "status-message status-warning";
        });
    }
    // --- 4. Light Status Update ---
    // Assuming 1 = Bright/Light, 0 = Dark
    const lightText = (light == 1 || light === 'Light') ? "Maliwanag" : "Madilim";
    const lightClass = (light == 1 || light === 'Light') ? "status-good" : "status-warning";
    
    const lightEl = document.getElementById('light-status');
    const lightStatEl = document.getElementById('status-light-text');
    
    if(lightEl) lightEl.textContent = light === 1 ? "Light" : "Dark";
    if(lightStatEl) {
        lightStatEl.textContent = lightText;
        lightStatEl.className = `status-message ${lightClass}`;
    }
    // Run your existing soil status logic for the side-panel if needed
    updateSoilMoistureStatus(moisture); 
}

// ---------------------Helper Function to Determine Status--------------------
function updateStatusElement(elementId, value, min, max, unit) {
    const element = document.getElementById(elementId);
    if (!element) return;

    let text = "";
    let className = "status-message";

    if (value < min) {
        text = "Mababa"; // Low
        className += " status-warning";
    } else if (value > max) {
        text = "Mataas"; // High
        className += " status-danger";
    } else {
        text = "Mainam"; // Optimal/Good
        className += " status-good";
    }

    element.textContent = text;
    element.className = className;
}
//-------------------------------------Initialize Dashboard-----------------------------
function initDashboard() {
    updateCurrentDate();
    loadAllCropData(); // **MODIFIED**: Load crop data (including custom) from storage
    initializeEventListeners();
    updateSoilMoistureStatus(42);
    updateLightStatus(1); // Set initial status to Light (1)
    initializePumpControls(); // **MODIFIED**: Initializes pump state from storage
    listenToFirebaseData();
}
//--------------------------------Firebase Data------------------------------------------
function listenToFirebaseData() {
    // Use the existing 'db' instance
    const readingsRef = query(ref(db, 'sensorData'), limitToLast(20));

    // The listener that runs every time data changes
    onValue(readingsRef, (snapshot) => {
        let historyDataArray = [];
        // ... rest of your snapshot.forEach and data processing ...

        snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            data.id = childSnapshot.key; 
            historyDataArray.push(data);
        });
        
        historyDataArray.reverse(); 
        
        if (historyDataArray.length > 0) {
            const latestReading = historyDataArray[0]; 
            updateCurrentReadings(latestReading);
            updateSoilMoistureStatus(latestReading.soilMoisture); 
        } 

        updateHistoryTable(historyDataArray);
    }, (error) => {
        // This is the error handler that is now running!
        console.error("Firebase History Data Listener Error: ", error);
        // Look at the console for the *actual* error object Firebase returned!
        alert("Error fetching history data. Check console for details.");
    });
}

//-------------------------------History Table Time-------------------------------
/**
 * Formats a Firebase timestamp into a readable time string.
 * This is crucial because it includes a fix for parsing the date string.
 */
function formatTimestamp(rawTime) {
    if (!rawTime) return 'N/A';
    
    let date;
    
    if (typeof rawTime === 'string') {
        // 💡 CRITICAL: Replace space and hyphen/slash to fix date parsing issues in some browsers
        const dateStringFixed = rawTime.replace(/-/g, "/").replace(" ", "T");
        date = new Date(dateStringFixed); 
    } else {
        date = new Date(rawTime); // For numeric timestamps
    }
    
    // Fallback if parsing still fails (e.g., if rawTime is the Firebase Push ID)
    if (isNaN(date.getTime()) || date.getFullYear() < 2020) { 
        return rawTime.substring(0, 10) + '...'; 
    }

    // Format as "MM/DD/YY HH:MM:SS AM/PM"
    const options = { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit', 
        hour12: true 
    };
    return date.toLocaleString('en-US', options);
}

function updateHistoryTable(dataArray) {
    const tableBody = document.getElementById('history-data');
    if (!tableBody) {
        console.warn("Table body element with ID 'history-data' not found.");
        return; 
    }

    tableBody.innerHTML = ''; // Clear previous data

    // If dataArray is empty, the table will simply be empty.
    dataArray.forEach(data => {
        // Use the 'timestamp' from Firebase (e.g., "2025-11-26 20:13:35")
        const rawTime = data.timestamp || data.id; 
        
        // 💡 CRITICAL: If formatTimestamp is missing or buggy, the loop stops here!
        let timeString = formatTimestamp(rawTime); 

        const row = document.createElement('tr');
        
        // Inserting data into the table row using the correct Firebase keys
        row.innerHTML = `
            <td>${timeString}</td>
            <td>${data.soilMoisture || 'N/A'}%</td>  
            <td>${data.humidity || 'N/A'}%</td>                       
            <td>${data.temperature || 'N/A'}°C</td>                   
            <td>${data.light || 'N/A'}</td>                         
            <td>${data.pH || 'N/A'} pH</td>              
        `;
        tableBody.appendChild(row);
    });
}


// --- NEW: Function to update the top cards with the latest reading ---
function updateCurrentStatusCards(latestData) {
    document.querySelector('.reading-card .temperature + .value').textContent = `${latestData.temperature || 'N/A'} °C`;
    document.querySelector('.reading-card .moisture + .value').textContent = `${latestData.moisture || latestData.soilMoisture || 'N/A'} %`;
    document.querySelector('.reading-card .ph + .value').textContent = `${latestData.ph || latestData.phLevel || 'N/A'} pH`;
    document.querySelector('.reading-card .humidity + .value').textContent = `${latestData.humidity || 'N/A'}%`;
    
    // Update Soil Moisture Status Text
    updateSoilMoistureStatus(latestData.moisture || latestData.soilMoisture || 0);
    
    // Update Light Status (Assuming 1 is Light, 0 is Dark)
    const lightVal = latestData.light === 1 || latestData.light === 'Light' ? 1 : 0;
    updateLightStatus(lightVal);
}

function updateLightStatus(status) {
    const lightValueElement = document.getElementById('light-status');
    const lightOptimalElement = document.getElementById('lightOptimal');
    
    // **CRITICAL FIX**: Check if the elements exist before attempting to set properties
    if (!lightValueElement) {
        console.warn("Element 'light-status' not found for light status update.");
        return; // Exit if the main element isn't there
    }

    if (status === 0) {
        lightValueElement.textContent = 'Dark';
    } else {
        lightValueElement.textContent = 'Light';
    }
    
    // Clear the optimal text since it's no longer needed
    if (lightOptimalElement) { // <-- This check prevents the error on line 294
        lightOptimalElement.textContent = ' ';
    }
}

function updateCurrentDate() {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    document.getElementById('current-date').textContent =
        now.toLocaleDateString('en-US', options);
}



// **NEW FUNCTION** to load custom crops from localStorage
function loadAllCropData() {
    const customCropsJson = localStorage.getItem('customCrops');
    const customCrops = customCropsJson ? JSON.parse(customCropsJson) : {};
    
    // Merge predefined crops and custom crops
    allCropData = { ...PREDEFINED_CROP_DATA, ...customCrops };

    // Check if a crop was previously selected and is still valid
    const lastSelectedCropKey = localStorage.getItem('selectedCropKey');
    if (lastSelectedCropKey && allCropData[lastSelectedCropKey]) {
        setCrop(lastSelectedCropKey, allCropData[lastSelectedCropKey]);
    } else {
        // Fallback or initial state
        setCrop('none', {
            name: "No crop selected",
            temperature: { min: 0, max: 0 },
            moisture: { min: 0, max: 0 },
            ph: { min: 0, max: 0 },
            humidity: { min: 0, max: 0 },
        });
    }
}

// **NEW FUNCTION** to save custom crops to localStorage
function saveCustomCrops(customCrops) {
    localStorage.setItem('customCrops', JSON.stringify(customCrops));
    
    // Re-merge data to update the in-memory cache
    allCropData = { ...PREDEFINED_CROP_DATA, ...customCrops };
}

// **MODIFIED**: Set crop and update optimal ranges
function setCrop(cropKey, cropInfo) {
    currentCropKey = cropKey;
    localStorage.setItem('selectedCropKey', cropKey); // Save the selected crop key for persistence
    // Update crop display
    document.getElementById('currentCropName').textContent = cropInfo.name;
    document.getElementById('currentCropOptimal').textContent =
        `Optimal: Temp ${cropInfo.temperature.min}-${cropInfo.temperature.max}°C, ` +
        `Moisture ${cropInfo.moisture.min}-${cropInfo.moisture.max}%, ` +
        `pH ${cropInfo.ph.min}-${cropInfo.ph.max}`;
    // Update optimal ranges in cards
    document.getElementById('tempOptimal').textContent =
        `${cropInfo.temperature.min}-${cropInfo.temperature.max}°C`;
    document.getElementById('moistureOptimal').textContent =
        `${cropInfo.moisture.min}-${cropInfo.moisture.max}%`;
    document.getElementById('phOptimal').textContent =
        `${cropInfo.ph.min}-${cropInfo.ph.max}`;
    document.getElementById('humidityOptimal').textContent =
        `${cropInfo.humidity.min}-${cropInfo.humidity.max}%`;
}

function initializeEventListeners() {
    initializeModals();
    initializeTimeFilters();
    initializeGraphMode();
    initializeExportButton();
}

// Modal handling
function initializeModals() {

// ---  Get all modal elements ---
    const selectCropModal = document.getElementById('selectCropModal');
    const addCropModal = document.getElementById('addCropModal');
    const editDeleteCropModal = document.getElementById('editDeleteCropModal'); // **NEW**

    // --- Get buttons that open modals ---
    const selectCropBtn = document.getElementById('selectCropBtn');
    const addCropBtn = document.getElementById('addCropBtn');
    const deleteCropBtn = document.getElementById('deleteCropBtn'); // **NEW**

    // ---  Get all close buttons ---
    const closeButtons = document.querySelectorAll('.close-modal');

    // ---  Open Modals ---
    // Check if the elements exist before adding listeners
    if (selectCropBtn && selectCropModal) {
        selectCropBtn.addEventListener('click', () => {
            renderCropOptions(); // **MODIFIED**: Render crops before opening
            selectCropModal.style.display = 'flex';
        });
    }

    if (addCropBtn && addCropModal) {
        addCropBtn.addEventListener('click', () => {
            addCropModal.style.display = 'flex';
        });
    }

    // ---  Close Modals (with 'x' buttons) ---
    closeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Find the parent modal and hide it
            event.target.closest('.modal').style.display = 'none';
        });
    });

    // ---  Close Modals (by clicking outside) ---
    window.addEventListener('click', (event) => {
        if (event.target === selectCropModal) {
            selectCropModal.style.display = 'none';
        }
        if (event.target === addCropModal) {
            addCropModal.style.display = 'none';
        }
        if (event.target === editDeleteCropModal) { // **NEW**
            editDeleteCropModal.style.display = 'none';
        }
    });

    // --- Crop Selection Logic - Simplified, managed by renderCropOptions

    // ---  Confirm Crop Selection Button ---
    document.getElementById('confirmCropBtn').addEventListener('click', () => {
        // Find the currently selected crop (which now includes custom ones)
        const selectedOption = document.querySelector('#selectCropModal .crop-option.selected');
        if (selectedOption) {
            const selectedCropKey = selectedOption.getAttribute('data-crop');
            setCrop(selectedCropKey, allCropData[selectedCropKey]);
            selectCropModal.style.display = 'none'; // Hide modal
            document.querySelectorAll('#selectCropModal .crop-option').forEach(o => o.classList.remove('selected')); // Clear selection
        } else {
            alert('Please select a crop');
        }
    });

    // ---  Add Custom Crop Form ---
    document.getElementById('addCropForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const cropName = document.getElementById('customCropName').value;
        const tempMin = parseFloat(document.getElementById('tempMin').value);
        const tempMax = parseFloat(document.getElementById('tempMax').value);
        const moistureMin = parseFloat(document.getElementById('moistureMin').value);
        const moistureMax = parseFloat(document.getElementById('moistureMax').value);
        const phMin = parseFloat(document.getElementById('phMin').value);
        const phMax = parseFloat(document.getElementById('phMax').value);
        const humidityMin = parseFloat(document.getElementById('humidityMin').value);
        const humidityMax = parseFloat(document.getElementById('humidityMax').value);

        // Create custom crop object
        const customCrop = {
            name: cropName,
            temperature: { min: tempMin, max: tempMax },
            moisture: { min: moistureMin, max: moistureMax },
            ph: { min: phMin, max: phMax },
            humidity: { min: humidityMin, max: humidityMax },
            isCustom: true // Mark as custom
        };

        // **NEW LOGIC**: Generate a unique key and save the custom crop
        const customKey = 'custom_' + Date.now();
        
        const customCropsJson = localStorage.getItem('customCrops');
        let customCrops = customCropsJson ? JSON.parse(customCropsJson) : {};
        customCrops[customKey] = customCrop;
        
        saveCustomCrops(customCrops); // Save back to localStorage and update allCropData

        // Set the new custom crop as the selected one
        setCrop(customKey, customCrop);

        alert(`Custom crop "${cropName}" added and selected!`);
        document.getElementById('addCropForm').reset();
        addCropModal.style.display = 'none'; // Hide modal
    });
    
    // --- **NEW** Edit Crop Form Submission ---
    document.getElementById('editCropForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const cropKey = document.getElementById('editCropKey').value;
        const cropName = document.getElementById('editCustomCropName').value;
        const tempMin = parseFloat(document.getElementById('editTempMin').value);
        const tempMax = parseFloat(document.getElementById('editTempMax').value);
        const moistureMin = parseFloat(document.getElementById('editMoistureMin').value);
        const moistureMax = parseFloat(document.getElementById('editMoistureMax').value);
        const phMin = parseFloat(document.getElementById('editPhMin').value);
        const phMax = parseFloat(document.getElementById('editPhMax').value);
        const humidityMin = parseFloat(document.getElementById('editHumidityMin').value);
        const humidityMax = parseFloat(document.getElementById('editHumidityMax').value);

        // Update the custom crop object
        const updatedCrop = {
            name: cropName,
            temperature: { min: tempMin, max: tempMax },
            moisture: { min: moistureMin, max: moistureMax },
            ph: { min: phMin, max: phMax },
            humidity: { min: humidityMin, max: humidityMax },
            isCustom: true
        };

        const customCropsJson = localStorage.getItem('customCrops');
        let customCrops = customCropsJson ? JSON.parse(customCropsJson) : {};
        customCrops[cropKey] = updatedCrop;
        
        saveCustomCrops(customCrops);
        
        if (currentCropKey === cropKey) {
            setCrop(cropKey, updatedCrop); // Re-set the crop to update the main UI
        }
        
        alert(`Crop "${cropName}" updated successfully!`);
        editDeleteCropModal.style.display = 'none';
        renderCropOptions(); // Re-render the select crop modal
    });

    // --- **NEW** Delete Crop Button Handler ---
    deleteCropBtn.addEventListener('click', () => {
        const cropKey = document.getElementById('editCropKey').value;
        const cropName = document.getElementById('editCustomCropName').value;
        
        if (confirm(`Are you sure you want to delete the custom crop "${cropName}"? This action cannot be undone.`)) {
            const customCropsJson = localStorage.getItem('customCrops');
            let customCrops = customCropsJson ? JSON.parse(customCropsJson) : {};
            
            delete customCrops[cropKey]; // Delete from the custom crops object
            saveCustomCrops(customCrops); // Save updated list
            
            // If the deleted crop was currently selected, reset the selection
            if (currentCropKey === cropKey) {
                // Fallback to initial state
                setCrop('none', {
                    name: "No crop selected",
                    temperature: { min: 0, max: 0 },
                    moisture: { min: 0, max: 0 },
                    ph: { min: 0, max: 0 },
                    humidity: { min: 0, max: 0 },
                });
            }

            alert(`Crop "${cropName}" deleted successfully.`);
            editDeleteCropModal.style.display = 'none';
            renderCropOptions(); // Re-render the select crop modal
        }
    });
}

// **NEW FUNCTION** to render all crop options in the modal
function renderCropOptions() {
    const cropGrid = document.querySelector('#selectCropModal .crop-grid');
    cropGrid.innerHTML = ''; // Clear existing content

    // Iterate over all crops (predefined and custom)
    Object.entries(allCropData).forEach(([key, crop]) => {
        // Skip the initial 'none' crop
        if (key === 'none') return; 
        
        const isPredefined = !crop.isCustom;
        const optionDiv = document.createElement('div');
        optionDiv.className = `crop-option ${isPredefined ? '' : 'custom'}`;
        optionDiv.setAttribute('data-crop', key);
        
        // Add selected class if this crop is currently active
        if (currentCropKey === key) {
            optionDiv.classList.add('selected');
        }

        let innerHTML = `
            <i class="fas fa-seedling crop-icon-small"></i>
            <div class="crop-name-small">${crop.name}</div>
        `;
        
        // Add edit/delete button only for custom crops
        if (!isPredefined) {
            innerHTML += `
                <div class="crop-actions">
                    <button class="edit-btn" data-key="${key}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            `;
        }
        
        optionDiv.innerHTML = innerHTML;
        
        // Event listener for selecting the crop
        optionDiv.addEventListener('click', (e) => {
             // If click target is not an edit/delete button, select the crop
            if (!e.target.closest('.crop-actions button')) {
                document.querySelectorAll('#selectCropModal .crop-option').forEach(o => o.classList.remove('selected'));
                optionDiv.classList.add('selected');
            }
        });
        
        // Event listener for the Edit button
        if (!isPredefined) {
            const editBtn = optionDiv.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // Stop click from propagating to the option div
                    openEditDeleteModal(key);
                });
            }
        }

        cropGrid.appendChild(optionDiv);
    });
}

// **NEW FUNCTION** to open the edit modal
function openEditDeleteModal(cropKey) {
    const crop = allCropData[cropKey];
    const editDeleteCropModal = document.getElementById('editDeleteCropModal');
    
    if (!crop || !crop.isCustom) return; // Should only open for custom crops

    // Set the hidden key
    document.getElementById('editCropKey').value = cropKey;
    
    // Set modal title
    document.getElementById('editDeleteCropTitle').textContent = `Edit Crop: ${crop.name}`;

    // Populate form fields
    document.getElementById('editCustomCropName').value = crop.name;
    document.getElementById('editTempMin').value = crop.temperature.min;
    document.getElementById('editTempMax').value = crop.temperature.max;
    document.getElementById('editMoistureMin').value = crop.moisture.min;
    document.getElementById('editMoistureMax').value = crop.moisture.max;
    document.getElementById('editPhMin').value = crop.ph.min;
    document.getElementById('editPhMax').value = crop.ph.max;
    document.getElementById('editHumidityMin').value = crop.humidity.min;
    document.getElementById('editHumidityMax').value = crop.humidity.max;

    // Show the modal
    editDeleteCropModal.style.display = 'flex';
}

function initializeTimeFilters() {
    const timeFilters = document.querySelectorAll('.time-filter');
    timeFilters.forEach(filter => {
        filter.addEventListener('click', () => {
            timeFilters.forEach(f => f.classList.remove('active'));
            filter.classList.add('active');
            const timeRange = filter.getAttribute('data-time');
           // loadHistoryData(timeRange);
        });
    });
}

function initializeGraphMode() {
    const toggleBtn = document.getElementById('graph-mode-toggle');
    const tableView = document.getElementById('history-table');
    const graphView = document.getElementById('history-graph');

    toggleBtn.addEventListener('click', () => {
        if (tableView.classList.contains('hidden')) {
            tableView.classList.remove('hidden');
            graphView.classList.add('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-chart-bar"></i> Graph Mode';
        } else {
            tableView.classList.add('hidden');
            graphView.classList.remove('hidden');
            toggleBtn.innerHTML = '<i class="fas fa-table"></i> Table Mode';
            initializeCharts();
        }
    });
}

function initializeExportButton() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', exportData);
}

function initializePumpControls() {
    const pumpSwitch = document.getElementById('pump-switch');
    const savedStatus = localStorage.getItem('pumpStatus');
    const initialStatus = savedStatus === 'on' ? 'on' : 'off';
    

    setPumpStatus(initialStatus); 


    pumpSwitch.addEventListener('change', function () {
        setPumpStatus(this.checked ? 'on' : 'off');
    });

}


function setPumpStatus(status) {
    const pumpSwitch = document.getElementById('pump-switch');
    // *** Save state to localStorage ***
    localStorage.setItem('pumpStatus', status);
    if (status === 'on') {
        pumpSwitch.checked = true;
    } else {
        pumpSwitch.checked = false;
    }

    const message = status === 'on' ? 'Water pump turned ON' : 'Water pump turned OFF';
    // Only show notification if the change came from an active element (user click)
    if(document.activeElement === pumpSwitch) {
        showNotification(message, status);
    }
}
function showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'on' ? 'check-circle' : 'times-circle'}"></i>
        ${message}
    `;
    // Add styles for notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'on' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1001;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    document.body.appendChild(notification);
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

// Also update the loadInitialData function to initialize pump correctly:
/*function loadInitialData() {
    loadHistoryData('1h');
    // Load sample devices
    devices = [
        {
            id: 1,
            name: 'Sensor 1',
            location: 'Field A',
            crop: 'Tomato',
            cropType: 'predefined'
        },
        {
            id: 2,
            name: 'Sensor 2',
            location: 'Field B',
            crop: 'Corn',
            cropType: 'predefined'
        }
    ];
    deviceIdCounter = 3;
    
}*/
/*
function loadHistoryData(timeRange) {
    const sampleData = [
        {
            time: '10:00 AM',
            soilMoisture: '45%',
            humidity: '62%',
            temperature: '22.1°C',
           lightLevel: 'Light',
            phLevel: '6.7 pH'
        },
        {
            time: '09:45 AM',
            soilMoisture: '43%',
            humidity: '64%',
            temperature: '21.8°C',
            lightLevel: 'Light',
            phLevel: '6.8 pH'
        },
        {
            time: '09:30 AM',
            soilMoisture: '41%',
            humidity: '63%',
            temperature: '21.5°C',
            lightLevel: 'Light',
            phLevel: '6.7 pH'
        },
        { // NEW ENTRY 4
            time: '09:15 AM',
            soilMoisture: '44%',
            humidity: '65%',
            temperature: '22.3°C',
          lightLevel: 'Dark',
            phLevel: '6.9 pH'
        },
        { // NEW ENTRY 5
            time: '09:00 AM',
            soilMoisture: '42%',
            humidity: '62%',
            temperature: '22.0°C',
          lightLevel: 'Dark',
            phLevel: '6.8 pH'
        }
    ];
*/



function initializeCharts() {
    // Initialize smaller bar charts for each parameter
    initializeBarChart('soil-moisture-chart', 'Soil Moisture', [45, 43, 41, 44, 42], '#3498db');
    initializeBarChart('humidity-chart', 'Humidity', [62, 64, 63, 65, 62], '#2980b9');
    initializeBarChart('temperature-chart', 'Temperature', [22.1, 21.8, 21.5, 22.3, 22.0], '#e74c3c');
    initializeBarChart('ph-level-chart', 'pH Level', [6.7, 6.8, 6.7, 6.9, 6.8], '#9b59b6');
}
function initializeBarChart(canvasId, label, data, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5'],
            datasets: [{ label: label, data: data, backgroundColor: color + '80', borderColor: color, borderWidth: 1, borderRadius: 4 }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false }, x: { display: false } } }
    });
}
/*function initializeBarChart(canvasId, label, data, color) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['10:00', '09:45', '09:30', '09:15', '09:00'],
            datasets: [{
                label: label,
                data: data,
                backgroundColor: color + '80', // Add transparency
                borderColor: color,
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        display: true,
                        color: 'rgba(0,0,0,0.1)'
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 10
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        font: {
                            size: 11
                        },
                        boxWidth: 12
                    }
                },
                title: {
                    display: false
                }
            },
            elements: {
                bar: {
                    backgroundColor: color + '80',
                    borderColor: color,
                    borderWidth: 1
                }
            }
        }
    });
}*/
function exportData() {
    // Create CSV content
    let csvContent = "Time,Device,Soil Moisture,Humidity,Temperature,Light Level,pH Level\n";

    // Add sample data (in real app, this would be your actual data)
    const sampleData = [
        ['10:00 AM', '45%', '62%', '22.1°C', 'Light', '6.7 pH'],
        ['09:45 AM', '43%', '64%', '21.8°C', 'Light', '6.8 pH'],
        ['09:30 AM', '41%', '63%', '21.5°C', 'Light', '6.7 pH']
    ];

    sampleData.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `agriculture-data-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    alert('Data exported successfully!');
}

function updateSoilMoistureStatus(moistureLevel) {
    const statusElement = document.getElementById('soil-moisture-status');
    let status, message, className;

    if (moistureLevel < 20) {
        status = 'Sobrang tuyo';
        message = 'Kailangan agad ng Patubig';
        className = 'status-dry';
    } else if (moistureLevel < 40) {
        status = 'Tuyot';
        message = 'Kailangan ng Patubig';
        className = 'status-moderate';
    } else if (moistureLevel < 60) {
        status = 'Mainam';
        message = 'Perpektong kondition ng pag kabasa ng lupa';
        className = 'status-optimal';
    } else if (moistureLevel < 80) {
        status = 'Basa';
        message = 'Sapat na kahalumigmigan';
        className = 'status-wet';
    } else {
        status = 'Sobra sa tubig';
        message = 'Bawasan ang Tubig';
        className = 'status-saturated';
    }

    statusElement.textContent = `${status}: ${message}`;
    statusElement.className = `status-message ${className}`;
}