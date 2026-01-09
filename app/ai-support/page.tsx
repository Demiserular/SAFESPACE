"use client"

import { useState, Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"

// Lazy load SereneChat component for better performance
const SereneChat = lazy(() => import("@/components/SereneChat"))

export default function AISupportPage() {
  const { user } = useSupabaseAuth()
  const [activeTab, setActiveTab] = useState("chat")

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Simple Header */}
      <div className="px-2 sm:px-4 pt-2 sm:pt-4">
        <h1 className="text-2xl font-semibold mb-2">AI Support</h1>
        <p className="text-muted-foreground">
          Chat with Serene, your AI companion for mental health support
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow mt-6">
        <TabsList className="grid w-full grid-cols-3 mb-4 shrink-0 px-2 sm:px-4">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="community">Community</TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex-grow flex flex-col">
          {user ? (
            <div className="flex-1 flex">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Loading Serene AI...</p>
                  </div>
                </div>
              }>
                <SereneChat />
              </Suspense>
            </div>
          ) : (
            <Card className="p-6 mx-2 sm:mx-4">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Sign in to chat with Serene</h3>
                <p className="text-sm text-muted-foreground">
                  Create an account to start your conversation
                </p>
                <div className="flex gap-3 justify-center">
                  <Button asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="px-2 sm:px-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Self-Help Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium text-sm">Breathing Exercises</h4>
                  <p className="text-xs text-muted-foreground">Simple techniques for anxiety relief</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium text-sm">Mood Tracking</h4>
                  <p className="text-xs text-muted-foreground">Monitor your emotional patterns</p>
                </div>
                <div className="p-3 bg-muted rounded-md">
                  <h4 className="font-medium text-sm">Sleep Tips</h4>
                  <p className="text-xs text-muted-foreground">Better rest for better mental health</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Crisis Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 mb-3">
                  <h4 className="font-medium text-sm mb-2">Need immediate help?</h4>
                  <div className="text-sm space-y-1">
                    <div>Call <strong>988</strong> - Suicide Prevention Lifeline</div>
                    <div>Text <strong>HOME</strong> to <strong>741741</strong> - Crisis Text Line</div>
                    <div>Call <strong>911</strong> - Emergency Services</div>
                  </div>
                </div>
                <Button className="w-full" size="sm">
                  <Link href="tel:988">Call Crisis Hotline</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Community Tab */}
        <TabsContent value="community" className="px-2 sm:px-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Support Groups</CardTitle>
                <CardDescription className="text-sm">
                  Join chat rooms for peer support
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/chat-rooms">Browse Chat Rooms</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Share Your Story</CardTitle>
                <CardDescription className="text-sm">
                  Create anonymous posts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full" variant="outline">
                  <Link href="/create-post">Create Post</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
