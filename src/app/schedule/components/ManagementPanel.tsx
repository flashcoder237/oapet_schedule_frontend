'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  X, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  BookOpen,
  User,
  MapPin,
  Building
} from 'lucide-react';
import { Course, Teacher, Room } from '@/types/api';
import { courseService } from '@/lib/api/services/courses';
import { roomService } from '@/lib/api/services/rooms';

interface ManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
  addToast: (toast: any) => void;
}

interface CourseFormData {
  id?: number;
  code: string;
  name: string;
  description: string;
  credits: number;
  level: 'L1' | 'L2' | 'L3' | 'M1' | 'M2' | 'D1' | 'D2' | 'D3';
  course_type: 'CM' | 'TD' | 'TP' | 'CONF' | 'EXAM';
  department: number | string;
}

interface TeacherFormData {
  id?: number;
  user: number | string;
  employee_id: string;
  department: number | string;
  phone?: string;
  office?: string;
  max_hours_per_week: number;
}

interface RoomFormData {
  id?: number;
  code: string;
  name: string;
  capacity: number;
  building: string;
  equipment: string;
  type: string;
}

export function ManagementPanel({ isOpen, onClose, onDataUpdate, addToast }: ManagementPanelProps) {
  const [activeTab, setActiveTab] = useState('courses');
  const [loading, setLoading] = useState(false);
  
  // États pour les données
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // États pour les formulaires
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  
  const [courseForm, setCourseForm] = useState<CourseFormData>({
    code: '', name: '', description: '', credits: 3, level: 'L1', course_type: 'CM', department: ''
  });
  
  const [teacherForm, setTeacherForm] = useState<TeacherFormData>({
    user: '',
    employee_id: '',
    department: '',
    phone: '',
    office: '',
    max_hours_per_week: 18
  });
  
  const [roomForm, setRoomForm] = useState<RoomFormData>({
    code: '', name: '', capacity: 30, building: '', equipment: '', type: 'Amphithéâtre'
  });

  // Chargement des données
  const loadData = async () => {
    setLoading(true);
    try {
      const [coursesRes, teachersRes, roomsRes] = await Promise.all([
        courseService.getCourses(),
        courseService.getTeachers(),
        roomService.getRooms({ page_size: 1000 })
      ]);
      
      setCourses(coursesRes.results || []);
      setTeachers(teachersRes.results || []);
      setRooms(roomsRes.results || []);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Gestion des cours
  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const courseData = {
        ...courseForm,
        department: typeof courseForm.department === 'string' ? parseInt(courseForm.department) : courseForm.department
      };
      
      if (editingCourse) {
        await courseService.updateCourse(editingCourse.id, courseData);
        addToast({
          title: "Succès",
          description: "Cours modifié avec succès",
          variant: "default"
        });
      } else {
        await courseService.createCourse(courseData);
        addToast({
          title: "Succès",
          description: "Cours créé avec succès",
          variant: "default"
        });
      }
      
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseForm({ code: '', name: '', description: '', credits: 3, level: 'L1', course_type: 'CM', department: '' });
      await loadData();
      onDataUpdate();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de sauvegarder le cours",
        variant: "destructive"
      });
    }
  };

  const handleCourseEdit = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      id: course.id,
      code: course.code,
      name: course.name,
      description: course.description || '',
      credits: course.credits || 3,
      level: course.level || 'L1',
      course_type: course.course_type || 'CM',
      department: course.department || ''
    });
    setShowCourseForm(true);
  };

  const handleCourseDelete = async (courseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) return;
    
    try {
      await courseService.deleteCourse(courseId);
      addToast({
        title: "Succès",
        description: "Cours supprimé avec succès",
        variant: "default"
      });
      await loadData();
      onDataUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      addToast({
        title: "Erreur",
        description: "Impossible de supprimer le cours",
        variant: "destructive"
      });
    }
  };

  // Gestion des enseignants (simplifié pour l'instant)
  const handleTeacherEdit = (teacher: Teacher) => {
    addToast({
      title: "Info",
      description: "Édition des enseignants en cours de développement",
      variant: "default"
    });
  };

  const handleTeacherDelete = async (teacherId: number) => {
    addToast({
      title: "Info", 
      description: "Suppression des enseignants en cours de développement",
      variant: "default"
    });
  };

  // Gestion des salles (simplifié pour l'instant)
  const handleRoomEdit = (room: Room) => {
    addToast({
      title: "Info",
      description: "Édition des salles en cours de développement",
      variant: "default"
    });
  };

  const handleRoomDelete = async (roomId: number) => {
    addToast({
      title: "Info",
      description: "Suppression des salles en cours de développement", 
      variant: "default"
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Gestion des Ressources
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

          <CardContent className="p-6 overflow-y-auto max-h-[80vh]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="courses" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Cours
                </TabsTrigger>
                <TabsTrigger value="teachers" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Enseignants
                </TabsTrigger>
                <TabsTrigger value="rooms" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Salles
                </TabsTrigger>
              </TabsList>

              {/* Onglet Cours */}
              <TabsContent value="courses" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gestion des Cours</h3>
                  <Button
                    onClick={() => {
                      setEditingCourse(null);
                      setCourseForm({ code: '', name: '', description: '', credits: 3, level: 'L1', course_type: 'CM', department: '' });
                      setShowCourseForm(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Nouveau Cours
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {courses.map((course) => (
                      <Card key={course.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{course.code}</h4>
                              <Badge variant="secondary">{course.level}</Badge>
                              <Badge variant="outline">{course.credits} ECTS</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{course.name}</p>
                            {course.description && (
                              <p className="text-xs text-gray-500 mt-1">{course.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCourseEdit(course)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCourseDelete(course.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Formulaire de cours */}
                <AnimatePresence>
                  {showCourseForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Card className="p-4 border-blue-200">
                        <form onSubmit={handleCourseSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Code du cours</Label>
                              <Input
                                value={courseForm.code}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, code: e.target.value }))}
                                placeholder="Ex: MATH101"
                                required
                              />
                            </div>
                            <div>
                              <Label>Crédits ECTS</Label>
                              <Input
                                type="number"
                                value={courseForm.credits}
                                onChange={(e) => setCourseForm(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                                min="1"
                                max="30"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <Label>Nom du cours</Label>
                            <Input
                              value={courseForm.name}
                              onChange={(e) => setCourseForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Ex: Mathématiques I"
                              required
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Input
                              value={courseForm.description}
                              onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Description du cours..."
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCourseForm(false)}
                            >
                              Annuler
                            </Button>
                            <Button type="submit">
                              <Save className="h-4 w-4 mr-2" />
                              {editingCourse ? 'Modifier' : 'Créer'}
                            </Button>
                          </div>
                        </form>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>
              </TabsContent>

              {/* Onglet Enseignants */}
              <TabsContent value="teachers" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gestion des Enseignants</h3>
                  <Button
                    disabled
                    className="flex items-center gap-2"
                    title="Fonctionnalité en cours de développement"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvel Enseignant
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {teachers.map((teacher) => (
                      <Card key={teacher.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">
                                {teacher.user_details?.first_name} {teacher.user_details?.last_name}
                              </h4>
                              <Badge variant="secondary">Enseignant</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{teacher.user_details?.email}</p>
                            {teacher.department_name && (
                              <p className="text-xs text-gray-500 mt-1">{teacher.department_name}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Fonctionnalité en cours de développement"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Fonctionnalité en cours de développement"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Onglet Salles */}
              <TabsContent value="rooms" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Gestion des Salles</h3>
                  <Button
                    disabled
                    className="flex items-center gap-2"
                    title="Fonctionnalité en cours de développement"
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle Salle
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {rooms.map((room) => (
                      <Card key={room.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{room.code}</h4>
                              <Badge variant="secondary">{room.room_type_name || 'Salle'}</Badge>
                              <Badge variant="outline">{room.capacity} places</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{room.name}</p>
                            {room.building_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                <Building className="h-3 w-3 inline mr-1" />
                                {room.building_name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Fonctionnalité en cours de développement"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title="Fonctionnalité en cours de développement"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}