import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation keys
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.patients': 'Patients',
    'nav.appointments': 'Appointments',
    'nav.clinicalNotes': 'Clinical Notes',
    'nav.priorAuth': 'Prior Auth',
    'nav.telehealth': 'Telehealth',
    'nav.rcmOptimizer': 'RCM Optimizer',
    'nav.monitorCompliance': 'Monitor & Compliance',
    'nav.iotDataHub': 'IoT Data Hub',
    'nav.settings': 'Settings',
    
    // Dashboard
    'dashboard.title': 'Healthcare Analytics Dashboard',
    'dashboard.subtitle': 'Comprehensive view of your healthcare operations',
    'dashboard.activePatients': 'Active Patients',
    'dashboard.upcomingAppointments': 'Upcoming Appointments',
    'dashboard.notesToReview': 'Notes to Review',
    'dashboard.authorizationsPending': 'Authorizations Pending',
    'dashboard.liveTelehealthSessions': 'Live Telehealth Sessions',
    'dashboard.systemHealth': 'System Health',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.newPatient': 'New Patient',
    'dashboard.scheduleVisit': 'Schedule Visit',
    'dashboard.uploadDeviceData': 'Upload Device Data',
    'dashboard.runRcmScan': 'Run RCM Scan',
    
    // Common
    'common.search': 'Search patients, appointments...',
    'common.notificationBell': 'Notifications',
    'common.profile': 'My Profile',
    'common.signOut': 'Sign out',
    'common.systemHealthOptimal': 'System Health: Optimal',
    'common.version': 'BrainSAIT v1.0',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Configure your BrainSAIT platform preferences and integrations',
    'settings.themeSettings': 'Theme Settings',
    'settings.agentManagement': 'Agent Management',
    'settings.helpDocumentation': 'Help & Documentation',
    'settings.languageLocalization': 'Language & Localization',
    'settings.appearance': 'Appearance',
    'settings.lightTheme': 'Light Theme',
    'settings.darkTheme': 'Dark Theme',
    'settings.language': 'Language',
    'settings.selectLanguage': 'Select your preferred language',
    'settings.textDirection': 'Text Direction',
    'settings.leftToRight': 'Left to Right (LTR)',
    'settings.rightToLeft': 'Right to Left (RTL)',
    'settings.applyChanges': 'Apply Changes',
    
    // User Info
    'user.name': 'Dr. Sarah Wilson',
    'user.role': 'Physician',
    'user.email': 'sarah.wilson@brainsait.com',
    
    // RCM Optimizer
    'rcm.title': 'RCM Optimizer & Analytics',
    'rcm.subtitle': 'AI-powered revenue cycle management and claims optimization',
    'rcm.totalClaims': 'Total Claims',
    'rcm.collectionRate': 'Collection Rate',
    'rcm.highRiskClaims': 'High Risk Claims',
    'rcm.requiresAttention': 'Requires attention',
    'rcm.improvement': 'improvement',
    'rcm.fromLastMonth': 'from last month',
    'rcm.riskHeatmap': 'Risk Heatmap',
    'rcm.claims': 'claims',
    'rcm.denialRate': 'Denial Rate',
    'rcm.highRiskClaimsList': 'High-Risk Claims',
    'rcm.allRiskLevels': 'All Risk Levels',
    'rcm.highRisk': 'High Risk',
    'rcm.mediumRisk': 'Medium Risk',
    'rcm.lowRisk': 'Low Risk',
    'rcm.risk': 'risk',
    'rcm.patient': 'Patient',
    'rcm.cptCode': 'CPT',
    'rcm.amount': 'Amount',
    'rcm.viewAISuggestions': 'View AI Suggestions',
    'rcm.aiRecommendations': 'AI Recommendations:',
    'rcm.claimsSelected': 'claims selected',
    'rcm.bulkApplyAI': 'Bulk Apply AI Corrections',
    'rcm.exportReport': 'Export Report',
    'rcm.runAnalysis': 'Run RCM Analysis',
  },
  ar: {
    // Navigation - Arabic translations
    'nav.dashboard': 'لوحة التحكم',
    'nav.patients': 'المرضى',
    'nav.appointments': 'المواعيد',
    'nav.clinicalNotes': 'الملاحظات السريرية',
    'nav.priorAuth': 'التصريح المسبق',
    'nav.telehealth': 'التطبيب عن بُعد',
    'nav.rcmOptimizer': 'محسن إدارة الإيرادات',
    'nav.monitorCompliance': 'المراقبة والامتثال',
    'nav.iotDataHub': 'مركز بيانات إنترنت الأشياء',
    'nav.settings': 'الإعدادات',
    
    // Dashboard - Arabic translations
    'dashboard.title': 'لوحة تحليلات الرعاية الصحية',
    'dashboard.subtitle': 'نظرة شاملة على عمليات الرعاية الصحية الخاصة بك',
    'dashboard.activePatients': 'المرضى النشطون',
    'dashboard.upcomingAppointments': 'المواعيد القادمة',
    'dashboard.notesToReview': 'الملاحظات للمراجعة',
    'dashboard.authorizationsPending': 'التصاريح المعلقة',
    'dashboard.liveTelehealthSessions': 'جلسات التطبيب المباشرة',
    'dashboard.systemHealth': 'حالة النظام',
    'dashboard.quickActions': 'الإجراءات السريعة',
    'dashboard.newPatient': 'مريض جديد',
    'dashboard.scheduleVisit': 'جدولة زيارة',
    'dashboard.uploadDeviceData': 'رفع بيانات الجهاز',
    'dashboard.runRcmScan': 'تشغيل فحص إدارة الإيرادات',
    
    // Common - Arabic translations
    'common.search': 'البحث عن المرضى والمواعيد...',
    'common.notificationBell': 'الإشعارات',
    'common.profile': 'ملفي الشخصي',
    'common.signOut': 'تسجيل الخروج',
    'common.systemHealthOptimal': 'حالة النظام: مثلى',
    'common.version': 'براين سايت الإصدار 1.0',
    
    // Settings - Arabic translations
    'settings.title': 'الإعدادات',
    'settings.subtitle': 'تكوين تفضيلات منصة براين سايت والتكامل',
    'settings.themeSettings': 'إعدادات المظهر',
    'settings.agentManagement': 'إدارة الوكلاء',
    'settings.helpDocumentation': 'المساعدة والوثائق',
    'settings.languageLocalization': 'اللغة والترجمة',
    'settings.appearance': 'المظهر',
    'settings.lightTheme': 'المظهر الفاتح',
    'settings.darkTheme': 'المظهر الداكن',
    'settings.language': 'اللغة',
    'settings.selectLanguage': 'اختر لغتك المفضلة',
    'settings.textDirection': 'اتجاه النص',
    'settings.leftToRight': 'من اليسار إلى اليمين',
    'settings.rightToLeft': 'من اليمين إلى اليسار',
    'settings.applyChanges': 'تطبيق التغييرات',
    
    // User Info - Arabic translations
    'user.name': 'د. سارة ويلسون',
    'user.role': 'طبيبة',
    'user.email': 'sarah.wilson@brainsait.com',
    
    // RCM Optimizer - Arabic translations
    'rcm.title': 'محسن إدارة الإيرادات والتحليلات',
    'rcm.subtitle': 'إدارة دورة الإيرادات وتحسين المطالبات بمساعدة الذكاء الاصطناعي',
    'rcm.totalClaims': 'إجمالي المطالبات',
    'rcm.collectionRate': 'معدل التحصيل',
    'rcm.highRiskClaims': 'مطالبات عالية الخطورة',
    'rcm.requiresAttention': 'تتطلب اهتمام',
    'rcm.improvement': 'تحسن',
    'rcm.fromLastMonth': 'من الشهر الماضي',
    'rcm.riskHeatmap': 'خريطة حرارة المخاطر',
    'rcm.claims': 'مطالبات',
    'rcm.denialRate': 'معدل الرفض',
    'rcm.highRiskClaimsList': 'المطالبات عالية الخطورة',
    'rcm.allRiskLevels': 'جميع مستويات المخاطر',
    'rcm.highRisk': 'مخاطر عالية',
    'rcm.mediumRisk': 'مخاطر متوسطة',
    'rcm.lowRisk': 'مخاطر منخفضة',
    'rcm.risk': 'خطر',
    'rcm.patient': 'المريض',
    'rcm.cptCode': 'رمز CPT',
    'rcm.amount': 'المبلغ',
    'rcm.viewAISuggestions': 'عرض اقتراحات الذكاء الاصطناعي',
    'rcm.aiRecommendations': 'توصيات الذكاء الاصطناعي:',
    'rcm.claimsSelected': 'تم تحديد المطالبات',
    'rcm.bulkApplyAI': 'تطبيق تصحيحات الذكاء الاصطناعي بالجملة',
    'rcm.exportReport': 'تصدير التقرير',
    'rcm.runAnalysis': 'تشغيل تحليل إدارة الإيرادات',
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('brainsait-language', lang);
    
    // Update document direction and lang attribute
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('brainsait-language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
      setLanguage(savedLang);
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
