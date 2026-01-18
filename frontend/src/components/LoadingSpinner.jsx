import { FaSpinner } from 'react-icons/fa';

const LoadingSpinner = ({ size = 'text-4xl' }) => {
  return (
    <div className="flex justify-center items-center w-full my-8">
      <FaSpinner className={`animate-spin text-indigo-600 ${size}`} />
    </div>
  );
};

export default LoadingSpinner;