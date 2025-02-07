import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface CreateQuestInput {
  name: string;
  description: string;
  img?: string;
  config?: any;
  creatorId: string;
}

export interface UpdateQuestInput {
  name?: string;
  description?: string;
  img?: string;
  config?: any;
  closed?: boolean;
}

export interface TaskReviewerInput {
  taskId: string;
  userId: string;
}

export const QuestService = {
  // Create a new quest
  async createQuest(input: CreateQuestInput) {
    const { config, creatorId, ...rest } = input;

    if (!creatorId) {
      throw new Error('Creator ID is required');
    }

    const quest = await prisma.quest.create({
      data: {
        ...rest,
        creatorId,
        config: config ? JSON.stringify(config) : undefined,
      }
    });

    return prisma.quest.findUnique({
      where: { id: quest.id },
      include: {
        tasks: {
          include: {
            submissions: true,
            reviewers: {
              include: {
                user: true,
              }
            }
          }
        },
        members: true,
        creator: true,
      }
    });
  },

  // Add reviewer to task
  async addTaskReviewer(input: TaskReviewerInput) {
    return prisma.taskReviewer.create({
      data: {
        taskId: input.taskId,
        userId: input.userId,
      },
      include: {
        user: true,
        task: true,
      }
    });
  },

  // Remove reviewer from task
  async removeTaskReviewer(input: TaskReviewerInput) {
    return prisma.taskReviewer.delete({
      where: {
        taskId_userId: {
          taskId: input.taskId,
          userId: input.userId,
        }
      }
    });
  },

  // Get quest by ID
  async getQuestById(id: string) {
    return prisma.quest.findUnique({
      where: { id },
      include: {
        tasks: {
          include: {
            submissions: true,
            reviewers: {
              include: {
                user: true,
              }
            }
          }
        },
        members: true,
        creator: true,
      }
    });
  },

  // Get all quests with pagination
  async getQuests(page = 1, limit = 10, filters?: { closed?: boolean }) {
    const skip = (page - 1) * limit;
    const where = filters || {};

    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tasks: {
            include: {
              submissions: true,
              reviewers: {
                include: {
                  user: true,
                }
              }
            }
          },
          members: true,
          creator: true,
        }
      }),
      prisma.quest.count({ where }),
    ]);

    return {
      quests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Update quest
  async updateQuest(id: string, input: UpdateQuestInput) {
    const { config, ...rest } = input;
    const quest = await prisma.quest.update({
      where: { id },
      data: {
        ...rest,
        config: config ? JSON.parse(config as string) : undefined,
      }
    });

    return prisma.quest.findUnique({
      where: { id: quest.id },
      include: {
        tasks: {
          include: {
            submissions: true,
            reviewers: {
              include: {
                user: true,
              }
            }
          }
        },
        members: true,
        creator: true,
      }
    });
  },

  // Delete quest and all related data
  async deleteQuest(id: string) {
    // Using transaction to ensure data consistency
    return prisma.$transaction(async (prisma) => {
      // First delete all task reviewers
      await prisma.taskReviewer.deleteMany({
        where: {
          task: {
            questId: id,
          },
        },
      });

      // Then delete all submissions
      await prisma.submission.deleteMany({
        where: {
          task: {
            questId: id,
          },
        },
      });

      // Then delete all tasks
      await prisma.task.deleteMany({
        where: {
          questId: id,
        },
      });

      // Finally delete the quest
      return prisma.quest.delete({
        where: { id },
      });
    });
  },

  // Close quest
  async closeQuest(id: string) {
    const quest = await prisma.quest.update({
      where: { id },
      data: { closed: true },
    });

    return prisma.quest.findUnique({
      where: { id: quest.id },
      include: {
        tasks: {
          include: {
            submissions: true,
            reviewers: {
              include: {
                user: true,
              }
            }
          }
        },
        members: true,
        creator: true,
      }
    });
  },

  // Get user's quests
  async getUserQuests(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [quests, total] = await Promise.all([
      prisma.quest.findMany({
        where: {
          creatorId: userId,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tasks: {
            include: {
              submissions: true,
              reviewers: {
                include: {
                  user: true,
                }
              }
            }
          },
          members: true,
          creator: true,
        }
      }),
      prisma.quest.count({
        where: {
          creatorId: userId,
        },
      }),
    ]);

    return {
      quests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};