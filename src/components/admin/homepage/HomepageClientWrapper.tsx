"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HomepageSectionsClient } from "./HomepageSectionsClient"
import { FeaturedHeroClient } from "./FeaturedHeroClient"
import { HomepageSeoClient } from "./HomepageSeoClient"
import { GlobalSeoClient } from "../seo/GlobalSeoClient"

interface HomepageClientWrapperProps {
  initialSections: any[]
  initialFeatured: any[]
  initialSeo: any | null
  initialGlobalSeo: any
}

export function HomepageClientWrapper({
  initialSections,
  initialFeatured,
  initialSeo,
  initialGlobalSeo
}: HomepageClientWrapperProps) {
  return (
    <Tabs defaultValue="sections" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="sections">Homepage Sections</TabsTrigger>
        <TabsTrigger value="featured">Featured Hero</TabsTrigger>
        <TabsTrigger value="seo">Homepage SEO</TabsTrigger>
        <TabsTrigger value="global-seo">Global SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="sections">
        <HomepageSectionsClient initialData={initialSections} />
      </TabsContent>

      <TabsContent value="featured">
        <FeaturedHeroClient initialData={initialFeatured} />
      </TabsContent>

      <TabsContent value="seo">
        <HomepageSeoClient initialData={initialSeo} />
      </TabsContent>

      <TabsContent value="global-seo">
        <GlobalSeoClient initialData={initialGlobalSeo} />
      </TabsContent>
    </Tabs>
  )
}
