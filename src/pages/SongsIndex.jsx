import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMySongs } from '../db/queries';
import { getChordNames, searchChordNames } from '../utils/chord-library';

// Helper function to extract unique chords from song chords data
function getUniqueChords(song) {
  try {
    if (!song.chords) return [];
    const chordsArray = JSON.parse(song.chords);
    const uniqueChords = [...new Set(chordsArray.map(c => c.chord))];
    return uniqueChords;
  } catch {
    return [];
  }
}

// Component to render chords as labels
function ChordLabels({ chords }) {
  if (chords.length === 0) {
    return <span className="text-gray-400">No chords</span>;
  }

  const displayChords = chords.slice(0, 3);
  const remainingCount = chords.length - 3;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {displayChords.map((chord, index) => (
        <span
          key={index}
          className="inline-block px-2 py-1 bg-primary-100 text-primary-700 rounded text-sm font-medium"
        >
          {chord}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-gray-500 text-sm">
          and {remainingCount} more
        </span>
      )}
    </div>
  );
}

// Chord filter component
function ChordFilter({ selectedChords, onChordsChange }) {
  const [chordQuery, setChordQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const allChords = useMemo(() => getChordNames(), []);
  const filteredChords = useMemo(() => {
    if (!chordQuery) return allChords.slice(0, 20);
    return searchChordNames(chordQuery, 'ukulele', 'ukulele_standard', 20);
  }, [chordQuery, allChords]);

  const handleAddChord = (chord) => {
    if (!selectedChords.includes(chord)) {
      onChordsChange([...selectedChords, chord]);
    }
    setChordQuery('');
    setShowDropdown(false);
  };

  const handleRemoveChord = (chord) => {
    onChordsChange(selectedChords.filter(c => c !== chord));
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedChords.map((chord) => (
          <span
            key={chord}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-600 text-white rounded text-sm"
          >
            {chord}
            <button
              type="button"
              onClick={() => handleRemoveChord(chord)}
              className="hover:text-primary-200 focus:outline-none"
              aria-label={`Remove ${chord}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={chordQuery}
          onChange={(e) => {
            setChordQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => {
            // Delay to allow click on dropdown item
            setTimeout(() => setShowDropdown(false), 200);
          }}
          placeholder="Add chord filter..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {showDropdown && filteredChords.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredChords
              .filter(chord => !selectedChords.includes(chord))
              .map((chord) => (
                <button
                  key={chord}
                  type="button"
                  onClick={() => handleAddChord(chord)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors"
                >
                  {chord}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SongsIndex() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const songsQuery = useMySongs(user?.id);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChords, setSelectedChords] = useState([]);
  
  if (songsQuery.error) {
    console.error('useMySongs error:', songsQuery.error);
  }
  
  const allSongs = songsQuery.data?.songs || [];

  // Filter songs based on search query and chord filter
  const filteredSongs = useMemo(() => {
    let filtered = allSongs;

    // Filter by search query (title or artist)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(song => {
        const title = (song.title || '').toLowerCase();
        const artist = (song.artist || '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      });
    }

    // Filter by chords - only show songs that use ONLY the selected chords
    if (selectedChords.length > 0) {
      filtered = filtered.filter(song => {
        const songChords = getUniqueChords(song);
        const selectedChordsSet = new Set(selectedChords);
        
        // Song must use only the selected chords (no other chords)
        // This means: every chord in the song must be in selectedChords
        // AND the song must have at least one chord
        if (songChords.length === 0) return false;
        
        // Check if all song chords are in the selected chords
        return songChords.every(chord => selectedChordsSet.has(chord));
      });
    }

    return filtered;
  }, [allSongs, searchQuery, selectedChords]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Songs</h1>
        <Link to="/songs/new" className="btn btn-primary">
          + New Song
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="card space-y-4">
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search Songs
          </label>
          <input
            id="search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or artist..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Chords
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Only show songs that use <strong>only</strong> the selected chords (and no others)
          </p>
          <ChordFilter
            selectedChords={selectedChords}
            onChordsChange={setSelectedChords}
          />
          {selectedChords.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedChords([])}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Clear chord filter
            </button>
          )}
        </div>

        {/* Results count */}
        {(searchQuery || selectedChords.length > 0) && (
          <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
            Showing {filteredSongs.length} of {allSongs.length} songs
          </div>
        )}
      </div>

      {allSongs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No songs yet.</p>
          <Link to="/songs/new" className="text-primary-600 hover:underline">
            Create your first song
          </Link>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No songs match your filters.</p>
          {(searchQuery || selectedChords.length > 0) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedChords([]);
              }}
              className="text-primary-600 hover:underline"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chords
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSongs.map((song) => {
                const uniqueChords = getUniqueChords(song);
                return (
                  <tr
                    key={song.id}
                    onClick={() => navigate(`/songs/${song.id}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-900 font-medium">
                        {song.title}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {song.artist || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <ChordLabels chords={uniqueChords} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

