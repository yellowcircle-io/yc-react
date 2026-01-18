import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { LayoutProvider } from './contexts/LayoutContext';
import { AuthProvider } from './contexts/AuthContext';

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
// CapsuleViewPage still needed for UnityNotes sharing
const CapsuleViewPage = lazy(() => import('./pages/CapsuleViewPage'));
const FeedbackPage = lazy(() => import('./pages/FeedbackPage'));
const SitemapPage = lazy(() => import('./pages/SitemapPage'));
const DirectoryPage = lazy(() => import('./pages/DirectoryPage'));
const UnityNotesPage = lazy(() => import('./pages/UnityNotesPage'));
const JourneysPage = lazy(() => import('./pages/JourneysPage'));
const PortfolioPage = lazy(() => import('./pages/PortfolioPage'));
const ShortlinkRedirectPage = lazy(() => import('./pages/ShortlinkRedirectPage'));
const ShortlinkManagerPage = lazy(() => import('./pages/ShortlinkManagerPage'));

// Experiment sub-routes (lazy loaded)
const GoldenUnknownPage = lazy(() => import('./pages/experiments/GoldenUnknownPage'));
const BeingRhymePage = lazy(() => import('./pages/experiments/BeingRhymePage'));
const Cath3dralPage = lazy(() => import('./pages/experiments/Cath3dralPage'));
const ComponentLibraryPage = lazy(() => import('./pages/experiments/ComponentLibraryPage'));
const OutreachGeneratorPage = lazy(() => import('./pages/experiments/OutreachGeneratorPage'));
const OutreachBusinessPage = lazy(() => import('./pages/experiments/OutreachBusinessPage'));

// Thoughts sub-routes (lazy loaded)
const BlogPage = lazy(() => import('./pages/thoughts/BlogPage'));
const ArticleV2Page = lazy(() => import('./pages/thoughts/ArticleV2Page'));

// Own Your Story - Thought Leadership Series (lazy loaded - large component)
const OwnYourStoryArticle1Page = lazy(() => import('./pages/OwnYourStoryArticle1Page'));

// Legal pages (lazy loaded)
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

// Access approval pages (lazy loaded)
const ApproveAccessPage = lazy(() => import('./pages/ApproveAccessPage'));
const DenyAccessPage = lazy(() => import('./pages/DenyAccessPage'));

// Admin pages (lazy loaded)
const AdminHubPage = lazy(() => import('./pages/admin/AdminHubPage'));
const TriggerRulesPage = lazy(() => import('./pages/admin/TriggerRulesPage'));
const ContactDashboardPage = lazy(() => import('./pages/admin/ContactDashboardPage'));
const ArticleListPage = lazy(() => import('./pages/admin/ArticleListPage'));
const ArticleEditorPage = lazy(() => import('./pages/admin/ArticleEditorPage'));
const BlockEditorPage = lazy(() => import('./pages/admin/BlockEditorPage'));
const StorageCleanupPage = lazy(() => import('./pages/admin/StorageCleanupPage'));
const LinkArchiverPage = lazy(() => import('./pages/admin/LinkArchiverPage'));
const SaveLinkPage = lazy(() => import('./pages/SaveLinkPage'));

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
    <ThemeProvider>
      <AuthProvider>
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
            <Route path="/portfolio" element={<PortfolioPage />} />

            {/* Shortlinks */}
            <Route path="/go/:shortCode" element={<ShortlinkRedirectPage />} />
            <Route path="/shortlinks" element={<ShortlinkManagerPage />} />

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

            {/* Block-based Article Renderer (v2 - for validation) */}
            <Route path="/thoughts/:slug" element={<ArticleV2Page />} />

            {/* ARCHIVED: Travel Time Capsule
            <Route path="/uk-memories" element={<TimeCapsulePage />} />
            <Route path="/uk-memories/view/:capsuleId" element={<CapsuleViewPage />} />
            */}

            {/* UnityNotes Share View - uses same CapsuleViewPage for canvas display */}
            <Route path="/unity-notes/view/:capsuleId" element={<CapsuleViewPage />} />

            {/* Feedback */}
            <Route path="/feedback" element={<FeedbackPage />} />

            {/* Sitemap */}
            <Route path="/sitemap" element={<SitemapPage />} />

            {/* Directory - Navigation & Testing */}
            <Route path="/directory" element={<DirectoryPage />} />

            {/* UnityNotes - Second Brain App */}
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

            {/* Client Access Approval Routes */}
            <Route path="/approve-access" element={<ApproveAccessPage />} />
            <Route path="/deny-access" element={<DenyAccessPage />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminHubPage />} />
            <Route path="/admin/trigger-rules" element={<TriggerRulesPage />} />
            <Route path="/admin/contacts" element={<ContactDashboardPage />} />
            <Route path="/admin/articles" element={<ArticleListPage />} />
            <Route path="/admin/articles/:articleId" element={<ArticleEditorPage />} />
            <Route path="/admin/blocks/:articleId" element={<BlockEditorPage />} />
            <Route path="/admin/storage-cleanup" element={<StorageCleanupPage />} />
            <Route path="/admin/links" element={<LinkArchiverPage />} />
            <Route path="/save" element={<SaveLinkPage />} />

            {/* 404 - Catch all unmatched routes */}
            <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </Router>
        </LayoutProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default RouterApp;
