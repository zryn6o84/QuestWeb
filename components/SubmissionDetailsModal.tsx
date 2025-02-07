import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { SubmissionView, TaskConfig } from "@/types/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Github, Twitter, MessageSquare } from "lucide-react";
import Image from "next/image";

export interface SubmissionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: SubmissionView;
  onConfirmed: () => void;
  isReviewer: boolean;
}

export default function SubmissionDetailsModal({
  isOpen,
  onClose,
  submission,
  onConfirmed,
  isReviewer,
}: SubmissionDetailsModalProps) {
  const [reviewComment, setReviewComment] = useState(submission.reviewComment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReview = async (newStatus: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/quests/${submission.task.questId}/tasks/${submission.task.id}/submissions/${submission.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          reviewComment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to review submission");
      }

      onConfirmed();
      onClose();
    } catch (error) {
      console.error("Error reviewing submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "approved":
        return <Badge variant="success">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderSubmissionContent = (content: string, taskConfig: string) => {
    try {
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      const parsedConfig = typeof taskConfig === 'string' ? JSON.parse(taskConfig) : taskConfig;

      if (!parsedContent || !parsedConfig.taskType) return null;

      console.log(parsedConfig);
      console.log(parsedContent);
      console.log(parsedContent.text);

      return (
        <div className="space-y-4">
          {parsedConfig.taskType.map((type: string, index: number) => {
            switch (type) {
              case 'text':
                return parsedContent.text && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Text Submission</h4>
                    <p className="whitespace-pre-wrap bg-muted p-3 rounded-md">
                      {parsedContent.text}
                    </p>
                  </div>
                );

              case 'image':
                return parsedContent.image && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Image Submission</h4>
                    <div className="relative h-48 w-full">
                      <Image
                        src={parsedContent.image}
                        alt="Submission"
                        fill
                        className="object-contain rounded-md"
                      />
                    </div>
                  </div>
                );

              case 'github':
                return parsedContent.github?.url && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">GitHub Submission</h4>
                    <a
                      href={parsedContent.github.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-500 hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      {parsedContent.github.url}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                );

              case 'contract':
                return parsedContent.contract && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Contract Interaction</h4>
                    <div className="bg-muted p-3 rounded-md">
                      <p>Network: {parsedContent.contract.network}</p>
                      <p className="font-mono">Address: {parsedContent.contract.address}</p>
                    </div>
                  </div>
                );

              case 'social_twitter':
                return parsedContent.twitter && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Twitter Tasks</h4>
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <Twitter className="h-4 w-4" />
                        <span>@{parsedContent.twitter.username}</span>
                      </div>
                      {parsedContent.twitter.postUrl && (
                        <a
                          href={parsedContent.twitter.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-500 hover:underline"
                        >
                          View Post <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <div className="flex gap-4">
                        {parsedContent.twitter.followStatus && <Badge>Followed</Badge>}
                        {parsedContent.twitter.likeStatus && <Badge>Liked</Badge>}
                        {parsedContent.twitter.retweetStatus && <Badge>Retweeted</Badge>}
                      </div>
                    </div>
                  </div>
                );

              case 'social_discord':
                return parsedContent.discord && (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium">Discord Tasks</h4>
                    <div className="bg-muted p-3 rounded-md space-y-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span>{parsedContent.discord.username}</span>
                      </div>
                      <p>Server ID: {parsedContent.discord.serverId}</p>
                      {parsedContent.discord.joinStatus && (
                        <div>
                          <Badge>Joined Server</Badge>
                          {parsedContent.discord.joinedAt && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Joined at: {format(new Date(parsedContent.discord.joinedAt), "PPp")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      );
    } catch (error) {
      console.error('Error parsing submission content or config:', error);
      return (
        <div className="text-red-500">
          Error parsing submission content
        </div>
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Submission Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Task</h4>
              <p>{submission.task.name}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Status</h4>
              {getStatusBadge(submission.status)}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Submitted By</h4>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={submission.user.avatar || undefined} />
                <AvatarFallback>
                  {submission.user.nickname?.slice(0, 2).toUpperCase() || "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{submission.user.nickname || "Anonymous"}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(submission.createdAt), "PPp")}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Submission Content</h4>
            {renderSubmissionContent(submission.content, submission.task.config)}
          </div>

          {submission.reviewerId && (
            <div>
              <h4 className="font-medium mb-2">Reviewed By</h4>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src={submission.reviewer?.avatar || undefined} />
                  <AvatarFallback>
                    {submission.reviewer?.nickname?.slice(0, 2).toUpperCase() || "??"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p>{submission.reviewer?.nickname || "Anonymous"}</p>
                  {submission.reviewedAt && (
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(submission.reviewedAt), "PPp")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <h4 className="font-medium mb-2">Review Comment</h4>
            <Textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add a review comment..."
              className="min-h-[100px]"
              disabled={!isReviewer}
            />
          </div>

          {isReviewer && submission.status === "pending" && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleReview("rejected")}
                disabled={isSubmitting}
              >
                Reject
              </Button>
              <Button
                onClick={() => handleReview("approved")}
                disabled={isSubmitting}
              >
                Approve
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}