import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function QuestCardSkeleton() {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-primary/20">
      <CardHeader>
        <Skeleton className="w-full h-48 rounded-t-lg" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16 mt-1" />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}