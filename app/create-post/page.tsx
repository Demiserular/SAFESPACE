"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle } from "lucide-react"
import { generateUsername } from "@/lib/username-generator"
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth"
import { createPost } from "@/lib/api_routes"
import { useLoading } from "@/components/loading-provider"

export default function CreatePost() {
  const router = useRouter()
  const { setLoading } = useLoading()
  const [username, setUsername] = useState(generateUsername())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useSupabaseAuth()
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    setLoading(true) // Trigger the global loader
    try {
      const created = await createPost({
        title: formData.title,
        content: formData.content,
      })
      if (!created || !created.id) {
        throw new Error('Failed to create post')
      }

      // Store post ownership in localStorage
      if (user && created.id) {
        const userPosts = JSON.parse(localStorage.getItem('userPosts') || '[]');
        userPosts.push(created.id);
        localStorage.setItem('userPosts', JSON.stringify(userPosts));
      }

      setSuccess(true)
      setTimeout(() => {
        setLoading(false)
        router.push("/posts")
      }, 1500)
    } catch (err: any) {
      console.error('Create post error:', err)
      setError(err?.message || 'Failed to create post')
      setLoading(false) // Stop loader on error
    } finally {
      setIsSubmitting(false)
    }
  }

  const regenerateUsername = () => {
    setUsername(generateUsername())
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
        <Card className="shadow-sm">
          <CardHeader className="p-4 sm:p-6 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-xl sm:text-2xl text-green-600">Post Created!</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Your post has been published anonymously. Redirecting to homepage...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-2xl">
      <Button
        variant="ghost"
        onClick={() => router.push("/")}
        className="mb-4 touch-manipulation"
      >
        ← Back to posts
      </Button>

      <Card className="shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-xl sm:text-2xl">Create a new post</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Share your thoughts anonymously with the community
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-sm sm:text-base font-medium">
                  Your anonymous username
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={regenerateUsername}
                  className="touch-manipulation text-xs sm:text-sm"
                >
                  Regenerate
                </Button>
              </div>
              <Input
                id="username"
                value={username}
                readOnly
                className="bg-muted text-sm sm:text-base"
              />
              <p className="text-xs text-muted-foreground">
                This temporary username will only be associated with this post
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm sm:text-base font-medium">
                Category *
              </Label>
              <Select onValueChange={handleSelectChange} required>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Depression Help">Depression Help</SelectItem>
                  <SelectItem value="Career Stress">Career Stress</SelectItem>
                  <SelectItem value="Relationship Advice">Relationship Advice</SelectItem>
                  <SelectItem value="General Support">General Support</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm sm:text-base font-medium">
                Post title *
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter a clear, specific title"
                className="text-sm sm:text-base"
                maxLength={255}
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="content" className="text-sm sm:text-base font-medium">
                Your post *
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Share your thoughts, feelings, or questions..."
                rows={6}
                className="text-sm sm:text-base resize-none"
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length}/5000 characters
              </p>
            </div>

            <Button
              type="submit"
              className="w-full touch-manipulation text-sm sm:text-base py-3"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Post..." : "Post Anonymously"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

