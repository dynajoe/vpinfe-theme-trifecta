/**
 * State Management
 * Global state variables for the theme
 */

// Window identification
let windowName = "";

// Table navigation
let currentTableIndex = 0;
let lastRenderedTableIndex = -1;
let lastWheelMoveDirection = 0;

// Display configuration
let isTablePortrait = false;
let tableRotationDegrees = 0;

// Configuration
let config = null;
let windowOverride = null;

// Debounce timers
let heroUpdateDebounceTimer = null;
let bgUpdateDebounceTimer = null;
let dmdUpdateDebounceTimer = null;

// View references
let tableView = null;

// Auto-advance timer
let autoAdvanceTimer = null;
let isAutoAdvancing = false;
const AUTO_ADVANCE_INITIAL_DELAY = 180000; // 3 min (was 30s — attract hijacked browsing)
const AUTO_ADVANCE_INTERVAL = 10000; // 10 seconds

// Game state
let isGameRunning = false;
