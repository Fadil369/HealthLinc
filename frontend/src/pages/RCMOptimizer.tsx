import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LineChart, TrendingUp, AlertTriangle, CheckCircle, Filter, Download } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useRtl } from '../utils/rtl';

interface ClaimData {
  id: string;
  patientName: string;
  cptCode: string;
  denialRate: number;
  riskLevel: 'low' | 'medium' | 'high';
  submittedDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'denied';
  aiSuggestions: string[];
}

const mockClaims: ClaimData[] = [
  {
    id: 'CLM-001',
    patientName: 'Sarah Johnson',
    cptCode: '99213',
    denialRate: 15,
    riskLevel: 'medium',
    submittedDate: '2024-03-15',
    amount: 245.00,
    status: 'pending',
    aiSuggestions: ['Add modifier -25 for significant E&M service', 'Include supporting documentation']
  },
  {
    id: 'CLM-002',
    patientName: 'Michael Chen',
    cptCode: '99214',
    denialRate: 8,
    riskLevel: 'low',
    submittedDate: '2024-03-14',
    amount: 320.00,
    status: 'paid',
    aiSuggestions: []
  },
  {
    id: 'CLM-003',
    patientName: 'Emma Wilson',
    cptCode: '99215',
    denialRate: 35,
    riskLevel: 'high',
    submittedDate: '2024-03-13',
    amount: 425.00,
    status: 'denied',
    aiSuggestions: ['Review documentation requirements', 'Consider alternative coding', 'Add medical necessity justification']
  }
];

const cptCodeData = [
  { code: '99213', denialRate: 15, volume: 45 },
  { code: '99214', denialRate: 8, volume: 32 },
  { code: '99215', denialRate: 35, volume: 18 },
  { code: '99212', denialRate: 5, volume: 28 },
  { code: '99211', denialRate: 3, volume: 15 }
];

export function RCMOptimizer() {
  const { t } = useLanguage();
  const { rtl, isRtl } = useRtl();
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>('all');
  const [showAISuggestions, setShowAISuggestions] = useState<string | null>(null);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'success';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'denied':
        return 'error';
      default:
        return 'warning';
    }
  };

  const filteredClaims = filterRiskLevel === 'all' 
    ? mockClaims 
    : mockClaims.filter(claim => claim.riskLevel === filterRiskLevel);

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaims(prev => 
      prev.includes(claimId) 
        ? prev.filter(id => id !== claimId)
        : [...prev, claimId]
    );
  };

  const toggleAISuggestions = (claimId: string) => {
    setShowAISuggestions(showAISuggestions === claimId ? null : claimId);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={isRtl ? 'text-right' : 'text-left'}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('rcm.title')}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          {t('rcm.subtitle')}
        </p>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''} justify-between`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-primary-100">{t('rcm.totalClaims')}</p>
              <p className="text-2xl font-bold">1,247</p>
              <p className="text-sm text-primary-200">+12% {t('rcm.fromLastMonth')}</p>
            </div>
            <TrendingUp size={32} className="text-primary-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-success-500 to-success-600 text-white">
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''} justify-between`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-success-100">{t('rcm.collectionRate')}</p>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-sm text-success-200">+2.1% {t('rcm.improvement')}</p>
            </div>
            <CheckCircle size={32} className="text-success-200" />
          </div>
        </Card>

        <Card className="bg-gradient-to-r from-warning-500 to-warning-600 text-white">
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : ''} justify-between`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-warning-100">{t('rcm.highRiskClaims')}</p>
              <p className="text-2xl font-bold">23</p>
              <p className="text-sm text-warning-200">{t('rcm.requiresAttention')}</p>
            </div>
            <AlertTriangle size={32} className="text-warning-200" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Heatmap */}
        <Card title={t('rcm.riskHeatmap')} icon={<LineChart size={20} />}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between text-sm font-medium text-neutral-600 dark:text-neutral-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span>{t('rcm.cptCode')}</span>
              <span>{t('rcm.denialRate')}</span>
            </div>
            {cptCodeData.map((item) => (
              <div key={item.code} className={`flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                  <span className="font-mono font-medium">{item.code}</span>
                  <span className="text-sm text-neutral-500">({item.volume} {t('rcm.claims')})</span>
                </div>
                <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <div className="w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className={item.denialRate > 25 ? 'h-2 rounded-full bg-error-500' : 
                        item.denialRate > 15 ? 'h-2 rounded-full bg-warning-500' : 'h-2 rounded-full bg-success-500'
                      }
                      style={{ width: `${Math.min(item.denialRate * 2, 100)}%` }}
                    />
                  </div>
                  <span className={item.denialRate > 25 ? 'text-sm font-medium text-error-600' : 
                    item.denialRate > 15 ? 'text-sm font-medium text-warning-600' : 'text-sm font-medium text-success-600'}>
                    {item.denialRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Claims List */}
        <Card 
          title={t('rcm.highRiskClaimsList')} 
          icon={<AlertTriangle size={20} />}
          headerAction={
            <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
              <select 
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="text-sm border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 dark:bg-neutral-800"
                title={t('rcm.allRiskLevels')}
                aria-label={t('rcm.allRiskLevels')}
              >
                <option value="all">{t('rcm.allRiskLevels')}</option>
                <option value="high">{t('rcm.highRisk')}</option>
                <option value="medium">{t('rcm.mediumRisk')}</option>
                <option value="low">{t('rcm.lowRisk')}</option>
              </select>
              <Button variant="ghost" size="sm">
                <Filter size={16} />
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-3">
                <div className={`flex items-center justify-between mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center ${isRtl ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                    <input
                      type="checkbox"
                      checked={selectedClaims.includes(claim.id)}
                      onChange={() => toggleClaimSelection(claim.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      aria-label={`Select claim ${claim.id}`}
                      title={`Select claim ${claim.id}`}
                    />
                    <span className="font-medium">{claim.id}</span>
                    <Badge variant={getRiskColor(claim.riskLevel)} size="sm">
                      {t(`rcm.${claim.riskLevel}Risk`.toLowerCase())}
                    </Badge>
                  </div>
                  <Badge variant={getStatusColor(claim.status)} size="sm">
                    {claim.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                  <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-neutral-500">{t('rcm.patient')}: </span>
                    <span className="font-medium">{claim.patientName}</span>
                  </div>
                  <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-neutral-500">{t('rcm.cptCode')}: </span>
                    <span className="font-mono">{claim.cptCode}</span>
                  </div>
                  <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-neutral-500">{t('rcm.amount')}: </span>
                    <span className="font-medium">${claim.amount.toFixed(2)}</span>
                  </div>
                  <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-neutral-500">{t('rcm.denialRate')}: </span>
                    <span className={claim.denialRate > 25 ? 'font-medium text-error-600' : 
                      claim.denialRate > 15 ? 'font-medium text-warning-600' : 'font-medium text-success-600'}>
                      {claim.denialRate}%
                    </span>
                  </div>
                </div>

                {claim.aiSuggestions.length > 0 && (
                  <div className={`mt-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAISuggestions(claim.id)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {t('rcm.viewAISuggestions')} ({claim.aiSuggestions.length})
                    </Button>
                    
                    {showAISuggestions === claim.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800"
                      >
                        <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-2">{t('rcm.aiRecommendations')}</h4>
                        <ul className="space-y-1">
                          {claim.aiSuggestions.map((suggestion, index) => (
                            <li key={index} className={`text-sm text-primary-700 dark:text-primary-300 flex items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <span className={isRtl ? 'ml-2' : 'mr-2'}>•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {selectedClaims.length > 0 && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
                  {selectedClaims.length} {t('rcm.claimsSelected')}
                </span>
                <Button size="sm">
                  {t('rcm.bulkApplyAI')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <div className={`flex ${isRtl ? 'justify-start' : 'justify-end'} ${isRtl ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
        <Button variant="ghost">
          <Download size={16} className={isRtl ? 'ml-2' : 'mr-2'} />
          {t('rcm.exportReport')}
        </Button>
        <Button>
          {t('rcm.runAnalysis')}
        </Button>
      </div>
    </div>
  );
}
