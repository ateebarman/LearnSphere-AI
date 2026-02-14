import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaVideo, FaBook, FaCode, FaChevronDown, FaChevronUp, FaExternalLinkAlt, FaChevronRight } from 'react-icons/fa';

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
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl border dark:border-gray-800 space-y-4">
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              {module.description}
            </p>

            {(module.objectives?.length > 0 || module.keyConcepts?.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t dark:border-gray-800">
                {module.objectives?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-tighter text-indigo-500">Learning Objectives</h5>
                    <ul className="space-y-1">
                      {module.objectives.map((obj, i) => (
                        <li key={i} className="text-xs font-bold text-gray-700 dark:text-gray-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0"></span>
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {module.keyConcepts?.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-tighter text-blue-500">Key Concepts</h5>
                    <div className="flex flex-wrap gap-2">
                      {module.keyConcepts.map((concept, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px] font-black border border-blue-100 dark:border-blue-900/30">
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resources Grid */}
          <div className="space-y-6">
            {/* Videos Section */}
            {module.resources?.some(r => r.type === 'video') && (
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase tracking-widest text-red-500 flex items-center gap-2">
                  <FaVideo className="text-xs" /> Recommended Tutorials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {module.resources.filter(r => r.type === 'video').map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl overflow-hidden hover:border-red-500 transition-all shadow-sm hover:shadow-xl"
                    >
                      {res.thumbnail && (
                        <div className="h-32 w-full overflow-hidden relative">
                          <img src={res.thumbnail} alt={res.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                          <div className="absolute bottom-2 right-2 bg-red-600 text-white p-2 rounded-lg shadow-lg">
                            <FaVideo />
                          </div>
                        </div>
                      )}
                      <div className="p-4">
                        <h5 className="text-sm font-black text-gray-800 dark:text-gray-200 line-clamp-2 group-hover:text-red-500 transition-colors">
                          {res.title}
                        </h5>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Section */}
            {module.resources?.some(r => r.type !== 'video') && (
              <div className="space-y-3">
                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <FaBook className="text-xs" /> Documentation & Guides
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {module.resources.filter(r => r.type !== 'video').map((res, i) => {
                    const isInternal = res.url?.startsWith('/');
                    const LinkComponent = isInternal ? Link : 'a';
                    const linkProps = isInternal
                      ? { to: res.url }
                      : { href: res.url, target: '_blank', rel: 'noopener noreferrer' };

                    return (
                      <LinkComponent
                        key={i}
                        {...linkProps}
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
                        {isInternal ? (
                          <FaChevronRight className="text-[10px] text-gray-400 group-hover:text-indigo-600" />
                        ) : (
                          <FaExternalLinkAlt className="text-[10px] text-gray-400 group-hover:text-indigo-600" />
                        )}
                      </LinkComponent>
                    );
                  })}
                </div>
              </div>
            )}
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