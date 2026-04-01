'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Activity, Shield, Clock, Users, ArrowRight, Stethoscope, Building2, FileText, Bell, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

const carouselImages = [
  '/images/doctor-1.png',
  '/images/doctor-2.png',
  '/images/doctor-3.png'
];

export default function LandingPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#E8F1FF]">
      {/* Decorative medical dot pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#116BF8_1.5px,transparent_1.5px)] [background-size:28px_28px] opacity-[0.06] pointer-events-none" />
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[20%] w-[800px] h-[800px] z-0 bg-white/70 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] z-0 bg-[#21BCEE]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              HRS<span className="text-primary font-semibold"> Ghana</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10 text-sm font-medium text-foreground/80">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#coverage" className="hover:text-primary transition-colors">Coverage</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-semibold text-foreground hover:text-primary">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm font-semibold bg-primary hover:bg-secondary text-primary-foreground shadow-md rounded-xl px-6 py-5 transition-colors">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (Split) ── */}
      <section className="relative pt-36 pb-24 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Elevated Card */}
            <div className="bg-white p-10 md:p-14 rounded-3xl shadow-xl shadow-primary/5 border border-border">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
                Smarter, Faster
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-primary to-accent">
                  Patient Referrals
                </span>
              </h1>
              <p className="mt-6 text-lg text-foreground/70 leading-relaxed">
                The Hospital Routing System streamlines patient referrals across Greater Accra's healthcare network — ensuring the right patient reaches the right facility, without delay.
              </p>
              
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full text-base px-8 py-7 rounded-2xl bg-gradient-to-r from-secondary via-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 font-bold text-white group overflow-hidden relative">
                    <span className="relative z-10 flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                      Register as a Doctor
                    </span>
                  </Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full text-base px-8 py-7 rounded-2xl border-border text-foreground hover:bg-muted font-bold transition-colors">
                    Sign In
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
              </div>

              {/* Stats Mini */}
              <div className="mt-12 pt-8 border-t border-border grid grid-cols-3 gap-4 text-center sm:text-left">
                <div>
                  <div className="text-2xl font-black text-foreground">170+</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Facilities</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-primary">24/7</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Routing</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-foreground">100%</div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mt-1">Digital</div>
                </div>
              </div>
            </div>

            {/* Right: Carousel */}
            <div className="relative h-[600px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-secondary/10 border border-border">
              {carouselImages.map((src, index) => (
                <div
                  key={src}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`Healthcare professional ${index + 1}`}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  {/* Subtle gradient overlay to match premium aesthetic */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/60 mix-blend-multiply via-primary/30 to-transparent" />
                </div>
              ))}
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                {carouselImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      idx === currentImageIndex ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Accra Map Section ── */}
      <section id="coverage" className="py-24 bg-white relative overflow-hidden">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[600px] h-[600px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-12 items-center">
            {/* Map Imagery */}
            <div className="relative w-full aspect-[4/3] lg:aspect-[16/10] flex items-center justify-center p-0 md:p-8">
                {/* Background SVG Map */}
                <Image
                  src="/images/Ghanamap.svg"
                  alt="Accra City Map Base"
                  fill
                  className="object-contain opacity-90 drop-shadow-md"
                />
                
                {/* Header Overlay */}
                <div className="absolute top-4 left-4 z-20 bg-white/40 backdrop-blur-md p-3 rounded-2xl border border-white/50">
                  <h3 className="text-xl md:text-3xl font-black text-secondary tracking-tight">ACCRA</h3>
                  <p className="text-primary font-bold tracking-widest text-[10px] md:text-xs">HOSPITAL NETWORK</p>
                </div>

                {/* Interconnectors */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#05269B" />
                        <stop offset="50%" stopColor="#116BF8" />
                        <stop offset="100%" stopColor="#21BCEE" />
                      </linearGradient>
                    </defs>
                    <path d="M 26,62 L 40,45 L 53,60 L 68,52 L 40,45 M 53,60 L 60,78 M 68,52 L 26,62" fill="none" stroke="url(#lineGrad)" strokeWidth="0.8" strokeDasharray="1.5 1.5" className="animate-pulse opacity-80" />
                </svg>

                {/* HTML PINS Overlay */}
                <div className="absolute w-full h-full z-20 pointer-events-none">
                    <div className="absolute top-[62%] left-[26%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 md:w-5 md:h-5 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-1 md:w-2 md:h-2 bg-white rounded-full"></div></div>
                        <span className="mt-1 text-[8px] md:text-[10px] font-bold text-secondary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">Korle Bu Teaching</span>
                    </div>
                    
                    <div className="absolute top-[45%] left-[40%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <div className="w-4 h-4 md:w-6 md:h-6 bg-secondary rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 bg-primary rounded-full"></div></div>
                        <span className="mt-1 text-[8px] md:text-[11px] font-extrabold text-primary bg-white/90 px-2 py-0.5 rounded shadow-sm border border-primary/20">Ridge Hospital</span>
                    </div>
                    
                    <div className="absolute top-[60%] left-[53%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full"></div></div>
                        <span className="mt-1 text-[8px] md:text-[10px] font-bold text-secondary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">37 Military</span>
                    </div>
                    
                    <div className="absolute top-[52%] left-[68%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 md:w-5 md:h-5 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-1 md:w-2 md:h-2 bg-white rounded-full"></div></div>
                        <span className="mt-1 text-[8px] md:text-[10px] font-bold text-secondary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">La General</span>
                    </div>
                    
                    <div className="absolute top-[78%] left-[60%] flex flex-col items-center -translate-x-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-primary rounded-full border-2 border-white shadow-lg flex items-center justify-center"><div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-white rounded-full"></div></div>
                        <span className="mt-1 text-[8px] md:text-[10px] font-bold text-secondary bg-white/90 px-1.5 py-0.5 rounded shadow-sm">LEKMA</span>
                    </div>
                </div>
            </div>

            {/* Map Content */}
            <div>
              <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center shadow-lg mb-8">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                Connecting Healthcare Across the Region
              </h2>
              <p className="mt-6 text-lg text-foreground/70 leading-relaxed">
                The HRS integrates with clinics, polyclinics, and major teaching hospitals throughout the Greater Accra region. Our intelligent routing network ensures an equitable distribution of patients based on active bed capacity and specialist availability.
              </p>
              <ul className="mt-8 space-y-4 text-foreground/80 font-medium">
                {[
                  'Accra Metropolitan & Sub-metros',
                  'Tema & Ashaiman Districts',
                  'Ga East, West & South Municipalities',
                  'Dangme East & West Districts'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-muted/40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Built for Ghana's Healthcare Workforce
            </h2>
            <p className="mt-4 text-foreground/60 text-lg">
              Every feature designed with precision to reduce referral delays and improve patient outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: 'Instant Referrals',
                description: 'Submit a referral in minutes — no more paperwork, phone tag, or lost forms.',
              },
              {
                icon: Shield,
                title: 'Secure Records',
                description: 'Patient data encrypted and shared only securely between healthcare personnel.',
              },
              {
                icon: Building2,
                title: 'Smart Routing',
                description: 'Algorithm considers real facility resources, operational bed capacity, and specialist access.',
              },
              {
                icon: Bell,
                title: 'Live Notifications',
                description: 'In-app and email alerts keep everyone accurately updated at every critical stage.',
              },
            ].map((f, i) => (
               <div
                key={i}
                className="group bg-white rounded-3xl p-8 border border-border shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-secondary via-primary to-accent flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-foreground/60 text-lg">
              Three robust steps to get your patient the specialized care they desperately need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto relative mt-16">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-[2.25rem] left-[15%] right-[15%] h-1 bg-gradient-to-r from-secondary via-primary to-accent opacity-30 rounded-full" />
            
            {[
              {
                step: '01',
                title: 'Register & Verify',
                description: 'Sign up securely. Your local hospital administrator quickly verifies your credentials.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Submit Data',
                description: 'Enter clinical notes, attach necessary labs, and let the algorithm rank receiving facilities.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'Monitor & Complete',
                description: 'Track the referral status instantly via the central dashboard and automated emails.',
                icon: Activity,
              },
            ].map((s, i) => (
              <div key={i} className="relative z-10 bg-white p-8 rounded-3xl border border-border shadow-md shadow-primary/5 text-center transition-transform hover:-translate-y-2 group">
                <div className="h-20 w-20 mx-auto rounded-full bg-gradient-to-br from-secondary/5 via-primary/10 to-accent/20 flex items-center justify-center mb-6 text-primary font-bold text-2xl border-4 border-white shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                  {s.step}
                </div>
                <h3 className="text-xl font-extrabold text-foreground mb-3">{s.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-secondary pt-16 pb-8 border-t border-secondary/80">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid md:grid-cols-2 gap-10 mb-12 items-center">
             <div>
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-white">
                    HRS
                  </span>
               </div>
               <p className="text-white/60 text-sm max-w-sm leading-relaxed">
                 A comprehensive software platform built for optimizing resource allocation and reducing referral latency across Greater Accra.
               </p>
             </div>
             <div className="flex md:justify-end">
             </div>
           </div>
           
          <div className="border-t border-white/10 pt-8 flex flex-col items-center justify-center">
            <p className="text-white/40 text-sm font-medium tracking-wide">
              &copy; 2026 HRS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
