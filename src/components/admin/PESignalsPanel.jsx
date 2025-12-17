/**
 * PE Signals Panel Component
 *
 * Displays the 27 PE signals for a contact
 * with visual indicators for status.
 *
 * Created: December 2025
 */

import React from 'react';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Building2,
  Users,
  TrendingUp,
  Globe,
  Briefcase,
  DollarSign,
  FileText,
  Link2
} from 'lucide-react';

// Colors
const COLORS = {
  success: '#16a34a',
  error: '#dc2626',
  warning: '#d97706',
  muted: '#6b7280',
  border: 'rgba(0, 0, 0, 0.1)',
  white: '#ffffff'
};

// Signal category icons
const CATEGORY_ICONS = {
  fundingHistory: DollarSign,
  corporateStructure: Building2,
  digitalFootprint: Globe,
  executiveProfile: Briefcase,
  hiring: Users,
  revenue: TrendingUp,
  websiteLanguage: FileText,
  investorConnections: Link2
};

// Signal display names
const SIGNAL_LABELS = {
  // Funding History
  noFundingRecorded: 'No funding recorded',
  seedAngelOnlyUnder500k: 'Seed/Angel only (<$500k)',
  seriesABWithFounderControl: 'Series A/B with founder control',
  seriesCPlusOrLateStage: 'Series C+ or late stage',
  peVcInvestorTagsPresent: 'PE/VC investor tags present',

  // Corporate Structure
  singleFounderFlatOrg: 'Single founder, flat org',
  parentCompanyExists: 'Parent company exists',
  foreignBranchStatus: 'Foreign branch status',

  // Digital Footprint
  productHuntLaunchRecent: 'Recent ProductHunt launch',
  ycBadgePresent: 'YC badge present',
  foundedWithin36Months: 'Founded within 36 months',
  nonDilutiveFundingMentioned: 'Non-dilutive funding mentioned',

  // Executive Profile
  founderCeoStillActive: 'Founder/CEO still active',
  cfoHiredPostFunding: 'CFO hired post-funding',
  salesVpHiredYearOne: 'Sales VP hired in year 1',

  // Hiring
  employeeCountUnder50: 'Employee count under 50',
  rapidExpansion6mo: 'Rapid expansion (6mo)',
  founderLedSalesDominance: 'Founder-led sales dominance',

  // Revenue
  revenueBasedFinancingActive: 'Revenue-based financing active',
  recurringRevenueModel: 'Recurring revenue model',
  organicGrowth50Percent: '50%+ organic growth',

  // Website Language
  bootstrappedInDescription: '"Bootstrapped" in description',
  founderLedPositioning: 'Founder-led positioning',
  portfolioCompanyMention: 'Portfolio company mention',

  // Investor Connections
  noInvestorsListedOrFounderOnly: 'No investors listed / founder only',
  listIncludesPeVcFirms: 'List includes PE/VC firms',
  exclusivelyAngelsSeedLimited: 'Exclusively angels / seed limited'
};

// Hard block signals (RED - automatic exclusion)
const HARD_BLOCKS = ['peVcInvestorTagsPresent', 'portfolioCompanyMention'];

// Red flag signals (YELLOW - counts toward exclusion)
const RED_FLAGS = [
  'seriesCPlusOrLateStage',
  'parentCompanyExists',
  'foreignBranchStatus',
  'cfoHiredPostFunding',
  'salesVpHiredYearOne',
  'rapidExpansion6mo',
  'listIncludesPeVcFirms'
];

const SignalIndicator = ({ value, signalKey }) => {
  const isHardBlock = HARD_BLOCKS.includes(signalKey);
  const isRedFlag = RED_FLAGS.includes(signalKey);

  if (value === null || value === undefined) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.muted }}>
        <HelpCircle size={14} />
        <span style={{ fontSize: '12px' }}>Unknown</span>
      </span>
    );
  }

  // For hard blocks and red flags, TRUE is bad
  if (isHardBlock || isRedFlag) {
    if (value === true) {
      return (
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: isHardBlock ? COLORS.error : COLORS.warning
        }}>
          {isHardBlock ? <XCircle size={14} /> : <AlertTriangle size={14} />}
          <span style={{ fontSize: '12px', fontWeight: '500' }}>
            {isHardBlock ? 'BLOCK' : 'FLAG'}
          </span>
        </span>
      );
    } else {
      return (
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.success }}>
          <CheckCircle size={14} />
          <span style={{ fontSize: '12px' }}>Clear</span>
        </span>
      );
    }
  }

  // For positive signals, TRUE is good
  if (value === true) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.success }}>
        <CheckCircle size={14} />
        <span style={{ fontSize: '12px' }}>Yes</span>
      </span>
    );
  }

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: COLORS.muted }}>
      <XCircle size={14} />
      <span style={{ fontSize: '12px' }}>No</span>
    </span>
  );
};

// eslint-disable-next-line no-unused-vars
const SignalCategory = ({ title, icon: Icon, signals, data }) => {
  if (!data) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        paddingBottom: '6px',
        borderBottom: `1px solid ${COLORS.border}`
      }}>
        <Icon size={16} style={{ color: COLORS.muted }} />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {signals.map(signalKey => (
          <div
            key={signalKey}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 8px',
              backgroundColor: data[signalKey] === true && (HARD_BLOCKS.includes(signalKey) || RED_FLAGS.includes(signalKey))
                ? HARD_BLOCKS.includes(signalKey) ? '#fef2f2' : '#fefce8'
                : 'transparent',
              borderRadius: '4px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#374151' }}>
              {SIGNAL_LABELS[signalKey] || signalKey}
            </span>
            <SignalIndicator value={data[signalKey]} signalKey={signalKey} />
          </div>
        ))}
      </div>
    </div>
  );
};

const PESignalsPanel = ({ contact, onClose }) => {
  if (!contact) return null;

  const peSignals = contact.peSignals || {};
  const pipelineAssignment = contact.pipelineAssignment || {};

  // Count signals
  const totalSignals = Object.values(peSignals).reduce((sum, category) => {
    if (typeof category === 'object') {
      return sum + Object.values(category).filter(v => v !== null).length;
    }
    return sum;
  }, 0);

  // Count hard blocks and red flags
  let hardBlockCount = 0;
  let redFlagCount = 0;

  Object.values(peSignals).forEach(category => {
    if (typeof category === 'object') {
      Object.entries(category).forEach(([key, value]) => {
        if (value === true) {
          if (HARD_BLOCKS.includes(key)) hardBlockCount++;
          if (RED_FLAGS.includes(key)) redFlagCount++;
        }
      });
    }
  });

  return (
    <div style={{
      backgroundColor: COLORS.white,
      borderRadius: '12px',
      border: `1px solid ${COLORS.border}`,
      padding: '20px',
      maxHeight: '70vh',
      overflowY: 'auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '16px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
            PE Signals Analysis
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: COLORS.muted }}>
            {contact.name || contact.email}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: COLORS.muted
            }}
          >
            &times;
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '100px' }}>
          <div style={{ fontSize: '11px', color: COLORS.muted, marginBottom: '2px' }}>Status</div>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: pipelineAssignment.pipelineAStatus === 'QUALIFIED' ? COLORS.success
              : pipelineAssignment.pipelineAStatus === 'EXCLUDED_PE' ? COLORS.error
                : pipelineAssignment.pipelineAStatus === 'FLAGGED' ? COLORS.warning
                  : COLORS.muted
          }}>
            {pipelineAssignment.pipelineAStatus || 'PENDING'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '100px' }}>
          <div style={{ fontSize: '11px', color: COLORS.muted, marginBottom: '2px' }}>Pipeline</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {pipelineAssignment.primaryPipeline || '-'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '100px' }}>
          <div style={{ fontSize: '11px', color: COLORS.muted, marginBottom: '2px' }}>Confidence</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {pipelineAssignment.confidenceScore
              ? `${Math.round(pipelineAssignment.confidenceScore * 100)}%`
              : '-'}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '100px' }}>
          <div style={{ fontSize: '11px', color: COLORS.muted, marginBottom: '2px' }}>Signals</div>
          <div style={{ fontSize: '14px', fontWeight: '600' }}>
            {totalSignals} collected
          </div>
        </div>
      </div>

      {/* Warnings */}
      {hardBlockCount > 0 && (
        <div style={{
          backgroundColor: '#fef2f2',
          color: COLORS.error,
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px'
        }}>
          <XCircle size={16} />
          <strong>{hardBlockCount} hard block{hardBlockCount > 1 ? 's' : ''}</strong> detected - automatic PE exclusion
        </div>
      )}

      {redFlagCount >= 2 && hardBlockCount === 0 && (
        <div style={{
          backgroundColor: '#fefce8',
          color: COLORS.warning,
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px'
        }}>
          <AlertTriangle size={16} />
          <strong>{redFlagCount} red flag{redFlagCount > 1 ? 's' : ''}</strong> detected -
          {redFlagCount >= 3 ? ' PE exclusion' : ' flagged for review'}
        </div>
      )}

      {/* Exclusion Reason */}
      {pipelineAssignment.peExclusionReason && (
        <div style={{
          backgroundColor: '#f3f4f6',
          padding: '10px 14px',
          borderRadius: '8px',
          marginBottom: '16px',
          fontSize: '13px'
        }}>
          <strong>Reason:</strong> {pipelineAssignment.peExclusionReason}
        </div>
      )}

      {/* Signal Categories */}
      <SignalCategory
        title="Funding History"
        icon={CATEGORY_ICONS.fundingHistory}
        signals={['noFundingRecorded', 'seedAngelOnlyUnder500k', 'seriesABWithFounderControl', 'seriesCPlusOrLateStage', 'peVcInvestorTagsPresent']}
        data={peSignals.fundingHistory}
      />

      <SignalCategory
        title="Corporate Structure"
        icon={CATEGORY_ICONS.corporateStructure}
        signals={['singleFounderFlatOrg', 'parentCompanyExists', 'foreignBranchStatus']}
        data={peSignals.corporateStructure}
      />

      <SignalCategory
        title="Digital Footprint"
        icon={CATEGORY_ICONS.digitalFootprint}
        signals={['productHuntLaunchRecent', 'ycBadgePresent', 'foundedWithin36Months', 'nonDilutiveFundingMentioned']}
        data={peSignals.digitalFootprint}
      />

      <SignalCategory
        title="Executive Profile"
        icon={CATEGORY_ICONS.executiveProfile}
        signals={['founderCeoStillActive', 'cfoHiredPostFunding', 'salesVpHiredYearOne']}
        data={peSignals.executiveProfile}
      />

      <SignalCategory
        title="Hiring"
        icon={CATEGORY_ICONS.hiring}
        signals={['employeeCountUnder50', 'rapidExpansion6mo', 'founderLedSalesDominance']}
        data={peSignals.hiring}
      />

      <SignalCategory
        title="Revenue"
        icon={CATEGORY_ICONS.revenue}
        signals={['revenueBasedFinancingActive', 'recurringRevenueModel', 'organicGrowth50Percent']}
        data={peSignals.revenue}
      />

      <SignalCategory
        title="Website Language"
        icon={CATEGORY_ICONS.websiteLanguage}
        signals={['bootstrappedInDescription', 'founderLedPositioning', 'portfolioCompanyMention']}
        data={peSignals.websiteLanguage}
      />

      <SignalCategory
        title="Investor Connections"
        icon={CATEGORY_ICONS.investorConnections}
        signals={['noInvestorsListedOrFounderOnly', 'listIncludesPeVcFirms', 'exclusivelyAngelsSeedLimited']}
        data={peSignals.investorConnections}
      />

      {/* Pipeline Scores */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f9fafb',
        borderRadius: '8px'
      }}>
        <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px' }}>Pipeline Scores</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <div>
            <span style={{ fontSize: '12px', color: COLORS.muted }}>Pipeline A:</span>
            <span style={{ marginLeft: '6px', fontWeight: '600' }}>
              {pipelineAssignment.pipelineAScore?.toFixed(2) || '0.00'}
            </span>
          </div>
          <div>
            <span style={{ fontSize: '12px', color: COLORS.muted }}>Pipeline B:</span>
            <span style={{ marginLeft: '6px', fontWeight: '600' }}>
              {pipelineAssignment.pipelineBScore?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PESignalsPanel;
