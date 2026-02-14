import React from 'react';
import { FaShieldAlt, FaCode, FaServer, FaDatabase, FaNetworkWired, FaMicrochip, FaCloud, FaLock } from 'react-icons/fa';

const categoryIcons = {
    'DSA': <FaCode />,
    'System Design': <FaServer />,
    'OS': <FaMicrochip />,
    'Database': <FaDatabase />,
    'Networking': <FaNetworkWired />,
    'Security': <FaLock />,
    'Cloud': <FaCloud />,
    'Web Development': <FaCode />,
    'General': <FaShieldAlt />,
};

const SkillNode = ({ category, level, progress, averageScore }) => {
    const icon = categoryIcons[category] || <FaShieldAlt />;

    // Calculate color based on level
    const colors = [
        'from-slate-400 to-slate-500', // LVL 1
        'from-indigo-500 to-blue-500', // LVL 2
        'from-purple-500 to-pink-500', // LVL 3
        'from-amber-400 to-orange-500', // LVL 4
        'from-emerald-400 to-teal-500', // LVL 5
    ];

    const activeColor = colors[Math.min(level - 1, colors.length - 1)];

    return (
        <div className="relative group">
            {/* Node Hexagon */}
            <div className="flex flex-col items-center">
                <div className={`w-20 h-20 relative flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                    {/* Hexagon Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeColor} opacity-20 blur-xl group-hover:opacity-40 transition-opacity`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeColor} clip-hex border-2 border-white/10 shadow-lg shadow-black/20`}></div>

                    {/* Icon */}
                    <div className="relative z-10 text-2xl text-white drop-shadow-md">
                        {icon}
                    </div>

                    {/* Progress Ring */}
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeDasharray={213}
                            strokeDashoffset={213 - (213 * progress) / 100}
                            className="text-white/30"
                        />
                    </svg>
                </div>

                {/* Label */}
                <div className="mt-4 text-center">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                        {category}
                    </h4>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-xs font-black text-white">LVL {level}</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                        <span className="text-[10px] font-bold text-gray-400">{averageScore}%</span>
                    </div>
                </div>
            </div>

            {/* Tooltip */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-4 px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none whitespace-nowrap shadow-2xl">
                <p className="text-xs font-bold text-white mb-1">Expertise in {category}</p>
                <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black">{Math.round(progress)}% to next level</p>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .clip-hex {
          clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
        }
      `}} />
        </div>
    );
};

const SkillTree = ({ masteryData }) => {
    if (!masteryData || masteryData.length === 0) return null;

    return (
        <div className="card-premium p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <FaShieldAlt className="text-9xl rotate-12" />
            </div>

            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                            <FaShieldAlt />
                        </span>
                        My Skill Tree
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">
                        Visualize your technical growth across core domains
                    </p>
                </div>
                <div className="px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-2xl">
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Total Mastery</span>
                    <div className="text-lg font-black text-white">
                        {Math.round(masteryData.reduce((acc, m) => acc + m.level, 0))} Points
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-12 py-6">
                {masteryData.map((mastery, idx) => (
                    <SkillNode
                        key={idx}
                        category={mastery.category}
                        level={mastery.level}
                        progress={mastery.progress}
                        averageScore={mastery.averageScore}
                    />
                ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800/50 flex items-center justify-between">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-slate-500 rounded-sm"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">Novice</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">Advanced</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div>
                        <span className="text-[10px] font-black text-gray-500 uppercase">Master</span>
                    </div>
                </div>
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest italic">
                    Power up by completing roadmap modules and quizzes
                </p>
            </div>
        </div>
    );
};

export default SkillTree;
