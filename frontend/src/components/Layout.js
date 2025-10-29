import { Outlet, Link, useLocation } from "react-router-dom";
import { Search, Bookmark } from "lucide-react";

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <nav className="navbar sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">LinkedIn Search</h1>
                <p className="text-xs text-gray-500">Profile Discovery Tool</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                data-testid="nav-search-link"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Search className="w-5 h-5" />
                <span>Search</span>
              </Link>
              
              <Link
                to="/saved"
                data-testid="nav-saved-link"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname === "/saved"
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Bookmark className="w-5 h-5" />
                <span>Saved Profiles</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;