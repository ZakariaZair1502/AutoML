import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Book, Users, Settings, Star } from 'lucide-react';

const AboutSection = () => {
  const features = [
    {
      icon: <Book className="w-6 h-6" />,
      title: "Supervised Learning",
      description: "Classification and regression to predict values from labeled data with advanced algorithms"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Unsupervised Learning", 
      description: "Clustering and dimensionality reduction to uncover hidden patterns in your data"
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Preprocessing",
      description: "Data cleaning and transformation to improve model performance automatically"
    },
    {
      icon: <Star className="w-6 h-6" />,
      title: "Dashboard",
      description: "Visualization and management of your data analysis projects in one place"
    }
  ];

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent mb-6">
            Powerful ML Tools at Your Fingertips
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
            Our comprehensive suite of machine learning tools empowers you to explore, analyze, and deploy 
            cutting-edge AI solutions with unprecedented ease and efficiency.
          </p>
        </div>
        
        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10 group"
            >
              <CardContent className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl mb-4 group-hover:from-emerald-500/30 group-hover:to-blue-500/30 transition-all duration-300">
                  <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-emerald-100 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed group-hover:text-white/70 transition-colors">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
