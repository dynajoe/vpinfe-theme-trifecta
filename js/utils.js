/**
 * Utility Functions
 * Helper functions used throughout the theme
 */

function setNodeText(node, value) {
  const nextValue = value || "";
  if (node.textContent !== nextValue) {
    node.textContent = nextValue;
  }
}

function wrapIndex(index, length) {
  return (index + length) % length;
}

function hasUsableMedia(url) {
  return Boolean(url) && !String(url).includes("file_missing");
}

function cleanupAllMedia() {
  document.querySelectorAll("video").forEach((v) => {
    v.pause();
    v.src = "";
    v.load();
  });
}

// Idle black. Reuses #fadeOverlay for the blackout but NOT fadeOut(), which
// also raises the "loading table" message — correct for a launch, wrong for an
// idle screen that would then sit there claiming to be loading something.
function idleBlackOn() {
  const overlay = document.getElementById("fadeOverlay");
  if (!overlay) return;
  const loadingMsg = document.getElementById("loading-message");
  if (loadingMsg) loadingMsg.style.display = "none";
  overlay.classList.add("show");
}

function idleBlackOff() {
  const overlay = document.getElementById("fadeOverlay");
  if (overlay) overlay.classList.remove("show");
}

function updateScreen() {
  if (windowName === "table") {
    updateTableWindowCarousel();

    if (heroUpdateDebounceTimer !== null) {
      clearTimeout(heroUpdateDebounceTimer);
    }

    heroUpdateDebounceTimer = setTimeout(() => {
      updateTableWindowHeroMedia();
      // Trifecta-Cab: keep attract mode silent (cab fix, 2026-07-09)
      if (isAutoAdvancing) {
        vpin.stopTableAudio({ immediate: true });
      } else {
        vpin.playTableAudio(currentTableIndex);
      }
      heroUpdateDebounceTimer = null;
    }, 200);
  } else if (windowName === "bg") {
    if (bgUpdateDebounceTimer !== null) {
      clearTimeout(bgUpdateDebounceTimer);
    }

    bgUpdateDebounceTimer = setTimeout(() => {
      updateBGWindow();
      bgUpdateDebounceTimer = null;
    }, 50);
  } else if (windowName === "dmd") {
    if (dmdUpdateDebounceTimer !== null) {
      clearTimeout(dmdUpdateDebounceTimer);
    }

    dmdUpdateDebounceTimer = setTimeout(() => {
      updateDMDWindow();
      dmdUpdateDebounceTimer = null;
    }, 100);
  }
}

function fadeOut() {
  const overlay = document.getElementById("fadeOverlay");
  if (overlay) {
    const loadingMsg = document.getElementById("loading-message");
    if (loadingMsg) {
      if (tableRotationDegrees !== 0) {
        loadingMsg.style.transform = `rotate(${tableRotationDegrees}deg)`;
      }
      loadingMsg.style.display = "block";

      const loadingName = document.getElementById("loading-table-name");
      if (loadingName && typeof currentTableIndex !== "undefined") {
        const table = vpin.getTableMeta(currentTableIndex);
        const info = table.meta.Info || {};
        const vpx = table.meta.VPXFile || {};
        const title =
          info.Title || vpx.filename || table.tableDirName || "Unknown Table";
        const displayTitle =
          title && title.trim() ? title : `Table ${currentTableIndex + 1}`;
        loadingName.textContent = displayTitle;
      }
    }
    overlay.classList.add("show");
  }
}

function fadeIn() {
  const overlay = document.getElementById("fadeOverlay");
  if (overlay) {
    const loadingMsg = document.getElementById("loading-message");
    if (loadingMsg) {
      loadingMsg.style.display = "none";
    }
    overlay.classList.remove("show");
  }
}

function showRemoteLaunchOverlay(tableName) {
  const overlay = document.getElementById("remote-launch-overlay");
  const nameEl = document.getElementById("remote-launch-table-name");
  if (overlay && nameEl) {
    nameEl.textContent = tableName || "Unknown Table";

    const content = overlay.firstElementChild;
    if (content && typeof tableRotationDegrees !== "undefined" && tableRotationDegrees !== 0) {
      content.style.transform = `rotate(${tableRotationDegrees}deg)`;
    }

    overlay.style.display = "flex";
  }
}

function hideRemoteLaunchOverlay() {
  const overlay = document.getElementById("remote-launch-overlay");
  if (overlay) {
    overlay.style.display = "none";
  }
}
