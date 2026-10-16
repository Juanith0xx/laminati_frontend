import Hero from "@/components/home/Hero";
import CategoriesSection from "@/components/home/CategoriesSection";
import CollectionsSection from "@/components/home/CollectionsSection";
import OffersSection from "@/components/home/OffersSection";
import FeaturedProductsSection from "@/components/home/FeaturedProductsSection";
import LocationSection from "@/components/home/LocationSection";

export const dynamic = "force-dynamic";



export default function HomePage() {
  return (
    <main>
      <Hero />

      <CategoriesSection />

      <OffersSection />

      <FeaturedProductsSection />

      <CollectionsSection />

      <LocationSection />
    </main>
  );
}