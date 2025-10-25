import React from 'react';
import { Button } from './button';
import { Trash2, Archive, CheckCircle, XCircle, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { Badge } from './badge';

export interface BulkAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick: () => void;
  confirmMessage?: string;
}

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActions({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  actions,
  className = ''
}: BulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  const handleActionClick = (action: BulkAction) => {
    if (action.confirmMessage) {
      if (window.confirm(action.confirmMessage)) {
        action.onClick();
      }
    } else {
      action.onClick();
    }
  };

  // Séparer les actions principales des actions secondaires
  const primaryActions = actions.slice(0, 2);
  const secondaryActions = actions.slice(2);

  return (
    <div className={`flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${className}`}>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm">
          {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
        </Badge>

        {selectedCount < totalCount && (
          <Button
            variant="link"
            size="sm"
            onClick={onSelectAll}
            className="h-auto p-0 text-blue-600 dark:text-blue-400"
          >
            Tout sélectionner ({totalCount})
          </Button>
        )}

        {selectedCount > 0 && (
          <Button
            variant="link"
            size="sm"
            onClick={onDeselectAll}
            className="h-auto p-0 text-gray-600 dark:text-gray-400"
          >
            Désélectionner
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Actions principales (visibles directement) */}
        {primaryActions.map((action) => (
          <Button
            key={action.id}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={() => handleActionClick(action)}
            className="gap-2"
          >
            {action.icon}
            {action.label}
          </Button>
        ))}

        {/* Actions secondaires (dans un menu déroulant) */}
        {secondaryActions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <MoreHorizontal className="w-4 h-4" />
                Plus
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {secondaryActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  {index > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => handleActionClick(action)}>
                    <div className="flex items-center gap-2">
                      {action.icon}
                      {action.label}
                    </div>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Actions prédéfinies courantes
export const CommonBulkActions = {
  delete: (onDelete: () => void, count: number): BulkAction => ({
    id: 'delete',
    label: 'Supprimer',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    onClick: onDelete,
    confirmMessage: `Êtes-vous sûr de vouloir supprimer ${count} élément${count > 1 ? 's' : ''} ? Cette action est irréversible.`
  }),

  archive: (onArchive: () => void): BulkAction => ({
    id: 'archive',
    label: 'Archiver',
    icon: <Archive className="w-4 h-4" />,
    variant: 'outline',
    onClick: onArchive
  }),

  activate: (onActivate: () => void): BulkAction => ({
    id: 'activate',
    label: 'Activer',
    icon: <CheckCircle className="w-4 h-4" />,
    variant: 'outline',
    onClick: onActivate
  }),

  deactivate: (onDeactivate: () => void): BulkAction => ({
    id: 'deactivate',
    label: 'Désactiver',
    icon: <XCircle className="w-4 h-4" />,
    variant: 'outline',
    onClick: onDeactivate
  })
};
