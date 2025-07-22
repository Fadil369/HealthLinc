import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Languages, 
  SendHorizonal, Volume2, VolumeX, Settings, Users, FileText, 
  Brain, Clock, Zap, Heart, Lightbulb
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';

export function TelehealthConcierge() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isRecording, setIsRecording] = useState(true);
  const [chatMessage, setChatMessage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [language, setLanguage] = useState('EN');
  const [aiSuggestions, setAiSuggestions] = useState([
    'Consider asking about medication compliance',
    'Previous allergy test results may be relevant',
    'Schedule follow-up in 2 weeks'
  ]);
  const [callDuration, setCallDuration] = useState(874); // seconds

  useEffect(() => {
    document.title = "Telehealth | BrainSAIT";
    
    // Simulate call timer
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim()) return;
    // Handle chat message logic here
    setChatMessage('');
  };
  
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Telehealth Concierge</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          Virtual appointment with Sophia Rodriguez
        </p>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full overflow-hidden">
            <div className="aspect-video bg-neutral-800 rounded-lg relative overflow-hidden">
              <img 
                src="https://images.pexels.com/photos/5215024/pexels-photo-5215024.jpeg" 
                alt="Patient in telehealth session" 
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-neutral-900 rounded-lg overflow-hidden border-2 border-white">
                <img 
                  src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg" 
                  alt="Doctor video feed" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-900/80 to-transparent p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-white font-medium">Sophia Rodriguez</p>
                      <p className="text-neutral-300 text-sm flex items-center">
                        <Clock size={12} className="mr-1" />
                        Connected: {formatDuration(callDuration)}
                      </p>
                    </div>
                    {isRecording && (
                      <Badge variant="error" size="sm" className="animate-pulse">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                        Recording
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 rounded-full transition-colors ${
                        isMuted ? 'bg-error-500 hover:bg-error-600' : 'bg-neutral-700 hover:bg-neutral-600'
                      }`}
                      onClick={() => setIsMuted(!isMuted)}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff size={20} className="text-white" /> : <Mic size={20} className="text-white" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 rounded-full transition-colors ${
                        isVideoOff ? 'bg-error-500 hover:bg-error-600' : 'bg-neutral-700 hover:bg-neutral-600'
                      }`}
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                    >
                      {isVideoOff ? <VideoOff size={20} className="text-white" /> : <Video size={20} className="text-white" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-neutral-700 hover:bg-neutral-600 rounded-full transition-colors"
                      title="Settings"
                    >
                      <Settings size={20} className="text-white" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 bg-error-500 hover:bg-error-600 rounded-full transition-colors"
                      title="End call"
                    >
                      <Phone size={20} className="text-white" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium flex items-center">
                  <FileText size={16} className="mr-2" />
                  Live Transcription
                  {isTranslating && (
                    <Badge variant="primary" size="sm" className="ml-2">
                      Translating
                    </Badge>
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="text-sm border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-800"
                  >
                    <option value="EN">English</option>
                    <option value="ES">Español</option>
                    <option value="FR">Français</option>
                    <option value="DE">Deutsch</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsTranslating(!isTranslating)}
                    className="flex items-center"
                  >
                    <Languages size={16} className="mr-1" />
                    {isTranslating ? 'Stop' : 'Translate'}
                  </Button>
                </div>
              </div>
              
              <div className="h-32 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 overflow-y-auto bg-neutral-50 dark:bg-neutral-800/50 relative">
                <div className="space-y-2">
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">
                    <span className="font-semibold text-primary-600">Dr. Chen:</span> How have you been feeling since our last appointment? Has the medication helped with your allergy symptoms?
                    {isTranslating && (
                      <span className="block text-xs text-neutral-500 italic mt-1">
                        [ES] ¿Cómo te has sentido desde nuestra última cita? ¿Te ha ayudado la medicación con los síntomas de alergia?
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-800 dark:text-neutral-200">
                    <span className="font-semibold text-success-600">Sophia:</span> The medication has definitely helped with the sneezing, but I'm still getting some congestion in the mornings...
                    {isTranslating && (
                      <span className="block text-xs text-neutral-500 italic mt-1">
                        [ES] La medicación definitivamente me ha ayudado con los estornudos, pero todavía tengo algo de congestión por las mañanas...
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center">
                    <span className="animate-pulse w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                    <span className="italic">Listening...</span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card title="AI Assistant" icon={<Brain size={20} />} className="h-full">
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto mb-4 space-y-3 max-h-96">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <Brain size={16} className="text-primary-700 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm border border-primary-200 dark:border-primary-800">
                    <p className="font-medium mb-1 text-primary-900 dark:text-primary-100">Welcome to your AI assistant</p>
                    <p className="text-primary-700 dark:text-primary-300">I can help you with patient history, medical records, and call insights.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Avatar size="sm" alt="Dr. Chen" className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 p-3 bg-neutral-100 dark:bg-neutral-700 rounded-lg text-sm">
                    <p>What's on Sophia's problem list?</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <Brain size={16} className="text-primary-700 dark:text-primary-400" />
                  </div>
                  <div className="flex-1 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-sm border border-primary-200 dark:border-primary-800">
                    <p className="text-primary-900 dark:text-primary-100 font-medium mb-2">Sophia's Active Problems:</p>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <Heart size={12} className="text-error-500 mr-2" />
                        <span className="text-primary-700 dark:text-primary-300">Seasonal allergic rhinitis (J30.2)</span>
                      </div>
                      <div className="flex items-center">
                        <Heart size={12} className="text-warning-500 mr-2" />
                        <span className="text-primary-700 dark:text-primary-300">Mild intermittent asthma (J45.20)</span>
                      </div>
                      <div className="flex items-center">
                        <Zap size={12} className="text-warning-500 mr-2" />
                        <span className="text-primary-700 dark:text-primary-300">Vitamin D deficiency (E55.9)</span>
                      </div>
                    </div>
                    <div className="mt-3 p-2 bg-white dark:bg-neutral-800 rounded border">
                      <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Current Medications:</p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">• Loratadine 10mg daily</p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">• Fluticasone nasal spray PRN</p>
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-warning-100 dark:bg-warning-900/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb size={16} className="text-warning-700 dark:text-warning-400" />
                  </div>
                  <div className="flex-1 p-3 bg-warning-50 dark:bg-warning-900/20 rounded-lg text-sm border border-warning-200 dark:border-warning-800">
                    <p className="font-medium text-warning-900 dark:text-warning-100 mb-2">Call Insights:</p>
                    <div className="space-y-1">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start">
                          <span className="text-warning-500 mr-2">•</span>
                          <span className="text-warning-700 dark:text-warning-300 text-xs">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ask about your patient..."
                  className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 pr-10 py-2 pl-3 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={sendChatMessage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-500 hover:text-primary-500"
                  title="Send message"
                >
                  <SendHorizonal size={18} />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}