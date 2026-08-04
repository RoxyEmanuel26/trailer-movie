"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface HomepageSeoClientProps {
  initialData: any | null
}

export function HomepageSeoClient({ initialData }: HomepageSeoClientProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = React.useState(false)
  const [formData, setFormData] = React.useState({
    metaTitle: initialData?.metaTitle || "",
    metaDescription: initialData?.metaDescription || "",
    canonicalUrl: initialData?.canonicalUrl || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/homepage/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || "Failed to update SEO")
      }

      toast.success("Homepage SEO updated successfully")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage SEO</CardTitle>
        <p className="text-sm text-muted-foreground">Manage the SEO metadata for the public homepage.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input 
            id="metaTitle" 
            name="metaTitle" 
            value={formData.metaTitle} 
            onChange={handleChange} 
            placeholder="e.g. Next.js Movie CMS - Home" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea 
            id="metaDescription" 
            name="metaDescription" 
            value={formData.metaDescription} 
            onChange={handleChange} 
            placeholder="e.g. Discover the best movies on our platform..." 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">Canonical URL</Label>
          <Input 
            id="canonicalUrl" 
            name="canonicalUrl" 
            value={formData.canonicalUrl} 
            onChange={handleChange} 
            placeholder="e.g. https://example.com" 
          />
        </div>
      </CardContent>
      <div className="flex items-center p-6 pt-0">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save SEO Metadata"}
        </Button>
      </div>
    </Card>
  )
}
