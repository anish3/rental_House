import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  Map as MapIcon,
  MapPin,
  Sparkles,
  ShieldCheck,
  Check,
  Building,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Send,
  Calendar,
} from 'lucide-react';
import { Property, RentalListing } from '../../types/client.ts';
import { api } from '../../lib/api.ts';
import { useApp } from '../../context/AppContext.tsx';
import { PropertyPostCard } from '../feed/PropertyPostCard.tsx';

export const FindPropertyView: React.FC = () => {
  const { openPropertyProfile, openChatWith, openScheduleVisit } = useApp();

  const [properties, setProperties] = useState<Property[]>([]);
  const [activeListings, setActiveListings] = useState<RentalListing[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [maxBudget, setMaxBudget] = useState<number>(25000);
  const [selectedGender, setSelectedGender] = useState<string>('ANY');
  const [noBrokerageOnly, setNoBrokerageOnly] = useState<boolean>(false);
  const [filterAmenity, setFilterAmenity] = useState<string[]>([]);
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);
  const [selectedMapPin, setSelectedMapPin] = useState<Property | null>(null);

  const indoreAreas = ['Vijay Nagar', 'Scheme 54', 'Scheme 140', 'Bhawarkua', 'Palasia', 'Rau', 'Bengali Square'];
  const propertyTypes = ['PG', 'FLAT', 'COLIVING', 'APARTMENT', 'ROOM', 'HOSTEL'];
  const commonAmenities = ['WiFi', 'Food', 'AC', 'Attached Bath', 'Parking', 'Power Backup'];

  const loadData = async () => {
    setLoading(true);
    try {
      const [propData, listingData] = await Promise.all([
        api.getProperties(),
        api.getListings({ status: 'ACTIVE' }),
      ]);
      setProperties(propData.properties);
      setActiveListings(listingData.listings);
      if (propData.properties.length > 0) {
        setSelectedMapPin(propData.properties[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter logic
  const filteredProperties = properties.filter((p) => {
    if (selectedType !== 'ALL' && p.propertyType !== selectedType) return false;
    if (selectedArea !== 'ALL' && !p.area.toLowerCase().includes(selectedArea.toLowerCase()))
      return false;
    if (p.minRent > maxBudget) return false;
    if (selectedGender !== 'ANY' && p.genderPreference !== selectedGender && p.genderPreference !== 'ANY')
      return false;
    if (noBrokerageOnly && !p.noBrokerage) return false;
    if (
      filterAmenity.length > 0 &&
      !filterAmenity.every((am) => p.amenities.some((a) => a.toLowerCase() === am.toLowerCase()))
    )
      return false;
    return true;
  });

  const toggleAmenity = (am: string) => {
    setFilterAmenity((prev) =>
      prev.includes(am) ? prev.filter((a) => a !== am) : [...prev, am]
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-24">
      {/* Search Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Find Rental Homes & PGs</span>
              <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                Indore
              </span>
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Browse verified PG rooms, flats, co-living suites with 10-day active guarantees.
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'grid' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'list' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-xl transition-all ${
                viewMode === 'map' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
              title="Indore Map View"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filter Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Property Type Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedType('ALL')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedType === 'ALL'
                  ? 'bg-rose-500 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            {propertyTypes.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedType === t
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Area filter */}
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Areas (Indore)</option>
            {indoreAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          {/* Gender */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-200 focus:outline-none"
          >
            <option value="ANY">Gender: Any</option>
            <option value="BOYS">Boys Only</option>
            <option value="GIRLS">Girls Only</option>
            <option value="FAMILY">Family</option>
          </select>

          {/* No Brokerage */}
          <button
            onClick={() => setNoBrokerageOnly(!noBrokerageOnly)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
              noBrokerageOnly
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            {noBrokerageOnly ? '✓ Zero Brokerage' : 'Zero Brokerage'}
          </button>

          {/* Advanced budget filter modal toggle */}
          <button
            onClick={() => setShowFiltersModal(!showFiltersModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Budget ≤ ₹{maxBudget.toLocaleString('en-IN')}</span>
          </button>
        </div>

        {/* Collapsible Filter Slider Drawer */}
        {showFiltersModal && (
          <div className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-4 animate-in fade-in">
            <div>
              <div className="flex justify-between text-xs font-bold text-zinc-300 mb-1.5">
                <span>Maximum Rent Budget</span>
                <span className="text-emerald-400">₹{maxBudget.toLocaleString('en-IN')} / month</span>
              </div>
              <input
                type="range"
                min="5000"
                max="35000"
                step="1000"
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-zinc-300 mb-2">Amenities Required:</p>
              <div className="flex flex-wrap gap-2">
                {commonAmenities.map((am) => (
                  <button
                    key={am}
                    onClick={() => toggleAmenity(am)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-colors ${
                      filterAmenity.includes(am)
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    {am}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MAP VIEW */}
      {viewMode === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Simulated Interactive Vector Map Canvas */}
          <div className="lg:col-span-2 h-[450px] bg-zinc-900 rounded-3xl border border-zinc-800 relative overflow-hidden p-6 flex flex-col justify-between shadow-2xl">
            {/* Grid overlay & road sketch */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#3f3f46_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 flex justify-between items-start">
              <div className="bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Indore Rental Map (Real-time Pins)</span>
              </div>
            </div>

            {/* Interactive Pins representing Indore hubs */}
            <div className="relative z-10 h-full flex items-center justify-around flex-wrap gap-6 py-6">
              {filteredProperties.map((p, idx) => {
                const isSelected = selectedMapPin?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedMapPin(p)}
                    className={`group transition-transform active:scale-95 flex flex-col items-center ${
                      isSelected ? 'scale-110 z-20' : 'hover:scale-105'
                    }`}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-full font-black text-xs shadow-xl flex items-center gap-1 transition-colors ${
                        isSelected
                          ? 'bg-rose-500 text-white ring-4 ring-rose-500/30'
                          : 'bg-zinc-950 text-white border border-zinc-700 hover:border-rose-500'
                      }`}
                    >
                      <span>₹{Math.round(p.minRent / 1000)}k</span>
                    </div>
                    <span className="text-[10px] font-bold text-zinc-300 mt-1 bg-zinc-950/70 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {p.area}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="relative z-10 text-[11px] text-zinc-500 text-center">
              Click any pin to inspect verified property details & schedule walkthrough
            </p>
          </div>

          {/* Selected Pin Details Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between">
            {selectedMapPin ? (
              <div>
                <div className="relative aspect-16/10 rounded-2xl overflow-hidden mb-3">
                  <img
                    src={selectedMapPin.coverPhoto}
                    alt={selectedMapPin.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {selectedMapPin.propertyType}
                  </div>
                </div>

                <h3 className="font-bold text-base text-white">{selectedMapPin.title}</h3>
                <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedMapPin.area}, Indore
                </p>
                <div className="text-lg font-black text-white mt-2">
                  ₹{selectedMapPin.minRent.toLocaleString('en-IN')} - ₹
                  {selectedMapPin.maxRent.toLocaleString('en-IN')}{' '}
                  <span className="text-xs text-zinc-400 font-normal">/mo</span>
                </div>

                <p className="text-xs text-zinc-400 mt-2 line-clamp-3">
                  {selectedMapPin.description}
                </p>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openPropertyProfile(selectedMapPin.id)}
                    className="flex-1 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs hover:bg-rose-600"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() =>
                      openScheduleVisit(
                        selectedMapPin.id,
                        selectedMapPin.title,
                        selectedMapPin.ownerId
                      )
                    }
                    className="py-2 px-3 rounded-xl bg-zinc-800 text-white font-bold text-xs"
                  >
                    Visit
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500 text-xs">
                Select a pin on the map
              </div>
            )}
          </div>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
            >
              <div>
                <div
                  onClick={() => openPropertyProfile(p.id)}
                  className="relative aspect-16/10 overflow-hidden cursor-pointer bg-zinc-950"
                >
                  <img
                    src={p.coverPhoto}
                    alt={p.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute bottom-2 left-2 bg-zinc-950/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-black text-white">
                    ₹{p.minRent.toLocaleString('en-IN')} - ₹{p.maxRent.toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-zinc-400">/mo</span>
                  </div>
                  <div className="absolute top-2 right-2 bg-rose-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {p.propertyType}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                    <span className="flex items-center gap-1 text-rose-400 font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      {p.area}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {p.availableRooms} rooms open
                    </span>
                  </div>

                  <h3
                    onClick={() => openPropertyProfile(p.id)}
                    className="font-bold text-sm text-zinc-100 group-hover:text-rose-400 cursor-pointer line-clamp-1"
                  >
                    {p.title}
                  </h3>

                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {p.amenities.slice(0, 4).map((am, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex gap-2">
                <button
                  onClick={() => openPropertyProfile(p.id)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                >
                  View Profile
                </button>
                <button
                  onClick={() =>
                    openChatWith(p.ownerId, {
                      type: 'PROPERTY',
                      id: p.id,
                      title: p.title,
                      subtitle: `${p.area} • ₹${p.minRent}/mo`,
                      price: p.minRent,
                      imageUrl: p.coverPhoto,
                    })
                  }
                  className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors"
                  title="Message Host"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredProperties.map((p) => (
            <div
              key={p.id}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img
                  src={p.coverPhoto}
                  alt={p.title}
                  className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 cursor-pointer"
                  onClick={() => openPropertyProfile(p.id)}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                      {p.propertyType}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {p.area}, Indore
                    </span>
                  </div>
                  <h3
                    onClick={() => openPropertyProfile(p.id)}
                    className="font-bold text-base text-white hover:text-rose-400 cursor-pointer mt-1"
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm font-extrabold text-emerald-400 mt-1">
                    ₹{p.minRent.toLocaleString('en-IN')} - ₹{p.maxRent.toLocaleString('en-IN')}{' '}
                    <span className="text-xs font-normal text-zinc-400">/mo</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => openPropertyProfile(p.id)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
                >
                  View Unit
                </button>
                <button
                  onClick={() =>
                    openChatWith(p.ownerId, {
                      type: 'PROPERTY',
                      id: p.id,
                      title: p.title,
                      price: p.minRent,
                      imageUrl: p.coverPhoto,
                    })
                  }
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl"
                >
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProperties.length === 0 && !loading && (
        <div className="py-20 text-center">
          <Building className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
          <p className="text-zinc-300 font-bold">No properties match your exact filters</p>
          <p className="text-xs text-zinc-500 mt-1">Try resetting the budget or area filter</p>
        </div>
      )}
    </div>
  );
};
