/**
 * Input Handler
 * Handles joystick/keyboard input for table navigation
 */

function startAutoAdvanceTimer() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
  }

  isAutoAdvancing = false;
  startIdleTimer();

  autoAdvanceTimer = setTimeout(() => {
    isAutoAdvancing = true;
    autoAdvance();
  }, AUTO_ADVANCE_INITIAL_DELAY);
}

// Idle timer. Restarted by the SAME call every real input already makes, so
// there is no second signal to keep in sync — if a button reaches the wheel,
// the cab is not idle.
function startIdleTimer() {
  if (idleTimer !== null) clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (isGameRunning) return;          // a table is up; not idle
    isIdle = true;
    vpin.sendMessageToAllWindowsIncSelf({ type: "IdleSleep" });
  }, IDLE_TIMEOUT);
}

function wakeFromIdle() {
  if (!isIdle) return;
  isIdle = false;
  vpin.sendMessageToAllWindowsIncSelf({ type: "IdleWake" });
}

function autoAdvance() {
  if (!isAutoAdvancing) return;

  lastWheelMoveDirection = 1;
  currentTableIndex = wrapIndex(currentTableIndex + 1, vpin.tableData.length);

  vpin.sendMessageToAllWindows({
    type: "TableIndexUpdate",
    index: currentTableIndex,
  });
  updateScreen();

  autoAdvanceTimer = setTimeout(() => {
    autoAdvance();
  }, AUTO_ADVANCE_INTERVAL);
}

function stopAutoAdvanceTimer() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  isAutoAdvancing = false;
}

async function handleInput(input) {
  // Wake FIRST: the input that wakes the cab should not also move the wheel,
  // so a blind press in a dark room lands you where you left off rather than
  // one table over.
  if (isIdle) {
    wakeFromIdle();
    startAutoAdvanceTimer();
    return;
  }
  startAutoAdvanceTimer();

  switch (input) {
    case "joyleft":
      lastWheelMoveDirection = -1;
      currentTableIndex = wrapIndex(
        currentTableIndex - 1,
        vpin.tableData.length,
      );

      vpin.sendMessageToAllWindows({
        type: "TableIndexUpdate",
        index: currentTableIndex,
      });
      updateScreen();
      break;

    case "joyright":
      lastWheelMoveDirection = 1;
      currentTableIndex = wrapIndex(
        currentTableIndex + 1,
        vpin.tableData.length,
      );

      vpin.sendMessageToAllWindows({
        type: "TableIndexUpdate",
        index: currentTableIndex,
      });
      updateScreen();
      break;

    case "joyselect":
      isGameRunning = true;
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      vpin.sendMessageToAllWindowsIncSelf({ type: "TableLaunching" });
      cleanupAllMedia();
      fadeOut();

      await vpin.launchTable(currentTableIndex);
      isGameRunning = false;

      vpin.sendMessageToAllWindowsIncSelf({ type: "TableLaunchComplete" });
      fadeIn();
      updateScreen();
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "joyback":
      // Handle back button if needed
      break;
  }
}

