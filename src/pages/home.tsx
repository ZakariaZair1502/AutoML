import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import FeatureCards from '@/components/FeatureCards';
import AboutSection from '@/components/AboutSection';

const App = () => {
  return (
    <Layout>
      <div className="min-h-screen ">
        <HeroSection />
        <AboutSection />
        <FeatureCards />
      </div>
    </Layout>
  );
};

export default App;
