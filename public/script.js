document.addEventListener('DOMContentLoaded', () => {
    const waterElement = document.getElementById('water');
    const usageText = document.getElementById('usage-text');
    const apiStatus = document.getElementById('api-status');
    const sliderContainer = document.getElementById('slider-container');
    const manualUsage = document.getElementById('manual-usage');
    
    // We want 0% usage to be ankle height (around 10%)
    // and 100% usage to be drowning (around 95%)
    const MIN_WATER_HEIGHT = 10;
    const MAX_WATER_HEIGHT = 95;
    
    let isUsingManual = false;

    function updateWaterLevel(usagePercentage) {
        // Clamp percentage between 0 and 100
        const clampedUsage = Math.max(0, Math.min(100, usagePercentage));
        
        // Map 0-100% to MIN_WATER_HEIGHT-MAX_WATER_HEIGHT
        const mappedHeight = MIN_WATER_HEIGHT + (clampedUsage / 100) * (MAX_WATER_HEIGHT - MIN_WATER_HEIGHT);
        
        waterElement.style.height = `${mappedHeight}%`;
        usageText.textContent = `${clampedUsage}%`;

        // Handle unconscious state at 95%+
        const superheroImg = document.getElementById('superhero');
        if (clampedUsage >= 95) {
            superheroImg.src = 'superhero_unconscious.png';
            superheroImg.classList.add('floating');
        } else {
            superheroImg.src = 'superhero.png';
            superheroImg.classList.remove('floating');
        }
        
        // Update slider visually if not manually interacting
        if (!isUsingManual) {
            manualUsage.value = clampedUsage;
        }
    }

    let notifiedThresholds = {
        50: false,
        75: false,
        90: false
    };

    function checkNotifications(usage) {
        if (Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        const thresholds = [50, 75, 90];
        
        // Reset notifications if usage drops (e.g. week resets)
        if (usage < 50) {
            notifiedThresholds = { 50: false, 75: false, 90: false };
        }

        for (const threshold of thresholds) {
            if (usage >= threshold && !notifiedThresholds[threshold]) {
                notifiedThresholds[threshold] = true;
                if (Notification.permission === "granted") {
                    new Notification("Claude Usage Alert", {
                        body: `Your Claude usage has reached ${usage}%!`,
                        silent: false
                    });
                }
            }
        }
    }

    async function fetchClaudeUsage() {
        if (isUsingManual) return; // Don't override if user is playing with slider

        try {
            const response = await fetch('/api/usage');
            if (!response.ok) throw new Error('API Error');
            
            const data = await response.json();
            
            // We use sessionUsage as the primary metric, fallback to weekUsage
            let usage = data.sessionUsage !== null ? data.sessionUsage : data.weekUsage;
            
            let resetTime = data.sessionReset ? data.sessionReset : data.weekReset;
            if (resetTime) {
                document.getElementById('reset-time-text').textContent = resetTime;
            } else {
                document.getElementById('reset-time-text').textContent = "Unknown";
            }
            
            if (usage !== null) {
                updateWaterLevel(usage);
                checkNotifications(usage);
                apiStatus.textContent = 'Live tracking Claude Code CLI';
                apiStatus.style.color = '#7ee787'; // Green
            } else {
                apiStatus.textContent = 'CLI Rate Limited. Use manual slider.';
                apiStatus.style.color = '#ff7b72'; // Red
            }
        } catch (error) {
            console.error('Error fetching usage:', error);
            apiStatus.textContent = 'API connection failed. Using manual mode.';
            apiStatus.style.color = '#ff7b72'; // Red
        }
    }

    // Manual slider listener
    manualUsage.addEventListener('input', (e) => {
        isUsingManual = true;
        apiStatus.textContent = 'Manual override active';
        apiStatus.style.color = '#d2a8ff'; // Purple
        const usage = parseInt(e.target.value, 10);
        updateWaterLevel(usage);
        checkNotifications(usage); // Test notifications via slider
    });

    // Request notification permission on startup
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }

    const superheroImg = document.getElementById('superhero');

    // Create bubbles
    const bubblesContainer = document.getElementById('bubbles-container');
    for (let i = 0; i < 15; i++) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        
        // Randomize size, position, and animation duration
        const size = Math.random() * 10 + 5; // 5px to 15px
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        
        const duration = Math.random() * 3 + 2; // 2s to 5s
        bubble.style.animationDuration = `${duration}s`;
        
        const delay = Math.random() * 5;
        bubble.style.animationDelay = `${delay}s`;
        
        bubblesContainer.appendChild(bubble);
    }

    // Fetch immediately
    fetchClaudeUsage();
    
    // Then poll every 15 minutes (900000 ms) instead of 5 minutes
    setInterval(fetchClaudeUsage, 900000);
});
