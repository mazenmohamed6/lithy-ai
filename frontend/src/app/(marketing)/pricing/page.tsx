"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Get started with basic resume building",
    features: ["3 resumes", "Basic templates", "PDF export with branding", "Cover letter generation", "No AI features"],
    cta: "Get Started",
    href: "/signup",
  },
  {
    name: "Pro",
    price: "75",
    description: "Professional tools for serious job seekers",
    popular: true,
    features: [
      "10 resumes/month",
      "Premium templates",
      "AI resume generation (10/mo)",
      "ATS score analysis (5/mo)",
      "Job match analysis (5/mo)",
      "Clean PDF export",
      "Cover letter generation",
    ],
    cta: "Start Free Trial",
    href: "/signup",
  },
  {
    name: "Premium",
    price: "150",
    description: "Unlimited career acceleration",
    features: [
      "Unlimited resumes",
      "Unlimited AI generation",
      "Unlimited ATS scanning",
      "Unlimited job matching",
      "LinkedIn profile optimizer",
      "White-label PDF export",
      "Analytics dashboard",
      "Priority support",
    ],
    cta: "Start Free Trial",
    href: "/signup",
  },
];

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="py-24">
      <div className="container text-center max-w-3xl mb-12">
        <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
        <p className="text-lg text-muted-foreground mb-8">Choose the plan that fits your career goals. All plans include a 7-day free trial.</p>
        <div className="flex items-center justify-center gap-4">
          <span className={cn("text-sm", !annual && "font-semibold")}>Monthly</span>
          <button onClick={() => setAnnual(!annual)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", annual ? "bg-primary" : "bg-muted")}>
            <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", annual ? "translate-x-6" : "translate-x-1")} />
          </button>
          <span className={cn("text-sm", annual && "font-semibold")}>Annual <span className="text-green-600">-20%</span></span>
        </div>
      </div>
      <div className="container grid md:grid-cols-3 gap-8 max-w-5xl">
        {plans.map((plan) => (
          <Card key={plan.name} className={cn("relative", plan.popular && "border-primary shadow-lg scale-105")}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {annual ? Math.round(parseInt(plan.price) * 12 * 0.8 / 12) : plan.price}
                </span>
                <span className="text-muted-foreground ml-1">EGP/mo</span>
                {annual && plan.price !== "0" && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {parseInt(plan.price) * 12 * 0.8} EGP/year (was {parseInt(plan.price) * 12} EGP)
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href={plan.href} className="w-full">
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>{plan.cta}</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
