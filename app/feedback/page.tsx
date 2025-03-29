"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { v4 as uuidv4 } from 'uuid'
import { 
  AlertCircle, 
  ArrowLeft, 
  Check, 
  ChevronDown, 
  Shield, 
  ThumbsUp 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  Alert, 
  AlertDescription, 
  AlertTitle 
} from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

const formSchema = z.object({
  satisfactionRating: z.string({
    required_error: "Please select a satisfaction rating",
  }),
  usageFrequency: z.string({
    required_error: "Please select how often you use our platform",
  }),
  featureRating: z.object({
    chat: z.string().optional(),
    aiSupport: z.string().optional(),
    community: z.string().optional(),
  }),
  improvementAreas: z.array(z.string()).optional(),
  featureRequest: z.string().max(500, "Feature request must be less than 500 characters").optional(),
  generalFeedback: z.string().max(1000, "Feedback must be less than 1000 characters").optional(),
})

export default function FeedbackPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [privacyExpanded, setPrivacyExpanded] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      featureRating: {
        chat: undefined,
        aiSupport: undefined,
        community: undefined,
      },
      improvementAreas: [],
      featureRequest: "",
      generalFeedback: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    
    try {
      // Create a unique anonymous ID instead of using user identity
      const anonymousId = uuidv4()
      
      // Get timestamp but remove precise time to enhance privacy
      const date = new Date()
      const roughTimestamp = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ).toISOString().split('T')[0]
      
      // Insert data into Supabase with anonymous ID
      const { error } = await supabase
        .from('anonymous_feedback')
        .insert({
          feedback_id: anonymousId,
          submission_date: roughTimestamp,
          satisfaction_rating: values.satisfactionRating,
          usage_frequency: values.usageFrequency,
          feature_rating: values.featureRating,
          improvement_areas: values.improvementAreas,
          feature_request: values.featureRequest,
          general_feedback: values.generalFeedback,
        })
        
      if (error) throw error
      
      setIsSubmitted(true)
    } catch (error) {
      console.error("Error submitting feedback:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <ThumbsUp className="text-green-500" />
              Thank You for Your Feedback!
            </CardTitle>
            <CardDescription>
              Your anonymous feedback has been successfully submitted and will help us improve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center my-8">
              <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-6">
                <Check className="h-16 w-16 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-center">
              We appreciate you taking the time to provide your thoughts. Your feedback is completely anonymous and will be used to enhance your experience on our platform.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push('/')}>Return to Homepage</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild className="w-10 p-0">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Anonymous Feedback</h1>
            <p className="text-muted-foreground">Help us improve by sharing your thoughts</p>
          </div>
        </div>
        
        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Privacy Focused</AlertTitle>
          <AlertDescription className="mt-2">
            Your privacy is important to us. This survey is completely anonymous and doesn't collect any personally identifiable information.
            <Button 
              variant="link" 
              className="p-0 h-auto text-blue-600 dark:text-blue-400" 
              onClick={() => setPrivacyExpanded(!privacyExpanded)}
            >
              {privacyExpanded ? "Show less" : "Learn more"}
            </Button>
            
            {privacyExpanded && (
              <div className="mt-2 space-y-2 text-sm">
                <p>Here's how we ensure your anonymity:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>No account information or user IDs are collected</li>
                  <li>IP addresses are not stored</li>
                  <li>Only the date (not time) of submission is recorded</li>
                  <li>Feedback is aggregated for analysis</li>
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
            <CardDescription>
              Your honest feedback helps us create a better platform for everyone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="satisfactionRating"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>How satisfied are you with our platform overall?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_satisfied" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Very Satisfied
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="satisfied" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Satisfied
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Neutral
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="dissatisfied" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Dissatisfied
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_dissatisfied" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Very Dissatisfied
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="usageFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How often do you use our platform?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Multiple times a day</SelectItem>
                          <SelectItem value="few_times_week">A few times a week</SelectItem>
                          <SelectItem value="weekly">About once a week</SelectItem>
                          <SelectItem value="monthly">A few times a month</SelectItem>
                          <SelectItem value="rarely">Rarely</SelectItem>
                          <SelectItem value="first_time">This is my first time</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="feature-ratings">
                    <AccordionTrigger className="text-left font-medium">
                      Rate our features (optional)
                    </AccordionTrigger>
                    <AccordionContent className="space-y-6 pt-2">
                      <FormField
                        control={form.control}
                        name="featureRating.chat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Chat Rooms</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rate this feature" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="average">Average</SelectItem>
                                <SelectItem value="poor">Needs Improvement</SelectItem>
                                <SelectItem value="not_used">Haven't Used</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="featureRating.aiSupport"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>AI Emotional Support</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rate this feature" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="average">Average</SelectItem>
                                <SelectItem value="poor">Needs Improvement</SelectItem>
                                <SelectItem value="not_used">Haven't Used</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="featureRating.community"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community Features</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Rate this feature" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="excellent">Excellent</SelectItem>
                                <SelectItem value="good">Good</SelectItem>
                                <SelectItem value="average">Average</SelectItem>
                                <SelectItem value="poor">Needs Improvement</SelectItem>
                                <SelectItem value="not_used">Haven't Used</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                
                <FormField
                  control={form.control}
                  name="generalFeedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Share your thoughts or suggestions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What do you like about our platform? What can we improve?"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Your feedback helps us prioritize improvements
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featureRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feature request (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Is there something specific you'd like to see added?"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
