import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';
import HomePage from './pages/HomePage';
import Home17Page from './pages/Home17Page';
import ExperimentsPage from './pages/ExperimentsPage';
import ThoughtsPage from './pages/ThoughtsPage';
import AboutPage from './pages/AboutPage';
import WorksPage from './pages/WorksPage';
import HandsPage from './pages/HandsPage';
import TimeCapsulePage from './pages/TimeCapsulePage';
import CapsuleViewPage from './pages/CapsuleViewPage';
import FeedbackPage from './pages/FeedbackPage';
import SitemapPage from './pages/SitemapPage';
import DirectoryPage from './pages/DirectoryPage';
import UnityNotesPage from './pages/UnityNotesPage';
import UnityNotePlusPage from './pages/UnityNotePlusPage';
import NotFoundPage from './pages/NotFoundPage';

// Experiment sub-routes
import GoldenUnknownPage from './pages/experiments/GoldenUnknownPage';
import BeingRhymePage from './pages/experiments/BeingRhymePage';
import Cath3dralPage from './pages/experiments/Cath3dralPage';
import ComponentLibraryPage from './pages/experiments/ComponentLibraryPage';
import OutreachGeneratorPage from './pages/experiments/OutreachGeneratorPage';
import OutreachBusinessPage from './pages/experiments/OutreachBusinessPage';

// Thoughts sub-routes
import BlogPage from './pages/thoughts/BlogPage';

// Own Your Story - Thought Leadership Series
import OwnYourStoryArticle1Page from './pages/OwnYourStoryArticle1Page';

function RouterApp() {
  return (
    <LayoutProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home-17" element={<Home17Page />} />

        {/* Main Pages */}
        <Route path="/experiments" element={<ExperimentsPage />} />
        <Route path="/thoughts" element={<ThoughtsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/works" element={<WorksPage />} />
        <Route path="/hands" element={<HandsPage />} />
        
        {/* Experiment Sub-routes */}
        <Route path="/experiments/golden-unknown" element={<GoldenUnknownPage />} />
        <Route path="/experiments/being-rhyme" element={<BeingRhymePage />} />
        <Route path="/experiments/cath3dral" element={<Cath3dralPage />} />
        <Route path="/experiments/component-library" element={<ComponentLibraryPage />} />
        <Route path="/experiments/outreach-generator" element={<OutreachGeneratorPage />} />
        <Route path="/outreach" element={<OutreachBusinessPage />} />
        
        {/* Thoughts Sub-routes */}
        <Route path="/thoughts/blog" element={<BlogPage />} />

        {/* Own Your Story - Thought Leadership Series */}
        <Route path="/thoughts/why-your-gtm-sucks" element={<OwnYourStoryArticle1Page />} />

        {/* Travel Time Capsule */}
        <Route path="/uk-memories" element={<TimeCapsulePage />} />
        <Route path="/uk-memories/view/:capsuleId" element={<CapsuleViewPage />} />

        {/* Feedback */}
        <Route path="/feedback" element={<FeedbackPage />} />

        {/* Sitemap */}
        <Route path="/sitemap" element={<SitemapPage />} />

        {/* Directory - Navigation & Testing */}
        <Route path="/directory" element={<DirectoryPage />} />

        {/* Unity Notes - Second Brain App */}
        <Route path="/unity-notes" element={<UnityNotesPage />} />
        <Route path="/unity-notes-plus" element={<UnityNotePlusPage />} />

        {/* Placeholder routes for future sub-pages */}
        <Route path="/about/timeline" element={<AboutPage />} />
        <Route path="/about/services" element={<AboutPage />} />
        <Route path="/about/contact" element={<AboutPage />} />

        <Route path="/works/websites" element={<WorksPage />} />
        <Route path="/works/graphics" element={<WorksPage />} />
        <Route path="/works/music" element={<WorksPage />} />

        {/* 404 - Catch all unmatched routes */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
    </LayoutProvider>
  );
}

export default RouterApp;