import Layout from '@/components/Layout';
import HeroSection from '@/components/HeroSection';
import FeatureCards from '@/components/FeatureCards';
import AboutSection from '@/components/AboutSection';

const App = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <HeroSection />
        <AboutSection />
        <FeatureCards />
      </div>
    </Layout>
  );
};

export default App;
