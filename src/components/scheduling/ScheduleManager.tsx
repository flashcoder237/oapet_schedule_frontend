import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Schedule {
  id: number;
  name: string;
  academic_period: any;
  curriculum: any;
  status: string;
  is_published: boolean;
  sessions_count?: number;
  created_at: string;
}

interface GenerateScheduleParams {
  academic_year: string;
  semester: string;
  start_date: string;
  end_date: string;
  curriculum_ids: string[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const ScheduleManager: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Paramètres de génération
  const [generateParams, setGenerateParams] = useState<GenerateScheduleParams>({
    academic_year: '2024-2025',
    semester: 'S1',
    start_date: '2024-09-25',
    end_date: '2025-02-28',
    curriculum_ids: [],
  });

  const [curriculumInput, setCurriculumInput] = useState('');

  // Charger les emplois du temps
  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/schedules/`);
      setSchedules(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du chargement des emplois du temps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // Générer un emploi du temps
  const handleGenerate = async () => {
    if (!generateParams.start_date || !generateParams.end_date) {
      setError('Les dates de début et de fin sont obligatoires');
      return;
    }

    if (generateParams.curriculum_ids.length === 0) {
      setError('Veuillez sélectionner au moins un curriculum');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(
        `${API_BASE_URL}/schedules/generate_for_period/`,
        generateParams
      );
      setSuccess(response.data.message);
      loadSchedules();

      // Réinitialiser le formulaire
      setCurriculumInput('');
      setGenerateParams(prev => ({ ...prev, curriculum_ids: [] }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la génération');
      console.error('Détails:', err.response?.data?.details);
    } finally {
      setLoading(false);
    }
  };

  // Publier un emploi du temps
  const handlePublish = async (scheduleId: number) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/schedules/${scheduleId}/publish/`);
      setSuccess(response.data.message);
      loadSchedules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  // Dépublier un emploi du temps
  const handleUnpublish = async (scheduleId: number) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/schedules/${scheduleId}/unpublish/`);
      setSuccess(response.data.message);
      loadSchedules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la dépublication');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un emploi du temps
  const handleDelete = async (scheduleId: number, scheduleName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${scheduleName}" ?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/schedules/${scheduleId}/delete_schedule/`);
      setSuccess(response.data.message);
      loadSchedules();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de semestre
  const handleSemesterChange = (semester: string) => {
    const year = parseInt(generateParams.academic_year.split('-')[0]);

    let start_date, end_date;
    if (semester === 'S1') {
      // Semestre 1: Fin septembre à Fin février
      start_date = `${year}-09-25`;
      end_date = `${year + 1}-02-28`;
    } else if (semester === 'S2') {
      // Semestre 2: Début mars à Fin août
      start_date = `${year + 1}-03-01`;
      end_date = `${year + 1}-08-31`;
    } else {
      // Annuel: Fin septembre à Fin août
      start_date = `${year}-09-25`;
      end_date = `${year + 1}-08-31`;
    }

    setGenerateParams(prev => ({
      ...prev,
      semester,
      start_date,
      end_date,
    }));
  };

  // Ajouter un curriculum
  const handleAddCurriculum = () => {
    if (curriculumInput.trim()) {
      setGenerateParams(prev => ({
        ...prev,
        curriculum_ids: [...prev.curriculum_ids, curriculumInput.trim()],
      }));
      setCurriculumInput('');
    }
  };

  // Retirer un curriculum
  const handleRemoveCurriculum = (index: number) => {
    setGenerateParams(prev => ({
      ...prev,
      curriculum_ids: prev.curriculum_ids.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Emplois du Temps</h1>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Formulaire de génération */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Générer un nouvel emploi du temps</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Année académique */}
          <div>
            <label className="block text-sm font-medium mb-2">Année académique</label>
            <input
              type="text"
              value={generateParams.academic_year}
              onChange={(e) => setGenerateParams(prev => ({ ...prev, academic_year: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              placeholder="2024-2025"
            />
          </div>

          {/* Semestre */}
          <div>
            <label className="block text-sm font-medium mb-2">Période</label>
            <select
              value={generateParams.semester}
              onChange={(e) => handleSemesterChange(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="S1">Semestre 1 (Fin Septembre - Février)</option>
              <option value="S2">Semestre 2 (Mars - Août)</option>
              <option value="ANNUEL">Annuel (Septembre - Août)</option>
            </select>
          </div>

          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium mb-2">Date de début *</label>
            <input
              type="date"
              value={generateParams.start_date}
              onChange={(e) => setGenerateParams(prev => ({ ...prev, start_date: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium mb-2">Date de fin *</label>
            <input
              type="date"
              value={generateParams.end_date}
              onChange={(e) => setGenerateParams(prev => ({ ...prev, end_date: e.target.value }))}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>
        </div>

        {/* Curriculums */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Curriculums *</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={curriculumInput}
              onChange={(e) => setCurriculumInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCurriculum()}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="ID ou code (ex: 223 ou BIO-L1)"
            />
            <button
              onClick={handleAddCurriculum}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Ajouter
            </button>
          </div>

          {/* Liste des curriculums sélectionnés */}
          <div className="flex flex-wrap gap-2">
            {generateParams.curriculum_ids.map((id, index) => (
              <span
                key={index}
                className="bg-gray-200 px-3 py-1 rounded-full flex items-center gap-2"
              >
                {id}
                <button
                  onClick={() => handleRemoveCurriculum(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Bouton de génération */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 font-semibold"
        >
          {loading ? 'Génération en cours...' : 'Générer l\'emploi du temps'}
        </button>
      </div>

      {/* Liste des emplois du temps */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Emplois du temps existants</h2>

        {loading && <p className="text-gray-500">Chargement...</p>}

        {!loading && schedules.length === 0 && (
          <p className="text-gray-500">Aucun emploi du temps trouvé</p>
        )}

        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{schedule.name}</h3>
                <p className="text-sm text-gray-600">
                  Statut: {schedule.status} |
                  {schedule.is_published ? ' Publié' : ' Brouillon'} |
                  Sessions: {schedule.sessions_count || 0}
                </p>
                <p className="text-xs text-gray-400">
                  Créé le: {new Date(schedule.created_at).toLocaleDateString()}
                </p>
              </div>

              <div className="flex gap-2">
                {!schedule.is_published ? (
                  <button
                    onClick={() => handlePublish(schedule.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Publier
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnpublish(schedule.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    Dépublier
                  </button>
                )}

                <button
                  onClick={() => handleDelete(schedule.id, schedule.name)}
                  disabled={schedule.is_published}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm disabled:bg-gray-400"
                  title={schedule.is_published ? 'Dépubliez d\'abord' : 'Supprimer'}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
