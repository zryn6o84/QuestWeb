import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TaskService } from "@/services/task";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: {
    questId: string;
    taskId: string;
  }
}

// POST /api/quests/[questId]/tasks/[taskId]/submissions
export async function POST(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if quest exists and user is a member
    const questMember = await prisma.questMember.findUnique({
      where: {
        questId_userId: {
          questId: params.questId,
          userId: session.user.id
        }
      }
    });

    if (!questMember) {
      return NextResponse.json(
        { error: "You must be a member of this quest to submit" },
        { status: 403 }
      );
    }

    // Check if task exists
    const task = await prisma.task.findUnique({
      where: {
        id: params.taskId,
        questId: params.questId
      },
      include: {
        submissions: {
          where: {
            userId: session.user.id
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Check if user has already submitted
    if (task.submissions.length > 0) {
      return NextResponse.json(
        { error: "You have already submitted to this task" },
        { status: 400 }
      );
    }

    // Check if task is still accepting submissions
    const approvedSubmissions = await prisma.submission.count({
      where: {
        taskId: params.taskId,
        status: "approved"
      }
    });

    if (approvedSubmissions >= task.maxCompletions) {
      return NextResponse.json(
        { error: "Task has reached maximum completions" },
        { status: 400 }
      );
    }

    const { content } = await req.json();

    // Create submission
    const submission = await prisma.submission.create({
      data: {
        taskId: params.taskId,
        userId: session.user.id,
        content: content,
        status: "pending"
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        task: {
          select: {
            id: true,
            name: true,
            questId: true
          }
        }
      }
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

// GET /api/quests/[questId]/tasks/[taskId]/submissions
export async function GET(
  req: Request,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a member or reviewer or quest creator
    const [questMember, taskReviewer, quest] = await Promise.all([
      prisma.questMember.findUnique({
        where: {
          questId_userId: {
            questId: params.questId,
            userId: session.user.id
          }
        }
      }),
      prisma.taskReviewer.findFirst({
        where: {
          taskId: params.taskId,
          userId: session.user.id
        }
      }),
      prisma.quest.findUnique({
        where: { id: params.questId },
        select: { creatorId: true }
      })
    ]);

    const isQuestCreator = quest?.creatorId === session.user.id;

    if (!questMember && !taskReviewer && !isQuestCreator) {
      return NextResponse.json(
        { error: "You must be a member, reviewer, or quest creator to view submissions" },
        { status: 403 }
      );
    }

    const submissions = await prisma.submission.findMany({
      where: {
        taskId: params.taskId
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        reviewer: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        task: {
          select: {
            id: true,
            name: true,
            questId: true,
            config: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Parse and format submissions
    const parsedSubmissions = submissions.map(submission => {
      const taskConfig = submission.task.config ? JSON.parse(submission.task.config) : {};
      const submissionContent = submission.content ? JSON.parse(submission.content) : {};

      return {
        id: submission.id,
        content: formatSubmissionContent(submissionContent, taskConfig.taskType),
        status: submission.status,
        createdAt: submission.createdAt,
        reviewedAt: submission.reviewedAt,
        reviewComment: submission.reviewComment,
        user: submission.user,
        reviewer: submission.reviewer,
        task: {
          ...submission.task,
          config: taskConfig
        }
      };
    });

    return NextResponse.json(parsedSubmissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

// PUT /api/quests/[questId]/tasks/[taskId]/submissions/[submissionId]
export async function PUT(
  req: Request,
  { params }: { params: { questId: string; taskId: string; submissionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a reviewer or quest creator
    const [taskReviewer, quest] = await Promise.all([
      prisma.taskReviewer.findFirst({
        where: {
          taskId: params.taskId,
          userId: session.user.id
        }
      }),
      prisma.quest.findUnique({
        where: { id: params.questId },
        select: { creatorId: true }
      })
    ]);

    const isReviewer = !!taskReviewer;
    const isQuestCreator = quest?.creatorId === session.user.id;

    if (!isReviewer && !isQuestCreator) {
      return NextResponse.json(
        { error: "Only reviewers and quest creators can review submissions" },
        { status: 403 }
      );
    }

    const { status, reviewComment } = await req.json();

    // Update submission
    const submission = await prisma.submission.update({
      where: {
        id: params.submissionId,
        taskId: params.taskId
      },
      data: {
        status,
        reviewComment,
        reviewerId: session.user.id,
        reviewedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        reviewer: {
          select: {
            id: true,
            nickname: true,
            avatar: true
          }
        },
        task: {
          select: {
            id: true,
            name: true,
            questId: true,
            config: true
          }
        }
      }
    });

    // Parse submission content based on task type
    const taskConfig = submission.task.config ? JSON.parse(submission.task.config) : {};
    const submissionContent = submission.content ? JSON.parse(submission.content) : {};

    // Format submission content based on task type
    const formattedContent = formatSubmissionContent(submissionContent, taskConfig.taskType);

    return NextResponse.json({
      ...submission,
      content: formattedContent,
      task: {
        ...submission.task,
        config: taskConfig
      }
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

// Helper function to format submission content based on task type
function formatSubmissionContent(content: any, taskTypes: string[]) {
  if (!content || !taskTypes) return content;

  const formatted: any = {};

  taskTypes.forEach(type => {
    switch (type) {
      case 'text':
        formatted.text = content.text;
        break;
      case 'image':
        formatted.image = content.image;
        break;
      case 'github':
        formatted.github = {
          url: content.github,
          // Add any additional GitHub-specific formatting
        };
        break;
      case 'contract':
        formatted.contract = {
          address: content.contract,
          network: content.contractNetwork,
          // Add any additional contract-specific formatting
        };
        break;
      case 'social_twitter':
        formatted.twitter = {
          postUrl: content.xPost,
          username: content.xUserName,
          followStatus: content.xFollow,
          retweetStatus: content.xRetweet,
          likeStatus: content.xLike,
        };
        break;
      case 'social_discord':
        formatted.discord = {
          username: content.discordUserName,
          serverId: content.discordId,
          joinStatus: content.discordJoined,
          joinedAt: content.discordJoinedAt,
        };
        break;
      default:
        // For unknown task types, just pass through the content
        formatted[type] = content[type];
    }
  });

  return formatted;
}