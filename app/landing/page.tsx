"use client";
import { motion } from "framer-motion";
import { FaCheckCircle, FaMagic, FaCalendarAlt, FaLock } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-[#0C0C0D] text-[#F4F4F5] font-sans">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-12 max-w-5xl mx-auto py-24 px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1 flex flex-col gap-6"
        >
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-2" style={{ color: "#F4F4F5" }}>
            Supercharge your productivity with <span className="bg-gradient-to-r from-blue-500 to-green-400 bg-clip-text text-transparent">Prompter AI</span>
          </h1>
          <p className="text-lg md:text-xl text-[#A1A1AA] max-w-xl mb-4">
            The full-stack AI-powered task manager that turns your ideas into actionable plans. Modern, fast, and beautifully simple.
          </p>
          <div className="flex gap-4 mt-2">
            <Link href="/sign-up" passHref legacyBehavior>
              <a className="inline-block px-8 py-3 rounded-full font-semibold shadow-lg bg-[#3B82F6] text-white hover:bg-[#2563EB] active:bg-[#1D4ED8] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500" style={{ boxShadow: "0 4px 8px rgba(59,130,246,0.3)" }}>
                Start for Free
              </a>
            </Link>
            <a href="#features" className="inline-block px-8 py-3 rounded-full font-semibold bg-[#1F2937] text-[#E5E7EB] hover:bg-[#111827] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500">
              See Features
            </a>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex-1 flex items-center justify-center relative min-h-[340px]"
        >
          {/* Blurred AI-feature background */}
          <Image
            src="/AI-feature.png"
            alt="AI Feature Background"
            width={600}
            height={400}
            className="absolute left-1/2 top-1/2 w-[90%] max-w-lg -translate-x-1/2 -translate-y-1/2 blur-[40px] opacity-80 z-0 select-none pointer-events-none"
            style={{ filter: "blur(40px) brightness(1.2)", objectFit: "cover" }}
            aria-hidden="true"
            priority
          />
          {/* Animated Dashboard Image (foreground) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(59,130,246,0.25)" }}
            whileTap={{ scale: 0.98 }}
            className="relative w-[90%] max-w-lg rounded-2xl shadow-2xl bg-[#1C1C1F] border border-[#2D2D31] overflow-hidden z-10"
            style={{ boxShadow: "0 4px 32px rgba(59,130,246,0.15)" }}
          >
            <Image
              src="/dashboard.png"
              alt="Prompt Planner Dashboard Preview"
              width={600}
              height={400}
              className="w-full h-auto object-cover rounded-2xl"
              priority
            />
          </motion.div>
          {/* Second image, offset and layered for effect */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.95 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            className="absolute left-1/2 top-1/2 w-[70%] max-w-md rounded-2xl shadow-xl border border-[#2D2D31] overflow-hidden z-5 translate-x-12 translate-y-12 hidden sm:block"
            style={{ boxShadow: "0 2px 16px rgba(59,130,246,0.10)" }}
          >
            <Image
              src="/AI-feature.png"
              alt="AI Feature Secondary"
              width={480}
              height={320}
              className="w-full h-auto object-cover rounded-2xl"
              priority
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6 md:px-0 bg-gradient-to-br from-[#18181B] to-[#23232A] shadow-xl">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TestimonialCard
              avatarBg="bg-blue-600"
              initials="SK"
              quote="Prompter AI makes task planning effortless. I've never shipped this much in a week."
              name="Sarah K."
              title="Beta User"
              delay={0}
            />
            <TestimonialCard
              avatarBg="bg-green-500"
              initials="DI"
              quote="Feels like Notion and ChatGPT had a baby — super smooth experience!"
              name="Dev Intern"
              title="Early Access"
              delay={0.1}
            />
            <TestimonialCard
              avatarBg="bg-purple-500"
              initials="RM"
              quote="I used Prompter AI to plan my college projects — 10/10 would recommend."
              name="Raj M."
              title="Student"
              delay={0.2}
            />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 px-6 md:px-0 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why Prompter AI?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FaMagic className="w-8 h-8 text-[#10B981]" />}
              title="AI-Powered Planning"
              description="Turn your ideas into actionable tasks instantly with advanced AI prompt-to-plan." />
            <FeatureCard
              icon={<FaCalendarAlt className="w-8 h-8 text-[#3B82F6]" />}
              title="Modern Calendar"
              description="Visualize, organize, and manage your schedule with a beautiful, interactive calendar." />
            <FeatureCard
              icon={<FaCheckCircle className="w-8 h-8 text-[#FACC15]" />}
              title="Effortless Task Management"
              description="Add, edit, and complete tasks with a single click. Stay focused and productive." />
            <FeatureCard
              icon={<FaLock className="w-8 h-8 text-[#A855F7]" />}
              title="Private & Secure"
              description="Your data is encrypted and never shared. Privacy and security are built-in." />
          </div>
        </motion.div>
      </section>

      {/* AI Demo Section */}
      <section id="ai-demo" className="py-24 px-6 md:px-0 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1"
        >
          <div className="rounded-xl bg-[#1C1C1F] border border-[#2D2D31] shadow-xl p-8 max-w-md mx-auto">
            <div className="text-sm text-[#A1A1AA] mb-2">Prompt</div>
            <div className="bg-[#23232A] rounded-lg p-4 mb-4 text-[#F4F4F5] font-mono">Build a portfolio in 2 weeks</div>
            <div className="text-sm text-[#A1A1AA] mb-2">AI-generated Tasks</div>
            <ul className="space-y-2">
              <li className="bg-[#23232A] rounded-lg px-4 py-2 text-[#F4F4F5] text-sm shadow-sm">Design homepage wireframe</li>
              <li className="bg-[#23232A] rounded-lg px-4 py-2 text-[#F4F4F5] text-sm shadow-sm">Write project case studies</li>
              <li className="bg-[#23232A] rounded-lg px-4 py-2 text-[#F4F4F5] text-sm shadow-sm">Deploy to custom domain</li>
            </ul>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="flex-1"
        >
          <h3 className="text-2xl md:text-3xl font-semibold mb-4">Create with AI</h3>
          <p className="text-lg text-[#A1A1AA] mb-6">
            Just describe your goal. Prompter AI instantly generates a step-by-step plan you can edit, schedule, and complete.
          </p>
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-[#F4F4F5]">
              <FaMagic className="w-5 h-5 text-[#10B981]" />
              <span>AI understands your intent</span>
            </li>
            <li className="flex items-center gap-3 text-[#F4F4F5]">
              <FaCheckCircle className="w-5 h-5 text-[#FACC15]" />
              <span>Instant, editable task lists</span>
            </li>
            <li className="flex items-center gap-3 text-[#F4F4F5]">
              <FaCalendarAlt className="w-5 h-5 text-[#3B82F6]" />
              <span>Seamless calendar integration</span>
            </li>
          </ul>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section id="get-started" className="py-20 px-6 md:px-0 w-full bg-gradient-to-r from-blue-600 to-green-500 shadow-xl">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center">Ready to get more done with Prompter AI?</h2>
          <Link href="/sign-up" passHref legacyBehavior>
            <a className="inline-block px-10 py-4 rounded-full font-semibold shadow-lg bg-white text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg mt-2">
              Start for Free
            </a>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#0C0C0D] border-t border-[#2D2D31] shadow-lg rounded-t-xl mt-16">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Product */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-[#F4F4F5]">Product</h4>
            <ul className="space-y-2">
              <li><a href="/landing" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">Home</a></li>
              <li><a href="#features" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">Features</a></li>
            </ul>
          </div>
          {/* Resources */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-[#F4F4F5]">Resources</h4>
            <ul className="space-y-2">
              <li><a href="https://github.com/Mithurn" target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">GitHub</a></li>
              <li><a href="#ai-demo" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">How it Works</a></li>
            </ul>
          </div>
          {/* About */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-[#F4F4F5]">About</h4>
            <ul className="space-y-2">
              <li><span className="text-[#A1A1AA]">Built by Mithurn Jeromme</span></li>
              <li><a href="mailto:mithurnjeromme172@gmail.com" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">Contact</a></li>
              <li><a href="https://www.linkedin.com/in/mithurn-jeromme-s-k/" target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">LinkedIn</a></li>
            </ul>
          </div>
          {/* Legal */}
          <div>
            <h4 className="text-lg font-bold mb-4 text-[#F4F4F5]">Legal</h4>
            <ul className="space-y-2">
              <li><a href="/landing/privacy-policy" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">Privacy Policy</a></li>
              <li><a href="/landing/terms-of-use" className="text-[#A1A1AA] hover:text-[#3B82F6] transition-colors">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <div className="text-center text-[#71717A] text-sm pb-8">© 2025 PROMPTER AI. All rights reserved.</div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04, boxShadow: "0 6px 16px rgba(0,0,0,0.35)" }}
      className="rounded-xl bg-[#1C1C1F] border border-[#2D2D31] shadow-lg p-8 flex flex-col items-center gap-4 transition-all duration-300"
    >
      <div className="w-14 h-14 flex items-center justify-center rounded-full mb-2" style={{ background: "transparent" }}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-[#F4F4F5] text-center">{title}</h3>
      <p className="text-[#9CA3AF] text-center text-base">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({ avatarBg, initials, quote, name, title, delay }: { avatarBg: string; initials: string; quote: string; name: string; title: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="rounded-xl bg-[#1C1C1F] border border-[#2D2D31] shadow-lg p-8 flex flex-col items-center gap-4"
    >
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-md mb-2 ${avatarBg}`}>{initials}</div>
      <blockquote className="text-lg text-center font-medium text-[#F4F4F5]">“{quote}”</blockquote>
      <div className="text-sm text-[#A1A1AA] font-semibold mt-2">{name}, {title}</div>
    </motion.div>
  );
}
