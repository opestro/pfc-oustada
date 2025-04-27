// Connect to Socket.IO server
const socket = io();

// DOM Elements
const connectionStatusDesktop = document.getElementById('connection-status-desktop');
const connectionStatusMobile = document.getElementById('connection-status-mobile');
const lastUpdatedDesktop = document.getElementById('last-updated-desktop');
const lastUpdatedMobile = document.getElementById('last-updated-mobile');
const temperatureValue = document.getElementById('temperature-value');
const humidityValue = document.getElementById('humidity-value');
const distanceValue = document.getElementById('distance-value');
const motionValue = document.getElementById('motion-value');
const noiseValue = document.getElementById('noise-value');
const cameraFeed = document.getElementById('camera-feed');

// Chart data
const maxDataPoints = 20;
const tempHumidityChartData = {
    labels: Array(maxDataPoints).fill(''),
    tempData: Array(maxDataPoints).fill(null),
    humidityData: Array(maxDataPoints).fill(null)
};

const distanceNoiseChartData = {
    labels: Array(maxDataPoints).fill(''),
    distanceData: Array(maxDataPoints).fill(null),
    noiseData: Array(maxDataPoints).fill(null)
};

// Socket.IO connection events
socket.on('connect', () => {
    // Update desktop status
    if (connectionStatusDesktop) {
        connectionStatusDesktop.textContent = 'Connected';
        connectionStatusDesktop.classList.remove('text-yellow-500', 'text-red-500');
        connectionStatusDesktop.classList.add('text-green-600');
        
        // Update connection indicator
        connectionStatusDesktop.previousElementSibling.classList.remove('bg-yellow-500', 'bg-red-500');
        connectionStatusDesktop.previousElementSibling.classList.add('bg-green-500');
    }
    
    // Update mobile status
    if (connectionStatusMobile) {
        connectionStatusMobile.textContent = 'Connected';
        connectionStatusMobile.classList.remove('text-yellow-500', 'text-red-500');
        connectionStatusMobile.classList.add('text-green-600');
        
        // Update connection indicator
        connectionStatusMobile.previousElementSibling.classList.remove('bg-yellow-500', 'bg-red-500');
        connectionStatusMobile.previousElementSibling.classList.add('bg-green-500');
    }
    
    console.log('Connected to server');
    
    // Fetch initial data
    fetchSensorData();
});

socket.on('disconnect', () => {
    // Update desktop status
    if (connectionStatusDesktop) {
        connectionStatusDesktop.textContent = 'Disconnected';
        connectionStatusDesktop.classList.remove('text-yellow-500', 'text-green-600');
        connectionStatusDesktop.classList.add('text-red-500');
        
        // Update connection indicator
        connectionStatusDesktop.previousElementSibling.classList.remove('bg-yellow-500', 'bg-green-500');
        connectionStatusDesktop.previousElementSibling.classList.add('bg-red-500');
    }
    
    // Update mobile status
    if (connectionStatusMobile) {
        connectionStatusMobile.textContent = 'Disconnected';
        connectionStatusMobile.classList.remove('text-yellow-500', 'text-green-600');
        connectionStatusMobile.classList.add('text-red-500');
        
        // Update connection indicator
        connectionStatusMobile.previousElementSibling.classList.remove('bg-yellow-500', 'bg-green-500');
        connectionStatusMobile.previousElementSibling.classList.add('bg-red-500');
    }
    
    console.log('Disconnected from server');
});

socket.on('sensor-update', (data) => {
    console.log('Received sensor update:', data);
    updateDashboard(data);
});

socket.on('camera-update', (data) => {
    if (data && data.image) {
        cameraFeed.src = data.image;
    }
});

// Fetch sensor data from API
function fetchSensorData() {
    fetch('/api/data')
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                updateDashboard(result.data);
            }
        })
        .catch(error => {
            console.error('Error fetching sensor data:', error);
        });
}

// Update dashboard with new data
function updateDashboard(data) {
    // Update values with animations
    if (data.temperature !== undefined) {
        animateValue(temperatureValue, parseFloat(temperatureValue.textContent) || 0, data.temperature, 500);
    }
    
    if (data.humidity !== undefined) {
        animateValue(humidityValue, parseFloat(humidityValue.textContent) || 0, data.humidity, 500);
    }
    
    if (data.distance !== undefined) {
        animateValue(distanceValue, parseFloat(distanceValue.textContent) || 0, data.distance, 500);
    }
    
    if (data.noise !== undefined) {
        animateValue(noiseValue, parseFloat(noiseValue.textContent) || 0, data.noise, 500);
    }
    
    if (data.motion !== undefined) {
        if (data.motion) {
            motionValue.textContent = 'Motion Detected';
            motionValue.classList.add('text-red-500');
            motionValue.classList.add('motion-detected');
        } else {
            motionValue.textContent = 'No Motion';
            motionValue.classList.remove('text-red-500');
            motionValue.classList.remove('motion-detected');
        }
    }
    
    // Update last updated timestamp
    if (data.lastUpdated) {
        const date = new Date(data.lastUpdated);
        const formattedDate = date.toLocaleString();
        
        // Update both desktop and mobile timestamps
        if (lastUpdatedDesktop) {
            lastUpdatedDesktop.textContent = formattedDate;
        }
        
        if (lastUpdatedMobile) {
            lastUpdatedMobile.textContent = formattedDate;
        }
    }
    
    // Update charts
    updateCharts(data);
}

// Animate value changes for smoother transitions
function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = start + progress * (end - start);
        element.textContent = value.toFixed(1);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initialize charts
let tempHumidityChart, distanceNoiseChart;

function initCharts() {
    // Chart.js global defaults
    Chart.defaults.font.size = 12;
    Chart.defaults.font.family = "'Roboto', sans-serif";
    Chart.defaults.plugins.legend.position = 'top';
    
    // Temperature & Humidity Chart
    const tempHumidityCtx = document.getElementById('temp-humidity-chart').getContext('2d');
    tempHumidityChart = new Chart(tempHumidityCtx, {
        type: 'line',
        data: {
            labels: tempHumidityChartData.labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempHumidityChartData.tempData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Humidity (%)',
                    data: tempHumidityChartData.humidityData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        padding: 10,
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 5,
                        color: '#666'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    padding: 10,
                    cornerRadius: 4,
                    boxPadding: 5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            }
        }
    });
    
    // Distance & Noise Chart
    const distanceNoiseCtx = document.getElementById('distance-noise-chart').getContext('2d');
    distanceNoiseChart = new Chart(distanceNoiseCtx, {
        type: 'line',
        data: {
            labels: distanceNoiseChartData.labels,
            datasets: [
                {
                    label: 'Distance (cm)',
                    data: distanceNoiseChartData.distanceData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                },
                {
                    label: 'Noise (dB)',
                    data: distanceNoiseChartData.noiseData,
                    borderColor: '#a855f7',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    tension: 0.3,
                    fill: true,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        padding: 10,
                        color: '#666'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        padding: 5,
                        color: '#666'
                    }
                }
            },
            animation: {
                duration: 750,
                easing: 'easeOutQuart'
            },
            plugins: {
                legend: {
                    labels: {
                        boxWidth: 15,
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        color: '#333'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#333',
                    bodyColor: '#333',
                    padding: 10,
                    cornerRadius: 4,
                    boxPadding: 5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    borderWidth: 1,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                point: {
                    radius: 3,
                    hoverRadius: 5
                }
            }
        }
    });
}

// Update chart data
function updateCharts(data) {
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Update Temperature & Humidity Chart
    if (data.temperature !== undefined || data.humidity !== undefined) {
        // Remove first element and add new one at the end
        tempHumidityChartData.labels.shift();
        tempHumidityChartData.labels.push(currentTime);
        
        tempHumidityChartData.tempData.shift();
        tempHumidityChartData.tempData.push(data.temperature);
        
        tempHumidityChartData.humidityData.shift();
        tempHumidityChartData.humidityData.push(data.humidity);
        
        // Update chart
        tempHumidityChart.data.labels = tempHumidityChartData.labels;
        tempHumidityChart.data.datasets[0].data = tempHumidityChartData.tempData;
        tempHumidityChart.data.datasets[1].data = tempHumidityChartData.humidityData;
        tempHumidityChart.update();
    }
    
    // Update Distance & Noise Chart
    if (data.distance !== undefined || data.noise !== undefined) {
        // Remove first element and add new one at the end
        distanceNoiseChartData.labels.shift();
        distanceNoiseChartData.labels.push(currentTime);
        
        distanceNoiseChartData.distanceData.shift();
        distanceNoiseChartData.distanceData.push(data.distance);
        
        distanceNoiseChartData.noiseData.shift();
        distanceNoiseChartData.noiseData.push(data.noise);
        
        // Update chart
        distanceNoiseChart.data.labels = distanceNoiseChartData.labels;
        distanceNoiseChart.data.datasets[0].data = distanceNoiseChartData.distanceData;
        distanceNoiseChart.data.datasets[1].data = distanceNoiseChartData.noiseData;
        distanceNoiseChart.update();
    }
}

// Initialize charts on document ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    initCharts();
    
    // Add sensor-card class to all cards
    document.querySelectorAll('.rounded-lg.shadow-sm').forEach(card => {
        card.classList.add('sensor-card');
    });
    
    // Set up mobile nav buttons active state
    const mobileNavButtons = document.querySelectorAll('nav.md\\:hidden a');
    if (mobileNavButtons.length) {
        mobileNavButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                // Remove active class from all buttons
                mobileNavButtons.forEach(btn => {
                    btn.classList.remove('text-primary-600');
                    btn.classList.add('text-gray-500');
                });
                // Add active class to clicked button
                this.classList.remove('text-gray-500');
                this.classList.add('text-primary-600');
            });
        });
    }
    
    // Show initial connecting state
    if (connectionStatusDesktop) {
        connectionStatusDesktop.textContent = 'Connecting...';
        connectionStatusDesktop.classList.add('text-yellow-500');
    }
    
    if (connectionStatusMobile) {
        connectionStatusMobile.textContent = 'Connecting...';
        connectionStatusMobile.classList.add('text-yellow-500');
    }

    // Camera streaming elements
    const cameraFeed = document.getElementById('camera-feed');
    const cameraStream = document.getElementById('camera-stream');
    const streamStatus = document.getElementById('stream-status');
    const cameraStatus = document.getElementById('camera-status');
    const refreshStreamBtn = document.getElementById('refresh-stream');
    
    // Set up video stream
    refreshStreamBtn.addEventListener('click', function() {
        const cameraIp = prompt("Enter ESP32-CAM's IP address:", "");
        if (cameraIp) {
            // Set up the iframe with the ESP32-CAM stream URL
            const streamUrl = `http://${cameraIp}/stream`;
            cameraStream.src = streamUrl;
            cameraStream.style.display = 'block';
            cameraFeed.style.display = 'none';
            streamStatus.classList.remove('hidden');
            cameraStatus.textContent = `Connected to stream at ${cameraIp}`;
            cameraStatus.classList.remove('text-gray-500');
            cameraStatus.classList.add('text-green-600');
            
            // Store the stream URL in localStorage for persistence
            localStorage.setItem('esp32CamStreamUrl', streamUrl);
        }
    });
    
    // Check if we have a saved stream URL
    const savedStreamUrl = localStorage.getItem('esp32CamStreamUrl');
    if (savedStreamUrl) {
        cameraStream.src = savedStreamUrl;
        cameraStream.style.display = 'block';
        cameraFeed.style.display = 'none';
        streamStatus.classList.remove('hidden');
        cameraStatus.textContent = `Connected to saved stream`;
        cameraStatus.classList.remove('text-gray-500');
        cameraStatus.classList.add('text-green-600');
    }
    
    // Handle stream errors
    cameraStream.onerror = function() {
        cameraStream.style.display = 'none';
        cameraFeed.style.display = 'block';
        streamStatus.classList.add('hidden');
        cameraStatus.textContent = 'Stream connection failed. Please try again.';
        cameraStatus.classList.remove('text-green-600');
        cameraStatus.classList.add('text-red-500');
    };
}); 