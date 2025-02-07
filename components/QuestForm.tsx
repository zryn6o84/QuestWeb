import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { Quest } from "@/types/quest";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  img: z.string().min(1, "Image is required"),
  config: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Allow empty string
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    }, "Invalid JSON"),
});

type FormData = z.infer<typeof formSchema>;

interface QuestFormProps {
  mode: "create" | "update";
  onSubmit: (data: Partial<Quest>) => Promise<any>;
  initialData?: {
    name?: string;
    description?: string;
    img?: string;
    config?: any;
  };
  isDialog?: boolean;
  redirectPath?: string;
}

export default function QuestForm({
  mode,
  onSubmit,
  initialData,
  isDialog = false,
  redirectPath = "/quests",
}: QuestFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      img: "",
      config: "{}",
    },
  });

  const onSubmitForm = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(data);
      if (result) {
        toast({
          title: "Success",
          description: `Quest ${mode === "create" ? "created" : "updated"} successfully`,
        });
        if (!isDialog) {
          router.push(redirectPath);
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="p-6 border rounded-lg shadow-md space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Quest Image</label>
          <div className="max-w-[250px]">
            <ImageUpload
              value={watch("img")}
              onChange={(url) => setValue("img", url, { shouldValidate: false })}
              label="Quest Image"
            />
          </div>
          {errors.img && (
            <p className="text-sm text-destructive mt-1">{errors.img.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Quest Name</label>
          <Input
            {...register("name")}
            placeholder="Enter quest name"
            className="glass-input"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <Textarea
            {...register("description")}
            placeholder="Enter quest description"
            className="glass-input"
          />
          {errors.description && (
            <p className="text-sm text-destructive mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        <div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        {!isDialog && (
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/quests")}
            className="glass-button-secondary"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="neon-button-primary"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Updating..."}
            </>
          ) : (
            mode === "create" ? "Create Quest" : "Update Quest"
          )}
        </Button>
      </div>
    </form>
  );
}