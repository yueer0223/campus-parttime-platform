export type Role = 'admin' | 'publisher' | 'receiver'
export type TaskStatus = 'pending' | 'open' | 'applied' | 'in_progress' | 'completed' | 'cancelled' | 'rejected'

export interface User {
  id: number
  username: string
  role: Role
  nickname: string | null
  phone: string | null
  wechat: string | null
  created_at: string
}

export interface Category {
  id: number
  name: string
}

export interface Task {
  id: number
  title: string
  description: string
  category_id: number | null
  category_name: string | null
  reward: number
  reward_unit: string
  price_type: string
  duration: string | null
  deadline: string | null
  offer_price: number | null
  final_price: number | null
  apply_count: number
  is_favorited: boolean
  status: TaskStatus
  publisher_id: number
  publisher_name: string | null
  receiver_id: number | null
  receiver_name: string | null
  created_at: string
  updated_at: string
}

export interface TaskInput {
  title: string
  description: string
  category_id: number | null
  reward: number
  reward_unit: string
  price_type: string
  duration?: string
  deadline?: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface PolishResponse {
  original_text: string
  polished_text: string
  provider: string
  model: string
}

export interface DashboardStats {
  total_tasks: number
  total_users: number
  open_tasks: number
  in_progress_tasks: number
  completed_tasks: number
  completion_rate: number
  status_distribution: { status: string; count: number }[]
  category_distribution: { name: string; count: number }[]
  top_categories: { name: string; count: number }[]
  daily_trend: { date: string; count: number }[]
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface Notification {
  id: number
  type: string
  content: string
  task_id: number | null
  is_read: boolean
  created_at: string
}

export interface Review {
  id: number
  task_id: number
  reviewer_id: number
  reviewer_name: string | null
  reviewee_id: number
  rating: number
  content: string
  created_at: string
}

export interface Complaint {
  id: number
  task_id: number
  task_title: string | null
  complainant_id: number
  complainant_name: string | null
  reason: string
  detail: string
  status: string
  handled_note: string | null
  created_at: string
}

export interface Message {
  id: number
  task_id: number
  sender_id: number
  sender_name: string | null
  receiver_id: number
  content: string
  is_read: boolean
  created_at: string
}

export interface Conversation {
  task_id: number
  task_title: string
  peer_id: number
  peer_name: string
  last_message: string
  unread_count: number
  updated_at: string
}

export interface CardExchange {
  task_id: number
  publisher_agreed: boolean
  receiver_agreed: boolean
  completed: boolean
  i_am_publisher: boolean
  i_agreed: boolean
  peer_name: string | null
  peer_wechat: string | null
  peer_phone: string | null
}

export interface MyStats {
  earnings: number
  completed_count: number
  published_count: number
  review_count: number
  avg_rating: number | null
}
