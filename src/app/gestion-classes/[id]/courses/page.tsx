'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import {
  Plus,
  Trash2,
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Search,
  X,
  CheckCircle2,
  User
} from 'lucide-react'
import { classService } from '@/lib/api/services/classes'
import type { ClassCourse, Course, StudentClass } from '@/lib/api/services/classes'

export default function ClassCoursesPage() {
  const params = useParams()
  const router = useRouter()
  const { addToast } = useToast()
  const classId = params.id as string

  const [studentClass, setStudentClass] = useState<StudentClass | null>(null)
  const [classCourses, setClassCourses] = useState<ClassCourse[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [addingCourses, setAddingCourses] = useState(false)

  useEffect(() => {
    if (classId) {
      loadData()
    }
  }, [classId])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([
      fetchClass(),
      fetchClassCourses(),
      fetchAvailableCourses()
    ])
    setLoading(false)
  }

  const fetchClass = async () => {
    try {
      const data = await classService.getClass(parseInt(classId))
      setStudentClass(data)
    } catch (error) {
      console.error('Erreur:', error)
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger les informations de la classe',
        variant: 'destructive'
      })
    }
  }

  const fetchClassCourses = async () => {
    try {
      const data = await classService.getClassCourses(parseInt(classId))
      setClassCourses(data)
    } catch (error) {
      console.error('Erreur:', error)
      addToast({
        title: 'Erreur',
        description: 'Impossible de charger les cours',
        variant: 'destructive'
      })
    }
  }

  const fetchAvailableCourses = async () => {
    try {
      const data = await classService.getAvailableCourses()
      setAvailableCourses(data)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) return

    setAddingCourses(true)
    try {
      await classService.assignCoursesBulk(parseInt(classId), {
        courses: selectedCourses,
        is_mandatory: true,
        semester: 'S1'
      })

      // Recharger automatiquement la liste
      await fetchClassCourses()

      addToast({
        title: 'Succès',
        description: `${selectedCourses.length} cours ajouté(s) avec succès`,
        variant: 'default'
      })

      setShowModal(false)
      setSelectedCourses([])
    } catch (error: any) {
      console.error('Erreur:', error)
      addToast({
        title: 'Erreur',
        description: error?.message || 'Impossible d\'ajouter les cours',
        variant: 'destructive'
      })
    } finally {
      setAddingCourses(false)
    }
  }

  const handleRemoveCourse = async (courseId: number, courseName: string) => {
    try {
      await classService.removeCourse(parseInt(classId), courseId)

      // Recharger automatiquement la liste
      await fetchClassCourses()

      addToast({
        title: 'Succès',
        description: `Le cours "${courseName}" a été retiré`,
        variant: 'default'
      })
    } catch (error: any) {
      console.error('Erreur:', error)
      addToast({
        title: 'Erreur',
        description: error?.message || 'Impossible de retirer le cours',
        variant: 'destructive'
      })
    }
  }

  const toggleCourseSelection = (courseId: number) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId))
    } else {
      setSelectedCourses([...selectedCourses, courseId])
    }
  }

  const selectAll = () => {
    setSelectedCourses(filteredUnassignedCourses.map(c => c.id))
  }

  const deselectAll = () => {
    setSelectedCourses([])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const assignedCourseIds = classCourses.map(cc => cc.course)
  const unassignedCourses = availableCourses.filter(
    c => !assignedCourseIds.includes(c.id)
  )

  const filteredUnassignedCourses = unassignedCourses.filter(course =>
    course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacher_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/gestion-classes')}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux classes
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <BookOpen className="h-10 w-10 text-primary" />
              Cours de la classe {studentClass?.code}
            </h1>
            <p className="text-muted-foreground mt-2 text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              {studentClass?.name}
              <span className="mx-2">•</span>
              <Users className="h-5 w-5" />
              {studentClass?.student_count} étudiants
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg shadow-primary/20"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter des cours
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-primary/20 shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cours</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{classCourses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Cours assignés</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-purple-500/20 shadow-lg shadow-purple-500/5 hover:shadow-purple-500/10 transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cours Disponibles</CardTitle>
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{unassignedCourses.length}</div>
              <p className="text-xs text-muted-foreground mt-1">À assigner</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-blue-500/20 shadow-lg shadow-blue-500/5 hover:shadow-blue-500/10 transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Effectif Moyen</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {classCourses.length > 0
                  ? Math.round(classCourses.reduce((sum, c) => sum + c.effective_student_count, 0) / classCourses.length)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Étudiants/cours</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Liste des cours */}
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Cours assignés
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-primary/5 to-purple-500/5 border-b border-primary/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Nom du cours</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Semestre</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Enseignant</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Effectif</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {classCourses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-foreground mb-1">Aucun cours assigné</p>
                      <p className="text-sm text-muted-foreground">Cliquez sur "Ajouter des cours" pour commencer</p>
                    </td>
                  </tr>
                ) : (
                  classCourses.map((cc, index) => (
                    <motion.tr
                      key={cc.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-foreground">{cc.course_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-foreground">{cc.course_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200">
                          {cc.course_type}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200">
                          {cc.semester}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {cc.teacher_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{cc.effective_student_count}</span>
                          <span className="text-muted-foreground text-sm">étudiants</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCourse(cc.course, cc.course_name)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Retirer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal d'ajout de cours */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-primary/10"
            >
              <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-purple-500/5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                    <Plus className="h-6 w-6 text-primary" />
                    Ajouter des cours
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedCourses([])
                      setSearchQuery('')
                    }}
                    className="hover:bg-primary/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Barre de recherche */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par code, nom ou enseignant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 h-12 border-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Actions rapides */}
                {filteredUnassignedCourses.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      className="border-primary/20 hover:bg-primary/5"
                    >
                      Tout sélectionner
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                      className="border-primary/20 hover:bg-primary/5"
                    >
                      Tout désélectionner
                    </Button>
                    {selectedCourses.length > 0 && (
                      <Badge className="ml-auto bg-primary/10 text-primary border border-primary/20">
                        {selectedCourses.length} sélectionné(s)
                      </Badge>
                    )}
                  </div>
                )}

                {/* Liste des cours disponibles */}
                <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto">
                  {filteredUnassignedCourses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-foreground mb-1">
                        {searchQuery ? 'Aucun cours trouvé' : 'Tous les cours sont déjà assignés'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {searchQuery ? 'Essayez une autre recherche' : 'Cette classe a tous les cours disponibles'}
                      </p>
                    </div>
                  ) : (
                    filteredUnassignedCourses.map((course, index) => (
                      <motion.label
                        key={course.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedCourses.includes(course.id)
                            ? 'bg-primary/5 border-primary/50 shadow-md'
                            : 'hover:bg-primary/5 border-border hover:border-primary/30'
                        }`}
                      >
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">
                            {course.code} - {course.name}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {course.course_type}
                            </Badge>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {course.teacher_name}
                            </div>
                          </div>
                        </div>
                      </motion.label>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowModal(false)
                      setSelectedCourses([])
                      setSearchQuery('')
                    }}
                    className="flex-1 border-primary/20 hover:bg-primary/5"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAddCourses}
                    disabled={selectedCourses.length === 0 || addingCourses}
                    className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 shadow-lg disabled:opacity-50"
                  >
                    {addingCourses ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Ajout en cours...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter ({selectedCourses.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
