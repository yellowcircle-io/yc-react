import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import Home17Page from './pages/Home17Page';
import ExperimentsPage from './pages/ExperimentsPage';
import ThoughtsPage from './pages/ThoughtsPage';
import AboutPage from './pages/AboutPage';
import WorksPage from './pages/WorksPage';

// Experiment sub-routes
import GoldenUnknownPage from './pages/experiments/GoldenUnknownPage';
import BeingRhymePage from './pages/experiments/BeingRhymePage';
import Cath3dralPage from './pages/experiments/Cath3dralPage';
import ComponentLibraryPage from './pages/experiments/ComponentLibraryPage';

// Thoughts sub-routes
import BlogPage from './pages/thoughts/BlogPage';

function RouterApp() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home-17" element={<Home17Page />} />

        {/* Main Pages */}
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/thoughts" element={<ThoughtsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/works" element={<WorksPage />} />
        
        {/* Experiment Sub-routes */}
        <Route path="/experiments/golden-unknown" element={<GoldenUnknownPage />} />
        <Route path="/experiments/being-rhyme" element={<BeingRhymePage />} />
        <Route path="/experiments/cath3dral" element={<Cath3dralPage />} />
        <Route path="/experiments/component-library" element={<ComponentLibraryPage />} />
        
        {/* Thoughts Sub-routes */}
        <Route path="/thoughts/blog" element={<BlogPage />} />
        
        {/* Placeholder routes for future sub-pages */}
        <Route path="/about/timeline" element={<AboutPage />} />
        <Route path="/about/services" element={<AboutPage />} />
        <Route path="/about/contact" element={<AboutPage />} />
        
        <Route path="/works/websites" element={<WorksPage />} />
        <Route path="/works/graphics" element={<WorksPage />} />
        <Route path="/works/music" element={<WorksPage />} />
      </Routes>
    </Router>
  );
}

export default RouterApp;