"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, ArrowRight, ArrowLeft } from "lucide-react"

interface AssessmentQuestion {
  id: string
  question: string
  options: { value: string; label: string; score: number }[]
  category: 'anxiety' | 'depression' | 'stress' | 'general'
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "mood_frequency",
    question: "Over the past two weeks, how often have you felt down, depressed, or hopeless?",
    category: "depression",
    options: [
      { value: "not_at_all", label: "Not at all", score: 0 },
      { value: "several_days", label: "Several days", score: 1 },
      { value: "more_than_half", label: "More than half the days", score: 2 },
      { value: "nearly_every_day", label: "Nearly every day", score: 3 }
    ]
  },
  {
    id: "anxiety_frequency",
    question: "How often have you felt nervous, anxious, or on edge?",
    category: "anxiety",
    options: [
      { value: "not_at_all", label: "Not at all", score: 0 },
      { value: "several_days", label: "Several days", score: 1 },
      { value: "more_than_half", label: "More than half the days", score: 2 },
      { value: "nearly_every_day", label: "Nearly every day", score: 3 }
    ]
  },
  {
    id: "stress_level",
    question: "How would you rate your current stress level?",
    category: "stress",
    options: [
      { value: "very_low", label: "Very low", score: 0 },
      { value: "low", label: "Low", score: 1 },
      { value: "moderate", label: "Moderate", score: 2 },
      { value: "high", label: "High", score: 3 },
      { value: "very_high", label: "Very high", score: 4 }
    ]
  },
  {
    id: "sleep_quality",
    question: "How has your sleep been lately?",
    category: "general",
    options: [
      { value: "excellent", label: "Excellent", score: 0 },
      { value: "good", label: "Good", score: 1 },
      { value: "fair", label: "Fair", score: 2 },
      { value: "poor", label: "Poor", score: 3 },
      { value: "very_poor", label: "Very poor", score: 4 }
    ]
  },
  {
    id: "social_connection",
    question: "How connected do you feel to others?",
    category: "general",
    options: [
      { value: "very_connected", label: "Very connected", score: 0 },
      { value: "somewhat_connected", label: "Somewhat connected", score: 1 },
      { value: "neutral", label: "Neutral", score: 2 },
      { value: "somewhat_isolated", label: "Somewhat isolated", score: 3 },
      { value: "very_isolated", label: "Very isolated", score: 4 }
    ]
  }
]

interface AssessmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (results: AssessmentResults) => void
}

interface AssessmentResults {
  scores: { [category: string]: number }
  totalScore: number
  recommendations: string[]
  riskLevel: 'low' | 'moderate' | 'high'
}

export default function AssessmentModal({ open, onOpenChange, onComplete }: AssessmentModalProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({})
  const [isComplete, setIsComplete] = useState(false)
  const [results, setResults] = useState<AssessmentResults | null>(null)

  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const nextQuestion = () => {
    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1)
    } else {
      completeAssessment()
    }
  }

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1)
    }
  }

  const completeAssessment = () => {
    const scores: { [category: string]: number } = {}
    let totalScore = 0

    // Calculate scores by category
    assessmentQuestions.forEach(question => {
      const answer = answers[question.id]
      if (answer) {
        const option = question.options.find(opt => opt.value === answer)
        if (option) {
          scores[question.category] = (scores[question.category] || 0) + option.score
          totalScore += option.score
        }
      }
    })

    // Determine risk level
    const maxPossibleScore = assessmentQuestions.reduce((sum, q) => 
      sum + Math.max(...q.options.map(opt => opt.score)), 0
    )
    const scorePercentage = (totalScore / maxPossibleScore) * 100

    let riskLevel: 'low' | 'moderate' | 'high'
    if (scorePercentage < 30) riskLevel = 'low'
    else if (scorePercentage < 60) riskLevel = 'moderate'
    else riskLevel = 'high'

    // Generate recommendations
    const recommendations = generateRecommendations(scores, riskLevel)

    const assessmentResults: AssessmentResults = {
      scores,
      totalScore,
      recommendations,
      riskLevel
    }

    setResults(assessmentResults)
    setIsComplete(true)
  }

  const generateRecommendations = (scores: { [category: string]: number }, riskLevel: string): string[] => {
    const recommendations: string[] = []

    if (scores.anxiety && scores.anxiety > 2) {
      recommendations.push("Practice deep breathing exercises daily")
      recommendations.push("Try progressive muscle relaxation")
    }

    if (scores.depression && scores.depression > 2) {
      recommendations.push("Engage in regular physical activity")
      recommendations.push("Maintain a daily routine")
      recommendations.push("Consider reaching out to a mental health professional")
    }

    if (scores.stress && scores.stress > 2) {
      recommendations.push("Implement stress management techniques")
      recommendations.push("Practice mindfulness meditation")
    }

    if (scores.general && scores.general > 3) {
      recommendations.push("Focus on improving sleep hygiene")
      recommendations.push("Strengthen social connections")
    }

    if (riskLevel === 'high') {
      recommendations.push("Consider speaking with a mental health professional")
      recommendations.push("Reach out to trusted friends or family members")
    }

    return recommendations
  }

  const handleComplete = () => {
    if (results) {
      onComplete(results)
      onOpenChange(false)
      // Reset for next time
      setCurrentQuestion(0)
      setAnswers({})
      setIsComplete(false)
      setResults(null)
    }
  }

  const currentQ = assessmentQuestions[currentQuestion]
  const hasAnswer = answers[currentQ?.id]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Mental Health Assessment
          </DialogTitle>
          <DialogDescription>
            This brief assessment will help Serene provide more personalized support
          </DialogDescription>
        </DialogHeader>

        {!isComplete ? (
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {currentQuestion + 1} of {assessmentQuestions.length}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{currentQ.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={answers[currentQ.id] || ""}
                  onValueChange={(value) => handleAnswer(currentQ.id, value)}
                >
                  {currentQ.options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!hasAnswer}
              >
                {currentQuestion === assessmentQuestions.length - 1 ? "Complete" : "Next"}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          // Results
          <div className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Assessment Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{results?.totalScore}</p>
                    <p className="text-sm text-muted-foreground">Total Score</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${
                      results?.riskLevel === 'low' ? 'text-green-600' :
                      results?.riskLevel === 'moderate' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {results?.riskLevel?.toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">Risk Level</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Personalized Recommendations:</h4>
                  <ul className="text-sm space-y-1">
                    {results?.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleComplete} className="w-full">
              Continue to Chat with Serene
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}