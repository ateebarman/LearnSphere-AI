import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getRoadmapById } from '../services/roadmapService';
import ModuleCard from '../components/ModuleCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

const RoadmapView = () => {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openModule, setOpenModule] = useState(null);

  useEffect(() => {
    const fetchRoadmap = async () => {
      setLoading(true);
      try {
        const data = await getRoadmapById(id);
        setRoadmap(data);
        // Automatically open the first non-completed module
        const firstIncomplete = data.modules.findIndex(m => !m.isCompleted);
        setOpenModule(firstIncomplete !== -1 ? firstIncomplete : 0);
      } catch (err) {
        setError('Failed to fetch roadmap details');
      }
      setLoading(false);
    };
    fetchRoadmap();
  }, [id]);

  // --- All logic is INSIDE the component ---

  if (loading) {
    // Use the LoadingSpinner component for the loading state
    return <LoadingSpinner size="text-6xl" />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded">{error}</div>;
  }

  if (!roadmap) {
    return <p>Roadmap not found.</p>;
  }

  // This is the correct return statement
  return (
    <div>
      <h1 className="text-4xl font-bold mb-2">{roadmap.title}</h1>
      <p className="text-lg text-gray-600 mb-4">{roadmap.description}</p>
      
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2">Overall Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${roadmap.progress}%` }}
          ></div>
        </div>
        <span className="text-lg font-bold text-green-600 mt-2 block">
          {Math.round(roadmap.progress)}%
        </span>
      </div>

      {/* This is the new, clean way to render the modules.
        All the complex logic is now inside the ModuleCard component.
      */}
      <div className="space-y-4">
        {roadmap.modules.map((module, index) => (
          <ModuleCard
            key={index}
            module={module}
            roadmapId={roadmap._id}
            index={index}
            defaultOpen={index === openModule} // Pass down the open state
          />
        ))}
      </div>
    </div>
  );
};

export default RoadmapView;