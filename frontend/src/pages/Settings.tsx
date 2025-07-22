import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Cog, Palette, Users, HelpCircle, ToggleLeft, Webhook, Eye, Moon, Sun, Globe, Languages } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'DocuLinc' | 'DataLinc' | 'TeleLinc' | 'IoTLinc';
  status: 'enabled' | 'disabled';
  lastActivity: string;
  webhookUrl: string;
  description: string;
}

const mockAgents: Agent[] = [
  {
    id: 'AGT-001',
    name: 'DocuLinc AI Assistant',
    type: 'DocuLinc',
    status: 'enabled',
    lastActivity: '5 min ago',
    webhookUrl: 'https://api.brainsait.com/webhook/doculinc',
    description: 'AI-powered clinical documentation and coding assistant'
  },
  {
    id: 'AGT-002',
    name: 'DataLinc Analytics',
    type: 'DataLinc',
    status: 'enabled',
    lastActivity: '2 min ago',
    webhookUrl: 'https://api.brainsait.com/webhook/datalinc',
    description: 'Healthcare data analytics and insights engine'
  },
  {
    id: 'AGT-003',
    name: 'TeleLinc Concierge',
    type: 'TeleLinc',
    status: 'enabled',
    lastActivity: '1 hour ago',
    webhookUrl: 'https://api.brainsait.com/webhook/telelinc',
    description: 'Telehealth platform integration and management'
  },
  {
    id: 'AGT-004',
    name: 'IoTLinc Hub',
    type: 'IoTLinc',
    status: 'disabled',
    lastActivity: '3 days ago',
    webhookUrl: 'https://api.brainsait.com/webhook/iotlinc',
    description: 'IoT device management and data processing'
  }
];

export function Settings() {
  const [activeTab, setActiveTab] = useState('theme');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const tabs = [
    { id: 'theme', label: t('settings.themeSettings'), icon: <Palette size={18} /> },
    { id: 'language', label: t('settings.languageLocalization'), icon: <Globe size={18} /> },
    { id: 'agents', label: t('settings.agentManagement'), icon: <Users size={18} /> },
    { id: 'help', label: t('settings.helpDocumentation'), icon: <HelpCircle size={18} /> }
  ];

  const toggleAgentStatus = (agentId: string) => {
    // In a real app, this would make an API call
    console.log(`Toggling agent ${agentId}`);
  };

  const getAgentTypeColor = (type: string) => {
    switch (type) {
      case 'DocuLinc':
        return 'primary';
      case 'DataLinc':
        return 'success';
      case 'TeleLinc':
        return 'secondary'; // Changed from 'info' to 'secondary'
      case 'IoTLinc':
        return 'warning';
      default:
        return 'default'; // Changed from 'neutral' to 'default'
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('settings.title')}</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card title="Settings Menu" icon={<Cog size={20} />}>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'theme' && (
            <Card title="Theme Settings" icon={<Palette size={20} />}>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Appearance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        !isDarkMode ? 'border-primary-500 bg-primary-50' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      onClick={() => setIsDarkMode(false)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Sun className="w-6 h-6 text-yellow-500" />
                        <span className="font-medium">Light Theme</span>
                      </div>
                      <div className="bg-white rounded border p-3 shadow-sm">
                        <div className="flex space-x-1 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-neutral-200 rounded"></div>
                          <div className="h-2 bg-neutral-200 rounded w-3/4"></div>
                          <div className="h-2 bg-primary-200 rounded w-1/2"></div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 mt-2">Clean white background with soft blue accents</p>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isDarkMode ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      onClick={() => setIsDarkMode(true)}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Moon className="w-6 h-6 text-blue-400" />
                        <span className="font-medium">Dark Theme</span>
                      </div>
                      <div className="bg-neutral-800 rounded border border-neutral-700 p-3 shadow-sm">
                        <div className="flex space-x-1 mb-2">
                          <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 bg-neutral-600 rounded"></div>
                          <div className="h-2 bg-neutral-600 rounded w-3/4"></div>
                          <div className="h-2 bg-teal-400 rounded w-1/2"></div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 mt-2">Navy blues with mint green accents</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Typography</h3>
                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Inter Font Family</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Clean, modern sans-serif font applied throughout</p>
                      </div>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">Brand Colors</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-teal-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-sm font-medium">Primary</p>
                      <p className="text-xs text-neutral-500">#14B8A6</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-sm font-medium">Secondary</p>
                      <p className="text-xs text-neutral-500">#3B82F6</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-emerald-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-sm font-medium">Success</p>
                      <p className="text-xs text-neutral-500">#10B981</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-500 rounded-lg mx-auto mb-2"></div>
                      <p className="text-sm font-medium">Error</p>
                      <p className="text-xs text-neutral-500">#EF4444</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    {t('settings.applyChanges')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'language' && (
            <Card title={t('settings.languageLocalization')} icon={<Globe size={20} />}>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">{t('settings.language')}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">{t('settings.selectLanguage')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        language === 'en' ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      onClick={() => setLanguage('en')}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Languages className="w-6 h-6 text-blue-500" />
                        <span className="font-medium">English</span>
                      </div>
                      <div className="bg-white dark:bg-dark-800 rounded border border-neutral-200 dark:border-neutral-700 p-3 shadow-sm">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Dashboard</div>
                          <div className="text-xs text-neutral-500">Healthcare Analytics Dashboard</div>
                          <div className="text-xs text-accent-600">Left-to-right text direction</div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">English (US) - Default language</p>
                    </div>

                    <div 
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        language === 'ar' ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10' : 'border-neutral-300 dark:border-neutral-600'
                      }`}
                      onClick={() => setLanguage('ar')}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <Languages className="w-6 h-6 text-emerald-500" />
                        <span className="font-medium">العربية</span>
                      </div>
                      <div className="bg-white dark:bg-dark-800 rounded border border-neutral-200 dark:border-neutral-700 p-3 shadow-sm" dir="rtl">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">لوحة التحكم</div>
                          <div className="text-xs text-neutral-500">لوحة تحليلات الرعاية الصحية</div>
                          <div className="text-xs text-accent-600">اتجاه النص من اليمين إلى اليسار</div>
                        </div>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">Arabic - العربية</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-3">{t('settings.textDirection')}</h3>
                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {language === 'ar' ? t('settings.rightToLeft') : t('settings.leftToRight')}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {language === 'ar' ? 'RTL - Right to Left' : 'LTR - Left to Right'}
                        </p>
                      </div>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    {t('settings.applyChanges')}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'agents' && (
            <Card title="LINC Agent Management" icon={<Users size={20} />}>
              <div className="space-y-4">
                {mockAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge variant={getAgentTypeColor(agent.type)} size="sm">
                          {agent.type}
                        </Badge>
                        <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{agent.name}</h3>
                        <Badge variant={agent.status === 'enabled' ? 'success' : 'default'} size="sm">
                          {agent.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAgentStatus(agent.id)}
                        >
                          <ToggleLeft size={16} className="mr-1" />
                          {agent.status === 'enabled' ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{agent.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-neutral-500">Last Activity</p>
                        <p className="font-medium">{agent.lastActivity}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Agent ID</p>
                        <p className="font-mono text-xs">{agent.id}</p>
                      </div>
                      <div>
                        <p className="text-neutral-500">Webhook Status</p>
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'enabled' ? 'bg-success-500' : 'bg-neutral-400'
                          }`}></div>
                          <span className="text-xs">{agent.status === 'enabled' ? 'Active' : 'Inactive'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center space-x-2">
                        <Webhook size={16} className="text-neutral-500" />
                        <span className="text-sm text-neutral-500">Webhook configured</span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedAgent(agent)}>
                          <Webhook size={16} className="mr-1" />
                          Configure
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye size={16} className="mr-1" />
                          View Logs
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'help' && (
            <Card title="Help & Documentation" icon={<HelpCircle size={20} />}>
              <div className="space-y-6">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                      <HelpCircle size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium text-primary-900 dark:text-primary-100">BrainSAIT Documentation</h3>
                      <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">
                        Complete documentation for all BrainSAIT features and integrations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Getting Started</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Learn the basics of using BrainSAIT platform
                    </p>
                    <Button variant="ghost" size="sm">View Guide</Button>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">API Documentation</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Technical documentation for developers
                    </p>
                    <Button variant="ghost" size="sm">View API Docs</Button>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Video Tutorials</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Step-by-step video guides for key features
                    </p>
                    <Button variant="ghost" size="sm">Watch Videos</Button>
                  </div>

                  <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors">
                    <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">Support Center</h4>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                      Contact support and submit tickets
                    </p>
                    <Button variant="ghost" size="sm">Get Support</Button>
                  </div>
                </div>

                <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Contextual Tooltips</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      Hover over UI elements to see helpful tooltips with the teal BrainSAIT icon
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
                        <HelpCircle size={12} className="text-white" />
                      </div>
                      <span className="text-sm">Tooltips are enabled throughout the platform</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Webhook Configuration Modal */}
      {selectedAgent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setSelectedAgent(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">Configure {selectedAgent.name}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={selectedAgent.webhookUrl}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-neutral-800"
                  readOnly
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedAgent.status === 'enabled'}
                    className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">Enable this agent</span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setSelectedAgent(null)}>
                  Cancel
                </Button>
                <Button>
                  Save Configuration
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
