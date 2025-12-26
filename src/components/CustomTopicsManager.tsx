import { useState, useEffect } from 'react';
import { Plus, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  CustomTopic, 
  loadCustomTopics, 
  addCustomTopic, 
  deleteCustomTopic 
} from '@/lib/api/customTopics';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CustomTopicsManagerProps {
  appId?: string;
  onTopicsChange?: () => void;
}

export function CustomTopicsManager({ appId, onTopicsChange }: CustomTopicsManagerProps) {
  const [topics, setTopics] = useState<CustomTopic[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newCategory, setNewCategory] = useState<'issue' | 'request' | 'feedback'>('issue');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTopics();
  }, [appId]);

  const loadTopics = async () => {
    const data = await loadCustomTopics(appId);
    setTopics(data);
  };

  const handleAdd = async () => {
    if (!newTopic.trim()) return;
    
    setIsLoading(true);
    const result = await addCustomTopic(newTopic, newCategory, appId);
    setIsLoading(false);

    if (result) {
      setTopics([result, ...topics]);
      setNewTopic('');
      onTopicsChange?.();
      toast({
        title: 'Topic Added',
        description: `"${newTopic}" has been added as a custom topic.`,
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to add custom topic.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const success = await deleteCustomTopic(id);
    if (success) {
      setTopics(topics.filter(t => t.id !== id));
      onTopicsChange?.();
      toast({
        title: 'Topic Removed',
        description: `"${name}" has been removed.`,
      });
    }
  };

  const categoryColors = {
    issue: 'bg-danger/20 text-danger border-danger/30',
    request: 'bg-warning/20 text-warning border-warning/30',
    feedback: 'bg-success/20 text-success border-success/30',
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="glass" size="sm">
          <Tag className="h-4 w-4 mr-2" />
          Custom Topics ({topics.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Manage Custom Topics</DialogTitle>
          <DialogDescription>
            Add your own seed topics to improve analysis accuracy. These will be 
            used in addition to the default topics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Add new topic */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter topic name..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="flex-1"
            />
            <Select value={newCategory} onValueChange={(v) => setNewCategory(v as any)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="request">Request</SelectItem>
                <SelectItem value="feedback">Feedback</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={isLoading || !newTopic.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Topics list */}
          <div className="max-h-[300px] overflow-y-auto space-y-2">
            {topics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No custom topics yet. Add some above!
              </p>
            ) : (
              topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={cn('text-[10px] uppercase', categoryColors[topic.category])}
                    >
                      {topic.category}
                    </Badge>
                    <span className="text-sm">{topic.topic}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(topic.id, topic.topic)}
                    className="h-8 w-8 text-muted-foreground hover:text-danger"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
