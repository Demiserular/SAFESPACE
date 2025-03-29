"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart, 
  LineChart,
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  DonutChart,
} from "@tremor/react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  AlertCircle, 
  ArrowLeft, 
  Calendar, 
  Download, 
  Filter, 
  Lock, 
  MessageSquare, 
  Shield 
} from "lucide-react"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

interface FeedbackData {
  id: number
  satisfaction_rating: string
  usage_frequency: string
  feature_rating: {
    chat?: string
    aiSupport?: string
    community?: string
  }
  improvement_areas: string[]
  feature_request: string
  general_feedback: string
  submission_date: string
}

export default function AdminFeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [timeFrame, setTimeFrame] = useState("all")
  const [error, setError] = useState<string | null>(null)
  const { user, loading } = useSupabaseAuth()
  const router = useRouter()
  
  // Check if user is admin
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    // This should check if the user has admin role
    const checkAdminStatus = async () => {
      if (!user) return
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (error || !data || data.role !== 'admin') {
        router.push('/')
      }
    }
    
    checkAdminStatus()
  }, [user, loading, router])
  
  // Fetch feedback data
  useEffect(() => {
    const fetchFeedback = async () => {
      setIsLoading(true)
      
      try {
        let query = supabase
          .from('anonymous_feedback')
          .select('*')
          .order('submission_date', { ascending: false })
        
        // Apply time filter
        if (timeFrame !== 'all') {
          const today = new Date()
          let startDate = new Date()
          
          if (timeFrame === 'week') {
            startDate.setDate(today.getDate() - 7)
          } else if (timeFrame === 'month') {
            startDate.setMonth(today.getMonth() - 1)
          } else if (timeFrame === 'quarter') {
            startDate.setMonth(today.getMonth() - 3)
          }
          
          query = query.gte('submission_date', startDate.toISOString().split('T')[0])
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        setFeedbackData(data as FeedbackData[])
      } catch (err) {
        console.error("Error fetching feedback:", err)
        setError("Failed to load feedback data. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    
    if (user) {
      fetchFeedback()
    }
  }, [user, timeFrame])
  
  // Prepare data for charts
  const getSatisfactionData = () => {
    const counts = {
      very_satisfied: 0,
      satisfied: 0,
      neutral: 0,
      dissatisfied: 0,
      very_dissatisfied: 0
    }
    
    feedbackData.forEach(item => {
      if (counts.hasOwnProperty(item.satisfaction_rating)) {
        counts[item.satisfaction_rating as keyof typeof counts]++
      }
    })
    
    return [
      { name: 'Very Satisfied', value: counts.very_satisfied },
      { name: 'Satisfied', value: counts.satisfied },
      { name: 'Neutral', value: counts.neutral },
      { name: 'Dissatisfied', value: counts.dissatisfied },
      { name: 'Very Dissatisfied', value: counts.very_dissatisfied },
    ]
  }
  
  const getFeatureRatingData = () => {
    const features = ['chat', 'aiSupport', 'community']
    const ratings = ['excellent', 'good', 'average', 'poor', 'not_used']
    const results: { feature: string, rating: string, count: number }[] = []
    
    features.forEach(feature => {
      ratings.forEach(rating => {
        const count = feedbackData.filter(item => 
          item.feature_rating && 
          item.feature_rating[feature as keyof typeof item.feature_rating] === rating
        ).length
        
        results.push({
          feature: feature === 'chat' ? 'Chat Rooms' : 
                  feature === 'aiSupport' ? 'AI Support' : 'Community',
          rating: rating === 'excellent' ? 'Excellent' :
                 rating === 'good' ? 'Good' :
                 rating === 'average' ? 'Average' :
                 rating === 'poor' ? 'Needs Improvement' : 'Not Used',
          count
        })
      })
    })
    
    return results.filter(item => item.count > 0)
  }
  
  const getTrendData = () => {
    const dateMap = new Map<string, number>()
    const today = new Date()
    
    // Create entries for the last 30 days with 0 counts
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(today.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dateMap.set(dateStr, 0)
    }
    
    // Count submissions for each date
    feedbackData.forEach(item => {
      if (dateMap.has(item.submission_date)) {
        dateMap.set(item.submission_date, (dateMap.get(item.submission_date) || 0) + 1)
      }
    })
    
    // Convert to array of objects for chart
    return Array.from(dateMap.entries()).map(([date, count]) => ({
      date,
      'Submissions': count
    }))
  }
  
  // Helper to format dates nicely
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Export feedback data as CSV
  const exportCSV = () => {
    if (feedbackData.length === 0) return
    
    // Create CSV content
    const headers = [
      'Submission Date',
      'Satisfaction Rating',
      'Usage Frequency',
      'Chat Rating',
      'AI Support Rating',
      'Community Rating',
      'Feature Request',
      'General Feedback'
    ]
    
    const csvContent = [
      headers.join(','),
      ...feedbackData.map(item => [
        item.submission_date,
        item.satisfaction_rating,
        item.usage_frequency,
        item.feature_rating?.chat || 'N/A',
        item.feature_rating?.aiSupport || 'N/A',
        item.feature_rating?.community || 'N/A',
        `"${(item.feature_request || '').replace(/"/g, '""')}"`,
        `"${(item.general_feedback || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `feedback_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-lg">Loading feedback data...</div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Feedback Analytics</h1>
              <p className="text-muted-foreground">Anonymous user feedback insights</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={timeFrame} onValueChange={setTimeFrame}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={exportCSV} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Responses</CardTitle>
              <CardDescription>All feedback submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{feedbackData.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Satisfaction Rate</CardTitle>
              <CardDescription>Very satisfied or satisfied</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData.length > 0 ? (
                <div className="text-3xl font-bold">
                  {Math.round(feedbackData.filter(item => 
                    ['very_satisfied', 'satisfied'].includes(item.satisfaction_rating)
                  ).length / feedbackData.length * 100)}%
                </div>
              ) : (
                <div className="text-3xl font-bold">0%</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Latest Response</CardTitle>
              <CardDescription>Most recent submission</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackData.length > 0 ? (
                <div className="text-xl font-medium">
                  {formatDate(feedbackData[0].submission_date)}
                </div>
              ) : (
                <div className="text-xl font-medium">No data</div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Privacy Status</CardTitle>
              <CardDescription>Data anonymization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Fully Anonymous</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Distribution</CardTitle>
                  <CardDescription>
                    How users rate their overall experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbackData.length > 0 ? (
                    <DonutChart
                      data={getSatisfactionData()}
                      category="value"
                      index="name"
                      colors={["emerald", "teal", "blue", "amber", "rose"]}
                      showAnimation={true}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-64 text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Feature Ratings</CardTitle>
                  <CardDescription>
                    How users rate specific features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {feedbackData.length > 0 && getFeatureRatingData().length > 0 ? (
                    <BarChart
                      data={getFeatureRatingData()}
                      index="feature"
                      categories={["count"]}
                      colors={["blue"]}
                      stack={true}
                      showLegend={false}
                      showAnimation={true}
                      valueFormatter={(value) => `${value} responses`}
                    />
                  ) : (
                    <div className="flex justify-center items-center h-64 text-muted-foreground">
                      No feature ratings available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="trends" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Submission Trends</CardTitle>
                <CardDescription>
                  Number of feedback submissions over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-96">
                {feedbackData.length > 0 ? (
                  <LineChart
                    data={getTrendData()}
                    index="date"
                    categories={["Submissions"]}
                    colors={["blue"]}
                    showAnimation={true}
                    yAxisWidth={40}
                    showLegend={false}
                  />
                ) : (
                  <div className="flex justify-center items-center h-64 text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Comments</CardTitle>
                <CardDescription>
                  Feedback comments and feature requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackData.length > 0 && feedbackData.some(item => item.general_feedback || item.feature_request) ? (
                  <Table>
                    <TableCaption className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      All comments are anonymous and cannot be traced back to users
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Satisfaction</TableHead>
                        <TableHead className="w-[50%]">Feedback</TableHead>
                        <TableHead>Type</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbackData
                        .filter(item => item.general_feedback || item.feature_request)
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{formatDate(item.submission_date)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  item.satisfaction_rating.includes('satisfied')
                                    ? 'success'
                                    : item.satisfaction_rating === 'neutral'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                              >
                                {item.satisfaction_rating.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-normal whitespace-normal break-words">
                              {item.general_feedback || item.feature_request}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.general_feedback ? 'Feedback' : 'Feature Request'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex justify-center items-center h-40 text-muted-foreground">
                    No comments available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="flex items-center gap-2 text-muted-foreground text-sm border-t pt-4">
          <Shield className="h-4 w-4" />
          <p>
            This data is anonymous and cannot be traced back to individual users. It is collected
            for the sole purpose of improving our platform.
          </p>
        </div>
      </div>
    </div>
  )
}
