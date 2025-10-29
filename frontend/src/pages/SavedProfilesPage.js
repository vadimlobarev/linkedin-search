import { useState, useEffect } from "react";
import axios from "axios";
import { Bookmark, Search, ExternalLink, Trash2, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SavedProfilesPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProfiles, setFilteredProfiles] = useState([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    filterProfiles();
  }, [searchTerm, profiles]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/profiles`);
      setProfiles(response.data);
      setFilteredProfiles(response.data);
    } catch (error) {
      console.error("Load profiles error:", error);
      toast.error("Failed to load saved profiles");
    } finally {
      setLoading(false);
    }
  };

  const filterProfiles = () => {
    if (!searchTerm.trim()) {
      setFilteredProfiles(profiles);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = profiles.filter(
      (profile) =>
        profile.title.toLowerCase().includes(term) ||
        profile.snippet.toLowerCase().includes(term)
    );
    setFilteredProfiles(filtered);
  };

  const handleDelete = async (profileId, profileTitle) => {
    try {
      await axios.delete(`${API}/profiles/${profileId}`);
      setProfiles(profiles.filter((p) => p.id !== profileId));
      toast.success("Profile deleted");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete profile");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Saved Profiles</h1>
          <p className="text-gray-600">
            {profiles.length} profile{profiles.length !== 1 ? "s" : ""} saved
          </p>
        </div>
      </div>

      {/* Filters */}
      {profiles.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <Input
              data-testid="saved-search-input"
              type="text"
              placeholder="Filter by name, title, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            {searchTerm && (
              <Button
                data-testid="clear-filter-button"
                onClick={() => setSearchTerm("")}
                variant="outline"
              >
                Clear
              </Button>
            )}
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-3">
              Showing {filteredProfiles.length} of {profiles.length} profiles
            </p>
          )}
        </div>
      )}

      {/* Profiles List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="loader mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading saved profiles...</p>
        </div>
      ) : filteredProfiles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6" data-testid="saved-profiles-list">
          {filteredProfiles.map((profile, index) => (
            <div key={profile.id} className="profile-card" data-testid={`saved-profile-${index}`}>
              <div className="flex items-start space-x-4">
                {profile.thumbnail && (
                  <img
                    src={profile.thumbnail}
                    alt="Profile"
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    data-testid={`saved-thumbnail-${index}`}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 line-clamp-2 flex-1">
                      {profile.title}
                    </h3>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {formatDate(profile.saved_at)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {profile.snippet}
                  </p>

                  <div className="flex items-center space-x-3">
                    <a
                      href={profile.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid={`view-saved-profile-${index}`}
                      className="btn-outline flex items-center space-x-1 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>View Profile</span>
                    </a>

                    <Button
                      onClick={() => handleDelete(profile.id, profile.title)}
                      data-testid={`delete-profile-${index}`}
                      variant="destructive"
                      className="flex items-center space-x-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          <Bookmark className="mx-auto mb-4" style={{ width: '80px', height: '80px', color: '#cbd5e0' }} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Saved Profiles Yet</h3>
          <p className="text-gray-600 mb-4">Start searching and save profiles to view them here</p>
          <Button
            onClick={() => window.location.href = "/"}
            data-testid="go-to-search-button"
            className="search-btn"
          >
            <Search className="mr-2 h-4 w-4" />
            Go to Search
          </Button>
        </div>
      ) : (
        <div className="empty-state">
          <Search className="mx-auto mb-4" style={{ width: '80px', height: '80px', color: '#cbd5e0' }} />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Matching Profiles</h3>
          <p className="text-gray-600">Try adjusting your filter</p>
        </div>
      )}
    </div>
  );
};

export default SavedProfilesPage;