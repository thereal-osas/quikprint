import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/useApi';
import type { AnnouncementResponse, CreateAnnouncementRequest, UpdateAnnouncementRequest } from '@/services/api';

interface FormData {
  text: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
}

const initialFormData: FormData = {
  text: '',
  linkUrl: '',
  isActive: true,
  displayOrder: 0,
};

export default function AdminAnnouncementsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  const { data: announcements, isLoading } = useAdminAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const openCreate = () => {
    setEditingAnnouncement(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEdit = (announcement: AnnouncementResponse) => {
    setEditingAnnouncement(announcement);
    setFormData({
      text: announcement.text,
      linkUrl: announcement.linkUrl || '',
      isActive: announcement.isActive,
      displayOrder: announcement.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        const updateData: UpdateAnnouncementRequest = {
          text: formData.text,
          linkUrl: formData.linkUrl || undefined,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await updateMutation.mutateAsync({ id: editingAnnouncement.id, data: updateData });
        toast.success('Announcement updated successfully');
      } else {
        const createData: CreateAnnouncementRequest = {
          text: formData.text,
          linkUrl: formData.linkUrl || undefined,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await createMutation.mutateAsync(createData);
        toast.success('Announcement created successfully');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save announcement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Announcement deleted');
    } catch (error) {
      toast.error('Failed to delete announcement');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Manage the announcement banner carousel</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Announcement
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Text</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements?.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell>{announcement.displayOrder}</TableCell>
                    <TableCell className="max-w-xs truncate">{announcement.text}</TableCell>
                    <TableCell>
                      {announcement.linkUrl && (
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={announcement.isActive ? 'text-green-600' : 'text-red-600'}>
                        {announcement.isActive ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(announcement)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(announcement.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement ? 'Edit Announcement' : 'Add Announcement'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="text">Announcement Text *</Label>
                <Input
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                  placeholder="Free shipping on orders over ₦50,000"
                  required
                />
              </div>
              <div>
                <Label htmlFor="linkUrl">Link URL (optional)</Label>
                <Input
                  id="linkUrl"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
                  placeholder="/products"
                />
              </div>
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}

