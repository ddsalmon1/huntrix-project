[1mdiff --git a/index.js b/index.js[m
[1mindex cb8d329..662f66a 100644[m
[1m--- a/index.js[m
[1m+++ b/index.js[m
[36m@@ -330,25 +330,8 @@[m [mfunction drawVisualizer() {[m
     const blueAmount = Math.max(0, 1 - adjustedIntensity * 2);[m
     const goldAmount = Math.min(1, adjustedIntensity * 1.5);[m
     [m
[31m-    // Check for small screen and use dedicated visualizer[m
[31m-    const isSmallScreen = canvas.width <= 320 && canvas.height <= 240;[m
[31m-    [m
[31m-    if (isSmallScreen) {[m
[31m-        drawSmallScreenVisualizer(adjustedIntensity, beatMultiplier, fadeMultiplier, blueAmount, goldAmount);[m
[31m-        return;[m
[31m-    }[m
[31m-    [m
[31m-    // Calculate scale factor based on screen height (reference: 1080p)[m
[31m-    const heightScaleFactor = canvas.height / 1080;[m
[31m-    [m
[31m-    // Apply scaling for larger screens[m
[31m-    const scaledWaveCount = Math.max(10, Math.round(20 * heightScaleFactor));[m
[31m-    const scaledAmplitude = Math.max(8, 20 * heightScaleFactor);[m
[31m-    const scaledIntensityMultiplier = Math.max(12, 30 * heightScaleFactor);[m
[31m-    const scaledBloomSize = Math.max(4, 8 * heightScaleFactor);[m
[31m-    const scaledLineWidth = Math.max(0.8, 1.5 * heightScaleFactor);[m
[31m-    [m
[31m-    const numWaves = scaledWaveCount;[m
[32m+[m[32m    // Create horizontal waves[m
[32m+[m[32m    const numWaves = 20;[m
     const waveSpacing = canvas.height / (numWaves + 1.5);[m
 [m
     for (let wave = 0; wave < numWaves; wave++) {[m
[36m@@ -383,7 +366,7 @@[m [mfunction drawVisualizer() {[m
         const bloomIntensity = waveIntensity * 0.2;[m
         [m
         for (let bloom = 0; bloom < bloomLayers; bloom++) {[m
[31m-            const bloomSize = (bloom + 1) * scaledBloomSize;[m
[32m+[m[32m            const bloomSize = (bloom + 1) * 8;[m
             const bloomAlpha = (bloomIntensity / (bloom + 1)) * 0.3;[m
             [m
             if (bloomAlpha > 0.02) {[m
[36m@@ -393,7 +376,7 @@[m [mfunction drawVisualizer() {[m
                 [m
                 for (let x = 0; x <= canvas.width; x += 2) {[m
                     const waveHeight = Math.sin((x * 0.01) + (Date.now() * 0.001) + (wave * 0.5)) * [m
[31m-                                      (scaledAmplitude + (adjustedIntensity * scaledIntensityMultiplier)) * [m
[32m+[m[32m                                      (20 + (adjustedIntensity * 30)) *[m[41m [m
                                       (1 + Math.sin(Date.now() * 0.005 + wave) * 0.3) * [m
                                       (1 + adjustedIntensity * 0.8) *[m
                                       beatMultiplier *[m
[36m@@ -413,12 +396,12 @@[m [mfunction drawVisualizer() {[m
         }[m
         [m
         canvasCtx.strokeStyle = gradient;[m
[31m-        canvasCtx.lineWidth = scaledLineWidth;[m
[32m+[m[32m        canvasCtx.lineWidth = 1.5;[m
         canvasCtx.beginPath();[m
         [m
         for (let x = 0; x <= canvas.width; x += 2) {[m
             const waveHeight = Math.sin((x * 0.01) + (Date.now() * 0.001) + (wave * 0.5)) * [m
[31m-                              (scaledAmplitude + (adjustedIntensity * scaledIntensityMultiplier)) * [m
[32m+[m[32m                              (20 + (adjustedIntensity * 30)) *[m[41m [m
                               (1 + Math.sin(Date.now() * 0.005 + wave) * 0.3) * [m
                               (1 + adjustedIntensity * 0.8) *[m
                               beatMultiplier *[m
[36m@@ -437,112 +420,6 @@[m [mfunction drawVisualizer() {[m
     }[m
 }[m
 [m
[31m-// Dedicated visualizer for 320x240 screens[m
[31m-function drawSmallScreenVisualizer(adjustedIntensity, beatMultiplier, fadeMultiplier, blueAmount, goldAmount) {[m
[31m-    // Proportional scaling based on 320x240 vs reference resolution (1920x1080)[m
[31m-    const scaleFactorX = canvas.width / 1920;[m
[31m-    const scaleFactorY = canvas.height / 1080;[m
[31m-    const avgScaleFactor = (scaleFactorX + scaleFactorY) / 2;[m
[31m-    [m
[31m-    // Optimized settings for clean, smooth lines similar to the original[m
[31m-    const numWaves = Math.max(10, Math.round(20 * scaleFactorY)); // Fewer waves for cleaner look[m
[31m-    const amplitude = 15 * Math.max(0.4, avgScaleFactor); // Slightly higher amplitude for visibility[m
[31m-    const intensityMultiplier = 25 * Math.max(0.8, avgScaleFactor); // Strong intensity response[m
[31m-    const bloomSize = 6 * Math.max(1, avgScaleFactor); // Balanced bloom effect[m
[31m-    const lineWidth = 1.2 * Math.max(0.7, avgScaleFactor); // Slightly thicker for clarity[m
[31m-    [m
[31m-    const waveSpacing = canvas.height / (numWaves + 1);[m
[31m-    [m
[31m-    for (let wave = 0; wave < numWaves; wave++) {[m
[31m-        const y = waveSpacing * (wave + 1.5);[m
[31m-        [m
[31m-        // Refined intensity calculation for smoother waves[m
[31m-        const waveIntensity = Math.max(1, adjustedIntensity + (Math.sin(Date.now() * 0.002 + wave) * 0.4)) * fadeMultiplier * beatMultiplier;[m
[31m-        [m
[31m-        // Same color interpolation between blue and gold[m
[31m-        const red = Math.floor(goldAmount * 255 + blueAmount * 6);[m
[31m-        const green = Math.floor(goldAmount * 215 + blueAmount * 99);[m
[31m-        const blue = Math.floor(goldAmount * 0 + blueAmount * 181);[m
[31m-        const alpha = Math.max(0.1, waveIntensity * 0.8) * fadeMultiplier;[m
[31m-        [m
[31m-        // Skip drawing if wave is nearly invisible[m
[31m-        if (alpha < 0.05) continue;[m
[31m-        [m
[31m-        // Proportionally scaled neon glow effect with gradient[m
[31m-        const gradient = canvasCtx.createLinearGradient(0, y - (10 * avgScaleFactor), 0, y + (10 * avgScaleFactor));[m
[31m-        [m
[31m-        // Outer glow[m
[31m-        gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.6})`);[m
[31m-        // Middle core (brighter neon effect)[m
[31m-        const neonRed = Math.floor(goldAmount * 255 + blueAmount * 123);[m
[31m-        const neonGreen = Math.floor(goldAmount * 255 + blueAmount * 213);[m
[31m-        const neonBlue = Math.floor(goldAmount * 100 + blueAmount * 255);[m
[31m-        gradient.addColorStop(0.5, `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${alpha})`);[m
[31m-        // Outer glow[m
[31m-        gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, ${alpha * 0.8})`);[m
[31m-        [m
[31m-        // Same bloom effect - multiple layers of expanding glow with maintained intensity[m
[31m-        const bloomLayers = 3;[m
[31m-        const bloomIntensity = waveIntensity * 0.2; // Same intensity as original visualizer[m
[31m-        [m
[31m-        for (let bloom = 0; bloom < bloomLayers; bloom++) {[m
[31m-            const currentBloomSize = (bloom + 1) * bloomSize;[m
[31m-            const bloomAlpha = (bloomIntensity / (bloom + 1)) * 0.3;[m
[31m-            [m
[31m-            if (bloomAlpha > 0.02) {[m
[31m-                canvasCtx.strokeStyle = `rgba(${neonRed}, ${neonGreen}, ${neonBlue}, ${bloomAlpha})`;[m
[31m-                canvasCtx.lineWidth = currentBloomSize;[m
[31m-                canvasCtx.beginPath();[m
[31m-                [m
[31m-                // Smoother wave calculation with optimized frequency[m
[31m-                for (let x = 0; x <= canvas.width; x += Math.max(1, Math.round(1.5 * avgScaleFactor))) {[m
[31m-                    const waveHeight = Math.sin((x * 0.008 * (1920 / canvas.width)) + (Date.now() * 0.001) + (wave * 0.5)) * [m
[31m-                                      (amplitude + (adjustedIntensity * intensityMultiplier)) * [m
[31m-                                      (1 + Math.sin(Date.now() * 0.004 + wave) * 0.25) * [m
[31m-                                      (1 + adjustedIntensity * 0.6) *[m
[31m-                                      beatMultiplier *[m
[31m-                                      fadeMultiplier;[m
[31m-                   [m
[31m-                    const currentY = y + waveHeight;[m
[31m-                    [m
[31m-                    if (x === 0) {[m
[31m-                        canvasCtx.moveTo(x, currentY);[m
[31m-                    } else {[m
[31m-                        canvasCtx.lineTo(x, currentY);[m
[31m-                    }[m
[31m-                }[m
[31m-                [m
[31m-                canvasCtx.stroke();[m
[31m-            }[m
[31m-        }[m
[31m-        [m
[31m-        // Main wave drawing[m
[31m-        canvasCtx.strokeStyle = gradient;[m
[31m-        canvasCtx.lineWidth = lineWidth;[m
[31m-        canvasCtx.beginPath();[m
[31m-        [m
[31m-        // Smoother main wave calculation[m
[31m-        for (let x = 0; x <= canvas.width; x += Math.max(1, Math.round(1.5 * avgScaleFactor))) {[m
[31m-            const waveHeight = Math.sin((x * 0.008 * (1920 / canvas.width)) + (Date.now() * 0.001) + (wave * 0.5)) * [m
[31m-                              (amplitude + (adjustedIntensity * intensityMultiplier)) * [m
[31m-                              (1 + Math.sin(Date.now() * 0.004 + wave) * 0.25) * [m
[31m-                              (1 + adjustedIntensity * 0.6) *[m
[31m-                              beatMultiplier *[m
[31m-                              fadeMultiplier;[m
[31m-            [m
[31m-            const currentY = y + waveHeight;[m
[31m-            [m
[31m-            if (x === 0) {[m
[31m-                canvasCtx.moveTo(x, currentY);[m
[31m-            } else {[m
[31m-                canvasCtx.lineTo(x, currentY);[m
[31m-            }[m
[31m-        }[m
[31m-        [m
[31m-        canvasCtx.stroke();[m
[31m-    }[m
[31m-}[m
[31m-[m
 function stopVisualizer() {[m
     isVisualizerActive = false;[m
 }[m
