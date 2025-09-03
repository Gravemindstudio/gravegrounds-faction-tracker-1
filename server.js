// Load environment variables
require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const nsfwjs = require('nsfwjs');
const sharp = require('sharp');

const app = express();
const server = http.createServer(app);
// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
  ["http://localhost:3000", "http://localhost:8080"];

// Validate that we have proper CORS configuration in production
if (process.env.NODE_ENV === 'production' && (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.includes('your-app-name'))) {
  console.warn('⚠️  WARNING: CORS origins not properly configured for production!');
  console.warn('Please set ALLOWED_ORIGINS environment variable with your actual domain.');
}

const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? allowedOrigins : "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    body: req.body,
    headers: req.headers['content-type']
  });
  next();
});

// Add cache-busting headers for JavaScript files
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static('.')); // Serve static files
app.use('/uploads', express.static('uploads', {
  maxAge: '1y', // Cache uploaded files for 1 year
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    // Ensure proper headers for image files
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/' + path.split('.').pop());
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    }
  }
})); // Serve uploaded files

// Create uploads directory if it doesn't exist
const uploadsDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and preserve original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname).toLowerCase();
    const baseName = file.fieldname === 'characterImage' ? 'gallery' : 'avatar';
    cb(null, baseName + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Initialize NSFW.js model
let nsfwModel = null;
nsfwjs.load().then(model => {
  nsfwModel = model;
  console.log('NSFW.js model loaded successfully');
}).catch(err => {
  console.error('Failed to load NSFW.js model:', err);
});

// Nudity detection middleware
async function checkImageForNudity(filePath) {
  if (!nsfwModel) {
    console.warn('NSFW model not loaded, skipping nudity check');
    return { isSafe: true, confidence: 0, reason: 'Model not loaded' };
  }

  try {
    // Resize image to 224x224 for the model (required size)
    const resizedImageBuffer = await sharp(filePath)
      .resize(224, 224)
      .jpeg()
      .toBuffer();

    // Convert buffer to tensor for NSFW.js
    const image = await nsfwModel.classify(resizedImageBuffer);
    
    // Get the highest probability class
    const predictions = image[0];
    const topPrediction = predictions.reduce((max, current) => 
      current.probability > max.probability ? current : max
    );

    // Define NSFW classes (these are the categories NSFW.js detects)
    const nsfwClasses = ['Porn', 'Sexy', 'Hentai'];
    const isNsfw = nsfwClasses.includes(topPrediction.className);
    
    // Set confidence threshold (adjust as needed)
    const confidenceThreshold = parseFloat(process.env.NSFW_CONFIDENCE_THRESHOLD) || 0.5;
    const isUnsafe = isNsfw && topPrediction.probability > confidenceThreshold;

    console.log('NSFW Detection Results:', {
      className: topPrediction.className,
      probability: topPrediction.probability,
      isUnsafe: isUnsafe,
      allPredictions: predictions.map(p => ({ class: p.className, prob: p.probability }))
    });

    return {
      isSafe: !isUnsafe,
      confidence: topPrediction.probability,
      detectedClass: topPrediction.className,
      reason: isUnsafe ? `Detected ${topPrediction.className} content with ${(topPrediction.probability * 100).toFixed(1)}% confidence` : 'Content appears safe'
    };

  } catch (error) {
    console.error('Error during nudity detection:', error);
    // If detection fails, allow the upload but log the error
    return { 
      isSafe: true, 
      confidence: 0, 
      reason: 'Detection failed - allowing upload',
      error: error.message 
    };
  }
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database setup
const db = new sqlite3.Database('./factions.db');

// Initialize database tables
db.serialize(() => {
  // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      faction TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Add avatar_url column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE users ADD COLUMN avatar_url TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding avatar_url column:', err);
      }
    });
    
    // Add faction_join_date column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE users ADD COLUMN faction_join_date DATETIME`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding faction_join_date column:', err);
      } else {
        // For existing users without faction_join_date, set it to their account creation date
        db.run(`UPDATE users SET faction_join_date = created_at WHERE faction_join_date IS NULL`, (err) => {
          if (err) {
            console.error('Error updating existing users faction join date:', err);
          } else {
            console.log('Updated faction join dates for existing users');
          }
        });
      }
    });
    
    // Add privacy settings and last activity columns if they don't exist
    db.run(`ALTER TABLE users ADD COLUMN profile_visibility TEXT DEFAULT 'public'`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding profile_visibility column:', err);
      }
    });
    
    // Add last_activity column without default (we'll set it manually)
    db.run(`ALTER TABLE users ADD COLUMN last_activity DATETIME`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding last_activity column:', err);
      } else {
        // Set default value for existing users
        db.run(`UPDATE users SET last_activity = created_at WHERE last_activity IS NULL`, (err) => {
          if (err) {
            console.error('Error updating last_activity for existing users:', err);
          } else {
            console.log('Updated last_activity for existing users');
          }
        });
      }
    });
    
    // Add searchable_username column for better search performance
    db.run(`ALTER TABLE users ADD COLUMN searchable_username TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding searchable_username column:', err);
      } else {
        // Update existing users to have searchable usernames
        db.run(`UPDATE users SET searchable_username = LOWER(username) WHERE searchable_username IS NULL`, (err) => {
          if (err) {
            console.error('Error updating searchable usernames:', err);
          } else {
            console.log('Updated searchable usernames for existing users');
          }
        });
      }
    });
    
    // Create trigger to automatically set faction_join_date for new users
    db.run(`CREATE TRIGGER IF NOT EXISTS set_faction_join_date 
            AFTER INSERT ON users 
            BEGIN
              UPDATE users SET faction_join_date = CURRENT_TIMESTAMP WHERE id = NEW.id AND faction_join_date IS NULL;
            END`, (err) => {
      if (err) {
        console.error('Error creating faction_join_date trigger:', err);
      } else {
        console.log('Faction join date trigger created successfully');
      }
    });
    
    // Create trigger to automatically set last_activity for new users
    db.run(`CREATE TRIGGER IF NOT EXISTS set_last_activity 
            AFTER INSERT ON users 
            BEGIN
              UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = NEW.id AND last_activity IS NULL;
            END`, (err) => {
      if (err) {
        console.error('Error creating last_activity trigger:', err);
      } else {
        console.log('Last activity trigger created successfully');
      }
    });

  // Faction stats table
  db.run(`CREATE TABLE IF NOT EXISTS faction_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    faction TEXT UNIQUE NOT NULL,
    member_count INTEGER DEFAULT 0,
    weekly_growth INTEGER DEFAULT 0,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Gallery table for necromancer characters
  db.run(`CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    faction TEXT NOT NULL,
    character_name TEXT,
    description TEXT,
    image_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (faction) REFERENCES faction_stats (faction)
  )`);

  // Initialize faction stats with default values
  const factions = [
    'bone-march',
    'choir-silence', 
    'cult-withered-flame',
    'gravewrought-court',
    'swarm-mireborn',
    'dawnflame-order',
    'hollowed-redeemed'
  ];

  factions.forEach(faction => {
    db.run(`INSERT OR IGNORE INTO faction_stats (faction, member_count, weekly_growth) 
            VALUES (?, ?, ?)`, [faction, 0, 0]);
  });
});

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'gravegrounds-secret-key-change-in-production';

// Security validation
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'gravegrounds-secret-key-change-in-production') {
    console.error('🚨 CRITICAL SECURITY ERROR: JWT_SECRET not properly configured for production!');
    console.error('Please set a secure JWT_SECRET environment variable.');
    process.exit(1);
  }
  
  if (JWT_SECRET.length < 32) {
    console.error('🚨 SECURITY WARNING: JWT_SECRET should be at least 32 characters long!');
  }
  
  console.log('✅ Security: JWT_SECRET is properly configured');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth header:', authHeader);
  console.log('Token:', token ? 'Present' : 'Missing');

  if (!token) {
    console.log('No token provided, returning 401');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    console.log('Token verified for user:', user.userId);
    req.user = user;
    next();
  });
};

// API Routes

// Get all faction stats
app.get('/api/factions', (req, res) => {
  db.all('SELECT * FROM faction_stats ORDER BY member_count DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(rows);
  });
});

// Get specific faction stats
app.get('/api/factions/:faction', (req, res) => {
  const { faction } = req.params;
  db.get('SELECT * FROM faction_stats WHERE faction = ?', [faction], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Faction not found' });
      return;
    }
    res.json(row);
  });
});

// Get specific faction stats (alternative endpoint)
app.get('/api/factions/:faction/stats', (req, res) => {
  const { faction } = req.params;
  
  // First get the specific faction stats
  db.get('SELECT * FROM faction_stats WHERE faction = ?', [faction], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Faction not found' });
      return;
    }
    
    // Then get all factions to calculate rank
    db.all('SELECT faction, member_count FROM faction_stats ORDER BY member_count DESC', (err, allFactions) => {
      if (err) {
        // If we can't get rank, just return the faction stats
        res.json(row);
        return;
      }
      
      // Calculate rank based on member count
      const rank = allFactions.findIndex(f => f.faction === faction) + 1;
      
      // Return faction stats with rank
      res.json({
        ...row,
        rank: rank
      });
    });
  });
});

// User signup
app.post('/api/signup', async (req, res) => {
  console.log('Signup request received:', req.body);
  const { username, email, password, faction } = req.body;

  // Convert email to lowercase for consistency
  const normalizedEmail = email.toLowerCase();

  // Validation
  console.log('Validation check:', { username, email: normalizedEmail, password, faction });
  if (!username || !normalizedEmail || !password || !faction) {
    console.log('Validation failed - missing fields');
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Hash password (keep original case for security)
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Insert user (faction_join_date will be set automatically by the database trigger or default)
    db.run(
      'INSERT INTO users (username, email, password_hash, faction) VALUES (?, ?, ?, ?)',
      [username, normalizedEmail, passwordHash, faction],
      function(err) {
        if (err) {
          console.error('Database insert error:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        console.log('User inserted successfully, updating faction stats');
        // Update faction member count
        updateFactionStats(faction, 1, 1)
          .then(updatedFaction => {
            console.log('Faction stats updated successfully');
            // Create JWT token
            const token = jwt.sign({ userId: this.lastID, username, email: normalizedEmail, faction }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

            // Update last activity for new user
            db.run('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?', [this.lastID], (err) => {
              if (err) {
                console.error('Error updating last activity on signup:', err);
              } else {
                console.log('Updated last activity for new user:', this.lastID);
              }
            });
            
            res.json({ 
              message: 'Account created successfully', 
              token,
              user: { id: this.lastID, username, email: normalizedEmail, faction }
            });
          })
          .catch(err => {
            console.error('Error updating faction stats after signup:', err);
            res.status(500).json({ error: 'Server error' });
          });
      }
    );
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Convert email to lowercase for consistent lookup
  const normalizedEmail = email.toLowerCase();

  console.log('Login attempt for email:', normalizedEmail);

  if (!normalizedEmail || !password) {
    console.log('Missing email or password');
    return res.status(400).json({ error: 'Email and password are required' });
  }

  db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail], async (err, user) => {
    if (err) {
      console.log('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      console.log('User not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, username: user.username, email: user.email, faction: user.faction });

    try {
      // Compare password with original case (case-sensitive for security)
      const validPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Password validation result:', validPassword);
      
      if (!validPassword) {
        console.log('Invalid password for user:', normalizedEmail);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ userId: user.id, username: user.username, email: user.email, faction: user.faction }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

      console.log('Login successful for user:', normalizedEmail);
      
      // Update last activity
      db.run('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?', [user.id], (err) => {
        if (err) {
          console.error('Error updating last activity on login:', err);
        } else {
          console.log('Updated last activity for user:', user.id);
        }
      });
      
      // Construct full avatar URL if avatar exists
      let avatarUrl = null;
      if (user.avatar_url) {
        avatarUrl = `${req.protocol}://${req.get('host')}${user.avatar_url}`;
      }
      
      res.json({ 
        message: 'Login successful', 
        token,
        user: { id: user.id, username: user.username, email: user.email, faction: user.faction, avatarUrl, factionJoinDate: user.faction_join_date }
      });
    } catch (error) {
      console.log('Error during login:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
});

// Forgot password endpoint
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;

  // Convert email to lowercase for consistent lookup
  const normalizedEmail = email.toLowerCase();

  if (!normalizedEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Check if user exists
  db.get('SELECT id, username FROM users WHERE LOWER(email) = ?', [normalizedEmail], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // In a real application, you would:
    // 1. Generate a password reset token
    // 2. Send an email with the reset link
    // 3. Store the token in the database with an expiration
    
    // For now, just return a success message
    res.json({ 
      message: 'Password reset instructions have been sent to your email.',
      note: 'This is a demo version. In production, you would receive an actual email.'
    });
  });
});

// Delete user account endpoint
app.delete('/api/delete-account', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    // Check if user exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete the user
      db.run('DELETE FROM users WHERE email = ?', [email], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete account' });
        }

        res.json({ message: 'Account deleted successfully' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile (protected route)
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, faction, created_at, avatar_url, faction_join_date FROM users WHERE id = ?', [req.user.userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Transform the response to match the expected format
    let avatarUrl = null;
    if (user.avatar_url) {
      avatarUrl = `${req.protocol}://${req.get('host')}${user.avatar_url}`;
    }
    
    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      faction: user.faction,
      created_at: user.created_at,
      avatarUrl,
      factionJoinDate: user.faction_join_date
    };
    
    res.json(userProfile);
  });
  });

// Get recently active users
app.get('/api/users/recent', authenticateToken, (req, res) => {
  const { limit = 20, offset = 0 } = req.query;
  const userId = req.user.userId;
  
  console.log('Recent users request - userId:', userId, 'limit:', limit, 'offset:', offset);
  console.log('Starting recent users query...');
  
  // First, let's check if the required columns exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error getting columns:', err);
      return res.status(500).json({ error: 'Database schema error' });
    }
    
    console.log('Available columns:', columns.map(col => col.name));
    
    // Check if required columns exist
    const requiredColumns = ['id', 'username', 'faction', 'avatar_url', 'created_at', 'faction_join_date', 'last_activity', 'profile_visibility'];
    const missingColumns = requiredColumns.filter(col => !columns.some(c => c.name === col));
    
    if (missingColumns.length > 0) {
      console.error('Missing columns:', missingColumns);
      return res.status(500).json({ error: `Missing database columns: ${missingColumns.join(', ')}` });
    }
    
    // Now try the actual query
    console.log('Executing query with params:', [userId, parseInt(limit), parseInt(offset)]);
    
    // First, let's test a simpler query to see if the issue is with the complex query
    db.all(`SELECT COUNT(*) as count FROM users WHERE id != ? AND profile_visibility = 'public'`, [userId], (err, countResult) => {
      if (err) {
        console.error('Count query error:', err);
        return res.status(500).json({ error: `Database count error: ${err.message}` });
      }
      
      console.log('Count of matching users:', countResult[0].count);
      
      // Now try the actual query
      db.all(`
        SELECT id, username, faction, avatar_url, created_at, faction_join_date, last_activity, profile_visibility
        FROM users 
        WHERE id != ? AND profile_visibility = 'public'
        ORDER BY last_activity DESC
        LIMIT ? OFFSET ?
      `, [userId, parseInt(limit), parseInt(offset)], (err, users) => {
        if (err) {
          console.error('Recent users query error:', err);
          return res.status(500).json({ error: `Database query error: ${err.message}` });
        }
        
        console.log('Recent users query successful, found:', users.length, 'users');
        console.log('Users found:', users);
        
        // Transform users to include full avatar URLs
        const transformedUsers = users.map(user => ({
          id: user.id,
          username: user.username,
          faction: user.faction,
          avatarUrl: user.avatar_url ? `${req.protocol}://${req.get('host')}${user.avatar_url}` : null,
          created_at: user.created_at,
          factionJoinDate: user.faction_join_date,
          lastActivity: user.last_activity,
          profileVisibility: user.profile_visibility
        }));
        
        res.json(transformedUsers);
      });
    });
  });
});

// Get public user profile by ID (protected route)
app.get('/api/users/:id', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const requestingUserId = req.user.userId;
  
  // Don't allow users to view their own profile through this endpoint
  if (parseInt(userId) === requestingUserId) {
    return res.status(400).json({ error: 'Use /api/profile for your own profile' });
  }
  
  db.get(`
    SELECT id, username, faction, created_at, avatar_url, faction_join_date, last_activity, profile_visibility
    FROM users 
    WHERE id = ? AND profile_visibility = 'public'
  `, [userId], (err, user) => {
    if (err) {
      console.error('Error fetching user profile:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found or profile is private' });
    }
    
    // Transform the response to match the expected format
    let avatarUrl = null;
    if (user.avatar_url) {
      avatarUrl = `${req.protocol}://${req.get('host')}${user.avatar_url}`;
    }
    
    const userProfile = {
      id: user.id,
      username: user.username,
      faction: user.faction,
      created_at: user.created_at,
      avatarUrl,
      factionJoinDate: user.faction_join_date,
      lastActivity: user.last_activity,
      profileVisibility: user.profile_visibility
    };
    
    res.json(userProfile);
  });
});

  // Update user profile (protected route)
  app.put('/api/profile', authenticateToken, (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.userId;
    
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    // Check if username or email already exists for other users
    db.get('SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?', [username, email, userId], (err, existingUser) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingUser) {
        return res.status(400).json({ error: 'Username or email already exists' });
      }
      
      // Update user profile
      db.run('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        
        // Get updated user data
        db.get('SELECT id, username, email, faction, created_at, avatar_url, faction_join_date FROM users WHERE id = ?', [userId], (err, updatedUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Transform the response to match the expected format
          let avatarUrl = null;
          if (updatedUser.avatar_url) {
            avatarUrl = `${req.protocol}://${req.get('host')}${updatedUser.avatar_url}`;
          }
          
          const userProfile = {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            faction: updatedUser.faction,
            created_at: updatedUser.created_at,
            avatarUrl,
            factionJoinDate: updatedUser.faction_join_date
          };
          
          res.json({ 
            message: 'Profile updated successfully', 
            user: userProfile 
          });
        });
      });
    });
  });

  // Change user faction (protected route)
  app.put('/api/profile/faction', authenticateToken, (req, res) => {
    const { newFaction } = req.body;
    const userId = req.user.userId;
    const oldFaction = req.user.faction;
    
    if (!newFaction) {
      return res.status(400).json({ error: 'New faction is required' });
    }
    
    // Validate faction exists
    const validFactions = [
      'bone-march', 'choir-silence', 'cult-withered-flame', 'gravewrought-court',
      'swarm-mireborn', 'dawnflame-order', 'hollowed-redeemed'
    ];
    
    if (!validFactions.includes(newFaction)) {
      return res.status(400).json({ error: 'Invalid faction' });
    }
    
    // Update user faction and set new join date
    db.run('UPDATE users SET faction = ?, faction_join_date = CURRENT_TIMESTAMP WHERE id = ?', [newFaction, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Update faction stats (decrease old faction if exists, increase new faction)
      const updatePromises = [updateFactionStats(newFaction, 1, 0)];
      
      if (oldFaction) {
        updatePromises.unshift(updateFactionStats(oldFaction, -1, 0));
      }
      
      Promise.all(updatePromises).then(() => {
        // Get updated user data
        db.get('SELECT id, username, email, faction, created_at, avatar_url, faction_join_date FROM users WHERE id = ?', [userId], (err, updatedUser) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          
          // Transform the response to match the expected format
          let avatarUrl = null;
          if (updatedUser.avatar_url) {
            avatarUrl = `${req.protocol}://${req.get('host')}${updatedUser.avatar_url}`;
          }
          
          const userProfile = {
            id: updatedUser.id,
            username: updatedUser.username,
            email: updatedUser.email,
            faction: updatedUser.faction,
            created_at: updatedUser.created_at,
            avatarUrl,
            factionJoinDate: updatedUser.faction_join_date
          };
          
          res.json({ 
            message: 'Faction changed successfully', 
            user: userProfile 
          });
        });
      }).catch(err => {
        console.error('Error updating faction stats:', err);
        res.status(500).json({ error: 'Server error' });
      });
    });
  });

  // Upload avatar (protected route)
  app.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'Avatar file is required' });
    }
    
    const userId = req.user.userId;
    const avatarUrl = `/uploads/${req.file.filename}`; // This will be the URL path to the uploaded file
    
    // Check image for inappropriate content
    try {
      const nsfwResult = await checkImageForNudity(req.file.path);
      
      if (!nsfwResult.isSafe) {
        // Delete the uploaded file if it's inappropriate
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error cleaning up inappropriate avatar:', unlinkErr);
        });
        
        return res.status(400).json({ 
          error: 'Avatar rejected: Inappropriate content detected',
          details: nsfwResult.reason,
          confidence: nsfwResult.confidence
        });
      }
      
      console.log('Avatar passed content check:', nsfwResult.reason);
      
    } catch (error) {
      console.error('Error checking avatar content:', error);
      // If content check fails, allow upload but log the error
    }
    
    // Store the relative path in the database
    db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Return the full URL for the client
      const fullAvatarUrl = `${req.protocol}://${req.get('host')}${avatarUrl}`;
      
      res.json({ 
        message: 'Avatar uploaded successfully', 
        avatarUrl: fullAvatarUrl 
      });
    });
  });

  // Update user settings (protected route)
  app.put('/api/profile/settings', authenticateToken, (req, res) => {
    const { emailNotifications, profileVisibility, twoFactorEnabled } = req.body;
    const userId = req.user.userId;
    
    // Store settings in localStorage for now, but you could add a settings table
    // For now, we'll just return success
    res.json({ 
      message: 'Settings updated successfully',
      settings: { emailNotifications, profileVisibility, twoFactorEnabled }
    });
  });
  
  // Admin endpoint to update faction stats (for testing)
app.post('/api/admin/update-faction', (req, res) => {
  const { faction, memberChange = 0, weeklyGrowthChange = 0 } = req.body;
  
  if (!faction) {
    return res.status(400).json({ error: 'Faction is required' });
  }
  
  updateFactionStats(faction, memberChange, weeklyGrowthChange)
    .then(updatedFaction => {
      res.json({ 
        message: 'Faction stats updated successfully', 
        faction: updatedFaction 
      });
    })
    .catch(err => {
      res.status(500).json({ error: 'Failed to update faction stats' });
    });
});

// Gallery API endpoints

// Get all gallery items
app.get('/api/gallery', (req, res) => {
  db.all(`
    SELECT g.id, g.user_id, g.character_name, g.description, g.image_url, g.created_at, g.username, g.faction
    FROM gallery g 
    ORDER BY g.created_at DESC
  `, (err, rows) => {
    if (err) {
      console.error('Error fetching gallery items:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    // Verify that image files exist and add full URLs
    const processedRows = rows.map(row => {
      if (row.image_url) {
        const fullImagePath = path.join(__dirname, row.image_url);
        const imageExists = fs.existsSync(fullImagePath);
        
        if (!imageExists) {
          console.warn(`Image file missing for gallery item ${row.id}: ${row.image_url}`);
          // Don't remove the row, but mark the image as missing
          row.image_url = null;
          row.image_missing = true;
        } else {
          // Add full URL for the client
          row.image_url = `${req.protocol}://${req.get('host')}${row.image_url}`;
        }
      }
      return row;
    });
    
    console.log(`Retrieved ${processedRows.length} gallery items`);
    res.json(processedRows);
  });
});

// Get gallery items by faction
app.get('/api/gallery/faction/:faction', (req, res) => {
  const { faction } = req.params;
  db.all(`
    SELECT g.*, u.username, u.faction 
    FROM gallery g 
    JOIN users u ON g.user_id = u.id 
    WHERE g.faction = ? 
    ORDER BY g.created_at DESC
  `, [faction], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Database error' });
      return;
    }
    res.json(rows);
  });
});

// Upload new necromancer character (protected route)
app.post('/api/gallery/upload', authenticateToken, upload.single('characterImage'), async (req, res) => {
  const { characterName, description, faction } = req.body;
  const userId = req.user.userId;
  const username = req.user.username;
  
  if (!characterName) {
    return res.status(400).json({ error: 'Character name is required' });
  }
  
  if (!req.file) {
    return res.status(400).json({ error: 'Character image is required' });
  }
  
  // Validate faction matches user's faction
  if (faction !== req.user.faction) {
    return res.status(400).json({ error: 'You can only upload characters for your own faction' });
  }
  
  // Validate file type
  if (!req.file.mimetype.startsWith('image/')) {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  
  // Validate file size (5MB limit)
  if (req.file.size > 5 * 1024 * 1024) {
    return res.status(400).json({ error: 'File size must be less than 5MB' });
  }
  
  const imageUrl = `/uploads/${req.file.filename}`;
  
  // Log the upload details
  console.log('Gallery upload details:', {
    userId,
    username,
    faction,
    characterName,
    filename: req.file.filename,
    imageUrl,
    fileSize: req.file.size,
    filePath: req.file.path
  });
  
  // Verify file exists before saving to database
  if (!fs.existsSync(req.file.path)) {
    console.error('Uploaded file does not exist at path:', req.file.path);
    return res.status(500).json({ error: 'File upload failed' });
  }
  
  // Check image for inappropriate content
  try {
    const nsfwResult = await checkImageForNudity(req.file.path);
    
    if (!nsfwResult.isSafe) {
      // Delete the uploaded file if it's inappropriate
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error cleaning up inappropriate gallery image:', unlinkErr);
      });
      
      return res.status(400).json({ 
        error: 'Character image rejected: Inappropriate content detected',
        details: nsfwResult.reason,
        confidence: nsfwResult.confidence
      });
    }
    
    console.log('Gallery image passed content check:', nsfwResult.reason);
    
  } catch (error) {
    console.error('Error checking gallery image content:', error);
    // If content check fails, allow upload but log the error
  }
  
  db.run(`
    INSERT INTO gallery (user_id, username, faction, character_name, description, image_url) 
    VALUES (?, ?, ?, ?, ?, ?)
  `, [userId, username, faction, characterName, description, imageUrl], function(err) {
    if (err) {
      console.error('Error uploading to gallery:', err);
      // Clean up the uploaded file if database insert fails
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error cleaning up failed upload:', unlinkErr);
      });
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Gallery item saved successfully with ID:', this.lastID);
    
    // Emit real-time update to all clients
    emitFactionUpdate(faction, 'galleryUpdated', { 
      type: 'newCharacter',
      characterName,
      username 
    });
    
    res.json({ 
      message: 'Character uploaded successfully', 
      id: this.lastID,
      imageUrl: imageUrl
    });
  });
});

// Delete gallery item (protected route)
app.delete('/api/gallery/:id', authenticateToken, (req, res) => {
  console.log('DELETE /api/gallery/:id called with ID:', req.params.id);
  console.log('User ID from token:', req.user.userId);
  
  const artworkId = req.params.id;
  const userId = req.user.userId;
  
  if (!artworkId) {
    console.log('No artwork ID provided');
    return res.status(400).json({ error: 'Artwork ID is required' });
  }
  
  console.log('Looking for artwork with ID:', artworkId);
  
  // First, get the artwork to verify ownership and get file info
  db.get('SELECT * FROM gallery WHERE id = ?', [artworkId], (err, artwork) => {
    if (err) {
      console.error('Error fetching artwork:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!artwork) {
      console.log('Artwork not found in database');
      return res.status(404).json({ error: 'Artwork not found' });
    }
    
    console.log('Found artwork:', artwork);
    console.log('Artwork user_id:', artwork.user_id, 'Requesting user_id:', userId);
    
    // Check if user owns this artwork
    if (artwork.user_id !== userId) {
      console.log('User does not own this artwork');
      return res.status(403).json({ error: 'You can only delete your own artwork' });
    }
    
    console.log('User authorized, proceeding with deletion');
    
    // Delete the artwork from database
    db.run('DELETE FROM gallery WHERE id = ?', [artworkId], function(err) {
      if (err) {
        console.error('Error deleting artwork:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      console.log('Artwork deleted from database successfully');
      
      // Try to delete the image file from uploads folder
      if (artwork.image_url) {
        const filePath = path.join(__dirname, artwork.image_url);
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== 'ENOENT') {
            console.error('Error deleting image file:', unlinkErr);
            // Don't fail the request if file deletion fails
          } else {
            console.log('Image file deleted successfully');
          }
        });
      }
      
      // Emit real-time update to all clients
      emitFactionUpdate(artwork.faction, 'galleryUpdated', { 
        type: 'artworkDeleted',
        artworkId,
        username: artwork.username
      });
      
      console.log('Sending success response');
      res.json({ 
        message: 'Artwork deleted successfully',
        deletedId: artworkId
      });
    });
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Send current faction stats to newly connected user
  db.all('SELECT * FROM faction_stats ORDER BY member_count DESC', (err, rows) => {
    if (!err) {
      socket.emit('factionStats', rows);
    } else {
      console.error('Error sending initial faction stats:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Helper function to emit faction updates to all clients
function emitFactionUpdate(faction, type, data = {}) {
  const updateData = {
    faction,
    type,
    timestamp: new Date().toISOString(),
    ...data
  };
  
  console.log('Emitting faction update:', updateData);
  io.emit('factionUpdate', updateData);
}

// Helper function to update faction stats and emit updates
function updateFactionStats(faction, memberChange = 0, weeklyGrowthChange = 0) {
  return new Promise((resolve, reject) => {
    const updateQuery = `
      UPDATE faction_stats 
      SET member_count = member_count + ?, 
          weekly_growth = weekly_growth + ?,
          last_updated = CURRENT_TIMESTAMP
      WHERE faction = ?
    `;
    
    db.run(updateQuery, [memberChange, weeklyGrowthChange, faction], function(err) {
      if (err) {
        console.error('Error updating faction stats:', err);
        reject(err);
        return;
      }
      
      // Get updated stats
      db.get('SELECT * FROM faction_stats WHERE faction = ?', [faction], (err, row) => {
        if (err) {
          console.error('Error fetching updated faction stats:', err);
          reject(err);
          return;
        }
        
        // Emit update to all clients
        emitFactionUpdate(faction, 'statsUpdated', { 
          memberCount: row.member_count,
          weeklyGrowth: row.weekly_growth 
        });
        
        resolve(row);
      });
    });
  });
}

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve gallery page
app.get('/gallery', (req, res) => {
  res.sendFile(path.join(__dirname, 'gallery.html'));
});

// Serve faction pages
app.get('/factions/:faction', (req, res) => {
  const faction = req.params.faction;
  res.sendFile(path.join(__dirname, `factions/${faction}.html`));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors specifically
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  
  // Handle other file type errors
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' });
  }
  
  res.status(500).json({ error: 'Something broke!' });
});

// Debug endpoint to check user data
app.get('/api/debug/user/:id', (req, res) => {
  const userId = req.params.id;
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(user);
  });
});

// Debug endpoint to force database migration
app.get('/api/debug/migrate', (req, res) => {
  console.log('Forcing database migration...');
  
  // Add faction_join_date column if it doesn't exist
  db.run(`ALTER TABLE users ADD COLUMN faction_join_date DATETIME`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding faction_join_date column:', err);
      return res.status(500).json({ error: 'Migration failed: ' + err.message });
    }
    
    // For existing users without faction_join_date, set it to their account creation date
    db.run(`UPDATE users SET faction_join_date = created_at WHERE faction_join_date IS NULL`, (err) => {
      if (err) {
        console.error('Error updating existing users faction join date:', err);
        return res.status(500).json({ error: 'Update failed: ' + err.message });
      }
      
      console.log('Database migration completed successfully');
      res.json({ message: 'Migration completed successfully' });
    });
  });
});

// User Search API endpoints

// Search users with filters
app.get('/api/users/search', authenticateToken, (req, res) => {
  const { query, faction, limit = 20, offset = 0 } = req.query;
  const userId = req.user.userId;
  
  console.log('Search request - query:', query, 'faction:', faction, 'userId:', userId, 'limit:', limit, 'offset:', offset);
  
  // First, let's check if the required columns exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error getting columns for search:', err);
      return res.status(500).json({ error: 'Database schema error' });
    }
    
    console.log('Available columns for search:', columns.map(col => col.name));
    
    // Check if required columns exist
    const requiredColumns = ['id', 'username', 'faction', 'avatar_url', 'created_at', 'faction_join_date', 'last_activity', 'profile_visibility'];
    const missingColumns = requiredColumns.filter(col => !columns.some(c => c.name === col));
    
    if (missingColumns.length > 0) {
      console.error('Missing columns for search:', missingColumns);
      return res.status(500).json({ error: `Missing database columns: ${missingColumns.join(', ')}` });
    }
    
    let sql = `
      SELECT id, username, faction, avatar_url, created_at, faction_join_date, last_activity, profile_visibility
      FROM users 
      WHERE id != ? AND profile_visibility = 'public'
    `;
    const params = [userId];
    
    if (query) {
      sql += ` AND (username LIKE ? OR searchable_username LIKE ?)`;
      params.push(`%${query}%`, `%${query.toLowerCase()}%`);
    }
    
    if (faction) {
      sql += ` AND faction = ?`;
      params.push(faction);
    }
    
    sql += ` ORDER BY last_activity DESC, username ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    console.log('Search SQL:', sql);
    console.log('Search params:', params);
    
    db.all(sql, params, (err, users) => {
      if (err) {
        console.error('Search query error:', err);
        return res.status(500).json({ error: `Database query error: ${err.message}` });
      }
      
      console.log('Search query successful, found:', users.length, 'users');
      
      // Transform users to include full avatar URLs
      const transformedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        faction: user.faction,
        avatarUrl: user.avatar_url ? `${req.protocol}://${req.get('host')}${user.avatar_url}` : null,
        created_at: user.created_at,
        factionJoinDate: user.faction_join_date,
        lastActivity: user.last_activity,
        profileVisibility: user.profile_visibility
      }));
      
      res.json(transformedUsers);
    });
  });
});

// Get all users in a specific faction
app.get('/api/users/faction/:faction', authenticateToken, (req, res) => {
  const { faction } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  const userId = req.user.userId;
  
  db.all(`
    SELECT id, username, faction, avatar_url, created_at, faction_join_date, last_activity, profile_visibility
    FROM users 
    WHERE faction = ? AND id != ? AND profile_visibility = 'public'
    ORDER BY last_activity DESC, username ASC
    LIMIT ? OFFSET ?
  `, [faction, userId, parseInt(limit), parseInt(offset)], (err, users) => {
    if (err) {
      console.error('Faction users error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Transform users to include full avatar URLs
    const transformedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      faction: user.faction,
      avatarUrl: user.avatar_url ? `${req.protocol}://${req.get('host')}${user.avatar_url}` : null,
      created_at: user.created_at,
      factionJoinDate: user.faction_join_date,
      lastActivity: user.last_activity,
      profileVisibility: user.profile_visibility
    }));
    
    res.json(transformedUsers);
  });
});

// Update user's last activity (called when user performs actions)
app.put('/api/users/activity', authenticateToken, (req, res) => {
  const userId = req.user.userId;
  
  console.log('Updating last activity for user:', userId);
  
  db.run('UPDATE users SET last_activity = CURRENT_TIMESTAMP WHERE id = ?', [userId], function(err) {
    if (err) {
      console.error('Activity update error:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    console.log('Activity updated successfully for user:', userId);
    res.json({ message: 'Activity updated successfully' });
  });
});

// Email verification endpoint
app.post('/api/verify-email', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  // In a real application, you would:
  // 1. Verify the token from the database
  // 2. Update the user's email_verified status
  // 3. Remove the verification token
  
  // For now, just return a success message
  res.json({ 
    message: 'Email verified successfully!',
    note: 'This is a demo version. In production, the token would be validated.'
  });
});

// Resend verification email endpoint
app.post('/api/resend-verification', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // In a real application, you would:
  // 1. Check if user exists and needs verification
  // 2. Generate a new verification token
  // 3. Send a new verification email
  
  // For now, just return a success message
  res.json({ 
    message: 'Verification email sent successfully!',
    note: 'This is a demo version. In production, you would receive an actual email.'
  });
});

// Verify reset token endpoint
app.post('/api/verify-reset-token', (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Reset token is required' });
  }

  // In a real application, you would:
  // 1. Verify the token from the database
  // 2. Check if the token is expired
  
  // For now, just return a success message
  res.json({ 
    message: 'Reset token is valid',
    note: 'This is a demo version. In production, the token would be validated.'
  });
});

// Reset password endpoint
app.post('/api/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required' });
  }

  // In a real application, you would:
  // 1. Verify the token from the database
  // 2. Hash the new password
  // 3. Update the user's password
  // 4. Remove the reset token
  
  // For now, just return a success message
  res.json({ 
    message: 'Password reset successfully!',
    note: 'This is a demo version. In production, your password would be updated.'
  });
});

// Test endpoint to check database status
app.get('/api/test-db', (req, res) => {
  console.log('Testing database connection...');
  
  // Check if users table exists and has the required columns
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Database test error:', err);
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
    
    console.log('Database test successful, columns found:', columns.map(col => col.name));
    
    // Check if we have any users
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (err) {
        console.error('User count error:', err);
        return res.status(500).json({ error: 'User count failed', details: err.message });
      }
      
      res.json({ 
        message: 'Database is working correctly',
        columns: columns.map(col => col.name),
        userCount: result.count,
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Debug endpoint to check user data
app.get('/api/debug/users', (req, res) => {
  db.all('SELECT id, username, faction, profile_visibility, last_activity FROM users', (err, users) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(users);
  });
});

// Maintenance endpoint to check and fix file issues
app.get('/api/maintenance/files', (req, res) => {
  console.log('Running file maintenance check...');
  
  // Get all gallery items with their image URLs
  db.all('SELECT id, image_url FROM gallery WHERE image_url IS NOT NULL', (err, galleryItems) => {
    if (err) {
      console.error('Error fetching gallery items for maintenance:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const results = {
      totalItems: galleryItems.length,
      missingFiles: [],
      orphanedFiles: [],
      fixedItems: []
    };
    
    // Check which image files are missing
    galleryItems.forEach(item => {
      if (item.image_url) {
        const fullPath = path.join(__dirname, item.image_url);
        if (!fs.existsSync(fullPath)) {
          results.missingFiles.push({
            id: item.id,
            image_url: item.image_url,
            path: fullPath
          });
        }
      }
    });
    
    // Check for orphaned files in uploads directory
    fs.readdir(uploadsDir, (err, files) => {
      if (err) {
        console.error('Error reading uploads directory:', err);
        return res.status(500).json({ error: 'File system error' });
      }
      
      const usedFiles = galleryItems.map(item => {
        if (item.image_url) {
          return path.basename(item.image_url);
        }
        return null;
      }).filter(Boolean);
      
      // Also check avatar files
      db.all('SELECT avatar_url FROM users WHERE avatar_url IS NOT NULL', (err, users) => {
        if (!err && users) {
          users.forEach(user => {
            if (user.avatar_url) {
              usedFiles.push(path.basename(user.avatar_url));
            }
          });
        }
        
        files.forEach(file => {
          if (!usedFiles.includes(file)) {
            results.orphanedFiles.push(file);
          }
        });
        
        console.log('File maintenance completed:', results);
        res.json({
          message: 'File maintenance completed',
          results: results,
          timestamp: new Date().toISOString()
        });
      });
    });
  });
});

// Content moderation endpoint to check existing images
app.get('/api/maintenance/content-check', async (req, res) => {
  console.log('Running content moderation check...');
  
  if (!nsfwModel) {
    return res.status(503).json({ 
      error: 'NSFW model not loaded yet. Please wait and try again.' 
    });
  }
  
  // Get all gallery items with their image URLs
  db.all('SELECT id, image_url, character_name, username FROM gallery WHERE image_url IS NOT NULL', async (err, galleryItems) => {
    if (err) {
      console.error('Error fetching gallery items for content check:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    const results = {
      totalItems: galleryItems.length,
      checkedItems: [],
      flaggedItems: [],
      errors: []
    };
    
    // Check each image
    for (const item of galleryItems) {
      try {
        const fullPath = path.join(__dirname, item.image_url);
        
        if (!fs.existsSync(fullPath)) {
          results.errors.push({
            id: item.id,
            error: 'File not found',
            image_url: item.image_url
          });
          continue;
        }
        
        const nsfwResult = await checkImageForNudity(fullPath);
        
        const checkResult = {
          id: item.id,
          character_name: item.character_name,
          username: item.username,
          image_url: item.image_url,
          isSafe: nsfwResult.isSafe,
          confidence: nsfwResult.confidence,
          detectedClass: nsfwResult.detectedClass,
          reason: nsfwResult.reason
        };
        
        results.checkedItems.push(checkResult);
        
        if (!nsfwResult.isSafe) {
          results.flaggedItems.push(checkResult);
        }
        
      } catch (error) {
        results.errors.push({
          id: item.id,
          error: error.message,
          image_url: item.image_url
        });
      }
    }
    
    console.log('Content moderation check completed:', {
      total: results.totalItems,
      flagged: results.flaggedItems.length,
      errors: results.errors.length
    });
    
    res.json({
      message: 'Content moderation check completed',
      results: results,
      timestamp: new Date().toISOString()
    });
  });
});

const PORT = process.env.PORT || 8080;

// Security startup check
console.log('🔒 Security Configuration Check:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
console.log(`- CORS Origins: ${process.env.ALLOWED_ORIGINS ? '✅ Configured' : '⚠️  Using defaults'}`);
console.log(`- Rate Limiting: ${process.env.RATE_LIMIT_MAX_REQUESTS || '100'} requests per ${process.env.RATE_LIMIT_WINDOW_MS || '900000'}ms`);

if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Starting in PRODUCTION mode');
  console.log('⚠️  Make sure to configure ALLOWED_ORIGINS with your actual domain!');
} else {
  console.log('🛠️  Starting in DEVELOPMENT mode');
}

server.listen(PORT, () => {
  console.log(`\n🎉 GraveGrounds Faction Tracker Server Started!`);
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/factions`);
  console.log(`\n🔧 Ready for deployment! 🚀\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
