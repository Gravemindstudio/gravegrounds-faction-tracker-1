# GraveGrounds Player Search System

## Overview
The search system allows users to find other players across all factions in GraveGrounds. It integrates seamlessly with the existing theme system and respects user privacy settings.

## Features

### 🔍 Search Functionality
- **Username Search**: Find players by partial username matches
- **Faction Filter**: Filter results by specific factions
- **Recent Activity**: View recently active players
- **Privacy Respect**: Only shows users with public profiles

### 🎨 Theme Integration
- Automatically loads and applies user's custom theme
- Uses existing CSS variables for consistent styling
- Responsive design that works on all devices

### 🔐 Authentication
- Requires login to search (protects user privacy)
- Integrates with existing auth system
- Respects user session management

## How It Works

### Backend API Endpoints
- `GET /api/users/search` - Search with filters (query, faction, pagination)
- `GET /api/users/faction/:faction` - Get all users in a specific faction
- `GET /api/users/recent` - Get recently active users
- `PUT /api/users/activity` - Update user's last activity timestamp

### Database Changes
- Added `profile_visibility` column (default: 'public')
- Added `last_activity` column for tracking user activity
- Added `searchable_username` column for better search performance

### Frontend Components
- **Search Page** (`search.html`): Dedicated search interface
- **Navigation Search**: Quick search bar in all page headers
- **User Cards**: Display search results with profile previews
- **Profile Modal**: Quick view of user information

## Usage

### Basic Search
1. Navigate to the Search page or use the navigation search bar
2. Enter a username or partial username
3. Optionally select a faction filter
4. Click search or press Enter

### Faction-Specific Search
1. Use the faction dropdown to filter by specific factions
2. Results show only members of that faction
3. Useful for finding allies within your own faction

### Recent Activity
1. Click "Recent Activity" button
2. View users who have been active recently
3. Great for finding active community members

### Privacy Controls
- Users can set their profile visibility to 'public' or 'private'
- Only public profiles appear in search results
- Private profiles are completely hidden from searches

## Integration Points

### Navigation
- Added to all page headers for easy access
- Consistent styling across all pages
- Responsive design that hides on mobile

### Profile Page
- Added "Find Other Players" button
- Integrates with existing profile actions
- Maintains theme consistency

### Gallery Page
- Added search button for finding creators
- Helps users discover new artists
- Consistent with gallery design

## Technical Details

### Search Algorithm
- Case-insensitive username matching
- Partial string matching (e.g., "john" finds "johnny")
- Optimized with searchable_username column
- Pagination support for large result sets

### Performance
- Database indexes on username and faction
- Efficient SQL queries with proper joins
- Pagination to limit result sizes
- Caching of recent search results

### Security
- Authentication required for all search endpoints
- User privacy respected through visibility settings
- Rate limiting on search requests
- Input validation and sanitization

## Future Enhancements

### Planned Features
- **Advanced Filters**: Age, join date, activity level
- **Sorting Options**: By name, faction, activity, join date
- **Saved Searches**: Remember frequently used search criteria
- **Search History**: Track what users have searched for
- **Recommendations**: Suggest users based on faction and activity

### Potential Integrations
- **Messaging System**: Direct communication between users
- **Friend Requests**: Add other players as friends
- **Faction Invites**: Invite users to join your faction
- **Activity Feeds**: Show what other users are doing

## Maintenance

### Database Updates
- New columns are added automatically on server start
- Existing users get default privacy settings
- Searchable usernames are generated automatically

### Performance Monitoring
- Monitor search query performance
- Track popular search terms
- Optimize database indexes as needed

### User Experience
- Gather feedback on search functionality
- Monitor search success rates
- Improve result relevance over time

## Support

For issues or questions about the search system:
1. Check the browser console for JavaScript errors
2. Verify user authentication status
3. Check server logs for API errors
4. Ensure database columns exist and are properly indexed

The search system is designed to be robust and user-friendly while maintaining the dark, atmospheric aesthetic of GraveGrounds.
