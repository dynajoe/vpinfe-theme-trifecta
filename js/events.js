/**
 * Event Handler
 * Handles VPinFE system events
 */

async function receiveEvent(message) {
  vpin.call("console_out", message);

  await vpin.handleEvent(message);

  switch (message.type) {
    case "TableIndexUpdate":
      currentTableIndex = message.index;
      updateScreen();
      break;

    case "TableLaunching":
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
