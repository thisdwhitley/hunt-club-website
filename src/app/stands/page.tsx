'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useStands } from '@/hooks/useStands';
import { standUtils, type GPXWaypoint } from '@/lib/utils/standUtils';
import type { Stand, StandInsert, StandUpdate, HuntingSeason, StandCondition } from '@/lib/types/database';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  MapPin, 
  Eye, 
  Filter,
  Search,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Ruler,
  Wind,
  TreePine,
  Camera,
  Droplet,
  Calendar,
  TrendingUp,
  Settings,
  X,
  Save,
  ArrowLeft,
  Map,
  Info,
  Upload,
  Download,
  Database,
  FileText,
  Zap,
  Crosshair,
  Activity,
  RefreshCw,
  Terminal,
  Code,
  Trash,
  Loader
} from 'lucide-react';

export default function StandsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<boolean | null>(null);
  const [filterCondition, setFilterCondition] = useState<StandCondition | 'all'>('all');
  const [filterSeason, setFilterSeason] = useState<HuntingSeason | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [showGPXImport, setShowGPXImport] = useState(false);
  const [showDBUtils, setShowDBUtils] = useState(false);
  const [editingStand, setEditingStand] = useState<Stand | null>(null);
  const [selectedStand, setSelectedStand] = useState<Stand | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Use the stands hook with filters
  const { 
    stands, 
    loading, 
    error, 
    stats, 
    refetch,
    createStand,
    updateStand,
    deleteStand,
    createMultipleStands
  } = useStands({
    active: filterActive || undefined,
    condition: filterCondition === 'all' ? undefined : filterCondition,
    search: searchTerm || undefined,
    huntingSeason: filterSeason === 'all' ? undefined : filterSeason
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-morning-mist flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-olive-green rounded-lg flex items-center justify-center mx-auto mb-4">
            <Target size={24} className="text-white" />
          </div>
          <Loader className="animate-spin h-8 w-8 text-olive-green mx-auto mb-2" />
          <p className="text-weathered-wood">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getConditionIcon = (condition?: StandCondition | null) => {
    const info = standUtils.getConditionInfo(condition);
    switch (condition) {
      case 'excellent': return <CheckCircle className={info.color} size={16} />;
      case 'good': return <CheckCircle className={info.color} size={16} />;
      case 'fair': return <Clock className={info.color} size={16} />;
      case 'needs_repair': return <AlertTriangle className={info.color} size={16} />;
      case 'unsafe': return <AlertTriangle className={info.color} size={16} />;
      default: return <Info className="text-weathered-wood" size={16} />;
    }
  };

  const getStandStyleIcon = (style?: string | null) => {
    switch (style) {
      case 'tree_stand': return <TreePine className="text-olive-green" size={16} />;
      case 'ladder_stand': return <Ruler className="text-olive-green" size={16} />;
      case 'ground_blind': return <Target className="text-olive-green" size={16} />;
      default: return <MapPin className="text-olive-green" size={16} />;
    }
  };

  const getSeasonIcon = (season?: HuntingSeason | null) => {
    switch (season) {
      case 'archery': return <Target className="text-olive-green" size={14} />;
      case 'blackpowder': return <Zap className="text-clay-earth" size={14} />;
      case 'gun': return <Crosshair className="text-forest-shadow" size={14} />;
      default: return <Calendar className="text-weathered-wood" size={14} />;
    }
  };

  const StandCard = ({ stand }: { stand: Stand }) => (
    <div className="bg-white rounded-lg shadow-md border border-morning-mist p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getStandStyleIcon(stand.stand_style)}
          <h3 className="font-semibold text-forest-shadow">{stand.name}</h3>
          {!stand.active && (
            <span className="px-2 py-1 bg-clay-earth/20 text-clay-earth text-xs rounded-full">
              Inactive
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {getConditionIcon(stand.condition)}
          <button
            onClick={() => {
              setSelectedStand(stand);
              setShowDetails(true);
            }}
            className="p-1 text-weathered-wood hover:text-olive-green"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => {
              setEditingStand(stand);
              setShowForm(true);
            }}
            className="p-1 text-weathered-wood hover:text-muted-gold"
          >
            <Edit3 size={16} />
          </button>
        </div>
      </div>

      <p className="text-sm text-weathered-wood mb-3 line-clamp-2">
        {stand.description || 'No description provided'}
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2">
          <Users size={14} className="text-weathered-wood" />
          <span className="text-forest-shadow">
            {stand.capacity || 1} {stand.capacity === 1 ? 'hunter' : 'hunters'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {getSeasonIcon(stand.best_season)}
          <span className="text-forest-shadow capitalize">
            {standUtils.getSeasonInfo(stand.best_season).label}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp size={14} className="text-weathered-wood" />
          <span className="text-forest-shadow">
            {standUtils.formatSuccessRate(stand.success_rate)}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={14} className="text-weathered-wood" />
          <span className="text-forest-shadow">
            {standUtils.formatLastUsed(stand.last_used_date)}
          </span>
        </div>
      </div>

      {stand.maintenance_notes && (
        <div className="mt-3 p-2 bg-clay-earth/10 rounded border-l-3 border-clay-earth">
          <p className="text-xs text-clay-earth">
            <AlertTriangle size={12} className="inline mr-1" />
            {stand.maintenance_notes}
          </p>
        </div>
      )}
    </div>
  );

  // GPX Import Modal Component
  const GPXImportModal = () => {
    const [gpxFile, setGpxFile] = useState<File | null>(null);
    const [waypoints, setWaypoints] = useState<GPXWaypoint[]>([]);
    const [selectedWaypoints, setSelectedWaypoints] = useState<Set<number>>(new Set());
    const [importing, setImporting] = useState(false);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setGpxFile(file);
      const content = await file.text();
      try {
        const parsedWaypoints = standUtils.parseGPXFile(content);
        setWaypoints(parsedWaypoints);
        setSelectedWaypoints(new Set(parsedWaypoints.map((_, i) => i)));
      } catch (error) {
        alert('Error parsing GPX file: ' + (error as Error).message);
      }
    };

    const handleImport = async () => {
      setImporting(true);
      const waypointsToImport = waypoints.filter((_, i) => selectedWaypoints.has(i));
      
      try {
        const standsData = waypointsToImport.map(standUtils.waypointToStand);
        await createMultipleStands(standsData);
        
        setShowGPXImport(false);
        setGpxFile(null);
        setWaypoints([]);
        setSelectedWaypoints(new Set());
      } catch (error) {
        alert('Error importing stands: ' + (error as Error).message);
      } finally {
        setImporting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="border-b border-morning-mist p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-forest-shadow">Import Stands from GPX</h2>
            <button
              onClick={() => setShowGPXImport(false)}
              className="p-2 text-weathered-wood hover:text-forest-shadow"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {!gpxFile ? (
              <div className="border-2 border-dashed border-morning-mist rounded-lg p-8 text-center">
                <Upload size={48} className="text-weathered-wood mx-auto mb-4" />
                <h3 className="text-lg font-medium text-forest-shadow mb-2">Upload GPX File</h3>
                <p className="text-weathered-wood mb-4">
                  Select a GPX file containing waypoints for your hunting stands
                </p>
                <input
                  type="file"
                  accept=".gpx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="gpx-upload"
                />
                <label
                  htmlFor="gpx-upload"
                  className="inline-flex items-center px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle cursor-pointer"
                >
                  <Upload size={16} className="mr-2" />
                  Choose GPX File
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-forest-shadow">
                    Found {waypoints.length} waypoints in {gpxFile.name}
                  </h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => setSelectedWaypoints(new Set(waypoints.map((_, i) => i)))}
                      className="text-sm px-3 py-1 bg-muted-gold text-white rounded hover:bg-sunset-amber"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedWaypoints(new Set())}
                      className="text-sm px-3 py-1 bg-weathered-wood text-white rounded hover:bg-forest-shadow"
                    >
                      Select None
                    </button>
                  </div>
                </div>

                <div className="max-h-64 overflow-y-auto border border-morning-mist rounded-lg">
                  {waypoints.map((waypoint, index) => (
                    <div key={index} className="p-3 border-b border-morning-mist last:border-b-0">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedWaypoints.has(index)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedWaypoints);
                            if (e.target.checked) {
                              newSelected.add(index);
                            } else {
                              newSelected.delete(index);
                            }
                            setSelectedWaypoints(newSelected);
                          }}
                          className="mt-1 rounded border-morning-mist text-olive-green focus:ring-olive-green"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-forest-shadow">{waypoint.name}</div>
                          <div className="text-sm text-weathered-wood">
                            {waypoint.lat.toFixed(6)}, {waypoint.lon.toFixed(6)}
                          </div>
                          {waypoint.description && (
                            <div className="text-sm text-weathered-wood">{waypoint.description}</div>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setGpxFile(null);
                      setWaypoints([]);
                      setSelectedWaypoints(new Set());
                    }}
                    className="px-4 py-2 text-weathered-wood hover:text-forest-shadow"
                  >
                    Choose Different File
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={selectedWaypoints.size === 0 || importing}
                    className="flex items-center space-x-2 px-6 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importing ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>Import {selectedWaypoints.size} Stands</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Database Utilities Modal Component  
  const DatabaseUtilitiesModal = () => {
    const [activeTab, setActiveTab] = useState('query');
    const [queryResult, setQueryResult] = useState<any>(null);
    const [sqlQuery, setSqlQuery] = useState('SELECT name, condition, success_rate FROM stands ORDER BY success_rate DESC LIMIT 10;');

    const executeQuery = () => {
      // Simulate query execution with local data
      try {
        if (sqlQuery.toLowerCase().includes('select')) {
          let result = stands;
          
          if (sqlQuery.includes('active = true')) {
            result = result.filter(s => s.active);
          }
          if (sqlQuery.includes('needs_repair')) {
            result = result.filter(s => s.condition === 'needs_repair' || s.condition === 'unsafe');
          }
          if (sqlQuery.includes('success_rate > 30')) {
            result = result.filter(s => (s.success_rate || 0) > 30);
          }
          
          setQueryResult(result.slice(0, 10));
        } else {
          setQueryResult({ message: 'Query executed successfully (simulated)' });
        }
      } catch (error) {
        setQueryResult({ error: 'Query failed: ' + (error as Error).message });
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="border-b border-morning-mist p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-forest-shadow">Database Utilities</h2>
            <button
              onClick={() => setShowDBUtils(false)}
              className="p-2 text-weathered-wood hover:text-forest-shadow"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex">
            <div className="w-64 border-r border-morning-mist bg-morning-mist/30 p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('query')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    activeTab === 'query' ? 'bg-olive-green text-white' : 'text-forest-shadow hover:bg-morning-mist'
                  }`}
                >
                  <Database size={16} className="inline mr-2" />
                  Query Data
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`w-full text-left px-3 py-2 rounded ${
                    activeTab === 'schema' ? 'bg-olive-green text-white' : 'text-forest-shadow hover:bg-morning-mist'
                  }`}
                >
                  <Code size={16} className="inline mr-2" />
                  Schema Info
                </button>
              </div>

              {activeTab === 'query' && (
                <div className="mt-4">
                  <h4 className="font-medium text-forest-shadow mb-2">Common Queries</h4>
                  <div className="space-y-1">
                    {standUtils.commonQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => setSqlQuery(query.sql)}
                        className="w-full text-left text-xs px-2 py-1 text-weathered-wood hover:bg-morning-mist rounded"
                        title={query.description}
                      >
                        {query.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 p-6">
              {activeTab === 'query' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-forest-shadow mb-2">
                      SQL Query (Simulated)
                    </label>
                    <textarea
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-morning-mist rounded-lg font-mono text-sm"
                      placeholder="SELECT * FROM stands WHERE..."
                    />
                  </div>
                  <button
                    onClick={executeQuery}
                    className="flex items-center space-x-2 px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle"
                  >
                    <Terminal size={16} />
                    <span>Execute Query (Simulated)</span>
                  </button>

                  {queryResult && (
                    <div className="mt-4">
                      <h4 className="font-medium text-forest-shadow mb-2">Results</h4>
                      <div className="bg-forest-shadow text-morning-mist p-4 rounded-lg overflow-auto max-h-64">
                        <pre className="text-xs">{JSON.stringify(queryResult, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'schema' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-forest-shadow">Stands Table Schema</h3>
                  
                  <div className="bg-morning-mist/50 rounded-lg p-4">
                    <h4 className="font-medium text-forest-shadow mb-2">Hunting Season Values</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Current Values:</span>
                        <ul className="list-disc list-inside text-weathered-wood">
                          <li>archery</li>
                          <li>blackpowder</li>
                          <li>gun</li>
                          <li>all_seasons</li>
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">Icons:</span>
                        <ul className="list-disc list-inside text-weathered-wood">
                          <li>🏹 Archery</li>
                          <li>⚡ Blackpowder</li>
                          <li>🎯 Gun</li>
                          <li>📅 All Seasons</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-forest-shadow">Key Fields</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-3 rounded border">
                        <span className="font-medium">Location:</span> latitude, longitude, trail_name
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <span className="font-medium">Physical:</span> height_feet, capacity, stand_style
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <span className="font-medium">Performance:</span> total_hunts, total_harvests, success_rate
                      </div>
                      <div className="bg-white p-3 rounded border">
                        <span className="font-medium">Maintenance:</span> condition, last_inspection_date
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-morning-mist">
      {/* Header */}
      <div className="bg-white border-b border-morning-mist">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-olive-green rounded-lg flex items-center justify-center">
                <Target size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-forest-shadow">Stand Management</h1>
                <p className="text-weathered-wood">Manage hunting stands and locations</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowGPXImport(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-muted-gold text-white rounded-lg hover:bg-sunset-amber transition-colors"
              >
                <Upload size={16} />
                <span className="hidden sm:block">Import GPX</span>
              </button>
              <button
                onClick={() => setShowDBUtils(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-dark-teal text-white rounded-lg hover:bg-dark-teal/80 transition-colors"
              >
                <Database size={16} />
                <span className="hidden sm:block">DB Utils</span>
              </button>
              <button
                onClick={() => {
                  setEditingStand(null);
                  setShowForm(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:block">Add Stand</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-weathered-wood" />
              <input
                type="text"
                placeholder="Search stands..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-morning-mist rounded-lg focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              />
            </div>

            <div className="flex space-x-3">
              <select
                value={filterActive === null ? 'all' : filterActive.toString()}
                onChange={(e) => setFilterActive(e.target.value === 'all' ? null : e.target.value === 'true')}
                className="px-3 py-2 border border-morning-mist rounded-lg focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              >
                <option value="all">All Stands</option>
                <option value="true">Active Only</option>
                <option value="false">Inactive Only</option>
              </select>

              <select
                value={filterCondition}
                onChange={(e) => setFilterCondition(e.target.value as StandCondition | 'all')}
                className="px-3 py-2 border border-morning-mist rounded-lg focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              >
                <option value="all">All Conditions</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs_repair">Needs Repair</option>
                <option value="unsafe">Unsafe</option>
              </select>

              <select
                value={filterSeason}
                onChange={(e) => setFilterSeason(e.target.value as HuntingSeason | 'all')}
                className="px-3 py-2 border border-morning-mist rounded-lg focus:ring-2 focus:ring-olive-green focus:border-olive-green"
              >
                <option value="all">All Seasons</option>
                <option value="archery">Archery</option>
                <option value="blackpowder">Blackpowder</option>
                <option value="gun">Gun</option>
                <option value="all_seasons">All Seasons</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Total Stands</p>
                  <p className="text-2xl font-bold text-forest-shadow">{stats.total}</p>
                </div>
                <Target className="text-olive-green" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Active Stands</p>
                  <p className="text-2xl font-bold text-forest-shadow">{stats.active}</p>
                </div>
                <CheckCircle className="text-bright-orange" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Need Repair</p>
                  <p className="text-2xl font-bold text-forest-shadow">{stats.needsRepair}</p>
                </div>
                <AlertTriangle className="text-clay-earth" size={32} />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-weathered-wood">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-forest-shadow">
                    {standUtils.formatSuccessRate(stats.avgSuccessRate)}
                  </p>
                </div>
                <TrendingUp className="text-muted-gold" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="text-red-500" size={16} />
              <p className="text-red-700">Error loading stands: {error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <Loader className="animate-spin h-8 w-8 text-olive-green mx-auto mb-2" />
            <p className="text-weathered-wood">Loading stands...</p>
          </div>
        )}

        {/* Stands Grid */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stands.map((stand) => (
                <StandCard key={stand.id} stand={stand} />
              ))}
            </div>

            {stands.length === 0 && (
              <div className="text-center py-12">
                <Target size={48} className="text-weathered-wood mx-auto mb-4" />
                <h3 className="text-lg font-medium text-forest-shadow mb-2">No stands found</h3>
                <p className="text-weathered-wood mb-4">
                  {searchTerm || filterActive !== null || filterCondition !== 'all' || filterSeason !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first hunting stand'
                  }
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setEditingStand(null);
                      setShowForm(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-olive-green text-white rounded-lg hover:bg-pine-needle transition-colors"
                  >
                    <Plus size={16} />
                    <span>Add Stand Manually</span>
                  </button>
                  <button
                    onClick={() => setShowGPXImport(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-muted-gold text-white rounded-lg hover:bg-sunset-amber transition-colors"
                  >
                    <Upload size={16} />
                    <span>Import from GPX</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      {showGPXImport && <GPXImportModal />}
      {showDBUtils && <DatabaseUtilitiesModal />}
      
      {/* Placeholder modals for stand details and form */}
      {showDetails && selectedStand && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-forest-shadow">{selectedStand.name}</h2>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedStand(null);
                }}
                className="p-2 text-weathered-wood hover:text-forest-shadow"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-weathered-wood">Detailed stand information will be implemented in the form component...</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-forest-shadow">
                {editingStand ? 'Edit Stand' : 'Add New Stand'}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingStand(null);
                }}
                className="p-2 text-weathered-wood hover:text-forest-shadow"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-weathered-wood">Stand form component will be implemented next...</p>
          </div>
        </div>
      )}
    </div>
  );
}
