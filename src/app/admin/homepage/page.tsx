import * as React from "react"
import { HomepageService } from "@/lib/services/HomepageService"
import { SeoService } from "@/lib/services/SeoService"
import { HomepageClientWrapper } from "@/components/admin/homepage/HomepageClientWrapper"

export default async function HomepageBuilderPage() {
  const sections = await HomepageService.listSections()
  const featuredItems = await HomepageService.listFeaturedItems()
  const seo = await SeoService.getHomepageSeo()
  const globalSeo = await SeoService.getGlobalSeoSettings()

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Homepage Builder</h1>
        <p className="text-muted-foreground">Manage the content, layout, and SEO of the public homepage.</p>
      </div>

      <HomepageClientWrapper 
        initialSections={sections} 
        initialFeatured={featuredItems} 
        initialSeo={seo} 
        initialGlobalSeo={globalSeo}
      />
    </div>
  )
}
