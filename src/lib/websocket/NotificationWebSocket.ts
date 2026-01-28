/**
 * WebSocket Client para Notificações em Tempo Real
 * 
 * @description Cliente singleton que gerencia conexão WebSocket com o backend.
 * Implementa reconnection strategy com exponential backoff, heartbeat,
 * e gestão de eventos customizados para integração com React.
 * 
 * @module NotificationWebSocket
 * 
 * @example
 * ```tsx
 * import { NotificationWebSocket } from '@/lib/websocket/NotificationWebSocket';
 * 
 * // Conectar
 * const ws = NotificationWebSocket.getInstance();
 * await ws.connect(jwtToken);
 * 
 * // Escutar eventos
 * window.addEventListener('notification-received', (event) => {
 *   console.log('Nova notificação:', event.detail);
 * });
 * 
 * // Desconectar
 * ws.disconnect();
 * ```
 */

/**
 * Estados possíveis da conexão WebSocket
 */
export type ConnectionState =
  | 'disconnected' // Desconectado (estado inicial)
  | 'connecting'   // Tentando conectar
  | 'connected'    // Conectado e operacional
  | 'reconnecting' // Tentando reconectar após falha
  | 'error';       // Erro fatal (max attempts excedido)

/**
 * Interface de notificação recebida do backend
 * 
 * @export
 * @interface Notification
 */
export interface Notification {
  id: string;
  user_id?: string;
  type: 'team_assignment' | 'coach_removal' | 'member_added' | 'invite' | 'game' | 'training' | 'info';
  message: string;
  notification_data?: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * Configuração do cliente WebSocket
 */
interface WebSocketConfig {
  /** URL base da API (ex: http://localhost:8000) */
  baseUrl: string;
  
  /** Delay inicial entre tentativas de reconexão (segundos) */
  reconnectInitialDelay: number;
  
  /** Delay máximo entre tentativas (segundos) */
  reconnectMaxDelay: number;
  
  /** Multiplicador para exponential backoff */
  reconnectMultiplier: number;
  
  /** Máximo de tentativas de reconexão */
  reconnectMaxAttempts: number;
  
  /** Intervalo de heartbeat (segundos) */
  heartbeatInterval: number;
}

/**
 * Configuração padrão (sincronizada com backend config.py)
 */
const DEFAULT_CONFIG: WebSocketConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  reconnectInitialDelay: 1,       // 1s
  reconnectMaxDelay: 30,           // 30s
  reconnectMultiplier: 2.0,        // dobrar a cada tentativa
  reconnectMaxAttempts: 10,        // 10 tentativas
  heartbeatInterval: 30,           // 30s
};

/**
 * Tipos de mensagens WebSocket
 */
type WebSocketMessage =
  | { type: 'initial'; notifications: Notification[] }
  | { type: 'notification'; data: Notification }
  | { type: 'permissions-changed'; data: any }
  | { type: 'pong' }
  | { type: 'error'; message: string };

/**
 * Cliente WebSocket Singleton para gerenciamento de notificações
 */
export class NotificationWebSocket {
  private static instance: NotificationWebSocket | null = null;
  
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private state: ConnectionState = 'disconnected';
  private token: string | null = null;
  
  // Reconnection strategy
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  // Heartbeat
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastPongReceived: number = Date.now();
  
  // Listeners para mudança de estado
  private stateListeners: Set<(state: ConnectionState) => void> = new Set();

  private constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Obtém instância singleton
   */
  public static getInstance(config?: Partial<WebSocketConfig>): NotificationWebSocket {
    if (!NotificationWebSocket.instance) {
      NotificationWebSocket.instance = new NotificationWebSocket(config);
    }
    return NotificationWebSocket.instance;
  }

  /**
   * Reseta singleton (útil para testes)
   */
  public static resetInstance(): void {
    NotificationWebSocket.instance?.disconnect();
    NotificationWebSocket.instance = null;
  }

  /**
   * Retorna estado atual da conexão
   */
  public getState(): ConnectionState {
    return this.state;
  }

  /**
   * Verifica se está conectado
   */
  public isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Registra listener para mudanças de estado
   */
  public onStateChange(listener: (state: ConnectionState) => void): () => void {
    this.stateListeners.add(listener);
    // Retorna função para remover listener
    return () => this.stateListeners.delete(listener);
  }

  /**
   * Atualiza estado e notifica listeners
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateListeners.forEach(listener => listener(newState));
      
      // Dispatch custom event para componentes que não usam listener
      window.dispatchEvent(new CustomEvent('websocket-state-change', {
        detail: { state: newState }
      }));
    }
  }

  /**
   * Conecta ao WebSocket do backend
   * 
   * @param token - JWT token para autenticação
   */
  public async connect(token: string): Promise<void> {
    if (this.isConnected()) {
      console.warn('[WebSocket] Já conectado');
      return;
    }

    if (this.state === 'connecting' || this.state === 'reconnecting') {
      console.warn('[WebSocket] Conexão já em andamento');
      return;
    }

    this.token = token;
    this.reconnectAttempts = 0;
    await this.doConnect();
  }

  /**
   * Executa conexão WebSocket
   */
  private async doConnect(): Promise<void> {
    if (!this.token) {
      throw new Error('Token não fornecido');
    }

    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      // Construir URL WebSocket (ws:// ou wss://)
      const wsProtocol = this.config.baseUrl.startsWith('https') ? 'wss' : 'ws';
      const wsBaseUrl = this.config.baseUrl.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${wsBaseUrl}/api/v1/notifications/stream?token=${this.token}`;

      console.log(`[WebSocket] Conectando ao ${wsUrl.replace(this.token, '***')}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = (event) => this.handleClose(event);

    } catch (error) {
      console.error('[WebSocket] Erro ao conectar:', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  /**
   * Handler: conexão estabelecida
   */
  private handleOpen(): void {
    console.log('[WebSocket] Conectado com sucesso');
    this.setState('connected');
    this.reconnectAttempts = 0;
    this.lastPongReceived = Date.now();
    
    // Iniciar heartbeat
    this.startHeartbeat();

    // Dispatch evento de conexão
    window.dispatchEvent(new CustomEvent('websocket-connected'));
  }

  /**
   * Handler: mensagem recebida
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'initial':
          // Backend enviou notificações não lidas ao conectar
          console.log(`[WebSocket] Recebido ${message.notifications.length} notificações iniciais`);
          window.dispatchEvent(new CustomEvent('notifications-loaded', {
            detail: { notifications: message.notifications }
          }));
          break;

        case 'notification':
          // Nova notificação em tempo real
          console.log('[WebSocket] Nova notificação recebida:', message.data);
          window.dispatchEvent(new CustomEvent('notification-received', {
            detail: message.data
          }));
          break;
        
        case 'permissions-changed':
          // Step 10: Permissões do usuário mudaram (ex: role alterado)
          console.log('[WebSocket] Permissões alteradas:', message.data);
          window.dispatchEvent(new CustomEvent('permissions-changed', {
            detail: message.data
          }));
          break;

        case 'pong':
          // Resposta ao heartbeat
          this.lastPongReceived = Date.now();
          break;

        case 'error':
          console.error('[WebSocket] Erro do servidor:', message.message);
          break;

        default:
          console.warn('[WebSocket] Mensagem desconhecida:', message);
      }
    } catch (error) {
      console.error('[WebSocket] Erro ao parsear mensagem:', error);
    }
  }

  /**
   * Handler: erro na conexão
   */
  private handleError(error: Event): void {
    console.error('[WebSocket] Erro:', error);
    
    // Não mudar estado aqui - onclose será chamado em seguida
  }

  /**
   * Handler: conexão fechada
   */
  private handleClose(event: CloseEvent): void {
    console.log(`[WebSocket] Conexão fechada (code: ${event.code}, reason: ${event.reason})`);
    
    this.stopHeartbeat();

    // Se foi desconexão intencional (código 1000), não reconectar
    if (event.code === 1000) {
      this.setState('disconnected');
      return;
    }

    // Tentar reconectar
    this.scheduleReconnect();
  }

  /**
   * Agenda tentativa de reconexão com exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectMaxAttempts) {
      console.error(`[WebSocket] Máximo de ${this.config.reconnectMaxAttempts} tentativas excedido`);
      this.setState('error');
      
      window.dispatchEvent(new CustomEvent('websocket-max-reconnect-attempts'));
      return;
    }

    this.reconnectAttempts++;
    this.setState('reconnecting');

    // Calcular delay com exponential backoff
    const baseDelay = this.config.reconnectInitialDelay;
    const delay = Math.min(
      baseDelay * Math.pow(this.config.reconnectMultiplier, this.reconnectAttempts - 1),
      this.config.reconnectMaxDelay
    );

    console.log(`[WebSocket] Tentativa ${this.reconnectAttempts}/${this.config.reconnectMaxAttempts} em ${delay.toFixed(1)}s`);

    this.reconnectTimeout = setTimeout(() => {
      this.doConnect();
    }, delay * 1000);
  }

  /**
   * Inicia envio periódico de heartbeat (ping)
   */
  private startHeartbeat(): void {
    this.stopHeartbeat(); // Garantir que não há interval duplicado

    this.heartbeatInterval = setInterval(() => {
      if (!this.isConnected()) {
        this.stopHeartbeat();
        return;
      }

      // Verificar se recebeu pong recentemente
      const timeSinceLastPong = Date.now() - this.lastPongReceived;
      const timeout = this.config.heartbeatInterval * 2 * 1000; // 2x o intervalo

      if (timeSinceLastPong > timeout) {
        console.warn('[WebSocket] Heartbeat timeout - reconectando');
        this.ws?.close();
        return;
      }

      // Enviar ping
      try {
        this.ws?.send(JSON.stringify({ type: 'ping' }));
      } catch (error) {
        console.error('[WebSocket] Erro ao enviar ping:', error);
      }
    }, this.config.heartbeatInterval * 1000);
  }

  /**
   * Para envio de heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Desconecta do WebSocket
   */
  public disconnect(): void {
    console.log('[WebSocket] Desconectando...');

    // Cancelar reconnect pendente
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect'); // 1000 = Normal Closure
      this.ws = null;
    }

    this.setState('disconnected');
    this.token = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Reconecta forçadamente (útil para refresh de token)
   */
  public async reconnect(newToken?: string): Promise<void> {
    if (newToken) {
      this.token = newToken;
    }

    this.disconnect();
    
    if (this.token) {
      await this.connect(this.token);
    }
  }
}

/**
 * Hook helper para usar em componentes React
 * 
 * @example
 * ```tsx
 * const { state, connect, disconnect } = useNotificationWebSocket();
 * 
 * useEffect(() => {
 *   const token = getAuthToken();
 *   if (token) {
 *     connect(token);
 *   }
 *   return () => disconnect();
 * }, []);
 * ```
 */
export function useNotificationWebSocket() {
  const ws = NotificationWebSocket.getInstance();
  
  return {
    state: ws.getState(),
    isConnected: ws.isConnected(),
    connect: (token: string) => ws.connect(token),
    disconnect: () => ws.disconnect(),
    reconnect: (token?: string) => ws.reconnect(token),
    onStateChange: (listener: (state: ConnectionState) => void) => ws.onStateChange(listener),
  };
}
