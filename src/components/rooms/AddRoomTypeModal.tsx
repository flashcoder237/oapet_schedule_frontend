import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tag } from 'lucide-react';
import { CreateRoomTypeData, RoomType } from '@/services/roomService';

interface AddRoomTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateRoomTypeData) => Promise<void>;
  initialData?: RoomType | null;
  isEditing?: boolean;
}

export function AddRoomTypeModal({ open, onOpenChange, onSubmit, initialData, isEditing = false }: AddRoomTypeModalProps) {
  const [formData, setFormData] = useState<CreateRoomTypeData>({
    name: '',
    description: '',
    default_capacity: 30,
    requires_special_equipment: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remplir le formulaire avec les données initiales en mode édition
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        default_capacity: initialData.default_capacity || 30,
        requires_special_equipment: initialData.requires_special_equipment || false,
      });
    } else if (!open) {
      // Réinitialiser le formulaire quand on ferme le modal
      setFormData({
        name: '',
        description: '',
        default_capacity: 30,
        requires_special_equipment: false,
      });
    }
  }, [isEditing, initialData, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form
      setFormData({
        name: '',
        description: '',
        default_capacity: 30,
        requires_special_equipment: false,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création du type de salle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {isEditing ? 'Modifier le Type de Salle' : 'Nouveau Type de Salle'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations du type de salle' : 'Ajoutez un nouveau type de salle au système'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                placeholder="Salle de cours, Amphithéâtre, Laboratoire..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du type de salle..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_capacity">Capacité par défaut</Label>
              <Input
                id="default_capacity"
                type="number"
                min="1"
                value={formData.default_capacity}
                onChange={(e) => setFormData({ ...formData, default_capacity: parseInt(e.target.value) || 30 })}
              />
              <p className="text-xs text-muted-foreground">
                Capacité suggérée pour ce type de salle
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_special_equipment"
                checked={formData.requires_special_equipment}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_special_equipment: checked as boolean })}
              />
              <Label htmlFor="requires_special_equipment" className="cursor-pointer">
                Nécessite un équipement spécial
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? 'Modification...' : 'Création...') : (isEditing ? 'Modifier' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
