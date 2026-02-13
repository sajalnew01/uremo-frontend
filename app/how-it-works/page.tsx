"use client";

/**
 * PATCH_98: How It Works — Platform Overview Page
 * Explains Uremo's marketplace + workforce model for new users & workers
 */

import Link from "next/link";

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="relative bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-4 mb-3">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 text-lg font-bold">
          {step}
        </span>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center mb-10">
      <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
        {badge}
      </span>
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
        {title}
      </h2>
      <p className="text-zinc-400 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 pt-20 pb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            How <span className="text-emerald-400">Uremo</span> Works
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            A professional marketplace connecting businesses with verified
            workers — from microjobs to AI data labelling, all in one platform.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/explore-services"
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              Explore Services
            </Link>
            <Link
              href="/apply-to-work"
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium border border-zinc-700 transition-colors"
            >
              Apply to Work
            </Link>
          </div>
        </div>
      </section>

      {/* For Clients */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionHeading
          badge="FOR CLIENTS"
          title="Get Work Done"
          subtitle="Hire verified professionals for any digital task — from data labelling to creative services."
        />
        <div className="grid md:grid-cols-3 gap-6">
          <StepCard
            step={1}
            icon="🔍"
            title="Browse Services"
            description="Explore our marketplace of verified services. Filter by category, price, or delivery time to find exactly what you need."
          />
          <StepCard
            step={2}
            icon="📦"
            title="Place an Order"
            description="Choose your service, select options, and place your order. Pay securely through our wallet system with proof-of-delivery protection."
          />
          <StepCard
            step={3}
            icon="✅"
            title="Get Delivery"
            description="Workers complete your task with verified proof of work. Review, approve, and release payment when satisfied."
          />
        </div>
      </section>

      {/* For Workers */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionHeading
          badge="FOR WORKERS"
          title="Earn on Your Terms"
          subtitle="Join our workforce, complete screenings, and start earning from real projects."
        />
        <div className="grid md:grid-cols-4 gap-6">
          <StepCard
            step={1}
            icon="📝"
            title="Apply"
            description="Browse open positions and apply for roles that match your skills. No experience needed for many entry-level tasks."
          />
          <StepCard
            step={2}
            icon="🎓"
            title="Get Screened"
            description="Complete screening tests to verify your skills. Our training materials help you prepare and succeed."
          />
          <StepCard
            step={3}
            icon="💼"
            title="Work on Projects"
            description="Once qualified, get assigned to real projects. Complete microjobs or AI data tasks at your own pace."
          />
          <StepCard
            step={4}
            icon="💰"
            title="Get Paid"
            description="Submit proof of work, get verified by admin, and earn directly to your wallet. Withdraw anytime."
          />
        </div>
      </section>

      {/* Platform Features */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <SectionHeading
          badge="PLATFORM"
          title="Built for Trust & Quality"
          subtitle="Every feature designed to protect both clients and workers."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔒",
              title: "Secure Wallet",
              desc: "Built-in wallet with atomic transactions. Fund once, pay for multiple services.",
            },
            {
              icon: "📸",
              title: "Proof of Work",
              desc: "Workers submit verified proof for every task. Clients see exactly what was delivered.",
            },
            {
              icon: "🤖",
              title: "AI Data & RLHF",
              desc: "Specialized dataset tasks for AI training — labeling, annotation, and human feedback.",
            },
            {
              icon: "🎫",
              title: "Support Tickets",
              desc: "Direct support channel with real-time responses from our team.",
            },
            {
              icon: "🔗",
              title: "Affiliate Program",
              desc: "Refer clients or workers and earn commissions on every transaction they make.",
            },
            {
              icon: "📊",
              title: "Real-time Dashboard",
              desc: "Track your orders, earnings, projects, and wallet balance all in one place.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <span className="text-2xl mb-3 block">{f.icon}</span>
              <h3 className="text-white font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-zinc-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Ready to get started?
        </h2>
        <p className="text-zinc-400 mb-8">
          Whether you&apos;re looking to hire or earn, Uremo has you covered.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/signup"
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
          >
            Create Account
          </Link>
          <Link
            href="/explore-services"
            className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium border border-zinc-700 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </section>
    </div>
  );
}
