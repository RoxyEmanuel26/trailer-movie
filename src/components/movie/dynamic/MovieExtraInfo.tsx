import * as React from "react"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Building2 } from "lucide-react"

function formatCurrency(amount: any) {
  if (!amount) return "Unknown"
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(amount))
}

export function MovieExtraInfo({ 
  budget, 
  revenue, 
  ageRating, 
  companies, 
  keywords, 
  movieSlug 
}: { 
  budget: any, 
  revenue: any, 
  ageRating: string | null, 
  companies: any[], 
  keywords: any[], 
  movieSlug?: string 
}) {
  const certification = ageRating || "NR";

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const jsonLd = movieSlug ? {
    "@context": "https://schema.org",
    "@type": "Movie",
    "@id": `${baseUrl}/watch/${movieSlug}`,
    "contentRating": certification !== "NR" ? certification : undefined,
    "keywords": keywords.map((k: any) => k.keyword?.name || k.name).join(", "),
    "productionCompany": companies.map((c: any) => ({
      "@type": "Organization",
      "name": c.company?.name || c.name
    }))
  } : null;

  return (
    <div className="flex flex-col gap-6 mt-6">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <div className="bg-card p-6 rounded-xl border shadow-sm">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Financials & Details</h3>
        
        <dl className="space-y-4 text-sm">
          <div className="flex flex-col">
            <dt className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> Budget</dt>
            <dd className="font-medium text-base">{formatCurrency(budget)}</dd>
          </div>
          
          <div className="flex flex-col">
            <dt className="text-muted-foreground flex items-center gap-1"><DollarSign className="w-3 h-3"/> Box Office Revenue</dt>
            <dd className="font-medium text-base">{formatCurrency(revenue)}</dd>
          </div>
          
          <div className="flex flex-col">
            <dt className="text-muted-foreground">Age Rating (US)</dt>
            <dd className="font-medium mt-1">
              <Badge variant="outline" className="font-bold">{certification}</Badge>
            </dd>
          </div>
        </dl>
      </div>

      {companies.length > 0 && (
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Studios</h3>
          <div className="flex flex-col gap-4">
            {companies.map((mc: any) => {
              const company = mc.company || mc;
              return (
                <div key={company.id || company.name} className="flex items-center gap-3">
                  {company.logoUrl || company.logo_path ? (
                    <div className="relative w-10 h-10 bg-white rounded-md p-1 border">
                       <Image src={company.logoUrl || `https://image.tmdb.org/t/p/w92${company.logo_path}`} alt={company.name} fill className="object-contain p-1" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-muted flex items-center justify-center rounded-md border">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{company.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {keywords.length > 0 && (
        <div className="bg-card p-6 rounded-xl border shadow-sm">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {keywords.map((mk: any) => {
              const k = mk.keyword || mk;
              return (
                <Badge key={k.id || k.name} variant="secondary" className="font-normal text-xs">{k.name}</Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function MovieExtraInfoSkeleton() {
  return (
    <div className="flex flex-col gap-6 mt-6 animate-pulse">
      <div className="bg-card p-6 rounded-xl border h-48"></div>
      <div className="bg-card p-6 rounded-xl border h-32"></div>
    </div>
  )
}