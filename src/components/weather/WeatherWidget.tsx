import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppConfig } from '@contexts/AppConfigContext';
import { useSidebar } from '@contexts/SidebarContext';
import { getWeatherAdvice } from '@/data/weatherAdvice';
import { cities, City } from '@/data/cities';

// Interface definitions
interface WeatherData {
    temp: string;
    desc: string;
    icon: string;
}

interface DetailedWeatherData extends WeatherData {
    humidity: number;
    windSpeed: number;
    windDirection: number;
    pressure: number;
    feelsLike: number;
    uvIndex: number;
    visibility: number;
    precipitation: number;
    cloudCover: number;
    dewPoint: number;
    isDay: number;
}

interface WeatherAdviceCache {
    advice: string;
    temp: number;
    weatherCode: number;
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    timestamp: number;
}

const DEFAULT_CITY: City = cities[0] ?? {
    name: 'Dhanbad',
    state: 'Jharkhand',
    lat: 23.79,
    lon: 86.43,
};

// Helper function to interpret WMO weather codes from Open-Meteo
const getWeatherInfoFromCode = (code: number, isDay: number): { desc: string; icon: string } => {
    const is_day = isDay === 1;
    switch (code) {
        case 0:
            return { desc: 'Clear sky', icon: is_day ? '☀️' : '🌙' };
        case 1:
            return { desc: 'Mainly clear', icon: is_day ? '🌤️' : '☁️' };
        case 2:
            return { desc: 'Partly cloudy', icon: is_day ? '⛅️' : '☁️' };
        case 3:
            return { desc: 'Overcast', icon: '☁️' };
        case 45:
        case 48:
            return { desc: 'Fog', icon: '🌫️' };
        case 51:
        case 53:
        case 55:
            return { desc: 'Drizzle', icon: '🌦️' };
        case 56:
        case 57:
            return { desc: 'Freezing Drizzle', icon: '🌨️' };
        case 61:
        case 63:
        case 65:
            return { desc: 'Rain', icon: '🌧️' };
        case 66:
        case 67:
            return { desc: 'Freezing Rain', icon: '🌨️' };
        case 71:
        case 73:
        case 75:
            return { desc: 'Snow fall', icon: '❄️' };
        case 77:
            return { desc: 'Snow grains', icon: '❄️' };
        case 80:
        case 81:
        case 82:
            return { desc: 'Rain showers', icon: '🌧️' };
        case 85:
        case 86:
            return { desc: 'Snow showers', icon: '🌨️' };
        case 95:
            return { desc: 'Thunderstorm', icon: '⛈️' };
        case 96:
        case 99:
            return { desc: 'Thunderstorm with hail', icon: '⛈️' };
        default:
            return { desc: 'Cloudy', icon: '☁️' };
    }
};

const WeatherWidget: React.FC = () => {
    const { config: appConfig } = useAppConfig();
    const { isSidebarExpanded } = useSidebar();

    // Helper function to get default city from admin config
    const getDefaultCityFromConfig = (): City => {
        if (appConfig?.collegeInfo?.location?.city) {
            const adminCity = appConfig.collegeInfo.location.city.toLowerCase();
            const adminState = appConfig.collegeInfo.location.state?.toLowerCase();

            const exactMatch = cities.find(
                (c) =>
                    c.name.toLowerCase() === adminCity &&
                    (!adminState || c.state.toLowerCase() === adminState)
            );
            if (exactMatch) return exactMatch;

            const partialMatch = cities.find((c) => c.name.toLowerCase() === adminCity);
            if (partialMatch) return partialMatch;
        }
        return DEFAULT_CITY;
    };

    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [weatherError, setWeatherError] = useState<string | null>(null);
    const [detailedWeather, setDetailedWeather] = useState<DetailedWeatherData | null>(null);
    const [showWeatherModal, setShowWeatherModal] = useState(false);
    const [selectedCity, setSelectedCity] = useState<City>(() => {
        const savedCity = localStorage.getItem('selectedCity');
        if (savedCity) {
            try {
                return JSON.parse(savedCity);
            } catch {
                return DEFAULT_CITY;
            }
        }
        return DEFAULT_CITY; // Will update via effect if config loads later
    });
    const [citySearchOpen, setCitySearchOpen] = useState(false);
    const [citySearchQuery, setCitySearchQuery] = useState('');
    const cityDropdownRef = useRef<HTMLDivElement>(null);

    // Recommendations
    const [recommendation, setRecommendation] = useState<string | null>(null);
    const [recommendationLoading, setRecommendationLoading] = useState(false);
    const [recommendationError, setRecommendationError] = useState<string | null>(null);

    // Drag position state - persisted to localStorage
    const [widgetPosition, setWidgetPosition] = useState<{ x: number; y: number }>(() => {
        const saved = localStorage.getItem('weatherWidgetPosition');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch {
                return { x: 0, y: 0 };
            }
        }
        return { x: 0, y: 0 };
    });
    const constraintRef = useRef<HTMLDivElement>(null);
    const isDraggingRef = useRef(false);

    // Track drag start
    const handleDragStart = useCallback(() => {
        isDraggingRef.current = true;
    }, []);

    // Save position to localStorage when drag ends
    const handleDragEnd = useCallback(() => {
        // Keep isDragging true briefly to prevent click from firing
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);

        const widgetEl = document.getElementById('weather-widget');
        if (widgetEl) {
            const rect = widgetEl.getBoundingClientRect();
            // Store the actual position relative to viewport
            const position = {
                x: rect.left,
                y: rect.top
            };
            setWidgetPosition(position);
            localStorage.setItem('weatherWidgetPosition', JSON.stringify(position));
        }
    }, []);

    // Handle click - only open modal if not dragging
    const handleClick = useCallback(() => {
        if (!isDraggingRef.current) {
            setShowWeatherModal(true);
        }
    }, []);

    const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' | 'night' => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    };

    const getCachedAdvice = (temp: number, weatherCode: number): string | null => {
        try {
            const cached = localStorage.getItem('weatherAdviceCache');
            if (!cached) return null;

            const cacheData: WeatherAdviceCache = JSON.parse(cached);
            const now = Date.now();
            const cacheAge = now - cacheData.timestamp;
            const threeHours = 1 * 60 * 60 * 1000;

            if (cacheAge > threeHours) {
                localStorage.removeItem('weatherAdviceCache');
                return null;
            }

            const currentTimeOfDay = getTimeOfDay();
            const tempDiff = Math.abs(temp - cacheData.temp);

            if (
                cacheData.timeOfDay === currentTimeOfDay &&
                tempDiff < 1 &&
                cacheData.weatherCode === weatherCode
            ) {
                return cacheData.advice;
            }

            return null;
        } catch (err) {
            console.error('Cache read error:', err);
            return null;
        }
    };

    const cacheAdvice = (advice: string, temp: number, weatherCode: number) => {
        try {
            const cacheData: WeatherAdviceCache = {
                advice,
                temp,
                weatherCode,
                timeOfDay: getTimeOfDay(),
                timestamp: Date.now(),
            };
            localStorage.setItem('weatherAdviceCache', JSON.stringify(cacheData));
        } catch (err) {
            console.error('Cache write error:', err);
        }
    };

    const fetchWeatherRecommendation = async (weatherData: WeatherData, weatherCode: number) => {
        setRecommendationLoading(true);
        setRecommendationError(null);
        setRecommendation(null);

        try {
            const temp = parseFloat(weatherData.temp);
            const cachedAdvice = getCachedAdvice(temp, weatherCode);
            if (cachedAdvice) {
                setRecommendation(cachedAdvice);
                setRecommendationLoading(false);
                return;
            }

            const advice = getWeatherAdvice(weatherCode, temp);
            setRecommendation(advice);
            cacheAdvice(advice, temp, weatherCode);
        } catch (err) {
            console.error('Weather advice error:', err);
            setRecommendationError("Couldn't get weather advices right now.");
        } finally {
            setRecommendationLoading(false);
        }
    };

    const fetchWeather = async (city: City = selectedCity) => {
        setWeatherError(null);
        setWeatherLoading(true);
        setRecommendation(null);
        setRecommendationError(null);

        try {
            const lat = city.lat;
            const lon = city.lon;
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,apparent_temperature,precipitation,uv_index,cloud_cover,dew_point_2m&timezone=Asia/Kolkata`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Weather API failed with status: ${response.status}`);
            }
            const data = await response.json();

            if (!data.current) {
                throw new Error('Invalid weather data received.');
            }

            const {
                temperature_2m,
                weather_code,
                is_day,
                relative_humidity_2m,
                wind_speed_10m,
                wind_direction_10m,
                surface_pressure,
                apparent_temperature,
                precipitation,
                uv_index,
                cloud_cover,
                dew_point_2m,
            } = data.current;
            const { desc, icon } = getWeatherInfoFromCode(weather_code, is_day);

            const weatherData: WeatherData = {
                temp: temperature_2m.toFixed(0),
                desc: desc,
                icon: icon,
            };
            setWeather(weatherData);

            const detailedData: DetailedWeatherData = {
                ...weatherData,
                humidity: relative_humidity_2m || 0,
                windSpeed: wind_speed_10m || 0,
                windDirection: wind_direction_10m || 0,
                pressure: surface_pressure || 0,
                feelsLike: apparent_temperature || parseFloat(weatherData.temp),
                uvIndex: uv_index || 0,
                visibility: 10,
                precipitation: precipitation || 0,
                cloudCover: cloud_cover || 0,
                dewPoint: dew_point_2m || 0,
                isDay: is_day || 0,
            };
            setDetailedWeather(detailedData);

            await fetchWeatherRecommendation(weatherData, weather_code);
        } catch (err) {
            setWeatherError('Could not load weather.');
            console.error('Weather fetch error:', err);
        } finally {
            setWeatherLoading(false);
        }
    };

    useEffect(() => {
        const savedCity = localStorage.getItem('selectedCity');
        if (!savedCity && appConfig?.collegeInfo?.location?.city) {
            const defaultCity = getDefaultCityFromConfig();
            if (
                defaultCity &&
                (defaultCity.name !== selectedCity.name || defaultCity.state !== selectedCity.state)
            ) {
                setSelectedCity(defaultCity);
            }
        }
    }, [appConfig?.collegeInfo?.location?.city, appConfig?.collegeInfo?.location?.state]);

    useEffect(() => {
        fetchWeather();
        const interval = setInterval(fetchWeather, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, [selectedCity]);

    const handleCityChange = (city: City) => {
        setSelectedCity(city);
        localStorage.setItem('selectedCity', JSON.stringify(city));
        fetchWeather(city);
        setCitySearchOpen(false);
        setCitySearchQuery('');
    };

    const filteredCities = useMemo(() => {
        if (!citySearchQuery.trim()) return cities;
        const query = citySearchQuery.toLowerCase();
        return cities.filter(
            (city) => city.name.toLowerCase().includes(query) || city.state.toLowerCase().includes(query)
        );
    }, [citySearchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setCitySearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Calculate style for saved position
    const savedPositionStyle = widgetPosition.x !== 0 || widgetPosition.y !== 0
        ? { left: widgetPosition.x, top: widgetPosition.y, right: 'auto' }
        : {};

    if (!weather && weatherLoading) {
        return (
            <div
                className="fixed top-20 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg transition-all duration-300"
                style={savedPositionStyle}
            >
                <div className="w-5 h-5 border-2 border-t-transparent border-sky-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (weatherError) {
        return (
            <button
                onClick={() => fetchWeather()}
                className="fixed top-20 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 shadow-lg text-red-500 hover:scale-110 transition-all duration-300"
                title={weatherError}
                style={savedPositionStyle}
            >
                <span className="text-xl">⚠️</span>
            </button>
        );
    }

    if (!weather) return null;

    return (
        <>
            {/* Drag constraint wrapper - covers entire viewport */}
            <div ref={constraintRef} className="fixed inset-0 pointer-events-none z-30" />

            <motion.button
                id="weather-widget"
                drag
                dragMomentum={false}
                dragConstraints={constraintRef}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                initial={widgetPosition.x !== 0 || widgetPosition.y !== 0
                    ? { x: widgetPosition.x - (typeof window !== 'undefined' ? window.innerWidth - 24 - 48 : 0), y: widgetPosition.y - 80 }
                    : false
                }
                onClick={handleClick}
                className={`fixed top-20 right-6 z-40 flex items-center gap-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-grab active:cursor-grabbing ${isSidebarExpanded ? 'lg:p-2 lg:px-2' : 'px-4 py-3'}`}
                title="Drag to reposition • Click to view weather"
                whileDrag={{ scale: 1.1, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <div className="flex items-center gap-1.5">
                    <span className={`transition-all duration-300 ${isSidebarExpanded ? 'lg:text-lg text-xl' : 'text-xl'}`}>{weather.icon}</span>
                    <span className={`font-bold bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-200 dark:to-slate-300 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-cyan-600 dark:group-hover:from-blue-400 dark:group-hover:to-cyan-400 transition-all duration-300 ${isSidebarExpanded ? 'lg:hidden' : 'text-md'}`}>
                        {weather.temp}°
                    </span>
                </div>
            </motion.button>

            {showWeatherModal && detailedWeather && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowWeatherModal(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/40 dark:to-blue-900/40 backdrop-blur-sm border-b border-sky-200 dark:border-sky-700 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-4">
                                    <div className="text-6xl drop-shadow-lg">{detailedWeather.icon}</div>
                                    <div>
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                                            {detailedWeather.temp}°C
                                        </h2>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium">
                                            {detailedWeather.desc}
                                        </p>
                                        {weatherLoading ? (
                                            <span className="text-xs text-slate-500 animate-pulse">Updating...</span>
                                        ) : (
                                            <button onClick={() => fetchWeather()} className="text-sm text-slate-500 dark:text-slate-500 flex items-center gap-1 mt-1 hover:text-sky-600 transition-colors">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                {selectedCity.name}, {selectedCity.state} (Refresh)
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowWeatherModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* City Selector Dropdown with Search */}
                            <div
                                className="mt-4 relative"
                                ref={cityDropdownRef}
                            >
                                <div className="relative group/dropdown max-w-sm">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-transform group-hover/dropdown:scale-110 duration-200">
                                        <svg
                                            className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover/dropdown:text-sky-700 dark:group-hover/dropdown:text-sky-300 transition-colors drop-shadow-sm"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>

                                    <input
                                        type="text"
                                        value={citySearchOpen ? citySearchQuery : selectedCity.name}
                                        onChange={(e) => {
                                            setCitySearchQuery(e.target.value);
                                            setCitySearchOpen(true);
                                        }}
                                        onFocus={() => setCitySearchOpen(true)}
                                        placeholder="Search city..."
                                        className={`w-full pl-9 pr-9 py-2.5 text-xs font-bold backdrop-blur-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${citySearchOpen
                                            ? 'bg-white dark:bg-slate-800 border-sky-300/40 dark:border-sky-600/40 text-sky-800 dark:text-sky-100 hover:border-sky-400/60 dark:hover:border-sky-500/60'
                                            : 'bg-transparent border-sky-300/30 dark:border-sky-600/30 text-sky-700 dark:text-sky-200 hover:border-sky-400/50 dark:hover:border-sky-500/50'
                                            }`}
                                    />

                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg
                                            className={`w-4 h-4 text-sky-600 dark:text-sky-400 transition-transform duration-200 ${citySearchOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 8l4 4 4-4"
                                            />
                                        </svg>
                                    </div>

                                    {citySearchOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-sky-200 dark:border-sky-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-50">
                                            {filteredCities.length > 0 ? (
                                                filteredCities.map((city) => (
                                                    <button
                                                        key={`${city.name}-${city.state}`}
                                                        onClick={() => handleCityChange(city)}
                                                        className={`w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 dark:hover:bg-sky-900/30 transition-colors ${selectedCity.name === city.name && selectedCity.state === city.state
                                                            ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-800 dark:text-sky-200 font-bold'
                                                            : 'text-slate-700 dark:text-slate-300 font-medium'
                                                            }`}
                                                    >
                                                        <span className="block">{city.name}</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            {city.state}
                                                        </span>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                                                    No cities found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Modal Content */}
                        <div className="p-6 space-y-6">
                            {/* Feels Like Temperature */}
                            <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-4 rounded-xl border border-orange-200 dark:border-orange-700/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">🌡️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Feels Like
                                            </p>
                                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                                {detailedWeather.feelsLike.toFixed(1)}°C
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Weather Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">💧</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Humidity
                                            </p>
                                            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                                {detailedWeather.humidity}%
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">☀️</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                UV Index
                                            </p>
                                            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {detailedWeather.uvIndex.toFixed(0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">💨</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Wind
                                            </p>
                                            <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
                                                {detailedWeather.windSpeed} km/h
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-sky-200 dark:border-sky-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">☔</div>
                                        <div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                Precipitation
                                            </p>
                                            <p className="text-xl font-bold text-sky-600 dark:text-sky-400">
                                                {detailedWeather.precipitation} mm
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-sky-300/50 dark:border-sky-700/50">
                                {recommendationLoading ? (
                                    <div className="animate-pulse flex space-x-3">
                                        <div className="text-base font-medium text-sky-700 dark:text-sky-300">✨</div>
                                        <div className="flex-1 space-y-3 py-1">
                                            <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded"></div>
                                            <div className="h-3 bg-sky-200/50 dark:bg-sky-700/50 rounded w-5/6"></div>
                                        </div>
                                    </div>
                                ) : recommendationError ? (
                                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <span>⚠️</span> {recommendationError}
                                    </p>
                                ) : (
                                    recommendation && (
                                        <div className="bg-sky-100/50 dark:bg-sky-900/30 rounded-xl p-3">
                                            <h4 className="text-sm font-semibold text-sky-800 dark:text-sky-200 mb-2 flex items-center gap-2">
                                                <span className="text-base">✨</span>
                                                <span>Weather Advice</span>
                                            </h4>
                                            <p className="text-sm text-sky-700 dark:text-sky-300 whitespace-pre-line leading-relaxed">
                                                {recommendation}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setShowWeatherModal(false)}
                                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg transition-colors font-medium text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default WeatherWidget;
