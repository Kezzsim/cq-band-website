// Background scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const backgroundImage = document.getElementById('backgroundImage');
    const foregroundImage = document.getElementById('foregroundImage');
    const middlegroundImage = document.getElementById('middlegroundImage');
    let ticking = false;
    let totalScrollDistance = 0;

    function updateBackgroundPosition() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calculate the vertical offset: scroll distance * 20% (0.2)
        const verticalOffset = scrollTop * -0.2;
        
        // Apply the same vertical transform to background and foreground layers
        const verticalTransform = `translateY(${verticalOffset}px)`;
        backgroundImage.style.transform = verticalTransform;
        foregroundImage.style.transform = verticalTransform;
        
        // Calculate horizontal movement for middleground (up to 70% of screen width)
        // Use total accumulated scroll for smoother horizontal movement
        totalScrollDistance += (scrollTop - (totalScrollDistance / 1.1)) * 0.1; // Smooth accumulation
        const maxHorizontalMove = window.innerWidth * 0.55; // 70% / 2 = 35% in each direction
        const horizontalOffset = Math.max(-maxHorizontalMove, Math.min(maxHorizontalMove, totalScrollDistance * 0.5));
        
        // Apply both horizontal and vertical movement to middleground to sync with background layers
        middlegroundImage.style.transform = `translate(calc(-50% + ${horizontalOffset}px), calc(-50% + ${verticalOffset}px))`;
        
        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(updateBackgroundPosition);
            ticking = true;
        }
    }

    // Add scroll event listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Handle touch events for better mobile experience
    let touchStartY = 0;
    let lastTouchY = 0;
    let touchVelocity = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
        lastTouchY = touchStartY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        const currentTouchY = e.changedTouches[0].screenY;
        touchVelocity = currentTouchY - lastTouchY;
        lastTouchY = currentTouchY;
        
        // Add touch-based horizontal movement to middleground
        totalScrollDistance += touchVelocity * 0.3;
        
        onScroll(); // Trigger the same scroll effect
    }, { passive: true });

    // Optional: Add mouse wheel support for more precise control
    window.addEventListener('wheel', function(e) {
        // Let the default scrolling behavior happen, then update background
        setTimeout(onScroll, 0);
    }, { passive: true });

    // Initialize background position
    updateBackgroundPosition();
});

// Smooth scroll for any anchor links (optional enhancement)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Optional: Add loading state management
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
});