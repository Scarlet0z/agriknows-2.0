function preventBack() { window.history.forward() };
setTimeout("preventBack()", 0);
window.onunload = function () { null; }

let devices = [];
let currentPumpStatus = 'off';
let deviceIdCounter = 1;

// **NEW**: Global object to hold all crop data (predefined + custom)
let allCropData = {};
// **NEW**: Variable to track the currently selected crop key
let currentCropKey = null;

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
    wheat: {
        name: "Wheat",
        temperature: { min: 10, max: 25 },
        moisture: { min: 40, max: 60 },
        ph: { min: 6.0, max: 7.5 },
        humidity: { min: 40, max: 60 },
    },
    tomato: {
        name: "Tomato",
        temperature: { min: 18, max: 27 },
        moisture: { min: 60, max: 80 },
        ph: { min: 5.5, max: 6.8 },
        humidity: { min: 65, max: 85 },
    },
    lettuce: {
        name: "Lettuce",
        temperature: { min: 7, max: 20 },
        moisture: { min: 70, max: 85 },
        ph: { min: 6.0, max: 7.0 },
        humidity: { min: 70, max: 80 },
    }
};

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    updateCurrentDate();
    loadAllCropData(); // **MODIFIED**: Load crop data (including custom) from storage
    initializeEventListeners();
    loadInitialData();
    updateSoilMoistureStatus(42);
    updateLightStatus(1); // Set initial status to Light (1)
    initializePumpControls(); // **MODIFIED**: Initializes pump state from storage
}
function updateLightStatus(status) {
    const lightValueElement = document.getElementById('lightValue');
    const lightOptimalElement = document.getElementById('lightOptimal');
    
    if (status === 0) {
        lightValueElement.textContent = 'Dark';
    } else {
        lightValueElement.textContent = 'Light';
    }
    // Clear the optimal text since it's no longer needed
    lightOptimalElement.textContent = ' ';
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

function initializeEventListeners() {
    initializeModals();
    initializeTimeFilters();
    initializeGraphMode();
    initializeExportButton();
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
            loadHistoryData(timeRange);
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

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Also update the loadInitialData function to initialize pump correctly:
function loadInitialData() {
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
    
}

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

    const tableBody = document.getElementById('history-data');
    tableBody.innerHTML = ''; // Clear previous data

    sampleData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.time}</td>
            <td>${data.soilMoisture}</td>
            <td>${data.humidity}</td>
            <td>${data.temperature}</td>
            <td>${data.lightLevel}</td>
            <td>${data.phLevel}</td>
        `;
        tableBody.appendChild(row);
    });
}

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
}
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
        status = 'Very Dry';
        message = 'Irrigation needed immediately';
        className = 'status-dry';
    } else if (moistureLevel < 40) {
        status = 'Dry';
        message = 'Consider irrigation soon';
        className = 'status-moderate';
    } else if (moistureLevel < 60) {
        status = 'Optimal';
        message = 'Moisture level is perfect';
        className = 'status-optimal';
    } else if (moistureLevel < 80) {
        status = 'Wet';
        message = 'Adequate moisture';
        className = 'status-wet';
    } else {
        status = 'Saturated';
        message = 'Reduce irrigation';
        className = 'status-saturated';
    }

    statusElement.textContent = `${status}: ${message}`;
    statusElement.className = `status-message ${className}`;
}