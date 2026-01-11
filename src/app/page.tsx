import {
  Hero,
  ProblemSolution,
  HowItWorks,
  Features,
  Pricing,
  Testimonials,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <Features />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
