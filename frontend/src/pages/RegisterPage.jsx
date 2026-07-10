import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = typeof err.response?.data?.error === 'string' 
        ? err.response.data.error 
        : err.response?.data?.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full relative bg-background text-surface-50 antialiased overflow-hidden">
      {/* Left Side: Infrastructure Visuals */}
      <section className="hidden lg:flex w-1/2 relative bg-background overflow-hidden border-r border-outline-variant">
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, #334155 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}
        ></div>
        {/* Atmospheric Gradient */}
        <div className="absolute -top-1/4 -left-1/4 w-full h-full bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="relative z-10 w-full h-full flex flex-col p-8">
          {/* Brand Anchor */}
          <div className="flex items-center gap-2 mb-auto">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <svg className="w-5 h-5 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-primary-fixed-dim">Distributed Job Scheduler</span>
          </div>
          {/* Main Visual Content */}
          <div className="space-y-8 max-w-xl self-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative w-full aspect-video rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden shadow-2xl">
                <img 
                  alt="Server room" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDLby52SqedOwdaby5jgJKUPSlYO9xZ-UzL0YN2XTwoKAdN9RhlVhrvK2O_OvGGc_8TEWkyvDX7z3pRce9RAab-aWKUs-yKGaVzzpMdKbPGsG1MkNFXnVivC1ttzNN4B9r84nNi3R6OEKb_n7p3Tc3NNFG3dGhD37WQWIertKSxIPylR4wMsRZdv2IDG6BnxnLtAReNnp5WIyfFFzIcwIuw-3-Hrl9VWTFDvc9Aznln_fePJfziMc60mXWwGSpi_xmyJBbBh2LV2zGP"
                />
                {/* Status Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-[#85d19b] animate-pulse"></span>
                  <span className="text-[12px] leading-none font-semibold text-primary-fixed-dim uppercase tracking-widest">SYSTEM STATUS: OPTIMAL</span>
                </div>
                {/* Terminal Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-lg border border-outline-variant p-4 rounded-lg">
                  <div className="flex gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-error/50"></div>
                    <div className="w-2 h-2 rounded-full bg-tertiary/50"></div>
                    <div className="w-2 h-2 rounded-full bg-[#85d19b]/50"></div>
                  </div>
                  <div className="font-mono text-[13px] leading-[18px] text-on-surface-variant space-y-1">
                    <p><span className="text-primary-fixed-dim">$</span> orchestratorx --cluster-status</p>
                    <p className="text-success-400">SUCCESS: [Node_04] Heartbeat acknowledged (12ms)</p>
                    <p className="text-success-400">SUCCESS: [Node_07] Queuing mechanism active</p>
                    <p><span className="animate-pulse">_</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h1 className="text-[32px] leading-[40px] font-extrabold text-on-surface tracking-tighter">
                Reliable distributed job processing at scale.
              </h1>
              <p className="text-on-surface-variant text-[16px] leading-[24px] max-w-lg">
                Create queues, schedule jobs, monitor workers, handle retries, and analyze failures through a centralized dashboard.
              </p>
            </div>
          </div>
          {/* Subtle Footer Reference */}
          <div className="mt-auto pt-8 border-t border-outline-variant/30 flex justify-between items-center text-outline text-[12px] font-semibold tracking-widest uppercase opacity-60">
            <span>V2.4.0-STABLE</span>
            <span>DISTRIBUTED CLUSTER INFRASTRUCTURE</span>
          </div>
        </div>
      </section>

      {/* Right Side: Registration Form */}
      <section className="w-full lg:w-1/2 flex flex-col bg-background relative">
        {/* Mobile Brand Visibility */}
        <div className="lg:hidden p-4 border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-on-surface" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-base font-bold text-primary-fixed-dim">Distributed Job Scheduler</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-md space-y-8">
            {/* Title Section */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-on-surface">Create your account</h2>
              <p className="text-on-surface-variant text-sm">Start managing your distributed jobs and workers.</p>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Field */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-on-surface-variant tracking-wider uppercase" htmlFor="name">
                  FULL NAME
                </label>
                <div className="relative group">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <input 
                    id="name" 
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 text-on-surface placeholder:text-outline transition-all focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none" 
                    placeholder="Enter your full name" 
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-on-surface-variant tracking-wider uppercase" htmlFor="email">
                  EMAIL ADDRESS
                </label>
                <div className="relative group">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <input 
                    id="email" 
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 text-on-surface placeholder:text-outline transition-all focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none" 
                    placeholder="name@company.com" 
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <label className="text-[12px] font-semibold text-on-surface-variant tracking-wider uppercase" htmlFor="password">
                  PASSWORD
                </label>
                <div className="relative group">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <input 
                    id="password" 
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full h-12 bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 text-on-surface placeholder:text-outline transition-all focus:border-primary focus:ring-1 focus:ring-accent-500 focus:outline-none font-mono" 
                    placeholder="Min. 8 characters" 
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-primary text-on-surface font-semibold rounded-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account…' : 'Create Account'}
                {!loading && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>

            {/* Footer Action */}
            <div className="text-center pt-2">
              <p className="text-on-surface-variant text-sm">
                Already have an account? 
                <Link className="text-primary font-semibold hover:underline decoration-2 underline-offset-4 ml-1" to="/login">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Minimal Global Footer */}
        <footer className="p-4 flex flex-col sm:flex-row justify-center items-center border-t border-outline-variant/30 text-outline text-[10px] tracking-[0.1em] uppercase">
          <div className="flex items-center justify-center w-full">© Distributed Job Scheduler</div>
        </footer>
      </section>
    </main>
  );
}
