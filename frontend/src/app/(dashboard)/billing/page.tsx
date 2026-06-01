"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/providers/supabase-provider";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, CreditCard, Download, ExternalLink } from "lucide-react";

export default function BillingPage() {
  const { user } = useSupabase();
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get("/subscriptions/my").catch(() => null),
      api.get("/subscriptions/plans").catch(() => []),
    ]).then(([sub, plansData]) => {
      setSubscription(sub);
      setPlans(plansData);
      setIsLoading(false);
    });
  }, [user]);

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

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

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
          <div className="grid md:grid-cols-3 gap-4">
            {plans.filter((p) => p.interval === "month").map((plan) => (
              <Card key={plan.id} className={`border-2 ${subscription?.planId === plan.id ? "border-primary" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">{formatCurrency(plan.priceEgp)}</span>
                    <span className="text-muted-foreground">/mo</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" variant={subscription?.planId === plan.id ? "outline" : "default"}>
                    {subscription?.planId === plan.id ? "Current Plan" : plan.priceEgp === 0 ? "Free" : "Upgrade"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
