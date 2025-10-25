// JavaScript file: js/script.js

let devices = [];
let currentPumpStatus = 'off';
let deviceIdCounter = 1;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    updateCurrentDate();
    initializeEventListeners();
    loadInitialData();
    updateSoilMoistureStatus(42);
    initializePumpControls();
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
    initializeForms();
    initializeExportButton();
}

function initializeModals() {
    // Device modal
    const deviceModal = document.getElementById('device-modal');
    const addDeviceBtn = document.getElementById('add-device-btn');
    const deviceClose = deviceModal.querySelector('.close');

    addDeviceBtn.addEventListener('click', () => {
        deviceModal.style.display = 'block';
    });

    deviceClose.addEventListener('click', () => {
        deviceModal.style.display = 'none';
    });

    // Edit device modal
    const editDeviceModal = document.getElementById('edit-device-modal');
    const editDeviceClose = editDeviceModal.querySelector('.close');

    editDeviceClose.addEventListener('click', () => {
        editDeviceModal.style.display = 'none';
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === deviceModal) {
            deviceModal.style.display = 'none';
        }
        if (event.target === editDeviceModal) {
            editDeviceModal.style.display = 'none';
        }
    });

    // Crop selection in device form
    const cropSelect = document.getElementById('device-crop');
    const customCropFields = document.getElementById('custom-crop-fields');
    
    cropSelect.addEventListener('change', function() {
        if (this.value === 'custom') {
            customCropFields.classList.remove('hidden');
        } else {
            customCropFields.classList.add('hidden');
        }
    });
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

function initializeForms() {
    // Device form
    const deviceForm = document.getElementById('device-form');
    deviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addDevice();
    });

    // Edit device form
    const editDeviceForm = document.getElementById('edit-device-form');
    editDeviceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateDevice();
    });

    // Delete device button
    const deleteDeviceBtn = document.getElementById('delete-device-btn');
    deleteDeviceBtn.addEventListener('click', deleteDevice);
}

function initializeExportButton() {
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', exportData);
}

function initializePumpControls() {
    const pumpSwitch = document.getElementById('pump-switch');
    const pumpStatusElement = document.getElementById('pump-status');

    pumpSwitch.addEventListener('change', function() {
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

function renderDevices() {
    const devicesList = document.getElementById('devices-list');
    devicesList.innerHTML = '';

    if (devices.length === 0) {
        devicesList.innerHTML = '<p class="no-devices">No devices added yet. Click "Add Device" to get started.</p>';
        return;
    }

    devices.forEach(device => {
        const deviceElement = document.createElement('div');
        deviceElement.className = 'device-item';
        deviceElement.innerHTML = `
            <div class="device-info">
                <div class="device-name">${device.name}</div>
                <div class="device-details">
                    Location: ${device.location} | 
                    Crop: <span class="device-crop">${device.crop}</span>
                </div>
            </div>
            <div class="device-actions">
                <button class="edit-btn" data-id="${device.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
           
            </div>
        `;
        devicesList.appendChild(deviceElement);
    });

    // Add event listeners to action buttons
    initializeDeviceActions();
}

function initializeDeviceActions() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    editButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const deviceId = parseInt(this.getAttribute('data-id'));
            editDevice(deviceId);
        });
    });
    
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const deviceId = parseInt(this.getAttribute('data-id'));
            if (confirm('Are you sure you want to delete this device?')) {
                deleteDevice(deviceId);
            }
        });
    });
}

function addDevice() {
    const name = document.getElementById('device-name').value;
    const location = document.getElementById('device-location').value;
    const crop = document.getElementById('device-crop').value;
    
    let cropName = crop;
    let cropType = 'predefined';
    
    if (crop === 'custom') {
        cropName = document.getElementById('custom-crop-name').value || 'Custom Crop';
        cropType = 'custom';
    }
    
    const newDevice = {
        id: deviceIdCounter++,
        name: name,
        location: location,
        crop: cropName,
        cropType: cropType
    };
    
    devices.push(newDevice);
    renderDevices();
    
    // Close modal and reset form
    document.getElementById('device-modal').style.display = 'none';
    document.getElementById('device-form').reset();
    document.getElementById('custom-crop-fields').classList.add('hidden');
    
    alert(`Device "${name}" added successfully with crop "${cropName}"!`);
}

function editDevice(deviceId) {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    document.getElementById('edit-device-id').value = device.id;
    document.getElementById('edit-device-name').value = device.name;
    document.getElementById('edit-device-location').value = device.location;
    document.getElementById('edit-device-crop').value = device.crop;

    document.getElementById('edit-device-modal').style.display = 'block';
}

function updateDevice() {
    const deviceId = parseInt(document.getElementById('edit-device-id').value);
    const name = document.getElementById('edit-device-name').value;
    const location = document.getElementById('edit-device-location').value;
    
    const deviceIndex = devices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
        devices[deviceIndex].name = name;
        devices[deviceIndex].location = location;
        
        renderDevices();
        document.getElementById('edit-device-modal').style.display = 'none';
        alert('Device updated successfully!');
    }
}

function deleteDevice(deviceId) {
    if (typeof deviceId !== 'number') {
        deviceId = parseInt(document.getElementById('edit-device-id').value);
    }
    
    devices = devices.filter(d => d.id !== deviceId);
    renderDevices();
    document.getElementById('edit-device-modal').style.display = 'none';
    alert('Device deleted successfully!');
}

function loadHistoryData(timeRange) {
    // Sample data with device information
    const sampleData = [
        {
            time: '10:00 AM',
            device: 'Sensor 1',
            soilMoisture: '45%',
            humidity: '62%',
            temperature: '22.1°C',
            lightLevel: '720 lux',
            phLevel: '6.7 pH'
        },
        {
            time: '09:45 AM',
            device: 'Sensor 2',
            soilMoisture: '43%',
            humidity: '64%',
            temperature: '21.8°C',
            lightLevel: '680 lux',
            phLevel: '6.8 pH'
        },
        {
            time: '09:30 AM',
            device: 'Sensor 1',
            soilMoisture: '41%',
            humidity: '63%',
            temperature: '21.5°C',
            lightLevel: '750 lux',
            phLevel: '6.7 pH'
        }
    ];

    const tableBody = document.getElementById('history-data');
    tableBody.innerHTML = '';

    sampleData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.time}</td>
            <td>${data.device}</td>
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
    initializeBarChart('light-level-chart', 'Light Level', [720, 680, 750, 700, 780], '#f39c12');
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
        ['10:00 AM', 'Sensor 1', '45%', '62%', '22.1°C', '720 lux', '6.7 pH'],
        ['09:45 AM', 'Sensor 2', '43%', '64%', '21.8°C', '680 lux', '6.8 pH'],
        ['09:30 AM', 'Sensor 1', '41%', '63%', '21.5°C', '750 lux', '6.7 pH']
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