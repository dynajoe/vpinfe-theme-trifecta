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
let isNativePortrait = false;

// Configuration
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

// IDLE SLEEP. The wheel otherwise runs forever: after AUTO_ADVANCE_INITIAL_DELAY
// it steps to a new table every 10s, loading fresh 4K media each time, all night,
// to an empty room. Measured on the cab, that idle churn costs ~26W of the ~60W
// the PC draws (CPU package 22.5W -> 6.2W with the renderers halted).
//
// So after IDLE_TIMEOUT with no input we stop advancing, tear the media down and
// go to true black. On an OLED playfield black pixels are off, which is most of
// what blanking the panel would achieve — without touching X, DPMS or the TV,
// any of which risk the untrained-DisplayPort scramble that fix-display.sh
// exists to heal.
//
// The trigger is INPUT, deliberately, not the head tracker: the tracker reports
// a face ~6% of its life, rejects anyone more than 38cm off the centreline as an
// observer by construction, and has been blind for 13.6 hours with tables being
// played. Input cannot false-negative on someone touching the cab, and the worst
// failure here is "it forgot to sleep", never "the cab will not wake".
let idleTimer = null;
let isIdle = false;
const IDLE_TIMEOUT = 600000; // 10 min of no input
