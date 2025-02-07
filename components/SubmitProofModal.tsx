"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TaskConfig, SubmitProofParams, SubmissionProof } from '@/types/quest';
import {
  SiGithub,
  SiX,
  SiDiscord,
  SiEthereum,
} from '@icons-pack/react-simple-icons';
import { useUserStore } from '@/store/userStore';
import ImageUpload from "@/components/ImageUpload";
import { useSession } from "next-auth/react";

interface SubmitProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskConfig: TaskConfig;
  onSubmit: (data: SubmissionProof) => Promise<{ error?: string; hash?: `0x${string}` }>;
  onConfirmed: () => void;
}

export default function SubmitProofModal({
  isOpen,
  onClose,
  taskConfig,
  onSubmit,
  onConfirmed,
}: SubmitProofModalProps) {
  const { data: session } = useSession();
  const [proofData, setProofData] = useState<SubmissionProof>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTextChange = (value: string) => {
    setProofData(prev => ({
      ...prev,
      text: value
    }));
  };

  const handleGithubChange = (value: string) => {
    setProofData(prev => ({
      ...prev,
      github: value
    }));
  };

  const handleContractChange = (value: string) => {
    setProofData(prev => ({
      ...prev,
      contract: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmit(proofData);
      if (result.error) {
        setError(result.error);
      } else {
        onConfirmed();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProofFields = () => {
    const fields = [];

    // Text proof field (always available)
    fields.push(
      <div key="text">
        <label className="block text-sm font-medium mb-2">
          Description
        </label>
        <Textarea
          value={proofData.text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Describe your work..."
          className="min-h-[100px]"
        />
      </div>
    );

    // GitHub proof field
    if (taskConfig.taskType.includes('github')) {
      fields.push(
        <div key="github">
          <label className="block text-sm font-medium mb-2">
            GitHub PR/Issue URL
          </label>
          <Input
            value={proofData.github || ''}
            onChange={(e) => handleGithubChange(e.target.value)}
            placeholder="https://github.com/..."
          />
        </div>
      );
    }

    // Contract interaction proof field
    if (taskConfig.taskType.includes('contract')) {
      fields.push(
        <div key="contract">
          <label className="block text-sm font-medium mb-2">
            Transaction Hash
          </label>
          <Input
            value={proofData.contract || ''}
            onChange={(e) => handleContractChange(e.target.value)}
            placeholder="0x..."
          />
        </div>
      );
    }

    return fields;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Task Proof</DialogTitle>
          <DialogDescription>
            Please provide the required proof for task completion
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderProofFields()}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}