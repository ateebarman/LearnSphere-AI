import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheckCircle, FaVideo, FaBook, FaCode } from 'react-icons/fa';

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
      return <FaBook />;
  }
};

const ModuleCard = ({ module, roadmapId, index, defaultOpen = false, isOwner = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left p-6 flex justify-between items-center"
      >
        <div className="flex items-center">
          {isOwner && module.isCompleted ? (
            <FaCheckCircle className="text-green-500 text-2xl mr-4" />
          ) : (
            <div className="w-6 h-6 border-2 border-gray-400 rounded-full mr-4 flex-shrink-0"></div>
          )}
          <h2 className="text-2xl font-semibold text-indigo-700">{module.title}</h2>
        </div>
        <span className="text-gray-500 ml-4 flex-shrink-0">{module.estimatedTime}</span>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-gray-200">
          <p className="text-gray-700 mb-6">{module.description}</p>

          <h4 className="text-xl font-semibold mb-4">Resources</h4>
          <ul className="space-y-3 mb-6">
            {module.resources.map((res, i) => (
              <li key={i} className="flex items-center space-x-3">
                <ResourceIcon type={res.type} />
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline break-all"
                >
                  {res.title}
                </a>
              </li>
            ))}
          </ul>

          {isOwner && (
            <Link
              to={`/quiz/${roadmapId}/${encodeURIComponent(module.title)}`}
              className={`w-full block text-center px-6 py-3 rounded-lg font-semibold text-white ${
                module.isCompleted
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {module.isCompleted ? 'Retake Quiz' : 'Start Quiz'}
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default ModuleCard;