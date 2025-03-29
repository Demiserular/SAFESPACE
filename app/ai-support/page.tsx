"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, AlertTriangle, Info, ArrowRight, MessageSquare, ThumbsUp, ThumbsDown, Users, ArrowLeft } from "lucide-react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

// Emotion detection patterns (simplified for demo)
const emotionPatterns = {
  sadness: [
    "sad",
    "depressed",
    "unhappy",
    "miserable",
    "heartbroken",
    "down",
    "blue",
    "grief",
    "hopeless",
    "lonely",
    "alone",
    "isolated",
  ],
  anxiety: [
    "anxious",
    "worried",
    "nervous",
    "panic",
    "fear",
    "scared",
    "stress",
    "overwhelmed",
    "afraid",
    "terrified",
    "uneasy",
    "restless",
  ],
  anger: [
    "angry",
    "mad",
    "frustrated",
    "irritated",
    "annoyed",
    "furious",
    "rage",
    "hate",
    "resent",
    "bitter",
    "outraged",
    "hostile",
  ],
  crisis: [
    "suicide",
    "kill myself",
    "end my life",
    "don't want to live",
    "better off dead",
    "can't go on",
    "no reason to live",
    "harm myself",
    "hurt myself",
    "self-harm",
    "die",
    "death",
  ],
}

// Crisis detection function
function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase()
  return emotionPatterns.crisis.some((term) => lowerMessage.includes(term))
}

// Emotion detection function
function detectEmotion(message: string): string {
  const lowerMessage = message.toLowerCase()

  for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
    if (emotion === "crisis") continue // Skip crisis for emotion detection
    if (patterns.some((pattern) => lowerMessage.includes(pattern))) {
      return emotion
    }
  }

  return "neutral"
}

// Daily tips and affirmations
const dailyTips = [
  "Take a few minutes today to practice deep breathing when you feel stressed.",
  "Remember that your thoughts are not facts - try to observe them without judgment.",
  "Small acts of self-care can make a big difference. What's one tiny thing you can do for yourself today?",
  "Try the 5-4-3-2-1 grounding technique: notice 5 things you see, 4 things you feel, 3 things you hear, 2 things you smell, and 1 thing you taste.",
  "Your emotions are valid, even if they feel overwhelming. They're giving you information about your needs.",
  "Progress isn't linear. Having a setback doesn't erase the progress you've made.",
  "You don't have to be productive to be worthy. Your value isn't tied to what you accomplish.",
  "It's okay to set boundaries with people, even those you care about.",
  "Comparison is the thief of joy. Your journey is uniquely yours.",
  "You are not alone in your struggles, even when it feels that way.",
]

const affirmations = [
  "I am worthy of love and respect, exactly as I am.",
  "I trust myself to handle whatever challenges come my way.",
  "My feelings are valid, and I allow myself to experience them fully.",
  "I am growing and learning every day, even when it's difficult.",
  "I deserve peace and happiness in my life.",
  "I am resilient and can overcome obstacles.",
  "I choose to focus on what I can control and let go of what I cannot.",
  "I am enough, just as I am right now.",
  "I treat myself with the same kindness and compassion I offer to others.",
  "I acknowledge my struggles while celebrating my strengths.",
]

// Add more specialized therapeutic responses
const therapeuticResponses = {
  depression: {
    responses: [
      "I hear how difficult things are right now. Depression can make everything feel overwhelming. Let's break things down into smaller, manageable steps. What's one tiny thing you could do for self-care today?",
      "Your feelings are valid, and depression is not your fault. Would you like to explore some gentle activities that might help lift your mood a bit?",
      "Sometimes depression lies to us about our worth. Remember that you deserve support and care, even if you don't feel that way right now."
    ],
    suggestions: ["Take a short walk", "Listen to uplifting music", "Reach out to a friend", "Practice self-compassion"]
  },
  anxiety: {
    responses: [
      "I notice you're feeling anxious. Let's try a quick grounding exercise together. Can you name 5 things you can see right now?",
      "Anxiety can make our thoughts race. Would you like to try a brief breathing exercise to help calm your nervous system?",
      "It's okay to feel anxious. Your feelings are a normal response to stress. Let's work through this together."
    ],
    suggestions: ["Deep breathing", "Progressive muscle relaxation", "Mindful walking", "Journaling"]
  },
  stress: {
    responses: [
      "It sounds like you're under a lot of pressure. Let's identify what's within your control and what isn't.",
      "Stress can be overwhelming. Would you like to explore some stress management techniques?",
      "Your well-being matters. Let's find some ways to reduce your stress levels together."
    ],
    suggestions: ["Time management", "Setting boundaries", "Regular breaks", "Stress-relief exercises"]
  },
  relationship: {
    responses: [
      "Relationship challenges can be really tough. Would you like to explore how you're feeling about this situation?",
      "It's natural to feel conflicted in relationships. Let's talk about what's troubling you.",
      "Your feelings about this relationship matter. What kind of support would be most helpful right now?"
    ],
    suggestions: ["Communication exercises", "Boundary setting", "Self-reflection", "Active listening"]
  }
};

// Add more specialized quick prompts
const quickPrompts = [
  { text: "I'm feeling overwhelmed", category: "stress" },
  { text: "I need to calm down", category: "anxiety" },
  { text: "I'm feeling lonely", category: "depression" },
  { text: "I need relationship advice", category: "relationship" },
  { text: "I want to improve myself", category: "growth" }
];

export default function AISupport() {
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>>([
    {
      role: "assistant" as const,
      content: "Hi, I'm Serene, your emotional support assistant. I'm here to listen and help you navigate difficult feelings. What's on your mind today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showCrisisAlert, setShowCrisisAlert] = useState(false)
  const [currentEmotion, setCurrentEmotion] = useState<string>("neutral")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Function to get a random tip or affirmation
  const getRandomTip = () => dailyTips[Math.floor(Math.random() * dailyTips.length)]
  const getRandomAffirmation = () => affirmations[Math.floor(Math.random() * affirmations.length)]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = {
      role: "user" as const,
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Check for crisis terms
    if (detectCrisis(input)) {
      setShowCrisisAlert(true)
    }

    // Detect emotion
    const detectedEmotion = detectEmotion(input)
    setCurrentEmotion(detectedEmotion)

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    let aiResponse = ""
    switch (detectedEmotion) {
      case "sadness":
        aiResponse =
          "I hear that you're feeling down right now. It's okay to feel this way, and I'm here to listen. Would you like to talk more about what's troubling you?"
        break
      case "anxiety":
        aiResponse =
          "I notice you're feeling anxious. Let's take a moment to breathe together. Remember, anxiety is temporary and you're safe right now. What's causing you to feel this way?"
        break
      case "anger":
        aiResponse =
          "I can sense your frustration. It's natural to feel angry sometimes. Would you like to explore what triggered these feelings?"
        break
      default:
        aiResponse =
          "Thank you for sharing that with me. I'm here to support you. Would you like to tell me more about how you're feeling?"
    }

    const assistantMessage = {
      role: "assistant" as const,
      content: aiResponse,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  const handleQuickPrompt = (text: string) => {
    setInput(text)
    const syntheticEvent = new Event("submit") as unknown as React.FormEvent
    handleSendMessage(syntheticEvent)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-col gap-6">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                AI Emotional Support
              </h1>
              <p className="text-lg text-muted-foreground">Your 24/7 companion for emotional well-being</p>
            </div>
            <Button variant="outline" asChild className="gap-2">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Community
              </Link>
            </Button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* AI Assistant Card */}
              <Card className="border-2 border-purple-200 dark:border-purple-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold">Meet Serene</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24 mb-3">
                        <AvatarImage src="/ai-avatar.png" alt="Serene" />
                        <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-white" />
                    </div>
                    <h3 className="text-lg font-semibold">Serene</h3>
                    <p className="text-sm text-muted-foreground">Therapeutic AI Assistant</p>
                  </div>
                  <div className="space-y-3">
                    <Badge variant="outline" className="w-full justify-center py-1">
                      CBT & DBT Trained
                    </Badge>
                    <Badge variant="outline" className="w-full justify-center py-1">
                      Trauma-Informed
                    </Badge>
                    <Badge variant="outline" className="w-full justify-center py-1">
                      24/7 Available
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Support Actions */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Quick Support</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      onClick={() => handleQuickPrompt(prompt.text)}
                    >
                      <span className="text-left">{prompt.text}</span>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Resources Card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-between text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                    Crisis Support
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Find Therapists
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="w-full justify-between">
                    Self-Help Tools
                    <Info className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <Card className="lg:col-span-3 border-2">
              <CardHeader className="border-b pb-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      Your Safe Space
                      {currentEmotion !== "neutral" && (
                        <Badge variant="outline" className="ml-2 bg-purple-50 dark:bg-purple-900/20">
                          {currentEmotion === "sadness" && "Supportive Mode"}
                          {currentEmotion === "anxiety" && "Calming Mode"}
                          {currentEmotion === "anger" && "Grounding Mode"}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription>Share your thoughts freely and safely</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Human Support
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="h-[600px] overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}
                    >
                      <div
                        className={`flex gap-3 max-w-[80%] ${
                          msg.role === "user" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        {msg.role === "assistant" && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/ai-avatar.png" alt="Serene" />
                            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                              AI
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-purple-600 text-white"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="text-sm">{msg.content}</div>
                            <div className="text-xs opacity-70">{msg.timestamp}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 items-center text-muted-foreground">
                      <div className="flex gap-1">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                      </div>
                      <span className="text-sm">Serene is typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t p-4">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={showCrisisAlert} onOpenChange={setShowCrisisAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Need Immediate Support?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                If you're having thoughts of self-harm or suicide, please know that you're not alone.
                Professional help is available 24/7.
              </p>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg space-y-2">
                <p className="font-semibold">Emergency Resources:</p>
                <p>• National Crisis Hotline: 988</p>
                <p>• Crisis Text Line: Text HOME to 741741</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue with AI Chat</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700">
              Call Crisis Hotline
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
