// JWT Payload interface
export interface JWTPayload {
  id: string;
  email: string;
  type?: 'user' | 'service_account';
  iat?: number;
  exp?: number;
}

// User authentication interfaces
export interface User {
  id: string;
  email: string;
  password_hash?: string;
  full_name?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

// Database entity interfaces
export interface Thought {
  id: string;
  user_id: string;
  title: string;
  description: string;
  is_public: boolean;
  is_collaborative: boolean;
  tags: string[];
  bean_id?: string;
  stage?: string;
  created_at: string;
  updated_at: string;
}

export interface Action {
  id: string;
  thought_id: string;
  bean_id: string;
  type?: 'Event' | 'Knowledge' | 'Decision' | 'Reflection' | 'Task' | 'Exploration' | 
         'Social' | 'Reward/Achievement' | 'Challenge' | 'Random Event' | 
         'Mood/Status' | 'Idea/Insight' | 'Resource/Tool' | 'Interactive Task';
  summary: string;
  event?: string;
  knowledge?: string;
  decision?: string;
  reflection?: string;
  created_at: string;
  updated_at: string;
}

export interface UserChoice {
  id: string;
  user_id: string;
  action_id: string;
  choice_type: 'accept' | 'reject' | 'modify' | 'propose_new' | 'discuss_only';
  choice_content?: Record<string, any>;
  created_at: string;
}

export interface ActionHistory {
  id: string;
  action_id: string;
  user_id: string;
  final_status: 'planned' | 'done' | 'skipped' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  preference_key: string;
  score: number; // 1-10
  created_at: string;
  updated_at: string;
}

// New interfaces based on database tables
export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Diary {
  id: string;
  user_id: string;
  title: string;
  content: string;
  mood?: number; // 1-10
  tags?: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  goal_id?: string;
  title: string;
  description?: string;
  progress_value: number;
  max_value?: number;
  unit?: string;
  created_at: string;
  updated_at: string;
}

export interface Bean {
  id: string;
  user_id: string;
  name: string;
  persona?: Record<string, any>;
  status?: string;
  created_at: string;
  updated_at: string;
}

// Chat interfaces (using conversations and messages tables)
export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'bean' | 'agent';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Chat {
  id: string;
  thought_id: string;
  bean_id: string;
  user_id: string;
  external_conversation_id?: string;
  agent_type?: string;
  coze_conversation_id?: string;
  conversation_type?: 'thought' | 'execution';
  status?: string;
  created_at: string;
  updated_at: string;
}

// API Request/Response interfaces
export interface CreateThoughtRequest {
  user_id: string;
  title: string;
  description: string;
  is_public?: boolean;
  is_collaborative?: boolean;
  tags?: string[];
}

export interface CreateThoughtResponse extends Thought {}

export interface GenerateActionRequest {
  thought_id: string;
}

export interface GenerateActionResponse extends Action {}

export interface CreateChoiceRequest {
  user_id: string;
  thought_id: string;
  action_id: string;
  choice_type: UserChoice['choice_type'];
  choice_content: Record<string, any>;
}

export interface CreateChoiceResponse {
  status: 'success';
  choice: UserChoice;
}

export interface CreateActionHistoryRequest {
  action_id: string;
  user_id: string;
  final_status: ActionHistory['final_status'];
  notes?: string;
}

export interface CreateActionHistoryResponse extends ActionHistory {}

export interface CreateChatRequest {
  thought_id: string;
  bean_id: string;
  external_conversation_id?: string;
  agent_type?: string;
  conversation_type?: 'thought' | 'execution';
}

export interface CreateChatResponse extends Chat {}

export interface SendMessageRequest {
  conversation_id: string;
  content: string;
  sender: 'user' | 'bean' | 'agent';
  metadata?: Record<string, any>;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message: ChatMessage;
}

export interface GetChatMessagesResponse {
  messages: ChatMessage[];
}

// Bean-related request/response interfaces
export interface CreateBeanRequest {
  user_id: string;
  name: string;
  persona?: Record<string, any>;
  status?: string;
}

export interface CreateBeanResponse extends Bean {}

export interface UpdateBeanRequest {
  name?: string;
  persona?: Record<string, any>;
  status?: string;
}

export interface UpdateBeanResponse extends Bean {}

// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: string;
  details?: any;
}