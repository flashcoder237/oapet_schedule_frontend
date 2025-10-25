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
import { Building2 } from 'lucide-react';
import { CreateBuildingData, Building } from '@/services/roomService';

interface AddBuildingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateBuildingData) => Promise<void>;
  initialData?: Building | null;
  isEditing?: boolean;
}

export function AddBuildingModal({ open, onOpenChange, onSubmit, initialData, isEditing = false }: AddBuildingModalProps) {
  const [formData, setFormData] = useState<CreateBuildingData>({
    name: '',
    code: '',
    address: '',
    total_floors: 1,
    description: '',
    has_elevator: false,
    has_parking: true,
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Remplir le formulaire avec les données initiales en mode édition
  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        address: initialData.address || '',
        total_floors: initialData.total_floors || 1,
        description: initialData.description || '',
        has_elevator: (initialData as any).has_elevator || false,
        has_parking: (initialData as any).has_parking !== undefined ? (initialData as any).has_parking : true,
        is_active: initialData.is_active,
      });
    } else if (!open) {
      // Réinitialiser le formulaire quand on ferme le modal
      setFormData({
        name: '',
        code: '',
        address: '',
        total_floors: 1,
        description: '',
        has_elevator: false,
        has_parking: true,
        is_active: true,
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
        code: '',
        address: '',
        total_floors: 1,
        description: '',
        has_elevator: false,
        has_parking: true,
        is_active: true,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de la création du bâtiment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {isEditing ? 'Modifier le Bâtiment' : 'Nouveau Bâtiment'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations du bâtiment' : 'Ajoutez un nouveau bâtiment au système'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom *</Label>
                <Input
                  id="name"
                  placeholder="Bâtiment A"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  placeholder="BAT-A"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                placeholder="123 Rue de l'Université"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_floors">Nombre d'étages</Label>
              <Input
                id="total_floors"
                type="number"
                min="1"
                value={formData.total_floors}
                onChange={(e) => setFormData({ ...formData, total_floors: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du bâtiment..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_elevator"
                  checked={formData.has_elevator}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_elevator: checked as boolean })}
                />
                <Label htmlFor="has_elevator" className="cursor-pointer">
                  Ascenseur
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_parking"
                  checked={formData.has_parking}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_parking: checked as boolean })}
                />
                <Label htmlFor="has_parking" className="cursor-pointer">
                  Parking
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked as boolean })}
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Actif
                </Label>
              </div>
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
