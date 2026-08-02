/**
 * Event Handler
 * Handles VPinFE system events
 */

async function receiveEvent(message) {
  vpin.call("console_out", message);

  await vpin.handleEvent(message);

  switch (message.type) {
    // Idle: stop advancing, tear down every decoder, go to black. Full
    // teardown is right HERE because nobody is watching an idle cab and the
    // point is power; a table launch only PAUSES the playfield's video
    // (input.js joyselect), because there the hero is in view while the
    // overlay fades. IdleWake's updateScreen rebuilds what this cleared —
    // heroFrameIsHealthy() sees the gutted element and does not skip it.
    case "IdleSleep":
      isIdle = true;
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      cleanupAllMedia();
      idleBlackOn();
      break;

    case "IdleWake":
      isIdle = false;
      idleBlackOff();
      updateScreen();               // re-attaches the media cleanupAllMedia cleared
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "TableIndexUpdate":
      currentTableIndex = message.index;
      updateScreen();
      break;

    case "TableLaunching":
      isIdle = false;
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      fadeOut();
      if (windowName !== "table") {
        cleanupAllMedia();
      }
      break;

    case "TableLaunchComplete":
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      fadeIn();
      if (windowName !== "table") {
        updateScreen();
      }
      break;

    case "RemoteLaunching":
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      if (windowName === "table") {
        showRemoteLaunchOverlay(message.table_name);
      }
      fadeOut();
      updateScreen();
      break;

    case "RemoteLaunchComplete":
      if (windowName === "table") {
        hideRemoteLaunchOverlay();
      }
      fadeIn();
      updateScreen();
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "TableDataChange":
      currentTableIndex = message.index;
      updateScreen();
      break;
  }
}
