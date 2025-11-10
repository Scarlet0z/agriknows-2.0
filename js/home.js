
function preventBack() { window.history.forward() };
setTimeout("preventBack()", 0);
window.onunload = function () { null; }

let devices = [];
let currentPumpStatus = 'off';
let deviceIdCounter = 1;

document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    updateCurrentDate();
    initializeEventListeners();
    loadInitialData();
    updateSoilMoistureStatus(42);
    updateLightStatus(1); // Set initial status to Light (1)
    initializePumpControls();
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
// Set crop and update optimal ranges
function setCrop(cropKey, cropInfo) {
    currentCrop = cropKey;

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

    // --- Get buttons that open modals ---
    const selectCropBtn = document.getElementById('selectCropBtn');
    const addCropBtn = document.getElementById('addCropBtn');

    // ---  Get all close buttons ---
    const closeButtons = document.querySelectorAll('.close-modal');

    // ---  Open Modals ---
    // Check if the elements exist before adding listeners
    if (selectCropBtn && selectCropModal) {
        selectCropBtn.addEventListener('click', () => {
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
    });

    // ---  Crop Selection Logic ---
    let selectedCrop = null; // Keep track of the selected crop
    const cropOptions = document.querySelectorAll('.crop-option');
    
    cropOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove 'selected' class from all options
            cropOptions.forEach(o => o.classList.remove('selected'));
            // Add 'selected' class to the clicked one
            option.classList.add('selected');
            selectedCrop = option.getAttribute('data-crop');
        });
    });

    // ---  Confirm Crop Selection Button ---
    document.getElementById('confirmCropBtn').addEventListener('click', () => {
        if (selectedCrop) {
            setCrop(selectedCrop, cropData[selectedCrop]);
            selectCropModal.style.display = 'none'; // Hide modal
            cropOptions.forEach(o => o.classList.remove('selected')); // Clear selection
            selectedCrop = null; // Reset
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
        };

        // Set the custom crop
        setCrop('custom', customCrop);

        alert(`Custom crop "${cropName}" added successfully!`);
        document.getElementById('addCropForm').reset();
        addCropModal.style.display = 'none'; // Hide modal
    });
}
// Crop data with optimal environmental conditions
const cropData = {
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
    const pumpStatusElement = document.getElementById('pump-status');

    pumpSwitch.addEventListener('change', function () {
        setPumpStatus(this.checked ? 'on' : 'off');
    });

    // Initialize switch state
    pumpSwitch.checked = false;
}
function setPumpStatus(status) {
    const pumpSwitch = document.getElementById('pump-switch');
    const pumpStatusElement = document.getElementById('pump-status');

    if (status === 'on') {
        pumpSwitch.checked = true;
        pumpStatusElement.innerHTML = 'Status: <span class="status-on">On</span>';
        // Add visual feedback
        document.querySelector('.action-card').style.borderColor = '#27ae60';
        document.querySelector('.action-card').style.background = '#e8f5e9';
    } else {
        pumpSwitch.checked = false;
        pumpStatusElement.innerHTML = 'Status: <span class="status-off">Off</span>';
        // Reset visual feedback
        document.querySelector('.action-card').style.borderColor = '#e3f2fd';
        document.querySelector('.action-card').style.background = 'white';
    }

    // Update last action time
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.querySelector('.action-card .last-updated').textContent =
        `Last action: ${timeString}`;

    const message = status === 'on' ? 'Water pump turned ON' : 'Water pump turned OFF';
    showNotification(message, status);
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
    renderDevices();

    // Initialize pump to off state
    setPumpStatus('off');
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
        statusElement.textContent = `Soil Moisture: ${status}`;
        statusElement.className = `soil-moisture-status ${statusClass}`;

    statusElement.textContent = `${status}: ${message}`;
    statusElement.className = `status-message ${className}`;
}