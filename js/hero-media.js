/**
 * Hero Media Management
 * Handles table window video/image loading and rotation rendering
 */

function buildHeroImage(imageUrl, title) {
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = title;
  img.className = "hero-media-asset";
  img.onerror = () => {
    img.src = "";
    img.alt = `${title} media unavailable`;
  };
  return img;
}

function applyMediaRotation(element) {
  if (!element) return;

  const normalized = ((tableRotationDegrees % 360) + 360) % 360;
  const swapAxes = normalized === 90 || normalized === 270 || isNativePortrait;
  const mediaRotation = isNativePortrait
    ? 90
    : swapAxes
      ? -tableRotationDegrees
      : tableRotationDegrees;

  if (swapAxes) {
    element.style.width = "177.78%";
    element.style.height = "56.25%";
    element.style.maxWidth = "none";
    element.style.maxHeight = "none";
    element.style.objectFit = "fill";
    element.style.transform = `rotate(${mediaRotation}deg)`;
  } else {
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.maxWidth = "";
    element.style.maxHeight = "";
    element.style.objectFit = "cover";
    element.style.transform =
      mediaRotation !== 0 ? `rotate(${mediaRotation}deg)` : "none";
  }
}

// True if the frame's media element still holds displayable content. After
// IdleSleep's cleanupAllMedia the element survives with src cleared and a
// synthetic error set, so dataset URLs alone are not proof of health.
function heroFrameIsHealthy(frame) {
  const video = frame.querySelector("video");
  if (video) return !video.error && video.readyState >= 2; // HAVE_CURRENT_DATA
  const img = frame.querySelector("img");
  // buildHeroImage's onerror blanks src; a decoded img has naturalWidth > 0.
  if (img) return Boolean(img.getAttribute("src")) && (!img.complete || img.naturalWidth > 0);
  return false;
}

function updateHeroMedia(container, title) {
  const imageUrl = vpin.getImageURL(currentTableIndex, "table");
  const videoUrl = vpin.getVideoURL(currentTableIndex, "table");

  // Reuse the live layer when nothing changed. Table launch pauses the hero
  // video (pauseAllMedia) and the return path lands here via updateScreen —
  // rebuilding would re-fetch the whole table video (113MB for The Matrix) and
  // visibly restart it from 0:00, which is the "reinitializing the media"
  // Joe saw on every return. Resuming the same element is seamless.
  const activeFrame = container.querySelector(".hero-media-frame.is-active");
  if (
    activeFrame &&
    activeFrame.dataset.imageUrl === imageUrl &&
    activeFrame.dataset.videoUrl === videoUrl &&
    heroFrameIsHealthy(activeFrame)
  ) {
    // Kill any still-loading layer for a table we have since left: its
    // activateLayer would otherwise fire on loadeddata and evict the reused
    // frame, leaving the WRONG table's hero up (rapid browse: rest on B just
    // long enough to start its load, return to A before it finishes).
    // Entering layers are opacity 0, so removing them is invisible.
    container.querySelectorAll(".hero-media-frame.is-entering").forEach((l) => l.remove());
    const video = activeFrame.querySelector("video");
    if (video && video.paused) video.play().catch(() => {});
    return;
  }

  const newFrame = document.createElement("div");
  newFrame.className = "hero-media-frame hero-media-layer is-entering";
  newFrame.dataset.imageUrl = imageUrl;
  newFrame.dataset.videoUrl = videoUrl;

  let activated = false;
  const activateLayer = () => {
    if (activated) return;
    activated = true;

    requestAnimationFrame(() => {
      newFrame.classList.remove("is-entering");
      newFrame.classList.add("is-active");

      const oldLayers = container.querySelectorAll(
        ".hero-media-frame:not(.is-entering)",
      );
      oldLayers.forEach((layer) => {
        if (layer !== newFrame) {
          layer.remove();
        }
      });
    });
  };

  if (hasUsableMedia(videoUrl)) {
    const video = document.createElement("video");
    video.src = videoUrl;
    if (hasUsableMedia(imageUrl)) video.poster = imageUrl;

    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.className = "hero-media-asset";

    video.onloadeddata = activateLayer;
    video.onerror = () => {
      // Guard the fallback like bg-dmd-media.js does: when the table has no
      // still image, imageUrl is vpinfe's file_missing placeholder, and
      // painting it here put a full-screen "no media found" playfield on the
      // cab whenever a video-only table's video errored. Better to keep
      // whatever layer is already showing than to advertise the failure.
      if (!hasUsableMedia(imageUrl)) return;
      const fallback = buildHeroImage(imageUrl, title);
      newFrame.replaceChildren(fallback);
      applyMediaRotation(fallback);
      activateLayer();
    };

    newFrame.appendChild(video);
    applyMediaRotation(video);
  } else if (hasUsableMedia(imageUrl)) {
    const image = buildHeroImage(imageUrl, title);
    image.onload = activateLayer;
    image.onerror = activateLayer;
    newFrame.appendChild(image);
    applyMediaRotation(image);
  }

  container.appendChild(newFrame);
}
