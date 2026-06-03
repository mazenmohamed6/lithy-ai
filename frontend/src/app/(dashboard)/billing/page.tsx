"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, CreditCard, Download, ExternalLink } from "lucide-react";

export default function BillingPage() {
  const { user } = useSupabase();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [annual, setAnnual] = useState(subscription?.plan?.interval === "year");
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/subscriptions/my").catch(() => null),
      api.get("/subscriptions/plans").catch(() => []),
    ]).then(([sub, plansData]) => {
      setSubscription(sub);
      setPlans(plansData);
      if (sub?.plan?.interval === "year") setAnnual(true);
      setIsLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (isLoading || !planParam) return;
    const planName = planParam.toUpperCase();
    const targetPlan = plans.find((p) => p.name === planName);
    if (targetPlan && targetPlan.stripePriceId && targetPlan.priceEgp > 0) {
      handleCheckout(targetPlan);
    }
  }, [isLoading, planParam, plans]);

  const handleManageBilling = async () => {
    try {
      const res = await api.post("/payments/customer-portal", {
        returnUrl: window.location.href,
      });
      window.location.href = res.url;
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    }
  };

  const handleCheckout = async (plan: any) => {
    if (plan.priceEgp === 0 || subscription?.planId === plan.id) return;
    if (plan.stripePriceId) {
      try {
        const res = await api.post("/payments/create-checkout", {
          priceId: plan.stripePriceId,
          successUrl: window.location.href + "?success=true",
          cancelUrl: window.location.href,
        });
        window.location.href = res.url;
      } catch (err: any) {
        toast.error(err.message || "Failed to start checkout");
      }
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const currentPlanName = subscription?.plan?.name || "FREE";
  const filteredPlans = plans.filter((p) => p.interval === (annual ? "year" : "month"));

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">Manage your subscription and payment methods.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Plan
          </CardTitle>
          <CardDescription>Your subscription details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold">{subscription?.plan?.name || "Free"}</p>
              <p className="text-sm text-muted-foreground">
                {subscription?.status === "TRIALING" ? "Trial period" : subscription?.status === "ACTIVE" ? "Active" : subscription?.status || "No subscription"}
              </p>
            </div>
            <Badge variant={subscription?.status === "ACTIVE" ? "success" : "secondary"}>
              {subscription?.status || "FREE"}
            </Badge>
          </div>
          {subscription?.currentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              Current period ends: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
            </p>
          )}
        </CardContent>
      </Card>

      {subscription?.stripeCustomerId && (
        <Button variant="outline" onClick={handleManageBilling}>
          <ExternalLink className="mr-2 h-4 w-4" />
          Manage in Stripe Portal
        </Button>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or change your plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className={cn("text-sm", !annual && "font-semibold")}>Monthly</span>
            <button onClick={() => setAnnual(!annual)} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", annual ? "bg-primary" : "bg-muted")}>
              <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", annual ? "translate-x-6" : "translate-x-1")} />
            </button>
            <span className={cn("text-sm", annual && "font-semibold")}>Annual <span className="text-green-600">-20%</span></span>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {filteredPlans.map((plan) => {
              const isCurrent = currentPlanName === plan.name;
              return (
                <Card key={plan.id} className={`border-2 ${isCurrent ? "border-primary" : ""}`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-2">
                      <span className="text-2xl font-bold">{formatCurrency(plan.priceEgp)}</span>
                      <span className="text-muted-foreground">/{annual ? "yr" : "mo"}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      variant={isCurrent ? "outline" : "default"}
                      onClick={() => handleCheckout(plan)}
                    >
                      {isCurrent ? "Current Plan" : plan.priceEgp === 0 ? "Free" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
