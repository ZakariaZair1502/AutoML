import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Book, Users, Settings, Star } from 'lucide-react';

const FeatureCards = () => {
  const cards = [
    {
      id: 'supervised',
      title: 'Supervised Learning',
      description: 'Train models with labeled data for classification and regression tasks. Perfect for prediction and pattern recognition.',
      icon: <Book className="w-8 h-8" />,
      gradient: 'from-emerald-500 to-teal-600',
      hoverGradient: 'from-emerald-600 to-teal-700',
      bgGradient: 'from-emerald-500/10 to-teal-500/10',
      features: ['Classification Models', 'Regression Analysis', 'Feature Selection', 'Model Validation']
    },
    {
      id: 'unsupervised',
      title: 'Unsupervised Learning',
      description: 'Discover hidden patterns in unlabeled data through clustering and dimensionality reduction techniques.',
      icon: <Users className="w-8 h-8" />,
      gradient: 'from-blue-500 to-indigo-600',
      hoverGradient: 'from-blue-600 to-indigo-700',
      bgGradient: 'from-blue-500/10 to-indigo-500/10',
      features: ['Clustering Analysis', 'PCA & t-SNE', 'Anomaly Detection', 'Data Visualization']
    },
    {
      id: 'preprocessing',
      title: 'Data Preprocessing',
      description: 'Clean, transform, and prepare your data for optimal model performance with automated tools.',
      icon: <Settings className="w-8 h-8" />,
      gradient: 'from-purple-500 to-pink-600',
      hoverGradient: 'from-purple-600 to-pink-700',
      bgGradient: 'from-purple-500/10 to-pink-500/10',
      features: ['Data Cleaning', 'Feature Engineering', 'Normalization', 'Missing Value Handling']
    },
    {
      id: 'dashboard',
      title: 'Analytics Dashboard',
      description: 'Monitor, visualize, and manage all your ML projects in one comprehensive dashboard interface.',
      icon: <Star className="w-8 h-8" />,
      gradient: 'from-orange-500 to-red-600',
      hoverGradient: 'from-orange-600 to-red-700',
      bgGradient: 'from-orange-500/10 to-red-500/10',
      features: ['Real-time Monitoring', 'Interactive Charts', 'Project Management', 'Export Results']
    }
  ];

  const handleCardClick = (cardId: string) => {
    console.log(`Navigating to ${cardId} section`);
    // Navigation logic would go here
  };

  return (
    <section className="py-20 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent mb-6">
            Choose Your ML Journey
          </h2>
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Select the machine learning approach that best fits your data and objectives
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <Card 
              key={card.id}
              className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-500 hover:transform hover:scale-105 cursor-pointer"
              onClick={() => handleCardClick(card.id)}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Floating elements */}
              <div className="absolute top-4 right-4 w-12 h-12 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-500"></div>
              <div className="absolute bottom-4 left-4 w-8 h-8 bg-white/5 rounded-full blur-lg group-hover:bg-white/10 transition-all duration-500"></div>
              
              <CardContent className="relative p-8 h-full flex flex-col">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${card.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <div className="text-white">
                    {card.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-grow">
                  <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-emerald-100 transition-colors">
                    {card.title}
                  </h3>
                  
                  <p className="text-white/70 mb-6 leading-relaxed group-hover:text-white/80 transition-colors">
                    {card.description}
                  </p>

                  {/* Features list */}
                  <ul className="space-y-2 mb-6">
                    {card.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-white/60 group-hover:text-white/70 transition-colors">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-3 group-hover:bg-emerald-300 transition-colors"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <Button
                  className={`w-full bg-gradient-to-r ${card.gradient} hover:${card.hoverGradient} text-white border-0 rounded-xl py-3 font-semibold transition-all duration-300 transform group-hover:scale-105 shadow-lg hover:shadow-xl`}
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Transform Your Data?
            </h3>
            <p className="text-white/70 mb-6 max-w-2xl mx-auto">
              Join thousands of data scientists and analysts who trust AutoModeler for their machine learning projects.
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
