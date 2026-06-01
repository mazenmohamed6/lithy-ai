import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, DollarSign, FileText, Flag, Layers, History, BookOpen } from "lucide-react";

const sections = [
  { href: "/admin/users", icon: Users, title: "Users", description: "Manage users and roles" },
  { href: "/admin/analytics", icon: BarChart3, title: "Analytics", description: "Usage and platform metrics" },
  { href: "/admin/revenue", icon: DollarSign, title: "Revenue", description: "Subscriptions and payments" },
  { href: "/admin/subscriptions", icon: Layers, title: "Subscriptions", description: "Plan management" },
  { href: "/admin/feature-flags", icon: Flag, title: "Feature Flags", description: "Toggle platform features" },
  { href: "/admin/content", icon: FileText, title: "Content", description: "Blog and legal pages" },
  { href: "/admin/logs", icon: History, title: "Audit Logs", description: "System activity logs" },
  { href: "/admin/templates", icon: BookOpen, title: "Templates", description: "Manage resume templates" },
];

export default function AdminPage() {
  return (
    <div className="py-12">
      <div className="container max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">Manage your LITHY AI platform.</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sections.map((section) => (
            <Link key={section.href} href={section.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <section.icon className="h-8 w-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
