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

// ONE track, re-rendered in place, pre-offset one step and slid home. This
// replaced a two-track crossfade (a full duplicate track built per move, old
// track sliding out at opacity 1 -> 0). Harness measurement showed the two
// tracks perfectly registered — every card the same table at the same pixel,
// 0px delta — so the fade was cross-dissolving the wheel into a copy of
// itself. Its only real work was masking the two copies of the active/demoted
// tables mid-flight at different scales (the ghost class of bug), and it was
// not free: two stacked 0.8-opacity copies of every card read as 0.96, a
// visible density pulse at the start of every move. One track cannot show a
// table twice, so the ghost is structurally impossible now, and the pulse is
// gone with the second layer.
//
// The trade: the trailing-edge card vanishes at move start instead of fading
// out. Its mirror — the leading-edge card popping IN at full opacity — was
// present in the crossfade version all along (the incoming track never faded)
// and nobody ever noticed it, four steps off-centre.
function updateWheelCarousel(view) {
  const track = view.wheelTrack;

  const canAnimate =
    lastRenderedTableIndex !== -1 &&
    lastWheelMoveDirection !== 0 &&
    vpin.getTableCount() > 1;

  // Read the active card's transform BEFORE cancelling animations and
  // re-rendering: during rapid flipper paging the grow is still mid-flight,
  // and its animated value vanishes the moment the animation is cancelled.
  // Same trap the 1.6.1 ghost fix was built around; the lesson survives the
  // redesign.
  let activeTransform = null;
  if (canAnimate) {
    const prevActive = track.querySelector(".wheel-card.active");
    if (prevActive) {
      activeTransform = getComputedStyle(prevActive).transform;
    }
  }

  // Cancel leftovers from an interrupted move: they run with fill:"forwards"
  // and would otherwise override class styles forever.
  track
    .getAnimations({ subtree: true })
    .forEach((animation) => animation.cancel());
  const prevDemoted = track.querySelector(".wheel-card.demoted");
  if (prevDemoted) prevDemoted.classList.remove("demoted");

  renderWheelCarousel(track, currentTableIndex);

  if (!canAnimate) return;
  const step = getWheelStep(track);
  if (!step) return;

  // Pre-offset against the move so at t=0 every element sits on the screen
  // slot it occupied before the move, showing the table that slot was already
  // showing — the re-render is invisible, and the only discontinuities are
  // the two edge cards four steps out.
  const startX = lastWheelMoveDirection > 0 ? step : -step;
  const animationOptions = {
    duration: 520,
    easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    fill: "forwards",
  };

  track.animate(
    [
      { transform: `translateY(-50%) translateX(${startX}px)` },
      { transform: "translateY(-50%)" },
    ],
    animationOptions,
  );

  // Replay the pop on the newly active card with animate(): the offset-0
  // element keeps the literal class string "wheel-card active" across
  // re-renders, so the wheelActiveGrow CSS animation never re-fires on a
  // move (it still plays on the first ever render, where the class IS new).
  // Timing matches the CSS keyframes it replays.
  const activeCard = track.querySelector(".wheel-card.active");
  if (activeCard) {
    activeCard.animate(
      [
        { transform: "translateY(0) scale(1)" },
        { transform: "translateY(-60px) scale(1.7)" },
      ],
      {
        duration: 360,
        easing: "cubic-bezier(0.34, 1.2, 0.64, 1)",
        fill: "forwards",
      },
    );
  }

  // The element one slot against the move direction now shows the table that
  // was active a moment ago. Shrink it from wherever the active card
  // visually was — mid-grow during fast paging, hence the captured
  // transform — and with animate(), not the CSS transition: a transition
  // never runs out of an animation-held value, it snaps (the 1.6.1 scar).
  const demoted = track.querySelector(
    `.wheel-card[data-offset="${-lastWheelMoveDirection}"]`,
  );
  if (demoted) {
    demoted.classList.add("demoted");
    demoted.animate(
      [
        {
          transform:
            activeTransform && activeTransform !== "none"
              ? activeTransform
              : "translateY(-60px) scale(1.7)",
        },
        { transform: "translateY(0) scale(1)" },
      ],
      animationOptions,
    );
  }
}
