import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LayoutProvider } from './contexts/LayoutContext';

// Eagerly loaded pages (critical for initial render)
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import WorksPage from './pages/WorksPage';
import NotFoundPage from './pages/NotFoundPage';

// Lazy loaded pages (code-split for smaller initial bundle)
const Home17Page = lazy(() => import('./pages/Home17Page'));
const ExperimentsPage = lazy(() => import('./pages/ExperimentsPage'));
const ThoughtsPage = lazy(() => import('./pages/ThoughtsPage'));
const HandsPage = lazy(() => import('./pages/HandsPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const CompanyDetailPage = lazy(() => import('./pages/works/CompanyDetailPage'));
const ServiceDetailPage = lazy(() => import('./pages/services/ServiceDetailPage'));
// ARCHIVED: Travel Time Capsule (uses Cloudinary - archived for simplification)
// const TimeCapsulePage = lazy(() => import('./pages/TimeCapsulePage'));
// const CapsuleViewPage = lazy(() => import('./pages/CapsuleViewPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const UnityNotesPage = lazy(() => import('./pages/UnityNotesPage'));
const JourneysPage = lazy(() => import('./pages/JourneysPage'));

// Experiment sub-routes (lazy loaded)
const GoldenUnknownPage = lazy(() => import('./pages/experiments/GoldenUnknownPage'));
const BeingRhymePage = lazy(() => import('./pages/experiments/BeingRhymePage'));
const Cath3dralPage = lazy(() => import('./pages/experiments/Cath3dralPage'));
const ComponentLibraryPage = lazy(() => import('./pages/experiments/ComponentLibraryPage'));
const OutreachGeneratorPage = lazy(() => import('./pages/experiments/OutreachGeneratorPage'));
const OutreachBusinessPage = lazy(() => import('./pages/experiments/OutreachBusinessPage'));

// Thoughts sub-routes (lazy loaded)
const BlogPage = lazy(() => import('./pages/thoughts/BlogPage'));

// Own Your Story - Thought Leadership Series (lazy loaded - large component)
const OwnYourStoryArticle1Page = lazy(() => import('./pages/OwnYourStoryArticle1Page'));

// Legal pages (lazy loaded)
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Loading spinner for lazy loaded components
const PageLoader = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 9999
  }}>
    <div style={{
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      backgroundColor: '#fbbf24',
      animation: 'pulse 1s ease-in-out infinite'
    }}></div>
    <style>{`
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
    `}</style>
  </div>
);

function RouterApp() {
  return (
    <LayoutProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home-17" element={<Home17Page />} />

            {/* Main Pages */}
            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/journeys" element={<JourneysPage />} />
            <Route path="/thoughts" element={<ThoughtsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/works" element={<WorksPage />} />
            <Route path="/hands" element={<HandsPage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/assessment" element={<AssessmentPage />} />

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

            {/* ARCHIVED: Travel Time Capsule
            <Route path="/uk-memories" element={<TimeCapsulePage />} />
            <Route path="/uk-memories/view/:capsuleId" element={<CapsuleViewPage />} />
            */}

            {/* Feedback */}
            <Route path="/feedback" element={<FeedbackPage />} />

            {/* Sitemap */}
            <Route path="/sitemap" element={<SitemapPage />} />

            {/* Directory - Navigation & Testing */}
            <Route path="/directory" element={<DirectoryPage />} />

            {/* Unity Notes - Second Brain App */}
            <Route path="/unity-notes" element={<UnityNotesPage />} />

            {/* Placeholder routes for future sub-pages */}
            <Route path="/about/timeline" element={<AboutPage />} />
            <Route path="/about/services" element={<AboutPage />} />
            <Route path="/about/contact" element={<AboutPage />} />

            {/* Works Company Detail Pages */}
            <Route path="/works/:companyId" element={<CompanyDetailPage />} />

            {/* Services Detail Pages */}
            <Route path="/services/:serviceId" element={<ServiceDetailPage />} />

            {/* Legal Pages */}
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* 404 - Catch all unmatched routes */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </LayoutProvider>
  );
}

export default RouterApp;
