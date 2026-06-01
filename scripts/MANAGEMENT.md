# LITHY AI — Management Guide

## Managing Users

### Via Admin Panel (بعد ما تعمل Admin)
```
http://localhost:3000/admin/users
```
- عرض كل المستخدمين
- تغيير الأدوار (Admin, Pro, User)
- تعطيل الحسابات

### Via Supabase Dashboard
```
https://supabase.com/dashboard/project/pobeisftgpkbgpnspser
```
- **Authentication → Users:** عرض كل المستخدمين المسجلين
- **SQL Editor:** استعلامات متقدمة

### Via Prisma (Command Line)
```powershell
cd C:\opencode\lithy-ai\backend
npx prisma studio
```
هتفتح واجهة براوزر لإدارة قاعدة البيانات.

---

## Useful SQL Queries

تشغيلها في Supabase: **SQL Editor**

### عرض كل المستخدمين
```sql
SELECT id, email, role, "emailVerified", "createdAt"
FROM "user"
ORDER BY "createdAt" DESC;
```

### عرض الاشتراكات
```sql
SELECT u.email, s.status, s."trialEnd", p.name as plan_name
FROM "user_subscription" s
JOIN "user" u ON u.id = s."userId"
JOIN "subscription_plan" p ON p.id = s."planId";
```

### عرض المدفوعات
```sql
SELECT u.email, p.amount, p.currency, p.status, p."createdAt"
FROM "payment" p
JOIN "user" u ON u.id = p."userId"
ORDER BY p."createdAt" DESC;
```

### الإحصائيات
```sql
-- عدد المستخدمين
SELECT role, COUNT(*) FROM "user" GROUP BY role;

-- إجمالي الإيرادات
SELECT SUM(amount) FROM "payment" WHERE status = 'succeeded';

-- استخدام AI
SELECT type, COUNT(*) FROM "ai_generation" GROUP BY type;
```

---

## Admin Panel Sections

| المسار | الوظيفة |
|--------|---------|
| `/admin/users` | إدارة المستخدمين والأدوار |
| `/admin/analytics` | تحليلات المنصة |
| `/admin/revenue` | الإيرادات والمدفوعات |
| `/admin/subscriptions` | إدارة الاشتراكات |
| `/admin/feature-flags` | تفعيل/تعطيل المميزات |
| `/admin/content` | إدارة المدونة |
| `/admin/logs` | سجل النشاطات |
| `/admin/templates` | إدارة قوالب السير الذاتية |
