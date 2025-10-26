'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Printer, Download, Calendar, FileText, AlertCircle } from 'lucide-react';
import { Schedule, AcademicPeriod } from '@/types/api';
import { scheduleService } from '@/lib/api/services/schedules';
import { occurrenceService } from '@/lib/api/services/occurrences';

interface PrintScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: Schedule[];
  academicPeriods: AcademicPeriod[];
}

export function PrintScheduleModal({
  isOpen,
  onClose,
  schedules,
  academicPeriods,
}: PrintScheduleModalProps) {
  const [selectedSchedule, setSelectedSchedule] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Vérifier que le schedule sélectionné existe toujours
      if (selectedSchedule) {
        const scheduleStillExists = schedules.find(s => s.id.toString() === selectedSchedule);
        if (!scheduleStillExists) {
          // Le schedule n'existe plus, réinitialiser la sélection
          console.warn(`Schedule ${selectedSchedule} n'existe plus, réinitialisation`);
          setSelectedSchedule('');
          setDateFrom('');
          setDateTo('');
          return;
        }

        // Pré-remplir les dates selon la période académique de l'emploi du temps
        if (scheduleStillExists?.academic_period_details) {
          const period = scheduleStillExists.academic_period_details;
          if (period.start_date) {
            setDateFrom(period.start_date);
          }
          if (period.end_date) {
            setDateTo(period.end_date);
          }
        }
      }
    }
  }, [selectedSchedule, schedules, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Réinitialiser uniquement quand on ferme
      setSelectedSchedule('');
      setDateFrom('');
      setDateTo('');
    }
  }, [isOpen]);

  const handlePrint = async () => {
    if (!selectedSchedule) {
      alert('Veuillez sélectionner un emploi du temps');
      return;
    }

    setLoading(true);

    try {
      const scheduleId = parseInt(selectedSchedule);

      // Vérifier que le schedule existe dans la liste locale
      const scheduleExists = schedules.find(s => s.id === scheduleId);
      if (!scheduleExists) {
        alert('Cet emploi du temps n\'existe plus. Veuillez rafraîchir la page.');
        setLoading(false);
        return;
      }

      // Récupérer les données de l'emploi du temps
      const schedule = await scheduleService.getSchedule(scheduleId);

      // Récupérer TOUTES les occurrences en parcourant toutes les semaines de la période
      console.log('=== RÉCUPÉRATION DES OCCURRENCES ===');
      console.log('Date début:', dateFrom);
      console.log('Date fin:', dateTo);

      let allOccurrences: any[] = [];

      if (dateFrom && dateTo) {
        // Parcourir toutes les semaines de la période
        const startDate = new Date(dateFrom);
        const endDate = new Date(dateTo);
        let currentDate = new Date(startDate);
        let weekCount = 0;

        while (currentDate <= endDate) {
          weekCount++;
          const weekStart = occurrenceService.getWeekStart(currentDate);

          console.log(`Récupération semaine ${weekCount}: ${weekStart}...`);

          try {
            const weekData = await occurrenceService.getWeeklyOccurrences({
              week_start: weekStart,
              schedule: scheduleId
            });

            // Extraire toutes les occurrences de la semaine
            const weekOccurrences = weekData?.occurrences_by_day
              ? Object.values(weekData.occurrences_by_day).flat()
              : [];

            console.log(`  → ${weekOccurrences.length} occurrences trouvées`);

            allOccurrences = allOccurrences.concat(weekOccurrences);
          } catch (error) {
            console.error(`Erreur semaine ${weekStart}:`, error);
          }

          // Passer à la semaine suivante
          currentDate.setDate(currentDate.getDate() + 7);

          // Sécurité: limiter à 52 semaines (1 an)
          if (weekCount > 52) {
            console.warn('Limite de 52 semaines atteinte');
            break;
          }
        }

        console.log(`✅ Total occurrences récupérées : ${allOccurrences.length} (${weekCount} semaines)`);
      } else {
        console.warn('Dates non spécifiées, utilisation de la méthode de pagination');
        // Fallback: utiliser la pagination si les dates ne sont pas spécifiées
        const occurrencesResponse = await occurrenceService.getOccurrences({
          schedule: scheduleId
        });
        allOccurrences = occurrencesResponse.results || [];
      }

      // Générer le contenu à imprimer
      generatePrintContent(schedule, allOccurrences);
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);

      // Afficher un message d'erreur plus précis
      let errorMessage = 'Impossible de générer l\'emploi du temps.';

      if (error?.message?.includes('No Schedule matches')) {
        errorMessage = 'Cet emploi du temps n\'existe plus dans la base de données. Veuillez rafraîchir la page et en sélectionner un autre.';
      } else if (error?.message?.includes('Network')) {
        errorMessage = 'Erreur de connexion au serveur. Vérifiez votre connexion internet.';
      } else if (allOccurrences.length === 0) {
        errorMessage = 'Cet emploi du temps ne contient aucune session. Veuillez d\'abord générer des sessions.';
      } else {
        errorMessage += ' ' + (error?.message || 'Erreur inconnue');
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generatePrintContent = (schedule: Schedule, occurrences: any[]) => {
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Veuillez autoriser les popups pour imprimer');
      return;
    }

    console.log('=== GÉNÉRATION IMPRESSION ===');
    console.log('Total occurrences reçues:', occurrences.length);
    console.log('Échantillon d\'occurrences:', occurrences.slice(0, 3));

    // Organiser les occurrences par semaine puis par jour
    const occurrencesByWeek: { [weekKey: string]: { [day: string]: any[] } } = {};

    occurrences.forEach((occ, index) => {
      const date = new Date(occ.actual_date);

      // Calculer le début de la semaine (lundi)
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const weekKey = startOfWeek.toISOString().split('T')[0];

      if (!occurrencesByWeek[weekKey]) {
        occurrencesByWeek[weekKey] = {
          lundi: [],
          mardi: [],
          mercredi: [],
          jeudi: [],
          vendredi: [],
          samedi: [],
        };
        console.log(`Nouvelle semaine créée: ${weekKey}`);
      }

      const dayNames = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const dayName = dayNames[date.getDay()];
      if (occurrencesByWeek[weekKey][dayName]) {
        occurrencesByWeek[weekKey][dayName].push(occ);
      }
    });

    console.log('Nombre de semaines détectées:', Object.keys(occurrencesByWeek).length);
    console.log('Clés des semaines:', Object.keys(occurrencesByWeek).sort());

    // Trier par heure de début
    Object.keys(occurrencesByWeek).forEach((week) => {
      Object.keys(occurrencesByWeek[week]).forEach((day) => {
        occurrencesByWeek[week][day].sort((a, b) => {
          return a.start_time.localeCompare(b.start_time);
        });
      });
    });

    const dayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayKeys = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

    // Calculer les heures min et max pour couvrir toute la journée
    const startHour = 7;
    const endHour = 20;
    const totalMinutes = (endHour - startHour) * 60;

    // Fonction pour calculer la position et la hauteur
    // Échelle: 650px pour 13 heures (780 minutes) = ~0.833px par minute
    const pixelsPerMinute = 650 / totalMinutes;

    const getSessionPosition = (session: any) => {
      const [startH, startM] = session.start_time.split(':').map(Number);
      const [endH, endM] = session.end_time.split(':').map(Number);

      const sessionStartMinutes = startH * 60 + startM;
      const sessionEndMinutes = endH * 60 + endM;
      const gridStartMinutes = startHour * 60;

      const top = (sessionStartMinutes - gridStartMinutes) * pixelsPerMinute;
      const height = (sessionEndMinutes - sessionStartMinutes) * pixelsPerMinute;

      return { top, height };
    };

    // Générer le HTML pour chaque semaine
    const weeksHtml = Object.keys(occurrencesByWeek)
      .sort()
      .map((weekKey) => {
        const weekDate = new Date(weekKey);
        const weekEnd = new Date(weekDate);
        weekEnd.setDate(weekEnd.getDate() + 5); // 5 jours ouvrables

        const weekOccurrences = occurrencesByWeek[weekKey];

        // Générer les colonnes de jours
        const dayColumns = dayKeys.map((dayKey, dayIndex) => {
          const daySessions = weekOccurrences[dayKey] || [];

          const sessionsHtml = daySessions.map((session) => {
            const { top, height } = getSessionPosition(session);

            // Extraire les informations avec gestion des différentes structures possibles
            const courseCode = session.course_code || session.course_details?.code || '';
            const courseName = session.course_name || session.course_details?.name || 'Sans titre';
            const sessionType = session.session_type || session.session_template_details?.session_type || 'CM';
            const teacherName = session.teacher_name ||
                               (session.teacher_details?.user_details?.first_name ?
                                 `${session.teacher_details.user_details.first_name} ${session.teacher_details.user_details.last_name}` :
                                 session.teacher_details?.user_details?.last_name) || 'Non assigné';
            const roomCode = session.room_code || session.room_details?.code || 'Non assignée';
            const roomName = session.room_name || session.room_details?.name || '';
            const expectedStudents = session.expected_students || session.session_template_details?.expected_students || 0;

            return `
              <div class="session-card ${sessionType}" style="top: ${top}px; height: ${height}px;">
                <div class="session-type-badge ${sessionType}">${sessionType}</div>
                <div class="session-title">${courseCode}</div>
                <div class="session-name">${courseName}</div>
                <div class="session-info">
                  <div>${session.start_time.slice(0, 5)} - ${session.end_time.slice(0, 5)}</div>
                  <div>Enseignant: ${teacherName}</div>
                  <div>Salle: ${roomCode}${roomName ? ' - ' + roomName : ''}</div>
                  ${expectedStudents ? `<div>${expectedStudents} étudiants</div>` : ''}
                </div>
              </div>
            `;
          }).join('');

          return `
            <div class="day-column">
              <div class="day-header">${dayLabels[dayIndex]}</div>
              <div class="day-content">
                ${Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
                  const isHour = i % 2 === 0;
                  const topPosition = (i * 30 * pixelsPerMinute);
                  return `<div class="time-line ${isHour ? 'hour-line' : 'half-hour-line'}" style="top: ${topPosition}px;"></div>`;
                }).join('')}
                ${sessionsHtml}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="week-section">
            <div class="week-header">
              Semaine du ${weekDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              au ${weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <div class="schedule-grid-container">
              <div class="time-column">
                <div class="time-header">Heure</div>
                <div class="time-labels">
                  ${Array.from({ length: (endHour - startHour) * 2 }, (_, i) => {
                    const isFullHour = i % 2 === 0;
                    const hour = startHour + Math.floor(i / 2);
                    const minute = isFullHour ? 0 : 30;
                    const topPosition = (i * 30 * pixelsPerMinute);
                    return `
                      <div class="time-label ${isFullHour ? 'full-hour' : 'half-hour'}" style="top: ${topPosition}px;">
                        ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              <div class="days-container">
                ${dayColumns}
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // HTML de l'impression
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Emploi du temps - ${schedule.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap');

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            @page {
              size: A4 landscape;
              margin: 10mm;
            }

            body {
              font-family: 'Lato', sans-serif;
              background: white;
              color: #1e293b;
              line-height: 1.4;
              font-size: 11px;
            }

            .header {
              text-align: center;
              margin-bottom: 12px;
              padding-bottom: 10px;
              border-bottom: 2px solid #2563eb;
            }

            .header h1 {
              color: #1e40af;
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 4px;
              letter-spacing: -0.5px;
            }

            .header .subtitle {
              color: #64748b;
              font-size: 11px;
              font-weight: 600;
              margin-bottom: 3px;
            }

            .header .status {
              display: inline-block;
              padding: 3px 10px;
              border-radius: 15px;
              font-size: 10px;
              font-weight: 700;
              margin-top: 6px;
            }

            .header .status.published {
              background: #dcfce7;
              color: #166534;
            }

            .header .status.draft {
              background: #fee2e2;
              color: #991b1b;
            }

            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px;
              margin-bottom: 12px;
              padding: 10px;
              background: #f8fafc;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }

            .info-item {
              text-align: center;
            }

            .info-label {
              display: block;
              font-size: 9px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin-bottom: 4px;
            }

            .info-value {
              display: block;
              font-size: 12px;
              font-weight: 700;
              color: #1e293b;
            }

            .week-section {
              page-break-after: always;
              page-break-inside: avoid;
              margin-bottom: 20px;
            }

            .week-section:last-child {
              page-break-after: auto;
            }

            .week-header {
              background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
              color: white;
              padding: 6px 12px;
              font-size: 11px;
              font-weight: 700;
              border-radius: 4px 4px 0 0;
              margin-bottom: 0;
            }

            .schedule-grid-container {
              display: flex;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 0 0 6px 6px;
              overflow: hidden;
            }

            .time-column {
              width: 50px;
              background: #f8fafc;
              border-right: 2px solid #cbd5e1;
              flex-shrink: 0;
            }

            .time-header {
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #334155;
              color: white;
              font-weight: 700;
              font-size: 9px;
              border-bottom: 1px solid #1e293b;
            }

            .time-labels {
              position: relative;
              height: 650px;
            }

            .time-label {
              position: absolute;
              left: 0;
              right: 0;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9px;
              border-top: 1px solid #e2e8f0;
            }

            .time-label.full-hour {
              font-weight: 700;
              color: #1e293b;
            }

            .time-label.half-hour {
              font-weight: 400;
              color: #64748b;
              font-size: 8px;
            }

            .days-container {
              display: flex;
              flex: 1;
            }

            .day-column {
              flex: 1;
              border-right: 1px solid #e2e8f0;
            }

            .day-column:last-child {
              border-right: none;
            }

            .day-header {
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #334155;
              color: white;
              font-weight: 700;
              font-size: 9px;
              border-bottom: 1px solid #1e293b;
              border-right: 1px solid #1e293b;
            }

            .day-content {
              position: relative;
              height: 650px;
              background: white;
            }

            .time-line {
              position: absolute;
              left: 0;
              right: 0;
              height: 0;
              border-top: 1px solid #e2e8f0;
            }

            .time-line.hour-line {
              border-top: 1px solid #cbd5e1;
            }

            .time-line.half-hour-line {
              border-top: 1px solid #f1f5f9;
            }

            .session-card {
              position: absolute;
              left: 4%;
              right: 4%;
              padding: 4px;
              border-radius: 3px;
              overflow: hidden;
              border-left: 3px solid;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            }

            .session-card.CM {
              background: #eff6ff;
              border-left-color: #3b82f6;
            }
            .session-card.TD {
              background: #ecfdf5;
              border-left-color: #10b981;
            }
            .session-card.TP {
              background: #fef3c7;
              border-left-color: #f59e0b;
            }
            .session-card.EXAM {
              background: #fef2f2;
              border-left-color: #ef4444;
            }

            .session-type-badge {
              display: inline-block;
              padding: 1px 4px;
              border-radius: 2px;
              font-size: 7px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.2px;
              margin-bottom: 2px;
            }

            .session-type-badge.CM { background: #dbeafe; color: #1e40af; }
            .session-type-badge.TD { background: #d1fae5; color: #065f46; }
            .session-type-badge.TP { background: #fef3c7; color: #92400e; }
            .session-type-badge.EXAM { background: #fee2e2; color: #991b1b; }

            .session-title {
              font-weight: 700;
              font-size: 8px;
              color: #1e293b;
              margin-bottom: 1px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .session-name {
              font-size: 7px;
              color: #475569;
              margin-bottom: 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .session-info {
              font-size: 6px;
              color: #64748b;
              line-height: 1.2;
            }

            .session-info div {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }

            .no-sessions {
              padding: 20px;
              text-align: center;
              color: #94a3b8;
              font-style: italic;
              font-size: 12px;
            }

            .footer {
              margin-top: 25px;
              padding-top: 15px;
              border-top: 2px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 9px;
            }

            .footer p {
              margin: 2px 0;
            }

            @media print {
              .week-section {
                page-break-inside: avoid;
              }

              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${schedule.name}</h1>
            <div class="subtitle">
              ${schedule.curriculum_details?.name || 'Non spécifiée'} - ${schedule.level || ''}
            </div>
            <span class="status ${schedule.is_published ? 'published' : 'draft'}">
              ${schedule.is_published ? 'Publié' : 'Brouillon'}
            </span>
          </div>

          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Filière</span>
              <span class="info-value">${schedule.curriculum_details?.name || 'Non spécifiée'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Période</span>
              <span class="info-value">${schedule.academic_period_details?.name || 'Non spécifiée'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sessions</span>
              <span class="info-value">${occurrences.length}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Impression</span>
              <span class="info-value">${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>

          ${occurrences.length > 0 ? weeksHtml : '<div class="no-sessions" style="padding: 60px; text-align: center; font-size: 16px;">Aucune session programmée pour cette période</div>'}

          <div class="footer">
            <p><strong>Document généré par OAPET Schedule System</strong></p>
            <p>Université de Douala - ${new Date().getFullYear()}</p>
            <p>Période affichée : ${dateFrom ? new Date(dateFrom).toLocaleDateString('fr-FR') : 'Non spécifiée'} - ${dateTo ? new Date(dateTo).toLocaleDateString('fr-FR') : 'Non spécifiée'}</p>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  const selectedScheduleData = schedules.find(s => s.id.toString() === selectedSchedule);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Printer className="h-5 w-5 text-blue-600" />
                Imprimer un emploi du temps
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Sélection de l'emploi du temps */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  Emploi du temps (classe) *
                </Label>
                <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un emploi du temps" />
                  </SelectTrigger>
                  <SelectContent>
                    {schedules.map((schedule) => (
                      <SelectItem key={schedule.id} value={schedule.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{schedule.name}</span>
                          {schedule.curriculum_details?.name && (
                            <span className="text-gray-500 text-sm">
                              - {schedule.curriculum_details.name}
                            </span>
                          )}
                          {!schedule.is_published && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded">
                              Brouillon
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedScheduleData && !selectedScheduleData.is_published && (
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <strong>Attention :</strong> Cet emploi du temps est en mode brouillon.
                      Il n'est pas encore publié.
                    </div>
                  </div>
                )}
              </div>

              {/* Période de temps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Laissez vide pour toute la période
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Laissez vide pour toute la période
                  </p>
                </div>
              </div>

              {selectedScheduleData?.academic_period_details && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <strong>Période de l'emploi du temps :</strong>{' '}
                    {selectedScheduleData.academic_period_details.name}
                    {selectedScheduleData.academic_period_details.start_date && selectedScheduleData.academic_period_details.end_date && (
                      <span className="text-blue-700">
                        {' '}(du {new Date(selectedScheduleData.academic_period_details.start_date).toLocaleDateString('fr-FR')} au {new Date(selectedScheduleData.academic_period_details.end_date).toLocaleDateString('fr-FR')})
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button
                  onClick={handlePrint}
                  disabled={loading || !selectedSchedule}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimer
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
