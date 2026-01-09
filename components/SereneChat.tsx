"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Send, 
  Bot, 
  User, 
  AlertTriangle, 
  BookOpen, 
  CheckCircle,
  Sparkles,
  Maximize2,
  Minimize2
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import AssessmentModal from "@/components/AssessmentModal"

interface Message {
  id: string
  content: string
  sender: 'user' | 'serene'
  timestamp: Date
  type?: 'text' | 'crisis' | 'assessment' | 'homework'
  metadata?: any
}

interface UserProfile {
  name?: string
  preferredName?: string
  sessionGoals?: string[]
  concerns?: string[]
  previousSessions?: number
}

export default function SereneChat() {
  const { user } = useSupabaseAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showCrisisDialog, setShowCrisisDialog] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>({})
  const [sereneName, setSereneName] = useState("Serene")
  const [suggestedResponses, setSuggestedResponses] = useState<string[]>([])
  const [currentHomework, setCurrentHomework] = useState<any>(null)
  const [showAssessment, setShowAssessment] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [assessmentResults, setAssessmentResults] = useState<any>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Initialize conversation
  useEffect(() => {
    if (!sessionStarted && user) {
      initializeSession()
    }
  }, [user, sessionStarted])

  const initializeSession = () => {
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      content: `Hi there! I'm ${sereneName}. I'm really glad you're here. 

This is your safe space - no judgment, just genuine care and support. 

How are you feeling right now?`,
      sender: 'serene',
      timestamp: new Date(),
      type: 'text'
    }
    
    setMessages([welcomeMessage])
    setSessionStarted(true)
    setSuggestedResponses([
      "I'm not doing great today",
      "I've been feeling anxious",
      "I'm struggling with some things",
      "I just need someone to talk to",
      "I'm feeling overwhelmed"
    ])
  }

  const sendMessage = async (content: string, isQuickReply = false) => {
    console.log('SendMessage called with:', content) // Debug log
    if (!content.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage("")
    setIsTyping(true)
    setSuggestedResponses([])

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationHistory: messages,
          userProfile
        })
      })

      const data = await response.json()

      if (data.isCrisis) {
        setShowCrisisDialog(true)
      }

      const sereneMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'serene',
        timestamp: new Date(),
        type: data.isCrisis ? 'crisis' : 'text',
        metadata: data
      }

      setMessages(prev => [...prev, sereneMessage])
      setSuggestedResponses(data.suggestedResponses || [])
      
      if (data.homework) {
        setCurrentHomework(data.homework)
      }

      if (data.shouldSuggestAssessment && !showAssessment && !assessmentResults) {
        setTimeout(() => setShowAssessment(true), 2000)
      }

    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I'm having trouble connecting right now. Please try again in a moment. ${error instanceof Error ? error.message : ''}`,
        sender: 'serene',
        timestamp: new Date(),
        type: 'text'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleAssessmentComplete = (results: any) => {
    setAssessmentResults(results)
    setUserProfile(prev => ({ ...prev, assessmentResults: results }))
    
    // Send assessment results to Serene
    const assessmentMessage = `I've completed the assessment. Here are my results: Risk level: ${results.riskLevel}, Total score: ${results.totalScore}. Based on this, what would you recommend for my mental health journey?`
    sendMessage(assessmentMessage)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputMessage.trim()) {
        sendMessage(inputMessage)
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
  }

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  // Focus input when entering fullscreen
  useEffect(() => {
    if (isFullscreen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isFullscreen])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const toggleFullscreen = () => {
    console.log('Toggle fullscreen called, current state:', isFullscreen) // Debug log
    setIsFullscreen(!isFullscreen)
  }

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 md:inset-0 pt-14 pb-16 md:pt-0 md:pb-0 z-[9999] bg-background flex flex-col overflow-hidden">
        {/* Fullscreen Chat Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/95 backdrop-blur-sm shadow-sm flex-shrink-0">
          <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm sm:text-base truncate">{sereneName}</h2>
              <Badge variant="secondary" className="text-xs font-medium">AI</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "Typing..." : "Online • Always here for you"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-9 w-9 p-0 hover:bg-muted/80 transition-colors touch-manipulation"
            title="Exit fullscreen"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Fullscreen Chat Content */}
        <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-b from-background via-background to-muted/20">
          {/* Chat Messages */}
          <ScrollArea className="flex-1 px-3 sm:px-4">
            <div className="space-y-3 sm:space-y-4 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'serene' && (
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-primary/20 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto shadow-sm'
                        : 'bg-muted/80 backdrop-blur-sm border border-border/50 shadow-sm'
                    }`}
                  >
                    <div className="text-sm sm:text-base leading-relaxed">
                      {message.content.split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                    <div className="text-xs opacity-60 mt-1 sm:mt-2">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>

                  {message.sender === 'user' && (
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-4 py-3 max-w-[80%] border border-border/50">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Section */}
          <div className="border-t bg-background/95 backdrop-blur-sm px-3 py-3 sm:px-4 sm:py-4 flex-shrink-0">
            <div className="flex gap-2 items-end max-w-4xl mx-auto">
              <Textarea
                ref={inputRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
                placeholder="Share what's on your mind..."
                className="min-h-[44px] sm:min-h-[52px] resize-none flex-1 max-h-32 text-sm sm:text-base border-2 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation"
                rows={1}
              />
              <Button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className="h-11 w-11 sm:h-12 sm:w-12 p-0 flex-shrink-0 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 touch-manipulation"
                size="sm"
                type="button"
              >
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Crisis Dialog */}
        <AlertDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Immediate Support Available
              </AlertDialogTitle>
              <AlertDialogDescription>
                I'm concerned about your safety. Please know that help is available right now.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Crisis Resources:</h4>
                <ul className="text-sm space-y-1">
                  <li>• National Suicide Prevention Lifeline: <strong>988</strong></li>
                  <li>• Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
                  <li>• Emergency Services: <strong>911</strong></li>
                </ul>
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Chatting</AlertDialogCancel>
              <AlertDialogAction asChild>
                <a href="tel:988" className="bg-red-600 hover:bg-red-700">
                  Call 988 Now
                </a>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent> 
        </AlertDialog>

        {/* Assessment Modal */}
        <AssessmentModal
          open={showAssessment}
          onOpenChange={setShowAssessment}
          onComplete={handleAssessmentComplete}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto relative">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-3 sm:mb-4 px-3 sm:px-4 py-3 border-b bg-background/95 backdrop-blur-sm">
        <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-sm sm:text-base truncate">{sereneName}</h2>
            <Badge variant="secondary" className="text-xs font-medium">AI</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {isTyping ? "Typing..." : "Online • Always here for you"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleFullscreen}
          className="h-9 w-9 p-0 hover:bg-muted/80 transition-colors rounded-full touch-manipulation md:hover:bg-muted/80"
          title="Expand to fullscreen"
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0 shadow-sm border-0 sm:border bg-background/50 backdrop-blur-sm">
        <ScrollArea className="flex-1 px-3 sm:px-4 min-h-0">
          <div className="space-y-3 sm:space-y-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 sm:gap-3 ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.sender === 'serene' && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : message.type === 'crisis'
                      ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 shadow-sm'
                      : 'bg-muted/80 backdrop-blur-sm border border-border/50 shadow-sm'
                  }`}
                >
                  <p className="text-sm sm:text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <p className="text-xs opacity-60 mt-1 sm:mt-2">
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {message.sender === 'user' && (
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-3 w-3 sm:h-4 sm:w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 sm:gap-3 justify-start">
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-primary/20 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted/80 backdrop-blur-sm rounded-2xl px-4 py-3 border border-border/50">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Responses */}
        {suggestedResponses.length > 0 && (
          <div className="px-3 sm:px-4 py-3 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Quick responses:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedResponses.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(suggestion, true)}
                  className="text-xs sm:text-sm h-8 px-3 rounded-full border-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all hover:scale-105"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Homework/Exercise Card */}
        {currentHomework && (
          <div className="px-3 sm:px-4 py-3 border-t bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/10 dark:to-purple-950/10">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 shadow-sm">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base truncate">{currentHomework.title}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">
                      {currentHomework.description}
                    </p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {currentHomework.type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentHomework(null)}
                    className="h-8 w-8 p-0 rounded-full hover:bg-green-100 dark:hover:bg-green-950/20"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Message Input */}
        <div className="px-3 py-3 sm:px-4 sm:py-4 border-t bg-background/95 backdrop-blur-sm">
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <Textarea
              ref={inputRef}
              value={inputMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyPress}
              placeholder="Share what's on your mind..."
              className="min-h-[44px] sm:min-h-[52px] resize-none flex-1 max-h-32 text-sm sm:text-base border-2 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all touch-manipulation"
              rows={1}
            />
            <Button
              onClick={() => sendMessage(inputMessage)}
              disabled={!inputMessage.trim() || isTyping}
              className="h-11 w-11 sm:h-12 sm:w-12 p-0 flex-shrink-0 rounded-full shadow-lg hover:shadow-xl transition-all bg-primary hover:bg-primary/90 touch-manipulation"
              size="sm"
              type="button"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center hidden sm:block">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </Card>

      {/* Crisis Dialog */}
      <AlertDialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Immediate Support Available
            </AlertDialogTitle>
            <AlertDialogDescription>
              I'm concerned about your safety. Please know that help is available right now.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Crisis Resources:</h4>
              <ul className="text-sm space-y-1">
                <li>• National Suicide Prevention Lifeline: <strong>988</strong></li>
                <li>• Crisis Text Line: Text <strong>HOME</strong> to <strong>741741</strong></li>
                <li>• Emergency Services: <strong>911</strong></li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Chatting</AlertDialogCancel>
            <AlertDialogAction asChild>
              <a href="tel:988" className="bg-red-600 hover:bg-red-700">
                Call 988 Now
              </a>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent> 
      </AlertDialog>

      {/* Assessment Modal */}
      <AssessmentModal
        open={showAssessment}
        onOpenChange={setShowAssessment}
        onComplete={handleAssessmentComplete}
      />
    </div>
  )
}