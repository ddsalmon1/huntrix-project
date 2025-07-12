const image = document.getElementById('cover'),
    title = document.getElementById('music-title'),
    artist = document.getElementById('music-artist'),
    currentTimeEl = document.getElementById('current-time'),
    durationEl = document.getElementById('duration'),
    progress = document.getElementById('progress'),
    playerProgress = document.getElementById('player-progress'),
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


const songs = [
    {
        path: 'assets/Golden.mp3',
        displayName: 'Golden',
        cover: 'assets/Golden.png',
        artist: 'Kpop Demon Hunters, Huntrix',
    },
    {
        path: 'assets/SodaPop.mp3',
        displayName: 'Soda Pop',
        cover: 'assets/SodaPop.jpeg',
        artist: 'Kpop Demon Hunters, Saja Boys',
    },
    {
        path: 'assets/YourIdol.mp3',
        displayName: 'Your Idol',
        cover: 'assets/YourIdol.jpeg',
        artist: 'Kpop Demon Hunters, Saja Boys',
    },
    {
        path: 'assets/Takedown.mp3',
        displayName: 'Takedown',
        cover: 'assets/Takedown.jpeg',
        artist: 'Kpop Demon Hunters, Huntrix',
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
    
    // Stop visualizer when music is paused
    stopVisualizer();
}

function loadMusic(song) {
    music.src = song.path;
    title.textContent = song.displayName;
    artist.textContent = song.artist;
    image.src = song.cover;
    background.src = song.cover;
}

function changeMusic(direction) {
    musicIndex = (musicIndex + direction + songs.length) % songs.length;
    loadMusic(songs[musicIndex]);
    playMusic();
}

function updateProgressBar() {
    const { duration, currentTime } = music;
    const progressPercent = (currentTime / duration) * 100;
    progress.style.width = `${progressPercent}%`;

    const formatTime = (time) => String(Math.floor(time)).padStart(2, '0');
    durationEl.textContent = `${formatTime(duration / 60)}:${formatTime(duration % 60)}`;
    currentTimeEl.textContent = `${formatTime(currentTime / 60)}:${formatTime(currentTime % 60)}`;
}

function setProgressBar(e) {
    const width = playerProgress.clientWidth;
    const clickX = e.offsetX;
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

function resizeCanvas() {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
}

function drawVisualizer() {
    if (!isVisualizerActive) return;
    
    requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate average audio intensity
    let totalIntensity = 0;
    let bassIntensity = 0;
    
    // Analyze bass frequencies for beat detection (first 10% of frequency data)
    const bassRange = Math.floor(dataArray.length * 0.1);
    
    for (let i = 0; i < dataArray.length; i++) {
        totalIntensity += dataArray[i];
        if (i < bassRange) {
            bassIntensity += dataArray[i];
        }
    }
    
    const avgIntensity = totalIntensity / dataArray.length / 255;
    bassIntensity = (bassIntensity / bassRange) / 255;
    
    // Simple beat detection - emphasize bass for beat response
    const beatMultiplier = 1 + (bassIntensity * 0.01); // Reduced to 1% more intensity on beats

    // Track audio activity for fade out effect
    if (avgIntensity > 0.05) {
        lastAudioActivity = Date.now();
        fadeOutTimer = 0;
    } else {
        const timeSinceActivity = Date.now() - lastAudioActivity;
        fadeOutTimer = Math.min(timeSinceActivity / 1500, 1); // Fade over 1.5 seconds
    }
    
    // Apply fade out effect for low audio levels
    const volumeBasedFade = Math.max(0, (avgIntensity - 0.02) / 0.08);
    const fadeMultiplier = Math.min(1 - fadeOutTimer, volumeBasedFade);
    const adjustedIntensity = avgIntensity * Math.max(fadeMultiplier, 0.1);
    
    // Color based on audio activity: blue (low) to golden (high)
    const blueAmount = Math.max(0, 1 - adjustedIntensity * 2);
    const goldAmount = Math.min(1, adjustedIntensity * 1.5);
    
    // Create horizontal waves
    const numWaves = 20;
    const waveSpacing = canvas.height / (numWaves + 1.5);
    
    for (let wave = 0; wave < numWaves; wave++) {
        const y = waveSpacing * (wave + 1);
        const waveIntensity = Math.max(0.75, adjustedIntensity + (Math.sin(Date.now() * 0.002 + wave) * 0.5)) * fadeMultiplier * beatMultiplier;
        
        // Color interpolation between blue and gold
        const red = Math.floor(goldAmount * 255 + blueAmount * 100);
        const green = Math.floor(goldAmount * 215 + blueAmount * 150);
        const blue = Math.floor(goldAmount * 0 + blueAmount * 255);
        const alpha = Math.max(0.1, waveIntensity * 0.8) * fadeMultiplier;
        
        // Skip drawing if wave is nearly invisible
        if (alpha < 0.05) continue;
        
        canvasCtx.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
        canvasCtx.lineWidth = 2;
        canvasCtx.beginPath();
        
        for (let x = 0; x <= canvas.width; x += 2) {
            const waveHeight = Math.sin((x * 0.01) + (Date.now() * 0.001) + (wave * 0.5)) * 
                              (20 + (adjustedIntensity * 30)) * 
                              (1 + Math.sin(Date.now() * 0.005 + wave) * 0.3) * 
                              (1 + adjustedIntensity * 0.8) *
                              beatMultiplier * // Add beat responsiveness here
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