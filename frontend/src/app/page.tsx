'use client';

import Link from 'next/link';
import { Activity, Shield, Clock, Users, ArrowRight, Stethoscope, Building2, FileText, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-200">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              HRS<span className="text-blue-600"> Ghana</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
            <a href="#coverage" className="hover:text-blue-600 transition-colors">Coverage</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium text-slate-700 hover:text-blue-600">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-md shadow-blue-200/60 rounded-xl px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient blobs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-cyan-100/50 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-48 bg-gradient-to-t from-slate-50/80 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold tracking-wide mb-6 border border-blue-100">
              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
              GREATER ACCRA REGION • 170+ HEALTHCARE FACILITIES
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter text-slate-900 leading-[1.08]">
              Smarter Patient
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
                Referrals
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto">
              The Hospital Routing System streamlines patient referrals across
              Greater Accra's healthcare network — ensuring the right patient
              reaches the right facility, faster.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="text-base px-8 py-6 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-xl shadow-blue-300/40 font-semibold">
                  <Stethoscope className="h-5 w-5 mr-2" />
                  Register as a Doctor
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-2xl border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold">
                  Sign In
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-20 max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-extrabold text-slate-900">170+</div>
                <div className="text-sm text-slate-500 mt-1">Health Facilities</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-slate-900">8</div>
                <div className="text-sm text-slate-500 mt-1">Districts Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-blue-600">24/7</div>
                <div className="text-sm text-slate-500 mt-1">Real-time Routing</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-extrabold text-slate-900">100%</div>
                <div className="text-sm text-slate-500 mt-1">Digital Records</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Built for Ghana's Healthcare Workers
            </h2>
            <p className="mt-4 text-slate-500 text-lg">
              Every feature designed to reduce referral delays and improve patient outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Clock,
                title: 'Instant Referrals',
                description: 'Submit a referral in minutes — no more paperwork, phone tag, or lost forms.',
                color: 'from-blue-500 to-blue-600',
                shadow: 'shadow-blue-200',
              },
              {
                icon: Shield,
                title: 'Secure Records',
                description: 'Patient data encrypted and shared only between referring and receiving hospitals.',
                color: 'from-emerald-500 to-teal-500',
                shadow: 'shadow-emerald-200',
              },
              {
                icon: Building2,
                title: 'Smart Routing',
                description: 'Algorithm considers facility resources, bed availability, and specialist access.',
                color: 'from-violet-500 to-purple-500',
                shadow: 'shadow-violet-200',
              },
              {
                icon: Bell,
                title: 'Live Notifications',
                description: 'In-app and email alerts keep everyone updated at every stage of the referral.',
                color: 'from-amber-500 to-orange-500',
                shadow: 'shadow-amber-200',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="group bg-white rounded-2xl p-7 border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-md ${f.shadow}`}>
                  <f.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              How It Works
            </h2>
            <p className="mt-4 text-slate-500 text-lg">
              Three simple steps to get your patient the care they need.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              {
                step: '01',
                title: 'Register & Get Verified',
                description: 'Sign up as a doctor, select your hospital, and get approved by your hospital admin.',
                icon: Users,
              },
              {
                step: '02',
                title: 'Create a Referral',
                description: 'Enter patient details, clinical notes, attach lab results, and select the best receiving facility.',
                icon: FileText,
              },
              {
                step: '03',
                title: 'Track & Complete',
                description: 'Monitor referral status in real-time. Get notified when accepted, en-route, or completed.',
                icon: Activity,
              },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="text-7xl font-black text-slate-100 mb-4">{s.step}</div>
                <div className="h-14 w-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center -mt-12 mb-5 shadow-lg shadow-blue-200/50 relative z-10">
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coverage / CTA ── */}
      <section id="coverage" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600" />
        <div className="absolute inset-0 -z-10 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Serving the Greater Accra Region
          </h2>
          <p className="mt-5 text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
            From Korle-Bu Teaching Hospital to community health centres in Dangme,
            the HRS connects healthcare facilities across all districts in the
            Greater Accra region — including Accra Metropolitan, Tema, Ga East,
            Ga West, Dangme East, and Dangme West.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base px-8 py-6 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 shadow-xl shadow-blue-900/30 font-semibold">
                <Stethoscope className="h-5 w-5 mr-2" />
                Join as a Doctor
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8 py-6 rounded-2xl border-white/30 text-white hover:bg-white/10 font-semibold">
                Sign In to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Activity className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white">Hospital Routing System</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2026 HRS Ghana • Greater Accra Region • Ashesi University Capstone Project
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
