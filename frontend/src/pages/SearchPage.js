import { useState } from "react";
import axios from "axios";
import { Search, MapPin, Briefcase, Building2, Loader2, ExternalLink, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SearchPage = () => {
  const [keywords, setKeywords] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState("0");
  const [searchTime, setSearchTime] = useState(0);
  const [savedProfiles, setSavedProfiles] = useState(new Set());

  const handleSearch = async () => {
    if (!keywords.trim()) {
      toast.error("Please enter keywords to search");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/search`, {
        keywords,
        location: location || null,
        job_title: jobTitle || null,
        company: company || null,
      });

      setResults(response.data.results);
      setTotalResults(response.data.total_results);
      setSearchTime(response.data.search_time);
      
      if (response.data.results.length === 0) {
        toast.info("No results found. Try different search terms.");
      } else {
        toast.success(`Found ${response.data.results.length} profiles`);
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search profiles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (profile) => {
    try {
      await axios.post(`${API}/profiles`, {
        title: profile.title,
        link: profile.link,
        snippet: profile.snippet,
        thumbnail: profile.thumbnail,
      });

      setSavedProfiles(new Set([...savedProfiles, profile.link]));
      toast.success("Profile saved successfully!");
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("Profile already saved");
        setSavedProfiles(new Set([...savedProfiles, profile.link]));
      } else {
        console.error("Save error:", error);
        toast.error("Failed to save profile");
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Search Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text mb-4">
          Discover LinkedIn Profiles
        </h1>
        <p className="text-lg text-gray-600">Search and save professional profiles with advanced filters</p>
      </div>

      {/* Search Form */}
      <div className="glass-card rounded-2xl p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Search className="inline w-4 h-4 mr-1" />
              Keywords *
            </label>
            <Input
              data-testid="search-keywords-input"
              type="text"
              placeholder="e.g., software engineer, data scientist"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Location
            </label>
            <Input
              data-testid="search-location-input"
              type="text"
              placeholder="e.g., San Francisco, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Briefcase className="inline w-4 h-4 mr-1" />
              Job Title
            </label>
            <Input
              data-testid="search-job-title-input"
              type="text"
              placeholder="e.g., Senior Developer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Building2 className="inline w-4 h-4 mr-1" />
              Company
            </label>
            <Input
              data-testid="search-company-input"
              type="text"
              placeholder="e.g., Google, Microsoft"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full"
            />
          </div>
        </div>

        <Button
          data-testid="search-button"
          onClick={handleSearch}
          disabled={loading}
          className="w-full search-btn text-base py-6"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="mr-2 h-5 w-5" />
              Search LinkedIn Profiles
            </>
          )}
        </Button>
      </div>

      {/* Search Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Search Results
            </h2>
            <p className="text-sm text-gray-600">
              About {parseInt(totalResults).toLocaleString()} results ({searchTime}s)
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6" data-testid="search-results">
            {results.map((profile, index) => (
              <div key={index} className="profile-card" data-testid={`profile-card-${index}`}>
                <div className="flex items-start space-x-4">
                  {profile.thumbnail && (
                    <img
                      src={profile.thumbnail}
                      alt="Profile"
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      data-testid={`profile-thumbnail-${index}`}
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                      {profile.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                      {profile.snippet}
                    </p>
                    
                    <div className="flex items-center space-x-3">
                      <a
                        href={profile.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`view-profile-${index}`}
                        className="btn-outline flex items-center space-x-1 text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View Profile</span>
                      </a>
                      
                      <Button
                        onClick={() => handleSaveProfile(profile)}
                        disabled={savedProfiles.has(profile.link)}
                        data-testid={`save-profile-${index}`}
                        className="flex items-center space-x-1 text-sm"
                        variant={savedProfiles.has(profile.link) ? "secondary" : "default"}
                      >
                        <Bookmark className="w-4 h-4" />
                        <span>{savedProfiles.has(profile.link) ? "Saved" : "Save"}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="loader mx-auto"></div>
          <p className="text-gray-600 mt-4">Searching LinkedIn profiles...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && (
        <div className="empty-state">
          <Search className="mx-auto mb-4" style={{ width: '80px', height: '80px', color: '#cbd5e0' }} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Start Your Search</h3>
          <p className="text-gray-600">Enter keywords and filters above to find LinkedIn profiles</p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;