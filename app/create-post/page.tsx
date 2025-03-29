"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateUsername } from "@/lib/username-generator"

export default function CreatePost() {
  const router = useRouter()
  const [username, setUsername] = useState(generateUsername())
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, we would send this data to a server
    console.log({ ...formData, username })
    router.push("/")
  }

  const regenerateUsername = () => {
    setUsername(generateUsername())
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.push("/")} className="mb-4">
        ← Back to posts
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Create a new post</CardTitle>
          <CardDescription>Share your thoughts anonymously with the community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="username">Your anonymous username</Label>
                <Button type="button" variant="ghost" size="sm" onClick={regenerateUsername}>
                  Regenerate
                </Button>
              </div>
              <Input id="username" value={username} readOnly className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                This temporary username will only be associated with this post
              </p>
            </div>

            <div className="mb-6">
              <Label htmlFor="category" className="mb-2 block">
                Category
              </Label>
              <Select onValueChange={handleSelectChange} required>
                <SelectTrigger>
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

            <div className="mb-6">
              <Label htmlFor="title" className="mb-2 block">
                Post title
              </Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Enter a clear, specific title"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="content" className="mb-2 block">
                Your post
              </Label>
              <Textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                placeholder="Share your thoughts, feelings, or questions..."
                rows={6}
              />
            </div>

            <Button type="submit" className="w-full">
              Post Anonymously
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

