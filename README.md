# GraveGrounds Faction Tracker

A modern, professional web application for tracking faction membership and building necromancer identities in the GraveGrounds card game universe.

## ✨ Features

### 🏴‍☠️ Faction System
- **Bone March** - Masters of skeletal magic and undead legions
- **Choir of Silence** - Whisperers of forbidden knowledge and shadow magic  
- **Shadow Cult** - Devotees of darkness and void magic
- Real-time member counts and growth statistics
- Faction-specific visual themes and styling

### 👤 User Experience
- Clean, modern UI with smooth animations
- Responsive design for all devices
- Smooth navigation with active state tracking
- Professional authentication system
- Interactive faction selection

### 🎨 Visual Design
- Modern gradient backgrounds and shadows
- Smooth hover effects and transitions
- Professional color scheme and typography
- Faction-specific visual elements
- Mobile-first responsive design

### 🔧 Technical Features
- Vanilla JavaScript (no framework dependencies)
- CSS Grid and Flexbox for layouts
- Intersection Observer for scroll animations
- Debounced scroll handlers for performance
- Modal system with tab switching
- Notification system with auto-dismiss

## 🚀 Quick Start

### Local Development
1. **Clone or download** the project files
2. **Open `index.html`** in your web browser
3. **That's it!** No build process or dependencies required

### File Structure
```
gravegrounds-app/
├── index.html          # Main HTML file
├── styles.css          # All CSS styles and animations
├── script.js           # JavaScript functionality
└── README.md           # This file
```

## 🌐 Deployment

### Vercel (Recommended)
1. **Push code to GitHub**
2. **Connect Vercel** to your repository
3. **Deploy automatically** - Vercel handles the rest

### Other Hosting Options
- **Netlify** - Drag and drop deployment
- **GitHub Pages** - Free hosting for public repos
- **Traditional hosting** - Upload files to any web server

## 🎯 Core Functionality

### Authentication System
- Login/Signup modal with tab switching
- Form validation and loading states
- Simulated API calls (ready for backend integration)
- User session management

### Navigation
- Fixed navigation bar with backdrop blur
- Smooth scrolling to sections
- Active state tracking based on scroll position
- Mobile-responsive menu

### Interactive Elements
- Clickable faction cards with hover effects
- Gallery items with smooth animations
- Form submissions with loading states
- Toast notifications for user feedback

## 🎨 Customization

### Adding New Factions
1. **Update HTML** - Add new faction items in the factions section
2. **Add CSS classes** - Create faction-specific styling
3. **Update JavaScript** - Add faction logic if needed

### Theme System
The app uses CSS custom properties for easy theming:
```css
:root {
    --primary-color: #6366f1;
    --secondary-color: #8b5cf6;
    --accent-color: #f59e0b;
    /* Add your custom colors here */
}
```

### Adding New Features
- **Profile System** - Extend the user menu
- **Image Upload** - Add file input handling
- **Real-time Updates** - Integrate WebSocket connections
- **Database Integration** - Connect to your backend

## 📱 Responsive Design

### Breakpoints
- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px - 1199px (adjusted grid)
- **Mobile**: < 768px (single column layout)

### Mobile Features
- Touch-friendly button sizes
- Optimized navigation for small screens
- Responsive typography scaling
- Mobile-first CSS approach

## 🔒 Security Considerations

### Current Implementation
- Client-side form validation
- Simulated authentication (demo purposes)
- No sensitive data storage

### Production Ready
- Implement proper backend authentication
- Add CSRF protection
- Use HTTPS for all connections
- Implement rate limiting
- Add input sanitization

## 🚧 Future Enhancements

### Planned Features
- **User Profiles** - Customizable necromancer identities
- **Image Upload** - Profile picture and design sharing
- **Faction Wars** - Community events and competitions
- **Badge System** - Achievement tracking
- **Real-time Stats** - Live faction member counts

### Technical Improvements
- **Backend API** - Node.js/Express or similar
- **Database** - PostgreSQL or MongoDB
- **Image Storage** - AWS S3 or similar
- **Real-time Updates** - WebSocket or Server-Sent Events
- **Progressive Web App** - Offline functionality

## 🛠️ Browser Support

- **Chrome** 80+
- **Firefox** 75+
- **Safari** 13+
- **Edge** 80+

## 📄 License

This project is created for GraveGrounds and is proprietary software.

## 🤝 Contributing

For development questions or feature requests, please contact the development team.

---

**Built with ❤️ for the GraveGrounds community**
