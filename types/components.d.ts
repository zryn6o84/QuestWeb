import { ReactNode } from 'react'
import { TaskView, BoardDetailView, SubmissionView } from './types'

declare module '@/components/ui/card' {
  export interface CardProps {
    children: ReactNode
    className?: string
  }
  export function Card(props: CardProps): JSX.Element
  export function CardHeader(props: CardProps): JSX.Element
  export function CardTitle(props: CardProps): JSX.Element
  export function CardDescription(props: CardProps): JSX.Element
  export function CardContent(props: CardProps): JSX.Element
  export function CardFooter(props: CardProps): JSX.Element
}

declare module '@/components/ui/button' {
  export interface ButtonProps {
    children: ReactNode
    onClick?: () => void
    disabled?: boolean
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    className?: string
  }
  export function Button(props: ButtonProps): JSX.Element
}

declare module '@/components/ui/dialog' {
  export interface DialogProps {
    children: ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    className?: string
  }
  export function Dialog(props: DialogProps): JSX.Element
  export function DialogContent(props: CardProps): JSX.Element
  export function DialogHeader(props: CardProps): JSX.Element
  export function DialogTitle(props: CardProps): JSX.Element
  export function DialogDescription(props: CardProps): JSX.Element
  export function DialogFooter(props: CardProps): JSX.Element
}

declare module '@/components/ui/tabs' {
  export interface TabsProps {
    children: ReactNode
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
    className?: string
  }
  export function Tabs(props: TabsProps): JSX.Element
  export function TabsList(props: CardProps): JSX.Element
  export function TabsTrigger(props: CardProps & { value: string }): JSX.Element
  export function TabsContent(props: CardProps & { value: string }): JSX.Element
}

declare module '@/components/ui/badge' {
  export interface BadgeProps {
    children: ReactNode
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    className?: string
  }
  export function Badge(props: BadgeProps): JSX.Element
}

declare module '@/components/TaskList' {
  export interface TaskListProps {
    tasks: TaskView[]
    questId: string
    boardConfig: any
    userTaskStatuses: any[]
    address?: string
    onTaskSelect: (task: TaskView) => void
    onOpenSubmitModal: (taskId: string) => void
    onOpenAddReviewerModal: (taskId: string) => void
    onOpenUpdateTaskModal: (taskId: string) => void
    onCancelTask: (taskId: string) => void
    refetch: () => void
    userProfiles: Record<string, { nickname: string; avatar: string }>
    isCreator: boolean
    isMember: boolean
    chain: any
  }
  export default function TaskList(props: TaskListProps): JSX.Element
}

declare module '@/components/MemberSubmissionTable' {
  export interface MemberSubmissionTableProps {
    board: BoardDetailView
    address?: string
    refetch: () => void
    userProfiles: Record<string, { nickname: string; avatar: string }>
  }
  export default function MemberSubmissionTable(props: MemberSubmissionTableProps): JSX.Element
}

declare module '@/components/DynamicModal' {
  export interface DynamicModalProps {
    isOpen: boolean
    onClose: () => void
    config: any
    selectedSubmission?: SubmissionView
    initialData?: any
    onSubmit: (data: any) => Promise<any>
    onConfirmed: () => void
  }
  export default function DynamicModal(props: DynamicModalProps): JSX.Element
}

declare module '@/components/CreateTaskModal' {
  export interface CreateTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (data: any) => Promise<any>
    onConfirmed: () => void
    mode: 'create' | 'update'
    boardConfig: any
    tokenSymbol: string
    initialData?: any
  }
  export default function CreateTaskModal(props: CreateTaskModalProps): JSX.Element
}

declare module '@/components/BoardForm' {
  export interface BoardFormProps {
    initialData?: any
    onSubmit: (data: any) => Promise<any>
    mode: 'create' | 'update'
    redirectPath?: string
    isDialog?: boolean
  }
  export default function BoardForm(props: BoardFormProps): JSX.Element
}

declare module '@/components/ui/Address' {
  export interface AddressProps {
    address: string
    size?: 'sm' | 'md' | 'lg'
  }
  export function Address(props: AddressProps): JSX.Element
}

declare module '@/components/ui/skeleton' {
  export interface SkeletonProps {
    className?: string
  }
  export function Skeleton(props: SkeletonProps): JSX.Element
}

declare module '@/components/ui/use-toast' {
  export interface ToastProps {
    title?: string
    description?: ReactNode
    variant?: 'default' | 'destructive'
    duration?: number
  }
  export function useToast(): {
    toast: (props: ToastProps) => void
  }
}

declare module '@/components/SubmissionDetailsModal' {
  export interface SubmissionDetailsModalProps {
    isOpen: boolean
    onClose: () => void
    questId: string
    task: TaskView | null
    submission: SubmissionView | null
    isReviewer: boolean
    onConfirmed: () => void
  }
  export default function SubmissionDetailsModal(props: SubmissionDetailsModalProps): JSX.Element
}