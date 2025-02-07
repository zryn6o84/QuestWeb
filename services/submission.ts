import { prisma } from '@/lib/prisma';

export interface CreateSubmissionInput {
  taskId: string;
  submitterId: string;
  proof: string;
}

export interface UpdateSubmissionInput {
  status?: number;
  reviewerId?: string;
  reviewComment?: string;
}

export const SubmissionService = {
  // Create a new submission
  async createSubmission(input: CreateSubmissionInput) {
    return prisma.submission.create({
      data: {
        ...input,
      },
      include: {
        submitter: true,
      },
    });
  },

  // Get submission by ID
  async getSubmissionById(id: string) {
    return prisma.submission.findUnique({
      where: { id },
      include: {
        submitter: true,
        task: true,
      },
    });
  },

  // Update submission
  async updateSubmission(id: string, input: UpdateSubmissionInput) {
    return prisma.submission.update({
      where: { id },
      data: {
        ...input,
        reviewedAt: input.status !== undefined ? new Date() : undefined,
      },
      include: {
        submitter: true,
        task: true,
      },
    });
  },

  // Delete submission
  async deleteSubmission(id: string) {
    return prisma.submission.delete({
      where: { id },
    });
  },

  // Get submissions by task
  async getSubmissionsByTask(taskId: string) {
    return prisma.submission.findMany({
      where: { taskId },
      include: {
        submitter: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  },

  // Get submissions by user
  async getSubmissionsByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: { submitterId: userId },
        include: {
          submitter: true,
          task: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.submission.count({
        where: { submitterId: userId },
      }),
    ]);

    return {
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get submissions to review
  async getSubmissionsToReview(reviewerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where: {
          reviewerId,
          status: 0, // Pending
        },
        include: {
          submitter: true,
          task: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.submission.count({
        where: {
          reviewerId,
          status: 0,
        },
      }),
    ]);

    return {
      submissions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },
};