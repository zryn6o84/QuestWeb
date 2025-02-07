import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface AddReviewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emails: string[]) => Promise<void>;
}

export default function AddReviewerModal({
  isOpen,
  onClose,
  onSubmit,
}: AddReviewerModalProps) {
  const [emails, setEmails] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddEmail = () => {
    setEmails([...emails, ""]);
  };

  const handleRemoveEmail = (index: number) => {
    const newEmails = emails.filter((_, i) => i !== index);
    setEmails(newEmails);
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async () => {
    const validEmails = emails.filter(email => email.trim() !== "");
    if (validEmails.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit(validEmails);
      onClose();
    } catch (error) {
      console.error("Failed to add reviewers:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Reviewers</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {emails.map((email, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type="email"
                placeholder="reviewer@example.com"
                value={email}
                onChange={(e) => handleEmailChange(index, e.target.value)}
              />
              {emails.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveEmail(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleAddEmail}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Another Email
          </Button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Reviewers"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}