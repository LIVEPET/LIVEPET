import Hero from "@/components/Hero";
import Stats from "@/components/Stats";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTABanner from "@/components/CTABanner";

const Index = () => {
  return (
    <div className="bg-background [&>section]:scroll-mt-24">
      <Hero />
      <div className="space-y-24 sm:space-y-28 lg:space-y-32">
        <Stats />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <CTABanner />
      </div>
    </div>
  );
};

export default Index;
