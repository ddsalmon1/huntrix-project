const image = document.getElementById('cover'),
    title = document.getElementById('music-title'),
    artist = document.getElementById('music-artist'),
    currentTimeEl = document.getElementById('current-time'),
    durationEl = document.getElementById('duration'),
    progress = document.getElementById('progress'),
    playerProgress = document.getElementById('player-progress'),
    progressIndicator = document.getElementById('progress-indicator'),
    prevBtn = document.getElementById('prev'),
    nextBtn = document.getElementById('next'),
    playBtn = document.getElementById('play'),
    background = document.getElementById('bg-img'),
    // Volume control elements
    volumeSlider = document.getElementById('volume-slider'),
    volumeIcon = document.getElementById('volume-icon'),
    volumePercent = document.getElementById('volume-percent');

const music = new Audio();

// Visualizer variables
let audioContext, analyser, dataArray, canvas, canvasCtx;
let isVisualizerActive = false;
let fadeOutTimer = 0;
let lastAudioActivity = 0;

// Enhanced beat detection variables
let beatHistory = [];
let energyHistory = [];
let lastBeatTime = 0;
let beatThreshold = 1.3;


const songs = [
    {
        path: 'assets/Golden.mp3',
        displayName: 'Golden',
        cover: 'assets/Golden.png',
        artist: 'Huntrix',
        indicator: 'huntrix-bl-icon'
    },
    {
        path: 'assets/SodaPop.mp3',
        displayName: 'Soda Pop',
        cover: 'assets/SodaPop.jpeg',
        artist: 'Saja Boys',
        indicator: 'saja-icon'
    },
    {
        path: 'assets/YourIdol.mp3',
        displayName: 'Your Idol',
        cover: 'assets/YourIdol.jpeg',
        artist: 'Saja Boys',
        indicator: 'saja-icon'
    },
    {
        path: 'assets/Free.mp3',
        displayName: 'Free',
        cover: 'assets/Free.jpeg',
        artist: 'Rumi, Jinu'
    },
    {
        path: 'assets/Takedown.mp3',
        displayName: 'Takedown',
        cover: 'assets/Takedown.jpeg',
        artist: 'Huntrix',
        indicator: 'huntrix-bl-icon'
    }
];

let musicIndex = 0;
let isPlaying = false;

function togglePlay() {
    if (isPlaying) {
        pauseMusic();
    } else {
        playMusic();
    }
}

function playMusic() {
    isPlaying = true;
    // Change play button icon
    playBtn.classList.replace('fa-play', 'fa-pause');
    // Set button hover title
    playBtn.setAttribute('title', 'Pause');
    music.play();
    
    // Start progress indicator rotation
    progressIndicator.classList.add('playing');
    
    // Initialize and start visualizer
    if (audioContext?.state === 'suspended') {
        audioContext.resume();
    }
    initVisualizer();
}

function pauseMusic() {
    isPlaying = false;
    // Change pause button icon
    playBtn.classList.replace('fa-pause', 'fa-play');
    // Set button hover title
    playBtn.setAttribute('title', 'Play');
    music.pause();
    
    // Stop progress indicator rotation
    progressIndicator.classList.remove('playing');
    
    // Stop visualizer when music is paused
    stopVisualizer();
}

function loadMusic(song) {
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    image.src = song.cover;
    background.src = song.cover;
    
    // Clear existing indicator classes
    progressIndicator.className = 'progress-indicator';
    
    // Clear existing theme classes
    playerProgress.classList.remove('saja-theme');
    progress.classList.remove('saja-theme');
    
    // Add the specific indicator class for this song
    if (song.indicator) {
        progressIndicator.classList.add(song.indicator);
        
        // Apply Saja theme if it's a Saja Boys song
        if (song.indicator === 'saja-icon') {
            playerProgress.classList.add('saja-theme');
            progress.classList.add('saja-theme');
        }
    } else {
        // Default to huntrix-bl-icon if no indicator specified
        progressIndicator.classList.add('huntrix-bl-icon');
    }
}

function changeMusic(direction) {
    musicIndex = (musicIndex + direction + songs.length) % songs.length;
    
    // Add a small delay to prevent abrupt progress reset
    setTimeout(() => {
        loadMusic(songs[musicIndex]);
        playMusic();
    }, 100);
}

function updateProgressBar() {
    const { duration, currentTime } = music;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;
    
    // Update progress indicator position
    progressIndicator.style.left = `${progressPercent}%`;

    const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
    durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(duration % 60)}`;
    currentTimeEl.textContent = `${formatTime(currentTime / 60)}:${formatTime(currentTime % 60)}`;
}

function setProgressBar(e) {
    const rect = playerProgress.getBoundingClientRect();
    // Calculate click position relative to the progress bar (due to additional left padding I did in css )
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    music.currentTime = (clickX / width) * music.duration;
}

// Volume control functions
function changeVolume() {
    const volume = volumeSlider.value / 100;
    music.volume = volume;
    volumePercent.textContent = `${volumeSlider.value}%`;
    
    // Update volume icon based on volume level
    if (volume === 0) {
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fa-solid fa-volume-low';
    } else {
        volumeIcon.className = 'fa-solid fa-volume-high';
    }
}

// Volume toggle function
function toggleMute() {
    if (music.volume === 0) {
        // Unmute - restore to slider value
        music.volume = volumeSlider.value / 100;
        volumeIcon.className = volumeSlider.value < 50 ? 'fa-solid fa-volume-low' : 'fa-solid fa-volume-high';
    } else {
        // Mute
        music.volume = 0;
        volumeIcon.className = 'fa-solid fa-volume-xmark';
    }
}

// Visualizer functions
function initVisualizer() {
    canvas = document.getElementById('visualizer-canvas');
    canvasCtx = canvas.getContext('2d');
    
    // Set canvas size to match window
    resizeCanvas();
    
    // Draw initial overlay even before music starts
    drawInitialOverlay();
    
    // Create audio context if it doesn't exist
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaElementSource(music);
        analyser = audioContext.createAnalyser();
        
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        
        // Configure analyser
        analyser.fftSize = 512;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    }
    
    isVisualizerActive = true;
    drawVisualizer();
}

function drawInitialOverlay() {
    if (canvas && canvasCtx) {
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // 80% opacity black overlay
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function drawVisualizer() {
    if (!isVisualizerActive) return;
    
    requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Add semi-transparent black overlay to darken the background
    canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate audio data
    let totalIntensity = 0;
    let bassIntensity = 0;
    
    const bassRange = Math.floor(dataArray.length * 0.1);
    
    for (let i = 0; i < dataArray.length; i++) {
        totalIntensity += dataArray[i];
        if (i < bassRange) {
            bassIntensity += dataArray[i];
        }
    }
    
    const avgIntensity = totalIntensity / dataArray.length / 255;
    bassIntensity = (bassIntensity / bassRange) / 255;
    
    // Beat detection
    const lowFreqEnergy = calculateFrequencyRangeEnergy(0, 0.1);
    const midFreqEnergy = calculateFrequencyRangeEnergy(0.1, 0.4);
    const highFreqEnergy = calculateFrequencyRangeEnergy(0.4, 1.0);
    
    const totalEnergy = (lowFreqEnergy * 2.0) + (midFreqEnergy * 1.2) + (highFreqEnergy * 0.8);
    
    energyHistory.push(totalEnergy);
    if (energyHistory.length > 43) {
        energyHistory.shift();
    }
    
    const avgEnergy = energyHistory.reduce((sum, e) => sum + e, 0) / energyHistory.length;
    const energyVariance = energyHistory.reduce((sum, e) => sum + Math.pow(e - avgEnergy, 2), 0) / energyHistory.length;
    
    const adaptiveThreshold = beatThreshold + (energyVariance * 0.5);
    
    const currentTime = Date.now();
    let beatDetected = false;
    
    if (totalEnergy > avgEnergy * adaptiveThreshold && 
        currentTime - lastBeatTime > 200) {
        beatDetected = true;
        lastBeatTime = currentTime;
        
        beatHistory.push(currentTime);
        if (beatHistory.length > 8) {
            beatHistory.shift();
        }
    }
    
    const beatMultiplier = beatDetected ? 1.15 : Math.max(1.0, 1 + (totalEnergy / avgEnergy - 1) * 0.1);
    
    // Helper function for frequency range energy calculation
    function calculateFrequencyRangeEnergy(startPercent, endPercent) {
        const startIndex = Math.floor(dataArray.length * startPercent);
        const endIndex = Math.floor(dataArray.length * endPercent);
        let energy = 0;
        
        for (let i = startIndex; i < endIndex; i++) {
            energy += Math.pow(dataArray[i] / 255, 2);
        }
        
        return energy / (endIndex - startIndex);
    }

    // Fade out logic
    if (avgIntensity > 0.05) {
        lastAudioActivity = Date.now();
        fadeOutTimer = 0;
    } else {
        const timeSinceActivity = Date.now() - lastAudioActivity;
        fadeOutTimer = Math.min(timeSinceActivity / 1500, 1);
    }
    
    const volumeBasedFade = Math.max(0, (avgIntensity - 0.02) / 0.08);
    const fadeMultiplier = Math.min(1 - fadeOutTimer, volumeBasedFade);
    const adjustedIntensity = avgIntensity * Math.max(fadeMultiplier, 0.1);
    
    // Color based on audio activity: blue (low) to golden (high)
    const blueAmount = Math.max(0, 1 - adjustedIntensity * 2);
    const goldAmount = Math.min(1, adjustedIntensity * 1.5);
    
    // Check for small screen and use dedicated visualizer
    const isSmallScreen = canvas.width <= 320 && canvas.height <= 240;
    
    if (isSmallScreen) {
        drawSmallScreenVisualizer(adjustedIntensity, beatMultiplier, fadeMultiplier, blueAmount, goldAmount);
        return;
    }
    
    // Calculate scale factor based on screen height (reference: 1080p)
    const heightScaleFactor = canvas.height / 1080;
    
    // Apply scaling for larger screens
    const scaledWaveCount = Math.max(10, Math.round(20 * heightScaleFactor));
    const scaledAmplitude = Math.max(8, 20 * heightScaleFactor);
    const scaledIntensityMultiplier = Math.max(12, 30 * heightScaleFactor);
    const scaledBloomSize = Math.max(4, 8 * heightScaleFactor);
    const scaledLineWidth = Math.max(0.8, 1.5 * heightScaleFactor);
    
    const numWaves = scaledWaveCount;
    const waveSpacing = canvas.height / (numWaves + 1.5);

    for (let wave = 0; wave < numWaves; wave++) {
        const y = waveSpacing * (wave + 1);
        
        const waveIntensity = Math.max(0.75, adjustedIntensity + (Math.sin(Date.now() * 0.002 + wave) * 0.5)) * fadeMultiplier * beatMultiplier;
        
        // Color interpolation between blue and gold
        const red = Math.floor(goldAmount * 255 + blueAmount * 6);
        const green = Math.floor(goldAmount * 215 + blueAmount * 99);
        const blue = Math.floor(goldAmount * 0 + blueAmount * 181);
        const alpha = Math.max(0.1, waveIntensity * 0.8) * fadeMultiplier;
        
        // Skip drawing if wave is nearly invisible
        if (alpha < 0.05) continue;
        
        // Create neon glow effect with gradient
        const gradient = canvasCtx.createLinearGradient(0, y - 10, 0, y + 10);
        
        // Outer glow (more opaque)
        gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.6})`);
        // Middle core (brighter neon effect)
        const neonRed = Math.floor(goldAmount * 255 + blueAmount * 123);
        const neonGreen = Math.floor(goldAmount * 255 + blueAmount * 213);
        const neonBlue = Math.floor(goldAmount * 100 + blueAmount * 255);
        gradient.addColorStop(0.5, `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${alpha})`);
        // Outer glow (more opaque)
        gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.8})`);
        
        // Create bloom effect - multiple layers of expanding glow
        const bloomLayers = 3;
        const bloomIntensity = waveIntensity * 0.2;
        
        for (let bloom = 0; bloom < bloomLayers; bloom++) {
            const bloomSize = (bloom + 1) * scaledBloomSize;
            const bloomAlpha = (bloomIntensity / (bloom + 1)) * 0.3;
            
            if (bloomAlpha > 0.02) {
                canvasCtx.strokeStyle = `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${bloomAlpha})`;
                canvasCtx.lineWidth = bloomSize;
                canvasCtx.beginPath();
                
                for (let x = 0; x <= canvas.width; x += 2) {
                    const waveHeight = Math.sin((x * 0.01) + (Date.now() * 0.001) + (wave * 0.5)) * 
                                      (scaledAmplitude + (adjustedIntensity * scaledIntensityMultiplier)) * 
                                      (1 + Math.sin(Date.now() * 0.005 + wave) * 0.3) * 
                                      (1 + adjustedIntensity * 0.8) *
                                      beatMultiplier *
                                      fadeMultiplier;
                    
                    const currentY = y + waveHeight;
                    
                    if (x === 0) {
                        canvasCtx.moveTo(x, currentY);
                    } else {
                        canvasCtx.lineTo(x, currentY);
                    }
                }
                
                canvasCtx.stroke();
            }
        }
        
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = scaledLineWidth;
        canvasCtx.beginPath();
        
        for (let x = 0; x <= canvas.width; x += 2) {
            const waveHeight = Math.sin((x * 0.01) + (Date.now() * 0.001) + (wave * 0.5)) * 
                              (scaledAmplitude + (adjustedIntensity * scaledIntensityMultiplier)) * 
                              (1 + Math.sin(Date.now() * 0.005 + wave) * 0.3) * 
                              (1 + adjustedIntensity * 0.8) *
                              beatMultiplier *
                              fadeMultiplier;
            
            const currentY = y + waveHeight;
            
            if (x === 0) {
                canvasCtx.moveTo(x, currentY);
            } else {
                canvasCtx.lineTo(x, currentY);
            }
        }
        
        canvasCtx.stroke();
    }
}

// Dedicated visualizer for 320x240 screens
function drawSmallScreenVisualizer(adjustedIntensity, beatMultiplier, fadeMultiplier, blueAmount, goldAmount) {
    // Proportional scaling based on 320x240 vs reference resolution (1920x1080)
    const scaleFactorX = canvas.width / 1920;
    const scaleFactorY = canvas.height / 1080;
    const avgScaleFactor = (scaleFactorX + scaleFactorY) / 2;
    
    // Optimized settings for clean, smooth lines similar to the original
    const numWaves = Math.max(10, Math.round(20 * scaleFactorY)); // Fewer waves for cleaner look
    const amplitude = 15 * Math.max(0.4, avgScaleFactor); // Slightly higher amplitude for visibility
    const intensityMultiplier = 25 * Math.max(0.8, avgScaleFactor); // Strong intensity response
    const bloomSize = 6 * Math.max(1, avgScaleFactor); // Balanced bloom effect
    const lineWidth = 1.2 * Math.max(0.7, avgScaleFactor); // Slightly thicker for clarity
    
    const waveSpacing = canvas.height / (numWaves + 1);
    
    for (let wave = 0; wave < numWaves; wave++) {
        const y = waveSpacing * (wave + 1.5);
        
        // Refined intensity calculation for smoother waves
        const waveIntensity = Math.max(1, adjustedIntensity + (Math.sin(Date.now() * 0.002 + wave) * 0.4)) * fadeMultiplier * beatMultiplier;
        
        // Same color interpolation between blue and gold
        const red = Math.floor(goldAmount * 255 + blueAmount * 6);
        const green = Math.floor(goldAmount * 215 + blueAmount * 99);
        const blue = Math.floor(goldAmount * 0 + blueAmount * 181);
        const alpha = Math.max(0.1, waveIntensity * 0.8) * fadeMultiplier;
        
        // Skip drawing if wave is nearly invisible
        if (alpha < 0.05) continue;
        
        // Proportionally scaled neon glow effect with gradient
        const gradient = canvasCtx.createLinearGradient(0, y - (10 * avgScaleFactor), 0, y + (10 * avgScaleFactor));
        
        // Outer glow
        gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.6})`);
        // Middle core (brighter neon effect)
        const neonRed = Math.floor(goldAmount * 255 + blueAmount * 123);
        const neonGreen = Math.floor(goldAmount * 255 + blueAmount * 213);
        const neonBlue = Math.floor(goldAmount * 100 + blueAmount * 255);
        gradient.addColorStop(0.5, `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${alpha})`);
        // Outer glow
        gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.8})`);
        
        // Same bloom effect - multiple layers of expanding glow with maintained intensity
        const bloomLayers = 3;
        const bloomIntensity = waveIntensity * 0.2; // Same intensity as original visualizer
        
        for (let bloom = 0; bloom < bloomLayers; bloom++) {
            const currentBloomSize = (bloom + 1) * bloomSize;
            const bloomAlpha = (bloomIntensity / (bloom + 1)) * 0.3;
            
            if (bloomAlpha > 0.02) {
                canvasCtx.strokeStyle = `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${bloomAlpha})`;
                canvasCtx.lineWidth = currentBloomSize;
                canvasCtx.beginPath();
                
                // Smoother wave calculation with optimized frequency
                for (let x = 0; x <= canvas.width; x += Math.max(1, Math.round(1.5 * avgScaleFactor))) {
                    const waveHeight = Math.sin((x * 0.008 * (1920 / canvas.width)) + (Date.now() * 0.001) + (wave * 0.5)) * 
                                      (amplitude + (adjustedIntensity * intensityMultiplier)) * 
                                      (1 + Math.sin(Date.now() * 0.004 + wave) * 0.25) * 
                                      (1 + adjustedIntensity * 0.6) *
                                      beatMultiplier *
                                      fadeMultiplier;
                   
                    const currentY = y + waveHeight;
                    
                    if (x === 0) {
                        canvasCtx.moveTo(x, currentY);
                    } else {
                        canvasCtx.lineTo(x, currentY);
                    }
                }
                
                canvasCtx.stroke();
            }
        }
        
        // Main wave drawing
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = lineWidth;
        canvasCtx.beginPath();
        
        // Smoother main wave calculation
        for (let x = 0; x <= canvas.width; x += Math.max(1, Math.round(1.5 * avgScaleFactor))) {
            const waveHeight = Math.sin((x * 0.008 * (1920 / canvas.width)) + (Date.now() * 0.001) + (wave * 0.5)) * 
                              (amplitude + (adjustedIntensity * intensityMultiplier)) * 
                              (1 + Math.sin(Date.now() * 0.004 + wave) * 0.25) * 
                              (1 + adjustedIntensity * 0.6) *
                              beatMultiplier *
                              fadeMultiplier;
            
            const currentY = y + waveHeight;
            
            if (x === 0) {
                canvasCtx.moveTo(x, currentY);
            } else {
                canvasCtx.lineTo(x, currentY);
            }
        }
        
        canvasCtx.stroke();
    }
}

function stopVisualizer() {
    isVisualizerActive = false;
}

playBtn.addEventListener('click', togglePlay);
prevBtn.addEventListener('click', () => changeMusic(-1));
nextBtn.addEventListener('click', () => changeMusic(1));
music.addEventListener('ended', () => changeMusic(1));
music.addEventListener('timeupdate', updateProgressBar);
playerProgress.addEventListener('click', setProgressBar);
// Volume control event listeners
volumeSlider.addEventListener('input', changeVolume);
volumeIcon.addEventListener('click', toggleMute);
// Visualizer event listener
window.addEventListener('resize', resizeCanvas);

loadMusic(songs[musicIndex]);

// Initialize canvas and overlay immediately when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('visualizer-canvas');
    if (canvas) {
        const canvasCtx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Draw initial overlay immediately
        canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    }
});

// Also ensure overlay is maintained on window resize
function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Reapply overlay after resize
        if (canvasCtx) {
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
}