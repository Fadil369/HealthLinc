import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Lightbulb, Languages, Save, Mic, MicOff, Play, Pause, FileText, Brain, Maximize2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { mockClinicalNotes } from '../data/mockData';

export function ClinicalNotes() {
  const [selectedNote, setSelectedNote] = useState(mockClinicalNotes[0]);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [aiIsProcessing, setAiIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'fullscreen'>('split');
  
  useEffect(() => {
    document.title = "Clinical Notes | BrainSAIT";
    setNoteContent(selectedNote.content);
  }, [selectedNote]);

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start voice recording simulation
      setTimeout(() => {
        setNoteContent(prev => prev + "\n\n[Voice transcription] Patient reports improvement in symptoms since last visit. No adverse reactions to current medications.");
      }, 2000);
    }
  };

  const processWithAI = () => {
    setAiIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setAiIsProcessing(false);
      setShowAISuggestions(true);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Clinical Notes</h1>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              AI-assisted documentation and review
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={isRecording ? "primary" : "outline"}
              size="sm"
              icon={isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              onClick={toggleRecording}
            >
              {isRecording ? 'Stop Recording' : 'Voice Note'}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              icon={<Brain size={16} />}
              onClick={processWithAI}
              disabled={aiIsProcessing}
            >
              {aiIsProcessing ? 'Processing...' : 'AI Enhance'}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              icon={<MessageSquare size={16} />}
            >
              New Note
            </Button>
            <Button 
              variant="outline"
              size="sm"
              icon={<Maximize2 size={16} />}
              onClick={() => setViewMode(viewMode === 'split' ? 'fullscreen' : 'split')}
            >
              {viewMode === 'split' ? 'Fullscreen' : 'Split View'}
            </Button>
          </div>
        </div>
      </motion.div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <Card title="Clinical Notes">
              <div className="space-y-1">
                {mockClinicalNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg cursor-pointer ${
                      note.id === selectedNote.id 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800' 
                        : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent'
                    }`}
                    onClick={() => setSelectedNote(note)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{note.patientName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        note.status === 'draft' ? 'bg-neutral-100 text-neutral-600' : 
                        note.status === 'ai-review' ? 'bg-warning-100 text-warning-600' :
                        note.status === 'reviewed' ? 'bg-secondary-100 text-secondary-600' :
                        'bg-success-100 text-success-600'
                      }`}>
                        {note.status === 'ai-review' ? 'AI Review' : 
                         note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                      {note.date}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
        
        <div className="lg:col-span-3">
          <Card
            title={`Note for ${selectedNote.patientName} - ${selectedNote.date}`}
            className="h-full"
            footer={
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<Lightbulb size={16} />}
                    onClick={() => setShowAISuggestions(!showAISuggestions)}
                  >
                    {showAISuggestions ? 'Hide AI' : 'Show AI'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    icon={<Languages size={16} />}
                  >
                    Translate
                  </Button>
                </div>
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={<Save size={16} />}
                >
                  Save Note
                </Button>
              </div>
            }
          >
            <div className={`flex flex-col ${viewMode === 'split' ? 'lg:flex-row' : ''} gap-4 h-[600px]`}>
              <div className={`${viewMode === 'split' ? 'lg:w-1/2' : 'w-full'} border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 overflow-hidden`}>
                <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-700">
                  <h4 className="font-medium text-sm text-neutral-700 dark:text-neutral-300 flex items-center">
                    <FileText size={16} className="mr-2" />
                    Clinical Documentation
                  </h4>
                  <div className="flex space-x-2">
                    {isRecording && (
                      <Badge variant="error" size="sm" className="animate-pulse">
                        Recording
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">
                      <Languages size={14} />
                    </Button>
                  </div>
                </div>
                <div className="p-4 h-full overflow-y-auto">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Start typing your clinical note or use voice recording..."
                    className="w-full h-full resize-none border-none outline-none bg-transparent text-sm leading-relaxed"
                  />
                </div>
              </div>
              
              {(showAISuggestions && viewMode === 'split') && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:w-1/2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-3 border-b border-primary-200 dark:border-primary-800 bg-primary-100/50 dark:bg-primary-900/30">
                    <h4 className="font-medium text-sm text-primary-700 dark:text-primary-300 flex items-center">
                      <Brain size={16} className="mr-2" />
                      DocuLinc AI Assistant
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAISuggestions(false)}
                    >
                      ×
                    </Button>
                  </div>
                  
                  <div className="p-4 h-full overflow-y-auto space-y-4">
                    {/* AI Summary */}
                    <div className="bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-700 rounded-lg p-3">
                      <h5 className="font-medium text-sm text-primary-700 dark:text-primary-300 mb-2">
                        AI Summary
                      </h5>
                      <div className="text-sm space-y-1 text-neutral-600 dark:text-neutral-400">
                        <p>• Chief Complaint: Nasal congestion and allergic symptoms</p>
                        <p>• Duration: 2 weeks</p>
                        <p>• Assessment: Seasonal allergic rhinitis</p>
                        <p>• Treatment: Antihistamine therapy prescribed</p>
                      </div>
                    </div>

                    {/* Clinical Insights */}
                    <div className="bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-700 rounded-lg p-3">
                      <h5 className="font-medium text-sm text-primary-700 dark:text-primary-300 mb-2">
                        Clinical Insights
                      </h5>
                      <div className="space-y-2">
                        <div className="text-sm p-2 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded">
                          <p className="text-success-700 dark:text-success-300">
                            Treatment plan aligns with current guidelines for allergic rhinitis
                          </p>
                        </div>
                        <div className="text-sm p-2 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded">
                          <p className="text-warning-700 dark:text-warning-300">
                            Consider allergy testing if symptoms persist beyond 4 weeks
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm text-primary-700 dark:text-primary-300">
                        Documentation Suggestions
                      </h5>
                      {selectedNote.aiSuggestions?.map((suggestion, index) => (
                        <div 
                          key={index}
                          className="bg-white dark:bg-neutral-800 border border-primary-200 dark:border-primary-700 rounded-lg p-3"
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{suggestion}</p>
                            <div className="flex space-x-1 ml-2">
                              <Button variant="ghost" size="sm" className="text-xs text-success-600 hover:text-success-700">
                                Accept
                              </Button>
                              <Button variant="ghost" size="sm" className="text-xs text-neutral-500 hover:text-neutral-600">
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        More Suggestions
                      </Button>
                      <Button variant="primary" size="sm">
                        Apply All
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}