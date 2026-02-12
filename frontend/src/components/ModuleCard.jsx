import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaVideo, FaBook, FaCode, FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';

// Helper component for the resource icons
const ResourceIcon = ({ type }) => {
  switch (type) {
    case 'video':
      return <FaVideo className="text-red-500" />;
    case 'article':
    case 'doc':
      return <FaBook className="text-blue-500" />;
    case 'challenge':
      return <FaCode className="text-green-500" />;
    default:
      return <FaBook className="text-indigo-500" />;
  }
};

const ModuleCard = ({ module, roadmapId, index, defaultOpen = false, isOwner = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`card-premium overflow-hidden transition-all duration-300 ${isOpen ? 'ring-2 ring-indigo-500/20' : ''}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex justify-between items-center group"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            {isOwner && module.isCompleted ? (
              <FaCheckCircle className="text-green-500 text-3xl drop-shadow-sm" />
            ) : (
              <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-700 rounded-full flex-shrink-0 group-hover:border-indigo-500 transition-colors"></div>
            )}
          </div>
          <div className="space-y-1">
            <h2 className={`text-2xl font-black transition-colors ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
              {module.title}
            </h2>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
              <span>Node {index + 1}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{module.estimatedTime}</span>
            </div>
          </div>
        </div>
        <div className={`p-2 rounded-xl transition-all ${isOpen ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600' : 'text-gray-400'}`}>
          {isOpen ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 pt-2 space-y-8 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {module.description}
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
              <FaBook className="text-xs" /> Core Learning Resources
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {module.resources.map((res, i) => (
                <a
                  key={i}
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl group hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <ResourceIcon type={res.type} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {res.title}
                    </span>
                  </div>
                  <FaExternalLinkAlt className="text-[10px] text-gray-400 group-hover:text-indigo-600" />
                </a>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="pt-4">
              <Link
                to={`/quiz/${roadmapId}/${encodeURIComponent(module.title)}`}
                className={`btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg ${module.isCompleted
                  ? 'bg-green-600 shadow-green-600/20'
                  : 'shadow-indigo-600/20'
                  }`}
              >
                {module.isCompleted ? (
                  <> <FaCheckCircle /> Retake Mastery Assessment </>
                ) : (
                  <> Start Module Mastery Quiz </>
                )}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleCard;