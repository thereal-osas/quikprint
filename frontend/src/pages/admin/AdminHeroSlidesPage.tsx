import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Pencil, Trash2, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAdminHeroSlides,
  useCreateHeroSlide,
  useUpdateHeroSlide,
  useDeleteHeroSlide,
} from '@/hooks/useApi';
import { filesApi } from '@/services/api';
import type { HeroSlideResponse, CreateHeroSlideRequest, UpdateHeroSlideRequest } from '@/services/api';
import { getImageUrl } from '@/lib/utils';

interface FormData {
  heading: string;
  subheading: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
  isActive: boolean;
  displayOrder: number;
}

const initialFormData: FormData = {
  heading: '',
  subheading: '',
  imageUrl: '',
  ctaText: '',
  ctaLink: '',
  isActive: true,
  displayOrder: 0,
};

export default function AdminHeroSlidesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HeroSlideResponse | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isUploading, setIsUploading] = useState(false);

  const { data: slides, isLoading } = useAdminHeroSlides();
  const createMutation = useCreateHeroSlide();
  const updateMutation = useUpdateHeroSlide();
  const deleteMutation = useDeleteHeroSlide();

  const openCreate = () => {
    setEditingSlide(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const openEdit = (slide: HeroSlideResponse) => {
    setEditingSlide(slide);
    setFormData({
      heading: slide.heading,
      subheading: slide.subheading || '',
      imageUrl: slide.imageUrl,
      ctaText: slide.ctaText || '',
      ctaLink: slide.ctaLink || '',
      isActive: slide.isActive,
      displayOrder: slide.displayOrder,
    });
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await filesApi.upload(file);
      // Use the fileUrl returned from the API (e.g. /uploads/...)
      const imageUrl = response.fileUrl;
      setFormData(prev => ({ ...prev, imageUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingSlide) {
        const updateData: UpdateHeroSlideRequest = {
          heading: formData.heading,
          subheading: formData.subheading || undefined,
          imageUrl: formData.imageUrl,
          ctaText: formData.ctaText || undefined,
          ctaLink: formData.ctaLink || undefined,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await updateMutation.mutateAsync({ id: editingSlide.id, data: updateData });
        toast.success('Hero slide updated');
      } else {
        const createData: CreateHeroSlideRequest = {
          heading: formData.heading,
          subheading: formData.subheading || undefined,
          imageUrl: formData.imageUrl,
          ctaText: formData.ctaText || undefined,
          ctaLink: formData.ctaLink || undefined,
          isActive: formData.isActive,
          displayOrder: formData.displayOrder,
        };
        await createMutation.mutateAsync(createData);
        toast.success('Hero slide created');
      }
      setIsDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save hero slide');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero slide?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Hero slide deleted');
    } catch (error) {
      toast.error('Failed to delete hero slide');
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hero Slides</h1>
            <p className="text-muted-foreground">Manage the homepage hero carousel</p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Add Hero Slide
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
                  <TableHead>Image</TableHead>
                  <TableHead>Heading</TableHead>
                  <TableHead>CTA</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides?.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>{slide.displayOrder}</TableCell>
                    <TableCell>
                      <div className="w-16 h-10 bg-muted rounded overflow-hidden">
                        <img
                          src={getImageUrl(slide.imageUrl)}
                          alt={slide.heading}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{slide.heading}</TableCell>
                    <TableCell>{slide.ctaText || '-'}</TableCell>
                    <TableCell>
                      <span className={slide.isActive ? 'text-green-600' : 'text-red-600'}>
                        {slide.isActive ? 'Yes' : 'No'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(slide)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(slide.id)}>
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Edit Hero Slide' : 'Add Hero Slide'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="heading">Heading *</Label>
                <Input
                  id="heading"
                  value={formData.heading}
                  onChange={(e) => setFormData(prev => ({ ...prev, heading: e.target.value }))}
                  placeholder="Premium Print Solutions"
                  required
                />
              </div>
              <div>
                <Label htmlFor="subheading">Subheading</Label>
                <Textarea
                  id="subheading"
                  value={formData.subheading}
                  onChange={(e) => setFormData(prev => ({ ...prev, subheading: e.target.value }))}
                  placeholder="From business cards to large format banners..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Hero Image *</Label>
                <div className="flex items-center gap-4 mt-2">
                  {formData.imageUrl ? (
                    <div className="w-32 h-20 bg-muted rounded overflow-hidden">
                      <img src={getImageUrl(formData.imageUrl)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <Label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted">
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ctaText">Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaText: e.target.value }))}
                    placeholder="Shop Now"
                  />
                </div>
                <div>
                  <Label htmlFor="ctaLink">Button Link</Label>
                  <Input
                    id="ctaLink"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, ctaLink: e.target.value }))}
                    placeholder="/products"
                  />
                </div>
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
                <Button type="submit" disabled={isPending || !formData.imageUrl}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingSlide ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
}

