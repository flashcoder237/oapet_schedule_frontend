import React from 'react';
import { X, AlertTriangle, Lightbulb, Info } from 'lucide-react';

interface Blockage {
  course: string;
  course_id: number;
  reasons: string[];
  suggestions: string[];
}

interface GenerationBlockagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockages: Blockage[];
  generalSuggestions?: string[];
  stats?: {
    total_courses: number;
    courses_scheduled: number;
    courses_blocked: number;
    total_occurrences: number;
  };
}

export default function GenerationBlockagesModal({
  isOpen,
  onClose,
  blockages,
  generalSuggestions = [],
  stats,
}: GenerationBlockagesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
              Rapport de Génération
            </h2>
            {stats && (
              <p className="text-sm text-gray-600 mt-1">
                {stats.courses_scheduled} cours programmés sur {stats.total_courses} • {stats.courses_blocked} cours bloqués
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Statistiques */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Total Cours"
                value={stats.total_courses}
                color="bg-blue-50 text-blue-700 border-blue-200"
              />
              <StatCard
                label="Programmés"
                value={stats.courses_scheduled}
                color="bg-green-50 text-green-700 border-green-200"
              />
              <StatCard
                label="Bloqués"
                value={stats.courses_blocked}
                color="bg-red-50 text-red-700 border-red-200"
              />
              <StatCard
                label="Occurrences"
                value={stats.total_occurrences}
                color="bg-purple-50 text-purple-700 border-purple-200"
              />
            </div>
          )}

          {/* Suggestions Générales */}
          {generalSuggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Suggestions Générales
              </h3>
              <ul className="space-y-2">
                {generalSuggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-blue-800 flex gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cours Bloqués */}
          {blockages.length > 0 ? (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Cours Bloqués ({blockages.length})
              </h3>
              <div className="space-y-4">
                {blockages.map((blockage, index) => (
                  <BlockageCard key={index} blockage={blockage} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Génération Réussie !
              </h3>
              <p className="text-gray-600">
                Tous les cours ont été programmés avec succès.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className={`border rounded-lg p-4 ${color}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium mt-1">{label}</div>
    </div>
  );
}

interface BlockageCardProps {
  blockage: Blockage;
}

function BlockageCard({ blockage }: BlockageCardProps) {
  return (
    <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="text-orange-600">⚠️</span>
        {blockage.course}
      </h4>

      {/* Raisons */}
      {blockage.reasons.length > 0 && (
        <div className="mb-3">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Raisons du blocage :</h5>
          <ul className="space-y-1">
            {blockage.reasons.map((reason, index) => (
              <li key={index} className="text-sm text-gray-700 flex gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggestions */}
      {blockage.suggestions.length > 0 && (
        <div className="bg-white border border-orange-200 rounded p-3">
          <h5 className="text-sm font-medium text-orange-900 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Solutions Possibles :
          </h5>
          <ul className="space-y-1">
            {blockage.suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-orange-800 flex gap-2">
                <span className="text-orange-600">💡</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
