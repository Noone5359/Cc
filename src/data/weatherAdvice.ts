// Pre-stored weather advice for different conditions and times of day
// Weather codes from Open-Meteo API

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'overcast'
  | 'lightRain'
  | 'rainy'
  | 'heavyRain'
  | 'stormy'
  | 'foggy'
  | 'mist'
  | 'drizzle'
  | 'freezing'
  | 'snowy';

export interface WeatherAdviceItem {
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
  tempRange: { min: number; max: number };
  advice: string;
}

export const weatherAdviceData: WeatherAdviceItem[] = [
  // Clear weather - Morning (narrower ranges)
  {
    condition: 'clear',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 10 },
    advice:
      '🌅 Chilly clear morning! Bundle up with warm layers and a jacket for your early classes.',
  },
  {
    condition: 'clear',
    timeOfDay: 'morning',
    tempRange: { min: 10, max: 18 },
    advice: '🌅 Beautiful crisp morning! Layer up with a light jacket for your early classes.',
  },
  {
    condition: 'clear',
    timeOfDay: 'morning',
    tempRange: { min: 18, max: 25 },
    advice:
      '☀️ Perfect morning weather! Great time for a walk to campus or a quick outdoor study session.',
  },
  {
    condition: 'clear',
    timeOfDay: 'morning',
    tempRange: { min: 25, max: 32 },
    advice: '🌞 Bright and warm morning! Wear light, breathable clothes and carry a water bottle.',
  },
  {
    condition: 'clear',
    timeOfDay: 'morning',
    tempRange: { min: 32, max: 50 },
    advice: '🔥 Very hot morning! Stay hydrated, wear sunscreen, and seek shade between classes.',
  },

  // Clear weather - Afternoon (narrower ranges)
  {
    condition: 'clear',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 12 },
    advice:
      '🌤️ Cool and clear afternoon! Carry a warm jacket for outdoor activities between classes.',
  },
  {
    condition: 'clear',
    timeOfDay: 'afternoon',
    tempRange: { min: 12, max: 20 },
    advice: '🌤️ Pleasant clear afternoon! Perfect for outdoor study or sports activities.',
  },
  {
    condition: 'clear',
    timeOfDay: 'afternoon',
    tempRange: { min: 20, max: 28 },
    advice: '☀️ Warm afternoon! Ideal for studying at outdoor spots with some shade on campus.',
  },
  {
    condition: 'clear',
    timeOfDay: 'afternoon',
    tempRange: { min: 28, max: 35 },
    advice:
      '🔥 Hot afternoon! Stay in air-conditioned spaces, carry sunglasses and plenty of water.',
  },
  {
    condition: 'clear',
    timeOfDay: 'afternoon',
    tempRange: { min: 35, max: 50 },
    advice: '🌡️ Extremely hot! Avoid prolonged outdoor exposure. Stay indoors and keep hydrated.',
  },

  // Clear weather - Evening (narrower ranges)
  {
    condition: 'clear',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 15 },
    advice: '🌆 Cool clear evening! Carry a jacket for walks around campus or outdoor sports.',
  },
  {
    condition: 'clear',
    timeOfDay: 'evening',
    tempRange: { min: 15, max: 25 },
    advice: '🌆 Clear evening ahead! Great time for a walk around campus or outdoor sports.',
  },
  {
    condition: 'clear',
    timeOfDay: 'evening',
    tempRange: { min: 25, max: 50 },
    advice: '🌇 Warm evening! Perfect for evening activities or hanging out with friends outside.',
  },

  // Clear weather - Night
  {
    condition: 'clear',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 15 },
    advice:
      '🌙 Cold clear night! Bundle up if heading out. Perfect stargazing weather from your room!',
  },
  {
    condition: 'clear',
    timeOfDay: 'night',
    tempRange: { min: 15, max: 50 },
    advice: '🌙 Clear night! Perfect stargazing weather if you need a study break on the terrace.',
  },

  // Partly Cloudy - Morning
  {
    condition: 'partlyCloudy',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 15 },
    advice: '🌤️ Partly cloudy and cool morning! Carry a light jacket, weather might change.',
  },
  {
    condition: 'partlyCloudy',
    timeOfDay: 'morning',
    tempRange: { min: 15, max: 25 },
    advice: '⛅ Partly cloudy morning! Comfortable weather for your commute to classes.',
  },
  {
    condition: 'partlyCloudy',
    timeOfDay: 'morning',
    tempRange: { min: 25, max: 50 },
    advice: '🌤️ Warm morning with some clouds! Wear light clothes but keep sunscreen handy.',
  },

  // Partly Cloudy - Afternoon
  {
    condition: 'partlyCloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 18 },
    advice: '⛅ Cool afternoon with partial clouds! Nice weather for a campus walk.',
  },
  {
    condition: 'partlyCloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: 18, max: 28 },
    advice: '🌤️ Pleasant partly cloudy afternoon! Great for outdoor activities without harsh sun.',
  },
  {
    condition: 'partlyCloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: 28, max: 50 },
    advice: '⛅ Warm afternoon with some cloud cover! Stay hydrated and carry water.',
  },

  // Partly Cloudy - Evening/Night
  {
    condition: 'partlyCloudy',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌥️ Partly cloudy evening! Comfortable weather for outdoor evening activities.',
  },
  {
    condition: 'partlyCloudy',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌙☁️ Partly cloudy night! Mild weather, good for late evening study sessions.',
  },

  // Cloudy weather - Morning
  {
    condition: 'cloudy',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 15 },
    advice: '☁️ Cloudy and cool morning! Carry a jacket, it might get chilly between classes.',
  },
  {
    condition: 'cloudy',
    timeOfDay: 'morning',
    tempRange: { min: 15, max: 25 },
    advice: '☁️ Cloudy morning! Comfortable temperature for your commute, no harsh sun today.',
  },
  {
    condition: 'cloudy',
    timeOfDay: 'morning',
    tempRange: { min: 25, max: 50 },
    advice: '⛅ Overcast and warm morning! Pleasant temperature despite the clouds.',
  },

  // Cloudy weather - Afternoon
  {
    condition: 'cloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 18 },
    advice: '☁️ Cloudy and cool afternoon! Keep a light jacket handy.',
  },
  {
    condition: 'cloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: 18, max: 28 },
    advice: '☁️ Cloudy afternoon! Comfortable weather for walking to classes without harsh sun.',
  },
  {
    condition: 'cloudy',
    timeOfDay: 'afternoon',
    tempRange: { min: 28, max: 50 },
    advice: '⛅ Cloudy and warm afternoon! No need for sunglasses today, but stay hydrated.',
  },

  // Cloudy weather - Evening/Night
  {
    condition: 'cloudy',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌥️ Overcast evening! Might rain later, keep an umbrella handy just in case.',
  },
  {
    condition: 'cloudy',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '☁️ Cloudy night! Weather might change, check forecast before heading out tomorrow.',
  },

  // Overcast
  {
    condition: 'overcast',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 50 },
    advice: '🌫️ Overcast morning! Low visibility, allow extra time for commute. Rain possible.',
  },
  {
    condition: 'overcast',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice: '☁️ Heavy overcast afternoon! Keep an umbrella nearby, rain likely soon.',
  },
  {
    condition: 'overcast',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌥️ Overcast evening! Indoor activities recommended. Rain expected.',
  },
  {
    condition: 'overcast',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌑 Dense cloud cover tonight! Stay indoors, weather may worsen.',
  },

  // Mist/Fog - Morning (specific ranges)
  {
    condition: 'mist',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 15 },
    advice: '🌫️ Misty and cold morning! Walk carefully with reduced visibility and dress warm.',
  },
  {
    condition: 'mist',
    timeOfDay: 'morning',
    tempRange: { min: 15, max: 50 },
    advice:
      '🌫️ Misty morning! Visibility is low. Walk/drive carefully and leave early for classes.',
  },

  {
    condition: 'foggy',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 15 },
    advice: '🌁 Dense fog and cold! Very poor visibility. Leave extra early and dress warmly.',
  },
  {
    condition: 'foggy',
    timeOfDay: 'morning',
    tempRange: { min: 15, max: 50 },
    advice:
      '🌫️ Foggy morning! Drive/walk carefully with reduced visibility. Leave early for classes.',
  },

  // Mist/Fog - Evening/Night
  {
    condition: 'mist',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌁 Misty evening! Be cautious while moving around campus. Stick to well-lit paths.',
  },
  {
    condition: 'foggy',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌁 Foggy evening! Be extra cautious while moving around campus. Use well-lit paths.',
  },
  {
    condition: 'foggy',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌫️ Heavy fog tonight! Avoid unnecessary travel. Stay indoors if possible.',
  },

  // Drizzle
  {
    condition: 'drizzle',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 20 },
    advice: '🌦️ Light drizzle and cool! Carry an umbrella and wear a light raincoat.',
  },
  {
    condition: 'drizzle',
    timeOfDay: 'morning',
    tempRange: { min: 20, max: 50 },
    advice: '🌦️ Morning drizzle! Light rain expected. Carry an umbrella and protect your books.',
  },
  {
    condition: 'drizzle',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice: '🌧️ Afternoon drizzle! Keep an umbrella handy, might get heavier.',
  },
  {
    condition: 'drizzle',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌦️ Light evening drizzle! Carry an umbrella for your walk back.',
  },
  {
    condition: 'drizzle',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌧️ Drizzling tonight! Keep windows closed and have umbrella ready for tomorrow.',
  },

  // Light Rain
  {
    condition: 'lightRain',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 20 },
    advice: '🌧️ Light rain and chilly! Umbrella, raincoat, and warm layers needed.',
  },
  {
    condition: 'lightRain',
    timeOfDay: 'morning',
    tempRange: { min: 20, max: 50 },
    advice: "🌧️ Light rainy morning! Don't forget your umbrella and waterproof bag for your books.",
  },
  {
    condition: 'lightRain',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice: '☔ Light rain this afternoon! Keep umbrella ready, good day for library study.',
  },
  {
    condition: 'lightRain',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice: '🌧️ Light rain in the evening! Carry umbrella and watch for wet campus paths.',
  },
  {
    condition: 'lightRain',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌃🌧️ Light rain tonight! Cozy weather for indoor study. Keep dry.',
  },

  // Rainy weather
  {
    condition: 'rainy',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 18 },
    advice: '🌧️ Cold and rainy morning! Waterproof jacket, umbrella, and warm layers essential.',
  },
  {
    condition: 'rainy',
    timeOfDay: 'morning',
    tempRange: { min: 18, max: 50 },
    advice: "🌧️ Rainy morning! Don't forget your umbrella and waterproof bag for your books.",
  },
  {
    condition: 'rainy',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice: '☔ Rainy afternoon! Stay indoors for group study or library time. Carry an umbrella.',
  },
  {
    condition: 'rainy',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice:
      '🌧️ Evening showers! Perfect weather for cozy indoor activities. Watch your step on wet paths.',
  },
  {
    condition: 'rainy',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice:
      '🌃☔ Rainy night! Stay dry, avoid unnecessary travel. Good night for indoor study sessions.',
  },

  // Heavy Rain
  {
    condition: 'heavyRain',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 50 },
    advice:
      '⛈️ Heavy rain this morning! Waterproof everything. Consider postponing non-essential trips.',
  },
  {
    condition: 'heavyRain',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice:
      '🌊 Heavy downpour! Stay indoors. If you must go out, be extremely careful of flooding.',
  },
  {
    condition: 'heavyRain',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice:
      '⛈️ Heavy rain evening! Avoid going out. Perfect time for indoor study and assignments.',
  },
  {
    condition: 'heavyRain',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '🌧️💨 Heavy rain all night! Stay safe indoors. Check for class updates tomorrow.',
  },

  // Stormy weather
  {
    condition: 'stormy',
    timeOfDay: 'morning',
    tempRange: { min: -10, max: 50 },
    advice: '⛈️ Stormy morning! Stay indoors when possible. If you must go out, be extra careful.',
  },
  {
    condition: 'stormy',
    timeOfDay: 'afternoon',
    tempRange: { min: -10, max: 50 },
    advice: '⚡ Thunderstorms expected! Avoid outdoor activities. Stay in safe indoor locations.',
  },
  {
    condition: 'stormy',
    timeOfDay: 'evening',
    tempRange: { min: -10, max: 50 },
    advice:
      '🌩️ Stormy evening ahead! Plan to stay indoors. Perfect time for catching up on assignments.',
  },
  {
    condition: 'stormy',
    timeOfDay: 'night',
    tempRange: { min: -10, max: 50 },
    advice: '⛈️ Severe storms tonight! Stay indoors, unplug electronics. Safety first!',
  },

  // Freezing conditions
  {
    condition: 'freezing',
    timeOfDay: 'morning',
    tempRange: { min: -50, max: 5 },
    advice:
      '🥶 Freezing morning! Multiple warm layers, gloves, scarf essential. Limit outdoor time.',
  },
  {
    condition: 'freezing',
    timeOfDay: 'afternoon',
    tempRange: { min: -50, max: 5 },
    advice: '❄️ Extremely cold afternoon! Stay bundled up. Carry hot beverages to stay warm.',
  },
  {
    condition: 'freezing',
    timeOfDay: 'evening',
    tempRange: { min: -50, max: 5 },
    advice: '🧊 Freezing evening! Minimize outdoor exposure. Dress in multiple warm layers.',
  },
  {
    condition: 'freezing',
    timeOfDay: 'night',
    tempRange: { min: -50, max: 5 },
    advice: '🌡️❄️ Dangerously cold night! Stay indoors. Check heating and stay warm.',
  },

  // Snowy/Very cold weather
  {
    condition: 'snowy',
    timeOfDay: 'morning',
    tempRange: { min: -50, max: 5 },
    advice: '❄️ Snowy morning! Bundle up with warm layers, gloves, and a scarf. Icy paths ahead!',
  },
  {
    condition: 'snowy',
    timeOfDay: 'morning',
    tempRange: { min: 5, max: 15 },
    advice: '🌨️ Snow possible! Cold morning, dress warm and watch for slippery surfaces.',
  },
  {
    condition: 'snowy',
    timeOfDay: 'afternoon',
    tempRange: { min: -50, max: 5 },
    advice: '☃️ Snowy afternoon! Wear warm clothes, carry hot beverages, watch your step.',
  },
  {
    condition: 'snowy',
    timeOfDay: 'afternoon',
    tempRange: { min: 5, max: 15 },
    advice:
      '🧊 Chilly afternoon with snow! Wear warm clothes and carry hot beverages to stay warm.',
  },
  {
    condition: 'snowy',
    timeOfDay: 'evening',
    tempRange: { min: -50, max: 15 },
    advice: '🌨️ Snowy evening! Layer up well and minimize time outdoors. Stay warm!',
  },
  {
    condition: 'snowy',
    timeOfDay: 'night',
    tempRange: { min: -50, max: 15 },
    advice: '❄️ Heavy snow expected tonight! Stay indoors. Check for class cancellations tomorrow.',
  },
];

// Weather code mapping to conditions (based on Open-Meteo WMO weather codes)
export const getWeatherCondition = (weatherCode: number): WeatherCondition => {
  // Clear sky
  if (weatherCode === 0) return 'clear';

  // Mainly clear, partly cloudy
  if (weatherCode === 1) return 'partlyCloudy';

  // Partly cloudy
  if (weatherCode === 2) return 'cloudy';

  // Overcast
  if (weatherCode === 3) return 'overcast';

  // Fog and depositing rime fog
  if (weatherCode === 45 || weatherCode === 48) return 'foggy';

  // Mist
  if (weatherCode === 10) return 'mist';

  // Drizzle: Light, moderate, and dense intensity
  if (weatherCode >= 51 && weatherCode <= 55) return 'drizzle';

  // Freezing Drizzle: Light and dense intensity
  if (weatherCode === 56 || weatherCode === 57) return 'freezing';

  // Rain: Slight, moderate and heavy intensity
  if (weatherCode === 61) return 'lightRain';
  if (weatherCode === 63) return 'rainy';
  if (weatherCode === 65) return 'heavyRain';

  // Freezing Rain: Light and heavy intensity
  if (weatherCode === 66 || weatherCode === 67) return 'freezing';

  // Snow fall: Slight, moderate, and heavy intensity
  if (weatherCode >= 71 && weatherCode <= 75) return 'snowy';

  // Snow grains
  if (weatherCode === 77) return 'snowy';

  // Rain showers: Slight, moderate, and violent
  if (weatherCode === 80) return 'lightRain';
  if (weatherCode === 81) return 'rainy';
  if (weatherCode === 82) return 'heavyRain';

  // Snow showers slight and heavy
  if (weatherCode === 85 || weatherCode === 86) return 'snowy';

  // Thunderstorm: Slight or moderate, with slight/heavy hail
  if (weatherCode >= 95 && weatherCode <= 99) return 'stormy';

  return 'cloudy'; // default fallback
};

export const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

export const getWeatherAdvice = (weatherCode: number, temperature: number): string => {
  const condition = getWeatherCondition(weatherCode);
  const timeOfDay = getTimeOfDay();

  // Filter advice by condition, time of day, and temperature
  const matchingAdvice = weatherAdviceData.filter(
    (item) =>
      item.condition === condition &&
      item.timeOfDay === timeOfDay &&
      temperature >= item.tempRange.min &&
      temperature <= item.tempRange.max
  );

  // If exact match found, return it
  if (matchingAdvice.length > 0) {
    // Return a random one if multiple matches
    const randomIndex = Math.floor(Math.random() * matchingAdvice.length);
    const selected = matchingAdvice[randomIndex] ?? matchingAdvice[0]!;
    return selected.advice;
  }

  // Fallback: match just condition and time
  const fallbackAdvice = weatherAdviceData.filter(
    (item) => item.condition === condition && item.timeOfDay === timeOfDay
  );

  if (fallbackAdvice.length > 0) {
    const randomIndex = Math.floor(Math.random() * fallbackAdvice.length);
    const selected = fallbackAdvice[randomIndex] ?? fallbackAdvice[0]!;
    return selected.advice;
  }

  // Ultimate fallback
  return '🌤️ Have a great day on campus! Stay prepared for any weather changes.';
};
