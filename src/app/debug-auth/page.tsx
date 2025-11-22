'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { apiClient } from '@/lib/api/client';

export default function DebugAuthPage() {
  const auth = useAuth();
  const [tokenFromStorage, setTokenFromStorage] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Lire le token directement du localStorage
    const token = localStorage.getItem('auth_token');
    setTokenFromStorage(token);
  }, []);

  const testApiCall = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/courses/classes/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${tokenFromStorage}`
        }
      });

      const data = await response.json();
      setTestResult({
        status: response.status,
        statusText: response.statusText,
        data: data
      });
    } catch (error) {
      setTestResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Debug - État de l'authentification</h1>

      <div className="space-y-6">
        {/* État du contexte Auth */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Contexte d'authentification</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>isAuthenticated:</strong> {String(auth.isAuthenticated)}</p>
            <p><strong>isLoading:</strong> {String(auth.isLoading)}</p>
            <p><strong>error:</strong> {auth.error || 'null'}</p>
            <p><strong>user:</strong> {auth.user ? JSON.stringify(auth.user, null, 2) : 'null'}</p>
            <p><strong>token (from context):</strong> {auth.token ? auth.token.substring(0, 20) + '...' : 'null'}</p>
          </div>
        </div>

        {/* Token du localStorage */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage</h2>
          <div className="space-y-2 font-mono text-sm">
            <p><strong>auth_token:</strong></p>
            <pre className="bg-muted p-3 rounded overflow-auto max-h-40">
              {tokenFromStorage || 'Aucun token trouvé'}
            </pre>
          </div>
        </div>

        {/* Test API */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test API</h2>
          <button
            onClick={testApiCall}
            disabled={!tokenFromStorage}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
          >
            Tester l'appel API /courses/classes/
          </button>

          {testResult && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Résultat:</h3>
              <pre className="bg-muted p-3 rounded overflow-auto max-h-60 text-xs">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900">Instructions</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>Si "auth_token" est null, vous n'êtes pas connecté → Allez à la page d'accueil (/)</li>
            <li>Si le token existe mais le test API échoue, le token est peut-être invalide ou expiré</li>
            <li>Si le test API réussit (status 200), le problème est ailleurs dans le code</li>
            <li>Le format attendu par le backend Django est: <code className="bg-yellow-100 px-1">Authorization: Token YOUR_TOKEN_HERE</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
