/**
 * Carousel
 * Wheel carousel rendering and animation
 */

function createWheelTrack() {
  const wheelTrack = document.createElement("div");
  wheelTrack.className = "wheel-track";
  for (let offset = -3; offset <= 3; offset += 1) {
    const card = document.createElement("div");
    card.className = "wheel-card";
    card.dataset.offset = String(offset);
    wheelTrack.appendChild(card);
  }
  return wheelTrack;
}

function renderWheelCarousel(track, centerIndex) {
  const cards = Array.from(track.children);

  cards.forEach((card) => {
    const offset = Number(card.dataset.offset || 0);
    const index = wrapIndex(centerIndex + offset, vpin.getTableCount());
    const table = vpin.getTableMeta(index);
    const info = table.meta.Info || {};
    const vpx = table.meta.VPXFile || {};
    const title =
      info.Title || vpx.filename || table.tableDirName || "Unknown Table";
    const wheelUrl = vpin.getImageURL(index, "wheel");
    const isActive = offset === 0;
    const isNear = Math.abs(offset) === 1;

    card.className = isActive
      ? "wheel-card active"
      : isNear
        ? "wheel-card dim-near"
        : "wheel-card";

    let img = card.querySelector("img");
    let fallback = card.querySelector(".wheel-fallback");

    if (hasUsableMedia(wheelUrl)) {
      if (!img) {
        img = document.createElement("img");
        img.decoding = "async";
        img.onerror = () => {
          img.src = "";
          img.style.display = "none";
          let nextFallback = card.querySelector(".wheel-fallback");
          if (!nextFallback) {
            nextFallback = document.createElement("div");
            nextFallback.className = "wheel-fallback";
            card.appendChild(nextFallback);
          }
          nextFallback.textContent = title;
          nextFallback.style.display = "";
        };
        card.appendChild(img);
      }
      img.alt = title;
      if (img.src !== wheelUrl) {
        img.src = wheelUrl;
      }
      img.style.display = "";
      if (fallback) fallback.style.display = "none";
    } else {
      if (!fallback) {
        fallback = document.createElement("div");
        fallback.className = "wheel-fallback";
        card.appendChild(fallback);
      }
      fallback.textContent = title;
      fallback.style.display = "";
      if (img) {
        img.src = "";
        img.style.display = "none";
      }
    }
  });
}

function getWheelStep(track) {
  const cards = Array.from(track.children);
  if (cards.length < 2) return 0;
  const first = cards[0];
  const second = cards[1];
  return second.offsetLeft - first.offsetLeft;
}

function updateWheelCarousel(view) {
  const carousel = view.wheelCarousel;
  let track = view.wheelTrack;
  if (view.wheelTrackResetTimer) {
    clearTimeout(view.wheelTrackResetTimer);
    view.wheelTrackResetTimer = null;
  }

  const existingTracks = Array.from(carousel.querySelectorAll(".wheel-track"));
  existingTracks.forEach((existingTrack) => {
    existingTrack.getAnimations().forEach((animation) => animation.cancel());
    existingTrack.classList.remove("wheel-track-transition");
    existingTrack.style.transform = "";
    existingTrack.style.zIndex = "";
    if (existingTrack !== track) {
      existingTrack.remove();
    }
  });

  const canAnimate =
    lastRenderedTableIndex !== -1 &&
    lastWheelMoveDirection !== 0 &&
    vpin.getTableCount() > 1;

  if (!canAnimate) {
    renderWheelCarousel(track, currentTableIndex);
    return;
  }

  renderWheelCarousel(track, lastRenderedTableIndex);
  const step = getWheelStep(track);
  if (!step) {
    renderWheelCarousel(track, currentTableIndex);
    return;
  }

  const incomingTrack = createWheelTrack();
  renderWheelCarousel(incomingTrack, currentTableIndex);
  incomingTrack.classList.add("wheel-track-transition");
  incomingTrack.style.zIndex = "2";
  track.classList.add("wheel-track-transition");
  track.style.zIndex = "1";
  carousel.appendChild(incomingTrack);

  const outgoingDelta = lastWheelMoveDirection > 0 ? -step : step;
  const incomingStart = -outgoingDelta;
  const translateValue = (value) => `translateY(-50%) translateX(${value}px)`;

  incomingTrack.style.transform = translateValue(incomingStart);
  incomingTrack.offsetWidth;

  const animationDuration = 520;
  const animationOptions = {
    duration: animationDuration,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    fill: "forwards",
  };

  // Demote the outgoing track's active card so it shrinks WHILE the track
  // fades. It used to keep .active — and translateY(-60px) scale(1.7) — for
  // the whole fade, leaving a large low-opacity ghost of the previous wheel
  // hanging over the incoming track's full-opacity cards. Two traps here,
  // both measured in headless Chromium:
  //  - read the computed transform BEFORE dropping the class: during rapid
  //    flipper paging wheelActiveGrow can still be mid-flight, and its
  //    animated value vanishes with the class;
  //  - drive the shrink with animate(), not the CSS transition: removing a
  //    class that also removes a CSS animation SNAPS transform to the new
  //    value — a transition never runs out of an animation-held value.
  // Same duration/easing as the track fade, so shrink and fade end together.
  const outgoingActive = track.querySelector(".wheel-card.active");
  if (outgoingActive) {
    const fromTransform = getComputedStyle(outgoingActive).transform;
    outgoingActive.className = "wheel-card dim-near demoted";
    outgoingActive.animate(
      [
        {
          transform:
            fromTransform === "none" ? "translateY(0) scale(1)" : fromTransform,
        },
        { transform: "translateY(0) scale(1)" },
      ],
      animationOptions,
    );
  }

  track.style.opacity = "1";
  incomingTrack.style.opacity = "1";

  track.animate(
    [
      { transform: "translateY(-50%)", opacity: 1 },
      { transform: translateValue(outgoingDelta), opacity: 0 },
    ],
    animationOptions,
  );
  incomingTrack.animate(
    [
      { transform: translateValue(incomingStart), opacity: 1 },
      { transform: "translateY(-50%)", opacity: 1 },
    ],
    animationOptions,
  );

  view.wheelTrack = incomingTrack;
  view.wheelTrackResetTimer = setTimeout(() => {
    track.remove();
    view.wheelTrackResetTimer = null;
  }, animationDuration + 50);
}
