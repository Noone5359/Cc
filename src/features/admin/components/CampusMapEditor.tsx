import { useAdminConfig } from '@features/admin/hooks/useAdminConfig';
import {
  Search,
  Plus,
  Trash2,
  MapPin,
  Edit2,
  X,
  Save,
  Navigation,
  Link,
  Locate,
  ExternalLink,
  Check,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { AdminConfig } from '../types';
import { CampusLocation, CampusLocationCategory, QuickRoute } from '../types';
import { AdminHeader, MapPinIcon } from './AdminIcons';
import AdminPageLayout from './AdminPageLayout';

interface Props {
  config: AdminConfig;
}

const CATEGORIES: CampusLocationCategory[] = [
  'academic',
  'residential',
  'facilities',
  'dining',
  'administration',
];

// Common location emoji icons for quick selection
const LOCATION_ICONS = [
  { emoji: '🏛️', label: 'Academic' },
  { emoji: '🏢', label: 'Office' },
  { emoji: '🏠', label: 'Residential' },
  { emoji: '🍽️', label: 'Dining' },
  { emoji: '☕', label: 'Cafe' },
  { emoji: '📚', label: 'Library' },
  { emoji: '🔬', label: 'Lab' },
  { emoji: '🏥', label: 'Medical' },
  { emoji: '🏟️', label: 'Sports' },
  { emoji: '🎭', label: 'Auditorium' },
  { emoji: '🏪', label: 'Shop' },
  { emoji: '🚌', label: 'Transport' },
  { emoji: '🅿️', label: 'Parking' },
  { emoji: '🏦', label: 'Bank/ATM' },
  { emoji: '⛪', label: 'Temple' },
  { emoji: '🌳', label: 'Garden' },
  { emoji: '📍', label: 'General' },
  { emoji: '🎓', label: 'Convocation' },
];

type Tab = 'locations' | 'routes';

const CampusMapEditor: React.FC<Props> = ({ config }) => {
  const { saveSection } = useAdminConfig();
  const [activeTab, setActiveTab] = useState<Tab>('locations');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Handle responsive items per page
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(10);
      } else {
        setItemsPerPage(20);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Google Maps link parsing state
  const [mapsLink, setMapsLink] = useState('');
  const [linkError, setLinkError] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Current location loading state
  const [gettingLocation, setGettingLocation] = useState(false);

  // Icon picker state
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Location Form state
  const [locationForm, setLocationForm] = useState<Partial<CampusLocation>>({
    name: '',
    category: 'academic',
    coordinates: { lat: 23.814, lng: 86.441 },
    description: '',
    icon: '📍',
    details: {},
  });

  // Parse coordinates from Google Maps link
  const parseGoogleMapsLink = (link: string): { lat: number; lng: number } | null => {
    try {
      // Handle different Google Maps URL formats
      // Priority order matters - we want the actual place location, not the viewport

      // PRIORITY 1: Place data coordinates (actual pin location)
      // Format: !3d23.816009!4d86.4422404 (3d = lat, 4d = lng)
      // This is the actual marker position, not the viewport
      const placeDataPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
      const placeDataMatch = link.match(placeDataPattern);
      if (placeDataMatch && placeDataMatch[1] && placeDataMatch[2]) {
        return { lat: parseFloat(placeDataMatch[1]), lng: parseFloat(placeDataMatch[2]) };
      }

      // PRIORITY 2: Query parameter with coordinates
      // Format: ?q=23.814333,86.441225
      const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const qMatch = link.match(qPattern);
      if (qMatch && qMatch[1] && qMatch[2]) {
        return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
      }

      // PRIORITY 3: ll parameter
      // Format: ?ll=23.814333,86.441225
      const llPattern = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const llMatch = link.match(llPattern);
      if (llMatch && llMatch[1] && llMatch[2]) {
        return { lat: parseFloat(llMatch[1]), lng: parseFloat(llMatch[2]) };
      }

      // PRIORITY 4: place/ direct coordinates
      // Format: /place/23.814333,86.441225
      const placeCoordsPattern = /place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const placeCoordsMatch = link.match(placeCoordsPattern);
      if (placeCoordsMatch && placeCoordsMatch[1] && placeCoordsMatch[2]) {
        return { lat: parseFloat(placeCoordsMatch[1]), lng: parseFloat(placeCoordsMatch[2]) };
      }

      // PRIORITY 5 (FALLBACK): @ viewport coordinates
      // Format: @23.8156784,86.4394229,1093m
      // This is the camera center, less precise but better than nothing
      const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
      const atMatch = link.match(atPattern);
      if (atMatch && atMatch[1] && atMatch[2]) {
        return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleParseMapsLink = () => {
    setLinkError('');
    setLinkSuccess(false);

    if (!mapsLink.trim()) {
      setLinkError('Please paste a Google Maps link');
      return;
    }

    const coords = parseGoogleMapsLink(mapsLink);
    if (coords) {
      setLocationForm({ ...locationForm, coordinates: coords });
      setLinkSuccess(true);
      setMapsLink('');
      setTimeout(() => setLinkSuccess(false), 3000);
    } else {
      setLinkError('Could not extract coordinates. Try copying the full URL from Google Maps.');
    }
  };

  // Get current location using browser geolocation
  const handleGetCurrentLocation = () => {
    // Check if running in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setLinkError(
        'Location requires HTTPS. Use the Google Maps link method instead, or access via localhost.'
      );
      return;
    }

    if (!navigator.geolocation) {
      setLinkError(
        'Geolocation is not supported by your browser. Try using a Google Maps link instead.'
      );
      return;
    }

    setGettingLocation(true);
    setLinkError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationForm({
          ...locationForm,
          coordinates: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        });
        setGettingLocation(false);
        setLinkError(''); // Clear any previous error
        setLinkSuccess(true);
        setTimeout(() => setLinkSuccess(false), 3000);
      },
      (error) => {
        setGettingLocation(false);
        console.error('Geolocation error:', error.code, error.message);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLinkError(
              'Location access denied. Please allow location access in your browser settings, then try again.'
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLinkError(
              'Location unavailable. Your device may not have GPS, or location services are disabled.'
            );
            break;
          case error.TIMEOUT:
            setLinkError(
              'Location request timed out. Try again or use a Google Maps link instead.'
            );
            break;
          default:
            setLinkError(
              `Location error: ${error.message || 'Unknown error'}. Try using a Google Maps link instead.`
            );
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  // Open location in Google Maps for verification
  const openInGoogleMaps = () => {
    const { lat, lng } = locationForm.coordinates || { lat: 23.814, lng: 86.441 };
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  // Route Form state
  const [routeForm, setRouteForm] = useState<Partial<QuickRoute>>({
    from: '',
    to: '',
    time: '',
    distance: '',
    steps: [],
  });
  const [stepsInput, setStepsInput] = useState('');

  const filteredLocations = (config.campusMap || []).filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoutes = (config.quickRoutes || []).filter(
    (route) =>
      route.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalLocationPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const totalRoutePages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const totalPages = activeTab === 'locations' ? totalLocationPages : totalRoutePages;

  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetForm = () => {
    setLocationForm({
      name: '',
      category: 'academic',
      coordinates: { lat: 23.814, lng: 86.441 },
      description: '',
      icon: '📍',
      details: {},
    });
    setRouteForm({
      from: '',
      to: '',
      time: '',
      distance: '',
      steps: [],
    });
    setStepsInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEditLocation = (loc: CampusLocation) => {
    setLocationForm(loc);
    setEditingId(loc.id);
    setIsAdding(true);
  };

  const handleEditRoute = (route: QuickRoute) => {
    setRouteForm(route);
    setStepsInput(route.steps?.join('\n') || '');
    setEditingId(route.id);
    setIsAdding(true);
  };

  const handleDeleteLocation = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this location?')) {
      const updatedLocations = config.campusMap.filter((l) => l.id !== id);
      await saveSection('campusMap', updatedLocations);
    }
  };

  const handleDeleteRoute = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this route?')) {
      const updatedRoutes = config.quickRoutes.filter((r) => r.id !== id);
      await saveSection('quickRoutes', updatedRoutes);
    }
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationForm.name || !locationForm.coordinates) return;

    const newLocation: CampusLocation = {
      id: editingId || `loc-${Date.now()}`,
      name: locationForm.name!,
      category: locationForm.category as CampusLocationCategory,
      coordinates: {
        lat: Number(locationForm.coordinates.lat),
        lng: Number(locationForm.coordinates.lng),
      },
      description: locationForm.description || '',
      icon: locationForm.icon || '📍',
      details: locationForm.details,
    };

    let updatedLocations: CampusLocation[];
    if (editingId) {
      updatedLocations = config.campusMap.map((l) => (l.id === editingId ? newLocation : l));
    } else {
      updatedLocations = [...(config.campusMap || []), newLocation];
    }

    await saveSection('campusMap', updatedLocations);
    resetForm();
  };

  const handleSubmitRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.from || !routeForm.to) return;

    const newRoute: QuickRoute = {
      id: editingId || `route-${Date.now()}`,
      from: routeForm.from!,
      to: routeForm.to!,
      time: routeForm.time || '',
      distance: routeForm.distance || '',
      steps: stepsInput.split('\n').filter((s) => s.trim()),
    };

    let updatedRoutes: QuickRoute[];
    if (editingId) {
      updatedRoutes = config.quickRoutes.map((r) => (r.id === editingId ? newRoute : r));
    } else {
      updatedRoutes = [...(config.quickRoutes || []), newRoute];
    }

    await saveSection('quickRoutes', updatedRoutes);
    resetForm();
  };

  return (
    <AdminPageLayout>
      {/* Header */}
      <AdminHeader
        icon={<MapPinIcon />}
        title="Campus Map"
        subtitle="Manage locations and navigation routes"
      >
        <div className="flex bg-slate-800/50 rounded-lg p-1 border border-blue-500/20">
          <button
            onClick={() => {
              setActiveTab('locations');
              resetForm();
              setCurrentPage(1);
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'locations'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => {
              setActiveTab('routes');
              resetForm();
              setCurrentPage(1);
            }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeTab === 'routes'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Routes
          </button>
        </div>
      </AdminHeader>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 admin-card">
        <div className="admin-search flex-1">
          <Search className="admin-search-icon" size={20} />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'locations' ? 'locations' : 'routes'}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="admin-input"
            style={{ paddingLeft: '48px' }}
          />
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="admin-btn admin-btn-primary w-full sm:w-auto justify-center text-xs sm:text-sm"
        >
          <Plus size={18} />
          Add {activeTab === 'locations' ? 'Location' : 'Route'}
        </button>
      </div>

      {/* Add/Edit Form */}
      {isAdding && (
        <div className="admin-card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">
              {editingId
                ? `Edit ${activeTab === 'locations' ? 'Location' : 'Route'}`
                : `New ${activeTab === 'locations' ? 'Location' : 'Route'}`}
            </h3>
            <button
              onClick={resetForm}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {activeTab === 'locations' ? (
            <form onSubmit={handleSubmitLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Name</label>
                  <input
                    type="text"
                    value={locationForm.name}
                    onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">Category</label>
                  <select
                    value={locationForm.category}
                    onChange={(e) =>
                      setLocationForm({
                        ...locationForm,
                        category: e.target.value as CampusLocationCategory,
                      })
                    }
                    className="admin-select"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Convenient Coordinate Input Section */}
              <div className="bg-slate-800/30 border border-blue-500/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-blue-400" />
                  <span className="text-sm font-medium text-white">Get Coordinates</span>
                  <span className="text-xs text-slate-400">— Choose your preferred method</span>
                </div>

                {/* Method 1: Google Maps Link */}
                <div className="space-y-2">
                  <label className="admin-label flex items-center gap-2">
                    <Link size={14} className="text-slate-400" />
                    From Google Maps Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste a Google Maps URL here..."
                      value={mapsLink}
                      onChange={(e) => {
                        setMapsLink(e.target.value);
                        setLinkError('');
                      }}
                      className="admin-input flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleParseMapsLink}
                      className="admin-btn admin-btn-secondary whitespace-nowrap text-xs"
                    >
                      <Check size={14} />
                      Extract
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Open Google Maps → Right-click on location → "What's here?" → Copy the URL
                  </p>
                </div>

                {/* Method 2: Current Location */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Or</span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={gettingLocation}
                    className="admin-btn admin-btn-secondary text-xs flex items-center gap-2"
                  >
                    <Locate size={14} className={gettingLocation ? 'animate-pulse' : ''} />
                    {gettingLocation ? 'Getting Location...' : 'Use My Current Location'}
                  </button>
                </div>

                {/* Success/Error Messages */}
                {linkError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <X size={14} />
                    {linkError}
                  </div>
                )}
                {linkSuccess && (
                  <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                    <Check size={14} />
                    Coordinates extracted successfully!
                  </div>
                )}

                {/* Manual Coordinate Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-700/50">
                  <div>
                    <label className="admin-label">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.coordinates?.lat}
                      onChange={(e) =>
                        setLocationForm({
                          ...locationForm,
                          coordinates: {
                            ...locationForm.coordinates!,
                            lat: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="admin-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="admin-label">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={locationForm.coordinates?.lng}
                      onChange={(e) =>
                        setLocationForm({
                          ...locationForm,
                          coordinates: {
                            ...locationForm.coordinates!,
                            lng: parseFloat(e.target.value),
                          },
                        })
                      }
                      className="admin-input"
                      required
                    />
                  </div>
                </div>

                {/* Verify Location Button */}
                <button
                  type="button"
                  onClick={openInGoogleMaps}
                  className="admin-btn admin-btn-secondary w-full text-xs justify-center"
                >
                  <ExternalLink size={14} />
                  Verify Location in Google Maps
                </button>
              </div>

              <div>
                <label className="admin-label">Description</label>
                <textarea
                  value={locationForm.description}
                  onChange={(e) =>
                    setLocationForm({ ...locationForm, description: e.target.value })
                  }
                  className="admin-input"
                  rows={2}
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="admin-label">Icon</label>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-slate-700/50 rounded-xl border border-blue-500/30 text-2xl">
                    {locationForm.icon}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="admin-btn admin-btn-secondary text-xs"
                  >
                    {showIconPicker ? 'Hide Icons' : 'Choose Icon'}
                  </button>
                  <input
                    type="text"
                    value={locationForm.icon}
                    onChange={(e) => setLocationForm({ ...locationForm, icon: e.target.value })}
                    className="admin-input w-20 text-center text-lg"
                    placeholder="📍"
                  />
                </div>

                {showIconPicker && (
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-2 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    {LOCATION_ICONS.map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setLocationForm({ ...locationForm, icon: emoji });
                          setShowIconPicker(false);
                        }}
                        className={`p-2 rounded-lg text-xl hover:bg-blue-500/20 hover:scale-110 transition-all ${locationForm.icon === emoji ? 'bg-blue-500/30 ring-2 ring-blue-500' : 'bg-slate-700/30'}`}
                        title={label}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Save size={18} />
                  {editingId ? 'Update Location' : 'Save Location'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitRoute} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">From</label>
                  <input
                    type="text"
                    value={routeForm.from}
                    onChange={(e) => setRouteForm({ ...routeForm, from: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
                <div>
                  <label className="admin-label">To</label>
                  <input
                    type="text"
                    value={routeForm.to}
                    onChange={(e) => setRouteForm({ ...routeForm, to: e.target.value })}
                    className="admin-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="admin-label">Time Estimate</label>
                  <input
                    type="text"
                    placeholder="e.g., 5 min walk"
                    value={routeForm.time}
                    onChange={(e) => setRouteForm({ ...routeForm, time: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="admin-label">Distance</label>
                  <input
                    type="text"
                    placeholder="e.g., 350m"
                    value={routeForm.distance}
                    onChange={(e) => setRouteForm({ ...routeForm, distance: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>

              <div>
                <label className="admin-label">Steps (One per line)</label>
                <textarea
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="admin-input"
                  rows={5}
                  placeholder="Exit Main Building&#10;Walk towards dining area&#10;Barista on left"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={resetForm} className="admin-btn admin-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">
                  <Save size={18} />
                  {editingId ? 'Update Route' : 'Save Route'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Locations Grid */}
      {activeTab === 'locations' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {paginatedLocations.map((location) => (
            <div key={location.id} className="admin-card hover:border-blue-500/40 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <span className="text-xl sm:text-2xl flex-shrink-0" role="img" aria-label="icon">
                    {location.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                      {location.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        location.category === 'academic'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : location.category === 'residential'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : location.category === 'facilities'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : location.category === 'dining'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                      }`}
                    >
                      {location.category.charAt(0).toUpperCase() + location.category.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleEditLocation(location)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteLocation(location.id)}
                    className="p-1.5 sm:p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} className="sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 line-clamp-2 mb-3">
                {location.description}
              </p>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin size={12} />
                <span className="truncate">
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </span>
              </div>
            </div>
          ))}
          {filteredLocations.length === 0 && (
            <div className="col-span-full text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              No locations found.
            </div>
          )}
        </div>
      ) : (
        /* Routes List */
        <div className="space-y-3">
          {paginatedRoutes.map((route) => (
            <div
              key={route.id}
              className="admin-card flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-2 sm:p-3 rounded-xl text-blue-400 border border-blue-500/20 flex-shrink-0">
                  <Navigation size={18} className="sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {route.from}
                    </span>
                    <span className="text-blue-400">→</span>
                    <span className="font-semibold text-white text-sm sm:text-base">
                      {route.to}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                    <span>{route.time}</span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span>{route.distance}</span>
                    <span className="text-slate-600 hidden sm:inline">•</span>
                    <span>{route.steps?.length || 0} steps</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 self-end sm:self-center flex-shrink-0">
                <button
                  onClick={() => handleEditRoute(route)}
                  className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteRoute(route.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filteredRoutes.length === 0 && (
            <div className="text-center py-8 sm:py-12 text-slate-500 text-sm sm:text-base">
              No routes found.
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="admin-card">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{' '}
              {Math.min(
                currentPage * itemsPerPage,
                activeTab === 'locations' ? filteredLocations.length : filteredRoutes.length
              )}{' '}
              of {activeTab === 'locations' ? filteredLocations.length : filteredRoutes.length}{' '}
              {activeTab}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="flex items-center px-3 text-sm text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="admin-btn admin-btn-secondary text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
};

export default CampusMapEditor;
