/**
 * Utility functions for fetching marine weather data from Open-Meteo
 */

export interface MarineConditions {
  waveHeight: number;
  wavePeriod: number;
  waveDirection: number;
  swellHeight: number;
  swellPeriod: number;
  swellDirection: number;
  windSpeed: number;
  windDirection: number;
  timestamp: string;
}

/**
 * Fetches current marine conditions from Open-Meteo
 * @param latitude Spot latitude
 * @param longitude Spot longitude
 * @returns Marine conditions data
 */
export async function fetchMarineConditions(
  latitude: number,
  longitude: number,
): Promise<MarineConditions | null> {
  try {
    // Marine API for wave/swell data
    const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
    marineUrl.searchParams.set("latitude", latitude.toString());
    marineUrl.searchParams.set("longitude", longitude.toString());
    marineUrl.searchParams.set(
      "hourly",
      [
        "wave_height",
        "wave_period",
        "wave_direction",
        "swell_wave_height",
        "swell_wave_period",
        "swell_wave_direction",
      ].join(","),
    );
    marineUrl.searchParams.set("forecast_days", "1");

    // Weather API for wind data
    const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
    weatherUrl.searchParams.set("latitude", latitude.toString());
    weatherUrl.searchParams.set("longitude", longitude.toString());
    weatherUrl.searchParams.set("hourly", "wind_speed_10m,wind_direction_10m");
    weatherUrl.searchParams.set("forecast_days", "1");

    const [marineResponse, weatherResponse] = await Promise.all([
      fetch(marineUrl.toString()),
      fetch(weatherUrl.toString()),
    ]);

    if (!marineResponse.ok) {
      throw new Error(`Marine API error: ${marineResponse.status}`);
    }
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }

    const marineData = await marineResponse.json();
    const weatherData = await weatherResponse.json();

    // Get the first hourly forecast (current hour)
    const marineHourly = marineData.hourly;
    const weatherHourly = weatherData.hourly;
    const idx = 0;

    return {
      waveHeight: marineHourly.wave_height[idx] || 0,
      wavePeriod: marineHourly.wave_period[idx] || 0,
      waveDirection: marineHourly.wave_direction[idx] || 0,
      swellHeight: marineHourly.swell_wave_height[idx] || 0,
      swellPeriod: marineHourly.swell_wave_period[idx] || 0,
      swellDirection: marineHourly.swell_wave_direction[idx] || 0,
      windSpeed: weatherHourly.wind_speed_10m[idx] || 0,
      windDirection: weatherHourly.wind_direction_10m[idx] || 0,
      timestamp: marineHourly.time[idx] || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch marine conditions:", error);
    return null;
  }
}

/**
 * Converts degrees to cardinal direction
 */
export function degreesToCardinal(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Converts meters to feet
 */
export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

/**
 * Converts km/h to mph
 */
export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}
