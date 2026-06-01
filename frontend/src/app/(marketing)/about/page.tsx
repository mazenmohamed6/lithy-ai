export default function AboutPage() {
  return (
    <div className="py-24">
      <div className="container max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">About LITHY AI</h1>
        <p className="text-lg text-muted-foreground mb-12">We are building the smartest resume-building platform for job seekers in Egypt and beyond.</p>
        <div className="grid md:grid-cols-3 gap-8 text-left">
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Our Mission</h3>
            <p className="text-sm text-muted-foreground">Empower every job seeker with AI-powered tools to create resumes that stand out and land interviews.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Our Team</h3>
            <p className="text-sm text-muted-foreground">A passionate team of engineers, designers, and career coaches dedicated to transforming the job search experience.</p>
          </div>
          <div className="border rounded-xl p-6">
            <h3 className="font-semibold mb-2">Our Values</h3>
            <p className="text-sm text-muted-foreground">Accessibility, innovation, and user privacy guide everything we build.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
