// Surf conditions ticker logic extracted from index.astro
import {
  fetchMarineConditions,
  degreesToCardinal,
  metersToFeet,
  kmhToMph,
} from "../utils/marine-weather";

const surfSayings = [
  "🤙 The best surfer is the one having the most fun",
  "🌊 You can't stop the waves, but you can learn to surf",
  "🏄 No one is born knowing how to surf - we all started as kooks",
  "💡 Open source surfing - built by surfers, for surfers",
  "✨ Knowledge shared is knowledge multiplied",
  "📚 Got surf wisdom? <a href='/contribute' style='color: var(--color-primary); text-decoration: underline;'>Contribute a guide</a>",
  "🎯 Every wipeout is a lesson, every wave is practice",
  "🌅 Dawn patrol: where legends are made and coffee is essential",
  "🦈 Spoiler: You're more likely to drown than get attacked by a shark",
  "🧘 Surfing is 90% paddling, 10% riding, 100% worth it",
  "🌴 Free surf spots, free guides, free knowledge - that's the SurfDeeper way",
  "💪 Stronger paddling = more waves = more stoke",
  "🎨 Every wave is different - surf like you mean it",
  "🔥 Share your local knowledge - help the next generation",
  "🌟 The ocean doesn't care about your resume",
  "🚀 Progression > Perfection",
  "🎪 Kook life chose us, then we evolved",
  "🌊 Reading waves is an art, catching them is a science",
  "🏆 The only competition is with yesterday's version of yourself",
  "🎓 Learn from everyone, even the groms",
  "💎 Secret spots aren't so secret anymore - respect the locals",
  "⚡ When in doubt, paddle out (but know your limits)",
  "🔮 Forecast says flat? Perfect time to work on your fitness",
  "🎭 Style is temporary, stoke is forever",
  "🌈 There's always a wave for your skill level",
  "🎯 Small wave = big opportunity to practice",
  "🧠 Smart surfing beats strong surfing every time",
  "💫 The lineup is a classroom, the ocean is the teacher",
  "🎪 Every surf session is a gift",
  "🎨 Make this resource better - <a href='/contribute' style='color: var(--color-primary); text-decoration: underline;'>add your knowledge</a>",
  "🌊 Surf therapy: cheaper than a psychologist, more effective",
  "🔧 DIY ding repair: because surf shops close at 6pm",
  "☀️ Sunscreen today, skin tomorrow",
  "🎵 The sound of waves is nature's playlist",
  "🏋️ Shoulder health = surf longevity",
  "🧭 Check the tide, read the swell, respect the ocean",
  "🎬 Video review yourself - it's humbling and helpful",
  "🌍 Protect the ocean, it's the only one we've got",
  "💧 Hydrate before you paddle, thank yourself later",
  "🎪 Worst day surfing > best day working",
  "🔥 Got tips? Got spots? Got stories? <a href='/contribute' style='color: var(--color-primary); text-decoration: underline;'>Share them here</a>",
  "🎯 Position beats power in the lineup",
  "🌊 Wave count doesn't matter if you're smiling",
  "🧘 Breathe, relax, paddle, repeat",
  "⚙️ Board maintenance: love your stick, it loves you back",
  "🎓 Every expert was once a beginner",
  "💪 Paddle fitness is the secret weapon",
  "🌟 Respect the ocean, respect each other",
  "🎨 Your style, your wave, your journey",
  "🔮 Tide turning? Time to adjust",
  "🎪 The stoke is real, the community is real, the help is free",
  "📢 Surf lie: Just one more wave",
  "📢 Surf lie: Should've been here 10 minutes ago",
  "📢 Surf lie: It's not crowded",
  "📢 Surf lie: Tide will fix it",
  "📢 Surf lie: Last one, I swear",
  "📢 Surf lie: I'll sit wide",
  "📢 Surf lie: It's 4-6 and clean - in Surfline voice",
  "📢 Surf lie: That section was makeable",
  "📢 Surf lie: I'm not cold",
  "📢 Surf lie: You didn't burn me",
];

function getRandomSaying() {
  return surfSayings[Math.floor(Math.random() * surfSayings.length)];
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  // Haversine formula for distance between two points
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

async function updateSurfTicker() {
  const tickerContent = document.getElementById("ticker-content");
  if (!tickerContent) return;

  // Surf spots to check (using actual spots from the site)
  const spots = [
    { name: "Ocean Beach", slug: "ocean-beach", lat: 37.7699, lon: -122.5109 },
    { name: "Linda Mar", slug: "linda-mar", lat: 37.5989, lon: -122.5001 },
    {
      name: "Pleasure Point",
      slug: "pleasure-point",
      lat: 36.9651,
      lon: -121.9698,
    },
    { name: "Bolinas", slug: "bolinas", lat: 37.9079, lon: -122.6859 },
  ];

  let closestSpot = spots[0]; // Default to first spot

  // Try to get user's location to find closest spot
  try {
    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 5000,
          maximumAge: 600000, // Cache for 10 minutes
        });
      },
    );

    const userLat = position.coords.latitude;
    const userLon = position.coords.longitude;

    // Find closest spot
    let minDistance = Infinity;
    for (const spot of spots) {
      const distance = calculateDistance(userLat, userLon, spot.lat, spot.lon);
      if (distance < minDistance) {
        minDistance = distance;
        closestSpot = spot;
      }
    }
  } catch (error) {
    // Geolocation failed or denied, use default spot
    console.log("Using default surf spot (geolocation unavailable)");
  }

  // Fetch conditions for closest spot only
  const conditions = await fetchMarineConditions(
    closestSpot.lat,
    closestSpot.lon,
  );

  if (!conditions) {
    (tickerContent as HTMLElement).innerHTML =
      getRandomSaying() +
      "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
      getRandomSaying();
    initMarqueeAnimation();
    return;
  }

  // Build surf report for the one closest spot
  const waveHeightFt = metersToFeet(conditions.waveHeight).toFixed(1);
  const windSpeedMph = kmhToMph(conditions.windSpeed).toFixed(0);
  const windDir = degreesToCardinal(conditions.windDirection);
  const swellDir = degreesToCardinal(conditions.swellDirection);
  const period = conditions.swellPeriod.toFixed(0);

  const surfReport = `<a href="/spots/${closestSpot.slug}" style="color: var(--color-primary); text-decoration: none; border-bottom: 1px dotted var(--color-primary); font-weight: 600;">${closestSpot.name}</a>: ${waveHeightFt}ft @ ${period}s ${swellDir} • Wind ${windSpeedMph}mph ${windDir}`;

  // Get 2 random sayings
  const saying1 = getRandomSaying();
  const saying2 = getRandomSaying();

  // Build full ticker with surf report + random sayings
  const fullMessage = `${surfReport}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${saying1}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${saying2}`;

  // Duplicate content for seamless scrolling
  (tickerContent as HTMLElement).innerHTML =
    fullMessage +
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;—&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" +
    fullMessage;

  // Restart marquee animation after content update
  initMarqueeAnimation();
}

// JavaScript-based marquee animation for mobile compatibility
let animationFrameId: number | null = null;

function initMarqueeAnimation() {
  const tickerContent = document.getElementById("ticker-content");
  if (!tickerContent) return;

  // Cancel any existing animation
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (prefersReducedMotion) {
    return; // Don't animate if user prefers reduced motion
  }

  // Position in pixels (negative values move left)
  let position = 0;
  // Speed in pixels per second for device/time independence
  const speedPxPerSecond = 40; // adjust for desired marquee speed
  // Track last timestamp provided by RAF
  let lastTime: number | null = null;

  function animate(now: number) {
    // Measure content width every frame so responsive/layout changes are handled
    const contentWidth = (tickerContent as HTMLElement).offsetWidth;
    const halfWidth = Math.max(1, contentWidth / 2);

    if (lastTime == null) {
      lastTime = now;
    }

    // Delta time in seconds since last frame
    let dt = (now - lastTime) / 1000;
    lastTime = now;

    // Protect against giant jumps after long sleeps (~> 1s)
    // If you prefer fully catching up, remove the clamp.
    dt = Math.min(dt, 0.25);

    // Update position based on elapsed time
    position -= speedPxPerSecond * dt;

    // Wrap position to create seamless loop across duplicated content
    // Ensure we stay within [-halfWidth, 0]
    while (position <= -halfWidth) position += halfWidth;
    while (position > 0) position -= halfWidth;

    // Apply transform
    (tickerContent as HTMLElement).style.transform =
      `translateX(${position}px)`;

    // Queue next frame
    animationFrameId = requestAnimationFrame(animate);
  }

  // Start the animation
  animationFrameId = requestAnimationFrame(animate);
}

// Initial update and start animation
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  updateSurfTicker();
} else {
  document.addEventListener("DOMContentLoaded", updateSurfTicker);
}

// Refresh every 15 minutes
setInterval(updateSurfTicker, 15 * 60 * 1000);

// Export functions for client-side use if needed
export {
  fetchMarineConditions,
  degreesToCardinal,
  metersToFeet,
  kmhToMph,
  surfSayings,
  getRandomSaying,
  calculateDistance,
  updateSurfTicker,
  initMarqueeAnimation,
};
