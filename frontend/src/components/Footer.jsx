import { Link } from 'react-router-dom';
import { Github, Twitter, Linkedin, MessageCircle, Heart, Sparkles } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="relative bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 pt-20 pb-10 px-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    {/* Brand Section */}
                    <div className="md:col-span-1 space-y-6">
                        <Link to="/" className="group flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-black font-display text-gradient">
                                LearnSphere
                            </span>
                        </Link>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
                            Empowering the world to master any skill through personalized, AI-driven learning paths and community collaboration.
                        </p>
                        <div className="flex space-x-3">
                            {[
                                { icon: Github, href: "#" },
                                { icon: Twitter, href: "#" },
                                { icon: Linkedin, href: "#" },
                                { icon: MessageCircle, href: "#" }
                            ].map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 transition-all border border-slate-100 dark:border-slate-800"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Platform</h4>
                        <ul className="space-y-4 text-sm">
                            <li><Link to="/explore" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Explore Paths</Link></li>
                            <li><Link to="/dashboard" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Your Dashboard</Link></li>
                            <li><Link to="/tutor" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">24/7 AI Tutor</Link></li>
                            <li><Link to="/library" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Resource Base</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Support</h4>
                        <ul className="space-y-4 text-sm">
                            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Help Center</a></li>
                            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">API Reference</a></li>
                            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a></li>
                            <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Use</a></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Stay Updated</h4>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">Join our newsletter for the latest AI learning hacks.</p>
                        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                            <input
                                type="email"
                                placeholder="you@email.com"
                                className="form-input text-sm py-3 px-4"
                            />
                            <button className="btn-primary w-full py-3 text-sm font-bold">
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-slate-100 dark:border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
                    <p>© {new Date().getFullYear()} LearnSphere AI. All rights reserved.</p>
                    <div className="mt-4 md:mt-0 flex items-center space-x-2">
                        <span>Made with</span>
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                        <span>for modern learners</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

