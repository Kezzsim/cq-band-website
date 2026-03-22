# Simple HTML5 Website

A clean, responsive HTML5 website with a scrolling background image effect.

## Features

- **HTML5 Boilerplate**: Complete with all standard meta tags including Open Graph and Twitter Card support
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Scrolling Background Effect**: Background image moves down by 20% when scrolling, creating a subtle parallax effect
- **SEO Optimized**: Includes proper meta tags, structured data, and semantic HTML
- **Progressive Web App Ready**: Includes web manifest and favicon support
- **Accessible**: Built with accessibility best practices

## Files Structure

```
├── index.html          # Main HTML file with complete boilerplate
├── style.css           # CSS styles and responsive design
├── script.js           # JavaScript for scroll effects
├── favicon.svg         # SVG favicon icon
├── site.webmanifest    # Web App manifest
└── images/
    └── bg.jpg          # Background image (1237x765)
```

## Background Image

The website uses the existing `images/bg.jpg` file as the background image. The image is:
- Centered on the page
- Sized at 1237x765 pixels (with responsive scaling)
- Moves down by 20% of scroll distance when scrolling

## Usage

1. Open `index.html` in a web browser
2. Scroll down to see the background image effect
3. The background image will move downward at 20% of your scroll speed

## Customization

### Change Background Image
Replace `images/bg.jpg` with your own image, or update the CSS in `style.css`:

```css
.background-image {
    background-image: url('path/to/your/image.jpg');
}
```

### Adjust Scroll Speed
Modify the scroll multiplier in `script.js`:

```javascript
// Change 0.2 to any value between 0 and 1
const offset = scrollTop * 0.2; // 0.2 = 20%
```

### Update Meta Information
Edit the meta tags in `index.html` to match your website:
- Title
- Description
- Author
- Open Graph data
- Twitter Card data

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## Performance

- Uses `requestAnimationFrame` for smooth scrolling
- Passive event listeners for better performance
- CSS backdrop-filter for modern browsers
- Optimized for 60fps scrolling