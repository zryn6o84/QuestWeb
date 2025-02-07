// components/MemberSubmissionTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Eye, Circle, CheckCircle, ExternalLink, User2 } from "lucide-react";
import {
  BoardDetailView,
  TaskView,
  SubmissionView,
  Submission,
} from "@/types/types";
import { Address } from "./ui/Address";
import { useState } from "react";
import SubmissionDetailsModal from "./SubmissionDetailsModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MemberSubmissionTableProps {
  questId: string;
  tasks: TaskView[];
  submissions: SubmissionView[];
  userProfiles: Record<string, { nickname: string; avatar: string; }>;
  onRefresh: () => void;
}

export default function MemberSubmissionTable({
  questId,
  tasks,
  submissions,
  userProfiles,
  onRefresh,
}: MemberSubmissionTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionView | null>(null);
  const [isSubmissionDetailsModalOpen, setIsSubmissionDetailsModalOpen] = useState(false);

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    return task?.name || "Unknown Task";
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
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <>
      {/* Legend */}
      <div className="glass-card mb-6 p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-yellow-400/80" />
            <span>Not Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-400/80" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500/80" />
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <X className="h-4 w-4 text-red-400/80" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-400/80" />
            <span>Need Review</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Task</th>
              <th className="text-left p-2">Submitter</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Submitted At</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-b">
                <td className="p-2">{getTaskName(submission.taskId)}</td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfiles[submission.userId]?.avatar} />
                      <AvatarFallback>
                        {userProfiles[submission.userId]?.nickname?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{userProfiles[submission.userId]?.nickname || "Anonymous"}</span>
                  </div>
                </td>
                <td className="p-2">{getStatusBadge(submission.status)}</td>
                <td className="p-2">{format(new Date(submission.createdAt), "PPp")}</td>
                <td className="p-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedSubmission(submission);
                      setIsSubmissionDetailsModalOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSubmission && (
        <SubmissionDetailsModal
          isOpen={isSubmissionDetailsModalOpen}
          onClose={() => {
            setIsSubmissionDetailsModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
          onConfirmed={onRefresh}
        />
      )}
    </>
  );
}
