/**
 * Service d'exécution des actions chatbot côté frontend
 * Permet au chatbot de contrôler la navigation et les actions UI
 */

import { useRouter } from 'next/navigation';

export interface ChatbotAction {
  type: string;
  [key: string]: any;
}

export interface UIActionPayload {
  type: 'ui_action';
  action: ChatbotAction;
}

/**
 * Exécute une action retournée par le chatbot
 */
export class ChatbotActionExecutor {
  private router: any;
  private schedulePageRef: any;

  constructor(router?: any) {
    this.router = router;
  }

  /**
   * Enregistre une référence à la page emploi du temps
   */
  registerSchedulePage(pageRef: any) {
    this.schedulePageRef = pageRef;
  }

  /**
   * Exécute une action chatbot
   */
  executeAction(actionPayload: UIActionPayload): boolean {
    const { action } = actionPayload;

    console.log('[ChatbotActionExecutor] Executing action:', action);

    try {
      switch (action.type) {
        case 'navigate':
          return this.handleNavigate(action);

        case 'select_class':
          return this.handleSelectClass(action);

        case 'change_view_mode':
          return this.handleChangeViewMode(action);

        case 'filter_sessions':
          return this.handleFilterSessions(action);

        case 'show_statistics':
          return this.handleShowStatistics(action);

        case 'set_edit_mode':
          return this.handleSetEditMode(action);

        case 'open_session_form':
          return this.handleOpenSessionForm(action);

        case 'export_schedule':
          return this.handleExportSchedule(action);

        default:
          console.warn('[ChatbotActionExecutor] Unknown action type:', action.type);
          return false;
      }
    } catch (error) {
      console.error('[ChatbotActionExecutor] Error executing action:', error);
      return false;
    }
  }

  /**
   * Navigation vers une route
   */
  private handleNavigate(action: ChatbotAction): boolean {
    const { route, params } = action;

    if (!this.router) {
      console.error('[ChatbotActionExecutor] Router not available');
      return false;
    }

    // Construire l'URL avec les paramètres
    let url = route;
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams(params).toString();
      url = `${route}?${queryParams}`;
    }

    console.log('[ChatbotActionExecutor] Navigating to:', url);
    this.router.push(url);
    return true;
  }

  /**
   * Sélection d'une classe
   */
  private handleSelectClass(action: ChatbotAction): boolean {
    const { class_code } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.selectClass === 'function') {
      this.schedulePageRef.selectClass(class_code);
      return true;
    }

    return false;
  }

  /**
   * Changement du mode de vue
   */
  private handleChangeViewMode(action: ChatbotAction): boolean {
    const { mode } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.setViewMode === 'function') {
      this.schedulePageRef.setViewMode(mode);
      return true;
    }

    return false;
  }

  /**
   * Filtrage des sessions
   */
  private handleFilterSessions(action: ChatbotAction): boolean {
    const { filter } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.setFilter === 'function') {
      this.schedulePageRef.setFilter(filter);
      return true;
    }

    return false;
  }

  /**
   * Affichage des statistiques
   */
  private handleShowStatistics(action: ChatbotAction): boolean {
    const { show } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.toggleStatistics === 'function') {
      this.schedulePageRef.toggleStatistics(show);
      return true;
    }

    return false;
  }

  /**
   * Changement du mode d'édition
   */
  private handleSetEditMode(action: ChatbotAction): boolean {
    const { mode } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.setEditMode === 'function') {
      this.schedulePageRef.setEditMode(mode);
      return true;
    }

    return false;
  }

  /**
   * Ouverture du formulaire de session
   */
  private handleOpenSessionForm(action: ChatbotAction): boolean {
    const { mode } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.openSessionForm === 'function') {
      this.schedulePageRef.openSessionForm(mode === 'create' ? null : action.sessionId);
      return true;
    }

    return false;
  }

  /**
   * Export de l'emploi du temps
   */
  private handleExportSchedule(action: ChatbotAction): boolean {
    const { format } = action;

    if (!this.schedulePageRef) {
      console.warn('[ChatbotActionExecutor] Schedule page ref not registered');
      return false;
    }

    if (typeof this.schedulePageRef.exportSchedule === 'function') {
      this.schedulePageRef.exportSchedule(format);
      return true;
    }

    return false;
  }
}

// Instance singleton
let executorInstance: ChatbotActionExecutor | null = null;

export function getChatbotActionExecutor(router?: any): ChatbotActionExecutor {
  if (!executorInstance) {
    executorInstance = new ChatbotActionExecutor(router);
  } else if (router && !executorInstance['router']) {
    executorInstance['router'] = router;
  }
  return executorInstance;
}

export function resetChatbotActionExecutor() {
  executorInstance = null;
}
