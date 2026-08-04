"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function GlobalSeoClient({ initialData }: { initialData: any }) {
  const router = useRouter()
  const [data, setData] = React.useState(initialData || {
    defaultTitle: "",
    defaultDescription: "",
    defaultKeywords: "",
    ogSiteName: "",
    twitterHandle: "",
    googleVerification: "",
    bingVerification: "",
    yandexVerification: "",
  })
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/settings/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error?.message || "Failed to update SEO settings")
      }
      toast.success("Global SEO settings updated")
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
        <CardTitle>Global SEO Settings</CardTitle>
        <p className="text-sm text-muted-foreground">Manage the default metadata used across the entire site when specific page metadata is missing.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
          <h3 className="font-semibold text-lg">Default Meta Tags</h3>
          <div className="space-y-2">
            <Label>Default Site Title</Label>
            <Input 
              value={data.defaultTitle}
              onChange={(e) => setData({ ...data, defaultTitle: e.target.value })}
              placeholder="e.g. Trailer Movie - Watch the Best Trailers"
            />
            <p className="text-xs text-muted-foreground">The title used if a specific page doesn't have one.</p>
          </div>
          <div className="space-y-2">
            <Label>Default Meta Description</Label>
            <Textarea 
              value={data.defaultDescription}
              onChange={(e) => setData({ ...data, defaultDescription: e.target.value })}
              placeholder="e.g. Discover and watch the latest and greatest movie trailers..."
            />
          </div>
          <div className="space-y-2">
            <Label>Default Meta Keywords</Label>
            <Input 
              value={data.defaultKeywords}
              onChange={(e) => setData({ ...data, defaultKeywords: e.target.value })}
              placeholder="e.g. movies, trailers, upcoming releases"
            />
          </div>
        </div>

        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
          <h3 className="font-semibold text-lg">Social & OpenGraph</h3>
          <div className="space-y-2">
            <Label>OpenGraph Site Name</Label>
            <Input 
              value={data.ogSiteName}
              onChange={(e) => setData({ ...data, ogSiteName: e.target.value })}
              placeholder="e.g. Trailer Movie"
            />
          </div>
          <div className="space-y-2">
            <Label>Twitter Handle</Label>
            <Input 
              value={data.twitterHandle}
              onChange={(e) => setData({ ...data, twitterHandle: e.target.value })}
              placeholder="e.g. @trailermovie"
            />
          </div>
        </div>

        <div className="space-y-4 border p-4 rounded-md bg-muted/20">
          <h3 className="font-semibold text-lg">Webmaster Verification</h3>
          <div className="space-y-2">
            <Label>Google Search Console Verification Code</Label>
            <Input 
              value={data.googleVerification}
              onChange={(e) => setData({ ...data, googleVerification: e.target.value })}
              placeholder="e.g. xyz123"
            />
          </div>
          <div className="space-y-2">
            <Label>Bing Webmaster Verification Code</Label>
            <Input 
              value={data.bingVerification}
              onChange={(e) => setData({ ...data, bingVerification: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Yandex Verification Code</Label>
            <Input 
              value={data.yandexVerification}
              onChange={(e) => setData({ ...data, yandexVerification: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
