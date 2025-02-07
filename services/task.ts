import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateTaskInput {
  questId: string;
  creatorId: string;
  name: string;
  description: string;
  deadline: string | Date;
  maxCompletions: number;
  rewardAmount: string;
  config: string;
  allowSelfCheck?: boolean;
  reviewerIds?: string[];
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  deadline?: string | Date;
  maxCompletions?: number;
  rewardAmount?: string;
  config?: string;
  allowSelfCheck?: boolean;
}

export interface CreateSubmissionInput {
  taskId: string;
  userId: string;
  content: string;
}

export interface ReviewSubmissionInput {
  submissionId: string;
  reviewerId: string;
  status: string;
  reviewComment?: string;
}

const taskInclude = {
  creator: {
    select: {
      id: true,
      nickname: true,
      avatar: true,
      evmAddress: true,
    }
  },
  quest: true,
  reviewers: {
    include: {
      user: true
    }
  },
  submissions: {
    where: {
      status: 'approved'
    },
    include: {
      user: true,
      reviewer: true
    }
  },
  _count: {
    select: {
      submissions: {
        where: {
          status: 'approved'
        }
      }
    }
  }
} satisfies Prisma.TaskInclude;

const submissionInclude = {
  task: {
    include: {
      quest: true,
      createdBy: {
        select: {
          id: true,
          nickname: true,
          avatar: true,
          evmAddress: true,
        },
      },
      reviewers: {
        include: {
          user: true,
        },
      },
    },
  },
  submittedBy: true,
  reviewedBy: true,
} as const;

export class TaskService {
  static async createTask(input: CreateTaskInput) {
    const deadline = input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline;

    return prisma.task.create({
      data: {
        questId: input.questId,
        creatorId: input.creatorId,
        name: input.name,
        description: input.description,
        deadline,
        maxCompletions: input.maxCompletions,
        rewardAmount: input.rewardAmount,
        config: input.config,
      },
      include: taskInclude,
    });
  }

  static async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        ...taskInclude,
        submissions: {
          include: {
            user: true,
            reviewer: true
          }
        }
      }
    });

    if (!task) return null;

    return {
      ...task,
      numCompletions: task._count.submissions
    };
  }

  static async getTasksByQuestId(questId: string) {
    const tasks = await prisma.task.findMany({
      where: { questId },
      include: {
        ...taskInclude,
        submissions: {
          include: {
            user: true,
            reviewer: true
          }
        }
      }
    });

    return tasks.map(task => ({
      ...task,
      numCompletions: task._count.submissions
    }));
  }

  static async updateTask(taskId: string, input: UpdateTaskInput) {
    const deadline = input.deadline instanceof Date ? input.deadline.toISOString() : input.deadline;

    return prisma.task.update({
      where: { id: taskId },
      data: {
        name: input.name,
        description: input.description,
        deadline,
        maxCompletions: input.maxCompletions,
        rewardAmount: input.rewardAmount,
        config: input.config,
      },
      include: taskInclude,
    });
  }

  static async deleteTask(id: string) {
    return prisma.$transaction(async (tx) => {
      // First delete all submissions
      await tx.submission.deleteMany({
        where: { taskId: id },
      });

      // Then delete the task
      return tx.task.delete({
        where: { id },
      });
    });
  }

  static async getUserSubmissions(userId: string, taskId: string) {
    return prisma.submission.findMany({
      where: {
        userId,
        taskId,
      },
      include: {
        task: true,
        user: true,
        reviewer: true
      }
    });
  }

  static async getTaskSubmissions(taskId: string) {
    return prisma.submission.findMany({
      where: { taskId },
      include: {
        task: true,
        user: true,
        reviewer: true
      }
    });
  }

  static async submitTask(input: CreateSubmissionInput) {
    // First check if the task exists and if the user can submit
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      include: {
        submissions: {
          where: { userId: input.userId }
        }
      }
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Check if user has already submitted
    if (task.submissions.length > 0) {
      throw new Error('You have already submitted to this task');
    }

    // Check if task is still accepting submissions
    if (task.submissions.length >= task.maxCompletions) {
      throw new Error('Task has reached maximum submissions');
    }

    // Create the submission
    return prisma.submission.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
        content: input.content,
        status: 'pending',
      },
      include: {
        task: true,
        user: true,
        reviewer: true
      }
    });
  }

  static async reviewSubmission(input: ReviewSubmissionInput) {
    // Check if reviewer is authorized
    const taskReviewer = await prisma.taskReviewer.findFirst({
      where: {
        userId: input.reviewerId,
        task: {
          submissions: {
            some: {
              id: input.submissionId
            }
          }
        }
      }
    });

    if (!taskReviewer) {
      throw new Error('Not authorized to review this submission');
    }

    return prisma.submission.update({
      where: { id: input.submissionId },
      data: {
        status: input.status,
        reviewComment: input.reviewComment,
        reviewerId: input.reviewerId,
        reviewedAt: new Date()
      },
      include: {
        task: true,
        user: true,
        reviewer: true
      }
    });
  }

  static async getTasksToReview(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [total, tasks] = await Promise.all([
      prisma.task.count({
        where: {
          reviewers: {
            some: {
              userId,
            },
          },
        },
      }),
      prisma.task.findMany({
        where: {
          reviewers: {
            some: {
              userId,
            },
          },
        },
        include: taskInclude,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      total,
      tasks,
      page,
      limit,
    };
  }
}