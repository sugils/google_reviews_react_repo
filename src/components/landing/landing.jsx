import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle, 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3,
  Zap,
  Shield,
  Bell,
  FileText,
  Star,
  Target,
  Award
} from 'lucide-react';
import './landing.css';

const VDartLanding = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <FileText className="feature-icon" />,
      title: "Request Reviews",
      description: "Submit candidate review requests instantly with our streamlined interface. Quick forms, file uploads, and priority settings."
    },
    {
      icon: <TrendingUp className="feature-icon" />,
      title: "Track Progress",
      description: "Monitor all your review requests in real-time with detailed status updates. Never lose track of a candidate review."
    },
    {
      icon: <Clock className="feature-icon" />,
      title: "Review History",
      description: "Access complete history of all reviews with advanced filtering options. Search by date, status, or candidate details."
    },
    {
      icon: <BarChart3 className="feature-icon" />,
      title: "Analytics Dashboard",
      description: "Gain insights with comprehensive analytics and performance metrics. Track team productivity and review turnaround times."
    },
    {
      icon: <Bell className="feature-icon" />,
      title: "Smart Notifications",
      description: "Stay updated with instant alerts on review status changes. Email and in-app notifications keep you informed."
    },
    {
      icon: <Shield className="feature-icon" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with role-based access control. Your data is protected with industry-standard encryption."
    }
  ];

  const stats = [
    { value: "500+", label: "Reviews Processed" },
    { value: "98%", label: "Success Rate" },
    { value: "24/7", label: "System Uptime" },
    { value: "< 2hrs", label: "Avg Response Time" }
  ];

  const benefits = [
    {
      icon: <Target size={24} />,
      title: "Streamlined Workflow",
      description: "Reduce review processing time by 60% with automated workflows"
    },
    {
      icon: <Users size={24} />,
      title: "Team Collaboration",
      description: "Seamless communication between recruiters and review teams"
    },
    {
      icon: <Award size={24} />,
      title: "Quality Assurance",
      description: "Maintain high standards with structured review processes"
    },
    {
      icon: <Star size={24} />,
      title: "Candidate Experience",
      description: "Faster turnaround times improve candidate satisfaction"
    }
  ];

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleLearnMore = () => {
    document.querySelector('.features-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="vdart-landing">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="mesh-gradient"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className={`hero-content ${isVisible ? 'visible' : ''}`}>
          <div className="hero-badge">
            <Zap size={16} />
            <span>Internal Tool - VDart Team</span>
          </div>
          
          <h1 className="hero-title">
            Welcome to
            <span className="gradient-text"> VDart</span>
            <br />
            Review Tracker
          </h1>
          
          <p className="hero-subtitle">
            Streamline your candidate review process with our powerful, 
            intuitive platform designed exclusively for VDart recruiters. 
            Request reviews, track progress, and access comprehensive analytics all in one place.
          </p>

          <div className="hero-buttons">
            <button className="btn-primary" onClick={handleGetStarted}>
              Get Started
              <ArrowRight size={20} />
            </button>
            <button className="btn-secondary" onClick={handleLearnMore}>
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="stats-container">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="stat-item"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Cards Animation */}
        <div className="floating-cards">
          <div className="float-card card-1">
            <CheckCircle size={24} className="card-icon" />
            <div className="card-text">Review Approved</div>
          </div>
          <div className="float-card card-2">
            <Users size={24} className="card-icon" />
            <div className="card-text">Team Collaboration</div>
          </div>
          <div className="float-card card-3">
            <TrendingUp size={24} className="card-icon" />
            <div className="card-text">Performance Insights</div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <div className="benefits-header">
            <h2 className="benefits-title">
              Why Choose <span className="gradient-text">VDart Review Tracker?</span>
            </h2>
          </div>
          <div className="benefits-grid">
            {benefits.map((benefit, index) => (
              <div 
                key={index} 
                className="benefit-card"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="benefit-icon">{benefit.icon}</div>
                <h3 className="benefit-title">{benefit.title}</h3>
                <p className="benefit-description">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">
            Everything You Need to
            <span className="gradient-text"> Manage Reviews</span>
          </h2>
          <p className="section-subtitle">
            Powerful features designed to make your workflow seamless and efficient. 
            From submission to completion, we've got you covered.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="gradient-text">Simple & Efficient</span> Process
          </h2>
          <p className="section-subtitle">
            Get started in three easy steps
          </p>
        </div>

        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Submit Request</h3>
            <p className="step-description">
              Fill out the review request form with candidate details and attach necessary documents
            </p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">Track Status</h3>
            <p className="step-description">
              Monitor your request in real-time and receive instant notifications on updates
            </p>
          </div>

          <div className="step-arrow">→</div>

          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Get Results</h3>
            <p className="step-description">
              Access completed reviews with detailed feedback and analysis
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">
            Join your team members already using VDart Review Tracker to streamline 
            their candidate review process and improve efficiency.
          </p>
          <button className="btn-cta" onClick={handleGetStarted}>
            Launch Dashboard
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <p className="footer-text">
            © 2025 VDart Review Tracker. Internal Tool for VDart Team.
          </p>
          <div className="footer-links">
            <a href="#" className="footer-link">Support</a>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Contact IT</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default VDartLanding;