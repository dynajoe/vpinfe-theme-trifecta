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
      // A launch from OUTSIDE this window (voice control goes through the
      // bridge's controller window) names its table; snap our index to it
      // FIRST so the "loading" title, launch media and post-game position
      // all tell the truth. A voice launch used to show "loading <whatever
      // the wheel sat on>" (Joe's report). Wheel-originated launches carry
      // no name and behave exactly as before.
      if (message.table_dir && typeof vpin !== "undefined") {
        const n = vpin.getTableCount ? vpin.getTableCount() : 0;
        for (let i = 0; i < n; i++) {
          const t = vpin.getTableMeta(i);
          if (t && t.tableDirName === message.table_dir) {
            if (i !== currentTableIndex) {
              currentTableIndex = i;
              updateScreen();
            }
            break;
          }
        }
      }
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
