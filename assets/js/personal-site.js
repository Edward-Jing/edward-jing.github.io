(() => {
  const header = document.querySelector("[data-header]");
  const pageName = document.body.dataset.page;
  const navLinks = [...document.querySelectorAll(".site-nav a")];

  if (pageName) {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.dataset.page === pageName);
    });
  }

  window.addEventListener("scroll", () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  });

  const entryGate = document.querySelector("[data-entry-gate]");
  const entryKey = "jingzhi-entry-gate-seen";

  function readSessionFlag(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeSessionFlag(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      return false;
    }
    return true;
  }

  if (entryGate) {
    const forceEntry = new URLSearchParams(window.location.search).has("intro");
    const introDuration = 4700;
    let introTimer = null;
    const closeEntry = () => {
      if (introTimer) {
        window.clearTimeout(introTimer);
        introTimer = null;
      }
      window.removeEventListener("mousemove", closeEntry);
      window.removeEventListener("touchstart", closeEntry);
      entryGate.classList.add("is-hidden");
      writeSessionFlag(entryKey, "true");
    };
    const armEntryExit = () => {
      introTimer = null;
      entryGate.classList.add("is-awaiting-motion");
      window.addEventListener("mousemove", closeEntry, { once: true });
      window.addEventListener("touchstart", closeEntry, { once: true, passive: true });
    };

    if (readSessionFlag(entryKey) && !forceEntry) {
      entryGate.classList.add("is-hidden");
    } else {
      introTimer = window.setTimeout(armEntryExit, introDuration);
    }
  }

  const focusData = {
    attack: {
      title: "Backdoor Attacks",
      copy: "I am interested in how hidden triggers change model behavior and how those failures can be exposed systematically."
    },
    defense: {
      title: "Backdoor Defense",
      copy: "This thread studies detection, mitigation, and evaluation methods for models that may contain hidden malicious behavior."
    },
    eval: {
      title: "Statistical Evaluation",
      copy: "Evaluation should make uncertainty, sampling design, and failure modes explicit instead of only reporting aggregate scores."
    }
  };

  const focusTitle = document.querySelector("#focus-title");
  const focusCopy = document.querySelector("#focus-copy");
  document.querySelectorAll("[data-focus]").forEach((card) => {
    const updateFocus = () => {
      const item = focusData[card.dataset.focus];
      if (!item || !focusTitle || !focusCopy) return;
      focusTitle.textContent = item.title;
      focusCopy.textContent = item.copy;
    };
    card.addEventListener("mouseenter", updateFocus);
    card.addEventListener("focus", updateFocus);
  });

  const galleryButtons = [...document.querySelectorAll(".gallery-item")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => item.classList.toggle("active", item === button));
      galleryButtons.forEach((item) => {
        item.classList.toggle("is-hidden", filter !== "all" && item.dataset.category !== filter);
      });
    });
  });

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = lightbox?.querySelector("img");
  const lightboxTitle = lightbox?.querySelector("strong");
  const lightboxCaption = lightbox?.querySelector("span");
  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
  };

  galleryButtons.forEach((item) => {
    item.addEventListener("click", () => {
      const image = item.querySelector("img");
      if (!image || !lightbox || !lightboxImage || !lightboxTitle || !lightboxCaption) return;
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      lightboxTitle.textContent = item.dataset.title;
      lightboxCaption.textContent = item.dataset.caption;
      lightbox.hidden = false;
      document.body.style.overflow = "hidden";
    });
  });

  lightbox?.querySelector(".lightbox-close")?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox && !lightbox.hidden) closeLightbox();
  });

  const map = document.querySelector("[data-visitor-map]");
  const place = document.querySelector("#visitor-place");
  const detail = document.querySelector("#visitor-detail");
  const leavePin = document.querySelector("#leave-pin");
  const storageKey = "jingzhi-site-visitor-pin";

  const sitePins = [
    {
      label: "Davis, CA",
      detail: "Ph.D. life at UC Davis.",
      lat: 38.5449,
      lng: -121.7405,
      type: "home"
    },
    {
      label: "Shanghai",
      detail: "Undergraduate years at Fudan University.",
      lat: 31.2304,
      lng: 121.4737,
      type: "home"
    },
    {
      label: "Chapel Hill",
      detail: "Academic connection with UNC Statistics.",
      lat: 35.9049,
      lng: -79.0469,
      type: "home"
    }
  ];

  const timezoneLookup = [
    { test: /Los_Angeles|Vancouver|Tijuana|Pacific/i, lat: 34.0522, lng: -118.2437, label: "West Coast visitor" },
    { test: /New_York|Toronto|Eastern/i, lat: 40.7128, lng: -74.006, label: "Eastern North America visitor" },
    { test: /Chicago|Central/i, lat: 41.8781, lng: -87.6298, label: "Central North America visitor" },
    { test: /London|Dublin|Lisbon/i, lat: 51.5072, lng: -0.1276, label: "Western Europe visitor" },
    { test: /Paris|Berlin|Rome|Madrid|Amsterdam/i, lat: 48.8566, lng: 2.3522, label: "Central Europe visitor" },
    { test: /Shanghai|Hong_Kong|Singapore|Taipei|Beijing/i, lat: 31.2304, lng: 121.4737, label: "East Asia visitor" },
    { test: /Tokyo|Seoul/i, lat: 35.6762, lng: 139.6503, label: "Northeast Asia visitor" },
    { test: /Sydney|Melbourne/i, lat: -33.8688, lng: 151.2093, label: "Australia visitor" }
  ];

  function visitorPoint() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local browser";
    const match = timezoneLookup.find((item) => item.test.test(timezone));
    if (match) return { ...match, timezone };
    return { lat: 20, lng: 0, label: "Recent visitor", timezone };
  }

  function hasLatLng(point) {
    return point && Number.isFinite(point.lat) && Number.isFinite(point.lng);
  }

  function normalizePoint(point) {
    const timezone = point?.timezone;
    if (!timezone) return visitorPoint();
    const match = timezone ? timezoneLookup.find((item) => item.test.test(timezone)) : null;
    if (match) return { ...point, ...match, timezone };
    if (hasLatLng(point)) return { ...point, label: "Recent visitor" };
    return visitorPoint();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function markerIcon(type) {
    if (!window.L) return null;
    return window.L.divIcon({
      className: `site-map-marker ${type}`,
      html: `<span class="site-map-dot ${type}"></span>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      popupAnchor: [0, -12]
    });
  }

  function popupContent(title, detailText) {
    return `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detailText)}</span>`;
  }

  function setStatus(point, stored = false) {
    if (!place || !detail) return;
    place.textContent = point.label;
    detail.textContent = stored
      ? "Saved in this browser. Region shown broadly."
      : "Region shown broadly.";
  }

  function readStoredPoint() {
    try {
      const existing = localStorage.getItem(storageKey);
      return existing ? JSON.parse(existing) : null;
    } catch {
      return null;
    }
  }

  function savePoint(point) {
    const safePoint = normalizePoint(point);
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        lat: safePoint.lat,
        lng: safePoint.lng,
        label: safePoint.label,
        timezone: safePoint.timezone
      }));
    } catch {
      return false;
    }
    return true;
  }

  function initLeafletMap() {
    if (!map || !window.L) return false;

    const L = window.L;
    const renderedMap = L.map(map, {
      center: [25, 0],
      zoom: 2,
      minZoom: 2,
      maxZoom: 8,
      scrollWheelZoom: false,
      worldCopyJump: true
    });

    const streetLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19
    });
    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri, Maxar, Earthstar Geographics, and the GIS User Community",
      maxZoom: 19
    }).addTo(renderedMap);

    L.control.layers({
      Satellite: satelliteLayer,
      "Street map": streetLayer
    }, null, {
      position: "bottomleft"
    }).addTo(renderedMap);

    sitePins.forEach((pin) => {
      L.marker([pin.lat, pin.lng], {
        icon: markerIcon(pin.type),
        title: pin.label
      })
        .addTo(renderedMap)
        .bindPopup(popupContent(pin.label, pin.detail))
        .on("click", () => {
          if (place) place.textContent = pin.label;
          if (detail) detail.textContent = pin.detail;
        });
    });

    let visitorMarker = null;
    function renderVisitorPin(point, stored = false) {
      const safePoint = normalizePoint(point);
      if (visitorMarker) visitorMarker.remove();
      visitorMarker = L.marker([safePoint.lat, safePoint.lng], {
        icon: markerIcon("visitor"),
        title: "You"
      })
        .addTo(renderedMap)
        .bindPopup(popupContent("Visitor pin", "Region shown broadly."));
      setStatus(safePoint, stored);
      return safePoint;
    }

    const storedPoint = readStoredPoint();
    const initialPointRaw = storedPoint || visitorPoint();
    const isRecorded = Boolean(storedPoint) || savePoint(initialPointRaw);
    const initialPoint = renderVisitorPin(initialPointRaw, isRecorded);
    const bounds = L.latLngBounds([...sitePins, initialPoint].map((point) => [point.lat, point.lng]));
    renderedMap.fitBounds(bounds.pad(0.18), { maxZoom: 3 });
    window.setTimeout(() => {
      renderedMap.invalidateSize();
      setStatus(initialPoint, true);
    }, 100);

    leavePin?.addEventListener("click", () => {
      const point = visitorPoint();
      const saved = savePoint(point);
      renderVisitorPin(point, saved);
      renderedMap.panTo([point.lat, point.lng]);
    });

    return true;
  }

  if (map && place && detail) {
    const ready = initLeafletMap();
    if (!ready) {
      const point = visitorPoint();
      setStatus(point, false);
      map.classList.add("map-unavailable");
      map.textContent = "The realistic map could not load. Please refresh when the map library is available.";
    }
  }
})();
