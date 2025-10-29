import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "@/pages/SearchPage";
import SavedProfilesPage from "@/pages/SavedProfilesPage";
import Layout from "@/components/Layout";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<SearchPage />} />
            <Route path="/saved" element={<SavedProfilesPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;