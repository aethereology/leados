import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const FEATURES = [
  {
    title: "Capture leads instantly",
    body: "Public lead forms that create contacts and opportunities the moment a prospect submits.",
  },
  {
    title: "Manage every client workspace",
    body: "Each client gets their own tenant with isolated contacts, pipelines, forms, and automations.",
  },
  {
    title: "Install niche blueprints",
    body: "Med spa, roofer, dentist — spin up a fully configured CRM for a niche in a single click.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="h-7 w-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs">
              LO
            </span>
            LeadOS
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-muted-foreground mb-3">
            White-label CRM for agencies
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Launch a branded CRM and lead follow-up system for every client.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl">
            LeadOS gives your agency a multi-tenant CRM, lead capture forms,
            pipelines, and automation placeholders — ready to install a niche
            blueprint and start capturing leads today.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild size="lg">
              <Link href="/signup">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container pb-24">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <CardContent className="pt-6">
                <CheckCircle2 className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t">
        <div className="container py-6 text-sm text-muted-foreground flex items-center justify-between">
          <span>LeadOS — Phase 1 MVP</span>
          <span>Built for agencies serving local businesses.</span>
        </div>
      </footer>
    </main>
  );
}
