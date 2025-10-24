'use client';

import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, FileJson, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';

interface ImportExportButtonsProps {
  data: any[];
  templateFields: { key: string; label: string; example?: string }[];
  filename: string;
  onImport?: (importedData: any[]) => Promise<void>;
  className?: string;
}

export function ImportExportButtons({
  data,
  templateFields,
  filename,
  onImport,
  className = ''
}: ImportExportButtonsProps) {
  const [isImporting, setIsImporting] = useState(false);
  const { addToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Export en CSV
  const exportToCSV = () => {
    try {
      const headers = templateFields.map(field => field.label).join(',');
      const rows = data.map(item => {
        return templateFields.map(field => {
          const value = item[field.key];
          // Échapper les virgules et guillemets
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      }).join('\n');

      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `${filename}.csv`);

      addToast({
        title: "Export réussi",
        description: `Données exportées en CSV (${data.length} lignes)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      addToast({
        title: "Erreur d'export",
        description: "Impossible d'exporter en CSV",
        variant: "destructive"
      });
    }
  };

  // Export en JSON
  const exportToJSON = () => {
    try {
      const jsonData = data.map(item => {
        const exportItem: any = {};
        templateFields.forEach(field => {
          exportItem[field.key] = item[field.key];
        });
        return exportItem;
      });

      const json = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      downloadFile(blob, `${filename}.json`);

      addToast({
        title: "Export réussi",
        description: `Données exportées en JSON (${data.length} éléments)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export JSON:', error);
      addToast({
        title: "Erreur d'export",
        description: "Impossible d'exporter en JSON",
        variant: "destructive"
      });
    }
  };

  // Export en Excel
  const exportToExcel = () => {
    try {
      // Préparer les données pour Excel
      const excelData = data.map(item => {
        const exportItem: any = {};
        templateFields.forEach(field => {
          exportItem[field.label] = item[field.key];
        });
        return exportItem;
      });

      // Créer un classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

      // Ajuster automatiquement la largeur des colonnes
      const maxWidths = templateFields.map(field => {
        const maxLength = Math.max(
          field.label.length,
          ...data.map(item => String(item[field.key] || '').length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = maxWidths;

      // Générer le fichier Excel
      XLSX.writeFile(workbook, `${filename}.xlsx`);

      addToast({
        title: "Export réussi",
        description: `Données exportées en Excel (${data.length} lignes)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      addToast({
        title: "Erreur d'export",
        description: "Impossible d'exporter en Excel",
        variant: "destructive"
      });
    }
  };

  // Télécharger le modèle CSV
  const downloadTemplate = () => {
    try {
      const headers = templateFields.map(field => field.label).join(',');
      const exampleRow = templateFields.map(field => field.example || '').join(',');
      const csv = `${headers}\n${exampleRow}`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      downloadFile(blob, `${filename}_modele.csv`);

      addToast({
        title: "Modèle téléchargé",
        description: "Remplissez le modèle CSV et importez-le",
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du modèle:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de télécharger le modèle",
        variant: "destructive"
      });
    }
  };

  // Télécharger le modèle Excel
  const downloadExcelTemplate = () => {
    try {
      const exampleData: any = [{}];
      templateFields.forEach(field => {
        exampleData[0][field.label] = field.example || '';
      });

      const worksheet = XLSX.utils.json_to_sheet(exampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Modèle');

      // Ajuster la largeur des colonnes
      const maxWidths = templateFields.map(field => ({
        wch: Math.max(field.label.length, String(field.example || '').length) + 2
      }));
      worksheet['!cols'] = maxWidths;

      XLSX.writeFile(workbook, `${filename}_modele.xlsx`);

      addToast({
        title: "Modèle téléchargé",
        description: "Remplissez le modèle Excel et importez-le",
        variant: "default"
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement du modèle Excel:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de télécharger le modèle Excel",
        variant: "destructive"
      });
    }
  };

  // Fonction helper pour télécharger un fichier
  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import depuis CSV
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);

      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      let importedData: any[] = [];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Import Excel
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données');
        }

        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as any[][];

        importedData = dataRows
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map(row => {
            const item: any = {};
            headers.forEach((header, index) => {
              const field = templateFields.find(f => f.label === header);
              if (field) {
                item[field.key] = row[index] !== null && row[index] !== undefined ? String(row[index]).trim() : '';
              }
            });
            return item;
          });

      } else if (fileExtension === 'csv') {
        // Import CSV
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());

        if (lines.length < 2) {
          throw new Error('Le fichier doit contenir au moins un en-tête et une ligne de données');
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const dataLines = lines.slice(1);

        importedData = dataLines.map(line => {
          const values = parseCSVLine(line);
          const item: any = {};

          headers.forEach((header, index) => {
            const field = templateFields.find(f => f.label === header);
            if (field) {
              item[field.key] = values[index]?.trim() || '';
            }
          });

          return item;
        });
      } else {
        throw new Error('Format de fichier non supporté. Utilisez .xlsx, .xls ou .csv');
      }

      if (onImport && importedData.length > 0) {
        await onImport(importedData);
        addToast({
          title: "Import réussi",
          description: `${importedData.length} éléments importés`,
          variant: "default"
        });
      } else if (importedData.length === 0) {
        throw new Error('Aucune donnée trouvée dans le fichier');
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'import:', error);
      addToast({
        title: "Erreur d'import",
        description: error.message || "Impossible d'importer le fichier",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Parser une ligne CSV (gère les virgules dans les guillemets)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* Bouton Export */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Format d'export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={exportToExcel} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-green-600" />
            Exporter en Excel (.xlsx)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            Exporter en CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportToJSON} className="gap-2">
            <FileJson className="h-4 w-4 text-purple-600" />
            Exporter en JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Bouton Import */}
      {onImport && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" disabled={isImporting}>
              <Upload className="h-4 w-4" />
              {isImporting ? 'Importation...' : 'Importer'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Import de données</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={downloadExcelTemplate} className="gap-2">
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              Télécharger le modèle Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={downloadTemplate} className="gap-2">
              <File className="h-4 w-4 text-blue-600" />
              Télécharger le modèle CSV
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleImportClick} className="gap-2">
              <Upload className="h-4 w-4 text-orange-600" />
              Importer un fichier (.xlsx, .csv)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
