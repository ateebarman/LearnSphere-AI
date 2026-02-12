import { useState, useEffect } from 'react';
import { uploadMaterial, getMaterials, deleteMaterial, generateRAGRoadmap } from '../services/studyMaterialService';
import { useNavigate } from 'react-router-dom';
import { FaFileUpload, FaFilePdf, FaBrain, FaTrash, FaSpinner, FaPlus, FaBookReader } from 'react-icons/fa';

const AdvancedStudy = () => {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        fetchMaterials(true);

        // Polling setup: Refresh every 5 seconds if there are materials processing
        const interval = setInterval(() => {
            refreshStatus();
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fetchMaterials = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const data = await getMaterials();
            setMaterials(data);
        } catch (err) {
            console.error('Failed to fetch materials');
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    const refreshStatus = async () => {
        try {
            const data = await getMaterials();
            setMaterials(data);
        } catch (err) {
            console.error('Quiet refresh failed');
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            setUploading(true);
            await uploadMaterial(formData);
            fetchMaterials(false);
        } catch (err) {
            alert('Upload failed. Ensure the server is running and file size is under 10MB.');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to remove this material?')) return;
        try {
            await deleteMaterial(id);
            if (selectedMaterial === id) setSelectedMaterial(null);
            fetchMaterials(false);
        } catch (err) {
            alert('Failed to delete material');
        }
    };

    useEffect(() => {
        // Auto-select the first ready material if none selected
        if (!selectedMaterial && materials.length > 0) {
            const ready = materials.find(m => m.status === 'ready');
            if (ready) setSelectedMaterial(ready._id);
        }
    }, [materials, selectedMaterial]);

    const handleGenerate = async () => {
        const material = materials.find(m => m._id === selectedMaterial);

        if (!selectedMaterial) {
            alert('Please select a source material from your library on the left first.');
            return;
        }

        if (!topic) {
            alert('Please enter what you want to learn about (e.g., "compression algorithms").');
            return;
        }

        if (material?.status !== 'ready') {
            alert('This material is still processing. Please wait for the "Ready for RAG" status.');
            return;
        }

        try {
            setGenerating(true);
            const data = await generateRAGRoadmap(topic, selectedMaterial);
            navigate(`/roadmap/${data._id}`);
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            alert(`RAG Error: ${msg}\n\nHint: Ensure your MongoDB Vector Search Index is named 'vector_index' and numDimensions is set to 3072.`);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            {/* Header Section */}
            <div className="space-y-4">
                <h1 className="text-5xl font-black text-gradient leading-tight flex items-center gap-4">
                    <FaBrain className="text-indigo-600" />
                    Advanced RAG Study
                </h1>
                <p className="text-xl text-gray-500 font-medium">
                    Upload your textbooks or notes. Our AI will analyze them and build custom learning paths base exclusively on your content.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar: Upload & List */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="card-premium p-6 space-y-4">
                        <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            <FaFileUpload className="text-indigo-600" />
                            Source Materials
                        </h3>

                        <label className="block">
                            <div className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading ? 'bg-gray-50 border-gray-300' : 'bg-gray-50 dark:bg-gray-900 border-indigo-200 dark:border-indigo-900 hover:border-indigo-500'
                                }`}>
                                {uploading ? (
                                    <FaSpinner className="animate-spin text-3xl text-indigo-600" />
                                ) : (
                                    <>
                                        <FaFilePdf className="text-3xl text-red-500 mb-2" />
                                        <span className="text-sm font-bold text-gray-500">Upload Study PDF</span>
                                    </>
                                )}
                                <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
                            </div>
                        </label>

                        <div className="space-y-3 pt-4 border-t dark:border-gray-800">
                            <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Your Knowledge Library</p>
                            {loading ? (
                                <div className="flex justify-center py-4"><FaSpinner className="animate-spin" /></div>
                            ) : materials.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">No materials uploaded yet.</p>
                            ) : (
                                materials.map((m) => (
                                    <div
                                        key={m._id}
                                        onClick={() => setSelectedMaterial(m._id)}
                                        className={`group p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedMaterial === m._id
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-900 hover:border-indigo-300'
                                            } ${m.status === 'processing' ? 'opacity-50 cursor-wait' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FaFilePdf className={selectedMaterial === m._id ? 'text-white' : m.status === 'error' ? 'text-red-400' : 'text-red-500'} />
                                            <div className="max-w-[150px]">
                                                <p className="text-sm font-bold truncate">{m.fileName}</p>
                                                <p className={`text-[10px] uppercase font-black ${selectedMaterial === m._id ? 'text-indigo-200' : m.status === 'error' ? 'text-red-500' : 'text-gray-400'}`}>
                                                    {m.status === 'processing' ? 'Processing...' :
                                                        m.status === 'error' ? `Error: ${m.metadata?.errorMessage || 'Check Logs'}` :
                                                            m.status === 'ready' ? 'Ready for RAG' : 'Preparing...'}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(m._id); }}
                                            className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${selectedMaterial === m._id ? 'hover:bg-indigo-500' : 'hover:bg-red-50 text-red-500'
                                                }`}
                                        >
                                            <FaTrash size={12} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Area: RAG Generation */}
                <div className="lg:col-span-2">
                    <div className="card-premium p-10 h-full flex flex-col justify-center space-y-10 relative overflow-hidden">
                        {/* Animated Background Element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                        <div className="space-y-6">
                            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-4xl text-white shadow-2xl shadow-indigo-600/40 mx-auto">
                                <FaBookReader />
                            </div>
                            <div className="text-center space-y-2">
                                <h2 className="text-3xl font-black dark:text-white">What do you want to learn?</h2>
                                <p className="text-gray-500 font-medium max-w-md mx-auto">
                                    Select a material on the left and enter a specific topic from it. Our RAG system will build a roadmap based on that material's data.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6 max-w-lg mx-auto w-full">
                            <input
                                type="text"
                                placeholder="e.g. Chapter 4: Neural Networks"
                                className="form-input text-lg py-4 px-6 text-center"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="btn-primary w-full py-5 text-xl flex items-center justify-center gap-3 shadow-2xl shadow-indigo-600/20 disabled:bg-indigo-400/50"
                            >
                                {generating ? (
                                    <> <FaSpinner className="animate-spin" /> Retreiving Knowledge... </>
                                ) : (
                                    <> <FaPlus /> Create RAG Roadmap </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-10">
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 text-center space-y-1">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">RAG Engine</p>
                                <p className="text-sm font-bold dark:text-white">Active (Vector v4)</p>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border dark:border-gray-800 text-center space-y-1">
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Consistency</p>
                                <p className="text-sm font-bold dark:text-white">Context Precise</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdvancedStudy;
