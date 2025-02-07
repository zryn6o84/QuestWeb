import { PrismaClient, Prisma } from '@prisma/client'

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

// User Profile Service
export const UserProfileService = {
  // Create or update user profile
  upsertProfile: async (data: {
    evmAddress?: string
    solanaAddress?: string
    nickname?: string
    avatar?: string
    socialAccount?: string
  }) => {
    const where = data.evmAddress
      ? { evmAddress: data.evmAddress }
      : { solanaAddress: data.solanaAddress };

    return prisma.user.upsert({
      where,
      update: {
        nickname: data.nickname,
        avatar: data.avatar,
        socialAccount: data.socialAccount,
      },
      create: {
        evmAddress: data.evmAddress,
        solanaAddress: data.solanaAddress,
        nickname: data.nickname,
        avatar: data.avatar,
        socialAccount: data.socialAccount,
      },
    })
  },

  // Get user profile by address
  getProfileByAddress: async (address: string) => {
    return prisma.user.findFirst({
      where: {
        OR: [
          { evmAddress: address },
          { solanaAddress: address }
        ]
      },
      include: {
        createdQuests: true,
        memberQuests: {
          include: {
            quest: true,
          },
        },
        submissions: {
          include: {
            task: true,
          },
        },
      },
    })
  },

  // Get user profile by ID
  getProfile: async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      include: {
        createdQuests: true,
        memberQuests: {
          include: {
            quest: true,
          },
        },
        submissions: {
          include: {
            task: true,
          },
        },
      },
    })
  },

  // Get multiple user profiles
  getProfiles: async (ids: string[]) => {
    return prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    })
  },

  // Get user activity
  getUserActivity: async (userId: string) => {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  },
}

// Activity Log Service
export const ActivityLogService = {
  // Log activity
  logActivity: async (data: {
    userId: string
    action: string
    details: string
  }) => {
    return prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        details: data.details,
      } as Prisma.ActivityLogUncheckedCreateInput,
    })
  },

  // Get activities by user ID
  getActivities: async (userId: string, limit = 20) => {
    return prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  },
}

// Notification Service
export const NotificationService = {
  // Create notification
  createNotification: async (data: {
    userId: string
    type: string
    message: string
    data?: string
  }) => {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        message: data.message,
        data: data.data,
      } as Prisma.NotificationUncheckedCreateInput,
    })
  },

  // Get user notifications
  getUserNotifications: async (userId: string, includeRead = false) => {
    return prisma.notification.findMany({
      where: {
        userId,
        ...(includeRead ? {} : { read: false }),
      } as Prisma.NotificationWhereInput,
      orderBy: { createdAt: 'desc' },
    })
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    return prisma.notification.update({
      where: { id },
      data: { read: true },
    })
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: { userId, read: false } as Prisma.NotificationWhereInput,
      data: { read: true },
    })
  },
}

// Quest Service
export const QuestService = {
  // Create a new quest
  createQuest: async (data: {
    name: string
    description: string
    img: string
    rewardToken: string
    totalPledged: bigint
    creatorId: string
    config: string
  }) => {
    const quest = await prisma.quest.create({
      data: {
        name: data.name,
        description: data.description,
        img: data.img,
        rewardToken: data.rewardToken,
        totalPledged: data.totalPledged,
        creatorId: data.creatorId,
        config: data.config,
      } as Prisma.QuestUncheckedCreateInput,
      include: {
        createdBy: true,
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    // Log activity
    await ActivityLogService.logActivity({
      userId: data.creatorId,
      action: 'CREATE_QUEST',
      details: JSON.stringify({
        questId: quest.id,
        name: quest.name,
      }),
    })

    return quest
  },

  // Get quest by ID
  getQuest: async (id: string) => {
    return prisma.quest.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            reviewers: {
              include: {
                user: true,
              },
            },
            submissions: true,
          },
        },
        members: {
          include: {
            user: true,
          },
        },
        createdBy: true,
      },
    })
  },

  // Get all quests
  getAllQuests: async () => {
    return prisma.quest.findMany({
      include: {
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
        createdBy: true,
      },
    })
  },

  // Update quest
  updateQuest: async (
    id: string,
    data: {
      name?: string
      description?: string
      img?: string
      rewardToken?: string
      totalPledged?: bigint
      closed?: boolean
      config?: string
    }
  ) => {
    return prisma.quest.update({
      where: { id },
      data: data as Prisma.QuestUncheckedUpdateInput,
      include: {
        createdBy: true,
        tasks: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    })
  },
}

// Task Service
export const TaskService = {
  // Create a new task
  createTask: async (data: {
    questId: string
    creatorId: string
    name: string
    description: string
    deadline?: Date
    maxCompletions: number
    rewardAmount: bigint
    config: string
    allowSelfCheck: boolean
  }) => {
    const task = await prisma.task.create({
      data: {
        name: data.name,
        description: data.description,
        questId: data.questId,
        creatorId: data.creatorId,
        deadline: data.deadline,
        maxCompletions: data.maxCompletions,
        rewardAmount: data.rewardAmount,
        config: data.config,
        allowSelfCheck: data.allowSelfCheck,
        numCompletions: 0,
        completed: false,
        cancelled: false,
      } as Prisma.TaskUncheckedCreateInput,
      include: {
        createdBy: true,
        quest: true,
        reviewers: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submittedBy: true,
            reviewedBy: true,
          },
        },
      },
    })

    // Log activity
    await ActivityLogService.logActivity({
      userId: data.creatorId,
      action: 'CREATE_TASK',
      details: JSON.stringify({
        taskId: task.id,
        questId: task.questId,
        name: task.name,
      }),
    })

    return task
  },

  // Get task by ID
  getTask: async (id: string) => {
    return prisma.task.findUnique({
      where: { id },
      include: {
        reviewers: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submittedBy: true,
            reviewedBy: true,
          },
        },
        createdBy: true,
        quest: true,
      },
    })
  },

  // Get tasks by quest ID
  getTasksByQuest: async (questId: string) => {
    return prisma.task.findMany({
      where: { questId } as Prisma.TaskWhereInput,
      include: {
        reviewers: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submittedBy: true,
            reviewedBy: true,
          },
        },
        createdBy: true,
        quest: true,
      },
    })
  },

  // Update task
  updateTask: async (
    id: string,
    data: {
      name?: string
      description?: string
      deadline?: Date
      maxCompletions?: number
      completed?: boolean
      cancelled?: boolean
      config?: string
      allowSelfCheck?: boolean
    }
  ) => {
    return prisma.task.update({
      where: { id },
      data: data as Prisma.TaskUncheckedUpdateInput,
      include: {
        createdBy: true,
        quest: true,
        reviewers: {
          include: {
            user: true,
          },
        },
        submissions: {
          include: {
            submittedBy: true,
            reviewedBy: true,
          },
        },
      },
    })
  },
}

// Submission Service
export const SubmissionService = {
  // Create submission
  createSubmission: async (data: {
    taskId: string
    submitterId: string
    proof: string
  }) => {
    const submission = await prisma.submission.create({
      data: {
        taskId: data.taskId,
        submitterId: data.submitterId,
        proof: data.proof,
        status: 0,
        submittedAt: new Date(),
      } as Prisma.SubmissionUncheckedCreateInput,
      include: {
        task: true,
        submittedBy: true,
        reviewedBy: true,
      },
    })

    // Log activity
    await ActivityLogService.logActivity({
      userId: data.submitterId,
      action: 'SUBMIT_PROOF',
      details: JSON.stringify({
        taskId: submission.taskId,
        proof: submission.proof,
      }),
    })

    // Create notification for task reviewers
    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: {
        reviewers: {
          include: {
            user: true,
          },
        },
      },
    })

    if (task) {
      for (const reviewer of task.reviewers) {
        await NotificationService.createNotification({
          userId: reviewer.userId,
          type: 'NEW_SUBMISSION',
          message: `New submission for task "${task.name}"`,
          data: JSON.stringify({
            taskId: task.id,
            submitterId: data.submitterId,
          }),
        })
      }
    }

    return submission
  },

  // Update submission status
  updateSubmissionStatus: async (
    id: string,
    data: {
      status: number
      reviewComment?: string
      reviewerId?: string
      reviewedAt?: Date
    }
  ) => {
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        reviewComment: data.reviewComment,
        reviewerId: data.reviewerId,
        reviewedAt: data.reviewedAt,
      } as Prisma.SubmissionUncheckedUpdateInput,
      include: {
        task: true,
        submittedBy: true,
        reviewedBy: true,
      },
    })

    // Log activity
    if (data.reviewerId) {
      await ActivityLogService.logActivity({
        userId: data.reviewerId,
        action: 'REVIEW_SUBMISSION',
        details: JSON.stringify({
          submissionId: id,
          status: data.status,
          taskId: submission.taskId,
        }),
      })
    }

    // Create notification for submitter
    await NotificationService.createNotification({
      userId: submission.submitterId,
      type: 'SUBMISSION_REVIEWED',
      message: `Your submission for "${submission.task.name}" has been ${
        data.status === 1 ? 'approved' : 'rejected'
      }`,
      data: JSON.stringify({
        taskId: submission.taskId,
        status: data.status,
      }),
    })

    return submission
  },

  // Get submission by task and submitter
  getSubmission: async (taskId: string, submitterId: string) => {
    return prisma.submission.findFirst({
      where: {
        taskId,
        submitterId,
      } as Prisma.SubmissionWhereInput,
      include: {
        task: true,
        submittedBy: true,
        reviewedBy: true,
      },
    })
  },
}

// Member Service
export const MemberService = {
  // Add member to quest
  addMember: async (data: { questId: string; userId: string }) => {
    const member = await prisma.member.create({
      data: {
        questId: data.questId,
        userId: data.userId,
      } as Prisma.MemberUncheckedCreateInput,
      include: {
        quest: true,
        user: true,
      },
    })

    // Log activity
    await ActivityLogService.logActivity({
      userId: data.userId,
      action: 'JOIN_QUEST',
      details: JSON.stringify({
        questId: data.questId,
        questName: member.quest.name,
      }),
    })

    return member
  },

  // Check if user is member of quest
  isMember: async (questId: string, userId: string) => {
    const member = await prisma.member.findFirst({
      where: {
        questId,
        userId,
      } as Prisma.MemberWhereInput,
    })
    return !!member
  },
}

// Reviewer Service
export const ReviewerService = {
  // Add reviewer to task
  addReviewer: async (data: { taskId: string; userId: string }) => {
    const reviewer = await prisma.reviewer.create({
      data: {
        taskId: data.taskId,
        userId: data.userId,
      } as Prisma.ReviewerUncheckedCreateInput,
      include: {
        task: true,
        user: true,
      },
    })

    // Log activity
    await ActivityLogService.logActivity({
      userId: data.userId,
      action: 'BECOME_REVIEWER',
      details: JSON.stringify({
        taskId: data.taskId,
        taskName: reviewer.task.name,
      }),
    })

    return reviewer
  },

  // Check if user is reviewer of task
  isReviewer: async (taskId: string, userId: string) => {
    const reviewer = await prisma.reviewer.findFirst({
      where: {
        taskId,
        userId,
      } as Prisma.ReviewerWhereInput,
    })
    return !!reviewer
  },
}

// 添加头像生成函数
const generateAvatar = (email: string) => {
  return `https://avatar.vercel.sh/${encodeURIComponent(email)}.svg`
}

// 更新用户服务方法
export const UserService = {
  createUser: async (data: {
    email: string
    password: string
    nickname: string
  }) => {
    return prisma.user.create({
      data: {
        ...data,
        avatar: generateAvatar(data.email)
      }
    })
  },

  updateUser: async (
    id: string,
    data: {
      email?: string
      password?: string
      nickname?: string
      avatar?: string
      evmAddress?: string | null
      solanaAddress?: string | null
      auroAddress?: string | null
    }
  ) => {
    return prisma.user.update({
      where: { id },
      data
    })
  },

  getUserByEmail: async (email: string) => {
    return prisma.user.findUnique({
      where: { email }
    })
  }
}