import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = typeof err.response?.data?.error === 'string' 
        ? err.response.data.error 
        : err.response?.data?.message || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full relative bg-background text-surface-50 antialiased overflow-hidden">
      {/* Left Panel: Branding & Imagery */}
      <section className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative bg-background border-r border-outline-variant flex-col justify-between p-12 overflow-hidden">
        {/* Atmospheric Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity z-0" 
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBsKWytrjFpdiU0LHm5aEP2wBGhXMxFwTaJi-LHqbp2mtN-EqXfDMEQOTO7_gJnyl-RnvO76bfhNjrKRVpXbtz-rskow_FkxHMOYhQ5TtzhRbb5EojmF6whpPdFO9V6qCQaS8CuaGZGnSbYJ8um429ZiWSIhvP9eSfwMfIED_Sk6KLR5QIrF-iHkhZpZxfXHiEAZixMO_p7sWpUCjAlbbRlC9N_xRtCJkM_mJF8DwtyCeoPHJi5gT0J2qovooOYgELvHqYSYCh8YuWW')" }}
        ></div>
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-surface-950/80 via-surface-950/50 to-surface-950 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-500/10 to-transparent z-0"></div>
        
        {/* Brand Anchor */}
        <div className="z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-[32px] leading-[40px] font-black text-primary tracking-tight">Distributed Job Scheduler</span>
        </div>
        
        {/* Value Proposition */}
        <div className="z-10 max-w-lg mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-lowest/50 border border-outline-variant rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-[#85d19b] shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
            <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-widest">System Status: Optimal</span>
          </div>
          <h1 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-4">Reliable distributed job processing at scale.</h1>
          <p className="text-[14px] leading-[20px] text-on-surface-variant max-w-md">Create queues, schedule jobs, monitor workers, handle retries, and analyze failures through a centralized dashboard.</p>
        </div>
      </section>

      {/* Right Panel: Authentication Card */}
      <section className="w-full lg:w-7/12 xl:w-1/2 flex items-center justify-center p-6 relative bg-background">
        {/* Subtle background glows */}
        <div className="absolute top-1/4 -right-32 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 -left-32 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        {/* Mobile Brand Visibility */}
        <div className="lg:hidden absolute top-0 left-0 right-0 p-4 border-b border-outline-variant flex items-center justify-between bg-background/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center border border-primary/30">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-base font-bold text-primary">Distributed Job Scheduler</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="w-full max-w-[440px] relative z-10 mt-16 lg:mt-0">
          {/* Frame/Border element */}
          <div className="bg-background border border-outline-variant rounded-xl shadow-2xl relative overflow-hidden transition-all duration-500">
            {/* Progress Bar Top */}
            <div 
              className={`absolute top-0 left-0 h-1 bg-primary transition-all duration-300 ease-out z-20 ${loading ? 'w-full' : 'w-0'}`} 
            ></div>
            
            {/* LOGIN FORM */}
            <div className="p-8 bg-background flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-[24px] leading-[32px] font-semibold text-on-surface mb-2">Sign in to your account</h2>
                <p className="text-[14px] leading-[20px] text-on-surface-variant">Access your distributed job scheduling dashboard.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider block" htmlFor="login-email">Email</label>
                  <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <input 
                      id="login-email" 
                      type="email" 
                      required 
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg pl-10 pr-4 py-2.5 text-[14px] placeholder:text-surface-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-accent-500/50 transition-all shadow-inner" 
                      placeholder="admin@domain.com" 
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider block" htmlFor="login-password">Password</label>
                  </div>
                  <div className="relative group">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-outline group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                    <input 
                      id="login-password" 
                      type="password" 
                      required 
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg pl-10 pr-4 py-2.5 text-[14px] placeholder:text-surface-600 focus:outline-none focus:border-primary focus:ring-1 focus:ring-accent-500/50 transition-all shadow-inner" 
                      placeholder="••••••••" 
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-on-surface rounded-lg py-2.5 text-[16px] font-semibold hover:bg-primary-container transition-all relative overflow-hidden group flex items-center justify-center shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className={`flex items-center gap-2 transition-transform duration-300 ${loading ? '-translate-y-8 opacity-0' : ''}`}>
                      Sign In 
                      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                    <span className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                      <svg className="animate-spin h-5 w-5 text-on-surface" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center border-t border-outline-variant pt-6">
                <p className="text-[13px] text-on-surface-variant">
                  Don't have an account? 
                  <Link to="/register" className="text-primary font-semibold hover:text-primary-fixed-dim transition-colors ml-1">
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="absolute bottom-6 w-full text-center z-10 px-6 hidden lg:block">
          <div className="flex items-center justify-center gap-4 text-[12px] text-outline">© Distributed Job Scheduler</div>
        </div>
      </section>
    </main>
  );
}
