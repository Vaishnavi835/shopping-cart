import Hero from '../components/Hero';
import CategoryStrip from '../components/CategoryStrip';
import PopularProducts from '../components/PopularProducts';
import PersonalizedStyleFeed from '../components/PersonalizedStyleFeed';
import SmartBundleWidget from '../components/SmartBundleWidget';
import FeatureBanners from '../components/FeatureBanners';
import Newsletter from '../components/Newsletter';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="shop-home-page">
      <Hero />
      <CategoryStrip />
      <PersonalizedStyleFeed />
      <PopularProducts />
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem' }}>
        <SmartBundleWidget />
      </div>
      <FeatureBanners />
      <Newsletter />
      <Footer />
    </main>
  );
}
