// Background scroll effect
document.addEventListener('DOMContentLoaded', function() {
    const backgroundImage = document.getElementById('backgroundImage');
    let ticking = false;

    function updateBackgroundPosition() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Calculate the offset: scroll distance * 20% (0.2)
        const offset = scrollTop * -0.2;
        
        // Apply the transform with the vertical offset
        // The background starts at the top (0) and moves down by the offset
        backgroundImage.style.transform = `translateY(${offset}px)`;
        
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
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchmove', function(e) {
        touchEndY = e.changedTouches[0].screenY;
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